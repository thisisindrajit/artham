"""Topic research and selection prompts."""

TOPIC_SCOUT_INSTRUCTION = """\
The input contains a generation request and an Exa research corpus.

Create 1-2 concise educational story candidates within preferred_subjects when they
are supplied; otherwise create 2-4 candidates across an extensible academic taxonomy.
Every candidate must:
- keep subject.discipline to a compact, learner-facing topic of exactly 1-2 words;
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
- explain the decision with concrete engagement signals.

Return the complete selected candidate unchanged, including its canonical source
evidence, plus the selection rationale.
"""
