import type { Scenario } from "@/types/story";

/**
 * The trap is not the machine. The trap is the way a single printed name feels
 * like an answer. This story keeps the learner beside one glove from first
 * result to final map, so every new question grows out of the last answer.
 *
 * The lesson builds in order: a DNA profile is a list of markers; a short list
 * still fits a crowd; searching a large list makes a hit likely; and even a
 * strong hit must be tied to a place on the glove before it can help the case.
 */
export const coldCase: Scenario = {
  id: "cold-case",
  title: "The Match",
  tagline: "Eleven years cold. One list hit. Everybody wants an arrest by six.",
  blurb:
    "A DNA search on an eleven-year-old museum case returns one name, and the room around you starts writing the press release. You are the scientist holding the report. Before anyone signs it, you have to work out what the match actually proves — and what it only looks like it proves.",
  art: {
    alt: "A forensics bench at night: a grey wool glove sealed in an evidence bag, a screen behind it showing a single highlighted name in a long list of search results.",
  },
  domain: "biology",
  difficulty: "medium",
  learningGoal:
    "Learn why a DNA match depends on the DNA spots checked and the size of the group searched.",
  takeaway: {
    concept: "How strong a match really is",
    field: "Biology — DNA evidence",
    inOneLine:
      "A DNA profile is a list of markers. More markers, smaller matching crowd. A short profile can still fit many people inside a big search.",
    rule:
      "Before you trust a hit, ask two questions. How many markers were checked? How many people were searched? A one-in-4,000 hit is not rare across 300,000 people.",
    elsewhere: [
      "A health test that is mostly right can still worry many healthy people when a whole city takes it.",
      "Face search flags innocent lookalikes when it scans every person on a busy street.",
      "A rare fraud alert can bury workers when millions of payments pass through it.",
    ],
    youUsedIt: [
      "You asked how many markers made the match before you trusted the name.",
      "You saw a six-marker profile fit many people inside a search of hundreds of thousands.",
      "You asked where the DNA sat on the glove, not just whose DNA it was.",
    ],
  },
  minutes: 7,
  stageLabel: "Ardenmoor forensics",
  partnerGreeting:
    "I’m at the next bench. You run the science; I’ll watch how you handle a result everybody already believes.",
  intro: {
    role: "lab scientist",
    cta: "Open the case file",
    text: [
      "Tuesday, 09:40.",
      "Eleven years ago, someone broke into the town museum at night.",
      "A guard was badly hurt. Nobody was ever charged.",
      "The only clue was one grey wool glove.",
      "This morning the machine returned one name.",
    ],
    visual: {
      kind: "lab",
      title: "Case 03-2214 · reopened",
      caption: "One glove. Eleven years. A new machine.",
      status: "result on screen",
    },
  },
  preSession: {
    prompt: "A result lands. What is your instinct?",
    options: [
      { id: "check", label: "Ask how strong it is", approach: "measure_first" },
      { id: "act", label: "Move before the trail cools again", approach: "act_first" },
      { id: "story", label: "See if it fits the story", approach: "seek_pattern" },
      { id: "trust", label: "Trust the machine", approach: "follow_authority" },
    ],
  },
  startScene: "b1",
  scenes: [
    /* ---------------- ACT 1 — THE HIT ---------------- */
    {
      id: "b1",
      act: 1,
      mood: "calm",
      beat: "Reopened",
      visual: {
        kind: "evidence",
        title: "Exhibit 4 — grey wool glove",
        caption: "Bagged in 2014. Opened this morning for the first time since.",
        status: "bag never opened",
      },
      trivia: {
        emoji: "🕰️",
        title: "Cases wake back up",
        text: "Old crime samples can wait years in a bag. New machines can now read tiny bits of DNA that old machines missed.",
      },
      type: "narrative",
      text: [
        "Amara runs the lab. Today she stands by the screen.",
        "“A short DNA sample from the cuff,” she says.",
        "The machine checked a list of 300,000 people.",
        "One name: Elias, a warehouse clerk in the next town.",
        "The old file says a passer-by, Dale, found the glove in a hedge that night.",
        "Ray waits at the door in his coat 🧥.",
      ],
      next: "b2",
    },
    {
      id: "b2",
      act: 1,
      mood: "tense",
      beat: "Everybody wants a name",
      simulation: "marker-match",
      simGuide: {
        shows:
          "The box shows only the crowd that still matches the profile. The badge above counts how many they are, out of a city of 300,000.",
        move:
          "Drag the slider under the box to add markers, the small DNA spots the profile is built from, or take them away.",
        watch:
          "Every extra marker keeps only about a quarter of the crowd. The last few markers are the ones that name a single person.",
      },
      visual: {
        kind: "sequencer",
        title: "One name on the screen",
        caption: "Nobody in the room has asked how strong it is.",
        status: "1 hit · 300,000 searched",
      },
      type: "choice",
      text: [
        "Ray taps the report. “That’s him. Paperwork.”",
        "Amara looks at you first.",
        "The model below shows what a DNA profile really is.",
      ],
      primer: [
        {
          term: "Marker",
          plain:
            "A marker is one small DNA spot where different people carry different numbers.",
          like: "one digit in a phone number: more digits pin one phone down.",
        },
      ],
      prompt: "What do you do first?",
      concept:
        "The strength of a match depends on how many markers it is built from.",
      probe: "Why that first?",
      options: [
        {
          id: "markers",
          label: "Ask how many markers this match is built on",
          correct: true,
          outcome:
            "Ray stops at the door. Joon opens the hidden line — six markers, from a machine built for sixteen. Amara reads it aloud.",
          approach: "measure_first",
          next: "b4",
        },
        {
          id: "arrest",
          label: "Sign the report and let Ray go",
          correct: false,
          approach: "follow_authority",
          next: "b2",
        },
        {
          id: "rerun",
          label: "Run the same sample again",
          correct: false,
          approach: "brute_force",
          next: "b2",
        },
        {
          id: "history",
          label: "Pull Elias’s old record for a reason",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b2",
        },
      ],
      consequences: {
        arrest:
          "Amara puts one hand flat on the desk. “First tell me how many markers it has.” You cannot.",
        rerun:
          "The same sample gives the same answer. That checks the machine, not what the answer means.",
        history:
          "You find a shop theft from when Elias was nineteen. It only makes guilt easier to imagine.",
      },
      hints: [
        "The screen says “match”. It does not say how much matched.",
        "In the model, one extra marker shrinks the crowd a lot.",
        "Ask Joon for the marker count before anything else.",
      ],
    },
    {
      id: "b4",
      act: 1,
      mood: "insight",
      beat: "How many is enough",
      visual: {
        kind: "sequencer",
        title: "The dial nobody looks at",
        caption: "Every marker you add cuts the crowd to a quarter.",
        status: "300,000 in the pool",
      },
      type: "slider",
      text: [
        "Amara pulls a chair beside Ray.",
        "“Show him the matching pool,” she says. “Move the slider.”",
        "The model starts with the same 300,000 people 🧬.",
      ],
      primer: {
        term: "The matching pool",
        plain:
          "The matching pool is everyone in the list whose numbers still fit the DNA you have.",
        like: "a crowded room that empties with each yes-or-no question.",
      },
      prompt: "How many markers make the pool smaller than one person?",
      concept:
        "Each added marker divides the matching pool. A few markers leave a crowd.",
      probe: "Why stop where you stopped?",
      slider: {
        label: "Markers in the profile",
        unit: "",
        min: 6,
        max: 16,
        step: 1,
        initial: 6,
      },
      readout: {
        label: "People who still match",
        unit: "",
        expr: "profile_pool",
        params: { population: 300000, perMarker: 0.25 },
        decimals: 2,
      },
      driver: { label: "Down to one person", value: 1, unit: "" },
      risk: { mode: "ceiling", safeGap: 1 },
      meter: "crowd",
      target: { min: 10, max: 13 },
      bands: [
        { max: 8, text: "Still a crowd. A whole bus could match this profile." },
        { max: 9, text: "Close. A jury would still hear “match”." },
        { max: 13, text: "The pool drops below one person. Ray sees what six was missing." },
        { max: 16, text: "Too far. The last sample is spent chasing empty spots." },
      ],
      hints: [
        "Watch the dots, not just the number.",
        "Every extra marker leaves only a quarter of the people standing.",
        "At ten markers, the pool drops below one in this search.",
      ],
      next: "b5",
    },

    /* ---------------- ACT 2 — THE CROWD ---------------- */
    {
      id: "b5",
      act: 2,
      mood: "tense",
      beat: "One in four thousand",
      simulation: "suspect-funnel",
      simGuide: {
        shows:
          "The top bar counts how many people you compared your profile against. The bottom bar counts the innocent people expected to match by luck.",
        move:
          "Drag the slider from one careful suspect all the way up to the full police list of 300,000 people.",
        watch:
          "The one-in-4,000 odds do not change, but the bottom bar climbs as you search more people — a bigger search buys more coincidences.",
      },
      visual: {
        kind: "interview",
        title: "The number on the certificate",
        caption: "It is correct. It is also not the number he thinks it is.",
        status: "≈ 1 in 4,096",
      },
      type: "choice",
      text: [
        "Joon prints the lab’s number: one in 4,096 — six markers, each cutting the crowd to a quarter.",
        "Ray holds it up. “That sounds rare.”",
        "The model below keeps that number fixed.",
      ],
      primer: {
        term: "Searching a database",
        plain:
          "Searching a database means checking your DNA against a huge stored list of people.",
        like: "buying many lottery tickets. A rare win stops feeling shocking after a pile.",
      },
      prompt: "What is wrong with the way Ray reads that number?",
      concept:
        "A rare match found by searching a huge pool can be expected.",
      probe: "What made you rule out the others?",
      options: [
        {
          id: "pool",
          label: "We searched 300,000, so hits are expected",
          correct: true,
          outcome:
            "Joon writes it out: 300,000 ÷ 4,096 ≈ 73. The highlighted name looks like a chance hit, not proof.",
          approach: "seek_pattern",
          next: "b6",
        },
        {
          id: "wrongnumber",
          label: "The lab did the maths wrong",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b5",
        },
        {
          id: "dna",
          label: "DNA evidence is never reliable",
          correct: false,
          approach: "brute_force",
          next: "b5",
        },
        {
          id: "old",
          label: "The sample is too old to matter",
          correct: false,
          approach: "act_first",
          next: "b5",
        },
      ],
      consequences: {
        wrongnumber:
          "Joon checks it again. About one in 4,000 is correct. The mistake is reading it as if only one person was checked.",
        dna:
          "Same test on one suspect and the hit would matter more. The huge search is the problem, not the machine.",
        old:
          "Age cost you markers. But the bigger problem is the search through 300,000 people.",
      },
      hints: [
        "The one-in-4,096 number stays the same.",
        "In the model, drag the number of people searched.",
        "Knock on 4,000 doors and one may open by chance.",
      ],
    },
    {
      id: "b6",
      act: 2,
      mood: "insight",
      beat: "How a chance hit gets a name",
      visual: {
        kind: "interview",
        title: "Amara wants it in plain words",
        caption: "“Say it as a sentence. Then you have it.”",
        status: "whiteboard",
      },
      type: "reorder",
      text: [
        "Joon writes 73 on the board.",
        "“Show how an innocent person ends up on that screen,” Amara says.",
      ],
      prompt: "How does a chance match turn into a suspect?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        { id: "degrade", label: "The old sample gives only six markers" },
        { id: "shared", label: "A six-marker profile still fits many people" },
        { id: "search", label: "We compare it with 300,000 at once" },
        { id: "hit", label: "Someone in the big list matches by chance" },
        { id: "name", label: "The screen prints his name, and it looks like proof" },
      ],
      wrong:
        "“Read it back,” Amara says. “Does each step cause the next? Your crowd shows up after the search.”",
      right:
        "“Yes,” Amara says. “Old sample, few markers, huge search, expected hit.” Ray leaves his coat on the chair.",
      concept:
        "A weak profile plus a large search makes a chance match likely.",
      probe: "Which step would you change to make the result mean more?",
      hints: [
        "Start with the thing that happened before any search.",
        "Each line should make the next line happen.",
        "Old sample → few markers → big crowd → huge search → expected hit.",
      ],
      next: "b8",
    },
    {
      id: "b8",
      act: 2,
      mood: "tense",
      beat: "Where did it get in",
      simulation: "contamination-path",
      simGuide: {
        shows:
          "Five steps that carry the glove from the crime scene through the lab to the plate the reader machine will scan.",
        move:
          "Tap either button on top: the shared blade shows the way it happened, and the fresh blade shows the way it should be done.",
        watch:
          "Under a shared blade a stranger’s DNA boards the sample at the cut and rides on with it. A fresh blade keeps every step clean.",
      },
      visual: {
        kind: "evidence",
        title: "Back down the chain",
        caption: "Every hand, every blade, every bench between the hedge and the lab.",
        status: "retracing every step",
      },
      trivia: {
        emoji: "🧽",
        title: "The phantom that wasn’t",
        text: "German police once chased a killer for years. In the end, the stray DNA came from a factory worker who packed the cotton swabs.",
      },
      type: "choice",
      text: [
        "Joon comes back holding a second printout 📄.",
        "“The blank tube has stray DNA in it,” he says.",
        "It was empty. It should show nothing.",
        "If stray DNA got there, it may be on the glove.",
        "Follow the glove through the model below.",
      ],
      primer: {
        term: "Blank tube",
        plain:
          "A blank tube is a tube of nothing that rides through every step with the sample. It should come back empty.",
        like: "a clean cup you leave beside a spill so you can spot a leak.",
      },
      prompt: "What do you do about the stray DNA?",
      concept:
        "A result is only as clean as the path the sample travelled.",
      probe: "Why that, and not the quicker option?",
      options: [
        {
          id: "trace",
          label: "Retrace every step, then start again with clean tools",
          correct: true,
          outcome:
            "The model points at a shared blade. The lab swaps it, wipes the bench, and takes a fresh cut from the cuff.",
          approach: "isolate_variable",
          next: "b9",
        },
        {
          id: "subtract",
          label: "Subtract the stray DNA from the result",
          correct: false,
          approach: "brute_force",
          next: "b8",
        },
        {
          id: "ignore",
          label: "Note it and carry on",
          correct: false,
          approach: "act_first",
          next: "b8",
        },
        {
          id: "blame",
          label: "Find which worker to blame",
          correct: false,
          approach: "change_many",
          next: "b8",
        },
      ],
      consequences: {
        subtract:
          "You can only subtract what you can name. If two people mixed, the six markers may not belong to one at all.",
        ignore:
          "Amara points at the empty tube. “If DNA can get there, it can get onto the glove. We do not carry on.”",
        blame:
          "The model shows a shared blade, not one bad worker. Blame one person and the same blade will spoil the next case.",
      },
      hints: [
        "The stray DNA is not the only problem.",
        "In the model, switch blades and watch the path go clean.",
        "You need a second run with new blade, clean bench, and new gloves.",
      ],
    },
    {
      id: "b9",
      act: 2,
      mood: "calm",
      beat: "Debrief",
      visual: {
        kind: "lab",
        title: "16:05 — plates in the machine",
        caption: "Clean bench, fresh blade, second run going in.",
        status: "results in 14 hours",
      },
      type: "reflect",
      text: [
        "The second run starts at four.",
        "It will take fourteen hours.",
        "Amara brings you coffee.",
        "“Elias’s family is waiting for a call,” she says. “What is honest, and not more than we know?”",
      ],
      prompt: "What would you tell them tonight?",
      placeholder: "Two plain sentences will do.",
      next: "b13",
    },

    /* ---------------- ACT 3 — THE ANSWER, AND WHAT IT COSTS ------------- */
    {
      id: "b13",
      act: 3,
      mood: "resolve",
      beat: "Inside or outside",
      visual: {
        kind: "evidence",
        title: "The cuff",
        caption: "Two explanations. One difference you can actually measure.",
        status: "one question left",
      },
      trivia: {
        emoji: "👯",
        title: "Twins share their code",
        text: "Identical twins have the same DNA profile from birth. Their fingerprints are different, because those form as the baby grows in the womb.",
      },
      type: "choice",
      text: [
        "By breakfast the clean run is back.",
        "This time the blanks stayed empty — no stray DNA.",
        "The cuff gives twelve markers, not six.",
        "It does not match Elias. It matches Dale.",
        "Dale found the glove in the hedge 🌿 that night.",
        "Two stories still fit: wearing it, or lifting it up.",
        "“What would those leave in different places?” Amara asks.",
      ],
      prompt: "What question actually decides this?",
      concept:
        "When one result fits two stories, look for the fact only one story predicts.",
      probe: "How did you know the other questions wouldn’t settle it?",
      options: [
        {
          id: "where",
          label: "Where on the glove the DNA sits",
          detail:
            "Picking it up leaves skin outside. Wearing it leaves skin inside the cuff.",
          correct: true,
          outcome:
            "Joon pulls the sampling map — a picture of the glove with a dot at every spot he cut. The twelve markers came from inside the cuff. Amara sends it for the final check.",
          approach: "isolate_variable",
          next: "b14",
        },
        {
          id: "amount",
          label: "How much of his DNA is on it",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b13",
        },
        {
          id: "alibi",
          label: "Where he says he was that night",
          correct: false,
          approach: "act_first",
          next: "b13",
        },
        {
          id: "resample",
          label: "Run the whole glove a third time",
          correct: false,
          approach: "brute_force",
          next: "b13",
        },
      ],
      consequences: {
        amount:
          "Amount changes with sweat, weather, and years in a paper bag. It cannot clearly split wearing from picking up.",
        alibi:
          "Ray can ask. But the glove itself remembers different actions inside and outside.",
        resample:
          "Another run gives the same name from the same place. The question is not who — it is where.",
      },
      hints: [
        "Both stories say Dale touched the glove.",
        "Picture wearing a glove, then picture lifting it from a branch.",
        "Those two actions leave skin in different places.",
      ],
    },
    {
      id: "b14",
      act: 3,
      mood: "resolve",
      beat: "Where it sat",
      visual: {
        kind: "lab-dawn",
        title: "Friday, 07:10",
        caption: "Inside the cuff. Nothing on the outer palm at all.",
        status: "case 03-2214 · charged",
      },
      type: "ending",
      text: [
        "By Friday morning the sampling map returns.",
        "Dale’s DNA is packed inside the cuff, where a wrist would rub.",
        "The outer palm has almost none of him.",
        "You cannot say he is guilty. That is not your job.",
        "You hand over one clean finding.",
        "It fits wearing the glove, and does not fit simply picking it up.",
        "Elias gets a letter ✉️, an apology, and a correction on the site.",
        "“The machine answered our question,” Amara says.",
        "“We had to learn which question we were really asking.”",
      ],
      outcome: "success",
    },
  ],
};
