"""In-memory asynchronous job lifecycle for the backend-less phase."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import hashlib
import uuid

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from .contracts import (
    JobState,
    StoryGenerationRequest,
    StoryGenerationResult,
    StoryJobAccepted,
    StoryJobStatus,
)
from .errors import JobConflictError, JobNotFoundError
from .runtime import PipelineRuntime
from .workflow import build_story_workflow

APP_NAME = "artham_story_generation"
USER_ID = "story_pipeline"


class StoryJobManager:
    def __init__(self, runtime: PipelineRuntime) -> None:
        self._runtime = runtime
        self._sessions = InMemorySessionService()
        self._jobs: dict[str, StoryJobStatus] = {}
        self._tasks: dict[str, asyncio.Task[None]] = {}
        self._idempotency: dict[str, tuple[str, str]] = {}
        self._lock = asyncio.Lock()

    async def create(
        self, request: StoryGenerationRequest
    ) -> StoryJobAccepted:
        fingerprint = hashlib.sha256(
            request.model_dump_json().encode("utf-8")
        ).hexdigest()
        async with self._lock:
            existing = self._idempotency.get(request.idempotency_key)
            if existing:
                job_id, existing_fingerprint = existing
                if existing_fingerprint != fingerprint:
                    raise JobConflictError(
                        "Idempotency key was already used with another request"
                    )
                return self._accepted(job_id)

            job_id = uuid.uuid4().hex
            now = datetime.now(UTC)
            self._jobs[job_id] = StoryJobStatus(
                job_id=job_id,
                state=JobState.QUEUED,
                stage="queued",
                progress=0,
                created_at=now,
                updated_at=now,
            )
            self._idempotency[request.idempotency_key] = (
                job_id,
                fingerprint,
            )
            self._tasks[job_id] = asyncio.create_task(
                self._run(job_id, request),
                name=f"story-generation-{job_id}",
            )
            return self._accepted(job_id)

    async def get(self, job_id: str) -> StoryJobStatus:
        async with self._lock:
            status = self._jobs.get(job_id)
            if status is None:
                raise JobNotFoundError(f"Story job {job_id} was not found")
            return status.model_copy(deep=True)

    async def cancel(self, job_id: str) -> StoryJobStatus:
        async with self._lock:
            status = self._jobs.get(job_id)
            if status is None:
                raise JobNotFoundError(f"Story job {job_id} was not found")
            if status.state in {
                JobState.SUCCEEDED,
                JobState.FAILED,
                JobState.CANCELLED,
            }:
                return status.model_copy(deep=True)
            task = self._tasks.get(job_id)
            if task and not task.done():
                self._jobs[job_id] = status.model_copy(
                    update={
                        "state": JobState.CANCELLED,
                        "stage": "cancelling",
                        "updated_at": datetime.now(UTC),
                    }
                )
                task.cancel()
            elif status.state not in {
                JobState.SUCCEEDED,
                JobState.FAILED,
                JobState.CANCELLED,
            }:
                self._jobs[job_id] = status.model_copy(
                    update={
                        "state": JobState.CANCELLED,
                        "stage": "cancelled",
                        "updated_at": datetime.now(UTC),
                    }
                )
            return self._jobs[job_id].model_copy(deep=True)

    async def close(self) -> None:
        pending = [
            (job_id, task)
            for job_id, task in self._tasks.items()
            if not task.done()
        ]
        for job_id, task in pending:
            if self._jobs[job_id].state is not JobState.CANCELLED:
                task.cancel()
        tasks = [task for _, task in pending]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        await self._runtime.close()

    async def _run(
        self, job_id: str, request: StoryGenerationRequest
    ) -> None:
        session_id = f"story-{job_id}"

        async def progress(stage: str, value: float) -> None:
            await self._update(
                job_id,
                state=JobState.RUNNING,
                stage=stage,
                progress=value,
            )

        try:
            await progress("starting", 0.01)
            workflow = build_story_workflow(
                runtime=self._runtime,
                job_id=job_id,
                progress=progress,
            )
            runner = Runner(
                app_name=APP_NAME,
                node=workflow,
                session_service=self._sessions,
            )
            await self._sessions.create_session(
                app_name=APP_NAME,
                user_id=USER_ID,
                session_id=session_id,
            )
            message = types.Content(
                role="user",
                parts=[types.Part(text=request.model_dump_json())],
            )
            final_output = None
            async for event in runner.run_async(
                user_id=USER_ID,
                session_id=session_id,
                new_message=message,
            ):
                if event.output is not None:
                    final_output = event.output
            if final_output is None:
                raise RuntimeError("Story workflow returned no final output")
            result = StoryGenerationResult.model_validate(final_output)
            await self._update(
                job_id,
                state=JobState.SUCCEEDED,
                stage="completed",
                progress=1,
                result=result,
            )
        except asyncio.CancelledError:
            await self._update(
                job_id,
                state=JobState.CANCELLED,
                stage="cancelled",
                progress=(await self.get(job_id)).progress,
            )
            raise
        except Exception as exc:
            await self._update(
                job_id,
                state=JobState.FAILED,
                stage="failed",
                progress=(await self.get(job_id)).progress,
                error_code=type(exc).__name__.upper(),
                error_message=str(exc)[:1000],
            )
        finally:
            session = await self._sessions.get_session(
                app_name=APP_NAME,
                user_id=USER_ID,
                session_id=session_id,
            )
            if session is not None:
                await self._sessions.delete_session(
                    app_name=APP_NAME,
                    user_id=USER_ID,
                    session_id=session_id,
                )

    async def _update(
        self,
        job_id: str,
        *,
        state: JobState,
        stage: str,
        progress: float,
        result: StoryGenerationResult | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> None:
        async with self._lock:
            current = self._jobs[job_id]
            self._jobs[job_id] = current.model_copy(
                update={
                    "state": state,
                    "stage": stage,
                    "progress": progress,
                    "updated_at": datetime.now(UTC),
                    "result": result,
                    "error_code": error_code,
                    "error_message": error_message,
                }
            )

    @staticmethod
    def _accepted(job_id: str) -> StoryJobAccepted:
        return StoryJobAccepted(
            job_id=job_id,
            status_url=f"/story-jobs/{job_id}",
        )
