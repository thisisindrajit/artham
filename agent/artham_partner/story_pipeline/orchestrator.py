"""Dynamic Google ADK orchestration for the complete generation pipeline."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from collections import Counter
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from difflib import SequenceMatcher
from json import JSONDecodeError
from typing import Any, TypeVar

from google.adk.agents import Context, LlmAgent
from google.adk.models.google_llm import _ResourceExhaustedError
from pydantic import BaseModel, TypeAdapter, ValidationError

from .agents import build_reasoning_agents
from .constants import (
    DEFAULT_MAX_REPAIR_CYCLES,
    MAX_LEARNING_REFERENCES,
    MIN_LEARNER_QUALITY_SCORE,
    RATE_LIMIT_RETRY_DELAY_SECONDS,
)
from .contracts import (
    ActivityPlan,
    ActivitySpec,
    AudioRequest,
    AssetReference,
    Difficulty,
    EmbeddingRecord,
    EngagementProfile,
    GeneratedStoryBundle,
    ImageRequest,
    MediaPlan,
    OpenLearningImage,
    PersistenceReceipt,
    ResearchCorpus,
    RepairComponent,
    RepairResult,
    SceneDraft,
    SceneLearningReference,
    ScenePrimer,
    SceneSpec,
    SelectedTopic,
    SourceEvidence,
    StoryGenerationRequest,
    StoryGenerationResult,
    StoryBlueprint,
    StorylineDraft,
    TopicCandidates,
    TopicCandidate,
    ValidationReport,
    ValidationSeverity,
    VideoDecision,
)
from .errors import ValidationFailure
from .nodes import build_provider_nodes
from .runtime import PipelineRuntime
from .validation import (
    bounded_release_report,
    bundle_for_semantic_validation,
    deterministic_issues,
    merge_validation_reports,
    normalize_simulation_readouts,
    salvaged_release,
)

ProgressCallback = Callable[[str, float], Awaitable[None]]
logger = logging.getLogger(__name__)
TModel = TypeVar("TModel", bound=BaseModel)
_PAYLOAD_ADAPTER = TypeAdapter(dict[str, Any])
_STORY_IMAGE_STYLE = (
    "Polished stylized 3D digital storybook illustration; medium-wide eye-level "
    "cinematic framing; tactile materials; softly rounded, expressive adult "
    "characters; clean readable silhouettes; dimensional environments; a distinctive "
    "story-specific palette, natural setting-appropriate light, and subtle atmospheric "
    "depth. Premium editorial finish, not photorealistic, anime, flat vector art, "
    "childish cartoon, movie poster, montage, or collage."
)


async def _no_progress(stage: str, progress: float) -> None:
    return None


def _encode_payload(payload: dict[str, Any]) -> str:
    return _PAYLOAD_ADAPTER.dump_json(payload).decode("utf-8")


def _request_context(request: StoryGenerationRequest) -> dict[str, Any]:
    """Keep internal agents focused on story constraints, not job metadata."""
    payload = request.model_dump(mode="json")
    return {
        key: payload[key]
        for key in (
            "target_age",
            "duration_minutes",
            "difficulty",
            "preferred_subjects",
            "excluded_topics",
            "locale",
            "story_brief",
        )
        if key in payload
    }


def _is_resource_exhausted(exc: Exception) -> bool:
    if isinstance(exc, _ResourceExhaustedError):
        return True
    return (
        type(exc).__name__ == "_ResourceExhaustedError"
        and "RESOURCE_EXHAUSTED" in str(exc).upper()
    )


class StoryOrchestrator:
    def __init__(
        self,
        runtime: PipelineRuntime,
        progress: ProgressCallback | None = None,
    ) -> None:
        self._runtime = runtime
        self._progress = progress or _no_progress
        self._agents = build_reasoning_agents(runtime.settings)
        self._nodes = build_provider_nodes(runtime)
        self._strong_llm_semaphore = asyncio.Semaphore(1)
        self._worker_llm_semaphore = asyncio.Semaphore(1)
        self._llm_pacing_lock = asyncio.Lock()
        self._last_llm_request_at = 0.0

    async def generate(
        self,
        *,
        ctx: Context,
        request: StoryGenerationRequest,
        job_id: str,
    ) -> StoryGenerationResult:
        self._runtime.settings.validate_for_generation()
        request = request.model_copy(
            update={
                "media_budget": request.media_budget.model_copy(
                    update={
                        "video": request.media_budget.video.model_copy(
                            update={
                                "enabled": False,
                                "max_clips": 0,
                                "max_total_seconds": 0,
                            }
                        ),
                    }
                )
            }
        )
        checkpoint = self._runtime.checkpoints.setdefault(job_id, {})
        cached_bundle = checkpoint.get("validated_bundle")
        cached_report = checkpoint.get("validation_report")
        if isinstance(cached_bundle, dict) and isinstance(cached_report, dict):
            return await self._persist(
                ctx=ctx,
                request=request,
                job_id=job_id,
                bundle=GeneratedStoryBundle.model_validate(cached_bundle),
                report=ValidationReport.model_validate(cached_report),
                repair_cycles=int(checkpoint.get("repair_cycles", 0)),
            )
        cached_corpus = checkpoint.get("corpus")
        cached_engagement = checkpoint.get("engagement")
        if isinstance(cached_corpus, dict) and isinstance(
            cached_engagement, dict
        ):
            await self._progress("resuming_after_research", 0.20)
            corpus = ResearchCorpus.model_validate(cached_corpus)
            engagement_raw = cached_engagement
        else:
            await self._progress("researching_topics", 0.05)
            if request.preferred_subjects:
                corpus_raw = await ctx.run_node(
                    self._nodes["research"],
                    request.model_dump(mode="json"),
                    use_sub_branch=True,
                )
                engagement_raw = EngagementProfile(
                    learner_id=request.learner_id,
                    stories=[],
                    generated_at=datetime.now(UTC),
                ).model_dump(mode="json")
            else:
                engagement_result, corpus_result = await asyncio.gather(
                    (
                        asyncio.sleep(0, result=cached_engagement)
                        if isinstance(cached_engagement, dict)
                        else ctx.run_node(
                            self._nodes["engagement"],
                            request.model_dump(mode="json"),
                            use_sub_branch=True,
                        )
                    ),
                    (
                        asyncio.sleep(0, result=cached_corpus)
                        if isinstance(cached_corpus, dict)
                        else ctx.run_node(
                            self._nodes["research"],
                            request.model_dump(mode="json"),
                            use_sub_branch=True,
                        )
                    ),
                    return_exceptions=True,
                )
                if not isinstance(engagement_result, BaseException):
                    checkpoint["engagement"] = engagement_result
                if not isinstance(corpus_result, BaseException):
                    corpus = ResearchCorpus.model_validate(corpus_result)
                    checkpoint["corpus"] = corpus.model_dump(mode="json")
                if isinstance(engagement_result, BaseException):
                    raise engagement_result
                if isinstance(corpus_result, BaseException):
                    raise corpus_result
                engagement_raw = engagement_result
                corpus_raw = corpus_result
            if request.preferred_subjects:
                corpus = ResearchCorpus.model_validate(corpus_raw)
                checkpoint["corpus"] = corpus.model_dump(mode="json")
                checkpoint["engagement"] = engagement_raw
            await self._save_checkpoint(ctx, checkpoint)

        cached_selected = checkpoint.get("selected_topic")
        if isinstance(cached_selected, dict):
            selected = SelectedTopic.model_validate(cached_selected)
        elif request.preferred_subjects:
            await self._progress("selecting_topic", 0.20)
            selected = self._select_requested_topic(request, corpus)
            checkpoint["selected_topic"] = selected.model_dump(mode="json")
            await self._save_checkpoint(ctx, checkpoint)
        else:
            await self._progress("selecting_topic", 0.20)
            selected = await self._run_llm(
                ctx,
                self._agents["topic_resolver"],
                {
                    "request": _request_context(request),
                    "engagement": engagement_raw,
                    "research": corpus.model_dump(mode="json"),
                },
                SelectedTopic,
            )
            selected = self._ground_selected_topic(selected, corpus)
            checkpoint["selected_topic"] = selected.model_dump(mode="json")
            await self._save_checkpoint(ctx, checkpoint)

        selected_sources = selected.candidate.source_evidence
        if not selected_sources:
            raise ValidationFailure("Selected topic has no grounded Exa sources")

        await self._progress("architecting_story", 0.28)
        cached_storyline = checkpoint.get("storyline")
        if isinstance(cached_storyline, dict):
            cached_storyline = _normalize_storyline_output(cached_storyline)
            storyline = StorylineDraft.model_validate(cached_storyline)
            storyline = self._without_learning_references(storyline)
            checkpoint["storyline"] = storyline.model_dump(mode="json")
        else:
            cached_blueprint = checkpoint.get("story_blueprint")
            if isinstance(cached_blueprint, dict):
                blueprint = StoryBlueprint.model_validate(
                    _normalize_blueprint_output(cached_blueprint)
                )
            else:
                blueprint = await self._run_llm(
                    ctx,
                    self._agents["architect"],
                    {
                    "request": _request_context(request),
                        "selected_topic": selected.model_dump(mode="json"),
                        "source_evidence": [
                            item.model_dump(mode="json")
                            for item in selected_sources
                        ],
                        "engagement": engagement_raw,
                    },
                    StoryBlueprint,
                )
                blueprint = blueprint.model_copy(
                    update={
                        "citations": list(selected_sources),
                        "subject": selected.candidate.subject,
                        "difficulty": (
                            request.difficulty
                            if request.difficulty is not Difficulty.ADAPTIVE
                            else blueprint.difficulty
                        ),
                    }
                )
                checkpoint["story_blueprint"] = blueprint.model_dump(mode="json")
                await self._save_checkpoint(ctx, checkpoint)

            await self._progress("writing_scene_chunks", 0.34)
            scene_cache = checkpoint.setdefault("scene_chunks", {})
            scene_progress_lock = asyncio.Lock()
            completed_scenes = 0

            async def generate_scene(spec: SceneSpec) -> tuple[str, Any]:
                nonlocal completed_scenes
                cached = scene_cache.get(spec.scene_id)
                if isinstance(cached, dict):
                    cached = {
                        **cached,
                        "primer": cached.get("primer") or [],
                        "hints": (
                            cached.get("hints") or None
                            if spec.interaction_slot is None
                            else cached.get("hints")
                        ),
                    }
                    return spec.scene_id, SceneDraft.model_validate(cached)
                try:
                    scene = await self._run_llm(
                        ctx,
                        self._agents["scene_worker"],
                        {
                            "request": _request_context(request),
                            "blueprint": blueprint.model_dump(
                                mode="json", exclude={"scenes"}
                            ),
                            "scene_spec": spec.model_dump(mode="json"),
                            "prior_learning_context": [
                                {
                                    "scene_id": item.scene_id,
                                    "learning_purpose": item.learning_purpose,
                                    "required_facts": item.required_facts,
                                }
                                for item in blueprint.scenes
                                if item.position < spec.position
                            ],
                            "adjacent_scene_specs": [
                                item.model_dump(mode="json")
                                for item in blueprint.scenes
                                if abs(item.position - spec.position) == 1
                            ],
                            "source_evidence": [
                                item.model_dump(mode="json")
                                for item in selected_sources
                            ],
                        },
                        SceneDraft,
                    )
                    scene = self._canonicalize_scene(scene, spec)
                    scene_cache[spec.scene_id] = scene.model_dump(mode="json")
                    await self._save_checkpoint(ctx, checkpoint)
                    async with scene_progress_lock:
                        completed_scenes += 1
                        await self._progress(
                            "writing_scene_chunks",
                            0.34
                            + 0.05
                            * (completed_scenes / len(blueprint.scenes)),
                        )
                    return spec.scene_id, scene
                except Exception as exc:
                    return spec.scene_id, exc

            scene_results = await asyncio.gather(
                *(generate_scene(spec) for spec in blueprint.scenes)
            )
            failed_scenes = [
                (scene_id, value)
                for scene_id, value in scene_results
                if isinstance(value, BaseException)
            ]
            if failed_scenes:
                scene_id, error = failed_scenes[0]
                raise ValidationFailure(
                    f"Scene chunk {scene_id} failed; completed sibling chunks were "
                    f"retained for resume: {error}"
                ) from error
            scene_by_id = dict(scene_results)
            storyline = self._assemble_storyline(
                blueprint,
                [scene_by_id[spec.scene_id] for spec in blueprint.scenes],
            )
            # "See the real thing" cards are paused; keep their provider path dormant.
            storyline = self._without_learning_references(storyline)
            storyline = self._dedupe_primers(storyline)
            checkpoint["storyline"] = storyline.model_dump(mode="json")
            await self._save_checkpoint(ctx, checkpoint)

        await self._progress("writing_activity_chunks", 0.40)
        cached_activities = checkpoint.get("activities")
        if isinstance(cached_activities, dict):
            activities = ActivityPlan.model_validate(cached_activities)
        else:
            activity_cache = checkpoint.setdefault("activity_chunks", {})
            activity_progress_lock = asyncio.Lock()
            completed_activities = 0

            async def generate_activity(scene: SceneDraft) -> tuple[str, Any]:
                nonlocal completed_activities
                cached = activity_cache.get(scene.scene_id)
                if isinstance(cached, dict):
                    return scene.scene_id, ActivitySpec.model_validate(cached)
                try:
                    activity = await self._run_llm(
                        ctx,
                        self._agents["activity_worker"],
                        {
                            "request": _request_context(request),
                            "story_context": {
                                "title": storyline.title,
                                "difficulty": storyline.difficulty,
                                "learning_objectives": storyline.learning_objectives,
                            },
                            "scene": scene.model_dump(mode="json"),
                        },
                        ActivitySpec,
                    )
                    activity = self._canonicalize_activity(activity, scene)
                    activity_cache[scene.scene_id] = activity.model_dump(mode="json")
                    await self._save_checkpoint(ctx, checkpoint)
                    async with activity_progress_lock:
                        completed_activities += 1
                        await self._progress(
                            "writing_activity_chunks",
                            0.40
                            + 0.06
                            * (
                                completed_activities
                                / max(len(interaction_scenes), 1)
                            ),
                        )
                    return scene.scene_id, activity
                except Exception as exc:
                    return scene.scene_id, exc

            interaction_scenes = [
                scene for scene in storyline.scenes
                if scene.interaction_slot is not None
            ]
            activity_results = await asyncio.gather(
                *(generate_activity(scene) for scene in interaction_scenes)
            )
            activity_by_scene = {
                scene_id: value
                for scene_id, value in activity_results
                if isinstance(value, ActivitySpec)
            }
            failed_activity_ids = {
                scene_id
                for scene_id, value in activity_results
                if isinstance(value, BaseException)
            }
            if failed_activity_ids:
                storyline = storyline.model_copy(
                    update={
                        "scenes": [
                            (
                                scene.model_copy(
                                    update={
                                        "interaction_slot": None,
                                        "hints": None,
                                        "scene_type": (
                                            "ending"
                                            if scene.scene_type == "ending"
                                            else "narrative"
                                        ),
                                    }
                                )
                                if scene.scene_id in failed_activity_ids
                                else scene
                            )
                            for scene in storyline.scenes
                        ]
                    }
                )
            activities = normalize_simulation_readouts(
                ActivityPlan(
                    activities=[
                        activity_by_scene[scene.scene_id]
                        for scene in storyline.scenes
                        if scene.scene_id in activity_by_scene
                    ]
                )
            )
            checkpoint["storyline"] = storyline.model_dump(mode="json")
            checkpoint["activities"] = activities.model_dump(mode="json")
            await self._save_checkpoint(ctx, checkpoint)

        cached_media_plan = checkpoint.get("media_plan")
        if isinstance(cached_media_plan, dict):
            media_plan = MediaPlan.model_validate(cached_media_plan)
        else:
            media_plan = self._ensure_image_coverage(
                self._fallback_media_plan(storyline, request),
                storyline,
                request,
            )
            checkpoint["media_plan"] = media_plan.model_dump(mode="json")
            await self._save_checkpoint(ctx, checkpoint)
        self._assert_media_budget(media_plan, request)
        video_decision = VideoDecision(
            approved=False,
            reason="Video generation is disabled to control story-generation cost.",
            approved_request=None,
        )

        await self._progress("generating_assets_and_activities", 0.48)
        story_embeddings = checkpoint.get("story_embeddings")
        activity_embeddings_raw = checkpoint.get("activity_embeddings")
        (
            image_assets,
            audio_assets,
            story_embeddings,
            activity_embeddings_raw,
        ) = await asyncio.gather(
            ctx.run_node(
                self._nodes["images"],
                {
                    "job_id": job_id,
                    "media_plan": media_plan.model_dump(mode="json"),
                },
                use_sub_branch=True,
            ),
            ctx.run_node(
                self._nodes["audio"],
                {
                    "job_id": job_id,
                    "media_plan": media_plan.model_dump(mode="json"),
                },
                use_sub_branch=True,
            ),
            (
                asyncio.sleep(0, result=story_embeddings)
                if isinstance(story_embeddings, list)
                else ctx.run_node(
                    self._nodes["story_embeddings"],
                    {
                        "mode": "story",
                        "selected_topic": selected.model_dump(mode="json"),
                        "storyline": storyline.model_dump(mode="json"),
                    },
                    use_sub_branch=True,
                )
            ),
            (
                asyncio.sleep(0, result=activity_embeddings_raw)
                if isinstance(activity_embeddings_raw, list)
                else ctx.run_node(
                    self._nodes["activity_embeddings"],
                    {
                        "mode": "activities",
                        "selected_topic": selected.model_dump(mode="json"),
                        "storyline": storyline.model_dump(mode="json"),
                        "activities": activities.model_dump(mode="json"),
                    },
                    use_sub_branch=True,
                )
            ),
        )
        checkpoint["story_embeddings"] = story_embeddings
        checkpoint["activity_embeddings"] = activity_embeddings_raw
        await self._save_checkpoint(ctx, checkpoint)
        self._assert_complete_assets(media_plan, image_assets, audio_assets)
        video_assets: list[AssetReference] = []
        media_plan = self._retain_generated_images(media_plan, image_assets)
        media_plan = self._retain_generated_audio(media_plan, audio_assets)
        assets = self._asset_groups(
            image_assets, video_assets, audio_assets
        )
        embeddings = self._embeddings(
            story_embeddings, activity_embeddings_raw
        )

        bundle = await self._collate(
            ctx=ctx,
            job_id=job_id,
            learner_id=request.learner_id,
            selected=selected,
            storyline=storyline,
            activities=activities,
            media_plan=media_plan,
            video_decision=video_decision,
            assets=assets,
            embeddings=embeddings,
        )

        repair_cycles = 0
        raw_report = await self._validate(ctx, bundle, request)
        report = bounded_release_report(
            raw_report,
            deterministic_issues(bundle, request),
        )

        while (
            repair_cycles < DEFAULT_MAX_REPAIR_CYCLES
            and self._needs_repair(raw_report)
        ):
            repair_cycles += 1
            await self._progress(
                f"improving_story_{repair_cycles}",
                0.72 + 0.08 * repair_cycles,
            )
            bundle = await self._repair_bundle(
                ctx=ctx,
                request=request,
                bundle=bundle,
                report=raw_report,
                repair_cycle=repair_cycles,
            )
            raw_report = await self._validate(ctx, bundle, request)
            report = bounded_release_report(
                raw_report,
                deterministic_issues(bundle, request),
            )

        if not report.is_valid:
            bundle, report = salvaged_release(bundle, request, report)
            if not report.is_valid:
                # Persistence is the durable release boundary. Keep the final
                # bundle available to learners while retaining every validation
                # finding as a warning for later review or repair.
                report = report.model_copy(
                    update={
                        "is_valid": True,
                        "issues": [
                            issue.model_copy(
                                update={"severity": ValidationSeverity.WARNING}
                            )
                            for issue in report.issues
                        ],
                    }
                )

        checkpoint["validated_bundle"] = bundle.model_dump(mode="json")
        checkpoint["validation_report"] = report.model_dump(mode="json")
        checkpoint["repair_cycles"] = repair_cycles
        await self._save_checkpoint(ctx, checkpoint)
        return await self._persist(
            ctx=ctx,
            request=request,
            job_id=job_id,
            bundle=bundle,
            report=report,
            repair_cycles=repair_cycles,
        )

    async def _persist(
        self,
        *,
        ctx: Context,
        request: StoryGenerationRequest,
        job_id: str,
        bundle: GeneratedStoryBundle,
        report: ValidationReport,
        repair_cycles: int,
    ) -> StoryGenerationResult:
        await self._progress("persisting_story", 0.95)
        receipt_raw = await ctx.run_node(
            self._nodes["persistence"],
            {
                "idempotency_key": request.idempotency_key,
                "bundle": bundle.model_dump(mode="json"),
                "validation": report.model_dump(mode="json"),
            },
            use_sub_branch=True,
        )
        result = StoryGenerationResult(
            job_id=job_id,
            receipt=PersistenceReceipt.model_validate(receipt_raw),
            validation=report,
            repair_cycles=repair_cycles,
        )
        await self._progress("completed", 1.0)
        return result

    async def _save_checkpoint(
        self,
        ctx: Context,
        checkpoint: dict[str, Any],
    ) -> None:
        snapshot = json.loads(json.dumps(checkpoint))
        await ctx.run_node(
            self._nodes["checkpoint"],
            {"checkpoint": snapshot},
        )

    async def _run_llm(
        self,
        ctx: Context,
        agent: LlmAgent,
        payload: dict[str, Any],
        output_model: type[TModel],
    ) -> TModel:
        current_payload = payload
        for attempt in range(2):
            try:
                is_worker = getattr(agent, "name", "") in {
                        "topic_resolver",
                        "scene_chunk_worker",
                        "activity_chunk_worker",
                    }
                semaphore_attr = (
                    "_worker_llm_semaphore"
                    if is_worker
                    else "_strong_llm_semaphore"
                )
                semaphore = getattr(self, semaphore_attr, None)
                if semaphore is None:
                    semaphore = asyncio.Semaphore(1)
                    setattr(self, semaphore_attr, semaphore)
                async with semaphore:
                    await self._wait_for_llm_slot()
                    raw = await ctx.run_node(
                        agent,
                        node_input=_encode_payload(current_payload),
                        use_sub_branch=True,
                    )
            except JSONDecodeError as exc:
                if attempt == 1:
                    raise
                current_payload = {
                    **payload,
                    "schema_correction": {
                        "instruction": (
                            "The previous response was malformed JSON. Regenerate "
                            "the complete response as valid structured output. Keep "
                            "all strings properly escaped and do not truncate."
                        ),
                        "validation_errors": [
                            {
                                "path": f"line {exc.lineno}, column {exc.colno}",
                                "message": exc.msg,
                                "type": "json_decode_error",
                            }
                        ],
                    },
                }
                continue
            except Exception as exc:
                if not _is_resource_exhausted(exc) or attempt == 1:
                    raise
                await asyncio.sleep(RATE_LIMIT_RETRY_DELAY_SECONDS)
                continue
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except JSONDecodeError as exc:
                    if attempt == 1:
                        raise
                    current_payload = {
                        **payload,
                        "schema_correction": {
                            "instruction": (
                                "The previous response was malformed JSON. "
                                "Regenerate the complete response as one valid JSON "
                                "object with properly escaped, untruncated strings."
                            ),
                            "validation_errors": [
                                {
                                    "path": (
                                        f"line {exc.lineno}, column {exc.colno}"
                                    ),
                                    "message": exc.msg,
                                    "type": "json_decode_error",
                                }
                            ],
                        },
                    }
                    continue
            if output_model is StorylineDraft:
                raw = _normalize_storyline_output(raw)
            if output_model is StoryBlueprint:
                raw = _normalize_blueprint_output(raw)
            if output_model is SceneDraft and isinstance(raw, dict):
                raw = _normalize_storyline_output({"scenes": [raw]})[
                    "scenes"
                ][0]
            if output_model in (ActivityPlan, ActivitySpec):
                raw = _normalize_activity_output(raw)
            if output_model is MediaPlan:
                raw = _normalize_media_output(raw)
            if output_model is ValidationReport:
                raw = _normalize_validation_output(raw)
            if output_model is RepairResult and isinstance(raw, dict):
                storyline = raw.get("storyline")
                activities = raw.get("activities")
                media_plan = raw.get("media_plan")
                if isinstance(storyline, dict):
                    raw["storyline"] = _normalize_storyline_output(storyline)
                if isinstance(activities, dict):
                    raw["activities"] = _normalize_activity_output(activities)
                if isinstance(media_plan, dict):
                    raw["media_plan"] = _normalize_media_output(media_plan)
            try:
                return output_model.model_validate(raw, extra="ignore")
            except ValidationError as exc:
                if attempt == 1:
                    raise
                current_payload = {
                    **payload,
                    "schema_correction": {
                        "instruction": (
                            "Regenerate the complete response, correcting every "
                            "listed schema violation. Preserve valid content and "
                            "return only the required structured output."
                        ),
                        "validation_errors": [
                            {
                                "path": ".".join(map(str, error["loc"])),
                                "message": error["msg"],
                                "type": error["type"],
                            }
                            for error in exc.errors()
                        ],
                        "invalid_output": raw,
                    },
                }

        raise AssertionError("Structured output validation loop exhausted")

    async def _wait_for_llm_slot(self) -> None:
        runtime = getattr(self, "_runtime", None)
        if runtime is None:
            return
        spacing = runtime.settings.provider_request_spacing_seconds
        if spacing <= 0:
            return
        pacing_lock = getattr(self, "_llm_pacing_lock", None)
        if pacing_lock is None:
            pacing_lock = asyncio.Lock()
            self._llm_pacing_lock = pacing_lock
        async with pacing_lock:
            now = asyncio.get_running_loop().time()
            last_request_at = getattr(self, "_last_llm_request_at", 0.0)
            wait = spacing - (now - last_request_at)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last_llm_request_at = asyncio.get_running_loop().time()

    async def _collate(
        self,
        *,
        ctx: Context,
        job_id: str,
        learner_id: str,
        selected: SelectedTopic,
        storyline: StorylineDraft,
        activities: ActivityPlan,
        media_plan: MediaPlan,
        video_decision: VideoDecision,
        assets: list[list[AssetReference]],
        embeddings: list[EmbeddingRecord],
    ) -> GeneratedStoryBundle:
        raw = await ctx.run_node(
            self._nodes["collator"],
            {
                "job_id": job_id,
                "learner_id": learner_id,
                "selected_topic": selected.model_dump(mode="json"),
                "storyline": storyline.model_dump(mode="json"),
                "activities": activities.model_dump(mode="json"),
                "media_plan": media_plan.model_dump(mode="json"),
                "video_decision": video_decision.model_dump(mode="json"),
                "asset_groups": [
                    [asset.model_dump(mode="json") for asset in group]
                    for group in assets
                ],
                "embeddings": [
                    item.model_dump(mode="json") for item in embeddings
                ],
            },
            use_sub_branch=True,
        )
        return GeneratedStoryBundle.model_validate(raw)

    async def _validate(
        self,
        ctx: Context,
        bundle: GeneratedStoryBundle,
        request: StoryGenerationRequest,
    ) -> ValidationReport:
        await self._progress("validating_story", 0.68)
        semantic = await self._run_llm(
            ctx,
            self._agents["critic"],
            {
                "request": _request_context(request),
                "bundle": bundle_for_semantic_validation(bundle),
                "minimum_quality_score": MIN_LEARNER_QUALITY_SCORE,
            },
            ValidationReport,
        )
        return merge_validation_reports(
            semantic, deterministic_issues(bundle, request)
        )

    @staticmethod
    def _needs_repair(report: ValidationReport) -> bool:
        return (
            not report.is_valid
            or report.quality_score < MIN_LEARNER_QUALITY_SCORE
        )

    async def _repair_bundle(
        self,
        *,
        ctx: Context,
        request: StoryGenerationRequest,
        bundle: GeneratedStoryBundle,
        report: ValidationReport,
        repair_cycle: int,
    ) -> GeneratedStoryBundle:
        storyline_issues = [
            issue
            for issue in report.issues
            if issue.component is RepairComponent.STORYLINE
        ]
        storyline_changed = bool(storyline_issues) or (
            report.quality_score < MIN_LEARNER_QUALITY_SCORE
        )
        if storyline_changed:
            repaired_storyline = await self._run_llm(
                ctx,
                self._agents["repair_storyline"],
                {
                    "request": _request_context(request),
                    "selected_topic": bundle.selected_topic.model_dump(mode="json"),
                    "storyline": bundle.storyline.model_dump(mode="json"),
                    "validation_issues": [
                        issue.model_dump(mode="json") for issue in storyline_issues
                    ],
                    "learner_feedback": report.learner_feedback,
                    "improvement_priorities": report.improvement_priorities,
                    "repair_cycle": repair_cycle,
                    "minimum_quality_score": MIN_LEARNER_QUALITY_SCORE,
                },
                StorylineDraft,
            )
            storyline = self._canonicalize_storyline_sources(
                self._dedupe_primers(repaired_storyline),
                bundle.selected_topic.candidate.source_evidence,
            )
            storyline = self._preserve_repair_identity(
                storyline,
                bundle.storyline,
            )
        else:
            storyline = bundle.storyline

        activity_by_scene = {
            activity.scene_id: activity for activity in bundle.activities.activities
        }
        original_scenes = {
            scene.scene_id: scene for scene in bundle.storyline.scenes
        }
        interaction_scenes = [
            scene for scene in storyline.scenes
            if scene.interaction_slot is not None
        ]
        repair_tasks = []
        repair_scene_ids = []
        for index, scene in enumerate(interaction_scenes):
            issues = _issues_for_activity(
                report,
                index,
                activity_by_scene.get(scene.scene_id),
            )
            scene_changed = scene != original_scenes.get(scene.scene_id)
            if not issues and not scene_changed:
                continue
            repair_scene_ids.append(scene.scene_id)
            repair_tasks.append(
                self._run_llm(
                    ctx,
                    self._agents["repair_activity"],
                    {
                        "request": _request_context(request),
                        "teaching_changed": scene_changed,
                        "story_context": {
                            "title": storyline.title,
                            "difficulty": storyline.difficulty,
                            "learning_objectives": storyline.learning_objectives,
                        },
                        "scene": scene.model_dump(mode="json"),
                        "current_activity": (
                            activity_by_scene[scene.scene_id].model_dump(mode="json")
                            if scene.scene_id in activity_by_scene
                            else None
                        ),
                        "validation_issues": issues,
                        "repair_cycle": repair_cycle,
                    },
                    ActivitySpec,
                )
            )
        repaired_activity_values = (
            await asyncio.gather(*repair_tasks) if repair_tasks else []
        )
        activity_by_scene.update(
            zip(repair_scene_ids, repaired_activity_values, strict=True)
        )
        storyline, activities = self._reconcile_activity_slots(
            storyline,
            ActivityPlan(
                activities=[
                    activity_by_scene[scene.scene_id]
                    for scene in interaction_scenes
                    if scene.scene_id in activity_by_scene
                ]
            ),
        )
        scenes = {scene.scene_id: scene for scene in storyline.scenes}
        activities = ActivityPlan(
            activities=[
                self._canonicalize_activity(activity, scenes[activity.scene_id])
                for activity in activities.activities
                if activity.scene_id in scenes
            ]
        )
        self._assert_media_budget(bundle.media_plan, request)
        story_embeddings, activity_embeddings = await asyncio.gather(
            ctx.run_node(
                self._nodes["story_embeddings"],
                {
                    "mode": "story",
                    "selected_topic": bundle.selected_topic.model_dump(mode="json"),
                    "storyline": storyline.model_dump(mode="json"),
                },
                use_sub_branch=True,
            ),
            ctx.run_node(
                self._nodes["activity_embeddings"],
                {
                    "mode": "activities",
                    "selected_topic": bundle.selected_topic.model_dump(mode="json"),
                    "storyline": storyline.model_dump(mode="json"),
                    "activities": activities.model_dump(mode="json"),
                },
                use_sub_branch=True,
            ),
        )
        return bundle.model_copy(
            update={
                "storyline": storyline,
                "activities": activities,
                "embeddings": self._embeddings(
                    story_embeddings,
                    activity_embeddings,
                ),
            }
        )

    @staticmethod
    def _preserve_repair_identity(
        repaired: StorylineDraft,
        original: StorylineDraft,
    ) -> StorylineDraft:
        """Keep repaired prose aligned with media that was already generated."""
        return repaired.model_copy(
            update={
                "story_id": original.story_id,
                "title": original.title,
                "tagline": original.tagline,
                "synopsis": original.synopsis,
                "subject": original.subject,
                "target_age": original.target_age,
                "difficulty": original.difficulty,
                "characters": original.characters,
            }
        )

    @staticmethod
    def _ground_selected_topic(
        selected: SelectedTopic,
        corpus: ResearchCorpus,
    ) -> SelectedTopic:
        source_by_url = {str(source.url): source for source in corpus.sources}
        grounded = [
            source_by_url[str(source.url)]
            for source in selected.candidate.source_evidence
            if str(source.url) in source_by_url
        ]
        if not grounded:
            grounded = corpus.sources[:8]
        if not grounded:
            raise ValidationFailure("Topic resolver produced no grounded sources")
        return selected.model_copy(
            update={
                "candidate": selected.candidate.model_copy(
                    update={"source_evidence": grounded}
                )
            }
        )

    @staticmethod
    def _canonicalize_scene(scene: SceneDraft, spec: SceneSpec) -> SceneDraft:
        return scene.model_copy(
            update={
                "scene_id": spec.scene_id,
                "act": spec.act,
                "title": spec.title,
                "beat": spec.beat,
                "next_scene_id": spec.next_scene_id,
                "scene_type": spec.scene_type,
                "mood": spec.mood,
                "interaction_slot": spec.interaction_slot,
                "concept": spec.concept,
                "outcome": spec.outcome,
                # The architect plans distinct subjects across the story; scene
                # workers run in parallel and cannot see each other's choices,
                # so an ignored plan would collapse every scene onto one subject
                # and lose all but one reference image to deduplication.
                "reference_subject": spec.reference_subject,
                "reference_fact": (
                    scene.reference_fact
                    if scene.reference_subject == spec.reference_subject
                    else None
                ),
                "reference_fact_citation_refs": (
                    scene.reference_fact_citation_refs
                    if scene.reference_subject == spec.reference_subject
                    else []
                ),
                "primer": scene.primer if spec.include_primer else [],
                "trivia": scene.trivia if spec.include_trivia else None,
                "hints": (
                    scene.hints if spec.interaction_slot is not None else None
                ),
            }
        )

    @staticmethod
    def _clamp_citation_refs(
        refs: list[int], citation_count: int
    ) -> list[int]:
        """Drop any citation index the model invented outside the supplied
        source list, keeping only genuinely valid 1-based references."""
        return [ref for ref in refs if 1 <= ref <= citation_count]

    @classmethod
    def _canonicalize_scene_citations(
        cls, scene: SceneDraft, citation_count: int
    ) -> SceneDraft:
        updates: dict[str, Any] = {
            "citation_refs": cls._clamp_citation_refs(
                scene.citation_refs, citation_count
            ),
            "reference_fact_citation_refs": cls._clamp_citation_refs(
                scene.reference_fact_citation_refs, citation_count
            ),
        }
        if scene.trivia is not None:
            updates["trivia"] = scene.trivia.model_copy(
                update={
                    "citation_refs": cls._clamp_citation_refs(
                        scene.trivia.citation_refs, citation_count
                    )
                }
            )
        if scene.learning_reference is not None:
            updates["learning_reference"] = scene.learning_reference.model_copy(
                update={
                    "citation_refs": cls._clamp_citation_refs(
                        scene.learning_reference.citation_refs, citation_count
                    )
                }
            )
        return scene.model_copy(update=updates)

    @staticmethod
    def _assemble_storyline(
        blueprint: StoryBlueprint,
        scenes: list[SceneDraft],
    ) -> StorylineDraft:
        citation_count = len(blueprint.citations)
        canonical_scenes = [
            StoryOrchestrator._canonicalize_scene_citations(scene, citation_count)
            for scene in scenes
        ]
        return StorylineDraft(
            story_id=blueprint.story_id,
            title=blueprint.title,
            tagline=blueprint.tagline,
            synopsis=blueprint.synopsis,
            subject=blueprint.subject,
            target_age=blueprint.target_age,
            difficulty=blueprint.difficulty,
            estimated_minutes=blueprint.estimated_minutes,
            learning_objectives=blueprint.learning_objectives,
            opening_scene_id=blueprint.opening_scene_id,
            scenes=canonical_scenes,
            takeaway=blueprint.takeaway,
            citations=blueprint.citations,
            learning_goal=blueprint.learning_goal,
            stage_label=blueprint.stage_label,
            partner_greeting=blueprint.partner_greeting,
            characters=blueprint.characters,
            intro=blueprint.intro,
            pre_session=blueprint.pre_session,
            player_takeaway=blueprint.player_takeaway,
        )

    @staticmethod
    def _canonicalize_activity(
        activity: ActivitySpec,
        scene: SceneDraft,
    ) -> ActivitySpec:
        if scene.interaction_slot is None:
            raise ValidationFailure(
                f"Scene {scene.scene_id} has no activity slot"
            )
        if activity.kind is not scene.interaction_slot:
            raise ValidationFailure(
                f"Activity kind {activity.kind.value} does not match "
                f"{scene.interaction_slot.value} for {scene.scene_id}"
            )
        return activity.model_copy(
            update={
                "activity_id": f"activity-{scene.scene_id}",
                "scene_id": scene.scene_id,
                "citation_refs": list(scene.citation_refs),
            }
        )

    @staticmethod
    def _ground_candidates(
        candidates: TopicCandidates, corpus: ResearchCorpus
    ) -> TopicCandidates:
        source_by_url = {str(source.url): source for source in corpus.sources}
        grounded = []
        for candidate in candidates.candidates:
            source_urls = {
                str(source.url) for source in candidate.source_evidence
            }
            if source_urls and source_urls <= source_by_url.keys():
                grounded.append(
                    candidate.model_copy(
                        update={
                            "source_evidence": [
                                source_by_url[url] for url in sorted(source_urls)
                            ]
                        }
                    )
                )
        if not grounded:
            raise ValidationFailure(
                "Topic scout produced no grounded candidates"
            )
        return TopicCandidates(candidates=grounded)

    @staticmethod
    def _canonicalize_selected(
        selected: SelectedTopic, candidates: TopicCandidates
    ) -> SelectedTopic:
        canonical = next(
            (
                candidate
                for candidate in candidates.candidates
                if candidate.candidate_id
                == selected.candidate.candidate_id
            ),
            None,
        )
        if canonical is None:
            raise ValidationFailure(
                "Topic selector invented an unknown candidate identifier"
            )
        return selected.model_copy(update={"candidate": canonical})

    @staticmethod
    def _canonicalize_storyline_sources(
        storyline: StorylineDraft, sources: list[SourceEvidence]
    ) -> StorylineDraft:
        if not sources:
            raise ValidationFailure("Selected topic has no canonical source evidence")
        return storyline.model_copy(update={"citations": list(sources)})

    async def _attach_reference_images(
        self, storyline: StorylineDraft
    ) -> StorylineDraft:
        """Attach one real, openly licensed photo to each scene that named a
        concrete, real-world subject in its narrative.

        Each scene worker proposes its own `reference_subject` (a specific
        molecule, artifact, instrument, building, species...) it actually
        wrote about, so the search here is always specific to that scene
        instead of a handful of generic images fetched before any scene
        existed. Distinct subjects are searched concurrently and capped at
        MAX_LEARNING_REFERENCES; scenes with no subject, a duplicate subject,
        or a failed search simply have no reference image.
        """
        subjects_by_scene_id: dict[str, str] = {}
        seen_subjects: set[str] = set()
        for scene in storyline.scenes:
            subject = (scene.reference_subject or "").strip()
            if not subject or subject.lower() in seen_subjects:
                continue
            if not scene.reference_fact or not self._clamp_citation_refs(
                scene.reference_fact_citation_refs, len(storyline.citations)
            ):
                logger.info(
                    "Omitting reference image for scene %s: no source-backed image fact",
                    scene.scene_id,
                )
                continue
            seen_subjects.add(subject.lower())
            subjects_by_scene_id[scene.scene_id] = subject
            if len(subjects_by_scene_id) >= MAX_LEARNING_REFERENCES:
                break

        if not subjects_by_scene_id:
            return storyline.model_copy(
                update={
                    "scenes": [
                        scene.model_copy(update={"learning_reference": None})
                        for scene in storyline.scenes
                    ]
                }
            )

        scene_ids = list(subjects_by_scene_id)
        found = await asyncio.gather(
            *(
                self._runtime.exa.find_reference_image(subjects_by_scene_id[scene_id])
                for scene_id in scene_ids
            ),
            return_exceptions=True,
        )
        reference_by_scene_id: dict[str, OpenLearningImage] = {}
        for scene_id, result in zip(scene_ids, found):
            if isinstance(result, BaseException) or result is None:
                continue
            reference_by_scene_id[scene_id] = result

        scenes = []
        for scene in storyline.scenes:
            reference = reference_by_scene_id.get(scene.scene_id)
            if reference is None:
                scenes.append(
                    scene.model_copy(update={"learning_reference": None})
                )
                continue
            learning_reference = SceneLearningReference(
                **reference.model_dump(
                    mode="python",
                    exclude={"plain_explanation", "why_important", "citation_refs"},
                ),
                plain_explanation=scene.reference_fact,
                why_important=scene.reference_fact,
                citation_refs=self._clamp_citation_refs(
                    scene.reference_fact_citation_refs, len(storyline.citations)
                ),
            )
            scenes.append(
                scene.model_copy(update={"learning_reference": learning_reference})
            )
        return storyline.model_copy(update={"scenes": scenes})

    @staticmethod
    def _without_learning_references(
        storyline: StorylineDraft,
    ) -> StorylineDraft:
        return storyline.model_copy(
            update={
                "scenes": [
                    scene.model_copy(
                        update={
                            "reference_subject": None,
                            "reference_fact": None,
                            "reference_fact_citation_refs": [],
                            "learning_reference": None,
                        }
                    )
                    for scene in storyline.scenes
                ]
            }
        )

    _PRIMER_DUPLICATE_SIMILARITY = 0.82

    @classmethod
    def _dedupe_primers(cls, storyline: StorylineDraft) -> StorylineDraft:
        # Independently authored scene chunks sometimes explain the same
        # unfamiliar term with near-identical wording. Rather than reject the
        # story, keep the first (earliest) occurrence and drop the repeats so
        # the learner is not taught the same thing twice in the same words.
        seen: list[str] = []
        scenes = []
        for scene in storyline.scenes:
            if not scene.primer:
                scenes.append(scene)
                continue
            kept: list[ScenePrimer] = []
            for primer in scene.primer:
                normalized = re.sub(r"\W+", " ", primer.plain.lower()).strip()
                is_duplicate = any(
                    SequenceMatcher(None, normalized, prior).ratio()
                    >= cls._PRIMER_DUPLICATE_SIMILARITY
                    for prior in seen
                )
                if is_duplicate:
                    continue
                seen.append(normalized)
                kept.append(primer)
            if len(kept) != len(scene.primer):
                scene = scene.model_copy(update={"primer": kept})
            scenes.append(scene)
        return storyline.model_copy(update={"scenes": scenes})

    @staticmethod
    def _assert_media_budget(
        plan: MediaPlan, request: StoryGenerationRequest
    ) -> None:
        if len(plan.images) > request.media_budget.max_images:
            raise ValidationFailure("Media plan exceeds the image budget")
        cover_count = sum(image.scene_id is None for image in plan.images)
        if request.media_budget.generate_cover_image and cover_count != 1:
            raise ValidationFailure("Media plan must include the requested cover image")
        if not request.media_budget.generate_cover_image and cover_count:
            raise ValidationFailure("Media plan includes a disabled cover image")
        if plan.audio and not request.media_budget.generate_background_audio:
            raise ValidationFailure("Media plan includes disabled audio")
        if plan.video and (
            not request.media_budget.video.enabled
            or plan.video.duration_seconds
            > request.media_budget.video.max_total_seconds
        ):
            raise ValidationFailure("Media plan exceeds the video budget")

    @staticmethod
    def _assert_video_decision(
        decision: VideoDecision,
        plan: MediaPlan,
        request: StoryGenerationRequest,
    ) -> None:
        approved = decision.approved_request
        if approved is None:
            return
        proposed = plan.video
        budget = request.media_budget.video
        if proposed is None:
            raise ValidationFailure("Video gate approved an unplanned video")
        if not budget.enabled or budget.max_clips < 1:
            raise ValidationFailure("Video gate bypassed a disabled video budget")
        if approved.duration_seconds > budget.max_total_seconds:
            raise ValidationFailure("Video gate exceeded the duration budget")
        if (
            approved.asset_key != proposed.asset_key
            or approved.scene_id != proposed.scene_id
            or approved.duration_seconds != proposed.duration_seconds
            or approved.aspect_ratio != proposed.aspect_ratio
        ):
            raise ValidationFailure(
                "Video gate changed immutable video request fields"
            )

    @staticmethod
    def _resolve_optional_video(
        plan: MediaPlan,
        decision: VideoDecision,
        video_assets: Any,
    ) -> tuple[MediaPlan, VideoDecision]:
        if decision.approved_request is None or video_assets:
            return plan, decision
        return (
            plan.model_copy(update={"video": None}),
            VideoDecision(
                approved=False,
                reason=(
                    "Veo did not return a usable clip; the required scene image "
                    "preserves the story evidence."
                ),
            ),
        )

    @staticmethod
    def _asset_groups(*groups: Any) -> list[list[AssetReference]]:
        return [
            [AssetReference.model_validate(item) for item in group]
            for group in groups
        ]

    @staticmethod
    def _version_media_asset_keys(
        plan: MediaPlan, repair_cycle: int
    ) -> MediaPlan:
        suffix = f"-r{repair_cycle}"
        return plan.model_copy(
            update={
                "images": [
                    image.model_copy(
                        update={"asset_key": f"{image.asset_key}{suffix}"}
                    )
                    for image in plan.images
                ],
                "video": (
                    plan.video.model_copy(
                        update={"asset_key": f"{plan.video.asset_key}{suffix}"}
                    )
                    if plan.video
                    else None
                ),
                "audio": (
                    plan.audio.model_copy(
                        update={"asset_key": f"{plan.audio.asset_key}{suffix}"}
                    )
                    if plan.audio
                    else None
                ),
            }
        )

    @staticmethod
    def _embeddings(*groups: Any) -> list[EmbeddingRecord]:
        return [
            EmbeddingRecord.model_validate(item)
            for group in groups
            for item in group
        ]

    @staticmethod
    def _retain_generated_images(
        plan: MediaPlan,
        assets: list[Any],
    ) -> MediaPlan:
        generated_keys = {
            asset.asset_key
            for item in assets
            if (asset := AssetReference.model_validate(item))
            if asset.kind.value == "image"
        }
        return plan.model_copy(
            update={
                "images": [
                    image
                    for image in plan.images
                    if image.asset_key in generated_keys
                ]
            }
        )

    @staticmethod
    def _assert_complete_assets(
        plan: MediaPlan,
        image_assets: list[Any],
        audio_assets: list[Any],
    ) -> None:
        """Block persistence only on asset integrity problems.

        Scene imagery is optional, but a requested cover is not: the create
        page must never report a successful cover-enabled job without one.
        An asset that was never planned or missing background audio also
        indicates a real fault.
        """
        generated_image_keys = [
            AssetReference.model_validate(item).asset_key for item in image_assets
        ]
        expected_image_counts = Counter(image.asset_key for image in plan.images)
        unexpected_images = sorted(
            (Counter(generated_image_keys) - expected_image_counts).elements()
        )
        required_cover_keys = [
            image.asset_key for image in plan.images if image.scene_id is None
        ]
        missing_cover_keys = sorted(
            (Counter(required_cover_keys) - Counter(generated_image_keys)).elements()
        )
        generated_audio_keys = [
            AssetReference.model_validate(item).asset_key for item in audio_assets
        ]
        expected_audio_keys = [plan.audio.asset_key] if plan.audio else []
        audio_complete = Counter(generated_audio_keys) == Counter(expected_audio_keys)
        if unexpected_images or missing_cover_keys or not audio_complete:
            details = []
            if unexpected_images:
                details.append(f"unexpected images: {unexpected_images}")
            if missing_cover_keys:
                details.append(f"missing requested cover: {missing_cover_keys}")
            if not audio_complete:
                details.append(
                    "audio mismatch: expected "
                    f"{expected_audio_keys}, generated {generated_audio_keys}"
                )
            raise ValidationFailure(
                "Required assets were not fully generated; story was not persisted ("
                + "; ".join(details)
                + ")"
            )

    @staticmethod
    def _retain_generated_audio(
        plan: MediaPlan,
        assets: list[Any],
    ) -> MediaPlan:
        if plan.audio is None:
            return plan
        generated_keys = {
            asset.asset_key
            for item in assets
            if (asset := AssetReference.model_validate(item))
            if asset.kind.value == "audio"
        }
        return plan if plan.audio.asset_key in generated_keys else plan.model_copy(
            update={"audio": None}
        )

    @staticmethod
    def _select_requested_topic(
        request: StoryGenerationRequest,
        corpus: ResearchCorpus,
    ) -> SelectedTopic:
        subject = request.preferred_subjects[0]
        topic = subject.discipline
        candidate_id = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")
        candidate_id = (candidate_id or "requested-topic")[:64].rstrip("-")
        if len(candidate_id) < 3:
            candidate_id = f"{candidate_id}-topic"
        sources = corpus.sources[:8]
        generic_premise = (
            f"The learner leads a real-world {subject.discipline} decision "
            f"where understanding {topic} changes the outcome."
        )
        if request.story_brief:
            premise = request.story_brief
            if len(premise) < 40:
                premise = f"{premise} {generic_premise}"
            premise = premise[:700]
        else:
            premise = generic_premise
        why_now = (
            "The requested story concept is directly relevant to the learner's "
            "current goal and is supported by the supplied research evidence."
            if request.story_brief
            else (
                "The requested topic is directly relevant to the learner's current "
                "goal and is supported by the supplied research evidence."
            )
        )
        candidate = TopicCandidate(
            candidate_id=candidate_id,
            title=topic.replace("-", " ").title(),
            subject=subject,
            premise=premise,
            learning_objectives=(
                subject.topic_tags[:4]
                or [f"Use {topic} to make a grounded decision."]
            ),
            why_now=why_now,
            source_evidence=sources,
            novelty_score=0.7,
            story_potential_score=0.9,
            age_suitability_score=0.9,
        )
        return SelectedTopic(
            candidate=candidate,
            engagement_rationale=(
                "The learner explicitly requested this topic, so no additional "
                "model-based topic scouting or ranking is needed."
            ),
            predicted_engagement_score=0.9,
            novelty_balance=(
                "The requested subject is preserved while the storyline supplies "
                "a fresh real-world role and decision."
            ),
        )

    @staticmethod
    def _fallback_media_plan(
        storyline: StorylineDraft,
        request: StoryGenerationRequest,
    ) -> MediaPlan:
        audio = None
        if request.media_budget.generate_background_audio:
            audio = AudioRequest(
                asset_key="background-score",
                prompt=(
                    f"Slow, mild, loopable ethereal instrumental ambience for "
                    f"'{storyline.title}'. Translate its setting and emotional arc "
                    "into slowly evolving pads, airy textures, gentle environmental "
                    "detail, subtle tension, discovery, and a calm resolution in a "
                    "spacious binaural field. Keep the music quiet beneath narration, "
                    "with no dominant melody."
                ),
                negative_prompt=(
                    "beats, rhythmic pulse, percussion, drums, sharp transients, "
                    "vocals, loud bass, urgent trailer music, copyrighted artists"
                ),
            )
        return MediaPlan(
            images=[],
            video=None,
            audio=audio,
            visual_style_guide=(
                f"Use this exact style for the cover and every scene frame: "
                f"{_STORY_IMAGE_STYLE}"
            ),
        )

    @staticmethod
    def _ensure_image_coverage(
        plan: MediaPlan,
        storyline: StorylineDraft,
        request: StoryGenerationRequest,
    ) -> MediaPlan:
        """Retains or creates the requested cover and scene images."""
        budget = request.media_budget.max_images
        if budget == 0:
            return plan.model_copy(update={"images": []})
        scene_ids = [scene.scene_id for scene in storyline.scenes]
        by_scene: dict[str, ImageRequest] = {}
        cover: ImageRequest | None = None
        for image in plan.images:
            if image.scene_id is None:
                cover = cover or image
            elif image.scene_id in scene_ids and image.scene_id not in by_scene:
                by_scene[image.scene_id] = image

        style = plan.visual_style_guide
        character_names = [
            character.name for character in storyline.characters
        ] or ["the recurring lead"]
        cover_characters = " and ".join(character_names[:2])
        if request.media_budget.generate_cover_image and cover is None:
            character_details = "; ".join(
                f"{character.name}: {character.visual_description}"
                for character in storyline.characters[:2]
            )
            opening_scene = next(
                (
                    scene
                    for scene in storyline.scenes
                    if scene.scene_id == storyline.opening_scene_id
                ),
                storyline.scenes[0],
            )
            cover = ImageRequest(
                asset_key="cover",
                scene_id=None,
                prompt=(
                    f"Create one text-free 16:9 cover frame for the educational story "
                    f"'{storyline.title}'; do not render the title. Show the grounded "
                    f"moment immediately before the first major decision, not the final "
                    f"solution. Opening problem: {opening_scene.media_cue} Foreground "
                    f"characters: {cover_characters}. Exact designs: "
                    f"{character_details}. All depicted characters are fictional adults "
                    "age 21 or older. Use a medium-wide eye-level composition with one "
                    "clear focal action, restrained expressions, readable body language, "
                    "and generous negative space. Include only props needed to understand "
                    f"the opening problem. Exact visual style: {style} The image must "
                    "contain no text or writing of any kind: no letters, words, numbers, "
                    "labels, captions, signs, logos, watermarks, or interface text. No "
                    "celebrity likenesses, identifiable real people, poster layout, "
                    "montage, collage, split screen, diagram, or infographic."
                )[:1800],
                alt_text=(
                    f"{cover_characters} confront the opening problem in "
                    f"{storyline.title}: {opening_scene.media_cue}"
                )[:300],
                aspect_ratio="16:9",
            )

        images: list[ImageRequest] = [cover] if cover is not None and request.media_budget.generate_cover_image else []
        for index, scene in enumerate(storyline.scenes):
            if len(images) >= budget:
                break
            existing = by_scene.get(scene.scene_id)
            if existing is not None:
                images.append(existing)
                continue
            beat = " ".join(scene.narrative)
            character_name = next(
                (
                    name
                    for name in character_names
                    if name.lower() in beat.lower()
                ),
                character_names[0],
            )
            images.append(
                ImageRequest(
                    asset_key=f"scene-{index + 1}-{scene.scene_id}"[:80],
                    scene_id=scene.scene_id,
                    prompt=(
                        f"Animated cinematic story frame for '{scene.title}'. "
                        f"{beat} Visual cue: {scene.media_cue} Show {character_name}, "
                        "a fictional adult age 21 or older, "
                        "clearly in the foreground performing the scene action, "
                        "with the physical evidence visible as a prop. No readable "
                        f"text, labels, diagrams, or logos. Style continuity: {style}"
                    )[:1800],
                    alt_text=f"{scene.title}: {scene.media_cue}"[:300],
                    aspect_ratio="16:9",
                )
            )
        return plan.model_copy(update={"images": images})

    @staticmethod
    def _reconcile_activity_slots(
        storyline: StorylineDraft,
        plan: ActivityPlan,
    ) -> tuple[StorylineDraft, ActivityPlan]:
        scene_ids = {scene.scene_id for scene in storyline.scenes}
        by_scene: dict[str, ActivitySpec] = {}
        for activity in plan.activities:
            if activity.scene_id in scene_ids and activity.scene_id not in by_scene:
                by_scene[activity.scene_id] = activity
        scene_types = {
            "quiz": "choice",
            "reorder": "reorder",
            "simulation": "narrative",
            "reflection": "reflect",
            "slider": "slider",
        }
        scenes = [
            scene.model_copy(
                update={
                    "interaction_slot": (
                        scene.interaction_slot
                    ),
                    "scene_type": (
                        scene_types[scene.interaction_slot.value]
                        if scene.interaction_slot is not None
                        else (
                            scene.scene_type
                            if scene.scene_type == "ending"
                            else "narrative"
                        )
                    ),
                }
            )
            for scene in storyline.scenes
        ]
        return (
            storyline.model_copy(update={"scenes": scenes}),
            plan.model_copy(update={"activities": list(by_scene.values())}),
        )


def _issues_for_activity(
    report: ValidationReport,
    index: int,
    activity: ActivitySpec | None,
) -> list[dict[str, Any]]:
    identifiers = {
        f"activities.{index}",
        f"activities[{index}]",
    }
    if activity is not None:
        identifiers.update({activity.activity_id, activity.scene_id})
    selected = []
    for issue in report.issues:
        if issue.component is not RepairComponent.ACTIVITIES:
            continue
        path = issue.path
        has_specific_identifier = any(
            identifier in path for identifier in identifiers
        )
        is_broad = not any(character.isdigit() for character in path)
        if has_specific_identifier or is_broad:
            selected.append(issue.model_dump(mode="json"))
    return selected


def _normalize_storyline_output(raw: Any) -> Any:
    if not isinstance(raw, dict) or not isinstance(raw.get("scenes"), list):
        return raw
    synopsis = raw.get("synopsis")
    if isinstance(synopsis, str) and len(synopsis) > 360:
        raw["synopsis"] = _truncate_prose(synopsis, 360)
    fallbacks = [
        "Start with the visible change in the scene.",
        "Connect that clue to the simple cause-and-effect model.",
        "Choose the action that changes the cause, not only the symptom.",
    ]
    for scene in raw["scenes"]:
        if not isinstance(scene, dict):
            continue
        beat = scene.get("beat")
        if isinstance(beat, str) and len(beat) > 160:
            shortened = beat[:160].rsplit(" ", 1)[0].rstrip(" .,:;!?—-")
            scene["beat"] = shortened or beat[:160]
        if scene.get("primer") is None:
            scene["primer"] = []
        hints = scene.get("hints")
        if (
            "interaction_slot" in scene
            and scene.get("interaction_slot") is None
        ):
            scene["hints"] = None
            continue
        if not isinstance(hints, list):
            hints = []
        if len(hints) >= 3:
            continue
        scene["hints"] = [
            *hints,
            *fallbacks[len(hints) : 3],
        ]
    return raw


def _normalize_blueprint_output(raw: Any) -> Any:
    if not isinstance(raw, dict):
        return raw
    for field, limit in (
        ("title", 100),
        ("tagline", 180),
        ("synopsis", 360),
        ("learning_goal", 280),
    ):
        value = raw.get(field)
        if isinstance(value, str) and len(value) > limit:
            raw[field] = _truncate_prose(value, limit)
    return raw


def _normalize_validation_output(raw: Any) -> Any:
    if not isinstance(raw, dict):
        return raw
    for field in (
        "learner_feedback",
        "factual_grounding_summary",
        "safety_summary",
    ):
        value = raw.get(field)
        if isinstance(value, str) and len(value) > 1200:
            raw[field] = _truncate_prose(value, 1200)
    priorities = raw.get("improvement_priorities")
    if isinstance(priorities, list):
        raw["improvement_priorities"] = priorities[:6]
    issues = raw.get("issues")
    if isinstance(issues, list):
        raw["issues"] = issues[:60]
        for issue in raw["issues"]:
            if not isinstance(issue, dict):
                continue
            for field in ("message", "repair_instruction"):
                value = issue.get(field)
                if isinstance(value, str) and len(value) > 800:
                    issue[field] = _truncate_prose(value, 800)
    return raw


def _truncate_prose(value: str, limit: int) -> str:
    shortened = value[: limit - 1].rsplit(" ", 1)[0].rstrip(" .,:;!?—-")
    return f"{shortened or value[: limit - 1]}."


def _normalize_media_output(raw: Any) -> Any:
    if not isinstance(raw, dict):
        return raw
    style = raw.get("visual_style_guide")
    if isinstance(style, str):
        style = style[:1000]
        raw["visual_style_guide"] = style
    for image in raw.get("images") or []:
        if not isinstance(image, dict):
            continue
        prompt = image.get("prompt")
        if isinstance(prompt, str):
            adult_rule = (
                "All depicted characters are fictional adults age 21 or older. "
                "Visibly foreground at least one named recurring character. "
            )
            text_free_rule = (
                "The image must contain no text or writing of any kind: no letters, "
                "words, numbers, labels, captions, signs, logos, watermarks, interface "
                "text, or document text. "
            )
            if "adult" not in prompt.lower():
                prompt = f"{adult_rule}{prompt}"
            if "no text or writing of any kind" not in prompt.lower():
                prompt = f"{text_free_rule}{prompt}"
            continuity = (
                f" Use this exact visual continuity for every frame: {style}"
                if isinstance(style, str)
                else ""
            )
            image["prompt"] = f"{prompt[:1300]}{continuity}"[:1800]
        alt_text = image.get("alt_text")
        if isinstance(alt_text, str):
            image["alt_text"] = alt_text[:300]
    video = raw.get("video")
    if isinstance(video, dict):
        for key, limit in (("prompt", 1800), ("narrative_necessity", 600)):
            value = video.get(key)
            if isinstance(value, str):
                video[key] = value[:limit]
    audio = raw.get("audio")
    if isinstance(audio, dict):
        for key, limit in (("prompt", 1600), ("negative_prompt", 800)):
            value = audio.get(key)
            if isinstance(value, str):
                audio[key] = value[:limit]
        prompt = audio.get("prompt")
        if isinstance(prompt, str):
            required = (
                " Slow, mild, sustained ethereal atmospheric textures in a spacious "
                "binaural field, gently evolving from tension toward calm resolution."
            )
            if not all(
                term in prompt.lower()
                for term in ("slow", "mild", "ethereal", "binaural")
            ):
                audio["prompt"] = f"{prompt.rstrip()}{required}"[:1600]
        negative = audio.get("negative_prompt")
        exclusions = "beat, percussion, drum, rhythmic pulse"
        if not isinstance(negative, str) or not all(
            term in negative.lower()
            for term in ("beat", "percussion", "drum", "rhythmic pulse")
        ):
            audio["negative_prompt"] = (
                f"{negative.rstrip()}, {exclusions}" if isinstance(negative, str) and negative.strip()
                else exclusions
            )[:800]
    return raw


def _normalize_activity_output(raw: Any) -> Any:
    if not isinstance(raw, dict):
        return raw
    activities: Any = raw.get("activities")
    if isinstance(activities, dict):
        activities = activities.get("activities")
    if not isinstance(activities, list):
        activities = [raw] if isinstance(raw.get("kind"), str) else []
    quiz_index = 0
    for activity in activities:
        if not isinstance(activity, dict):
            continue
        kind = activity.get("kind")
        payload_keys = ("quiz", "reorder", "simulation", "reflection", "slider")
        if kind in payload_keys and isinstance(activity.get(kind), dict):
            for payload_key in payload_keys:
                if payload_key != kind:
                    activity[payload_key] = None
        quiz = activity.get("quiz")
        if isinstance(quiz, dict):
            options = quiz.get("options")
            correct_ids = quiz.get("correct_option_ids")
            if (
                isinstance(options, list)
                and len(options) > 1
                and isinstance(correct_ids, list)
                and len(correct_ids) == 1
            ):
                correct_id = correct_ids[0]
                correct_position = next(
                    (
                        index
                        for index, option in enumerate(options)
                        if isinstance(option, dict)
                        and option.get("option_id") == correct_id
                    ),
                    None,
                )
                if correct_position is not None:
                    target_position = quiz_index % len(options)
                    correct = options.pop(correct_position)
                    options.insert(target_position, correct)
                    quiz_index += 1
        simulation = activity.get("simulation")
        if isinstance(simulation, dict):
            condition = simulation.get("success_condition")
            controls = simulation.get("controls")
            clauses = (
                re.split(r"\s*(?:&&|\band\b)\s*", condition, flags=re.IGNORECASE)
                if isinstance(condition, str)
                else []
            )
            auditable = bool(clauses) and all(
                re.fullmatch(
                    r"\s*[a-z][a-z0-9_]*\s*(?:==|>=|<=|>|<)\s*-?\d+(?:\.\d+)?\s*",
                    clause,
                    flags=re.IGNORECASE,
                )
                for clause in clauses
            )
            if not auditable and isinstance(controls, list) and controls:
                first = controls[0]
                if isinstance(first, dict):
                    control_id = first.get("control_id")
                    minimum = first.get("minimum")
                    if isinstance(control_id, str) and isinstance(
                        minimum, (int, float)
                    ):
                        # Success is internal validation metadata; the player-facing
                        # simulation remains open-ended.
                        simulation["success_condition"] = (
                            f"{control_id} >= {minimum}"
                        )
        slider = activity.get("slider")
        if not isinstance(slider, dict):
            continue
        if slider.get("readout_expr") == "linear":
            params = slider.get("readout_params")
            if not isinstance(params, dict):
                params = {}
            if not {"intercept", "slope"} <= set(params):
                target_min = slider.get("target_minimum")
                target_max = slider.get("target_maximum")
                guide = slider.get("guide")
                watch = guide.get("watch", "") if isinstance(guide, dict) else ""
                explanation = slider.get("explanation", "")
                promised = re.search(
                    r"(?:reaches|extends to|produces?|becomes?)\s+\$?"
                    r"(-?\d+(?:\.\d+)?)",
                    f"{watch} {explanation}",
                    re.IGNORECASE,
                )
                if (
                    isinstance(target_min, (int, float))
                    and isinstance(target_max, (int, float))
                    and promised
                    and abs(target_min + target_max) > 1e-12
                ):
                    target = (target_min + target_max) / 2
                    slider["readout_params"] = {
                        "intercept": 0.0,
                        "slope": float(promised.group(1)) / target,
                    }
        bands = slider.get("bands")
        if not isinstance(bands, list):
            continue
        for band in bands:
            if not isinstance(band, dict):
                continue
            text = band.get("text")
            if isinstance(text, str) and len(text.strip()) < 10:
                band["text"] = (
                    f"{text.strip()} setting; observe the displayed consequence."
                )
    return raw
