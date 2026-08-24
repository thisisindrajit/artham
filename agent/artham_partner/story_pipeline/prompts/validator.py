"""Final semantic validation prompt."""

from .story_quality import STORY_QUALITY_BAR

VALIDATOR_INSTRUCTION = """\
Audit the collated story bundle as a hostile, meticulous release gate. The input
omits raw embedding vectors but includes all educational content, source
excerpts, activity solutions, media prompts, and asset metadata.

Use this as the release quality bar:
""" + STORY_QUALITY_BAR + """\

Check:
- factual claims are supported by included citations and do not overstate them;
- the three-act plot performs diagnosis, intervention, changed-condition reversal,
  and durable resolution through one coherent causal chain;
- the learner actively uses the learning objectives;
- the learner has credible agency, professional constraints, visible evidence,
  and consequences that alter the story world;
- the learner is the primary professional protagonist in a believable real-world
  workplace or community operation, never a student, club member, participant,
  trainee, or assistant to the actual decision-maker;
- difficulty, vocabulary, safety, and emotional intensity suit ages 13-18;
- the central concept is a grade 7-9 fundamental understandable with no prior
  subject knowledge, not a simplified explanation of an advanced research mechanism;
- each scene teaches one foundational idea in short sentences without requiring
  specialist semiconductor, fabrication, or research knowledge;
- choices are actionable, concise, meaningful, and do not depend on hidden
  information; wrong options fail visibly for causal reasons;
- quiz answer positions vary and do not reveal correctness through a repeated
  first-option or A-position pattern;
- activities are solvable, non-ambiguous, and pedagogically aligned;
- no scene stacks more than two supplemental learning blocks (primer, reference,
  trivia), and a primer appears before a reference whenever both share a scene;
- the player contract has one ending, at least three meaningful decisions, at least
  one quiz, three simulations for physics stories, three progressive hints
  per graded interaction, three primers, and three trivia cards spanning at least
  two acts. Other subjects may use fewer simulations. Do not require every
  interaction kind in the same story;
- recurring characters remain consistent in prose and image prompts, take visible
  actions, speak naturally, and experience the consequences;
- Prefer image prompts that name and visibly foreground a recurring character.
  Character continuity imperfections are polish warnings, not release blockers.
  Up to two story scenes may lack generated images when the cover remains available;
- simulations are declarative, use story-world controls and units, begin in a
  meaningful problem state, and make the intervention's effect interpretable;
- reject one-control target dials, identity-only outputs, and activities where the
  instructions simply state the number to select. Every simulation must expose a
  useful causal relationship or tradeoff through at least two controls and one
  derived readout that depends on two or more controls;
- reject lookup and base-conversion readouts in physics stories; require direct,
  auditable arithmetic relationships instead;
- every simulation and quantitative slider has specific shows/move/watch guidance;
simulation guidance must remain exploratory and must not prescribe a fixed
control value or target number;
  reject vague controls that do not explain the range, readout, target, and visible
  story consequence;
- execute a mental audit of every declarative simulation: each observed variable
  has a typed readout, every readout input exists, lookup cases use selectable
  values, the success condition is reachable on the declared min/max/step grid,
  and, when an internal success witness exists, compare it with
  readout.success_value. A mismatch in this internal target metadata is a warning
  for an open-ended simulation, not a release blocker; do not require that the
  computed success output exactly equals this legacy field. Reject named-but-uncomputed
  outputs, placeholder
  text, unreachable targets, inconsistent units, and explanations the renderer
  cannot visibly demonstrate;
- independently calculate every slider and simulation output at its initial,
  successful, and boundary settings. A derived quantity must change dynamically;
  reject identity placeholders, omitted linear parameters, formula/text conflicts,
  and any result that is merely repeated from the prompt;
- observed_variables must equal the readout_id set exactly. Do not invent quality
  requirements for emoji, decorative formatting, or prose ornamentation;
- Two or three explanatory scenes must include distinct openly licensed or public-domain reference
  image with exact attribution and license metadata, a jargon-free explanation of
  what to notice, and a concrete reason it matters to the current story problem;
  reject unattributed images, invented licenses, decorative references, and any
  reference that contains the only clue needed for an answer;
- narrative strings are safe GitHub-Flavored Markdown. Encourage useful emphasis,
  lists, blockquotes, and compact comparison tables, but reject raw HTML, Markdown
  images, executable code, or links embedded in narrative prose;
- simulation interaction slots intentionally use scene_type "narrative" because
  simulations are ungraded hands-on models embedded before the scene decision.
  Never request a "simulation" scene_type; it is not part of the player contract;
- imagery depicts the recurring cast inside each specific state-changing beat with
  a continuity bible, coherent production details, and no generic infographic,
  empty environment, stock-photo, or textbook composition;
- the cover is a minimal, grounded single moment with at most two characters and
  no poster, montage, title-card, promotional, or heroic-ensemble styling;
- video and music are consistent, necessary, restrained, and safe; music is slow,
  mild, beatless ethereal ambience with a spacious binaural stereo field, concrete
  details from the story setting, and a low-intensity emotional arc; reject binaural
  beats, percussion, rhythmic pulses, generic ambient tracks, or urgent scoring.
  Any video is 1920x1080, 16:9;
- alt text is useful and media never carries the only copy of required evidence;
- learner-facing copy contains no filenames, extensions, snake_case, raw IDs, asset
  keys, format names, or implementation jargon;
- the takeaway is transferable and supported by what the learner did.

Treat passive exposition, arbitrary urgency, a first fix that never gets tested,
generic media prompts, recall-only activities, consequence-free wrong answers,
and an ending that merely summarizes as errors, not polish warnings.

Every error must include an exact component, JSON-style path, and actionable
repair instruction. Warnings are non-blocking polish only. is_valid is true only
when there are no errors. Do not lower standards because repair is available.
"""
