# Backend contracts for generated stories

This document is the implementation contract for the backend that will own
PostgreSQL, pgvector, durable jobs, and object-storage metadata. The ADK service
must never receive PostgreSQL credentials.

## Ownership

| Concern | Owner |
| --- | --- |
| Topic research and content generation | ADK service |
| Provider credentials for Gemini, Imagen, Veo, Lyria, embeddings, Exa | ADK service |
| Learner identity and engagement history | Backend |
| Job durability and authorization | Backend |
| PostgreSQL and pgvector | Backend |
| Object storage and signed URLs | Backend |
| Atomic publication of validated stories | Backend |

All backend endpoints below are internal service APIs under `/v1/internal`.
Authenticate the ADK service with `Authorization: Bearer <service token>` over
TLS. Apply a distinct audience, short token lifetime, least-privilege role, rate
limit, and audit log. Do not reuse end-user access tokens.

JSON field names are `snake_case`; timestamps are RFC 3339 UTC. Unknown request
fields must return `400`, matching the pipeline's strict Pydantic contracts.

## 1. Read learner engagement

```http
GET /v1/internal/learners/{learner_id}/story-engagement
```

`learner_id` is URL-encoded. Return `404` when the learner has no history; the
pipeline treats that as a valid cold-start profile. Return `200`:

```json
{
  "learner_id": "learner_123",
  "stories": [
    {
      "story_id": "story_456",
      "subject": {
        "domain": "natural sciences",
        "discipline": "physics",
        "topic_tags": ["waves", "structures"]
      },
      "topic": "resonance in bridges",
      "completed": true,
      "completion_ratio": 1.0,
      "active_seconds": 512,
      "activity_accuracy": 0.75,
      "hints_used": 2,
      "replayed": false,
      "learner_rating": 4,
      "completed_at": "2026-08-17T10:15:30Z"
    }
  ],
  "affinity_tags": ["investigation", "systems"],
  "fatigue_tags": ["bridges"],
  "preferred_difficulty": "adaptive",
  "generated_at": "2026-08-18T14:00:00Z"
}
```

Requirements:

- Return at most the latest 100 stories.
- Compute `active_seconds` from foreground interaction, not wall-clock session
  duration.
- `activity_accuracy` is nullable when no scored activity exists.
- Affinity and fatigue tags must be explainable aggregates, not inferred
  personality or protected attributes.
- Never include free-form private learner data in this response.
- Target p95 latency below 500 ms.

## 2. Create a signed media upload

```http
POST /v1/internal/media/upload-intents
Idempotency-Key: optional but recommended
Content-Type: application/json
```

Request:

```json
{
  "job_id": "7bdb...",
  "asset_key": "scene-b2-evidence",
  "kind": "image",
  "content_type": "image/webp",
  "byte_size": 348210,
  "sha256": "64-lowercase-hex-characters"
}
```

Allowed MIME types:

- image: `image/png`, `image/jpeg`, `image/webp`
- video: `video/mp4`
- audio: `audio/wav`, `audio/mpeg`

Response:

```json
{
  "asset_id": "asset_01J...",
  "upload_url": "https://object-store.example/signed-put",
  "public_url": "https://cdn.example/generated/asset_01J....webp",
  "headers": {
    "content-type": "image/webp",
    "x-checksum-sha256": "..."
  },
  "expires_at": "2026-08-18T14:15:00Z"
}
```

Requirements:

- Signed URLs use `PUT`, expire in 5-15 minutes, and accept exactly the declared
  MIME type and maximum byte count.
- Scope object keys to environment, job, and opaque `asset_id`; never trust
  `asset_key` as a storage path.
- Keep the object private. `public_url` may be a stable authenticated CDN URL,
  not necessarily world-public.
- Verify byte count and SHA-256 after upload. A persistence request referencing
  an absent, expired, mismatched, or quarantined asset must fail.
- Scan assets asynchronously where required, but publication must wait for a
  clean result.
- Uncommitted objects expire automatically after 24 hours. This covers failed
  jobs and media replaced during repair.
- Repeated equivalent intents may return the existing asset record and a fresh
  upload URL.

The ADK service uploads bytes directly to `upload_url`; those bytes never pass
through the backend application process.

## 3. Atomically persist a generated story

```http
POST /v1/internal/generated-stories
Idempotency-Key: <generation request idempotency_key>
Content-Type: application/json
```

Request:

```json
{
  "idempotency_key": "story-learner_123-2026-08-18",
  "bundle": {
    "schema_version": "1.0",
    "generation_job_id": "7bdb...",
    "learner_id": "learner_123",
    "selected_topic": {},
    "storyline": {},
    "activities": {"activities": []},
    "media_plan": {},
    "video_decision": {},
    "assets": [],
    "embeddings": [],
    "created_at": "2026-08-18T14:00:00Z"
  },
  "validation": {
    "is_valid": true,
    "quality_score": 92,
    "issues": [],
    "factual_grounding_summary": "All factual claims map to supplied evidence.",
    "safety_summary": "Suitable for the requested learner age."
  }
}
```

The omitted objects are exactly the JSON representation of Pydantic models in
`agent/artham_partner/story_pipeline/contracts.py`. Generate backend DTOs from
that JSON Schema or mirror every field; do not store an unvalidated arbitrary
blob.

Response:

```json
{
  "story_id": "story_01J...",
  "version": 1,
  "persisted_at": "2026-08-18T14:01:00Z"
}
```

Transaction requirements:

1. Validate `schema_version`, all nested DTOs, and `validation.is_valid == true`.
2. Lock or create the idempotency row.
3. Verify the learner exists and the caller may generate for that learner.
4. Verify every asset exists, is clean, matches kind/MIME/size/SHA-256, and
   belongs to `generation_job_id`.
5. Verify asset keys and embedding content keys are unique.
6. Verify every embedding has `dimensions == len(vector) == 768` for the
   configured model. Reject mixed dimensions within a story version.
7. Insert the story version, topic/source rows, scenes, activities, assets,
   validation report, and embeddings in one transaction.
8. Mark referenced uploads committed.
9. Commit, then return the durable receipt.

If the same idempotency key and request hash is replayed, return the original
receipt. If the key is reused with different content, return `409`.

The story must remain unpublished until this transaction succeeds. Do not
partially persist a story and do not return a success-shaped fallback.

## 4. Backend to ADK job calls

The current ADK service exposes:

| Method | Path | Response |
| --- | --- | --- |
| `POST` | `/story-jobs` | `202` with `job_id`, `queued`, and `status_url` |
| `GET` | `/story-jobs/{job_id}` | Current stage, progress, result, or error |
| `DELETE` | `/story-jobs/{job_id}` | `202` cancellation state |

The backend should eventually own the durable job row, proxy these calls, and
recover jobs after restarts. Preserve the generation request's
`idempotency_key`. A recommended production flow is:

1. Backend creates `story_generation_jobs(status='queued')`.
2. A queue worker calls the ADK `POST /story-jobs`.
3. Backend polls with exponential backoff or receives a future authenticated
   webhook.
4. Backend records only lifecycle metadata; the ADK persistence call writes the
   final story atomically.
5. Cancellation updates the durable job then calls ADK `DELETE`.

## PostgreSQL model

Use normalized ownership and query fields with JSONB only for bounded,
versioned structures.

| Table | Essential columns |
| --- | --- |
| `story_generation_jobs` | `id`, `learner_id`, `idempotency_key`, `request_hash`, `status`, `stage`, `progress`, timestamps, error code/message |
| `generated_stories` | `id`, `learner_id`, `current_version`, `status`, timestamps |
| `generated_story_versions` | `story_id`, `version`, `schema_version`, title, subject domain/discipline, difficulty, target age, synopsis, full validated bundle JSONB, validation JSONB, timestamps |
| `story_sources` | story/version FK, URL, title, excerpt, publication time, source name |
| `story_scenes` | story/version FK, stable scene ID, act, ordinal, scene JSONB |
| `story_activities` | story/version FK, stable activity ID, scene ID, kind, activity JSONB |
| `media_assets` | asset ID, job ID, storage key, kind, MIME, bytes, SHA-256, scan state, commit state, CDN URL, timestamps |
| `story_asset_links` | story/version FK, asset ID, stable asset key, scene ID, alt text, duration, provider model |
| `story_embeddings` | story/version FK, embedding ID, content key/type, source text, model, dimensions, `vector(768)` |
| `learner_story_engagement` | learner/story/session IDs, completion, active seconds, score aggregates, hints, replay, rating, completed time |
| `idempotency_keys` | scope, key, request hash, response code/body, expiry |

Recommended constraints and indexes:

- unique `(scope, idempotency_key)`;
- unique `(story_id, version)`;
- unique `(story_id, version, scene_id)`;
- unique `(story_id, version, activity_id)`;
- unique `(story_id, version, asset_key)`;
- unique `(story_id, version, content_key)`;
- check progress between 0 and 1;
- check target age between 15 and 23;
- check media byte counts are positive;
- check embedding dimensions are 768;
- HNSW or IVFFlat pgvector index using the distance metric selected for the
  embedding model;
- B-tree indexes on learner/time, job status/time, subject, and publication
  status.

Store embedding source text beside the vector for traceability and deletion.
Version the embedding model and dimensions. A future model migration creates
new embedding rows; it must not mix vector spaces in one search.

## Error contract

Every non-2xx backend response returns:

```json
{
  "error": {
    "code": "ASSET_CHECKSUM_MISMATCH",
    "message": "Asset asset_01J... does not match its declared checksum.",
    "retryable": false,
    "request_id": "req_01J...",
    "details": {}
  }
}
```

Use:

- `400` malformed or schema-invalid request;
- `401` missing/invalid service identity;
- `403` authenticated but unauthorized;
- `404` missing learner/resource;
- `409` idempotency or state conflict;
- `413` request exceeds configured size;
- `422` valid JSON that violates a business invariant;
- `429` quota/rate limit with `Retry-After`;
- `500` unexpected internal failure;
- `502`/`503` transient dependency failure.

Do not expose SQL, credentials, signed URLs from other jobs, stack traces, or
provider response bodies. `retryable` must be accurate because the ADK client
retries only transient transport/status failures.

## Retention and deletion

- Deleting a learner must delete or irreversibly anonymize engagement and
  generated-story ownership, embedding source text, and vectors according to
  product policy.
- Story deletion should enqueue object deletion and retain an auditable tombstone
  without learner content.
- Source excerpts and generated assets need explicit retention and licensing
  policy.
- Log model IDs, source URLs, validation outcome, and checksums for provenance,
  but never raw provider credentials or signed upload URLs.
