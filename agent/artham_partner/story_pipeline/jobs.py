"""In-memory asynchronous job lifecycle for the backend-less phase."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import hashlib
import logging
import uuid

from google.adk.apps import App, ResumabilityConfig
from google.adk.events import Event, EventActions
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types
from pydantic import ValidationError
from sqlalchemy.pool import StaticPool

from .contracts import (
    GenerationMetadata,
    JobState,
    StoryGenerationRequest,
    StoryGenerationResult,
    StoryJobAccepted,
    StoryJobStatus,
    TokenUsage,
)
from .errors import BackendError, JobConflictError, JobNotFoundError
from .runtime import PipelineRuntime
from .workflow import build_story_workflow

APP_NAME = "artham_story_generation"
USER_ID = "story_pipeline"

logger = logging.getLogger(__name__)


class StoryJobManager:
    def __init__(self, runtime: PipelineRuntime) -> None:
        self._runtime = runtime
        session_database_url = runtime.settings.session_database_url
        session_kwargs = (
            {"poolclass": StaticPool}
            if session_database_url.endswith(":memory:")
            else {}
        )
        self._sessions = DatabaseSessionService(
            db_url=session_database_url,
            **session_kwargs,
        )
        self._jobs: dict[str, StoryJobStatus] = {}
        self._tasks: dict[str, asyncio.Task[None]] = {}
        self._idempotency: dict[str, tuple[str, str]] = {}
        self._lock = asyncio.Lock()
        self._session_lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Restore durable jobs and resume work interrupted by a restart."""
        response = await self._sessions.list_sessions(
            app_name=APP_NAME,
            user_id=USER_ID,
        )
        for session in response.sessions:
            state = session.state or {}
            status_raw = state.get("job_status")
            request_raw = state.get("request")
            fingerprint = state.get("fingerprint")
            if not (
                isinstance(status_raw, dict)
                and isinstance(request_raw, dict)
                and isinstance(fingerprint, str)
            ):
                continue
            try:
                status = StoryJobStatus.model_validate(status_raw)
                request = StoryGenerationRequest.model_validate(request_raw)
            except ValidationError:
                logger.warning(
                    "Skipping invalid restored job session %s",
                    session.id,
                    exc_info=True,
                )
                continue
            self._jobs[status.job_id] = status
            self._idempotency[request.idempotency_key] = (
                status.job_id,
                fingerprint,
            )
            checkpoint = state.get("checkpoint")
            if isinstance(checkpoint, dict):
                self._runtime.checkpoints[status.job_id] = checkpoint
            if status.state in {JobState.QUEUED, JobState.RUNNING}:
                self._jobs[status.job_id] = status.model_copy(
                    update={
                        "state": JobState.QUEUED,
                        "stage": "resuming_after_restart",
                        "updated_at": datetime.now(UTC),
                        "invocation_id": None,
                    }
                )
                self._tasks[status.job_id] = asyncio.create_task(
                    self._run(status.job_id, request),
                    name=f"story-generation-restart-{status.job_id}",
                )

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
                if self._jobs[job_id].state is JobState.FAILED:
                    self._jobs[job_id] = self._jobs[job_id].model_copy(
                        update={
                            "state": JobState.QUEUED,
                            "stage": "resuming",
                            "updated_at": datetime.now(UTC),
                            "error_code": None,
                            "error_message": None,
                            "invocation_id": None,
                        }
                    )
                    self._tasks[job_id] = asyncio.create_task(
                        self._run(job_id, request),
                        name=f"story-generation-resume-{job_id}",
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
                session_id=f"story-{job_id}",
            )
            self._idempotency[request.idempotency_key] = (
                job_id,
                fingerprint,
            )
            await self._sessions.create_session(
                app_name=APP_NAME,
                user_id=USER_ID,
                session_id=f"story-{job_id}",
                state={
                    "job_status": self._jobs[job_id].model_dump(mode="json"),
                    "request": request.model_dump(mode="json"),
                    "fingerprint": fingerprint,
                    "checkpoint": {},
                },
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
                        "stage": "cancelled",
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
            await self._persist_state(job_id)
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
        await self._sessions.close()
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
                persist=False,
            )

        try:
            await progress("starting", 0.01)
            workflow = build_story_workflow(
                runtime=self._runtime,
                job_id=job_id,
                progress=progress,
            )
            app = App(
                name=APP_NAME,
                root_agent=workflow,
                resumability_config=ResumabilityConfig(is_resumable=True),
            )
            runner = Runner(
                app=app,
                session_service=self._sessions,
            )
            session = await self._sessions.get_session(
                app_name=APP_NAME,
                user_id=USER_ID,
                session_id=session_id,
            )
            if session is None:
                session = await self._sessions.create_session(
                    app_name=APP_NAME,
                    user_id=USER_ID,
                    session_id=session_id,
                    state={
                        "job_status": self._jobs[job_id].model_dump(mode="json"),
                        "request": request.model_dump(mode="json"),
                        "fingerprint": hashlib.sha256(
                            request.model_dump_json().encode("utf-8")
                        ).hexdigest(),
                        "checkpoint": self._runtime.checkpoints.get(job_id, {}),
                    },
                )
            checkpoint = session.state.get("checkpoint")
            if isinstance(checkpoint, dict):
                self._runtime.checkpoints[job_id] = checkpoint
            message = types.Content(
                role="user",
                parts=[types.Part(text=request.model_dump_json())],
            )
            final_output = None
            usage = TokenUsage()
            usage_by_agent: dict[str, TokenUsage] = {}
            model_versions: set[str] = set()
            invocation_id = self._jobs[job_id].invocation_id
            for attempt in range(2):
                run_arguments = {
                    "user_id": USER_ID,
                    "session_id": session_id,
                    (
                        "invocation_id" if invocation_id else "new_message"
                    ): invocation_id or message,
                }
                final_output = None
                try:
                    async for event in runner.run_async(**run_arguments):
                        event_usage = event.usage_metadata
                        if event_usage is not None:
                            delta = TokenUsage(
                                input_tokens=event_usage.prompt_token_count or 0,
                                output_tokens=event_usage.candidates_token_count or 0,
                                thoughts_tokens=event_usage.thoughts_token_count or 0,
                                total_tokens=event_usage.total_token_count or 0,
                            )
                            usage = _add_usage(usage, delta)
                            agent_name = event.author or "unknown"
                            usage_by_agent[agent_name] = _add_usage(
                                usage_by_agent.get(agent_name, TokenUsage()),
                                delta,
                            )
                        if event.model_version:
                            model_versions.add(event.model_version)
                        if event.invocation_id and not invocation_id:
                            invocation_id = event.invocation_id
                            status = await self.get(job_id)
                            await self._update(
                                job_id,
                                state=JobState.RUNNING,
                                stage=status.stage,
                                progress=status.progress,
                                invocation_id=invocation_id,
                                persist=False,
                            )
                        if event.output is not None:
                            final_output = event.output
                    break
                except Exception as exc:
                    if (
                        attempt == 0
                        and invocation_id is not None
                        and _is_stale_session_error(exc)
                    ):
                        status = await self.get(job_id)
                        invocation_id = None
                        await self._update(
                            job_id,
                            state=JobState.RUNNING,
                            stage=status.stage,
                            progress=status.progress,
                            invocation_id=None,
                            persist=False,
                        )
                        logger.info(
                            "Retrying story job %s with a fresh invocation after stale session",
                            job_id,
                        )
                        continue
                    raise
            if final_output is None:
                raise RuntimeError("Story workflow returned no final output")
            result = StoryGenerationResult.model_validate(final_output).model_copy(
                update={
                    "metadata": GenerationMetadata(
                        usage=usage,
                        usage_by_agent=usage_by_agent,
                        model_versions=sorted(model_versions),
                    )
                }
            )
            await self._update(
                job_id,
                state=JobState.SUCCEEDED,
                stage="completed",
                progress=1,
                result=result,
            )
            self._runtime.checkpoints.pop(job_id, None)
        except asyncio.CancelledError:
            if (await self.get(job_id)).state is not JobState.CANCELLED:
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
            if not _is_persistence_timeout(exc):
                await self._cleanup_job_assets(job_id)
    async def _cleanup_job_assets(self, job_id: str) -> None:
        """Best-effort deletion of any media this job uploaded before failing.

        Every asset uploaded by a failed job is uncommitted in the backend.
        Deleting them here removes the need to clean up stale DB/GCS data by
        hand after each failure. Asset-dependent checkpoints are invalidated
        so a resumed job regenerates media instead of reusing deleted IDs.
        Cleanup failures are logged, not raised, so they never mask the
        original job error.
        """
        try:
            result = await self._runtime.backend.delete_job_assets(job_id)
        except BackendError:
            logger.warning(
                "Failed to clean up media assets for failed job %s",
                job_id,
                exc_info=True,
            )
            return
        checkpoint = self._runtime.checkpoints.get(job_id)
        if isinstance(checkpoint, dict):
            for key in (
                "image_assets",
                "audio_assets",
                "validated_bundle",
                "validation_report",
                "repair_cycles",
            ):
                checkpoint.pop(key, None)
            await self._persist_state(job_id)
        if result.deleted_assets:
            logger.info(
                "Cleaned up %d orphaned media asset(s) for failed job %s",
                result.deleted_assets,
                job_id,
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
        invocation_id: str | None = None,
        persist: bool = True,
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
                    "invocation_id": (
                        invocation_id
                        if invocation_id is not None
                        else current.invocation_id
                    ),
                }
            )
        if persist:
            await self._persist_state(job_id)

    async def _persist_state(self, job_id: str) -> None:
        status = self._jobs[job_id]
        if status.session_id is None:
            return
        async with self._session_lock:
            session = await self._sessions.get_session(
                app_name=APP_NAME,
                user_id=USER_ID,
                session_id=status.session_id,
            )
            if session is None:
                return
            await self._sessions.append_event(
                session,
                Event(
                    invocation_id=status.invocation_id or "",
                    author="story_job_manager",
                    actions=EventActions(
                        state_delta={
                            "job_status": status.model_dump(mode="json"),
                            "checkpoint": self._runtime.checkpoints.get(
                                job_id, {}
                            ),
                        }
                    ),
                ),
            )

    @staticmethod
    def _accepted(job_id: str) -> StoryJobAccepted:
        return StoryJobAccepted(
            job_id=job_id,
            status_url=f"/story-jobs/{job_id}",
        )


def _add_usage(total: TokenUsage, delta: TokenUsage) -> TokenUsage:
    return TokenUsage(
        input_tokens=total.input_tokens + delta.input_tokens,
        output_tokens=total.output_tokens + delta.output_tokens,
        thoughts_tokens=total.thoughts_tokens + delta.thoughts_tokens,
        total_tokens=total.total_tokens + delta.total_tokens,
    )


def _is_persistence_timeout(exc: Exception) -> bool:
    message = str(exc).lower()
    return "story_persistence" in message and "timed out" in message


def _is_stale_session_error(exc: Exception) -> bool:
    name = type(exc).__name__.lower()
    message = str(exc).lower()
    return (
        "stalesession" in name
        or "stale_session" in name
        or "stale session" in message
        or "stalesession" in message
    )
