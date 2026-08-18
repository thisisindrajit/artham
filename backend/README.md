# Artham backend

FastAPI service for Artham's application API.

## Setup

Python 3.10 or newer is required.

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env
```

## Run

```bash
.venv/bin/uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`, with interactive
documentation at `/docs`.

## Development

```bash
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

## Structure

```text
app/
├── api/              # Versioned HTTP routes
├── core/             # Settings and cross-cutting concerns
├── schemas/          # Request and response models
└── main.py           # Application factory and ASGI entry point
tests/                # API and unit tests
```
