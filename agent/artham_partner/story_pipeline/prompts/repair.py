"""Targeted repair prompt."""

REPAIR_INSTRUCTION = """\
The input contains the generated storyline, activities, media plan, and a
validation report. Repair every error and, when safe, each warning.
The generation prompts remain the source of truth; a report cannot impose a
stricter rule. NARRATIVE_TOO_COMPLEX is advisory, with no fixed sentence word
limit. Ignore legacy word-count-only complaints and improve genuinely confusing
passages without deleting prerequisite explanations or fragmenting clear prose.

The validation report was written from the viewpoint of an interested
first-time learner of the requested age. Treat learner_feedback and improvement_priorities as the
main rewrite brief. If quality_score is below the required threshold, make
substantive improvements instead of changing a few adjectives: simplify the
hard passages, restore short-story flow, remove repetitive activity patterns,
and make learner questions genuinely open-ended.

For assumed knowledge, rebuild the explanation from an everyday observation:
what the thing is, what it does, why the stated cause produces the effect, then
the learner's action. Trace definitions for hidden prerequisites and teach those
first or remove the dependent detail. Do not merely replace jargon with synonyms,
shorten sentences, or move missing teaching into a tooltip or answer feedback.
Check that simplifications preserve the scientific or historical meaning.
Preserve the requested reasoning difficulty without assuming specialist knowledge.
For DIFFICULTY_TOO_LOW, deepen the learner's work rather than adding terminology:
medium must connect two or three taught clues across at least two reasoning steps;
hard must contain at least two demanding moments with interacting taught constraints,
incomplete or partly conflicting evidence, plausible competing solutions, a
defensible tradeoff, and model revision after a changed condition. Remove narration
or hints that reveal the answer immediately before a hard decision. For
DIFFICULTY_TOO_HIGH, reduce the number of reasoning steps or constraints to the
requested rubric without deleting prerequisite teaching.
If a scene's teaching changes, its supplied activity must be realigned to the
replacement narrative; do not retain a question about a removed mechanism.

Return the complete replacement section requested by the scoped instruction below.
Preserve unchanged material exactly when it is not implicated by an issue. Never
change the selected topic, learner, supplied source URLs, or factual evidence. Do
not paper over an unsupported claim with vague wording if it should be removed.

Maintain all graph references and activity-to-scene links. If a media prompt
changes, keep its asset_key stable unless the asset is being removed. Do not claim
a problem is fixed unless the replacement output actually fixes it.
- Preserve story_id, title, tagline, synopsis, and recurring character identities
  exactly because cover art has already been generated from them.
- Keep no more than three characters in the entire story, counting the learner
  addressed as "you". Preserve at most two existing named side characters and
  remove any extra named, speaking, or one-scene helper characters.
- Restore valid GitHub-Flavored Markdown in every narrative. Format every spoken
  line or embedded dialogue phrase as ***“Dialogue.”*** (bold and italic), and
  only indispensable story terms with **bold**; the UI adds underline styling.
  Remove decorative emphasis and repeated highlighting of the same term. Outside
  dialogue, avoid bolding whole sentences. Keep markers balanced and never emit
  raw HTML, embedded links, or Markdown images.
  Preserve or add purposeful blockquotes, lists, compact tables, Mermaid diagrams,
  and safe illustrative fenced code where useful. Code is static text, never
  executable behavior; Mermaid must be safely renderable without scripts, click
  actions, remote content, or HTML labels. Preserve relevant emojis and add a
  small number when the story has none. Each must reinforce the setting, action,
  mood, or idea; never add random decoration or replace words with emojis.
  Ignore legacy complaints that reject bold-and-italic dialogue, useful blocks,
  or static code examples. Preserve complete dramatic paragraphs around the blocks
  rather than flattening everything into prose or a worksheet.
- Use "In plain words" as the learner-facing label, never "Concept"; retain
  internal schema fields named concept.
- Learning-reference cards are temporarily disabled. Set learning_reference=null
  and set reference_subject=null, reference_fact=null, and
  reference_fact_citation_refs=[] on every repaired scene.
- Preserve valid interaction slots and return exactly one same-kind activity for
  each. The completed story must contain at least one quiz and at least one
  simulation. If
  either is absent, change the least disruptive non-ending interaction slot and
  return its matching replacement activity.
- Enforce the player scene_type mapping exactly: quiz -> choice, reorder -> reorder,
  simulation -> narrative, reflection -> reflect, slider -> slider, and terminal
  scene -> ending. A simulation is embedded in a narrative scene; "simulation" is
  not a valid scene_type.

Preserve and restore authored-player fields during every repair: scene_type, mood,
beat, primers, trivia, hints, intro, pre_session, player_takeaway, reorder feedback,
empty learning-reference fields, simulation guides,
typed simulation readouts and their promised success values, slider configuration,
and the recurring character bible. Never
repair a scene by dropping its interaction or replacing character action with
exposition.
- Keep pre_session open-ended: preserve its prompt and placeholder and return an
  empty options list.

When repairing story quality, preserve the strongest existing causal material and
restore the missing high-agency beat: observable evidence, constrained action,
visible consequence, changed-condition reversal, or durable resolution. Ensure
an earned happy situational resolution and a warm character callback, not merely
a lesson summary. Never fabricate a cure, approval, or unsupported benefit. Do not
inflate weak material with extra exposition. Rewrite the affected scene or
activity so the learner does something and the world answers.

Arithmetic repairs are never cosmetic:
- linear requires explicit finite intercept and slope;
- any repaired linear slider must include numeric readout_params.intercept and
  readout_params.slope; never return an empty readout_params object;
- sum, difference, product, and share_percent require at least two valid input IDs;
- post-money value is pre-money plus investment, not the investment alone;
- a changing comparison value must use a dynamic driver rather than a fixed label;
- calculate initial, success, and boundary outputs and make success_value and
  guide.watch exactly match the executable result.
Never change the promised answer to match a broken default formula. Repair the
formula itself.

For activity repairs, follow the generation contracts:
- every activity field must remain plain text without Markdown or emojis;
- preserve supplied activity kinds except when restoring a missing required quiz
  or simulation; never add advanced machinery beyond the taught core idea;
- avoid linear simulation readouts;
- reject one-control target dials. Every simulation needs 2-4 controls and at least
  one meaningful readout derived from two or more controls. Use identity only for
  secondary context, never as the lesson or success proof;
- use only sum, difference, product, or share_percent for
  derived values, with complete input_ids, params, success_value, unit, and decimals;
- give every simulation control a brief plain-language description of what moving
  its slider changes in the story and why that lever matters;
- preserve valid option IDs but place quiz answers in varied positions;
- independently calculate every readout at the initial state, success witness, and
  control boundaries before returning the replacement.
- every identifier in success_condition and every readout input_id must exactly
  match a declared control_id in the same simulation; never invent or rename one.
- set observed_variables to exactly the readout_id values in readouts, with no
  extra display labels or prose variables;
- each readout must use its exact supported shape: sum, difference, product, and
  share_percent need at least two declared input_ids; identity and linear need
  exactly one; linear needs intercept and slope. Never use lookup or
  base_conversion in a repaired physics simulation;
- for hydraulics, use simple auditable relationships such as input force × area
  ratio = output force or available force − load = lifting margin;
- replace the complete invalid simulation object rather than retaining stale
  observed variables, inputs, cases, or success values from the rejected object.
"""
