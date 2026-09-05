"""Declarative activity-generation prompt."""

from .story_quality import STORY_QUALITY_BAR

ACTIVITY_INSTRUCTION = """\
The input contains a full storyline. Generate one declarative activity for every
scene with an interaction_slot and no activities for other scenes.

""" + STORY_QUALITY_BAR + """\

Rules:
- keep the complete response concise enough to finish: use short labels, prompts,
  feedback, guide sentences, and explanations; never repeat storyline narration.
  Every activity field is plain text: do not use Markdown syntax, emojis, headings,
  blockquotes, tables, fenced code, or emphasis markers;
- activity kind must exactly match the scene's interaction_slot, including slider;
- each ActivitySpec must populate exactly one payload field and set every other
  payload field to null. Use this strict mapping:
  kind="quiz" -> quiz only; kind="reorder" -> reorder only;
  kind="simulation" -> simulation only; kind="reflection" -> reflection only;
  kind="slider" -> slider only. Never copy a payload from another activity, never
  combine payload types, and perform a final field-by-field check before returning;
- generate the exact activity kind requested by each interaction slot. The
  blueprint already guarantees at least one quiz and one simulation;
- every answer must be derivable from information already encountered;
- Audit every learner-facing field, including wrong options, feedback, units,
  readout labels, and hints. Do not introduce a new prerequisite or unexplained
  technical term. If narrative teaching is missing, ask only about the explained
  evidence; feedback must not be the first place the needed concept is taught;
- adapt the reasoning burden to storyline.difficulty. Easy questions use one
  relevant clue for one guided reasoning step. Medium questions require connecting
  two or three taught clues across at least two reasoning steps and rejecting one
  plausible alternative. Hard questions require tracking interacting taught
  constraints, interpreting incomplete or partly conflicting evidence, comparing
  plausible solutions, and defending a tradeoff or revising a model after a changed
  condition. A hard answer must not be recoverable by copying the immediately
  preceding sentence or choosing the only detailed option. Never make a question
  harder through obscure terminology, extra mechanisms, or arbitrary arithmetic;
- wrong answers should represent plausible misconceptions, not jokes;
  - quizzes are a required first-class activity whenever the blueprint requests
  kind="quiz". Ask for the next action, diagnosis, prediction, or durable fix
  rather than a definition, and make it answerable only by reasoning through
  this scene's specific evidence and story situation — never a generic question
  that could be dropped into any story on the topic. Always provide exactly
  four substantial options and exactly one correct option. Each option should
  be a concrete action a beginner can understand from the scene.
  Match the requested reasoning difficulty, including guided easy questions.
  Never phrase the correct option as a near-verbatim restatement of
  a sentence already in the narrative, never make it the longest or most
  detailed option, and never let it "sound most correct" on its own — it
  should only become identifiable once the learner connects the scene's
  specific evidence. Distractors must be understandable: each should use
  real scene evidence, solve part of the problem, and fail only because it
  misses one specific constraint, causal link, or changed condition. Never
  invent an unsupported failure mode (equipment damage, overheating, total
  impossibility) that the storyline never established; ground every
  distractor's flaw in something the story actually showed. Keep options
  parallel in length, specificity, confidence, and professional tone. Never
  signal the answer through qualifiers, extra detail, moral language, absurd
  risk, or one uniquely comprehensive option. The correct answer should
  become clear only after integrating the evidence, and feedback must
  explain the visible consequence of every option.
  Vary the correct answer's source position across quizzes; use a different position
  for each quiz and do not consistently put it first or label it A;
- reorder activities reconstruct a 4-6 step causal chain the learner just
  observed, where each step is a real judgment or planning stage the learner
  reasons through, not a rote recall list. Never include a step that only names
  an action to skip (such as "bypass step X") without the learner having a
  reason to conclude that from evidence. Every step and its stated consequence
  must be grounded in what the story actually established; never introduce a
  new unsupported technical claim, yield number, or cost figure here that was
  not already in the storyline. correct_order must be an exact permutation of
  item IDs. Also provide a plain instruction, a visible wrong-order
  consequence, a visible right-order consequence, and optional mechanism
  detail on each step;
- simulations are declarative only: use a reusable model_kind, 2-4 bounded
  numeric controls, observed variables, declarative readouts, and a simple boolean
  success_condition for internal validation only.
  Controls must be two different story-world levers with meaningful units and safe
  bounds. Every control must include a brief, plain-language description explaining
  what that slider changes in the story and why the learner might move it. Do not
  merely repeat the label, unit, or range.
  Their initial state should expose the problem; changing any control should
  produce an interpretable before/after change;
- every simulation must feel like manipulating the actual story situation, not a
  generic calculator. Controls must be independent physical or operational causes
  the learner can name, and readouts must show the consequence the characters care
  about. Include a problematic baseline, at least two meaningfully different test
  regimes, and an intervention whose effect can be compared against the baseline;
- never use arbitrary on/off protection switches, labels that merely rename an
  answer, decorative controls, or a success condition already true at every setting.
  The learner must predict a trend, test competing settings, observe a visible
  consequence, and explain why it changed;
- every simulation must teach a causal relationship or tradeoff. At least one
  visible readout must combine two or more controls through sum, difference,
  product, share_percent, or a complete multi-input lookup. Never create a model
  whose only task is moving one control to a number already stated in the guide;
  never mirror a control as the main output; and never label the control and
  readout as the same quantity;
- every observed variable has exactly one same-ID readout. Use identity, linear,
  sum, difference, product, or share_percent. Name all
  input_ids, provide required params
  or complete lookup cases, and state the exact success_value the renderer must
  display. For example, decimal 12 converted with radix 3 must visibly produce
  "110"; never merely name an output or say it "changes";
- calculations must be live functions of the controls. Use sum for totals such as
  post-money value, and share_percent for one part divided by the sum of all parts.
  Avoid linear readouts. Use identity only when the displayed value is
  exactly one control, sum/difference/product/share_percent for derived values, and
  Every readout must include input_ids, params (use {}
  when the selected operation needs none), success_value, unit, and decimals.
  Never use identity as a placeholder for a derived result. Recalculate every
  promised target by hand before returning it;
- never use lookup or base_conversion in a physics simulation. For hydraulics,
  prefer auditable models such as input force multiplied by piston-area ratio to
  display output force, or available force minus required load to display lifting
  margin. Keep each relationship foundational and physically coherent;
- physics readouts must be dimensionally coherent and must not present a convenient
  arithmetic proxy as an exact law. If the renderer cannot express the full equation,
  create a clearly labeled scaled comparison model, explain what trend it preserves
  and what it omits, and never invent precise real-world measurements;
- success_condition is limited to reachable control-to-number comparisons such as
  "binary_input == 12" or "heat >= 6 && heat <= 8". Every identifier must be a
  declared control. Do not use arithmetic, functions, OR, or compare two controls;
- every simulation includes guide.shows, guide.move, and guide.watch. These are
  complete plain-language sentences explaining what is on screen, which control
  to move, and what causal change to notice.   guide.watch must describe the causal relationship and visible trend, not name a
  target number. guide.move must invite experimentation with both causes and
  must never tell the learner to hold one control fixed or reach a specific value;
- Preserve the selected activity kind. Never inflate a single explained cause
  into a multi-control simulation for complexity's sake. For a slider,
  Provide safe min/max/step/initial values, 3-5 feedback bands, a driver limit,
  risk model, and a declarative readout. Prefer the generic
  linear expression with readout_params {intercept, slope}; use a specialist
  expression only when its named formula genuinely matches the subject;
- a slider must never be an answer dial that simply directs the learner to a
  single stated target range or value already given in the story. It must be a
  genuine comparison model: at least one other displayed quantity (such as a
  cost, time, or resource readout) must visibly change as the slider moves,
  using real readout_params, so the learner discovers the tradeoff by moving
  the control rather than matching a number they were already told. Never keep
  a comparison quantity fixed while the guide implies it depends on the
  slider. Never invent an unsupported numeric target (a percentage, step
  count, or price) that conflicts with a number already established in the
  storyline;
- a linear slider must always include finite numeric readout_params with exactly
the keys intercept and slope (never {}). Check the formula at the initial value,
every target-band value, and both endpoints. If you cannot provide those two
numbers, repair the model without changing the selected activity kind.
  If the comparison metric also changes with the slider, use driver_expr
  part_of_total_percent with a numerator parameter instead of presenting it as a
  fixed number. For founder ownership after investment, numerator is pre-money
  value and the live percentage is numerator / (numerator + investment) * 100;
- every slider includes guide.shows, guide.move, and guide.watch. Explain in
  complete, story-specific sentences what the meter represents, exactly which
  slider the learner should move and across what range, and which visible readout
  or consequence proves the setting is helping;
- never emit executable behavior, scripts, raw HTML, URLs, Markdown, or emojis.
  Keep simulations and sliders within their declared data contracts and keep
  feedback in-world rather than a lecture;
- reflections come after a temporary success or reversal and ask what remains
  uncertain, what evidence could break the current model, or why the fix may fail
  under changed conditions; never ask for feelings or personality labels;
- explanations describe the observed in-world consequence first, then connect it
  to the learning objective in one concise paragraph.
"""
