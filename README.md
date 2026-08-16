# Artham

Most learning tools measure whether you got the answer right. Artham pays attention to *how* you got there.

You solve a real problem inside a story. A learning partner watches how you approach it — the order you do things in, what you try when you're wrong, how you explain yourself — and hands you an evidence-backed **Thinking Profile** at the end.

## The one architectural rule

> **The story is deterministic. The partner isn't.**

The story engine is a pure reducer with zero AI dependency. It decides what happens next, what's correct, and what the consequences are. The partner agent only *observes* and *guides* — it can never advance a scene, mark an answer, or change the UI.

This means **the app is fully playable with the AI service switched off.** Every partner call has a deterministic fallback, so a cold model, a bad key, or a timeout degrades the experience instead of blocking it.

```
Next.js 16  (app/, lib/)          deterministic engine + UI
     │
     │  POST /api/partner/{prelude,observe,profile}   (server-side only)
     ▼
Python FastAPI + Google ADK  (agent/)                 one agent, three capabilities
     │
     ▼
Gemini via Vertex AI / Gemini Enterprise
```

## Running it

You need **Node 20+** and **Python 3.10+**.

### 1. The app

```bash
npm install
npm run dev            # http://localhost:3000
```

That's enough to play the whole scenario. Without the agent running, the partner uses its deterministic fallbacks and honestly labels itself `OFFLINE` in the UI.

### 2. The partner agent (optional)

```bash
cd agent
python3 -m venv .venv && .venv/bin/pip install -e .
cp .env.example .env       # then fill in your project
```

Authenticate against Gemini Enterprise / Vertex AI:

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

Set at least these in `agent/.env`:

```
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
ARTHAM_MODEL=gemini-flash-latest
```

Then, from the repo root:

```bash
npm run agent          # http://localhost:8080
```

Check it picked up your credentials:

```bash
curl localhost:8080/health
# {"status":"ok", ..., "credentialsConfigured":true}
```

If `credentialsConfigured` is `false`, the agent still answers — the Next.js layer just falls back.

Point the app at a non-default agent URL with `PARTNER_URL` (defaults to `http://127.0.0.1:8080`).

## Verifying

```bash
npm run verify   # headless walkthrough of the story engine
npm run lint
npm run build
```

`npm run verify` plays the scenario without a browser and asserts the things that are easy to break by hand: that every scene reference resolves, that no wrong answer dead-ends, that the slider physics actually matches the 0.25 Hz margin the story claims, that hints escalate but never exceed the ladder, that the AI call budget is capped, and that the offline profile never invents evidence.

## The AI call budget

Between 3 and 8 model calls per session, never per interaction:

| When | Calls |
| --- | --- |
| Pre-session question | 1 |
| In-session observation | 2–5 |
| Thinking Profile | 1 |

`shouldConsultPartner()` in `lib/engine/index.ts` is the whole policy. Mistakes, help requests, reasoning and self-corrections always consult; experiments and key decisions only do so while budget remains.

## Layout

| Path | What lives there |
| --- | --- |
| `lib/story/` | Scenario content and types. Pure data. |
| `lib/engine/` | The deterministic reducer and the call-budget policy. No AI. |
| `lib/partner/` | Wire contract, server-side client, and the deterministic fallbacks. |
| `app/api/partner/` | Route handlers. The only place that talks to the agent. |
| `components/` | The visual-novel UI. |
| `agent/` | The Python ADK service. |
| `scripts/` | The headless verifier. |

## Adding a scenario

Write one file in `lib/story/scenarios/`, register it in `lib/story/index.ts`, and run `npm run verify`. Each scene includes a small `visual` direction (`kind`, `title`, `caption`, and `status`) that drives the reactive story stage and provides the brief for future artwork. The engine, UI, partner, and profile all work off the scenario data — none of them need to change.
