"""Full storyline generation prompt."""

from .story_quality import STORY_QUALITY_BAR

STORYLINE_INSTRUCTION = """\
The input contains the selected topic, its source excerpts, the learner request,
and engagement context. Write the complete interactive storyline.

""" + STORY_QUALITY_BAR + """\

Three-act structure:
- Act 1 — diagnose: enter during the problem, make any necessary safety judgment,
  inspect two or more clues, reject a plausible surface explanation, and assemble
  the causal chain behind the target concept.
- Act 2 — intervene: make the learner choose or tune a constrained action using
  that causal model. Show a concrete before/after consequence, not a narrator's
  verdict.
- Act 3 — revise and generalize: change one relevant condition so the successful
  first intervention is no longer sufficient. Require model revision, then a
  durable fix or policy that works beyond the original numbers.

Scene design:
- Target 6-9 scenes for 5-8 minutes, 9-14 for 9-14 minutes, and 14-20 for
  longer stories; always remain within the requested duration and schema bounds.
- HARD LIMIT: reserve one image-budget slot for a dedicated cover. Never create
  more than media_budget.max_images - 1 scenes because every scene also receives
  its own story illustration. Count the scenes before returning the storyline.
- Keep one unbroken causal chain. Every scene must introduce evidence, force a
  decision, show a consequence, or change the operating condition.
- Populate characters with 2-4 recurring named people. Give each a simple role and
  a concrete visual description that can be repeated exactly by the media agent.
- Keep the learner-facing science foundational. For semiconductor stories, prefer
  concepts such as conductors vs. insulators, charge flow, switches, simple p/n
  behavior, or how a transistor controls current. Do not center nanoscale
  fabrication, research novelty, or graduate-level material science.
- For thermodynamics stories, teach one or two basics such as heat versus
  temperature, conduction, convection, radiation, insulation, thermal equilibrium,
  or a familiar phase change. Do not center atmospheric windows, nanomaterials,
  non-equilibrium thermodynamics, or advanced material properties.
- a clear opening_scene_id, valid next_scene_id links, and at least one terminal
  scene whose next_scene_id is null;
- use a focused interaction mix with four or five decisions total. Every physics
  story must contain exactly three simulation interaction slots plus at least one
  consequential quiz. Other subjects should use simulations only when a
  manipulable model improves the lesson. Include a causal reorder or
  reflection only when it advances the changed-condition reversal;
- assign only one interaction_slot per scene. When a scene has an interaction
  slot, leave choices empty; the activity agent owns that interaction;
- choices only where the scene genuinely branches, with at least one correct
  choice and consequences that teach through the world; keep each choice label
  under 120 characters;
- choice labels must be actions the learner can take now. Consequences must name
  what visibly happens next and why;
- introduce a technical term only when it becomes necessary for the next action,
  then explain it once in plain language through context;
- resolve the dramatic question, show the learner's decision taking effect, and
  name the transferable concept without ending in a lecture.
- Populate the player-facing fields on every scene: scene_type, mood, concept, and
  three progressive hints on every interaction scene. Keep each player-facing beat
  label extremely brief: 2-5 plain words, at most 32 characters, with no subtitle,
  punctuation-heavy phrasing, or explanation. It must scan like a compact chapter
  name in the header, not summarize the scene.
- Write every narrative string as safe GitHub-Flavored Markdown. Use **bold** for
  consequential evidence, short lists for sequences, blockquotes for brief dialogue,
  and compact tables when comparing two or more states makes the mechanism clearer.
  Keep a complete table in one narrative string. Never emit raw HTML, Markdown
  images, fenced code, or links; attributed learning images use the dedicated
  learning_reference contract.
- Attach 3-5 short trivia cards across at least two acts. They must be true,
  delightful, scene-local, and never contain evidence required by a later answer.
- Add at least three primer cards before unfamiliar terms become decision-critical.
  Each primer has one plain definition and one everyday analogy.
- A scene may contain at most two supplemental learning blocks total: primer,
  reference image, and trivia. Never stack all three in one scene. When a primer and
  reference share a scene, the plain-word primer must come first so the learner knows
  what they are about to inspect. Spread other material into the following scene to
  preserve a continuous teaching order.
- Use two or three distinct supplied reference_images on explanatory scenes where a
  real diagram or documentary
  image makes the concept easier to see. Copy image_url, source_page_url,
  source_name, license_name, license_url, title, and alt_text exactly. Add a
  plain_explanation describing what the learner should notice without jargon and a
  why_important sentence connecting it directly to the story problem. References
  teach alongside the cinematic scene art; they never replace it or carry the only
  evidence needed to answer. Use at least two and at most three supplied references;
  never invent a replacement.
- Reference titles and alt text must be natural learner-facing phrases. Strip file
  prefixes, file extensions, underscores, raw identifiers, and format names.
- Use scene_type="ending" exactly once on the terminal scene and set its outcome.
- Keep synopsis between 140 and 320 characters in one or two punchy sentences. It
  should sell the role, immediate problem, and stakes without explaining the
  mechanism or full solution.
- Populate intro with the learner's role, 1-2 brief cinematic paragraphs, and a
  story-specific CTA. Keep subject.discipline to a brief 1-2 word learner-facing
  topic. Write learning_goal as only 1-2 concise, complete sentences describing
  what the learner will understand or be able to do; do not use a list, heading,
  teaser, or story synopsis. Populate stage_label, partner_greeting, a
  four-option pre_session question with distinct reasoning approaches, and
  player_takeaway with concept, field, one-line idea, transferable rule, three
  elsewhere examples, and three specific moments where the learner used it.

Ground every factual statement in supplied source excerpts. Citations must be
copied from the supplied evidence, never recreated. Use short paragraphs and
concrete sensory detail. Media cues describe evidence-bearing moments, not
decorative wallpaper. Do not write activity payloads; the activity agent owns
those.
"""
