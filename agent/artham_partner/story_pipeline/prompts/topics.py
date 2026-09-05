"""Topic research and selection prompts."""

TOPIC_SCOUT_INSTRUCTION = """\
The input contains a generation request and an Exa research corpus.

Create 1-2 concise educational story candidates within preferred_subjects when they
are supplied; otherwise create 2-4 candidates across an extensible academic taxonomy.
Every candidate must:
- set subject.discipline to the exact specific topic this story teaches, as the
  learner would name it (for example "Fourier transforms", "glacial lake outburst
  floods", "Bayesian networks"). Use 1-4 words. Never replace it with the broad
  academic field or department name such as "applied mathematics", "physics",
  "geography", or "natural hazards". When preferred_subjects are supplied, copy
  preferred_subjects.discipline as this parent topic exactly;
- preserve subject.domain as the broad catalog subject. subject.discipline is the
  learner-facing parent topic, while topic_tags are only narrower child concepts;
- copy at least one complete SourceEvidence object from the supplied corpus;
- contain a real dilemma, investigation, system failure, discovery, or decision
  that can sustain an interactive story;
- offer a credible learner role, visible evidence, a time/resource/safety
 constraint, an intervention, and a plausible changed condition that can test
 whether the learner truly understands the concept;
- place the learner in charge of a believable real-world profession or community
 operation. Reject science clubs, classrooms, school projects, student teams,
 fairs, training exercises, passive tours, and assistant or participant roles;
- teach one coherent concept rather than survey a whole field;
- center a foundational concept a 13-18-year-old can understand, using any recent
  development only as a motivating hook rather than the lesson itself;
- choose concepts normally taught in grades 7-9 and explainable through familiar
  objects or experiences. Reject premises whose core mechanism depends on advanced
  materials, nanoscale effects, specialized instruments, or research terminology;
- identify the minimal prerequisite facts that a complete beginner needs, and
  retain sources that explain those facts rather than only reporting a discovery;
- reject candidates that require university-level jargon, specialist fabrication
  methods, or several prerequisite concepts to understand the main decision;
- be safe and appropriate for the requested age;
- avoid topics listed in excluded_topics;
- distinguish genuine recency ("why now") from merely timeless interest.

Scores are probabilities from 0 to 1. Candidate IDs are stable lowercase slugs.
Score story potential highest when the concept can be used to diagnose and change
a system with visible consequences. Penalize biography, passive tours, broad
surveys, and topics whose only interaction would be factual recall. Do not select
a winner; preserve meaningful subject variety.
"""

TOPIC_SELECTOR_INSTRUCTION = """\
The input contains topic candidates, a learner engagement profile, and the
generation request.

Select exactly one candidate. Optimize for expected engagement without trapping
the learner in a filter bubble:
- prefer patterns supported by completion, active time, accuracy, replay, and
  ratings rather than one noisy event;
- balance familiar formats or interests with a genuinely new concept;
- prefer the candidate with the clearest foundational lesson and simplest visible
  cause-and-effect, not the most technically novel research;
- avoid recently completed or fatigue-tagged topics;
- adapt challenge using evidence, but do not infer personality or learning style;
- never infer subject knowledge from age, interests, or the fictional role.
  Prefer a candidate whose prerequisites can be taught within the requested time;
- explain the decision with concrete engagement signals.

Return the complete selected candidate unchanged, including its canonical source
evidence, plus the selection rationale.
"""

TOPIC_RESOLVER_INSTRUCTION = """\
Select one concrete educational topic from the supplied request, Exa evidence,
and engagement summary. Return one SelectedTopic.

If request.story_brief is present, treat it as the authoritative description
of the desired story and select/ground a candidate that matches it, rather
than a loosely related alternative. Honor an explicit requested topic unless
evidence shows it is unsafe, factually incoherent, or outside the requested
subject. Set subject.discipline to that exact requested topic as a learner
would name it (for example "Fourier transforms"), never the broad academic
field such as "applied mathematics" or "physics". Otherwise prefer a topic
with a surprising real-world mechanism,
clear causal stakes, credible sources, and room for evidence-based learner
decisions. Do not run a candidate tournament. Ground rationale and
evidence_summary in the supplied data only.
Choose a beginner entry point to that exact topic. Preserve sources explaining
what the necessary things are, what they do, and the basic cause and effect.
Do not choose an instrument's research method as a substitute for the topic
itself. If the evidence supports only a narrower claim, narrow the lesson instead
of inventing prerequisite explanations. Difficulty changes the decisions, not
the subject knowledge presumed at the start.
"""
