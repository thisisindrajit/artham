"""Small-output prompts for parallel scene and activity workers."""

from .story_quality import STORY_QUALITY_BAR

SCENE_CHUNK_INSTRUCTION = """\
Write exactly one complete SceneDraft from the supplied story blueprint and
scene specification. Do not return a wrapper or any other scene.

""" + STORY_QUALITY_BAR + """\

Rules:
- obey every fixed ID, act, title, beat, next_scene_id, scene_type, mood,
  interaction_slot, concept, and outcome from scene_spec;
- dramatize scene_spec.narrative_goal and include every required fact without
  repeating the whole blueprint;
- use scene_spec.learning_purpose as the teaching plan. prior_learning_context
  contains earlier plans, not proof of what another worker actually wrote.
  Reconnect needed prerequisites to the current action in ordinary words, without
  repeating an entire lesson. Adjacent future scenes and source_evidence are NOT learner knowledge.
  Teach the one new idea with what it is, what it does, and a concrete cause and
  effect before asking for a decision. Never assume a fact is understood merely
  because it was named in the blueprint or a professional would know it;
- write 1-2 substantial narrative paragraphs that flow like a compelling short
  story, each containing 3-5 full sentences. Start with immediate action, an
  intriguing contradiction, or a vivid unanswered question; build tension through
  concrete action, sensory evidence, natural dialogue, and discovery; then end on
  a reveal, consequence, or decision that makes the learner want the next scene;
- use only the learner addressed as "you" and the 1-2 recurring named side
  characters supplied by the blueprint. Never invent an extra named or speaking
  character, even for a single scene;
- prefer the simplest familiar word that keeps the meaning accurate. If an
  everyday 13-year-old would pause over a word, replace it or explain it at once.
  Never sound like a textbook, lab report, or operations manual;
- keep the explanation to one central idea and one everyday analogy. Use no more
  than two numerical quantities and introduce at most one unfamiliar term;
- preserve the blueprint's reasoning difficulty in the scene. Easy places the
  relevant clue close to a guided one-step decision. Medium presents two or three
  taught clues without resolving their connection for the learner. Hard preserves
  the planned uncertainty, interacting constraints, and tradeoff so the learner
  must compare plausible paths; do not let narration, dialogue, hints, or the final
  sentence announce the answer before the activity;
- use valid GitHub-Flavored Markdown in every narrative: format each spoken line
  or phrase, including dialogue embedded in a narration paragraph, as
  ***“Dialogue.”*** (bold and italic); emphasize only a few indispensable terms
  whose meaning is essential to following the story with **bold**, which the UI
  styles with an underline. Never bold decorative words, ordinary actions, whole
  sentences, or every repetition. Outside dialogue, avoid bolding whole sentences; keep
  every emphasis marker balanced and never emit raw HTML, links, or images;
- when a scene explains a structure, sequence, or relationship a picture makes
  instantly clearer (a branching decision, a cause-and-effect chain, a network of
  connections, a before/after flow), consider a fenced ```mermaid code block
  using flowchart or sequence syntax, with short plain-word labels (2-4 words each,
  no unexplained visible identifiers), only when it clarifies rather than repeats.
  Use purposeful blockquotes, lists, or comparison tables where they help the
  story, and safe illustrative fenced code as static text when useful to the topic.
  Never execute code or include scripts, click actions, remote content, or HTML
  labels in Mermaid. Include relevant emojis that reinforce this scene's setting,
  action, mood, or idea. Never use random decoration or replace words with emojis;
  emojis need not appear in every scene;
- for an ending, show an earned happy situational resolution and a warm character
  callback, not a cliffhanger or lesson summary. Keep success factual and safe,
  never a fabricated cure;
- choices belong only in a scene_type="choice" scene and must have visible
  consequences. A scene_type="reflect" scene must never include any choices,
  scored options, or true/false statements — write only open narrative prose
  that raises a genuine question the learner considers; the matching activity
  supplies the actual reflection prompt;
- an interaction scene includes exactly three useful hints;
- include reinforcing primers only when include_primer is true; this never
  prevents explaining an unfamiliar idea inline. A primer may explain a familiar
  idea without adding a technical term. When include_trivia is true,
  turn scene_spec.trivia_fact into one lively standalone card without mentioning
  sources, evidence, the lesson answer, or nearby narration. Otherwise set trivia
  to null;
- media_cue is one grounded visual moment with no text, labels, or UI;
- title, beat, hints, primer, trivia, media_cue, concept, probe, and every other
  non-narrative field are plain text without Markdown or emojis;
- source_evidence is a numbered list (position 1, 2, 3, ...) of real sources
  supplied for this story. When a narrative sentence or the trivia fact states
  a specific factual claim (a number, a date, a named discovery, a real
  event) that is drawn from one of these sources, add that source's 1-based
  position to citation_refs (on the scene for narrative facts, and on trivia
  for the "did you know" fact specifically). Leave citation_refs empty when a
  passage is dramatized/fictional connective tissue rather than a specific
  claim from a supplied source. Never invent a citation index that is not a
  real position in source_evidence, and never fabricate a source, filename,
  or image metadata that was not supplied;
- learning-reference cards are temporarily disabled. Return
  reference_subject=null, reference_fact=null, and
  reference_fact_citation_refs=[]; do not generate external-reference copy.
"""

ACTIVITY_CHUNK_INSTRUCTION = """\
Create exactly one ActivitySpec for the supplied scene. Do not return a wrapper,
another activity, storyline content, or media.

The activity_id must be "activity-" followed by scene.scene_id. The scene_id and
kind must exactly match scene.interaction_slot. Populate only the matching
payload field and set all other payload fields to null.

Obey story_context.difficulty and request.target_age. Easy asks for one guided
reasoning step from one relevant clue. Medium requires the learner to connect two
or three taught clues across at least two reasoning steps and reject one plausible
alternative. Hard requires interacting taught constraints, incomplete or partly
conflicting evidence, comparison of plausible answers, and a defensible tradeoff
or changed-condition revision. Hard options must remain genuinely plausible until
the learner reasons through every relevant constraint. Adaptive obeys the concrete
difficulty already chosen in story_context; without learning history that is easy.
At every level, assume zero topic knowledge beyond this scene's narrative.
Audit all options, feedback, hints, units, guide text, and labels for missing
prerequisites, not just the correct answer. If a necessary idea is absent, design
the question around what is actually taught instead of adding specialist facts.
Feedback may reinforce the explanation, never introduce what was needed to answer.
Keep explanations tied to the unfolding story, not technical tangents.
Every activity field is plain text. Do not use Markdown syntax, emojis, headings,
blockquotes, tables, fenced code, Mermaid, links, or emphasis markers.

Use short JSON. Use reflection for open-ended questions and quiz when the
scene asks the learner to choose between competing explanations. For reorder,
use a 4-6 item causal chain. For a simulation,
use 2-4 independent bounded controls and declarative readouts whose identifiers
refer only to declared controls. Success conditions compare declared controls
directly with numbers. For reflection, ask for evidence or uncertainty rather
than feelings. Prefer a quiz or reorder over a forced quantitative model, but never change
the supplied kind. A supplied kind="quiz" must always produce a quiz payload.

Quiz rules:
- ground the question, every option, and the feedback only in facts, actions, and
  evidence stated in the scene's narrative text. Never refer to an image, photo,
  illustration, video, diagram, reference, or anything the learner "sees" or
  "looks at" — the learner may be reading this without any media rendered;
- distractors must be plausible misconceptions grounded in the same narrative
  evidence, not jokes or padding; keep every option parallel in length and tone
  so none is signaled as correct by its wording;
- the question must be answerable using only the single idea already explained in
  this scene's narrative plus everyday common sense. Never require the learner to
  know a second technical mechanism, named structure, or formula that was not
  plainly stated in this same scene.

Reorder rules:
- every step and its ordering must be directly explained or shown happening in
  this scene's narrative text — never require the learner to infer a step from
  outside specialist knowledge or a second mechanism not already stated here;
- keep each step a short, concrete plain-language action or observation, not a
  technical procedure name;
- the visible wrong-order and right-order consequences must each be simple,
  single-sentence outcomes a 13-year-old can picture immediately.

Simulation rules:
- controls must be two to four independent, bounded, story-world levers the
  characters could actually adjust, each with a real unit and a safe range;
- every control must include a brief, plain-language description of what its slider
  changes and why that change matters in this scene; never repeat only its label,
  unit, or numeric range;
- every readout must be a live function of the controls (identity, linear, sum,
  difference, product, or share_percent) that produces a visibly different,
  interpretable value when a control changes; never mirror a control as its own
  readout and never leave a readout unaffected by any control;
- the initial control values must expose the story's problem, and moving a
  control must show a clear before/after consequence the characters care about;
- success_condition may only compare a declared control to a reachable number
  (e.g. "heat >= 6 && heat <= 8"); never use undeclared identifiers;
- write guide.shows, guide.move, and guide.watch as complete, story-specific
  sentences: what is on screen, which control to move, and what causal trend to
  notice. Never tell the learner the exact number to reach.

Slider rules:
- a slider must be a genuine story-native single-variable dial, not a disguised
  quiz. Never use it to isolate one control toward one prescribed target number;
- driver_value, target_minimum, target_maximum, and every band boundary must be
  bounded, clearly fictional scenario settings, never a precise-sounding
  real-world figure (an exact temperature, percentage, or measurement) that is
  not explicitly present in the supplied evidence;
- include a short plain-language `description` for the slider that says what
  moving it changes and why that matters in the story. It is shown directly
  below the parameter name, so do not repeat only the label or range;
- before returning, numerically compute readout_expr at minimum, initial,
  target_minimum, target_maximum, and maximum using readout_params. Verify every
  band's max is consistent with those computed values and that risk_safe_gap is
  the same distance used across bands, target range, and explanation — a value
  the rules call safe must not also fall inside risk_safe_gap of an unsafe
  boundary;
- explanation must state, in plain words, exactly what the computed readout
  means at the target range so the learner can check their own math.

Reflection rules:
- reflection is never scored and never presents right/wrong options; prompt and
  placeholder must invite the learner to predict, explain, compare, justify a
  decision, name missing evidence, or identify a condition that could break the
  current fix, using their own words;
- evidence_to_notice lists facts already stated in the scene, not new claims.
"""
