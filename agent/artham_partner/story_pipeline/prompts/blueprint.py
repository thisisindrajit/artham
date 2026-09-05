"""Compact whole-story architecture prompt."""

from .story_quality import STORY_QUALITY_BAR

BLUEPRINT_INSTRUCTION = """\
Design a compact blueprint for one interactive educational story. Do not write
scene prose. The blueprint is the continuity contract for independent scene
workers.

""" + STORY_QUALITY_BAR + """\

Rules:
- if request.story_brief is present, treat it as the authoritative
  description of the exact story to build (setting, plot, roles, tone). It
  takes priority over inferring intent from preferred_subjects.topic_tags
  alone; use the topic_tags/discipline only to keep the underlying concept
  correct, not to override what story_brief actually asks for;
- copy selected_topic.candidate.subject exactly. Its domain is the broad subject,
  discipline is the learner-facing parent topic, and topic_tags are optional
  narrower concepts. Never replace discipline with the broad subject;
- state learning_goal as the one chosen core idea in plain words; every scene's
  narrative_goal and required_facts must serve that idea. Include the minimal
  prerequisite explanation needed to understand it, not tangential research
  methods or extra mechanisms just because they appear in the sources;
- plan the teaching sequence explicitly in learning_purpose: name what the learner
  has already been taught, the one idea this scene develops, its plain
  definition, and the everyday observation that makes it understandable. Put the
  actual source-supported explanation in required_facts, not just a topic label.
  The first scene has no assumed topic knowledge. Each later scene may rely only
  on earlier teaching, never a future scene, optional card, or research excerpt.
  If prerequisites cannot fit clearly, narrow the lesson rather than compress it;
- set difficulty to request.difficulty when it is easy, medium, or hard. For
  adaptive, choose a concrete level from relevant engagement evidence, defaulting
  to easy with no history. Keep the same zero-knowledge starting point at all levels;
- make the selected difficulty visible in scene plans, not merely in the difficulty
  field. For easy, plan guided one-step choices using one relevant clue. For medium,
  plan at least two moments that connect two or three previously taught clues across
  two reasoning steps and reject a plausible alternative. For hard, plan at least
  two demanding moments: one must compare plausible actions under interacting
  constraints and justify a tradeoff; another must revise the learner's model when
  a relevant condition changes. Name the exact clues, constraints, ambiguity, and
  changed condition in narrative_goal. Do not fake hard difficulty with jargon,
  extra mechanisms, arbitrary calculations, or an answer stated just before the
  question;
- keep learning_objectives and subject.topic_tags limited to that same single
  idea in plain words too; never list a second mechanism, related phenomenon, or
  broader research category as an objective or tag just because it appeared in
  the source evidence;
- use 5-8 scenes in one ordered path within the requested duration and assign
  zero-based positions. Leave enough room to teach before asking;
- scene_id values are short kebab-case IDs; opening_scene_id is the first ID;
- title is the compact chapter name shown in the player's header and progress
  rail: exactly 4-5 plain, everyday words (no colon, subtitle, or punctuation),
  built from common vocabulary a 13-year-old already uses in speech (market,
  garden, rehearsal, mix-up) rather than obscure or decorative synonyms. Make it
  vivid and specific to that scene's concrete
  action, object, or moment; never a generic abstract label such as "Evidence,"
  "Judgment," "First Trial," or "The Verdict" that could belong to any story on
  any topic;
- beat is a separate field: one full plain sentence naming the concrete event
  of that scene, used only in the story's background recap trail, not the
  header. It may be longer and more descriptive than title, but must still
  name one concrete happening, not summarize the whole scene;
- each scene points to the next ID and only the final ending points to null;
- distribute the story across acts 1, 2, and 3 with one final ending;
- narrative_goal states the concrete event, evidence, conflict, and transition
  that the scene worker must dramatize;
- required_facts contains only claims supported by supplied source evidence.
  Never state a precise-sounding number, time limit, or operational consequence
  (a threshold, a percentage, a countdown, a failure time) unless that exact
  figure appears in the supplied evidence; otherwise describe the consequence in
  bounded, clearly fictional scenario terms;
- preserve one professional real-world setting, one or two recurring adult side
  characters, physical stakes, causal progression, a reversal, and a resolved
  happy ending with an earned situational resolution and a warm character callback.
  Plan the earlier detail that makes the callback meaningful, and keep the outcome
  within factual and safety limits, never a fabricated cure. The learner addressed
  as "you" is the protagonist and counts toward the
  absolute maximum of three characters; never plan extra named or speaking roles;
- make a fresh creative choice for this story before planning: select a distinct
  setting, season, time of day, weather, lighting and sound palette, social
  context, and 1-2 culturally varied side-character names with different motives,
  habits, temperaments, and disagreements. Reject rain, storms, darkness, gloomy rooms,
  alarms, generic control rooms, and urgent system failures as defaults.
- choose the complete interaction outline here, before any parallel scene or
  activity worker runs. For each slot, choose the kind because it is the most
  natural way to think at that exact story moment;
- let narrative_goal plan immersion alongside teaching: action, conversation, and
  discovery should carry the essential explanation, without unnecessary tangents.
  Note useful Markdown opportunities only for the future scene narrative where
  they clarify that moment. Every blueprint field itself is plain text without
  Markdown or emojis;
- vary the number, order, and spacing of interaction kinds across stories. Never
  repeat a fixed question -> quiz -> reorder -> simulation -> quick-thought
  template. Leave at least one scene uninterrupted when the plot needs room;
- use reflection for learner questions so the response is open-ended and captures
  a prediction, explanation, comparison, decision, or uncertainty in the
  learner's own words;
- plan at least one quiz slot in every story, placed where the learner has just
  been given enough evidence to decide between genuinely competing explanations.
  A quiz checks understanding of the idea the scene just taught; it is not
  trivia recall. Never plan two quiz slots back to back;
- plan at least one simulation slot in every story. Place it after the narrative
  has taught a story-native causal relationship or tradeoff that the declarative
  renderer can express honestly with two meaningful controls. Narrow the modeled
  relationship rather than omitting the required simulation;
- use reorder or slider only when that format reveals a relationship the prose has
  already prepared and the story truly needs it;
- when a slot is a slider, only use it if the underlying relationship is truly a
  single-variable comparison with a visible consequence; if the story needs the learner to
  compare two or more independent causes, mark that slot as a simulation instead;
- include at least two meaningful learner actions across quiz, reorder,
  simulation, reflection, or slider slots, with at least one open-ended
  reflection, at least one quiz, and at least one simulation. Put them
  where the plot creates a real need to think; do not reserve a fixed activity
  kind for a fixed act;
- plan at least four primer cards across at least three scenes. Set
  include_primer=true for those scenes and specify their distinct plain-word
  ideas in learning_purpose. Cards may explain familiar ideas without adding new
  technical terms. Include the essential explanation in the narrative before
  the learner needs it, even when the reinforcing card shares that scene;
- plan exactly three trivia_fact values across at least two acts. Each
  trivia_fact must be copied or closely paraphrased only from a claim that is
  explicitly present in the supplied source evidence — never invent a number,
  percentage, or capability that is not stated there. Each must be a concrete,
  verified, counterintuitive fact that is unrelated to the scene's answer
  evidence, does not repeat the story's own explanation, stays within the
  single chosen core idea rather than introducing another application or
  phenomenon, and is interesting enough to repeat to a friend. Set include_trivia=true only when trivia_fact is present;
- learning-reference cards are temporarily disabled. Set reference_subject=null
  on every scene and do not plan facts or activities for external reference images;
- spread primers and trivia across scenes rather than stacking every learning
  block in one scene. Count a planned reference as a block: at most two of primer,
  trivia, and reference per scene;
- pre_session is one open-ended, topic-specific question with a useful
  placeholder and an empty options list. It should reveal the learner's starting
  idea without implying that one answer is expected. Ask about an everyday
  observation or prediction, never require a definition or prior topic knowledge;
- keep every field concise. This output is a plan, not the finished story.
"""
