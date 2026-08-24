# Artham backend

FastAPI service that owns learner engagement, generated-story persistence,
PostgreSQL/pgvector, and Google Cloud Storage media metadata.

## Setup

Python 3.10 or newer is required.

```bash
cd backend
cp .env.example .env
uv sync --extra dev
```

Create the PostgreSQL database, enable `pgvector`, configure a private GCS
bucket, then apply migrations:

```bash
uv run alembic upgrade head
```

`ARTHAM_DATABASE_SSL=true` is enabled by default and verifies the database
certificate and hostname against the operating system trust store.

## Run

```bash
uv run fastapi dev app/main.py --host 127.0.0.1 --port 8090
```

The API is available at `http://127.0.0.1:8090`, with interactive documentation
at `/docs`. Internal routes require
`Authorization: Bearer $ARTHAM_INTERNAL_API_KEY`.

## Internal APIs

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/v1/internal/learners/{learner_id}/story-engagement` | Latest learner engagement profile |
| `POST` | `/v1/internal/media/upload-intents` | Private signed media upload |
| `POST` | `/v1/internal/generated-stories` | Atomic validated story persistence |

The write path validates every nested contract, verifies uploaded objects,
enforces 768-dimensional embeddings, and records the complete story version in
one transaction. Idempotent story writes return the original receipt; changed
content with a reused key returns `409`.

Media scanning is external to this service. In deployments that require it,
set `ARTHAM_MEDIA_SCAN_REQUIRED=true` and update `media_assets.scan_state` from
the scanner before allowing publication. Configure bucket lifecycle rules to
remove uncommitted objects after 24 hours.

GCS access uses Application Default Credentials. Prefer workload identity in
deployed environments; for local development, authenticate with
`gcloud auth application-default login`. The runtime principal needs object
create/read permissions. V4 signed URLs additionally require signing
credentials or `iam.serviceAccounts.signBlob` on
`ARTHAM_GCS_SIGNING_SERVICE_ACCOUNT`.

## Development

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

## Structure

```text
app/
├── api/              # Versioned HTTP routes
├── core/             # Settings and cross-cutting concerns
├── db/               # SQLAlchemy models and async sessions
├── schemas/          # Request and response models
├── services/         # Transaction and object-storage orchestration
└── main.py           # Application factory and ASGI entry point
migrations/           # Alembic database revisions
tests/                # API and unit tests
```

Rate limiting, TLS termination, and short-lived workload identity should be
enforced at the service ingress. Do not expose `/v1/internal` to browsers or
reuse end-user access tokens.
