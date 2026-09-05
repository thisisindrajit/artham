"""Shared quality bar distilled from Artham's strongest authored scenarios."""

STORY_QUALITY_BAR = """\
Match the authored Artham scenarios as the product specification, not merely as
inspiration:
- Before writing anything, silently choose ONE connected core idea you will
  teach, expressible in one or two plain sentences a 13-year-old already
  understands (for example: "below a certain cold point, this material carries
  electricity with no resistance and pushes magnets away"). The idea may
  naturally involve two or three tightly linked concepts that form a single
  cause-and-effect chain (for example inflation → interest rates → borrowing
  cost is one connected idea, not three separate ones) — that is encouraged
  when it makes the lesson feel complete, not a violation. What is banned is
  bolting on a second, unrelated mechanism, structure, or research tangent that
  does not sit on that one causal chain, even if it is true and well-sourced.
  Every scene, primer, quiz, reorder, simulation, and trivia card must serve
  only that one connected idea end-to-end.
- The whole story must be beginner-accessible for a 13-18 year old audience,
  regardless of how advanced the source topic is. If the source material
  is graduate-level, aggressively simplify: keep only the one idea a 13-year-old
  needs for the next decision and cut everything else, rather than compressing the
  full depth into dense scenes.
- Write for ages 13-18, but default to the lower end of that range in practice:
  write as if a curious 13-14 year old is reading, not a near-adult. Use common
  words, short direct sentences, and one idea at a time. Aim for a clear grade 6-8
  reading level even when the source is advanced. If a simpler accurate word exists,
  use it.
- Assume no prior subject knowledge, including related concepts and ordinary words
  used with specialist meanings. Build from an everyday observation. A 13-year-old should understand
  the problem and make the first decision without knowing specialist vocabulary.
- Teach the foundational entry point to the exact requested topic, not a research
  method used to study it. For supernovae, begin with what a star is and what happens
  in the particular kind of stellar explosion supported by the sources, not how
  astronomers infer its shape from polarization. Never merge different explosion
  mechanisms into one explanation. A recent result can be a hook, not a prerequisite.
- Keep the explanatory model deliberately small. Use one central idea, one
  everyday analogy, and at most two quantities in any scene. Do not stack
  multiple related mechanisms merely because they appeared in the research.
  If a detail is not needed for the learner's next decision, omit it.
- Obey request.difficulty throughout the story and activities. Keep the language
  accessible for ages 13-18 while making the reasoning genuinely distinct:
  easy gives one relevant clue and a guided one-step application of one taught cause;
  medium requires two or three taught clues, at least two reasoning steps, and
  elimination of one plausible competing explanation; hard requires interacting
  taught constraints, incomplete or partly conflicting evidence, comparison of
  plausible solutions, a justified tradeoff, and revision after a changed condition.
  A hard story includes at least two demanding reasoning moments and does not hand
  the learner an answer in the sentence immediately before the decision. Adaptive
  chooses a concrete level from relevant learning history and follows its full
  rubric, defaulting to easy when that evidence is absent. Difficulty changes the
  reasoning burden, not vocabulary, assumed knowledge, arbitrary arithmetic,
  technical detail, or sentence length.
- Prefer familiar, durable basics over novel mechanisms. Do not center the lesson
  on advanced materials, nanoscale effects, specialized instruments, atmospheric
  windows, non-equilibrium systems, or current research terminology.
- Introduce no more than one unfamiliar term across the whole scene, counting the
  narrative, primer, and trivia together, not one term per field. Explain it
  immediately with a concrete everyday analogy, then use the simpler wording
  afterward for the rest of the story. Across the entire story, normally cap total
  unfamiliar or technical terms at three; this is a ceiling, not a quota.
  Plain-word primer cards may reinforce familiar ideas without naming a new term.
  When target_age is at least 15 and the
  story_brief explicitly requests a detailed mechanism, allow up to five terms only
  when every term belongs to the same cause-and-effect chain, is taught before use,
  and is necessary to explain how the mechanism works. Never combine a scientific
  or technical term with a
  UI/interaction word (such as slider, quiz, or reorder) in the same scene's
  count budget — the interaction word does not need teaching, but if the scene
  already teaches one term, do not also name a mechanism, structure, or
  classification with a second technical word.
- Prefer describing what happens over naming what something is called. Use a
  formal scientific or technical classification term only when that exact term
  is necessary for the next decision and is directly supported by the supplied
  evidence; otherwise describe the mechanism in plain action language (what
  moves, triggers, or changes) instead of introducing its textbook name.
- Never depict an experimental, unapproved, in-trial, or not-yet-authorized
  medical treatment, drug, or device as approved, released to patients,
  administered to a patient, or successfully curing/treating anyone, even in
  the ending. If supplied evidence describes something as experimental or
  under trial, keep the story's stakes inside an authorized research,
  process-development, or manufacturing-planning setting: the resolution is a
  documented process decision (a route is validated, a batch plan is
  finalized, a report is filed) that could feed a future approved product,
  never a scene of patients receiving or being cured by it.
- Never invent structural, mechanistic, or procedural technical detail (exact
  chemical structures, reaction mechanisms, named steps and the specific
  reason each is needed, instrument readings, or purity/success claims) unless
  that specific detail is explicitly present in the supplied evidence.
  Describe processes only in the plain comparative terms the evidence
  actually supports (for example "the new route uses fewer steps and wastes
  less material" rather than inventing why each step exists or declaring the
  result "pure" or "complete").
- Never invent a precise-sounding real-world number (an exact temperature,
  percentage, or measurement) that is not explicitly present in the supplied
  evidence. Use rounded, clearly fictional scenario values instead (for example
  "colder than a home freezer" or "this test rig's cutoff"), never a specific
  figure dressed up as an established scientific fact. The same applies to
  precise-sounding qualitative consequences — an exact time-to-failure, an exact
  countdown, or an absolute claim ("will melt in seconds," "never needs power
  again"). State these only as bounded, clearly fictional scenario stakes (for
  example "before the shift ends" or "damage the equipment") unless the exact
  claim is explicitly present in the supplied evidence.
- Quizzes, reorders, and simulations must be solvable using only the one chosen
  core idea plus common sense and facts already stated in the story. Never
  require the learner to know or infer a second mechanism, named structure, or
  specialist procedure to pick the right answer or the right order.
- Cast the learner as the story's primary real-world professional: for example a
  detective, chef, engineer, field medic, curator, reporter, planner, technician,
  or expedition lead. Give that role direct authority to investigate and act.
  The role grants agency, not knowledge: explain tools, observations, and actions
  as if this is the learner's first encounter with them.
- Write every story scene in second person, addressing the learner as "you" so
  they experience the action as a main character. Never narrate the learner in
  third person or position them as an audience watching the named cast act.
- Set the premise in a believable workplace or community situation with real
  operational stakes. Never frame it as a science club, classroom, school project,
  student team, fair, training exercise, passive tour, or assistant role. The
  learner is the protagonist doing the job, not helping an expert do it.
- The learner, not a named side character, must make every load-bearing
  decision, judgment call, and resolution. Named cast members may bring
  evidence, disagree, propose options, or react to outcomes, but they must
  never independently decide, sign off on, or resolve the central problem on
  the page — that authority belongs to the learner through the choice, slider,
  reorder, or reflection they act on. If a scene's narration shows a side
  character reaching the conclusion or taking the decisive action, rewrite it
  so the learner does that instead and the side character merely supports it.
  Concretely: a side character may say "here are the three options and what
  we know about each," but must never say "this one is the answer," "this
  works because...," or independently declare a result final, complete, or
  successful. Cut any sentence where a named character announces the winning
  choice or confirms the outcome before or in place of the learner's
  interaction; end that beat with the options on the table and let the
  learner's choice/slider/reorder/reflection be what resolves it.
- Avoid generic control rooms, anonymous dashboards, vague system failures, and
  interchangeable experts. Choose a distinctive place, occupation, physical
  object, deadline, and personal stake that could not be pasted onto another topic.
  The target concept must be the only credible way to understand and resolve the
  central problem.
- Give every story its own sensory and social flavour. Choose the setting, season,
  time of day, weather, light, colours, sounds, pace, and public or private setting
  because they fit this topic's mechanism and stakes. Do not default to rain,
  storms, darkness, alarms, gloomy rooms, or an urgent system failure. Bright,
  calm, crowded, comic, celebratory, domestic, outdoor, historical, and slow-burn
  mysteries are equally valid when they serve the concept.
- Treat names and personalities as fresh story decisions. Use culturally varied,
  plausible names and avoid repeatedly reusing the same names, roles, speech
  patterns, or stern-expert/helpful-assistant pairing. Give each recurring
  character one distinct motive, temperament, conversational rhythm, and point of
  productive disagreement that changes how they respond to the learner's choices.
  Do not use personality labels in learner-facing prose; reveal personality through
  dialogue, priorities, habits, and actions.
- Use no more than three characters in the entire story, counting the learner
  addressed as "you". Therefore create only one or two recurring named side
  characters. Give each a stable role, visual identity, and relationship to the
  learner. Let them speak, disagree, react, and carry consequences without adding
  one-scene helpers, crowds with speaking roles, or extra named people that make
  the story hard to follow.
- Make the experience genuinely fun: use warm character banter, playful friction,
  one surprising complication, and at least one satisfying callback. Humor must
  emerge from personalities and the situation, never from mocking mistakes or
  turning the lesson into a string of jokes.
- Make scenes vivid and descriptive despite the simple vocabulary. Give each act a
  memorable setting detail, a human disagreement, a discovery, and a small reversal.
  The learner should feel inside an unfolding story, not inside a technical manual.
- Create curiosity before explanation: begin with a concrete contradiction,
  impossible-looking observation, or costly mystery. Let the learner earn the
  explanation through evidence. Include one reveal that reinterprets an earlier
  detail and one consequence the recurring cast genuinely cares about. Withhold
  the plot's solution, never the basic meaning of a word or how evidence works.
  Side characters may explain foundational facts without choosing the answer.
- Make every visibly depicted cast member a fictional adult age 21 or older. The
  learner can still be 13-18 and hold the decision-making role without appearing
  on screen.
- Open in a specific place and moment with an observable problem, a human stake,
  and a deadline or worsening condition.
- Keep the public synopsis to one or two punchy sentences. Reveal the cast, setting,
  problem, constraints, and scientific mechanism progressively inside the scenes
  instead of explaining the whole plot on the landing card.
- Build one causal spine: diagnose the system, intervene using the target concept,
  reveal a changed condition that breaks the first fix, then choose a durable fix.
- Make the concept operational. The learner should inspect evidence, predict what
  a change will do, act on the system, observe the consequence, and generalize.
- Prefer concrete readings, constraints, and before/after changes over exposition.
  Use only values supported by supplied evidence or clearly fictional scenario
  state; never present invented scenario values as real-world facts.
- Include at least one professional judgment call where safety, uncertainty, time,
  or resources matter, not only school-style questions.
- Wrong options must be reasonable actions that fail for a visible causal reason.
  Their consequences should change the situation or reveal evidence, not say
  merely "incorrect."
- Let the first intervention work. Then alter one relevant condition so the learner
  must revise the model rather than repeat the same answer.
- Deliver a happy ending: show the learner's durable decision resolving the immediate
  situation, then a warm character callback to an earlier shared detail or joke.
  Earn the relief through visible consequences, not a summary or sudden miracle.
  Transfer the idea beyond this situation without a closing lecture. Keep the
  success bounded by the evidence; never fabricate a cure or medical approval.
- Keep prose vivid and cinematic: use one or two substantial paragraphs of 3-5
  full sentences each, not one-line fragments. Open each scene with an immediate
  action, striking detail, intriguing contradiction, or unanswered question; then
  build character tension, discovery, or a surprising turn before ending with a
  consequence that pulls the learner forward. Use named collaborators
  consistently, concrete sensory details, natural dialogue, and no lecture voice.
  Prefer short, direct sentences, but use longer sentences when they clearly
  explain one connected idea. There is no fixed sentence word limit. Do not
  remove necessary explanations or break natural dialogue just to shorten prose.
  Judge readability by clarity, explained vocabulary, and the causal steps a
  beginner can follow, not sentence length alone.
- Only SceneDraft.narrative strings support rich GitHub-Flavored Markdown and
  emojis. Every other field is plain text, including titles, chapter captions,
  beats, primers, trivia, activities, feedback, hints, media, and metadata.
  In narrative, format every spoken line or
  embedded dialogue phrase as ***“Dialogue.”*** (bold and italic). Emphasize
  only a few indispensable terms whose meaning is essential to following the story
  with **bold**; the UI adds underline styling. Never bold decorative wording,
  ordinary actions, whole sentences, or every repetition. Keep markers balanced and
  never use raw HTML, Markdown images, or embedded links.
  Choose purposeful blockquotes for a note or quotation, lists for a useful
  sequence, compact tables for comparisons, Mermaid for a clearer relationship,
  and safe illustrative fenced code when the topic benefits from a static example.
  Code is static text, never executable behavior; Mermaid is rendered safely,
  without scripts, click actions, remote content, or HTML labels. Explain examples
  in ordinary words and keep required answer evidence in narrative prose too.
  Include a small number of relevant, context-fitting emojis in narrative only.
  Each emoji must reinforce the setting, action, mood, or idea beside it; never use
  random decoration, replace a word with an emoji, or clutter every sentence.
  Emojis need not appear in every scene and have no fixed count.
  Blocks complement immersive prose; they must not turn the story into a worksheet.
- Let each scene deepen the learner's understanding: establish character motives
  and place first, then expose evidence, constraints, mechanism, consequences, and
  the durable solution as the learner earns them.
- Never expose implementation jargon to the learner: no file extensions, filenames,
  snake_case, raw identifiers, model names, asset keys, or words such as SVG, PNG,
  JSON, API, schema, payload, readout ID, or control ID. Rewrite pipeline internals
  as natural labels a teenager would say aloud. A computing topic may show a
  necessary, explained identifier inside safe illustrative fenced code; this
  exception never exposes production IDs, filenames, secrets, or system internals.
- Let the story determine its own rhythm. Do not repeat a standard sequence such
  as question, quiz, reorder, simulation, quick thought. Choose only the
  interactions that naturally belong at that exact moment in this topic's plot,
  vary their order and spacing, and leave some scenes as uninterrupted story.
- Questions and quick thoughts must be open-ended. Ask the learner to predict,
  explain, compare evidence, justify a choice, or name uncertainty in their own
  words so their reasoning can be understood. Do not turn these moments into a
  hunt for one hidden model answer.
- Include delight without weakening the lesson through 3-5 short, true trivia cards
  across at least two acts. Every card must be genuinely surprising: use a
  counterintuitive real effect, astonishing scale, unusual historical experiment,
  or unexpected everyday consequence. It must stand alone as a fact someone would
  genuinely want to tell a friend. Never restate story evidence, define the current
  term, quote or mention a source, say evidence was supplied, or use trivia required
  for an answer. Ban generic claims such as "tiny changes can have big effects."
  Each trivia card across the story must cover a distinct angle; never restate
  the same fact, number, or comparison already used in another trivia card or
  in the nearby narration, even with different wording.
  Trivia title and text are plain prose fields, so never include Markdown markers.
- Provide at least four plain-word primers across at least three scenes, including
  narrative scenes before decisions. Each primer explains a distinct useful idea
  with an everyday analogy; it need not introduce a new technical term. Do not
  invent jargon to fill the card quota or repeat the same definition. Use
  "In plain words" as the learner-facing label, never "Concept"; retain internal
  schema fields named concept. When first using a necessary technical idea,
  explain it naturally in ordinary language within the action or conversation,
  before the learner needs it. Do not repeat an already clear explanation or
  insert a lecture just to announce the label. Explain what each necessary object does and
  why the cause produces the effect. A definition containing another unexplained
  term, or a label such as "net effect" without showing what combines, is not teaching.
  Use an analogy only after identifying the real thing, and state the relevant
  similarity without implying the analogy is the literal mechanism.
- Anchor the whole story in a concrete, verifiable real-world use of the concept:
  the actual job, industry, device, or public service where people rely on it
  today. The setting, the evidence, the stakes, and the ending must all come from
  that real application rather than a generic invented scenario that merely
  illustrates the theory. Name where a learner would encounter this in real life,
  and make the final decision matter to that real use.
"""
