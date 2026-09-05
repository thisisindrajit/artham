"""Deterministic and provider-backed Google ADK workflow nodes."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from google.adk.agents import Context
from google.adk.workflow import Node
from google.genai import errors as genai_errors
from pydantic import PrivateAttr

from .contracts import (
    ActivityPlan,
    AssetKind,
    AssetReference,
    BackendStoryWrite,
    EmbeddingRecord,
    EngagementProfile,
    GeneratedStoryBundle,
    MediaPlan,
    PersistenceReceipt,
    ResearchCorpus,
    SelectedTopic,
    StoryGenerationRequest,
    StorylineDraft,
    ValidationReport,
    VideoDecision,
)
from .constants import (
    IMAGE_BATCH_TIMEOUT_SECONDS,
    IMAGE_RATE_LIMIT_COOLDOWN_SECONDS,
    IMAGE_REQUEST_SPACING_SECONDS,
    IMAGE_REQUEST_TIMEOUT_SECONDS,
    IMAGE_RETRY_SPACING_SECONDS,
)
from .clients.vertex import GeneratedBinary, minimal_safe_image_prompt
from .errors import BackendError, ProviderError
from .runtime import PipelineRuntime

logger = logging.getLogger(__name__)


class RuntimeNode(Node):
    _runtime: PipelineRuntime = PrivateAttr()

    def __init__(self, *, name: str, runtime: PipelineRuntime, **kwargs: Any) -> None:
        super().__init__(name=name, **kwargs)
        self._runtime = runtime


class EngagementLoaderAgent(RuntimeNode):
    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        request = StoryGenerationRequest.model_validate(node_input)
        yield await self._runtime.backend.get_engagement(request.learner_id)


class TopicResearchAgent(RuntimeNode):
    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        request = StoryGenerationRequest.model_validate(node_input)
        yield await self._runtime.exa.research_topics(request)


class CheckpointStateNode(Node):
    """Persist a generation checkpoint through the active ADK invocation."""

    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        ctx.state["checkpoint"] = node_input["checkpoint"]
        yield {"saved": True}


class ImageGenerationAgent(RuntimeNode):
    """Generates every planned image, paced to stay inside the images-per-minute
    quota. Failures are retried once in a second, slower pass so scenes keep
    their illustration instead of silently losing it."""

    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        job_id = str(node_input["job_id"])
        plan = MediaPlan.model_validate(node_input["media_plan"])
        checkpoint = self._runtime.checkpoints.setdefault(job_id, {})
        planned_keys = {request.asset_key for request in plan.images}
        assets = [
            AssetReference.model_validate(item)
            for item in checkpoint.get("image_assets", [])
            if isinstance(item, dict) and item.get("asset_key") in planned_keys
        ]
        completed_keys = {asset.asset_key for asset in assets}
        deadline = asyncio.get_running_loop().time() + IMAGE_BATCH_TIMEOUT_SECONDS
        pending = [
            request
            for request in plan.images
            if request.asset_key not in completed_keys
        ]
        spacing = IMAGE_REQUEST_SPACING_SECONDS
        first_request = True
        style_reference: GeneratedBinary | None = None

        for attempt in range(2):
            retry: list[Any] = []
            cooldown = False
            for request in pending:
                remaining = deadline - asyncio.get_running_loop().time()
                if remaining <= 0:
                    break
                wait = 0.0 if first_request else spacing
                if cooldown:
                    wait = max(wait, IMAGE_RATE_LIMIT_COOLDOWN_SECONDS)
                if wait > 0:
                    await asyncio.sleep(min(wait, remaining))
                    remaining = deadline - asyncio.get_running_loop().time()
                    if remaining <= 0:
                        break
                first_request = False
                cooldown = False
                try:
                    binary = await asyncio.wait_for(
                        self._runtime.media.generate_image(
                            request,
                            reference=(
                                style_reference
                                if request.scene_id is not None
                                else None
                            ),
                        ),
                        timeout=min(IMAGE_REQUEST_TIMEOUT_SECONDS, remaining),
                    )
                except (ProviderError, TimeoutError) as exc:
                    cooldown = True
                    logger.warning(
                        "image %s failed on pass %s: %s: %s",
                        request.asset_key,
                        attempt + 1,
                        type(exc).__name__,
                        exc,
                    )
                    retry.append(request)
                    continue
                except genai_errors.ClientError as exc:
                    if exc.code == 429:
                        cooldown = True
                        logger.warning(
                            "image %s hit 429 on pass %s",
                            request.asset_key,
                            attempt + 1,
                        )
                        retry.append(request)
                        continue
                    raise
                if request.scene_id is None:
                    style_reference = binary
                try:
                    uploaded = await self._runtime.backend.upload_asset(
                        job_id=job_id,
                        asset_key=request.asset_key,
                        kind=AssetKind.IMAGE,
                        generated=binary,
                        scene_id=request.scene_id,
                        alt_text=request.alt_text,
                    )
                except BackendError as exc:
                    if "UPLOAD_INTENT_CONFLICT" in str(exc):
                        logger.warning(
                            "omitting optional image %s after upload conflict",
                            request.asset_key,
                        )
                        continue
                    # The image itself generated fine but the upload didn't
                    # verifiably land in storage. Give it the same second
                    # chance as a generation failure rather than trusting a
                    # reference that may point at nothing.
                    cooldown = True
                    logger.warning(
                        "image %s upload failed on pass %s: %s",
                        request.asset_key,
                        attempt + 1,
                        exc,
                    )
                    retry.append(request)
                    continue
                assets.append(uploaded)
                checkpoint["image_assets"] = [
                    asset.model_dump(mode="json") for asset in assets
                ]
            if not retry or attempt == 1:
                if retry:
                    logger.warning(
                        "giving up on %s image(s): %s",
                        len(retry),
                        [item.asset_key for item in retry],
                    )
                break
            # Second pass: simplified, safety-neutral briefs. Most first-pass
            # misses are transient safety blocks on a dense cinematic prompt.
            pending = [
                item.model_copy(
                    update={"prompt": minimal_safe_image_prompt(item)}
                )
                for item in retry
            ]
            spacing = IMAGE_RETRY_SPACING_SECONDS
            first_request = True
        yield assets


class AudioGenerationAgent(RuntimeNode):
    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        job_id = str(node_input["job_id"])
        plan = MediaPlan.model_validate(node_input["media_plan"])
        if not plan.audio:
            yield []
            return
        checkpoint = self._runtime.checkpoints.setdefault(job_id, {})
        cached = [
            AssetReference.model_validate(item)
            for item in checkpoint.get("audio_assets", [])
            if isinstance(item, dict)
            and item.get("asset_key") == plan.audio.asset_key
        ]
        if cached:
            yield cached
            return
        try:
            binary = await self._runtime.vertex.generate_audio(plan.audio)
        except (ProviderError, genai_errors.ClientError):
            yield []
            return
        try:
            asset = await self._runtime.backend.upload_asset(
                job_id=job_id,
                asset_key=plan.audio.asset_key,
                kind=AssetKind.AUDIO,
                generated=binary,
            )
        except BackendError as exc:
            # Background audio is optional: an unverifiable upload should
            # drop the audio, not fail the whole story.
            logger.warning("dropping background audio after upload failure: %s", exc)
            yield []
            return
        checkpoint["audio_assets"] = [asset.model_dump(mode="json")]
        yield [asset]


class EmbeddingGenerationAgent(RuntimeNode):
    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        selected = SelectedTopic.model_validate(node_input["selected_topic"])
        storyline = StorylineDraft.model_validate(node_input["storyline"])
        mode = str(node_input["mode"])

        items: list[tuple[str, str, str]] = []
        if mode == "story":
            items.extend(
                [
                    (
                        f"topic:{selected.candidate.candidate_id}",
                        "topic",
                        " ".join(
                            [
                                selected.candidate.title,
                                selected.candidate.premise,
                                *selected.candidate.learning_objectives,
                            ]
                        ),
                    ),
                    (
                        f"story:{storyline.story_id}",
                        "story",
                        " ".join(
                            [
                                storyline.title,
                                storyline.synopsis,
                                storyline.takeaway,
                                *storyline.learning_objectives,
                            ]
                        ),
                    ),
                ]
            )
            items.extend(
                (
                    f"scene:{scene.scene_id}",
                    "scene",
                    " ".join(
                        [
                            scene.title,
                            *scene.narrative,
                            scene.learning_purpose,
                        ]
                    ),
                )
                for scene in storyline.scenes
            )
        elif mode == "activities":
            activities = ActivityPlan.model_validate(node_input["activities"])
            items.extend(
                (
                    f"activity:{activity.activity_id}",
                    "activity",
                    activity.model_dump_json(exclude_none=True),
                )
                for activity in activities.activities
            )
        else:
            raise ValueError(f"Unsupported embedding mode: {mode}")
        yield await self._runtime.vertex.embed(items)


class CollatorAgent(Node):
    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        assets = [
            AssetReference.model_validate(item)
            for group in node_input["asset_groups"]
            for item in group
        ]
        yield GeneratedStoryBundle(
            generation_job_id=str(node_input["job_id"]),
            learner_id=str(node_input["learner_id"]),
            selected_topic=SelectedTopic.model_validate(
                node_input["selected_topic"]
            ),
            storyline=StorylineDraft.model_validate(node_input["storyline"]),
            activities=ActivityPlan.model_validate(node_input["activities"]),
            media_plan=MediaPlan.model_validate(node_input["media_plan"]),
            video_decision=VideoDecision.model_validate(
                node_input["video_decision"]
            ),
            assets=assets,
            embeddings=[
                EmbeddingRecord.model_validate(item)
                for item in node_input["embeddings"]
            ],
            created_at=datetime.now(UTC),
        )


class PersistenceAgent(RuntimeNode):
    async def run_node_impl(
        self, *, ctx: Context, node_input: Any
    ) -> AsyncGenerator[Any, None]:
        write = BackendStoryWrite(
            idempotency_key=str(node_input["idempotency_key"]),
            bundle=GeneratedStoryBundle.model_validate(node_input["bundle"]),
            validation=ValidationReport.model_validate(
                node_input["validation"]
            ),
        )
        yield await self._runtime.backend.persist_story(write)


def build_provider_nodes(runtime: PipelineRuntime) -> dict[str, Node]:
    return {
        "checkpoint": CheckpointStateNode(name="checkpoint_state"),
        "engagement": EngagementLoaderAgent(
            name="engagement_loader",
            runtime=runtime,
            input_schema=StoryGenerationRequest,
            output_schema=EngagementProfile,
            timeout=120,
        ),
        "research": TopicResearchAgent(
            name="exa_topic_researcher",
            runtime=runtime,
            input_schema=StoryGenerationRequest,
            output_schema=ResearchCorpus,
            timeout=90,
        ),
        "images": ImageGenerationAgent(
            name="imagen_generator",
            runtime=runtime,
            output_schema=list[AssetReference],
            timeout=IMAGE_BATCH_TIMEOUT_SECONDS + 30,
        ),
        "audio": AudioGenerationAgent(
            name="lyria_generator",
            runtime=runtime,
            output_schema=list[AssetReference],
            timeout=240,
        ),
        "story_embeddings": EmbeddingGenerationAgent(
            name="story_embedding_generator",
            runtime=runtime,
            output_schema=list[EmbeddingRecord],
            timeout=180,
        ),
        "activity_embeddings": EmbeddingGenerationAgent(
            name="activity_embedding_generator",
            runtime=runtime,
            output_schema=list[EmbeddingRecord],
            timeout=180,
        ),
        "collator": CollatorAgent(
            name="story_collator",
            output_schema=GeneratedStoryBundle,
        ),
        "persistence": PersistenceAgent(
            name="story_persistence",
            runtime=runtime,
            output_schema=PersistenceReceipt,
            timeout=600,
        ),
    }
