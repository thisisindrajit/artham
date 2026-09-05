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
  durable fix or policy that works beyond the original numbers. Reach this
  complication and its resolution through the same one scene at a time,
  cause-then-effect chain as Acts 1-2 — never jump straight from an early Act 3
  scene to the final climax or resolution. Each Act 3 scene must still show its
  own single new piece of evidence, one small decision, and one visible
  consequence before the next scene builds on it; the climax is earned by the
  last of these steps, not reached by skipping ahead to it.

Scene design:
- Plan a zero-knowledge teaching sequence within the plot: everyday observation,
  what each necessary thing is and does, one source-supported causal explanation,
  then application. Teach prerequisites in narrative before they are used, not
  only in optional cards or hints. Let action, evidence, and conversation carry
  explanations; omit lectures and unnecessary technical tangents. Simplify the
  scope, never distort the mechanism.
- Target 6-9 scenes for 5-8 minutes, 9-14 for 9-14 minutes, and 14-20 for
  longer stories; always remain within the requested duration and schema bounds.
- The media budget is independent of scene count because only one cover image is
  guaranteed by the plan. Never assume that a storyline scene receives an illustration.
- Keep one unbroken causal chain. Every scene must introduce evidence, force a
  decision, show a consequence, or change the operating condition. No scene may
  skip ahead in time or stakes past what the immediately preceding scene earned —
  each scene must pick up the exact consequence the previous scene just created,
  not a later one. Before finalizing, re-read the scenes in next_scene_id order
  and confirm each scene's opening sentence reacts to the specific thing that just
  happened, and that the final scenes still move one earned step at a time rather
  than leaping straight to the climax or the ending.
- Establish setting (weather, room, ambient sound) only in the opening scene's
  first sentence. Every later scene's first sentence must start mid-action from
  the immediately preceding consequence (what a character just did or what the
  learner just caused) and must not restate the weather, room description, or
  any other scene-setting phrase already used earlier, even in reworded form.
  If you are about to write a sentence that reuses an earlier scene's opening
  word, image, or sentence structure, rewrite it as a direct continuation of
  the prior action instead.
- Use only words a 13-year-old encounters in everyday life. Reject nautical,
  archaic, regional, or trade-specific vocabulary (such as "gangway," "aft,"
  "ledger," "foreman") unless the story's setting makes the word unavoidable, and
  even then explain it once in plain language the first time it appears. When a
  common everyday word says the same thing, always prefer it.
- Populate characters with only 1-2 recurring named side characters, because the
  learner addressed as "you" counts toward the maximum of three characters in the
  whole story. Give each side character a simple role and a concrete visual
  description that can be repeated exactly by the media agent. Do not introduce
  additional named or speaking characters in scene prose.
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
- choose a focused, story-specific interaction mix before writing scene prose.
  Vary the number, order, and spacing instead of repeating a standard sequence.
  Use reflection for open-ended questions. Use simulations, sliders, or reorders
  only when that format naturally helps the learner test the current story idea;
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
  end happily with an earned situational resolution and a warm character callback.
  Show a bounded, factual success, never a fabricated cure or unsupported benefit.
  Let the transferable idea emerge without ending in a lecture.
- Populate the player-facing fields on every scene: scene_type, mood, concept, and
  three progressive hints on every interaction scene. Keep each player-facing beat
  label extremely brief: 2-5 plain words, at most 32 characters, with no subtitle,
  punctuation-heavy phrasing, or explanation. It must scan like a compact chapter
  name in the header, not summarize the scene. Make it vivid and specific to that
  scene's concrete action, object, or image (a person, a place, a thing that
  happens); never a generic abstract label such as "Evidence," "Judgment,"
  "First Trial," or "The Verdict" that could belong to any story on any topic.
  Use plain, everyday words a 13-year-old already knows (market, garden, rehearsal,
  mix-up) instead of obscure or decorative synonyms —
  vivid and specific means concrete, not decorative vocabulary.
- Write every narrative string as safe GitHub-Flavored Markdown. Each paragraph
  should carry 3-5 full sentences and develop a complete dramatic beat, so the
  story reads like a compelling continuous book rather than fragments. Begin with
  action, mystery, or a vivid contradiction; deepen the human stakes or discovery;
  and close with a reveal, consequence, or unresolved question that hooks the
  learner into the next scene (or warm closure in the ending). Wrap every spoken
  phrase as ***“Dialogue.”*** (bold and italic). Use **bold** only for a few
  indispensable terms whose meaning is essential to following the story; the UI
  adds underline styling. Never bold decorative wording, ordinary actions, whole
  sentences, or every repetition. Use purposeful blockquotes for notes or quotations, short lists for
  sequences, and compact tables when comparing states makes the idea clearer. Keep a
  complete table in one narrative string. Never emit raw HTML, Markdown images,
  or links. When a structure, sequence, cause-and-effect chain, or network of
  relationships would be clearer as a picture than as prose, draw it as a fenced
  ```mermaid code block with short plain-word labels and no scripts, click actions,
  remote content, or HTML labels. Safe illustrative fenced code may help a computing
  topic: it is static text, never executable behavior. Explain the example in plain
  words and keep required answer evidence in narrative prose. Include a small
  number of relevant emojis across the story, chosen to reinforce the setting,
  action, mood, or idea. Never use random decoration or replace words with emojis.
- All non-narrative fields are plain text without Markdown or emojis, including
  story and chapter titles, taglines, synopsis, captions, beats, primers, trivia,
  hints, intro, pre-session, takeaway, labels, media cues, and metadata.
- Attach 3-5 short trivia cards across at least two acts. They must be true,
  delightful, scene-local, and never contain evidence required by a later answer.
  Reject trivia that merely repeats the lesson or source excerpt. Prefer a
  counterintuitive phenomenon, remarkable magnitude, ingenious experiment, or
  surprising real-world consequence that makes the learner want to tell someone.
  Use plain prose without Markdown markers.
- Add at least four primer cards reinforcing distinct ideas,
  spread across at least three scenes. These do not require four new technical
  terms. Explain essentials inline before they become decision-critical.
  Each primer has one plain definition and one
  everyday analogy. Write the definition the way a friend would explain it out loud
  in one breath: no formal or textbook phrasing, no second technical term inside
  the definition. Every unfamiliar term the story leans on must get this
  plain-words treatment somewhere before the learner needs it. Use "In plain words"
  as the learner-facing label, never "Concept"; preserve internal schema fields
  named concept.
- A scene may contain at most two supplemental learning blocks: primer and trivia.
  Spread them where they reinforce the unfolding story rather than interrupt it.
- Learning-reference cards are temporarily disabled. Ignore supplied
  reference_images, set learning_reference=null, and return
  reference_subject=null, reference_fact=null, and
  reference_fact_citation_refs=[] on every scene.
- Use scene_type="ending" exactly once on the terminal scene and set its outcome.
- Keep synopsis between 140 and 320 characters in one or two punchy sentences. It
  should sell the role, immediate problem, and stakes without explaining the
  mechanism or full solution.
- Populate intro with the learner's role, 1-2 brief cinematic paragraphs, and a
  story-specific CTA. Set subject.discipline to the exact specific topic this story
  teaches, named the way a learner would say it (for example "Fourier transforms",
  1-4 words), never the broad academic field such as "applied mathematics" or
  "physics". Write learning_goal as only 1-2 concise, complete sentences that name the
  concrete real-world facts, event, or mechanism this specific story teaches (for
  example, the actual causes and turning point of this historical event, or the
  specific physical mechanism being explored) so it reads as "what you will learn
  about <this topic>." Never phrase it as a generic reasoning skill alone, such as
  "evaluate evidence" or "make a judgment" with no topic content attached; do not
  use a list, heading, teaser, or story synopsis. Populate stage_label,
  partner_greeting, an open-ended pre_session question with an empty options list
  and a useful placeholder, and
  player_takeaway with concept, field, one-line idea, transferable rule, three
  elsewhere examples, and three specific moments where the learner used it.
 - Keep the intro role wording clean: state the learner's role once. Do not write
  a role-declaration sentence such as "You are the [role]" or "Take charge as
  the [role]" in the blurb/caption. The role field already supplies that label.
  Begin the blurb with the immediate situation and stakes, so it can start
  directly with the second sentence of the story premise.

Ground every factual statement in supplied source excerpts. Citations must be
copied from the supplied evidence, never recreated. Use short paragraphs and
concrete sensory detail. Media cues describe evidence-bearing moments, not
decorative wallpaper. Do not write activity payloads; the activity agent owns
those.
"""
