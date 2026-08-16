"""HTTP surface for the Artham partner agent.

Three purpose-built endpoints instead of a generic chat API: the frontend
already knows what it wants at each moment, and a narrow surface keeps the
number of model calls per session in the 3-8 range the product targets.

Run locally:
    uvicorn artham_partner.server:app --port 8080 --reload
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

# Loaded before the agents module reads ARTHAM_MODEL / Vertex settings.
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from .agents import MODEL, observe_agent, prelude_agent, profile_agent  # noqa: E402
from .contracts import (  # noqa: E402
    ObserveOutput,
    ObserveRequest,
    PreludeOutput,
    PreludeRequest,
    ProfileOutput,
    ProfileRequest,
)
from .runner import PartnerError, run_structured  # noqa: E402

logging.basicConfig(level=os.environ.get("ARTHAM_LOG_LEVEL", "INFO"))
logger = logging.getLogger("artham.server")

app = FastAPI(title="Artham Partner", version="0.1.0")

# The Next.js server calls this service server-side, but allow browser origins
# during local development so the ADK dev UI and the app can share it.
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
    """Reports configuration without calling the model."""
    configured = _vertex_enabled() or bool(
        os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    )
    return {
        "status": "ok",
        "model": MODEL,
        "backend": "vertex" if _vertex_enabled() else "gemini-api",
        "project": os.environ.get("GOOGLE_CLOUD_PROJECT"),
        "location": os.environ.get("GOOGLE_CLOUD_LOCATION"),
        "credentialsConfigured": configured,
    }


@app.post("/prelude", response_model=PreludeOutput)
async def prelude(request: PreludeRequest) -> PreludeOutput:
    return await _call(prelude_agent, request, PreludeOutput, timeout=20.0)


@app.post("/observe", response_model=ObserveOutput)
async def observe(request: ObserveRequest) -> ObserveOutput:
    # Kept tight: this one blocks the learner mid-scene.
    return await _call(observe_agent, request, ObserveOutput, timeout=12.0)


@app.post("/profile", response_model=ProfileOutput)
async def profile(request: ProfileRequest) -> ProfileOutput:
    return await _call(profile_agent, request, ProfileOutput, timeout=30.0)


async def _call(agent, request, output_model, timeout: float):
    try:
        return await run_structured(agent, request, output_model, timeout=timeout)
    except PartnerError as exc:
        logger.warning("partner call failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - the caller always has a fallback
        logger.exception("unexpected partner failure")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
