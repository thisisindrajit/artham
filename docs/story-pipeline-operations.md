# Story pipeline operations

## Prerequisites

- Python 3.10 or newer
- Application Default Credentials with Vertex AI access
- Exa API credentials
- The backend APIs in [backend-contracts.md](backend-contracts.md)
- Vertex access to the configured Gemini, image, Veo, Lyria, and embedding
  models

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

The pipeline can also be inspected through ADK:

```bash
cd agent
.venv/bin/adk web artham_partner/story_pipeline
```

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_GENAI_USE_VERTEXAI` | Yes | Must be `TRUE` for ADK Gemini calls |
| `GOOGLE_CLOUD_PROJECT` | Yes | Vertex project |
| `GOOGLE_CLOUD_LOCATION` | Yes | Gemini and embedding location, usually `global` |
| `ARTHAM_VERTEX_MEDIA_LOCATION` | Yes | Legacy Imagen and Veo region |
| `EXA_API_KEY` | Yes | Exa search authentication |
| `ARTHAM_BACKEND_BASE_URL` | Yes | Future backend base URL |
| `ARTHAM_BACKEND_API_KEY` | Yes | Service-to-service bearer token |
| `ARTHAM_PIPELINE_MODEL` | No | Storyline, activity, validator, and repair model |
| `ARTHAM_FAST_MODEL` | No | Scout, selector, and video-gate model |
| `ARTHAM_IMAGE_MODEL` | No | Vertex image model ID |
| `ARTHAM_VEO_MODEL` | No | Veo model ID |
| `ARTHAM_LYRIA_MODEL` | No | Lyria model ID |
| `ARTHAM_EMBEDDING_MODEL` | No | Embedding model ID |
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
    "max_images": 6,
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

Job records are intentionally in memory until the backend exists. They do not
survive process restarts and cannot coordinate across multiple service
instances. Move lifecycle ownership to the backend before horizontal scaling.

## Provider behavior

- Exa uses deep search with highlights and bounded page text.
- Gemini native image generation returns SynthID-watermarked images and applies
  provider safety controls. Legacy `imagen-*` models remain supported by the
  adapter when available.
- Provider work is reliability-first and serialized. Reasoning calls are spaced
  30 seconds apart, image requests 45 seconds apart, and embeddings eight
  seconds apart.
- A 429 honors `Retry-After` when supplied and otherwise waits 120 seconds.
  Image batches add a 180-second post-429 cooldown and retry failed images once
  after 120 seconds with a simplified, safety-neutral prompt.
- Cover, scene images, and requested background audio are release requirements.
  If any planned asset is still missing after its bounded retry, the job fails
  before persistence instead of publishing a partial story.
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
