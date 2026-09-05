import asyncio
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import (
    GeneratedStory,
    Learner,
    LearnerPreferenceTag,
    LearnerStoryEngagement,
    MediaAsset,
)
from tests.conftest import FakeObjectStorage


def test_internal_routes_require_service_authentication(client: TestClient) -> None:
    response = client.get("/v1/internal/learners/learner_123/story-engagement")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_SERVICE_IDENTITY"
    assert response.headers["x-request-id"].startswith("req_")


def test_missing_engagement_is_a_cold_start(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get(
        "/v1/internal/learners/learner_123/story-engagement",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "ENGAGEMENT_NOT_FOUND"


def test_reads_latest_engagement_and_explainable_tags(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async def seed() -> None:
        async with session_factory.begin() as session:
            session.add(Learner(id="learner/engaged", preferred_difficulty="hard"))
            session.add(
                GeneratedStory(
                    id="story-engaged",
                    learner_id="learner/engaged",
                    current_version=1,
                )
            )
            session.add(
                LearnerStoryEngagement(
                    learner_id="learner/engaged",
                    story_id="story-engaged",
                    session_id="session-1",
                    topic="resonance in bridges",
                    subject_domain="natural sciences",
                    subject_discipline="physics",
                    topic_tags=["waves", "structures"],
                    completed=True,
                    completion_ratio=1,
                    active_seconds=512,
                    activity_correct=3,
                    activity_total=4,
                    hints_used=2,
                    learner_rating=4,
                    completed_at=datetime(2026, 8, 17, 10, 15, 30, tzinfo=UTC),
                )
            )
            session.add_all(
                [
                    LearnerPreferenceTag(
                        learner_id="learner/engaged",
                        kind="affinity",
                        tag="investigation",
                        evidence_count=4,
                        score=0.9,
                    ),
                    LearnerPreferenceTag(
                        learner_id="learner/engaged",
                        kind="fatigue",
                        tag="bridges",
                        evidence_count=3,
                        score=0.8,
                    ),
                ]
            )

    asyncio.run(seed())
    response = client.get(
        "/v1/internal/learners/learner%2Fengaged/story-engagement",
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["preferred_difficulty"] == "hard"
    assert body["affinity_tags"] == ["investigation"]
    assert body["fatigue_tags"] == ["bridges"]
    assert body["stories"][0]["activity_accuracy"] == 0.75
    assert body["stories"][0]["active_seconds"] == 512


def test_upload_intent_is_strict_and_idempotent(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    intent = {
        "job_id": "job-upload",
        "asset_key": "scene-b2-evidence",
        "kind": "image",
        "content_type": "image/webp",
        "byte_size": 348210,
        "sha256": "a" * 64,
    }
    first = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json=intent,
    )
    second = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json=intent,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["asset_id"] == second.json()["asset_id"]
    assert first.json()["headers"]["content-type"] == "image/webp"

    invalid = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json={**intent, "unexpected": True},
    )
    assert invalid.status_code == 400
    assert invalid.json()["error"]["code"] == "INVALID_REQUEST"

    conflict = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json={**intent, "sha256": "b" * 64},
    )
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "UPLOAD_INTENT_CONFLICT"


def test_delete_media_by_job_removes_only_uncommitted_assets(
    client: TestClient,
    auth_headers: dict[str, str],
    object_storage: FakeObjectStorage,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    orphan_intent = {
        "job_id": "job-failed",
        "asset_key": "scene-a-image",
        "kind": "image",
        "content_type": "image/webp",
        "byte_size": 200,
        "sha256": "d" * 64,
    }
    orphan_upload = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json=orphan_intent,
    )
    assert orphan_upload.status_code == 200
    orphan_storage_key = next(iter(object_storage.objects))
    assert orphan_storage_key in object_storage.objects

    committed_intent = {
        "job_id": "job-succeeded",
        "asset_key": "scene-opening",
        "kind": "image",
        "content_type": "image/webp",
        "byte_size": 100,
        "sha256": "c" * 64,
    }
    committed_upload = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json=committed_intent,
    )
    assert committed_upload.status_code == 200
    committed_storage_key = next(
        key
        for key in object_storage.objects
        if key != orphan_storage_key
    )

    async def mark_committed() -> None:
        async with session_factory.begin() as session:
            asset = await session.get(MediaAsset, committed_upload.json()["asset_id"])
            asset.commit_state = "committed"

    asyncio.run(mark_committed())

    orphan_cleanup = client.delete(
        "/v1/internal/media/by-job/job-failed",
        headers=auth_headers,
    )
    assert orphan_cleanup.status_code == 200
    assert orphan_cleanup.json() == {
        "job_id": "job-failed",
        "deleted_assets": 1,
        "skipped_committed_assets": 0,
    }
    assert orphan_storage_key not in object_storage.objects

    committed_cleanup = client.delete(
        "/v1/internal/media/by-job/job-succeeded",
        headers=auth_headers,
    )
    assert committed_cleanup.status_code == 200
    assert committed_cleanup.json() == {
        "job_id": "job-succeeded",
        "deleted_assets": 0,
        "skipped_committed_assets": 1,
    }
    assert committed_storage_key in object_storage.objects

    empty_cleanup = client.delete(
        "/v1/internal/media/by-job/job-never-existed",
        headers=auth_headers,
    )
    assert empty_cleanup.status_code == 200
    assert empty_cleanup.json() == {
        "job_id": "job-never-existed",
        "deleted_assets": 0,
        "skipped_committed_assets": 0,
    }


def test_persists_story_atomically_and_replays_receipt(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async def seed_learner() -> None:
        async with session_factory.begin() as session:
            session.add(Learner(id="learner_story"))

    asyncio.run(seed_learner())
    intent = {
        "job_id": "job-story",
        "asset_key": "scene-opening",
        "kind": "image",
        "content_type": "image/webp",
        "byte_size": 100,
        "sha256": "c" * 64,
    }
    upload = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json=intent,
    )
    assert upload.status_code == 200

    write = _story_write(upload.json())
    fact = "The bridge moves most strongly when a repeated push matches its natural rhythm."
    scene = write["bundle"]["storyline"]["scenes"][0]
    scene["reference_subject"] = "Bridge"
    scene["reference_fact"] = fact
    scene["reference_fact_citation_refs"] = [1]
    scene["learning_reference"] = {
        "title": "A bridge in motion",
        "image_url": "https://example.test/bridge.jpg",
        "source_page_url": "https://example.test/bridge",
        "source_name": "Bridge archive",
        "license_name": "Public domain",
        "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
        "alt_text": "A bridge spanning a river.",
        "plain_explanation": fact,
        "why_important": fact,
        "citation_refs": [1],
    }
    headers = {**auth_headers, "Idempotency-Key": write["idempotency_key"]}
    first = client.post(
        "/v1/internal/generated-stories",
        headers=headers,
        json=write,
    )
    replay = client.post(
        "/v1/internal/generated-stories",
        headers=headers,
        json=write,
    )

    assert first.status_code == 200, first.text
    assert replay.status_code == 200
    assert replay.json() == first.json()
    assert first.json()["story_id"] == "resonance-story"
    assert first.json()["version"] == 1
    listed = client.get("/api/v1/stories")
    read = client.get("/api/v1/stories/resonance-story")
    media = client.get(
        "/api/v1/stories/resonance-story/media/scene-opening"
    )

    assert listed.status_code == 200
    assert listed.json()[0]["story_id"] == "resonance-story"
    assert read.status_code == 200
    persisted_scene = read.json()["bundle"]["storyline"]["scenes"][0]
    assert persisted_scene["reference_fact"] == fact
    assert persisted_scene["reference_fact_citation_refs"] == [1]
    assert persisted_scene["learning_reference"]["plain_explanation"] == fact
    assert persisted_scene["learning_reference"]["citation_refs"] == [1]
    assert read.json()["media_urls"]["scene-opening"].endswith(
        "/api/v1/stories/resonance-story/media/scene-opening"
    )
    assert media.status_code == 200
    assert media.content

    changed = deepcopy(write)
    changed["validation"]["quality_score"] = 91
    conflict = client.post(
        "/v1/internal/generated-stories",
        headers=headers,
        json=changed,
    )
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "IDEMPOTENCY_KEY_CONFLICT"


def test_rejects_wrong_embedding_dimensions_before_persistence(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async def seed_learner() -> None:
        async with session_factory.begin() as session:
            session.add(Learner(id="learner_dimensions"))

    asyncio.run(seed_learner())
    upload = client.post(
        "/v1/internal/media/upload-intents",
        headers=auth_headers,
        json={
            "job_id": "job-dimensions",
            "asset_key": "scene-opening",
            "kind": "image",
            "content_type": "image/webp",
            "byte_size": 100,
            "sha256": "d" * 64,
        },
    )
    write = _story_write(
        upload.json(),
        learner_id="learner_dimensions",
        job_id="job-dimensions",
        idempotency_key="dimensions-request",
    )
    write["bundle"]["embeddings"][0]["vector"] = [0.1, 0.2]
    write["bundle"]["embeddings"][0]["dimensions"] = 2

    response = client.post(
        "/v1/internal/generated-stories",
        headers={**auth_headers, "Idempotency-Key": "dimensions-request"},
        json=write,
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_EMBEDDING_DIMENSIONS"


def _story_write(
    upload: dict[str, Any],
    *,
    learner_id: str = "learner_story",
    job_id: str = "job-story",
    idempotency_key: str = "story-request-2026",
) -> dict[str, Any]:
    source = {
        "title": "Bridge resonance research",
        "url": "https://example.test/research",
        "published_at": "2026-08-18T12:00:00Z",
        "excerpt": "A sufficiently detailed source excerpt about bridge resonance.",
        "source_name": "Example Research",
    }
    scenes = [
        {
            "scene_id": f"scene-{index}",
            "act": 1 if index < 2 else 2 if index < 4 else 3,
            "title": f"Scene {index}",
            "narrative": ["The investigation advances through measured evidence."],
            "learning_purpose": "Connect observed evidence to resonance principles.",
            "interaction_slot": "quiz" if index == 1 else None,
            "choices": [],
            "next_scene_id": f"scene-{index + 1}" if index < 5 else None,
            "media_cue": "Show measured bridge motion clearly.",
        }
        for index in range(1, 6)
    ]
    quiz = {
        "activity_id": "activity-quiz",
        "scene_id": "scene-1",
        "kind": "quiz",
        "learning_objective": "Identify resonance from measured evidence.",
        "quiz": {
            "prompt": "Which observation best supports resonance?",
            "options": [
                {"option_id": "a", "label": "Amplitude grows near one frequency"},
                {"option_id": "b", "label": "Every frequency behaves identically"},
                {"option_id": "c", "label": "The bridge has no measurable motion"},
            ],
            "correct_option_ids": ["a"],
            "explanation": "Resonance produces a peak response near a natural frequency.",
        },
        "reorder": None,
        "simulation": None,
        "reflection": None,
    }
    reflection = {
        "activity_id": "activity-reflection",
        "scene_id": "scene-5",
        "kind": "reflection",
        "learning_objective": "Explain how evidence supports a causal conclusion.",
        "quiz": None,
        "reorder": None,
        "simulation": None,
        "reflection": {
            "prompt": "What evidence changed your conclusion?",
            "placeholder": "Describe the frequency and amplitude evidence.",
            "evidence_to_notice": ["frequency peak", "amplitude change"],
        },
    }
    return {
        "idempotency_key": idempotency_key,
        "bundle": {
            "schema_version": "1.0",
            "generation_job_id": job_id,
            "learner_id": learner_id,
            "selected_topic": {
                "candidate": {
                    "candidate_id": "bridge-resonance",
                    "title": "Bridge resonance",
                    "subject": {
                        "domain": "natural sciences",
                        "discipline": "physics",
                        "topic_tags": ["waves", "structures"],
                    },
                    "premise": "Investigate why a bridge responds strongly at one frequency.",
                    "learning_objectives": ["Explain mechanical resonance"],
                    "why_now": "Modern sensing makes structural vibration visible.",
                    "source_evidence": [source],
                    "novelty_score": 0.8,
                    "story_potential_score": 0.9,
                    "age_suitability_score": 0.9,
                },
                "engagement_rationale": (
                    "This investigation builds on evidence-driven problem solving."
                ),
                "predicted_engagement_score": 0.85,
                "novelty_balance": "A familiar structure introduces a new wave concept.",
            },
            "storyline": {
                "story_id": "resonance-story",
                "title": "The Resonance Signal",
                "tagline": "A bridge reveals its hidden rhythm through evidence.",
                "synopsis": (
                    "A student engineering team investigates unexpected bridge motion, "
                    "tests competing explanations, and uses frequency evidence to identify "
                    "resonance before proposing a safe structural response."
                ),
                "subject": {
                    "domain": "natural sciences",
                    "discipline": "physics",
                    "topic_tags": ["waves", "structures"],
                },
                "target_age": 18,
                "difficulty": "adaptive",
                "estimated_minutes": 8,
                "learning_objectives": ["Explain mechanical resonance"],
                "opening_scene_id": "scene-1",
                "scenes": scenes,
                "takeaway": (
                    "Resonance is supported by evidence showing a peak response near "
                    "a system's natural frequency."
                ),
                "citations": [source],
            },
            "activities": {"activities": [quiz, reflection]},
            "media_plan": {
                "images": [
                    {
                        "asset_key": "scene-opening",
                        "scene_id": "scene-1",
                        "prompt": (
                            "A scientific visualization of a bridge vibration experiment "
                            "with sensors and clear physical evidence."
                        ),
                        "alt_text": "Bridge fitted with vibration sensors during a test.",
                        "aspect_ratio": "16:9",
                    }
                ],
                "video": None,
                "audio": None,
                "visual_style_guide": (
                    "Grounded documentary illustration with consistent lighting and "
                    "scientifically meaningful evidence."
                ),
            },
            "video_decision": {
                "approved": False,
                "reason": "A still image communicates all required evidence clearly.",
                "approved_request": None,
            },
            "assets": [
                {
                    "asset_id": upload["asset_id"],
                    "asset_key": "scene-opening",
                    "kind": "image",
                    "url": upload["public_url"],
                    "content_type": "image/webp",
                    "byte_size": 100,
                    "sha256": ("d" * 64 if job_id == "job-dimensions" else "c" * 64),
                    "scene_id": "scene-1",
                    "alt_text": "Bridge fitted with vibration sensors during a test.",
                    "duration_seconds": None,
                    "provider_model": "imagen-test",
                }
            ],
            "embeddings": [
                {
                    "embedding_id": "embedding-story",
                    "content_key": "story:resonance-story",
                    "content_type": "story",
                    "text": "A grounded story about identifying mechanical resonance.",
                    "vector": [0.1] * 768,
                    "dimensions": 768,
                    "model": "embedding-test",
                }
            ],
            "created_at": "2026-08-18T14:00:00Z",
        },
        "validation": {
            "is_valid": True,
            "quality_score": 92,
            "issues": [],
            "factual_grounding_summary": (
                "All factual claims map directly to the supplied source evidence."
            ),
            "safety_summary": (
                "The content is suitable for the requested learner age and context."
            ),
        },
    }
