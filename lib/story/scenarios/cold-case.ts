import type { Scenario } from "../types";

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
  domain: "biology",
  difficulty: "medium",
  learningGoal:
    "Learn why a DNA match depends on the DNA spots checked and the size of the group searched.",
  takeaway: {
    concept: "How strong a match really is",
    field: "Biology — DNA evidence",
    inOneLine:
      "A DNA profile is a list of markers. Each extra marker cuts the matching crowd down. A short profile can still fit many people when you search a large list.",
    rule:
      "Before you trust a hit, ask two questions. How many markers were checked? How many people were searched? A one-in-four-thousand hit is not rare when you check three hundred thousand people.",
    elsewhere: [
      "A health test can be mostly right, yet still worry many healthy people when it checks a whole city.",
      "Face search can find innocent lookalikes when it scans every person on a busy street.",
      "Out of ten thousand stock pickers, somebody may look brilliant five years in a row by luck.",
      "A bank alert that fires once in a thousand payments can bury workers when millions of payments pass through.",
    ],
    youUsedIt: [
      "You asked how many markers made the match before you asked who the screen had named.",
      "You saw that a six-marker result could fit many people in a three-hundred-thousand-person search.",
      "You wrote the weak parts down before the leaked name could do more harm.",
      "At the end you asked where the DNA sat, not just whose DNA it was.",
    ],
  },
  minutes: 13,
  stageLabel: "Ardenmoor forensics",
  partnerGreeting:
    "I'm at the next bench. You run the science; I'll watch how you handle a result everybody already believes.",
  intro: {
    role: "lab scientist",
    cta: "Open the case file",
    text: [
      "Tuesday, 09:40.",
      "Eleven years ago, someone broke into the town museum at night.",
      "The guard was badly hurt, and nobody was charged.",
      "The only clue was one grey wool glove, found near the side gate.",
      "This morning the lab cut a tiny piece from inside the cuff.",
      "The machine has returned one name.",
    ],
    visual: {
      kind: "lab",
      title: "Case 03-2214 · reopened",
      caption: "One glove. Eleven years. A new machine.",
      status: "result on screen",
    },
  },
  preSession: {
    prompt: "A result lands that everyone was hoping for. What is your instinct?",
    options: [
      {
        id: "check",
        label: "Ask how strong the result actually is",
        approach: "measure_first",
      },
      {
        id: "act",
        label: "Move on it now, before the trail cools again",
        approach: "act_first",
      },
      {
        id: "story",
        label: "See whether it fits the rest of the story",
        approach: "seek_pattern",
      },
      {
        id: "trust",
        label: "Trust the machine — that is what it is for",
        approach: "follow_authority",
      },
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
        "Amara runs the lab, and she is usually calm.",
        "Today she is standing beside the screen.",
        "“We got a short DNA result from the cuff,” she says.",
        "Joon, the new lab tech, points to the search result.",
        "The computer checked a police list of 300,000 people.",
        "The alert page highlights one name: Elias.",
        "Ray, the detective, is already in the doorway with his coat on 🧥.",
      ],
      next: "b2",
    },
    {
      id: "b2",
      act: 1,
      mood: "tense",
      beat: "Everybody wants a name",
      simulation: "marker-match",
      visual: {
        kind: "sequencer",
        title: "One name on the screen",
        caption: "Nobody in the room has asked how strong it is.",
        status: "1 hit · 300,000 searched",
      },
      trivia: {
        emoji: "🧬",
        title: "The first DNA test",
        text: "A scientist named Alec Jeffreys made the first DNA fingerprint test in 1984. He was working in an English lab and was surprised by what he saw.",
      },
      type: "choice",
      text: [
        "Ray taps the report. “That's him. Give me the paperwork.”",
        "Amara does not move. She looks at you first.",
        "The model below shows what a profile is made of.",
        "It also mentions a database, the stored list being checked.",
        "Drag it before you answer. Watch what each marker does.",
      ],
      primer: [
        {
          term: "Marker",
          plain:
            "A marker is one small DNA spot with a number; a profile is the list of those numbers.",
          like: "one digit in a phone number. One digit helps a little. Many digits point to one phone.",
        },
        {
          term: "Database",
          plain: "A database is a stored list that a computer can search quickly.",
          like: "a class register, but much bigger and easy for a computer to check.",
        },
      ],
      prompt: "What do you do first?",
      concept:
        "The strength of a match depends on how many markers it is built from.",
      probe: "Why that first?",
      options: [
        {
          id: "markers",
          label: "Ask how many markers the match is built on",
          detail: "A profile is a list. The length of the list matters.",
          correct: true,
          outcome:
            "Ray stops with his hand on the door. Joon opens the hidden line on the report. The number is small, so Amara asks him to read it aloud.",
          approach: "measure_first",
          next: "b3",
        },
        {
          id: "arrest",
          label: "Write the report so Ray can go",
          detail: "The machine says Elias. That is what the machine is for.",
          correct: false,
          approach: "follow_authority",
          next: "b2",
        },
        {
          id: "rerun",
          label: "Run the same sample through again",
          detail: "If it says the same thing twice, it must be right.",
          correct: false,
          approach: "brute_force",
          next: "b2",
        },
        {
          id: "history",
          label: "Pull Elias's old record and look for a reason",
          detail: "Find out what kind of man we are dealing with.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b2",
        },
      ],
      consequences: {
        arrest:
          "Amara puts one hand flat on the desk. “You are about to sign a report. First tell me how many markers it has.” You cannot.",
        rerun:
          "The same sample in the same machine gives the same answer. That checks the machine. It does not check what the answer means.",
        history:
          "You find a shop theft from when Elias was nineteen. It says nothing about this glove. It only makes guilt easier to imagine.",
      },
      hints: [
        "The screen says “match”. It does not say how much matched.",
        "In the model, one extra marker can shrink the crowd a lot.",
        "Ask Joon for the marker count before you ask anything else.",
      ],
    },
    {
      id: "b3",
      act: 1,
      mood: "alarm",
      beat: "Six",
      visual: {
        kind: "sequencer",
        title: "Six clean peaks. Ten empty windows.",
        caption: "Eleven years in a paper bag took the rest.",
        status: "6 of 16 markers recovered",
      },
      type: "narrative",
      text: [
        "“Six,” Joon says. “We recovered six markers.”",
        "He points to ten empty boxes beside them.",
        "A full profile in this lab checks sixteen markers 🧬.",
        "The glove gave only six because the old sample had broken down.",
        "Amara turns the screen toward Ray.",
        "“So we do not have Elias alone,” she says.",
        "“We have everyone who shares these six numbers.”",
      ],
      next: "b4",
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
        "With six still on the screen, Amara pulls over a chair.",
        "“Show Ray the matching pool,” she says.",
        "The simple model starts with the same 300,000 people.",
        "In the model, each marker leaves about one quarter of them.",
        "Turn the dial until the crowd becomes less than one expected person.",
      ],
      primer: {
        term: "The matching pool",
        plain:
          "The matching pool is everyone still left who could fit the DNA numbers you have.",
        like: "a crowded room where most people leave after each new yes-or-no question.",
      },
      prompt: "How many markers make this pool smaller than one person?",
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
        {
          max: 8,
          text: "Still a crowd. The dots fill a bus, and one bus rider can look like an answer on a screen.",
        },
        {
          max: 9,
          text: "Close. A few people may still fit, and a jury would still hear the word “match”.",
        },
        {
          max: 13,
          text: "The pool drops below one expected person. Ray sees what six is missing. Amara circles the real six-marker report.",
        },
        {
          max: 16,
          text: "Too far. The machine uses the last sample chasing empty spots. Joon cannot save a clean piece for a second check.",
        },
      ],
      hints: [
        "Watch the dots, not just the number.",
        "Every extra marker leaves only one quarter of the people standing.",
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
      visual: {
        kind: "interview",
        title: "The number on the certificate",
        caption: "It is correct. It is also not the number he thinks it is.",
        status: "≈ 1 in 4,000",
      },
      trivia: {
        emoji: "🎯",
        title: "Rare hits add up",
        text: "A one-in-a-million match sounds tiny. But if you check a million people, one match by luck is what you should expect.",
      },
      type: "choice",
      text: [
        "With the six-marker report circled, Joon prints the lab's exact number.",
        "For these six markers, the chance is about one in 4,000.",
        "Ray holds up the page. “That sounds rare.”",
        "The model below keeps that number fixed.",
        "Move the search size and watch what happens.",
      ],
      primer: {
        term: "Searching a database",
        plain:
          "Searching a database means checking your evidence against a huge stored list of people.",
        like: "buying many lottery tickets. A rare win stops being shocking when you bought a pile of tickets.",
      },
      prompt: "What is wrong with the way Ray reads that number?",
      concept:
        "A rare match found by searching a huge pool can be expected.",
      probe: "What made you rule out the others?",
      options: [
        {
          id: "pool",
          label: "We searched 300,000 people, so hits are expected",
          detail:
            "One in 4,000 across 300,000 people means about 73 chance hits.",
          correct: true,
          outcome:
            "Joon writes 300,000 ÷ 4,000 ≈ 73 on the board. Ray lowers the certificate. The highlighted name now looks like a chance hit, not proof.",
          approach: "seek_pattern",
          next: "b6",
        },
        {
          id: "wrongnumber",
          label: "The lab calculated the odds wrong",
          detail: "Somebody made a math error somewhere.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b5",
        },
        {
          id: "dna",
          label: "DNA evidence is unreliable in general",
          detail: "Machines make mistakes. You cannot trust any of it.",
          correct: false,
          approach: "brute_force",
          next: "b5",
        },
        {
          id: "old",
          label: "The sample is too old to mean anything",
          detail: "Eleven years in a bag. Write it off.",
          correct: false,
          approach: "act_first",
          next: "b5",
        },
      ],
      consequences: {
        wrongnumber:
          "Joon checks it again. About one in 4,000 is correct. The mistake is reading it as if only one person was checked.",
        dna: "Move the model down to one suspect. Same test, same odds, but now the hit would matter more. The huge search is the problem.",
        old: "Age cost you markers, and that matters. But the bigger problem is the search through 300,000 people.",
      },
      hints: [
        "The one-in-4,000 number stays the same.",
        "In the model, drag the number of people searched.",
        "If you knock on 4,000 doors, one door may open by chance.",
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
        "With the board showing about 73 expected hits, Amara wipes a clean space.",
        "“Ray needs the whole chain,” she says.",
        "“Show how an innocent person can end up on that screen.”",
      ],
      prompt: "How does a chance match turn into a suspect?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "degrade",
          label: "The old sample gives only six markers",
          detail: "Ten boxes are empty.",
        },
        {
          id: "shared",
          label: "A six-marker profile still fits many people",
        },
        {
          id: "search",
          label: "We compare it with 300,000 people at once",
        },
        {
          id: "hit",
          label: "Someone in that big list matches by chance",
        },
        {
          id: "name",
          label: "The screen prints his name, and the name feels like proof",
          detail: "The screen does not show the crowd behind him.",
        },
      ],
      wrong:
        "“Read it back,” Amara says. “Does each step cause the next one? Your crowd appears after the search.”",
      right:
        "“Yes,” Amara says. “Old sample, few markers, huge search, expected hit.” Ray leaves his coat on the chair while Joon checks the lab run.",
      concept:
        "A weak profile plus a large search makes a chance match likely.",
      probe: "Which step would you change to make the result mean more?",
      hints: [
        "Start with the thing that happened before any search.",
        "Each line should make the next line happen.",
        "Old sample → few markers → big crowd → huge search → expected hit.",
      ],
      next: "b7",
    },
    {
      id: "b7",
      act: 2,
      mood: "alarm",
      beat: "The empty tube",
      visual: {
        kind: "lab",
        title: "Tube H12 — the empty check tube",
        caption: "It contains nothing. It is not supposed to contain anybody.",
        status: "stray DNA detected",
      },
      trivia: {
        emoji: "🧽",
        title: "The phantom that wasn't",
        text: "German police once chased a killer for years. In the end, the stray DNA came from a factory worker who packed the cotton swabs.",
      },
      type: "narrative",
      text: [
        "While Ray waits, Joon checks the lab run that made the hit.",
        "He comes back holding a second printout 📄 away from his body.",
        "“The empty check tube has DNA in it,” he says.",
        "That tube held no sample, so it should show nothing.",
        "If DNA reached the empty tube, it may also have reached the glove sample.",
        "The stray DNA is not Elias. It is not the injured guard either.",
      ],
      next: "b8",
    },
    {
      id: "b8",
      act: 2,
      mood: "tense",
      beat: "Where did it get in",
      simulation: "contamination-path",
      visual: {
        kind: "evidence",
        title: "Back down the chain",
        caption: "Every hand, every blade, every bench between the hedge and the lab.",
        status: "retracing every step",
      },
      type: "choice",
      text: [
        "Amara puts the blank beside the glove report.",
        "“The stray DNA got into an empty tube,” she says.",
        "“Now find the place where it entered.”",
        "Follow the glove through the model below.",
        "Then choose what to do next.",
      ],
      primer: {
        term: "The blank",
        plain:
          "The blank is an empty tube that travels beside the real sample to catch stray DNA.",
        like: "a clean plate left beside food. Dust on the plate means dust may be on the food too.",
      },
      prompt: "What do you do about the stray DNA?",
      concept:
        "A result is only as clean as the path the sample travelled.",
      probe: "Why that, and not the quicker option?",
      options: [
        {
          id: "trace",
          label: "Retrace every step, then start again with clean tools",
          detail: "Find where it got in. Then take a fresh cut with a new blade.",
          correct: true,
          outcome:
            "The model points you to a shared cutting blade. The lab swaps the blade, wipes the bench, and starts a second run from a new cuff piece.",
          approach: "isolate_variable",
          next: "b9",
        },
        {
          id: "subtract",
          label: "Subtract the stray DNA from the result",
          detail: "We know it is stray. Take it out and read what remains.",
          correct: false,
          approach: "brute_force",
          next: "b8",
        },
        {
          id: "ignore",
          label: "Note it in the file and carry on",
          detail: "Stray DNA happens. The main result still stands.",
          correct: false,
          approach: "act_first",
          next: "b8",
        },
        {
          id: "blame",
          label: "Find which worker it belongs to and report them",
          detail: "Someone was careless. Deal with that person.",
          correct: false,
          approach: "change_many",
          next: "b8",
        },
      ],
      consequences: {
        subtract:
          "You can only subtract what you can name. If two people mixed, the six markers may not belong to one person at all.",
        ignore:
          "Amara points at the empty tube. “If DNA can get there, it can get onto the glove. We do not carry on.”",
        blame:
          "The model shows a shared blade, not one bad worker. Blame one person and the same blade can spoil the next case.",
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
        "The second run starts at four, using the clean path you chose.",
        "It will take fourteen hours.",
        "Ray is in the hall, making a hard phone call 📞.",
        "Joon labels each tube slowly this time.",
        "Amara brings you coffee and points to the first report.",
        "“Explain why this match was not enough,” she says.",
      ],
      prompt: "Why wasn't the first match good enough?",
      placeholder: "Two plain sentences will do.",
      next: "b10",
    },

    /* ---------------- ACT 3 — THE ANSWER, AND WHAT IT COSTS ------------- */
    {
      id: "b10",
      act: 3,
      mood: "tense",
      beat: "His name is already out",
      visual: {
        kind: "interview",
        title: "08:15 — the local paper has it",
        caption: "Somebody talked. Elias's name is on a website.",
        status: "no charge filed",
      },
      type: "choice",
      text: [
        "Before the second result returns, Elias's name leaks.",
        "By breakfast it is on a local news site 📰.",
        "The story says “museum attack breakthrough”.",
        "He has not been charged. He has not been arrested.",
        "His boss calls the police station to ask whether to suspend him.",
      ],
      prompt: "The second result isn't back yet. What do you do this morning?",
      concept:
        "Uncertain findings have real costs the moment they leave the lab.",
      options: [
        {
          id: "state",
          label: "Put the uncertainty in writing, today",
          detail:
            "One note: six markers, huge search, stray DNA found, second run pending.",
          correct: true,
          outcome:
            "You send a plain note before lunch. It says the first hit was weak and the second run is not back. Ray reads it twice and calls the news desk.",
          approach: "measure_first",
          next: "b11",
        },
        {
          id: "wait",
          label: "Say nothing until the second result lands",
          detail: "Fourteen hours. Then we'll know.",
          correct: false,
          approach: "follow_authority",
          next: "b10",
        },
        {
          id: "deny",
          label: "Tell the press the lab never named anybody",
          detail: "Technically true. The search list named him.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b10",
        },
        {
          id: "leak",
          label: "Find the leak first",
          detail: "Someone in this building talked. Deal with that.",
          correct: false,
          approach: "change_many",
          next: "b10",
        },
      ],
      consequences: {
        wait: "By tonight he is suspended. His neighbours have read the story, and a camera waits outside his mother's flat.",
        deny: "Amara shakes her head. “We gave the computer the profile. We chose the search. Do not hide behind the machine.”",
        leak: "Worth doing, but it does not remove one word from the website. The named man is still losing his day.",
      },
      hints: [
        "The second result is fourteen hours away.",
        "You cannot say he is innocent. You can say the first hit is weak.",
        "Write what you know, and send it under your name.",
      ],
    },
    {
      id: "b11",
      act: 3,
      mood: "insight",
      beat: "Making the second run count",
      visual: {
        kind: "lab",
        title: "The rules for run two",
        caption: "If it shares anything with run one, it proves nothing.",
        status: "run rules on the board",
      },
      trivia: {
        emoji: "👯",
        title: "Twins share their code",
        text: "Identical twins have the same DNA profile from birth. But their fingerprints are different, because those form as the baby grows in the womb.",
      },
      type: "reorder",
      text: [
        "After Ray calls the news desk, the second run is ready to set up.",
        "Amara writes RUN TWO on the board and hands you the pen ✏️.",
        "“This test must be able to disagree with the first one,” she says.",
        "“Build it so the old answer cannot steer it.”",
      ],
      primer: {
        term: "Testing blind",
        plain:
          "Testing blind means the person running a test is not told the answer people hope to see.",
        like: "marking exam papers with the names covered up.",
      },
      prompt: "How do you make the second run able to prove the first one wrong?",
      instruction: "Put the four steps in the order you must do them.",
      steps: [
        {
          id: "clean",
          label: "Clean the bench and open a sealed blade",
          detail: "Nothing from run one may touch run two.",
        },
        {
          id: "cut",
          label: "Cut from a different part of the cuff",
        },
        {
          id: "blanks",
          label: "Run empty tubes beside the sample",
          detail: "If anything strays in again, the blanks will catch it.",
        },
        {
          id: "blind",
          label: "Search the list without telling the worker the old name",
        },
      ],
      wrong:
        "“No,” Amara says. “You touched the glove before the bench was clean. That cut cannot be undone.”",
      right:
        "“Good,” Amara says. “Clean tools, new cuff piece, blanks watching, and no expected name.” Joon seals the plate and starts the run.",
      concept:
        "A confirming test only counts if it could have come back different.",
      probe: "Why does it matter that the worker doesn't know the first name?",
      hints: [
        "Think about what must be true before anyone touches the glove.",
        "A cut cannot be undone. What comes before cutting?",
        "Clean first, then cut, then watch for strays, then compare without the old name.",
      ],
      next: "b12",
    },
    {
      id: "b12",
      act: 3,
      mood: "alarm",
      beat: "Twelve markers",
      visual: {
        kind: "sequencer",
        title: "Twelve clean peaks",
        caption: "A real profile at last. It belongs to somebody else entirely.",
        status: "12 of 16 markers · 1 match",
      },
      trivia: {
        emoji: "🌍",
        title: "Almost the same code",
        text: "Any two humans share about 99.9% of their DNA. The tiny bit left over is what makes each of us look different from anyone else.",
      },
      type: "narrative",
      text: [
        "The clean run finishes after Joon starts the plate.",
        "This time the blanks are clean.",
        "The cuff gives twelve markers, not six.",
        "The profile does not match Elias.",
        "It matches a sample already in the case file.",
        "The name is Dale.",
        "Dale found the glove in the hedge 🌿 that night and picked it up.",
        "Ray looks at the map. “So touching it proves nothing.”",
      ],
      next: "b13",
    },
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
      type: "choice",
      text: [
        "Ray is right that Dale touched the glove.",
        "But two stories still fit.",
        "Maybe Dale wore it during the attack.",
        "Maybe he only picked it up from the hedge.",
        "Amara places the glove photo between you.",
        "“What would those two actions leave in different places?” she asks.",
      ],
      prompt: "What question actually decides this?",
      concept:
        "When one result fits two stories, look for the fact only one story predicts.",
      probe: "How did you know the other questions wouldn't settle it?",
      options: [
        {
          id: "where",
          label: "Where on the glove the DNA sits",
          detail:
            "Picking it up leaves skin outside. Wearing it leaves skin inside the cuff.",
          correct: true,
          outcome:
            "Joon pulls the sampling map from the case file. The twelve-marker profile came from inside the cuff. Amara sends that map for final checking.",
          approach: "isolate_variable",
          next: "b14",
        },
        {
          id: "amount",
          label: "How much of his DNA is on it",
          detail: "A wearer would surely leave more than a handler.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b13",
        },
        {
          id: "alibi",
          label: "Where he says he was that night",
          detail: "Ask him for his story.",
          correct: false,
          approach: "act_first",
          next: "b13",
        },
        {
          id: "resample",
          label: "Run the whole glove again for a third time",
          detail: "More data is always better.",
          correct: false,
          approach: "brute_force",
          next: "b13",
        },
      ],
      consequences: {
        amount:
          "Amount changes with sweat, weather, and years in a paper bag. It cannot clearly split wearing from picking up.",
        alibi:
          "Ray can ask that. But your strongest tool is the glove itself, because its inside and outside remember different actions.",
        resample:
          "Another run would give the same name from the same place. The question is not who. The question is where.",
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
        "The final map returns on Friday morning.",
        "Dale's DNA is packed inside the cuff, where a wrist would rub.",
        "The outer palm, where a finder would grip it, carries almost none of him.",
        "You cannot say he is guilty. That is not your job.",
        "You can hand over one clear finding.",
        "It fits wearing the glove, and it does not fit simply picking it up.",
        "Elias gets a letter ✉️, an apology, and a correction on the website.",
        "Amara signs the correction anyway.",
        "“The machine answered our question,” she says.",
        "“We had to learn which question we were really asking.”",
      ],
      outcome: "success",
    },
  ],
};
