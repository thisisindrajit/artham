# Artham — Collaborative Partner Build Skill

## Mission

Build **Artham**: a story-based learning experience where the user learns by making decisions inside interactive scenarios while an AI learning partner observes **how they think**, provides lightweight guidance, and produces a grounded **Thinking Profile** at the end.

The goal is a polished hackathon MVP that can be built in **7–14 days**.

Optimize for:
1. One excellent end-to-end experience.
2. A clearly visible Collaborative Partner.
3. Reliable, deterministic gameplay.
4. A compelling final Thinking Profile.
5. Minimal infrastructure and minimal unnecessary AI calls.

Do NOT turn this into a general-purpose adaptive learning platform.

---

# 1. Product Thesis

### Core idea

> **Most learning tools measure whether you got the answer right. Artham pays attention to how you got there.**

The story is deterministic. The **partner is adaptive**.

The story engine controls:
- scenes
- mechanics
- branching
- correct answers
- consequences
- progression

The AI partner observes:
- choices
- mistakes
- reasoning
- hint usage
- corrections
- approach to problems
- explicit explanations

The AI partner can:
- ask a small number of contextual questions
- provide progressive guidance
- record observations
- summarize the user's thinking
- generate the final Thinking Profile

---

# 2. Hackathon Positioning

Artham belongs in **Collaborative Partner**.

The agent must visibly:
- lead the user through the experience
- ask questions
- guide the user when stuck
- observe how the user approaches problems
- take notes
- use those observations later
- provide a useful personalized reflection

Do not make the agent merely:
- a chatbot beside the game
- a content generator
- a final-answer grader
- a generic tutor

The agent's job is:

> **Understand the learner while the learner is solving the problem.**

---

# 3. Scope

## Target MVP

Build:

- 5 polished story scenarios
- 5–6 domains
- deterministic branching
- 5–8 minutes per scenario
- one shared learning-partner agent
- contextual pre-session questions
- lightweight observation during play
- progressive hints/guidance
- end-of-session Thinking Profile

Suggested scenarios:

1. Physics — Save the Bridge / Resonance
2. Biology — Solve the Forensics Case / DNA
3. Economics — Run the Market / Supply & Demand
4. Chemistry — Stabilize the Reaction / Equilibrium
5. History/Politics — Negotiate the Treaty / Trade-offs

These are examples. Prefer scenarios with naturally observable reasoning.

## Explicitly NOT building

Do not build:
- persistent long-term learner memory
- user accounts
- multiplayer
- free-roam 3D worlds
- procedural infinite worlds
- dynamically generated images during gameplay
- sophisticated psychological personality models
- complex multi-agent systems
- adaptive curriculum generation
- embeddings/vector databases
- elaborate analytics dashboards
- mobile apps
- voice
- a general topic marketplace
- complicated teacher/admin tooling

---

# 4. Golden Architecture

Use two independent layers.

```text
                    ARTHAM
                       |
          +------------+------------+
          |                         |
          v                         v
    STORY ENGINE              PARTNER AGENT
    deterministic              adaptive
          |                         |
    scenes/choices            observes events
    mechanics                 asks questions
    branches                  gives guidance
    consequences              records notes
          |                         |
          +------------+------------+
                       |
                       v
                THINKING PROFILE
```

## Critical rule

**The agent does not control the core game engine.**

The story engine should remain deterministic and reliable.

The agent observes the story and user behavior.

This keeps the build simple while making the agent genuinely useful.

---

# 5. Runtime Flow

```text
1. User selects a scenario
        ↓
2. Artham introduces the situation
        ↓
3. Artham asks 1–2 contextual questions
        ↓
4. Story begins
        ↓
5. User makes decisions
        ↓
6. Story engine evaluates deterministically
        ↓
7. Event is sent to partner agent
        ↓
8. Agent may:
      - record an observation
      - ask why
      - provide a hint
      - encourage the user
        ↓
9. Story continues along deterministic branch
        ↓
10. Repeat
        ↓
11. Agent creates Thinking Profile
```

Do not make every step an LLM call.

---

# 6. AI Call Budget

Prefer a small number of meaningful calls.

### Before session

1 call:
- generate/adapt 1–2 clarifying questions

### During session

Only call the agent when there is a meaningful event:
- important mistake
- repeated mistake
- interesting reasoning
- user requests help
- important decision
- opportunity for a follow-up question

Do NOT call Gemini after every button click.

### End

1 call:
- generate Thinking Profile from structured observations

A typical session should ideally use **3–8 agent calls**, not dozens.

---

# 7. Agent Responsibilities

The agent has four simple capabilities.

## A. Ask

Ask a contextual question when it helps understand the learner.

Examples:

> "Before we start, how would you approach this problem?"

> "Why did you choose that option?"

> "What were you expecting to happen?"

Questions must be short and connected to the current story.

Avoid generic questions such as:
- "How do you feel?"
- "What is your learning style?"
- "Are you an analytical person?"

---

## B. Observe

Convert events into grounded observations.

Examples:

```json
{
  "type": "observation",
  "claim": "User tends to test one variable at a time.",
  "evidence": "In decisions 2 and 4, user changed only the frequency.",
  "confidence": 0.86
}
```

Observations must be based on actual behavior.

Never invent psychological traits.

---

## C. Guide

Use progressive guidance.

Level 1:
> "Look at what changed between your last two attempts."

Level 2:
> "Compare the frequency and amplitude."

Level 3:
> "The key is the relationship between the driving frequency and the system's natural frequency."

Only reveal the answer as a last resort.

Guidance should help the user think, not simply tell them what to click.

---

## D. Profile

At the end, synthesize observations into a concise Thinking Profile.

Example:

```text
THINKING PROFILE

Systematic Experimenter

You tend to test hypotheses by changing one variable
at a time.

Strength
You learn quickly from evidence and adjust your approach.

Watch out for
You sometimes commit to your first hypothesis before
testing alternatives.

Evidence
You changed one variable in 4 of 5 experiments and
self-corrected twice after observing the result.
```

Every meaningful claim should have evidence.

---

# 8. Observation Model

Keep the learner model small and session-scoped.

```typescript
type ThinkingObservation = {
  category:
    | "strategy"
    | "mistake"
    | "reasoning"
    | "adaptation"
    | "help_seeking"
    | "decision_pattern";

  observation: string;

  evidence: string;

  confidence: number;

  sceneId: string;
};

type SessionNotes = {
  observations: ThinkingObservation[];

  mistakes: {
    sceneId: string;
    mistake: string;
    corrected: boolean;
  }[];

  hintsUsed: number;

  selfCorrections: number;

  decisions: {
    sceneId: string;
    choice: string;
    correct: boolean;
  }[];

  reasoningSamples: {
    sceneId: string;
    question: string;
    answer: string;
  }[];
};
```

Do not create a giant schema.

---

# 9. What Counts as Evidence?

Good:

> "User changed only frequency in attempts 2 and 3."

Then infer:

> "User tends to isolate variables during experimentation."

Bad:

> "User is highly analytical."

The second statement is too broad unless there is strong evidence.

Prefer:

**Observed behavior → interpretation**

not:

**Personality label → invented explanation**

---

# 10. Story Schema

Keep story content deterministic.

Example:

```json
{
  "id": "resonance_bridge",
  "title": "Save the Bridge",
  "domain": "physics",
  "learningGoal": "Understand resonance",
  "intro": {
    "text": "The bridge model is beginning to oscillate."
  },
  "scenes": [
    {
      "id": "s1",
      "type": "narrative",
      "text": "...",
      "image": "/scenes/resonance/s1.png",
      "next": "s2"
    },
    {
      "id": "s2",
      "type": "choice",
      "prompt": "...",
      "options": [
        {
          "id": "a",
          "label": "...",
          "next": "s3a",
          "correct": false
        },
        {
          "id": "b",
          "label": "...",
          "next": "s3b",
          "correct": true
        }
      ]
    }
  ]
}
```

The story engine owns this.

The agent receives events such as:

```json
{
  "event": "choice_made",
  "sceneId": "s2",
  "choiceId": "a",
  "correct": false
}
```

---

# 11. Mechanics

For the MVP prioritize:

### Choice

Fastest and easiest.

### Slider

Good for physics, chemistry, economics.

### Optional short-answer

Useful for asking:

> "Why did you choose this?"

This is where Gemini can interpret reasoning.

Do NOT spend time implementing many mechanics.

A beautiful choice interaction is better than four unfinished mechanics.

---

# 12. Pre-Session Questions

Use 1–2 questions.

They should be:
- relevant to the scenario
- answerable quickly
- useful to the partner
- part of the story

Example:

> "You're entering the lab. When you face an unfamiliar problem, what do you usually do first?"

Options:

- Test a few possibilities
- Form a hypothesis first
- Look for the strongest clue
- Break the problem into smaller parts

This gives the agent an initial hypothesis about the user's approach.

Do not treat it as truth.

Later behavior should confirm or contradict it.

---

# 13. Guidance Rules

When user is wrong once:

Do not immediately reveal the answer.

Give a lightweight nudge.

When user is wrong repeatedly:

Give a stronger hint.

When user explicitly asks for help:

Give the next useful clue.

When user self-corrects:

Acknowledge it.

Example:

> "That correction is interesting. You changed your approach after seeing the result."

The partner should feel collaborative, not judgmental.

---

# 14. Agent Output Contract

Keep agent outputs structured.

Example:

```json
{
  "action": "guide",
  "message": "Compare what changed between your last two attempts.",
  "observation": {
    "category": "adaptation",
    "observation": "User is reconsidering the original hypothesis.",
    "evidence": "User changed strategy after the previous result.",
    "confidence": 0.78
  }
}
```

Possible actions:

```text
observe
ask
guide
encourage
none
```

The frontend should decide how to render them.

The agent should NOT directly manipulate the UI.

---

# 15. Frontend Experience

The primary UI should feel like a visual novel, not a chatbot.

Scene:

```text
+---------------------------------------+
|                                       |
|          AI-generated scene           |
|                                       |
|                                       |
|   "The bridge begins to vibrate."     |
|                                       |
|                                       |
|     [ Reduce frequency ]              |
|     [ Increase frequency ]            |
|     [ Change amplitude ]              |
|                                       |
+---------------------------------------+
```

The partner should appear naturally inside the experience.

Possible presentation:

> **Artham**

> "Before you decide, what are you expecting to happen?"

Avoid a persistent ChatGPT-style sidebar.

The story should remain the main experience.

---

# 16. Thinking Profile UX

This is the emotional payoff.

Suggested structure:

```text
YOUR THINKING PROFILE

        SYSTEMATIC
           82%

You tend to test ideas before committing.

-------------------------------

YOUR STRENGTH

Evidence-driven decisions

You changed one variable at a time
in 4 of 5 experiments.

-------------------------------

YOUR BLIND SPOT

First-hypothesis bias

You sometimes committed to your
first explanation before testing
alternatives.

-------------------------------

WHAT ARTHAM NOTICED

You became more systematic after
your first mistake.

-------------------------------

TRY NEXT

A scenario where the strongest
first hypothesis is misleading.
```

Keep it concise.

---

# 17. Demo Strategy

The hackathon demo should show the entire loop.

Do NOT spend most of the demo explaining architecture.

Demo:

### 1. Enter scenario

Artham asks:

> "How would you approach this?"

### 2. User makes a decision

### 3. User gets something wrong

### 4. Artham observes

> "You changed two variables at once. Let's isolate one."

### 5. User explains reasoning

### 6. Artham guides

### 7. User succeeds

### 8. Thinking Profile appears

Then explicitly say:

> "The story was deterministic. The partner wasn't."

That is the key architectural insight.

---

# 18. Build Order

## Phase 1 — Core loop

1. Build visual novel scene renderer.
2. Add deterministic story JSON.
3. Add choice mechanics.
4. Add one complete scenario.
5. Make the full experience playable without AI.

## Phase 2 — Partner

6. Add Gemini through the required Google agent framework.
7. Add session event logging.
8. Add observation extraction.
9. Add contextual questions.
10. Add progressive guidance.
11. Add Thinking Profile.

## Phase 3 — Content

12. Build 4 additional scenarios.
13. Generate/prepare scene art.
14. Test every branch.
15. Add fallback behavior.

## Phase 4 — Polish

16. Improve transitions.
17. Improve agent presentation.
18. Improve Thinking Profile.
19. Add loading/error states.
20. Record demo.
21. Test from a clean browser/session.

---

# 19. Reliability Rules

The user should never get stuck because an LLM failed.

Every agent action must have a fallback.

Examples:

If observation call fails:
- continue the story
- skip the observation

If guidance call fails:
- use a predefined hint from the story

If profile generation fails:
- generate a deterministic profile from session statistics

If image generation fails:
- use a pre-generated fallback image

The story engine must always work without the agent.

---

# 20. Google/Hackathon Integration

Because this is being built for the hackathon, use the required Google stack rather than the earlier OpenAI-only validation architecture.

Target:

- Gemini API / Vertex AI for the partner
- Google ADK or another allowed Google agent framework
- Google Cloud Run for backend
- Firestore only if persistence is actually needed

Keep the architecture simple.

A single agent is enough.

Do not introduce multiple agents unless a real need appears.

---

# 21. Definition of Done

Artham is ready when:

- [ ] A user can complete at least 2 polished scenarios end-to-end.
- [ ] The story branches deterministically.
- [ ] Artham asks contextual questions before/during the story.
- [ ] Artham records observable reasoning patterns.
- [ ] Artham can provide progressive guidance.
- [ ] The experience still works when the agent is unavailable.
- [ ] The final Thinking Profile references concrete evidence.
- [ ] The agent clearly feels like a learning partner rather than a chatbot.
- [ ] The demo can explain the Collaborative Partner value in under 30 seconds.
- [ ] At least one scenario demonstrates the complete observe → guide → learn → profile loop.

Five scenarios are nice to have. One excellent scenario is more valuable than five broken ones.

---

# 22. Product Principles

### Principle 1
**The story teaches the concept. The agent learns the learner.**

### Principle 2
**Deterministic gameplay, adaptive partnership.**

### Principle 3
**Observe behavior, don't invent personality.**

### Principle 4
**Guide thinking, don't give answers.**

### Principle 5
**AI should enhance the experience, not interrupt it.**

### Principle 6
**Build the smallest system that makes the agent's role undeniable.**

### Principle 7
**A polished 7-minute experience beats a sprawling platform.**

---

# 23. Anti-Scope-Creep Rules

If a feature sounds cool, ask:

> Does this make the Collaborative Partner meaningfully better?

If no → don't build it.

If it requires:
- a new database
- a new agent
- a new generation pipeline
- a new frontend paradigm
- more than one day of work

→ defer it unless it is essential to the demo.

Prioritize:

**Partner behavior > story quality > visual polish > infrastructure sophistication.**

---

# 24. One-Sentence Product Definition

> **Artham puts you inside interactive stories where you solve real problems while an AI learning partner observes how you think, guides you through challenges, and reveals your Thinking Profile.**

# 25. One-Sentence Hackathon Definition

> **Artham is a Collaborative Partner that doesn't just evaluate your answers—it observes your reasoning, adapts its guidance, and learns how you approach problems.**
