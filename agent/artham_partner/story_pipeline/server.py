"""FastAPI surface for asynchronous story-generation jobs."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from .config import PipelineSettings
from .contracts import (
    StoryGenerationRequest,
    StoryJobAccepted,
    StoryJobStatus,
)
from .errors import (
    JobConflictError,
    JobNotFoundError,
    ProviderError,
)
from .jobs import StoryJobManager
from .partner_contracts import (
    ObserveOutput,
    ObserveRequest,
    PreludeOutput,
    PreludeRequest,
    ProfileOutput,
    ProfileRequest,
)
from .partner_engine import FlashThinkingEngine
from .runtime import PipelineRuntime

logging.basicConfig(level=os.environ.get("ARTHAM_LOG_LEVEL", "INFO"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = PipelineSettings.from_env()
    runtime = PipelineRuntime.from_settings(settings)
    app.state.story_jobs = StoryJobManager(runtime)
    app.state.thinking_engine = FlashThinkingEngine(runtime.vertex)
    try:
        yield
    finally:
        await app.state.story_jobs.close()


app = FastAPI(
    title="Artham Story Pipeline",
    version="0.2.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ARTHAM_ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


def _vertex_enabled() -> bool:
    return os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").upper() in {
        "1",
        "TRUE",
        "YES",
    }


@app.get("/health")
async def health() -> dict:
    settings = PipelineSettings.from_env()
    return {
        "status": "ok",
        "project": settings.google_cloud_project,
        "location": settings.google_cloud_location,
        "vertexConfigured": _vertex_enabled()
        and bool(settings.google_cloud_project),
        "exaConfigured": bool(settings.exa_api_key),
        "backendConfigured": bool(
            settings.backend_base_url and settings.backend_api_key
        ),
        "models": {
            "pipeline": settings.pipeline_model,
            "fast": settings.fast_model,
            "image": settings.image_model,
            "veo": settings.veo_model,
            "lyria": settings.lyria_model,
            "embedding": settings.embedding_model,
        },
    }


@app.post("/prelude", response_model=PreludeOutput)
async def create_prelude(
    payload: PreludeRequest,
    request: Request,
) -> PreludeOutput:
    try:
        return await _thinking_engine(request).prelude(payload)
    except ProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/observe", response_model=ObserveOutput)
async def observe_thinking(
    payload: ObserveRequest,
    request: Request,
) -> ObserveOutput:
    try:
        return await _thinking_engine(request).observe(payload)
    except ProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/profile", response_model=ProfileOutput)
async def create_thinking_profile(
    payload: ProfileRequest,
    request: Request,
) -> ProfileOutput:
    try:
        return await _thinking_engine(request).profile(payload)
    except ProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post(
    "/story-jobs",
    response_model=StoryJobAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_story_job(
    request: StoryGenerationRequest,
    http_request: Request,
) -> StoryJobAccepted:
    try:
        return await _jobs(http_request).create(request)
    except JobConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.get("/story-jobs/{job_id}", response_model=StoryJobStatus)
async def get_story_job(job_id: str, request: Request) -> StoryJobStatus:
    try:
        return await _jobs(request).get(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.delete(
    "/story-jobs/{job_id}",
    response_model=StoryJobStatus,
    status_code=status.HTTP_202_ACCEPTED,
)
async def cancel_story_job(job_id: str, request: Request) -> StoryJobStatus:
    try:
        return await _jobs(request).cancel(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def _jobs(request: Request) -> StoryJobManager:
    manager = getattr(request.app.state, "story_jobs", None)
    if manager is None:
        raise HTTPException(
            status_code=503, detail="Story job manager is not available"
        )
    return manager


def _thinking_engine(request: Request) -> FlashThinkingEngine:
    engine = getattr(request.app.state, "thinking_engine", None)
    if engine is None:
        raise HTTPException(
            status_code=503, detail="Thinking engine is not available"
        )
    return engine
