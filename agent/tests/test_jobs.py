from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
import unittest
from unittest.mock import patch

from google.adk.agents import Context
from google.adk.workflow import Node, Workflow

from artham_partner.story_pipeline.contracts import (
    JobState,
    StoryGenerationRequest,
)
from artham_partner.story_pipeline.errors import JobConflictError
from artham_partner.story_pipeline.jobs import StoryJobManager

from tests.helpers import settings


class BlockingNode(Node):
    async def run_node_impl(
        self, *, ctx: Context, node_input
    ) -> AsyncGenerator:
        await asyncio.sleep(60)
        yield {"never": "reached"}


class FakeRuntime:
    def __init__(self) -> None:
        self.settings = settings()
        self.closed = False

    async def close(self) -> None:
        self.closed = True


def blocking_workflow(**kwargs) -> Workflow:
    return Workflow(
        name="blocking_workflow",
        edges=[("START", BlockingNode(name="blocking_node"))],
    )


class JobManagerTests(unittest.IsolatedAsyncioTestCase):
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
