import type { Scenario } from "../types";

/**
 * The trap here is that the evidence is real and the reasoning is not. A DNA
 * "match" feels like an answer, but its strength is entirely a function of two
 * numbers the certificate does not print: how many markers the profile carries,
 * and how many people you compared it against.
 *
 * Act 3 turns the careful method against the learner: the clean, twelve-marker
 * profile finally names somebody — and that somebody had a lawful reason to
 * touch the exhibit. A match is a question, not a verdict. The only thing that
 * closes it is *where on the glove* the DNA sat.
 */
export const coldCase: Scenario = {
  id: "cold-case",
  title: "The Match",
  tagline: "Eleven years cold. One database hit. Everybody wants an arrest by six.",
  domain: "biology",
  difficulty: "medium",
  learningGoal:
    "Learn why a DNA match is only as strong as the markers behind it — and the size of the crowd you searched.",
  takeaway: {
    concept: "How strong a match really is",
    field: "Biology \u2014 DNA evidence",
    inOneLine:
      "A DNA profile is a list of markers. Each extra marker cuts the crowd of people who could match by about three quarters \u2014 so a short profile searched against a huge database will always find somebody, and finding somebody is not the same as finding the person.",
    rule:
      "Before you believe a hit, ask two questions the certificate never prints: how many markers is it built on, and how many people did you compare it against? A one-in-eighteen-thousand chance stops being rare the moment you look at three hundred thousand people.",
    elsewhere: [
      "A medical screening test that is \u201c99% accurate\u201d still flags mostly healthy people when the disease is rare.",
      "Facial recognition run against a whole city produces innocent lookalikes by the dozen.",
      "\u201cThis stock picker beat the market five years running\u201d \u2014 out of ten thousand pickers, someone had to.",
      "A fraud filter that alerts on one in a thousand transactions buries a bank in false alarms.",
    ],
    youUsedIt: [
      "You asked how many markers the match was built on before you asked who it named.",
      "You worked out how many innocent people that profile would match across a three-hundred-thousand-person database.",
      "You wrote the uncertainty down instead of letting the word \u201cmatch\u201d do the arguing for you.",
      "At the end you stopped asking whose DNA it was and started asking where on the glove it sat.",
    ],
  },
  minutes: 13,
  stageLabel: "Ardenmoor forensics",
  partnerGreeting:
    "I'm at the next bench. You run the science; I'll watch how you handle a result everybody already believes.",
  intro: {
    role: "forensic scientist",
    cta: "Open the case file",
    text: [
      "Ardenmoor Regional Forensics, Tuesday, 09:40.",
      "Eleven years ago somebody broke into the Ardenmoor Museum at night and put the guard, Sam Okafor, in hospital for four months. Nobody was ever charged.",
      "All the case ever had was one grey wool glove, found in the hedge by the side gate.",
      "This morning the machines are good enough to pull something off the inside of its cuff — the place a wearer's skin touches.",
      "And it has come back with a name.",
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
      type: "narrative",
      text: [
        "Dr. Amara Osei runs this lab, and she does not get excited. This morning she is standing up.",
        "“Eleven years,” she says. “We finally got a profile off the cuff.”",
        "Joon, six weeks out of university, has the result on the big screen. It has been run against the national database — a search across three hundred thousand people.",
        "One name comes back. Elias Roy, thirty-four, delivery driver. He is in the database for shoplifting at nineteen and nothing since.",
        "Detective Ray Callahan is already in the doorway with his coat on.",
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
      type: "choice",
      text: [
        "“That's him,” Ray says. “Eleven years and it's a delivery driver. Get me the paperwork and I'll have him by lunch.”",
        "Amara doesn't move. She's watching you.",
        "Before you answer, drag the model below and see what a profile is actually made of — a row of markers.",
      ],
      primer: {
        term: "Marker",
        plain:
          "One spot on your DNA where people differ. The lab reads that spot and writes down a number. A profile is just a list of those numbers.",
        like: "one digit of a phone number — on its own it rules out almost nobody, but collect enough digits and only one phone rings.",
      },
      prompt: "What do you do first?",
      concept:
        "The strength of a match depends on how many markers it is built from.",
      probe: "Why that first?",
      options: [
        {
          id: "markers",
          label: "Ask how many markers the match is built on",
          detail: "A profile is a list. The length of that list is the whole story.",
          correct: true,
          outcome:
            "Ray stops in the doorway. Joon finds the marker count, and the room goes quiet. Amara sits down. “Say that number out loud,” she tells him.",
          approach: "measure_first",
          next: "b3",
        },
        {
          id: "arrest",
          label: "Write the report so Ray can go",
          detail: "The machine says Elias Roy. That is what the machine is for.",
          correct: false,
          approach: "follow_authority",
          next: "b2",
        },
        {
          id: "rerun",
          label: "Run the same sample through again",
          detail: "If it comes back the same twice, it must be right.",
          correct: false,
          approach: "brute_force",
          next: "b2",
        },
        {
          id: "history",
          label: "Pull Elias Roy's record and look for a motive",
          detail: "Find out what kind of man we are dealing with.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b2",
        },
      ],
      consequences: {
        arrest:
          "Amara puts a hand flat on the desk. “You are about to sign your name to a sentence. Before you do — how many markers is it? You don't know. Neither does he.”",
        rerun:
          "The same sample through the same machine gives the same answer, for the same reason it did the first time. Running it twice tests the machine. It does not test the conclusion.",
        history:
          "You read about a nineteen-year-old who took a jacket from a shop. It tells you nothing about a museum in 2014 — but it does make him easier to believe guilty, which is exactly the problem.",
      },
      hints: [
        "The screen says “match”. It does not say how much of a profile matched.",
        "In the model, notice how much difference a single extra marker makes.",
        "Ask Joon for the number of markers before you ask anything else.",
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
        "“Six,” Joon says. “We only got six markers. The other ten spots came back empty — eleven years in a paper bag broke the sample down.”",
        "A full profile is sixteen. Six is a fragment.",
        "Amara turns to Ray. “So what we have is everyone in the country who happens to share six numbers with our glove. And we just asked three hundred thousand of them.”",
        "Ray's jaw sets. “It came back with one name.”",
        "“It came back with the one name that was in the room,” she says.",
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
        "Amara pulls a chair over. “Show me. City of three hundred thousand — that's your matching pool right now. Any one marker is shared by roughly one person in four.”",
        "“Turn the dial until the pool stops being a crowd and starts being a person.”",
        "Joon has a warning: the sample is nearly gone. Past about thirteen markers there is nothing left for anyone to check your work with.",
      ],
      primer: {
        term: "The matching pool",
        plain:
          "Everyone still left who could have produced this DNA. Each marker you add throws most of them out.",
        like: "a hall full of people, and you ask everyone not born in July to leave — then everyone without a brother, then everyone who can't swim.",
      },
      prompt: "How many markers before this is one human being?",
      concept:
        "Each added marker divides the matching pool — a few markers is a crowd, a dozen is a person.",
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
          text: "Still a crowd. You could fill a bus with people who match this profile — and one of them happens to be in the database.",
        },
        {
          max: 9,
          text: "Close. Down to a handful — but a handful is not a person, and a jury will hear the word “match” either way.",
        },
        {
          max: 13,
          text: "The crowd collapses to one. At this many markers, nobody else alive shares this profile. Amara nods slowly. “Now that would be evidence.”",
        },
        {
          max: 16,
          text: "The machine burns through the last of the sample chasing markers that were never there. You get four more spots and nothing left for a second opinion. Joon looks sick.",
        },
      ],
      hints: [
        "Watch the dots, not the number. When do they stop looking like a crowd?",
        "Every extra marker leaves only a quarter of the people standing.",
        "Somewhere between ten and thirteen markers, the pool drops below one person — and thirteen is all the sample can give.",
      ],
      next: "b5",
    },

    /* ---------------- ACT 2 — THE CROWD ---------------- */
    {
      id: "b5",
      act: 2,
      mood: "tense",
      beat: "One in eighteen thousand",
      simulation: "suspect-funnel",
      visual: {
        kind: "interview",
        title: "The number on the certificate",
        caption: "It is correct. It is also not the number he thinks it is.",
        status: "1 in 18,000",
      },
      type: "choice",
      text: [
        "The slider showed what a strong profile would need. But the real glove still has only six markers. Joon prints the result for those six: one in eighteen thousand.",
        "Ray has the certificate in his hand. “One in eighteen thousand. That is what your own lab wrote. One in eighteen thousand, and you want me to let him walk?”",
        "He is not wrong about the number. Have a go at the model before you answer him.",
      ],
      primer: {
        term: "Searching a database",
        plain:
          "Checking your evidence against a huge list of people at once, instead of against one suspect you already had a reason to test.",
        like: "buying three hundred thousand lottery tickets. A one-in-eighteen-thousand win stops being a miracle and starts being arithmetic.",
      },
      prompt: "What is wrong with the way he is reading that number?",
      concept:
        "A rare match found by searching a huge pool is not rare — it is expected.",
      probe: "What made you rule out the others?",
      options: [
        {
          id: "pool",
          label: "We searched 300,000 people, so hits are expected",
          detail:
            "One in eighteen thousand, across three hundred thousand people, is about sixteen innocent matches.",
          correct: true,
          outcome:
            "“So the machine did its job,” Amara says. “It found the man who fits. It was never asked whether anyone else fits too.” Ray takes his coat off for the first time all morning.",
          approach: "seek_pattern",
          next: "b6",
        },
        {
          id: "wrongnumber",
          label: "The lab calculated the odds wrong",
          detail: "Somebody has made an arithmetic error somewhere.",
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
          "Joon recalculates it three times. One in eighteen thousand, every time. The number is perfectly correct — it is the question it answers that has been swapped.",
        dna: "Slide the model down to a single suspect. Same test, same odds, and now a match would be powerful evidence. The science is fine. The search was the problem.",
        old: "Age cost you markers, and that matters. But even a fresh six-marker profile searched across three hundred thousand people would throw up the same crowd of innocent hits.",
      },
      hints: [
        "The odds did not change. Something else did.",
        "In the model, drag the number of people searched and watch the second bar.",
        "If you knock on eighteen thousand doors, somebody eventually opens one.",
      ],
    },
    {
      id: "b6",
      act: 2,
      mood: "insight",
      beat: "How a coincidence gets a name",
      visual: {
        kind: "interview",
        title: "Amara wants it in plain words",
        caption: "“Say it as a sentence. If you can't, you don't have it yet.”",
        status: "whiteboard",
      },
      type: "reorder",
      text: [
        "Amara wipes the whiteboard. “Ray is going to hear this from a lawyer one day. Let's get it right now.”",
        "“Walk me through how an innocent man ends up on my screen.”",
      ],
      prompt: "How does a coincidence turn into a suspect?",
      instruction: "Put the five steps in the order they actually happen.",
      steps: [
        {
          id: "degrade",
          label: "The old sample only gives up six markers",
          detail: "Ten spots come back empty.",
        },
        {
          id: "shared",
          label: "A six-marker profile fits thousands of people",
        },
        {
          id: "search",
          label: "We compare it against 300,000 people at once",
        },
        {
          id: "hit",
          label: "Somebody in that database matches by pure chance",
        },
        {
          id: "name",
          label: "The screen prints his name, and the name feels like proof",
          detail: "Nothing on the screen says how big the crowd was.",
        },
      ],
      wrong:
        "“Read it back to yourself,” Amara says. “Does each step actually cause the next one? You've got the crowd appearing after we searched it.”",
      right:
        "“That's the whole thing,” she says. “Weak profile, big search, guaranteed hit. Ray — that is not a suspect. That is arithmetic wearing a suspect's coat.”",
      concept:
        "A weak profile plus a large search makes a coincidence match almost certain.",
      probe: "Which step would you change to make the result mean something?",
      hints: [
        "Start with the thing that went wrong eleven years before anyone searched anything.",
        "Each line should make the next line happen. Try saying “…which means…” between them.",
        "Old sample → few markers → big crowd → huge search → a hit that had to happen.",
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
        title: "Tube H12 — the blank",
        caption: "It contains nothing. It is not supposed to contain anybody.",
        status: "third profile detected",
      },
      type: "narrative",
      text: [
        "At 14:20 Joon comes back from the plate room holding a printout at arm's length, like it is hot.",
        "“The blank,” he says. “The empty tube. There's DNA in it.”",
        "The blank holds no sample at all. Whatever turned up in it got there by accident — and if it got into the blank, it could have got onto the glove.",
        "Amara reads the trace. It is not Elias Roy. It is not the guard. It is not the victim.",
        "It is a fourth person nobody has ever mentioned.",
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
        "“Somebody's DNA is in the blank,” Amara says. “A tube that had nothing in it. I want to know where it got on board.”",
        "Walk the glove through the lab in the model below, then decide.",
      ],
      primer: {
        term: "The blank",
        plain:
          "A tube the lab leaves deliberately empty and runs beside the real sample, so that anything drifting around the room shows up somewhere harmless first.",
        like: "a clean plate left out at a picnic — whatever lands on it also landed on the food.",
      },
      prompt: "What do you do about the stray profile?",
      concept:
        "A result is only as clean as the path the sample travelled to reach it.",
      probe: "Why that, and not the quicker option?",
      options: [
        {
          id: "trace",
          label: "Retrace every step, then start again with clean tools",
          detail: "Find where it got in, then take a fresh cut from the glove with a new blade.",
          correct: true,
          outcome:
            "It takes eleven hours. You find it on a cutting blade that was cleaned but never swapped between two cases in 2014. Joon looks ill. Amara looks relieved. “Now we know what the result is worth,” she says.",
          approach: "isolate_variable",
          next: "b9",
        },
        {
          id: "subtract",
          label: "Subtract the stray profile from the result",
          detail: "We know it's contamination. Take it out and read what's left.",
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
          label: "Find out which analyst it belongs to and report them",
          detail: "Someone was careless. Deal with the person.",
          correct: false,
          approach: "change_many",
          next: "b8",
        },
      ],
      consequences: {
        subtract:
          "You can only subtract what you can identify. If a stray profile reached the plate, those six markers you trusted might be two people mixed together — and nothing on the screen tells you which peak came from whom.",
        ignore:
          "Amara doesn't raise her voice. “If DNA can get into a sealed empty tube, it can get onto a glove. You have just been told your result might not have come from the exhibit at all. You do not carry on.”",
        blame:
          "Look at the model. It was a shared blade, not a careless person. Punish the analyst and the same blade ruins the next case next week.",
      },
      hints: [
        "The stray DNA is not the problem. Not knowing where it got in is the problem.",
        "In the model, switch blades and watch which steps go clean.",
        "You need a second run that shares nothing with the first — new blade, new bench, new gloves.",
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
        "The second extraction goes in at four. Fourteen hours in the machine.",
        "Ray is in the corridor on the phone to somebody who is not happy. Joon is labelling tubes very slowly and very carefully.",
        "Amara brings you a coffee. “Right. Explain it to me like I'm the jury, because one day I will be.”",
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
        caption: "Somebody talked. Elias Roy's name is on a website.",
        status: "no charge filed",
      },
      type: "choice",
      text: [
        "Overnight, Elias Roy's name leaks. By breakfast it is on a local news site under the words “museum attack breakthrough”.",
        "He has not been charged. He has not been arrested. He has been named.",
        "His employer calls the police station to ask whether they should suspend him.",
      ],
      prompt: "The second result isn't back yet. What do you do this morning?",
      concept:
        "Uncertain findings have real costs the moment they leave the lab.",
      options: [
        {
          id: "state",
          label: "Put the uncertainty in writing, today",
          detail:
            "A one-page note: six markers, large search, contamination found, second run pending.",
          correct: true,
          outcome:
            "You write two pages that say, in plain language, exactly how strong the match is and exactly how strong it is not. Ray reads it twice. “This makes my case weaker.” “Yes,” says Amara. “It makes it true.”",
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
          detail: "Technically true. The database named him.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "b10",
        },
        {
          id: "leak",
          label: "Find the leak first",
          detail: "Somebody in this building talked. Deal with that.",
          correct: false,
          approach: "change_many",
          next: "b10",
        },
      ],
      consequences: {
        wait: "By tonight he has been suspended, his neighbours have read it, and a photographer is outside his mother's flat. Fourteen hours is not nothing when it is happening to you.",
        deny: "Amara looks at you for a long moment. “The database ran the search we asked it to run, on the profile we gave it. Don't hide behind a machine you switched on.”",
        leak: "Worth doing — but it is a staffing problem, and it does not remove one word from the website. The man is still named this morning.",
      },
      hints: [
        "The second result is fourteen hours away. The damage is happening now.",
        "You cannot say he is innocent. You can say exactly how weak the finding is.",
        "Write down what you actually know, and let that go out under your name.",
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
        status: "protocol on the board",
      },
      type: "reorder",
      text: [
        "Amara writes RUN TWO on the whiteboard and hands you the pen.",
        "“A test that can only ever agree with you is not a test. If this one is going to mean anything, it has to be able to disagree with the first. Set it up.”",
      ],
      primer: {
        term: "Testing blind",
        plain:
          "The person running the test is not told which answer everyone is hoping for, so they cannot lean towards it without noticing.",
        like: "marking exam papers with the names covered up.",
      },
      prompt: "How do you make the second run able to prove the first one wrong?",
      instruction: "Put the four steps in the order you must do them.",
      steps: [
        {
          id: "clean",
          label: "Clean the bench and open a sealed blade",
          detail: "Nothing that touched run one may touch run two.",
        },
        {
          id: "cut",
          label: "Cut from a different part of the cuff",
        },
        {
          id: "blanks",
          label: "Run empty tubes alongside the sample",
          detail: "If anything strays in again, the blanks will catch it.",
        },
        {
          id: "blind",
          label: "Search the database without telling the analyst the old name",
        },
      ],
      wrong:
        "“No,” says Amara. “You've just cut into an exhibit on a bench you haven't cleaned. Every step after that is worthless, and you can never take the cut back.”",
      right:
        "“Good. Clean tools, new material, blanks watching, and nobody in that room expecting Elias Roy.” She caps the pen. “Now we find out.”",
      concept:
        "A confirming test only counts if it could have come back different.",
      probe: "Why does it matter that the analyst doesn't know the first name?",
      hints: [
        "Think about what must be true before you are allowed to touch the glove.",
        "Cutting is irreversible. What has to happen before an irreversible step?",
        "Clean first, then cut, then watch for strays, then compare — blind.",
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
      type: "narrative",
      text: [
        "Twelve markers. Clean blanks. One single, unmistakable profile off the inside of the cuff.",
        "It does not match Elias Roy. Not on any marker he was supposed to share.",
        "It matches a sample already sitting in the case file, taken in 2014 and never thought about again.",
        "Dale Okafor. The guard's brother.",
        "He is the man who found the glove in the hedge that night and picked it up before the police arrived. Which gives him a perfectly innocent reason for his DNA to be on it.",
        "Ray reads the name twice. “So we're back to nothing.”",
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
        "Two stories fit the same match. He wore it. Or he picked it up.",
        "Amara puts the exhibit photograph on the bench between you. “A match tells you he touched it. It never tells you when, or how. So — what separates the two?”",
      ],
      prompt: "What question actually decides this?",
      concept:
        "When one result fits two explanations, look for the measurement that only fits one.",
      probe: "How did you know the other questions wouldn't settle it?",
      options: [
        {
          id: "where",
          label: "Where on the glove the DNA sits",
          detail:
            "Picking a glove out of a hedge leaves skin on the outside. Wearing it leaves skin inside the cuff.",
          correct: true,
          outcome:
            "Joon pulls the original sampling map. The profile came from inside the cuff — the part that only touches the person wearing it. It is the first fact all week that points somewhere on its own.",
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
          label: "Whether he has an alibi for that night",
          detail: "Ask him where he was.",
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
          "Quantity depends on how sweaty his hands were, how long he held it, and eleven years in a paper bag. It varies far too much to separate two people's stories.",
        alibi:
          "Worth asking, and Ray will. But an alibi is somebody's account of themselves. You are holding the one thing in this case that cannot be talked round — use it.",
        resample:
          "You would get the same profile from the same place. The question is not who it is any more. It is where on the glove he left it.",
      },
      hints: [
        "Both stories agree he touched the glove. Find the thing they disagree about.",
        "Picture the two actions: pulling it on, versus picking it up off a branch.",
        "The skin from those two actions does not end up in the same place.",
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
        "The mapping comes back on Friday morning. Dale Okafor's DNA is on the inside of the cuff, packed into the wool where a wrist would sit. The outer surface — the part you would grip to lift it out of a hedge — carries almost nothing of him.",
        "You do not get to say he is guilty. That is not your job. But you get to hand over a finding that fits one story and not the other, and say exactly how strongly.",
        "Elias Roy gets a letter, an apology, and a correction on a website that four people will read. Amara signs it anyway.",
        "“The machine was never wrong,” she says, pulling on her coat. “It answered the question we asked. It just wasn't the question anybody thought we were asking.”",
        "Outside, the car park lights are switching themselves off.",
      ],
      outcome: "success",
    },
  ],
};
