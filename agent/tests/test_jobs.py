from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
import unittest
from unittest.mock import AsyncMock, patch

from google.adk.agents import Context
from google.adk.workflow import Node, Workflow

from artham_partner.story_pipeline.contracts import (
    JobMediaCleanupResult,
    JobState,
    StoryGenerationRequest,
)
from artham_partner.story_pipeline.errors import JobConflictError
from artham_partner.story_pipeline.jobs import (
    StoryJobManager,
    _is_persistence_timeout,
    _is_stale_session_error,
)

from tests.helpers import settings


class BlockingNode(Node):
    async def run_node_impl(
        self, *, ctx: Context, node_input
    ) -> AsyncGenerator:
        await asyncio.sleep(60)
        yield {"never": "reached"}


class FailingNode(Node):
    async def run_node_impl(
        self, *, ctx: Context, node_input
    ) -> AsyncGenerator:
        raise RuntimeError("boom")
        yield  # pragma: no cover - unreachable, keeps this an async generator


class FakeBackend:
    def __init__(self) -> None:
        self.cleanup_calls: list[str] = []

    async def delete_job_assets(self, job_id: str) -> JobMediaCleanupResult:
        self.cleanup_calls.append(job_id)
        return JobMediaCleanupResult(
            job_id=job_id, deleted_assets=2, skipped_committed_assets=0
        )


class FakeRuntime:
    def __init__(self) -> None:
        self.settings = settings()
        self.closed = False
        self.checkpoints: dict[str, dict] = {}
        self.backend = FakeBackend()

    async def close(self) -> None:
        self.closed = True


def blocking_workflow(**kwargs) -> Workflow:
    return Workflow(
        name="blocking_workflow",
        edges=[("START", BlockingNode(name="blocking_node"))],
    )


def failing_workflow(**kwargs) -> Workflow:
    return Workflow(
        name="failing_workflow",
        edges=[("START", FailingNode(name="failing_node"))],
    )


class JobManagerTests(unittest.IsolatedAsyncioTestCase):
    def test_persistence_timeout_preserves_retryable_assets(self) -> None:
        self.assertTrue(
            _is_persistence_timeout(
                RuntimeError(
                    "Node 'story_persistence' timed out after 300.0 seconds."
                )
            )
        )
        self.assertFalse(_is_persistence_timeout(RuntimeError("boom")))

    def test_stale_session_error_detection(self) -> None:
        stale_error = type("StaleSessionError", (Exception,), {})

        self.assertTrue(
            _is_stale_session_error(
                stale_error("Invocation is stale for this session.")
            )
        )
        self.assertTrue(
            _is_stale_session_error(
                RuntimeError("STALESESSIONERROR: invocation expired")
            )
        )
        self.assertFalse(_is_stale_session_error(RuntimeError("boom")))

    async def test_cleanup_invalidates_asset_dependent_checkpoints(self) -> None:
        runtime = FakeRuntime()
        manager = StoryJobManager(runtime)  # type: ignore[arg-type]
        runtime.checkpoints["job-id"] = {
            "storyline": {"kept": True},
            "image_assets": [{"asset_key": "cover"}],
            "audio_assets": [{"asset_key": "audio"}],
            "validated_bundle": {"assets": []},
            "validation_report": {"is_valid": True},
            "repair_cycles": 1,
        }

        with patch.object(
            manager, "_persist_state", new=AsyncMock()
        ) as persist_state:
            await manager._cleanup_job_assets("job-id")

        self.assertEqual(
            runtime.checkpoints["job-id"],
            {"storyline": {"kept": True}},
        )
        persist_state.assert_awaited_once_with("job-id")
        await manager.close()

    async def test_failed_job_cleans_up_uploaded_media(self) -> None:
        runtime = FakeRuntime()
        manager = StoryJobManager(runtime)  # type: ignore[arg-type]
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="cleanup-key",
        )
        with patch(
            "artham_partner.story_pipeline.jobs.build_story_workflow",
            failing_workflow,
        ):
            job = await manager.create(request)
            for _ in range(50):
                status = await manager.get(job.job_id)
                if (
                    status.state is JobState.FAILED
                    and runtime.backend.cleanup_calls
                ):
                    break
                await asyncio.sleep(0.05)

        status = await manager.get(job.job_id)
        self.assertEqual(status.state, JobState.FAILED)
        self.assertEqual(runtime.backend.cleanup_calls, [job.job_id])
        await manager.close()

    async def test_failed_job_is_resumed_with_same_id(self) -> None:
        runtime = FakeRuntime()
        manager = StoryJobManager(runtime)  # type: ignore[arg-type]
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="retry-key",
        )

        async def fail_run(job_id: str, _: StoryGenerationRequest) -> None:
            await manager._update(
                job_id,
                state=JobState.FAILED,
                stage="failed",
                progress=0.4,
                error_code="FAILED",
                error_message="failed",
            )

        with patch.object(manager, "_run", side_effect=fail_run):
            first = await manager.create(request)
            await asyncio.sleep(0)
            runtime.checkpoints[first.job_id] = {
                "storyline": {"kept": True}
            }
            resumed = await manager.create(request)
            await asyncio.sleep(0)

        self.assertEqual(resumed.job_id, first.job_id)
        self.assertEqual(
            runtime.checkpoints[first.job_id]["storyline"],
            {"kept": True},
        )
        self.assertEqual((await manager.get(first.job_id)).state, JobState.FAILED)
        await manager.close()

    async def test_idempotency_and_cancellation(self) -> None:
        runtime = FakeRuntime()
        manager = StoryJobManager(runtime)  # type: ignore[arg-type]
        request = StoryGenerationRequest(
            learner_id="learner",
            idempotency_key="request-key",
        )
        with patch(
            "artham_partner.story_pipeline.jobs.build_story_workflow",
            blocking_workflow,
        ):
            first = await manager.create(request)
            second = await manager.create(request)
            self.assertEqual(first.job_id, second.job_id)

            await asyncio.sleep(0)
            cancelled = await manager.cancel(first.job_id)
            self.assertEqual(cancelled.state, JobState.CANCELLED)
            repeated = await manager.cancel(first.job_id)
            self.assertEqual(repeated.state, JobState.CANCELLED)
            await asyncio.sleep(0.01)
            final = await manager.get(first.job_id)
            self.assertEqual(final.stage, "cancelled")

            with self.assertRaises(JobConflictError):
                await manager.create(
                    request.model_copy(update={"target_age": 19})
                )
            await manager.close()
        self.assertTrue(runtime.closed)


if __name__ == "__main__":
    unittest.main()
