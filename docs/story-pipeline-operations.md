# Story pipeline operations

## Prerequisites

- Python 3.10 or newer
- Application Default Credentials with Vertex AI access
- Exa API credentials
- The backend APIs in [backend-contracts.md](backend-contracts.md)
- OpenAI access for GPT-5.4 reasoning through LiteLLM;
- OpenRouter access for image and video generation;
- Vertex access to the configured Lyria and embedding models;

Install the agent package:

```bash
cd agent
python3 -m venv .venv
.venv/bin/python -m pip install -e .
cp .env.example .env
```

Authenticate:

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

Run the service:

```bash
npm run agent
```

For direct development runs, limit reload watching to the source package so
dependency installation changes inside `.venv` do not trigger reload loops:

```bash
cd agent
.venv/bin/uvicorn artham_partner.story_pipeline.server:app \
  --host 127.0.0.1 --port 18080 --reload --reload-dir artham_partner
```

The pipeline can also be inspected through ADK:

```bash
cd agent
.venv/bin/adk web artham_partner/story_pipeline
```

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | OpenAI authentication used by LiteLLM |
| `OPENROUTER_API_KEY` | Conditional | Required when any model uses the `openrouter/` prefix; validated at startup |
| `GOOGLE_GENAI_USE_VERTEXAI` | Yes | Must be `TRUE` for Vertex media calls |
| `GOOGLE_CLOUD_PROJECT` | Yes | Vertex media and embedding project |
| `GOOGLE_CLOUD_LOCATION` | Yes | Embedding location, usually `global` |
| `ARTHAM_VERTEX_MEDIA_LOCATION` | Yes | Legacy Imagen and Veo region |
| `EXA_API_KEY` | Yes | Exa search authentication |
| `ARTHAM_BACKEND_BASE_URL` | Yes | Future backend base URL |
| `ARTHAM_BACKEND_API_KEY` | Yes | Service-to-service bearer token |
| `ARTHAM_ARCHITECT_MODEL` | No | Strong LiteLLM model for the compact blueprint; falls back to `ARTHAM_PIPELINE_MODEL` |
| `ARTHAM_CRITIC_MODEL` | No | Strong LiteLLM model for final semantic findings; defaults to the architect model |
| `ARTHAM_WORKER_MODEL` | No | Fast LiteLLM model for scene and activity chunks; defaults to `openai/gpt-5.4-mini` |
| `ARTHAM_TOPIC_MODEL` | No | Fast LiteLLM model for open-ended topic resolution; defaults to the worker model |
| `ARTHAM_SESSION_DATABASE_URL` | No | Async SQLAlchemy URL used by ADK sessions; local default is persistent SQLite, production may use PostgreSQL with `asyncpg` |
| `ARTHAM_IMAGE_MODEL` | No | Image model ID; an `openrouter/` prefix routes to OpenRouter, otherwise Vertex |
| `ARTHAM_VEO_MODEL` | No | Video model ID; an `openrouter/` prefix routes to OpenRouter, otherwise Vertex |
| `ARTHAM_LYRIA_MODEL` | No | Lyria model ID; always Vertex |
| `ARTHAM_EMBEDDING_MODEL` | No | Embedding model ID; always Vertex, must stay 768-dimensional |
| `ARTHAM_PROVIDER_TIMEOUT_SECONDS` | No | Non-media HTTP timeout |
| `ARTHAM_MEDIA_TIMEOUT_SECONDS` | No | Long-running media timeout |
| `ARTHAM_MAX_MEDIA_CONCURRENCY` | No | Maximum concurrent media operations; defaults to one |

The service starts without complete generation credentials so health and job
status routes remain available. A story job fails explicitly at its first stage
when required generation configuration is absent. `/health` reports only
configuration presence, never secrets.

## Job API

Create a job:

```http
POST /story-jobs
Content-Type: application/json

{
  "learner_id": "learner_123",
  "idempotency_key": "story-learner_123-2026-08-18",
  "target_age": 18,
  "duration_minutes": 8,
  "difficulty": "adaptive",
  "preferred_subjects": [],
  "excluded_topics": [],
  "locale": "en-US",
  "media_budget": {
    "max_images": 8,
    "generate_cover_image": true,
    "video": {
      "enabled": true,
      "max_clips": 1,
      "max_total_seconds": 10
    },
    "generate_background_audio": true
  }
}
```

The response is `202 Accepted` with `job_id` and `status_url`. Poll
`GET /story-jobs/{job_id}`. Cancel unfinished work with
`DELETE /story-jobs/{job_id}`.

Reposting the same request with the same idempotency key resumes a failed job
under its original job ID and durable ADK session. Job status, request
fingerprint, invocation diagnostics, and chunk checkpoints are stored by
`DatabaseSessionService`.
Startup hydration resumes queued or interrupted jobs. A completed scene or
activity is persisted immediately and is not regenerated after a process
restart. Backend persistence remains idempotent because resumed side effects
have at-least-once semantics.

## Provider behavior

- Exa uses deep search with highlights and bounded page text.
- Gemini native cover generation returns SynthID-watermarked images and applies
  provider safety controls. Legacy `imagen-*` models remain supported by the
  adapter when available.
- Strong reasoning calls are serialized. Small scene/activity calls run with a
  bounded concurrency of three. Successful calls have no fixed sleep; backoff
  begins only after an actual transient provider response.
- A 429 honors `Retry-After` when supplied and otherwise waits 120 seconds.
  Image batches add a 180-second post-429 cooldown and retry failed images once
  after 120 seconds with a simplified, safety-neutral prompt.
- Cover and scene images are optional at the provider boundary. A refusal
  publishes the story without the failed artwork and the UI renders no
  placeholder. Background audio is required only when explicitly enabled.
- Veo is disabled to control cost and is absent from the active workflow.
- Lyria uses the Vertex `interactions` endpoint and produces slow, mild, beatless
  ethereal ambience tailored to the story setting and emotional arc. The prompt
  excludes beats, rhythmic pulses, percussion, drums, sharp transients, and vocals.
- Embeddings use `RETRIEVAL_DOCUMENT`, 768 output dimensions, and automatic
  truncation.
- Signed upload requests include MIME type, byte count, and SHA-256. The backend
  must verify those values before marking an asset durable.

Lyria and image operations may run for minutes. Configure service and reverse
proxy request limits for short job-control calls; provider work runs in the
background task, not in the `POST /story-jobs` request.

## Operational recovery

Recovery is part of the pipeline rather than a collection of one-off scripts.
Retries resume from the failed stage, preserve successful assets, repair only
the affected content, and persist only a validated final bundle. Administrative
data deletion should use an authenticated backend operation rather than
importing application internals from a local script.

## Production requirements

Before deploying more than one agent process:

1. Replace in-memory job state with backend-owned durable jobs or a queue.
2. Deliver cancellation through that queue.
3. Add provider quota dashboards and per-model cost reporting.
4. Add object lifecycle cleanup for failed and repaired generations.
5. Pin approved Vertex model IDs and regions per environment.
6. Use workload identity instead of long-lived service-account keys.
