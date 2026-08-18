import type { Scenario } from "@/types/story";

/**
 * The trap in this story is a *source*. Sinon’s account is vivid, complete and
 * answers every question the city has — which is exactly what a prepared story
 * is built to do. The counter-move is not doubting everything. It is finding
 * something that wants nothing from you: warm ash, ship marks, the depth of a
 * wheel track.
 *
 * The spine is one continuous run from dawn to dawn, and every beat hands the
 * next one its starting condition:
 *
 *   t1  the beach is empty; the ground is still warm, and wheel tracks lead in
 *   t2  walk the camp instead of celebrating — waiting is how Troy wins
 *   t4  a Greek is found in a ditch; split his account and only one claim holds
 *   t5  the tracks are a scale: six tonnes, so three tonnes of it is not wood
 *   t6  *now* the chain can be laid out, because you know men are inside
 *   t7  you may not burn it, so you place it — open ground is the weapon
 *   t8  say out loud why one man’s word was not enough
 *   t10 they climb out at night, refuse the open ground, and their footprints
 *       go east to the drain while the confident voice still says main gate
 *   t12 the fleet returns to a barred gate
 *
 * Two ordering rules are load-bearing. The horse is weighed (t5) *before* the
 * learner is asked to lay out how the trap runs (t6) — stating a conclusion and
 * then going to find the evidence for it is the exact habit this story exists
 * to break. And act 3 is a *consequence* of the slider: the raiders walk east
 * because the learner left them too much open ground to cross.
 *
 * Numbers, fixed once and used everywhere: the tracks say six tonnes, an empty
 * shell would be three, solid oak would be fourteen. The extra three tonnes is
 * forty men. Fifteen men can lift the gate bar. Every hundred paces of open
 * ground costs the raiders six men.
 *
 * Length is a gate. This story was once thirteen minutes and lost people in the
 * middle; the beats that only repeated a point are gone rather than thinned, so
 * what is left still reads like a story and not like notes.
 */
export const trojanHorse: Scenario = {
  id: "trojan-horse",
  title: "Hold the Gate",
  tagline: "The Greeks are gone. They left a gift. You are the one who says yes or no.",
  blurb:
    "Ten years of siege ended overnight, and the beach is empty except for a wooden horse taller than six men. A Greek found in a ditch explains everything, beautifully. You command the gate, so the question lands on you: do you trust the man who talks, or the ground that cannot?",
  art: {
    alt: "Dawn over the walls of Troy: an enormous wheeled wooden horse standing alone on an empty plain, cold ash and deep wheel ruts in the sand where a thousand ships used to be.",
    emoji: "🐴",
  },
  domain: "history",
  difficulty: "easy",
  learningGoal:
    "Learn to test a convincing story against evidence that has no reason to lie.",
  takeaway: {
    concept: "Testing a story against evidence",
    field: "History — how we know things",
    inOneLine:
      "A convincing story only proves somebody wanted you to believe it. Check it against the ground.",
    rule:
      "Ask who gains if you believe. Then find something that could not have been arranged for you. See if it agrees.",
    elsewhere: [
      "A witness’s time, checked against a camera clock.",
      "A company’s good-news letter, checked against what it banked.",
      "A king’s tale, checked against what diggers found.",
    ],
    youUsedIt: [
      "You read the ground before the man.",
      "You cut his story and held each claim against the sand.",
      "You let the tracks argue with your side.",
    ],
  },
  minutes: 7,
  stageLabel: "Main gate watch",
  partnerGreeting:
    "I’ll walk the wall with you. You make the calls; I’ll watch how you weigh what people tell you.",
  intro: {
    role: "gate watch captain",
    cta: "Take the wall",
    text: [
      "Troy, the tenth summer of the siege. You command the main gate watch.",
      "For ten years, a thousand Greek ships crowded the beach.",
      "This morning it is empty. On the plain stands a wooden horse the height of six men, on wheels, facing your gate.",
    ],
    visual: {
      kind: "shore",
      title: "Dawn, the tenth year",
      caption: "A thousand ships were here yesterday.",
      status: "beach empty",
    },
  },
  preSession: {
    prompt: "This looks like good news. What is your instinct?",
    options: [
      {
        id: "measure",
        label: "Go and check the ground myself",
        approach: "measure_first",
      },
      {
        id: "act",
        label: "Move fast while there’s time",
        approach: "act_first",
      },
      {
        id: "pattern",
        label: "Ask what would have to be true for this",
        approach: "seek_pattern",
      },
      {
        id: "king",
        label: "Take it to King Priam",
        approach: "follow_authority",
      },
    ],
  },
  startScene: "t1",
  scenes: [
    /* ---------------- ACT 1 — THE EMPTY BEACH ---------------- */
    {
      id: "t1",
      act: 1,
      mood: "calm",
      beat: "Empty beach",
      visual: {
        kind: "shore",
        title: "The plain at first light",
        caption: "No ships. No tents. Ash where ten thousand men slept.",
        status: "watch changed at dawn",
      },
      type: "narrative",
      text: [
        "The city goes mad before dawn. People run to the walls, singing. 🎉",
        "Maia, your scout, kneels on the wall with a counting stick.",
        "“The fire pits are still warm,” she says. “Last night, not last week.” 🔥",
        "“Ship grooves out to sea and back. Two wheel tracks in to the horse.”",
        "“And the east-wall storm drain is dry — wide enough for a man on his belly.” 💧",
      ],
      next: "t2",
    },
    {
      id: "t2",
      act: 1,
      mood: "tense",
      beat: "First move",
      simulation: "siege-clock",
      simGuide: {
        shows:
          "The falling line is Troy’s grain. The dashed line is day forty, when storms close the sea and the fleet must sail.",
        move: "Drag the slider to set how much grain each person gets a day.",
        watch:
          "Feed people less. The line reaches past the storms — Troy outlasts the siege, so the enemy must lure you out.",
      },
      visual: {
        kind: "walls",
        title: "Everyone wants the gate open",
        caption: "Ten years of waiting, and one morning to throw it away.",
        status: "gate still barred",
      },
      type: "choice",
      primer: {
        term: "The ground",
        plain:
          "marks left by what really happened. They have no reason to lie — nobody made them to persuade.",
        like: "footprints in fresh snow.",
      },
      text: [
        "Warm ash means somebody was here last night. Nobody wants to hear it.",
        "Deiphobus, the king’s son, wants gates open and the city on the plain by noon.",
        "Look at what waiting was doing for Troy.",
      ],
      prompt: "What do you do first?",
      concept:
        "A city behind a wall wins by waiting — so a trick must persuade it to come out.",
      probe: "Why that first?",
      options: [
        {
          id: "walk",
          label: "Walk the empty camp and read the ground",
          correct: true,
          outcome:
            "You read ash and tent-pole holes with Maia. By noon you have a page the ground insists on.",          approach: "measure_first",
          next: "t4",        },
        {
          id: "open",
          label: "Open the gates and let people out",
          correct: false,
          approach: "act_first",
          next: "t2",
        },
        {
          id: "burn",
          label: "Burn it with fire arrows from the wall",
          correct: false,
          approach: "brute_force",
          next: "t2",
        },
        {
          id: "priam",
          label: "Wake King Priam",
          correct: false,
          approach: "follow_authority",
          next: "t2",
        },
      ],
      consequences: {
        open: "Nine thousand people pour onto open ground with no order and no way back. Your gate stands wide behind them.",
        burn: "Maia catches your arm. “Burn it and we never learn what it was for. It is the only thing they left us.”",
        priam:
          "Priam is in the square already, being told six different stories by six different men. He needs somebody who has walked the ground.",
      },
      hints: [
        "The camp is the one place nobody has been standing over, arranging things.",
        "Look at the model: how does Troy actually win a siege?",
        "If waiting wins, the trick has to be something that makes you stop waiting.",
      ],
    },
    {
      id: "t4",
      act: 1,
      mood: "tense",
      beat: "The man in the ditch",
      simulation: "story-check",
      simGuide: {
        shows: "The four cards are the four things Sinon has just told you.",
        move: "Tap the buttons to switch between taking his word and checking each claim.",
        watch:
          "Under checking, three cards turn red and one stands. A story can be beautiful and still be mostly false.",
      },
      visual: {
        kind: "interview",
        title: "Sinon talks",
        caption: "He answers every question. He answers them beautifully.",
        status: "one source, no witnesses",
      },
      type: "choice",
      trivia: {
        emoji: "🦷",
        title: "Gift horse, open mouth",
        text: "People once judged a horse’s age by its teeth. Hence the old rule: never look a gift horse in the mouth.",
      },
      text: [
        "A man is dragged from a ditch, filthy and tied at the wrists. His name is Sinon. 😭",
        "His story is perfect. The fleet sailed home. His side left him to die. The horse is a sealed gift to the goddess, too big for your gates.",
        "“That tar is fresh,” your soldier says. “Somebody sealed it this week.”",
        "Hold each claim against the ground you read this morning.",
      ],
      prompt: "How do you handle what Sinon told you?",
      primer: [
        {
          term: "The story",
          plain:
            "what a person tells you happened. It can be true — or exactly what somebody prepared for you.",
          like: "an answer to every question.",
        },
      ],
      concept:
        "One source who wants something from you is a claim, not evidence — check it against something that wants nothing.",
      probe: "What made you distrust the story that explained everything?",
      options: [
        {
          id: "check",
          label: "Test each claim against the camp",
          correct: true,
          outcome:
            "Two columns: what he says, what the ground shows. One survives — the horse is too big. The fleet did not sail.",
          approach: "measure_first",
          next: "t5",
        },
        {
          id: "believe",
          label: "Believe him — nobody lies that well while weeping",          correct: false,
          approach: "follow_authority",
          next: "t4",
        },
        {
          id: "torture",
          label: "Beat the truth out of him",
          correct: false,
          approach: "brute_force",
          next: "t4",
        },
        {
          id: "ignore",
          label: "Assume every word is a lie",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "t4",
        },
      ],
      consequences: {
        believe:
          "Look at his wrists. The knot fell open the moment your soldier pulled it. Somebody tied him to be found. A story that fits everything is not proof that it is true.",
        torture:
          "He tells you exactly what he was told to tell you, only louder. Now you can never catch him out on a detail.",
        ignore:
          "Then you learn nothing at all. Half of what he said can be checked against the ground. Throw it all away and you throw away the parts that would have caught him.",
      },
      hints: [
        "He wants something from you. The sand does not.",
        "In the model, switch to “check the ground” and see which claims survive.",
        "Take his statements one at a time. Ask what each one would have left behind.",
      ],
    },

    /* ---------------- ACT 2 — WEIGH IT, THEN EXPLAIN IT ---------------- */
    {
      id: "t5",
      act: 2,
      mood: "tense",
      beat: "Weigh it without opening it",
      simulation: "horse-hollow",
      simGuide: {
        shows:
          "The top bar is the horse’s weight at the fill you set. The bottom bar is what the tracks recorded.",
        move: "Drag the slider to change how much of the horse is solid oak, from hollow shell to solid.",
        watch:
          "The two bars meet near the middle. Solid oak is fourteen tonnes; the tracks say six — the gap is what sits inside.",
      },
      visual: {
        kind: "horse",
        title: "Six men high, on eight wheels",
        caption: "Oak planks, sealed with fresh tar. You cannot get inside it.",
        status: "standing on holy ground",
      },
      primer: {
        term: "The wheel tracks",
        plain:
          "how deep a wheel cuts into sand shows the weight above it. The gap from expected weight is what hides inside.",
        like: "a parcel far too heavy for its size.",
      },
      type: "choice",
      text: [
        "One claim of four stands up — the one you could see for yourself.",
        "You may not open the horse: it stands on the goddess’s ground, and no priest will let a blade near it. 🐴",
        "But it sits at the end of two deep wheel tracks. Play with the model.",
      ],
      prompt: "How do you find out what is inside it?",
      concept:
        "When you cannot look inside, measure something outside that depends on the inside.",
      probe: "Why is a measurement better than an argument here?",
      options: [
        {
          id: "ruts",
          label: "Measure the tracks and work out its weight",
          correct: true,
          outcome:
            "Six tonnes. Empty shell would be three, solid oak fourteen. Three tonnes is not wood — about forty men with weapons.",
          approach: "isolate_variable",
          next: "t6",
        },
        {
          id: "spear",
          label: "Throw spears at it until it answers",
          correct: false,
          approach: "brute_force",
          next: "t5",
        },
        {
          id: "widen",
          label: "Knock out the gate arch and bring it inside",
          correct: false,
          approach: "act_first",
          next: "t5",
        },
        {
          id: "priests",
          label: "Ask the priests",
          correct: false,
          approach: "follow_authority",
          next: "t5",
        },
      ],
      consequences: {
        spear:
          "A spear tells you a plank bent. You need a number, not a noise.",
        widen:
          "Think about what you are about to do. You would be carrying it inside yourself, and taking down your own gate arch to manage it.",
        priests:
          "The priests answer within the hour, and it is the answer Sinon planted three hours ago. Faith is not a measuring stick.",
      },
      hints: [
        "You cannot see inside. What did the inside leave a mark of?",
        "Something very heavy was dragged across wet sand. What should that look like?",
        "In the model, slide the fill down until the weight matches the tracks.",
      ],
    },
    {
      id: "t6",
      act: 2,
      mood: "insight",
      beat: "How the trick works",
      visual: {
        kind: "assembly",
        title: "The great hall",
        caption: "Forty men inside it. Now say how the rest is meant to go.",
        status: "council in session",
      },
      primer: {
        term: "A trap that needs you",
        plain:
          "the strongest kind: one step the enemy cannot do, so the plan only runs when the victim does it for them.",
        like: "a door that only unlocks from the inside.",
      },
      type: "reorder",
      trivia: {
        emoji: "💻",
        title: "The name never died",
        text: "Programmers still call a program hiding inside something you installed a Trojan horse. Same trick, thousands of years on.",
      },
      text: [
        "You carry the number into the hall: forty men, riding inside the horse.",
        "“Tell me how the trap runs,” Priam says.",
      ],
      prompt: "How is this trap meant to run?",
      instruction: "Put the five steps in order.",
      steps: [
        {
          id: "vanish",
          label: "The fleet sails behind the island",
        },
        {
          id: "sinon",
          label: "A man is left to explain the horse",
        },
        {
          id: "inside",
          label: "Troy drags the horse through its own gate",
        },
        {
          id: "opengate",
          label: "The forty climb out and lift the gate bar at night",
        },
        {
          id: "return",
          label: "The fleet rows back to a wide-open city",
        },
      ],
      wrong:
        "“Stop,” says Priam. “You have them lifting my gate bar before anybody has brought the thing inside.”",
      right:
        "“Every step needs the one before it,” Priam says. “The chain hangs on us opening the gate ourselves.”",
      concept:
        "Break the chain at the link the enemy cannot do for themselves.",
      probe: "Which step is the one they need *you* to perform?",
      hints: [
        "Start with the thing that happened before dawn, out at sea.",
        "Each step should be impossible until the one before it has happened.",
        "Hide, explain, invite, open, return.",
      ],
      next: "t7",
    },
    {
      id: "t7",
      act: 2,
      mood: "alarm",
      beat: "How far out",
      visual: {
        kind: "walls",
        title: "The archers are on the wall",
        caption: "Whatever comes out of it has to cross open ground to reach you.",
        status: "gate barred · bows strung",
      },
      type: "slider",
      text: [
        "Priam will not let you burn a gift to a goddess. 🏹",
        "The horse stays on the plain — you choose where. Forty men inside; fifteen can lift your gate bar.",
        "Every hundred paces of open ground costs six men. Holy ground ends at six hundred paces.",
      ],
      prompt: "How far from the wall do you leave it?",
      primer: {
        term: "Open ground",
        plain:
          "empty space an attacker must cross with nothing to hide. It buys you time and costs them men.",
        like: "a goal you must dribble the whole pitch to reach.",
      },
      concept:
        "Distance is a weapon: open ground turns a surprise attack into a march you can shoot at.",
      probe: "Why not simply the maximum?",
      slider: {
        label: "Distance from the wall",
        unit: " paces",
        min: 0,
        max: 650,
        step: 25,
        initial: 0,
      },
      readout: {
        label: "Raiders still standing at the gate",
        unit: " men",
        expr: "night_march",
        params: { fromInside: 40, perPace: -0.06 },
        decimals: 0,
      },
      driver: { label: "Enough to force the gate", value: 15, unit: " men" },
      risk: { mode: "ceiling", safeGap: 15 },
      meter: "gauge",
      target: { min: 425, max: 600 },
      bands: [
        {
          max: 200,
          text: "They climb out almost under the wall. Nearly thirty reach the gate.",
        },
        {
          max: 424,
          text: "Better. But sixteen still arrive, and fifteen is all they need.",
        },
        {
          max: 600,
          text: "Half a mile of open ground under a lit wall. “Ten at best,” Maia says. “Not enough.”",
        },
        {
          max: 650,
          text: "Past the edge stones — no longer holy ground. Citizens haul it to your gate by mid-morning.",
        },
      ],
      hints: [
        "Watch the readout against the fifteen-man line.",
        "More ground is better — right up until it stops being the goddess’s ground.",
        "Somewhere past four hundred paces, and inside six hundred, does both jobs.",
      ],
      next: "t8",
    },
    {
      id: "t8",
      act: 2,
      mood: "calm",
      beat: "Debrief",
      visual: {
        kind: "walls",
        title: "Dusk. Watchfires lit.",
        caption: "The horse is out on the plain and the gate is shut.",
        status: "third watch",
      },
      type: "reflect",
      text: [
        "The city is furious with you. Deiphobus has not spoken since noon.",
        "Maia sits down beside you. “Half the council still thinks Sinon told the truth,” she says.",
      ],
      prompt: "What would you have to see to change your mind about Sinon?",
      placeholder: "Two plain sentences will do.",
      next: "t10",
    },

    /* ---------------- ACT 3 — THE SECOND STORY ---------------- */
    {
      id: "t10",
      act: 3,
      mood: "tense",
      beat: "Where they are going",
      visual: {
        kind: "walls",
        title: "The horse is empty",
        caption: "One story is being shouted at you. One is written in the grass.",
        status: "40 men loose · fleet inbound",
      },
      type: "choice",
      trivia: {
        emoji: "🕳️",
        title: "The drain at Babylon",
        text: "Herodotus says Persians took Babylon by walking a drained riverbed under the wall. The drain was always the way in.",
      },
      text: [
        "After midnight, two planks in the horse’s belly have been pushed out. Empty. You were right. 🐴",
        "But they never came at you. Lit grass under sixty bows is not a walk they’d take. They went looking for another way in. 👣",
        "Footprints lead east to the highest wall, where there is no gate — only the drain that carries winter rain out. 🌧️",
        "Deiphobus is massing everyone behind the main gate. “They always come at the main.”",
      ],
      prompt: "Where do you put your men?",
      concept:
        "Defend where the evidence points, not where the confident voice points.",
      probe: "What made you back the tracks over the council?",
      options: [
        {
          id: "east",
          label: "Follow the tracks east to the drain",
          correct: true,
          outcome:
            "The prints stop at a drain mouth, wide enough for a man on his belly. The grate is freshly scratched — iron working from outside.",
          approach: "seek_pattern",          next: "t12",
        },
        {
          id: "main",
          label: "Mass everyone behind the main gate",
          correct: false,
          approach: "follow_authority",
          next: "t10",
        },
        {
          id: "split",
          label: "Split the four hundred around the wall",
          correct: false,
          approach: "change_many",
          next: "t10",
        },
        {
          id: "sally",
          label: "Ride out and hunt them",
          correct: false,
          approach: "act_first",
          next: "t10",
        },
      ],
      consequences: {
        main: "Four hundred men stand all night behind a gate nobody attacks. He is not lying to you. He is certain, which is worse.",
        split:
          "A hundred paces of wall for every ten men. Everywhere is covered and nowhere is defended.",
        sally:
          "In the dark, on their ground, chasing men you cannot see, with your gate open behind you. This is the mistake the whole trick was built to produce.",
      },
      hints: [
        "One side of this argument left marks in the ground. The other side is a voice.",
        "Ask what is actually east of here that forty men could use.",
        "Water gets out of a walled city somehow. So can people.",
      ],
    },
    {
      id: "t12",
      act: 3,
      mood: "resolve",
      beat: "The fleet turns",
      visual: {
        kind: "troy-dawn",
        title: "Sunrise over the plain",
        caption: "A thousand ships two miles out, and a gate that never opened.",
        status: "Troy holds",
      },
      type: "ending",
      text: [
        "You take them in the drain an hour before dawn, wet to the waist. 🌅",
        "The fleet arrives at sunrise and finds a barred gate and a manned wall. It stands off all morning, then turns north.",
        "Priam finds you above the gate. “Everybody was certain,” he says. “You were the only one counting.”",
        "“The ash was warm,” you tell him. “That was all. It had no reason to lie.”",
      ],
      outcome: "success",
    },
  ],
};
