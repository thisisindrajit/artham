"""Dynamic Google ADK orchestration for the complete generation pipeline."""

from __future__ import annotations

import asyncio
import re
from collections import Counter
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from json import JSONDecodeError
from typing import Any, TypeVar

from google.adk.agents import Context, LlmAgent
from google.adk.models.google_llm import _ResourceExhaustedError
from pydantic import BaseModel, TypeAdapter, ValidationError

from .agents import build_reasoning_agents
from .constants import (
    DEFAULT_MAX_REPAIR_CYCLES,
    MAX_MISSING_SCENE_IMAGES,
    PROVIDER_REQUEST_SPACING_SECONDS,
    RATE_LIMIT_RETRY_DELAY_SECONDS,
)
from .contracts import (
    ActivityPlan,
    ActivitySpec,
    AudioRequest,
    AssetReference,
    EmbeddingRecord,
    EngagementProfile,
    GeneratedStoryBundle,
    ImageRequest,
    MediaPlan,
    OpenLearningImage,
    RepairComponent,
    RepairResult,
    ResearchCorpus,
    SelectedTopic,
    SourceEvidence,
    StoryGenerationRequest,
    StoryGenerationResult,
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
)

ProgressCallback = Callable[[str, float], Awaitable[None]]
TModel = TypeVar("TModel", bound=BaseModel)
_PAYLOAD_ADAPTER = TypeAdapter(dict[str, Any])


async def _no_progress(stage: str, progress: float) -> None:
    return None


def _encode_payload(payload: dict[str, Any]) -> str:
    return _PAYLOAD_ADAPTER.dump_json(payload).decode("utf-8")


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
        self._provider_lock = asyncio.Lock()
        self._last_provider_completion: float | None = None
        self._provider_spacing = PROVIDER_REQUEST_SPACING_SECONDS

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
            engagement_raw, corpus_raw = await asyncio.gather(
                ctx.run_node(
                    self._nodes["engagement"],
                    request.model_dump(mode="json"),
                    use_sub_branch=True,
                ),
                ctx.run_node(
                    self._nodes["research"],
                    request.model_dump(mode="json"),
                    use_sub_branch=True,
                ),
            )
        corpus = ResearchCorpus.model_validate(corpus_raw)

        if request.preferred_subjects:
            await self._progress("selecting_topic", 0.20)
            selected = self._select_requested_topic(request, corpus)
        else:
            await self._progress("scouting_topics", 0.12)
            candidates = await self._run_llm(
                ctx,
                self._agents["topic_scout"],
                {
                    "request": request.model_dump(mode="json"),
                    "research": corpus.model_dump(mode="json"),
                },
                TopicCandidates,
            )
            candidates = self._ground_candidates(candidates, corpus)

            await self._progress("selecting_topic", 0.20)
            selected = await self._run_llm(
                ctx,
                self._agents["topic_selector"],
                {
                    "request": request.model_dump(mode="json"),
                    "engagement": engagement_raw,
                    "candidates": candidates.model_dump(mode="json"),
                },
                SelectedTopic,
            )
            selected = self._canonicalize_selected(selected, candidates)

        selected_sources = selected.candidate.source_evidence
        if not selected_sources:
            raise ValidationFailure("Selected topic has no grounded Exa sources")

        await self._progress("writing_storyline", 0.28)
        storyline_input = {
            "request": request.model_dump(mode="json"),
            "selected_topic": selected.model_dump(mode="json"),
            "source_evidence": [
                item.model_dump(mode="json") for item in selected_sources
            ],
            "reference_images": [
                item.model_dump(mode="json")
                for item in corpus.reference_images
            ],
            "engagement": engagement_raw,
        }
        storyline = await self._run_llm(
            ctx,
            self._agents["storyline"],
            storyline_input,
            StorylineDraft,
        )
        max_scenes = min(8, max(5, request.duration_minutes + 2))
        if len(storyline.scenes) > max_scenes:
            storyline = await self._run_llm(
                ctx,
                self._agents["storyline"],
                {
                    **storyline_input,
                    "validation_feedback": (
                        f"The previous storyline had {len(storyline.scenes)} scenes. "
                        f"Regenerate the complete storyline with at most {max_scenes} "
                        "scenes to fit the requested duration. Keep the essential "
                        "story decisions and learning progression."
                    ),
                },
                StorylineDraft,
            )
        if len(storyline.scenes) > max_scenes:
            raise ValidationFailure(
                f"Storyline exceeds the hard limit of {max_scenes} scenes"
            )
        storyline = self._canonicalize_storyline_sources(
            storyline, selected_sources
        )
        storyline = self._canonicalize_learning_references(
            storyline, corpus.reference_images
        )

        await self._progress("planning_media_and_activities", 0.40)
        media_result, activities_raw = await asyncio.gather(
            self._run_llm(
                ctx,
                self._agents["media_planner"],
                {
                    "storyline": storyline.model_dump(mode="json"),
                    "media_budget": request.media_budget.model_dump(mode="json"),
                },
                MediaPlan,
            ),
            self._run_llm(
                ctx,
                self._agents["activities"],
                {"storyline": storyline.model_dump(mode="json")},
                ActivityPlan,
            ),
            return_exceptions=True,
        )
        if isinstance(activities_raw, BaseException):
            raise activities_raw
        if isinstance(media_result, (JSONDecodeError, ValidationError)):
            media_plan = self._fallback_media_plan(storyline, request)
        elif isinstance(media_result, BaseException):
            raise media_result
        else:
            media_plan = media_result
        fallback_media = self._fallback_media_plan(storyline, request)
        media_plan = media_plan.model_copy(
            update={
                "video": None,
                "audio": media_plan.audio or fallback_media.audio,
            }
        )
        media_plan = self._ensure_image_coverage(media_plan, storyline, request)
        self._assert_media_budget(media_plan, request)
        video_decision = VideoDecision(
            approved=False,
            reason="Video generation is disabled to control story-generation cost.",
            approved_request=None,
        )

        await self._progress("generating_assets_and_activities", 0.48)
        activities = normalize_simulation_readouts(
            ActivityPlan.model_validate(activities_raw)
        )
        storyline, activities = self._reconcile_activity_slots(
            storyline,
            activities,
        )
        image_assets = await ctx.run_node(
            self._nodes["images"],
            {
                "job_id": job_id,
                "media_plan": media_plan.model_dump(mode="json"),
            },
            use_sub_branch=True,
        )
        await asyncio.sleep(PROVIDER_REQUEST_SPACING_SECONDS)
        audio_assets = await ctx.run_node(
            self._nodes["audio"],
            {
                "job_id": job_id,
                "media_plan": media_plan.model_dump(mode="json"),
            },
            use_sub_branch=True,
        )
        await asyncio.sleep(PROVIDER_REQUEST_SPACING_SECONDS)
        story_embeddings = await ctx.run_node(
            self._nodes["story_embeddings"],
            {
                "mode": "story",
                "selected_topic": selected.model_dump(mode="json"),
                "storyline": storyline.model_dump(mode="json"),
            },
            use_sub_branch=True,
        )
        await asyncio.sleep(PROVIDER_REQUEST_SPACING_SECONDS)
        activity_embeddings_raw = await ctx.run_node(
            self._nodes["activity_embeddings"],
            {
                "mode": "activities",
                "selected_topic": selected.model_dump(mode="json"),
                "storyline": storyline.model_dump(mode="json"),
                "activities": activities.model_dump(mode="json"),
            },
            use_sub_branch=True,
        )
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
        report = bounded_release_report(
            await self._validate(ctx, bundle, request),
            deterministic_issues(bundle, request),
        )
        while not report.is_valid and repair_cycles < DEFAULT_MAX_REPAIR_CYCLES:
            repair_cycles += 1
            await self._progress(
                f"repairing_story_{repair_cycles}",
                0.70 + (repair_cycles * 0.08),
            )
            repair_payload = {
                "bundle": bundle_for_semantic_validation(bundle),
                "validation": report.model_dump(mode="json"),
                "reference_images": [
                    item.model_dump(mode="json")
                    for item in corpus.reference_images
                ],
            }
            error_components = {
                issue.component
                for issue in report.issues
                if issue.severity is ValidationSeverity.ERROR
            }
            storyline_changed = RepairComponent.STORYLINE in error_components
            if storyline_changed:
                repaired_storyline = await self._run_llm(
                    ctx,
                    self._agents["repair_storyline"],
                    repair_payload,
                    StorylineDraft,
                )
            else:
                repaired_storyline = storyline

            activity_by_scene = {
                item.scene_id: item for item in activities.activities
            }
            interaction_scenes = [
                scene
                for scene in repaired_storyline.scenes
                if scene.interaction_slot is not None
            ]
            activity_repairs = []
            activity_repair_scene_ids = []
            if RepairComponent.ACTIVITIES in error_components:
                for index, scene in enumerate(interaction_scenes):
                    issues = _issues_for_activity(
                        report,
                        index,
                        activity_by_scene.get(scene.scene_id),
                    )
                    if not issues:
                        continue
                    activity_repair_scene_ids.append(scene.scene_id)
                    activity_repairs.append(
                        self._run_llm(
                            ctx,
                            self._agents["repair_activity"],
                            {
                                "scene": scene.model_dump(mode="json"),
                                "current_activity": (
                                    activity_by_scene[scene.scene_id].model_dump(
                                        mode="json"
                                    )
                                    if scene.scene_id in activity_by_scene
                                    else None
                                ),
                                "validation_issues": issues,
                            },
                            ActivitySpec,
                        )
                    )
            repaired_activity_values = (
                await asyncio.gather(*activity_repairs)
                if activity_repairs
                else []
            )
            repaired_activity_by_scene = dict(
                zip(activity_repair_scene_ids, repaired_activity_values, strict=True)
            )
            repaired_activities = ActivityPlan(
                activities=[
                    repaired_activity_by_scene.get(
                        scene.scene_id,
                        activity_by_scene[scene.scene_id],
                    )
                    for scene in interaction_scenes
                    if (
                        scene.scene_id in repaired_activity_by_scene
                        or scene.scene_id in activity_by_scene
                    )
                ]
            )
            activities_changed = bool(repaired_activity_values)
            repaired_media_plan = media_plan.model_copy(
                update={
                    "audio": media_plan.audio,
                    "video": None,
                }
            )
            storyline = self._canonicalize_storyline_sources(
                repaired_storyline, selected_sources
            )
            storyline = self._canonicalize_learning_references(
                storyline, corpus.reference_images
            )
            activities = normalize_simulation_readouts(repaired_activities)
            storyline, activities = self._reconcile_activity_slots(
                storyline,
                activities,
            )
            self._assert_media_budget(repaired_media_plan, request)
            new_video_decision = VideoDecision(
                approved=False,
                reason=(
                    "Video generation is disabled to control story-generation cost."
                ),
                approved_request=None,
            )
            media_plan = repaired_media_plan
            video_decision = new_video_decision

            embedding_tasks = []
            embedding_names = []
            if storyline_changed:
                embedding_names.append("story")
                embedding_tasks.append(
                    ctx.run_node(
                        self._nodes["story_embeddings"],
                        node_input={
                            "mode": "story",
                            "selected_topic": selected.model_dump(mode="json"),
                            "storyline": storyline.model_dump(mode="json"),
                        },
                        use_sub_branch=True,
                    )
                )
            if storyline_changed or activities_changed:
                embedding_names.append("activities")
                embedding_tasks.append(
                    ctx.run_node(
                        self._nodes["activity_embeddings"],
                        {
                            "mode": "activities",
                            "selected_topic": selected.model_dump(mode="json"),
                            "storyline": storyline.model_dump(mode="json"),
                            "activities": activities.model_dump(mode="json"),
                        },
                        use_sub_branch=True,
                    )
                )
            if embedding_tasks:
                regenerated_embeddings = dict(
                    zip(
                        embedding_names,
                        await asyncio.gather(*embedding_tasks),
                        strict=True,
                    )
                )
                story_embeddings = regenerated_embeddings.get(
                    "story", story_embeddings
                )
                activity_embeddings_raw = regenerated_embeddings.get(
                    "activities", activity_embeddings_raw
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
            report = bounded_release_report(
                await self._validate(ctx, bundle, request),
                deterministic_issues(bundle, request),
            )

        if not report.is_valid:
            report = bounded_release_report(
                report,
                deterministic_issues(bundle, request),
            )
            if not report.is_valid:
                codes = ", ".join(issue.code for issue in report.issues)
                raise ValidationFailure(
                    f"Story remained invalid after {repair_cycles} repair cycle(s): "
                    + codes
                )

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
        from .contracts import PersistenceReceipt

        result = StoryGenerationResult(
            job_id=job_id,
            receipt=PersistenceReceipt.model_validate(receipt_raw),
            validation=report,
            repair_cycles=repair_cycles,
        )
        await self._progress("completed", 1.0)
        return result

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
                provider_lock = getattr(self, "_provider_lock", None)
                if provider_lock is None:
                    provider_lock = asyncio.Lock()
                    self._provider_lock = provider_lock
                async with provider_lock:
                    now = asyncio.get_running_loop().time()
                    last_completion = getattr(
                        self, "_last_provider_completion", None
                    )
                    provider_spacing = getattr(self, "_provider_spacing", 0.0)
                    if last_completion is not None:
                        elapsed = now - last_completion
                        if elapsed < provider_spacing:
                            await asyncio.sleep(
                                provider_spacing - elapsed
                            )
                    try:
                        raw = await ctx.run_node(
                            agent,
                            node_input=_encode_payload(current_payload),
                            use_sub_branch=True,
                        )
                    finally:
                        self._last_provider_completion = (
                            asyncio.get_running_loop().time()
                        )
            except _ResourceExhaustedError:
                if attempt == 1:
                    raise
                await asyncio.sleep(RATE_LIMIT_RETRY_DELAY_SECONDS)
                continue
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
            if output_model is StorylineDraft:
                raw = _normalize_storyline_output(raw)
            if output_model in (ActivityPlan, ActivitySpec, RepairResult):
                raw = _normalize_activity_output(raw)
            if output_model is MediaPlan:
                raw = _normalize_media_output(raw)
            try:
                return output_model.model_validate(raw)
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
            self._agents["validator"],
            {"bundle": bundle_for_semantic_validation(bundle)},
            ValidationReport,
        )
        return merge_validation_reports(
            semantic, deterministic_issues(bundle, request)
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

    @staticmethod
    def _canonicalize_learning_references(
        storyline: StorylineDraft, references: list[OpenLearningImage]
    ) -> StorylineDraft:
        canonical = {
            str(reference.image_url): reference for reference in references
        }
        scenes = []
        used_urls: set[str] = set()
        for scene in storyline.scenes:
            learning_reference = scene.learning_reference
            source = (
                canonical.get(str(learning_reference.image_url))
                if learning_reference
                else None
            )
            if learning_reference and source:
                source_url = str(source.image_url)
                if source_url in used_urls:
                    learning_reference = None
                else:
                    used_urls.add(source_url)
                    learning_reference = learning_reference.model_copy(
                        update=source.model_dump(mode="python")
                    )
            elif learning_reference:
                learning_reference = None
            scenes.append(
                scene.model_copy(
                    update={"learning_reference": learning_reference}
                )
            )
        return storyline.model_copy(update={"scenes": scenes})

    @staticmethod
    def _assert_media_budget(
        plan: MediaPlan, request: StoryGenerationRequest
    ) -> None:
        if len(plan.images) > request.media_budget.max_images:
            raise ValidationFailure("Media plan exceeds the image budget")
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
        generated_image_keys = [
            AssetReference.model_validate(item).asset_key for item in image_assets
        ]
        expected_image_keys = [image.asset_key for image in plan.images]
        generated_image_counts = Counter(generated_image_keys)
        expected_image_counts = Counter(expected_image_keys)
        missing_images = sorted(
            (expected_image_counts - generated_image_counts).elements()
        )
        unexpected_images = sorted(
            (generated_image_counts - expected_image_counts).elements()
        )
        generated_audio_keys = [
            AssetReference.model_validate(item).asset_key for item in audio_assets
        ]
        expected_audio_keys = [plan.audio.asset_key] if plan.audio else []
        audio_complete = Counter(generated_audio_keys) == Counter(expected_audio_keys)
        planned_by_key = {image.asset_key: image for image in plan.images}
        missing_cover = any(
            planned_by_key[key].scene_id is None for key in missing_images
        )
        missing_scene_count = sum(
            planned_by_key[key].scene_id is not None for key in missing_images
        )
        too_many_missing_images = (
            missing_cover or missing_scene_count > MAX_MISSING_SCENE_IMAGES
        )
        if too_many_missing_images or unexpected_images or not audio_complete:
            details = []
            if missing_images:
                details.append(f"missing images: {missing_images}")
            if unexpected_images:
                details.append(f"unexpected images: {unexpected_images}")
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
        topic = (
            subject.topic_tags[0]
            if subject.topic_tags
            else subject.discipline
        )
        candidate_id = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")
        candidate_id = (candidate_id or "requested-topic")[:64].rstrip("-")
        if len(candidate_id) < 3:
            candidate_id = f"{candidate_id}-topic"
        sources = corpus.sources[:8]
        candidate = TopicCandidate(
            candidate_id=candidate_id,
            title=topic.replace("-", " ").title(),
            subject=subject,
            premise=(
                f"The learner leads a real-world {subject.discipline} decision "
                f"where understanding {topic} changes the outcome."
            ),
            learning_objectives=(
                subject.topic_tags[:4]
                or [f"Use {topic} to make a grounded decision."]
            ),
            why_now=(
                "The requested topic is directly relevant to the learner's current "
                "goal and is supported by the supplied research evidence."
            ),
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
                "Use coherent 16:9 still illustrations for the cover and every scene."
            ),
        )

    @staticmethod
    def _ensure_image_coverage(
        plan: MediaPlan,
        storyline: StorylineDraft,
        request: StoryGenerationRequest,
    ) -> MediaPlan:
        """Guarantees a cover plus one image per scene.

        The planner occasionally drops scenes or reuses an image across two of
        them. Rather than failing the run, we deterministically rebuild the
        missing briefs from the scene's own narrative and the style guide.
        """
        budget = request.media_budget.max_images
        scene_ids = [scene.scene_id for scene in storyline.scenes]
        by_scene: dict[str, ImageRequest] = {}
        cover: ImageRequest | None = None
        for image in plan.images:
            if image.scene_id is None:
                cover = cover or image
            elif image.scene_id in scene_ids and image.scene_id not in by_scene:
                by_scene[image.scene_id] = image

        style = plan.visual_style_guide
        if cover is None:
            cover = ImageRequest(
                asset_key="cover",
                scene_id=None,
                prompt=(
                    f"Story cover illustration for '{storyline.title}'. "
                    f"{storyline.synopsis} A single grounded moment showing the "
                    "central problem, one or two recurring adult characters "
                    "(all fictional adults age 21 or older) in the foreground, "
                    "ordinary lighting, ample negative space, no readable text, "
                    f"no logos. Style continuity: {style}"
                )[:1800],
                alt_text=f"Cover illustration for {storyline.title}"[:300],
                aspect_ratio="16:9",
            )

        images: list[ImageRequest] = [cover]
        for index, scene in enumerate(storyline.scenes):
            if len(images) >= budget:
                break
            existing = by_scene.get(scene.scene_id)
            if existing is not None:
                images.append(existing)
                continue
            beat = " ".join(scene.narrative)
            images.append(
                ImageRequest(
                    asset_key=f"scene-{index + 1}-{scene.scene_id}"[:80],
                    scene_id=scene.scene_id,
                    prompt=(
                        f"Animated cinematic story frame for '{scene.title}'. "
                        f"{beat} Visual cue: {scene.media_cue} Show a named "
                        "recurring character (a fictional adult age 21 or older) "
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
            "simulation": "slider",
            "reflection": "reflect",
            "slider": "slider",
        }
        scenes = [
            scene.model_copy(
                update={
                    "interaction_slot": (
                        by_scene[scene.scene_id].kind
                        if scene.scene_id in by_scene
                        else None
                    ),
                    "scene_type": (
                        scene_types[by_scene[scene.scene_id].kind.value]
                        if scene.scene_id in by_scene
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


def _normalize_storyline_output(raw: Any) -> Any:
    if not isinstance(raw, dict) or not isinstance(raw.get("scenes"), list):
        return raw
    fallbacks = [
        "Start with the visible change in the scene.",
        "Connect that clue to the simple cause-and-effect model.",
        "Choose the action that changes the cause, not only the symptom.",
    ]
    for scene in raw["scenes"]:
        if not isinstance(scene, dict):
            continue
        hints = scene.get("hints")
        if not isinstance(hints, list) or len(hints) >= 3:
            continue
        scene["hints"] = [
            *hints,
            *fallbacks[len(hints) : 3],
        ]
    return raw


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
            if "age 21 or older" not in prompt.lower():
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
        if issue.component.value != "activities":
            continue
        path = issue.path
        has_specific_identifier = any(
            identifier in path for identifier in identifiers
        )
        is_broad = not any(character.isdigit() for character in path)
        if has_specific_identifier or is_broad:
            selected.append(issue.model_dump(mode="json"))
    return selected
