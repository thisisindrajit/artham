"""Declarative activity-generation prompt."""

from .story_quality import STORY_QUALITY_BAR

ACTIVITY_INSTRUCTION = """\
The input contains a full storyline. Generate one declarative activity for every
scene with an interaction_slot and no activities for other scenes.

""" + STORY_QUALITY_BAR + """\

Rules:
- keep the complete response concise enough to finish: use short labels, prompts,
  feedback, guide sentences, and explanations; never repeat storyline narration;
- activity kind must exactly match the scene's interaction_slot, including slider;
- generate the exact activity kind requested by each interaction slot. A physics
  storyline must yield exactly three simulations;
- every answer must be derivable from information already encountered;
- wrong answers should represent plausible misconceptions, not jokes;
- quizzes ask for the next action, diagnosis, prediction, or durable fix rather
  than a definition. Always provide exactly four substantial options and exactly
  one correct option. Each option should be an open-ended strategy a thoughtful
  professional might genuinely consider, not a short factual fragment. Distractors
  must be plausible but causally flawed, and feedback must explain the consequence.
  Vary the correct answer's source position across quizzes; use a different position
  for each quiz and do not consistently put it first or label it A;
- reorder activities reconstruct a 4-6 step causal chain the learner just
  observed. correct_order must be an exact permutation of item IDs. Also provide
  a plain instruction, a visible wrong-order consequence, a visible right-order
  consequence, and optional mechanism detail on each step;
- simulations are declarative only: use a reusable model_kind, 2-4 bounded
  numeric controls, observed variables, executable readouts, and a simple boolean
  success_condition for internal validation only.
  Controls must be two different story-world levers with meaningful units and safe
  bounds.
  Their initial state should expose the problem; changing any control should
  produce an interpretable before/after change;
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
- success_condition is limited to reachable control-to-number comparisons such as
  "binary_input == 12" or "heat >= 6 && heat <= 8". Every identifier must be a
  declared control. Do not use arithmetic, functions, OR, or compare two controls;
- every simulation includes guide.shows, guide.move, and guide.watch. These are
  complete plain-language sentences explaining what is on screen, which control
  to move, and what causal change to notice.   guide.watch must describe the causal relationship and visible trend, not name a
  target number. guide.move must invite experimentation with both causes and
  must never tell the learner to hold one control fixed or reach a specific value;
- Prefer simulations over sliders. When one bounded quantitative choice is useful,
  express it as a simulation control so the learner can observe more than one
  consequence.
  Provide safe min/max/step/initial values, 3-5 feedback bands, a driver limit,
  risk model, and a declarative readout. Prefer the generic
  linear expression with readout_params {intercept, slope}; use a specialist
  expression only when its named formula genuinely matches the subject;
- a linear slider must always include finite numeric readout_params with exactly
the keys intercept and slope (never {}). Check the formula at the initial value,
every target-band value, and both endpoints. If you cannot provide those two
numbers, use a declarative simulation instead of a slider.
  If the comparison metric also changes with the slider, use driver_expr
  part_of_total_percent with a numerator parameter instead of presenting it as a
  fixed number. For founder ownership after investment, numerator is pre-money
  value and the live percentage is numerator / (numerator + investment) * 100;
- every slider includes guide.shows, guide.move, and guide.watch. Explain in
  complete, story-specific sentences what the meter represents, exactly which
  slider the learner should move and across what range, and which visible readout
  or consequence proves the setting is helping;
- never emit JavaScript, Python, HTML, shell, SQL, URLs, or executable code;
- reflections come after a temporary success or reversal and ask what remains
  uncertain, what evidence could break the current model, or why the fix may fail
  under changed conditions; never ask for feelings or personality labels;
- explanations describe the observed in-world consequence first, then connect it
  to the learning objective in one concise paragraph.
"""
