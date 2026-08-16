import type { Scenario } from "../types";

/**
 * The trap here is a *source*. Sinon's account is vivid, complete, and answers
 * every question the city has — which is exactly what a prepared story is for.
 * The counter-move is not scepticism in general; it is finding something that
 * has no motive: ruts in sand, the warmth of a fire pit, the weight of oak.
 *
 * Act 3 turns the win into the next problem. Keeping the horse out defeats the
 * plan the city was told about. The men still get out. Now the same skill has
 * to be used against a second story — the one your own side is telling itself
 * about where the attack must come from.
 */
export const trojanHorse: Scenario = {
  id: "trojan-horse",
  title: "Hold the Gate",
  tagline: "The Greeks are gone. They left a gift. You are the one who says yes or no.",
  domain: "history",
  difficulty: "easy",
  learningGoal:
    "Learn to test a convincing story against evidence that has no reason to lie.",
  takeaway: {
    concept: "Testing a story against evidence",
    field: "History \u2014 how we know things",
    inOneLine:
      "A convincing account is not evidence of anything except that somebody wanted to convince you. Physical traces \u2014 ruts in sand, a warm fire pit, the weight of oak \u2014 have no motive, no audience and no reason to flatter you, so they are what you check a story against.",
    rule:
      "Ask of every source: who benefits if I believe this? Then find something that could not have been arranged for your benefit, and see whether the two agree. The parts of a story that survive that test are the parts you can build on.",
    elsewhere: [
      "A witness statement checked against CCTV timestamps.",
      "An expenses claim checked against the card record rather than the memo explaining it.",
      "A company\u2019s upbeat annual letter checked against its cash flow statement.",
      "An ancient chronicle written for a king, checked against what the excavation actually found in the ground.",
    ],
    youUsedIt: [
      "You walked the abandoned camp and read the ground before you read the man.",
      "You split Sinon\u2019s account into claims and tested each one against the sand.",
      "You measured the ruts and let the weight contradict everyone, including your own side.",
      "You applied the same test twice \u2014 the second time to the story Troy was telling itself.",
    ],
  },
  minutes: 13,
  stageLabel: "Scaean gate watch",
  partnerGreeting:
    "I'll walk the wall with you. You make the calls; I'll watch how you weigh what people tell you.",
  intro: {
    role: "captain of the gate watch",
    cta: "Take the wall",
    text: [
      "Troy, the tenth summer of the siege. You command the watch on the Scaean gate.",
      "For ten years you have looked out at the same thing: a thousand Greek ships drawn up on the beach, and the smoke of their cook-fires.",
      "This morning the beach is empty.",
      "The ships are gone. The camp is flat. And where the Greek lines used to be, there is one thing standing on the plain.",
      "A wooden horse the height of six men, on wheels, facing your gate.",
    ],
    visual: {
      kind: "shore",
      title: "Dawn, the tenth year",
      caption: "A thousand ships were here yesterday.",
      status: "beach empty",
    },
  },
  preSession: {
    prompt: "Something looks like very good news. What is your instinct?",
    options: [
      {
        id: "measure",
        label: "Go and check the ground myself",
        approach: "measure_first",
      },
      {
        id: "act",
        label: "Move fast while the chance is open",
        approach: "act_first",
      },
      {
        id: "pattern",
        label: "Ask what would have to be true for this to be real",
        approach: "seek_pattern",
      },
      {
        id: "king",
        label: "Take it to the king and do what he decides",
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
        "The city goes mad before the sun is properly up. People are running for the walls. Somebody is already singing.",
        "Deiphobus, the king's son, takes the steps three at a time. “They've broken! Ten years and they've broken!”",
        "Kalliope, your scout, is not celebrating. She is on her knees at the top of the rampart with a tally stick, counting things.",
        "“Captain,” she says without looking up. “Come and look at the fire pits.”",
      ],
      next: "t2",
    },
    {
      id: "t2",
      act: 1,
      mood: "tense",
      beat: "First move",
      simulation: "siege-clock",
      visual: {
        kind: "walls",
        title: "Everyone wants the gate open",
        caption: "Ten years of waiting, and one morning to throw it away.",
        status: "gate still barred",
      },
      type: "choice",
      text: [
        "Deiphobus wants the gates open and the whole city out on the plain before noon.",
        "Before you answer him, look at what waiting was actually doing for Troy.",
      ],
      prompt: "What do you do first?",
      concept:
        "A city behind a wall wins by waiting — so a trick must persuade it to come out.",
      probe: "Why that first?",
      options: [
        {
          id: "walk",
          label: "Walk the abandoned camp and read the ground",
          detail: "Fire pits, tracks, rubbish. Things nobody bothered to arrange.",
          correct: true,
          outcome:
            "You spend the morning in the empty camp with Selene, reading ash and postholes instead of poems. By noon you have a page of things the ground insists on, whatever anyone says happened here.",
          approach: "measure_first",
          next: "t3",
        },
        {
          id: "open",
          label: "Open the gates and let the city out",
          detail: "Ten years. Let them have this.",
          correct: false,
          approach: "act_first",
          next: "t2",
        },
        {
          id: "burn",
          label: "Burn the horse from the wall with fire arrows",
          detail: "Whatever it is, unmake it.",
          correct: false,
          approach: "brute_force",
          next: "t2",
        },
        {
          id: "priam",
          label: "Wake King Priam and wait for his word",
          detail: "This is above a gate captain.",
          correct: false,
          approach: "follow_authority",
          next: "t2",
        },
      ],
      consequences: {
        open: "Nine thousand people pour onto open ground with no order and no line of retreat, and your gate stands wide behind them. If a single Greek company is still on that plain, Troy ends this morning.",
        burn: "Kalliope catches your arm. “Burn it and we never learn what it was for. Right now it is the only thing they left us that might tell us the truth.”",
        priam:
          "Priam is awake and already in the square, being told six different stories by six different men. He needs somebody who has actually walked the ground. That is you.",
      },
      hints: [
        "The camp is the one place nobody has been standing over arranging things.",
        "Look at the model: how does Troy actually win a siege?",
        "If waiting wins, then the trick has to be something that makes you stop waiting.",
      ],
    },
    {
      id: "t3",
      act: 1,
      mood: "alarm",
      beat: "Warm ash",
      visual: {
        kind: "shore",
        title: "Kalliope's tally",
        caption: "The ground has not been told what to say.",
        status: "fire pits still warm",
      },
      type: "narrative",
      text: [
        "You walk the camp with Kalliope. She has counted everything — every physical thing the Greeks left behind them.",
        "“Fire pits still warm at the centre. That is last night, not last week.”",
        "“Keel marks in the sand run out and back. Ships were beached here this morning and pulled off again.”",
        "“And these.” She points at two deep parallel grooves running from the shore inland — the tracks of something enormously heavy, dragged on wheels. They stop at the horse.",
        "Behind you, from a ditch, somebody starts shouting in Greek. Two of your men drag him out. He is filthy, bound at the wrists, and weeping with relief.",
        "He says his name is Sinon.",
      ],
      next: "t4",
    },
    {
      id: "t4",
      act: 1,
      mood: "tense",
      beat: "The man in the ditch",
      simulation: "story-check",
      visual: {
        kind: "interview",
        title: "Sinon talks",
        caption: "He answers every question. He answers them beautifully.",
        status: "one source, no witnesses",
      },
      type: "choice",
      text: [
        "Sinon's story is perfect. The fleet has sailed for home. They left him to be sacrificed and he escaped. The horse is an offering to Athena, built deliberately too big to fit through your gates, so that Troy could never take it in and claim the goddess's favour.",
        "It explains the empty beach, the horse, its size, and why he is here. Half the council is already convinced.",
        "Hold each piece of his testimony against the physical evidence on the ground before you answer.",
      ],
      prompt: "How do you handle what Sinon told you?",
      primer: [
        {
          term: "Physical evidence",
          plain:
            "Marks left behind by what actually happened — ash, ruts, footprints. It has no reason to lie to you, because it was never trying to tell you anything.",
          like: "footprints in fresh snow. Nobody made them to convince you of something.",
        },
        {
          term: "Testimony",
          plain:
            "What a person tells you happened. It can be perfectly true — and it can also be exactly what somebody prepared for you to hear.",
          like: "an account that answers every single question you had. That is either luck, or rehearsal.",
        },
      ],
      concept:
        "A single source with a motive is a claim, not evidence — check it against something with no motive.",
      probe: "What made you distrust the story that explained everything?",
      options: [
        {
          id: "check",
          label: "Test each claim against the camp and the sand",
          detail: "Warm ash and keel marks do not want anything from you.",
          correct: true,
          outcome:
            "Selene sets it up as two columns — what the singers say, what the sand shows. Half the claims survive contact with the second column. Half do not, and one of them is the part everybody knows.",
          approach: "measure_first",
          next: "t5",
        },
        {
          id: "believe",
          label: "Believe him — nobody lies that well while weeping",
          detail: "The grief is real. So is the story.",
          correct: false,
          approach: "follow_authority",
          next: "t4",
        },
        {
          id: "torture",
          label: "Beat the truth out of him",
          detail: "Pain is faster than checking.",
          correct: false,
          approach: "brute_force",
          next: "t4",
        },
        {
          id: "ignore",
          label: "Assume every word is a lie and stop listening",
          detail: "He is Greek. That is all we need.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "t4",
        },
      ],
      consequences: {
        believe:
          "Look at his wrists. The knot came loose the moment your man pulled it. Somebody tied him to be found, and the tears cost him nothing. A story that fits everything is not proof that it is true — it is proof that it was written.",
        torture:
          "He tells you exactly what he was told to tell you, only louder, and now you have no way to catch him out on a detail. You have destroyed the one thing you could have tested him against.",
        ignore:
          "Then you learn nothing at all. Half of what he said is checkable — the size of the horse, the empty beach. Throw it all away and you throw away the parts that would have caught him.",
      },
      hints: [
        "He wants something from you. The sand does not.",
        "In the model, switch to “check the ground” and see which claims survive.",
        "Take his statements one at a time and ask what each one would leave behind if it were true.",
      ],
    },

    /* ---------------- ACT 2 — WEIGH IT ---------------- */
    {
      id: "t5",
      act: 2,
      mood: "insight",
      beat: "How the trick works",
      visual: {
        kind: "assembly",
        title: "Cassandra is shouting again",
        caption: "Nobody listens to her. Say it in order and they might listen to you.",
        status: "council in session",
      },
      primer: {
        term: "A trap that needs you",
        plain:
          "the strongest kind. It has one step the enemy cannot perform themselves, so the plan only runs if the victim volunteers for that step.",
        like: "a door that can only be unlocked from the inside.",
      },
      type: "reorder",
      text: [
        "In the assembly, Cassandra is screaming that the horse is death and being led away by her own family.",
        "Laocoön throws his spear at the horse's flank. It booms like an empty jar. Everybody looks away, embarrassed for him.",
        "Priam turns to you. “Enough shouting. If this is a trap, tell me how it is supposed to work. In order.”",
      ],
      prompt: "How is this trap meant to run?",
      instruction: "Put the five steps in the order they are designed to happen.",
      steps: [
        {
          id: "vanish",
          label: "The fleet sails out of sight behind Tenedos",
          detail: "Not home. Just over the horizon.",
        },
        {
          id: "sinon",
          label: "A man is left behind to explain the horse",
        },
        {
          id: "inside",
          label: "Troy drags the horse through its own gate",
        },
        {
          id: "opengate",
          label: "Men hidden inside climb out at night and unbar the gate",
        },
        {
          id: "return",
          label: "The fleet rows back to a city standing wide open",
        },
      ],
      wrong:
        "“Stop,” says Priam. “You have them unbarring my gate before anybody has brought the thing inside. Tell it to me as one sentence following another.”",
      right:
        "“Every step of that needs the one before it,” Priam says slowly. “And the whole chain hangs on us opening the gate ourselves.” The hall has gone very quiet.",
      concept:
        "Break the chain at the link the enemy cannot do for themselves.",
      probe: "Which step is the one they need *you* to perform?",
      hints: [
        "Start with the thing that happened before dawn, out at sea.",
        "Each step should be impossible until the one before it has happened.",
        "Hide → explain → invite → open → return.",
      ],
      next: "t6",
    },
    {
      id: "t6",
      act: 2,
      mood: "tense",
      beat: "Weigh it without opening it",
      simulation: "horse-hollow",
      visual: {
        kind: "horse",
        title: "Six men high, on eight wheels",
        caption: "Oak planks, sealed with fresh pitch. You cannot get inside it.",
        status: "sacred ground",
      },
      primer: {
        term: "Sacred ground",
        plain:
          "land dedicated to a god. Nothing standing on it may be cut, opened or damaged \u2014 which is exactly why the Greeks chose to leave the horse there.",
        like: "a parcel left on a police station step, where nobody dares touch it.",
      },
      type: "choice",
      text: [
        "Deiphobus has forty men on ropes and a plan to widen the gate arch by knocking out the stone beam above it.",
        "You cannot open the horse — it is an offering, it stands on sacred ground, and the priests will not allow a blade near it.",
        "But it is standing at the end of two very deep ruts. Play with the model.",
      ],
      prompt: "How do you find out what is inside it?",
      concept:
        "When you cannot look inside, measure something on the outside that depends on the inside.",
      probe: "Why is a measurement better than an argument here?",
      options: [
        {
          id: "ruts",
          label: "Measure the ruts it left and work out its weight",
          detail: "Solid oak this size would sink to the axles. These ruts are shallow.",
          correct: true,
          outcome:
            "You measure the ruts where the thing stood: depth, spacing, the crush pattern in the sand. The weight that falls out of the numbers is far too heavy for a hollow wooden animal, and far too light for a siege tower full of men.",
          approach: "isolate_variable",
          next: "t7",
        },
        {
          id: "spear",
          label: "Throw more spears at it like Laocoön",
          detail: "It sounded hollow once. Do it harder.",
          correct: false,
          approach: "brute_force",
          next: "t6",
        },
        {
          id: "widen",
          label: "Knock out the stone beam and bring it in where we can open it",
          detail: "Get it inside, then we can take our time with it.",
          correct: false,
          approach: "act_first",
          next: "t6",
        },
        {
          id: "priests",
          label: "Ask the priests what the goddess intends",
          detail: "It is a religious object. Let religion answer.",
          correct: false,
          approach: "follow_authority",
          next: "t6",
        },
      ],
      consequences: {
        spear:
          "A spear tells you a plank flexed. Laocoön already did that and the whole council decided he was a fool with bad manners. You need a number, not a noise.",
        widen:
          "You have just performed the one step in the chain that the Greeks cannot do for themselves — and you have taken down your own gate arch to do it.",
        priests:
          "The priests give you an answer within the hour, and it is the answer Sinon planted three hours ago. Faith is not a measuring instrument.",
      },
      hints: [
        "You cannot see inside. What did the inside leave a mark of?",
        "Something enormously heavy was dragged across wet sand. What should that look like?",
        "In the model, slide the fill down until the weight matches the ruts.",
      ],
    },
    {
      id: "t7",
      act: 2,
      mood: "alarm",
      beat: "How far out",
      visual: {
        kind: "walls",
        title: "The archers are on the rampart",
        caption: "Whatever comes out of it has to cross open ground to reach you.",
        status: "gate barred · bows strung",
      },
      type: "slider",
      text: [
        "The ruts say four tonnes. Solid oak that size would be fourteen. Two thirds of that horse is air — or men.",
        "Priam will not let you burn a thing dedicated to Athena. So it stays where it stands, and you decide where that is.",
        "Kalliope has done the arithmetic. If eighty-two men are in there, every pace of open ground between the horse and the wall costs them men under your archers. It takes about thirty to force the Scaean gate.",
        "One limit: the holy ground ends at six hundred paces. Push it past that and the crowd will drag it in themselves before noon.",
      ],
      prompt: "How far from the wall do you leave it?",
      primer: {
        term: "The ruts",
        plain:
          "How deep a track is cut tells you the weight that made it. Set that weight against what the thing ought to weigh, and the gap tells you what is not inside it.",
        like: "picking up a parcel far too light for its size. You know it is mostly air before you open it.",
      },
      concept:
        "Distance is a weapon: open ground turns an ambush into a march you can shoot at.",
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
        params: { fromInside: 82, perPace: -0.12 },
        decimals: 0,
      },
      driver: { label: "Enough to force the gate", value: 30, unit: " men" },
      risk: { mode: "ceiling", safeGap: 30 },
      meter: "gauge",
      target: { min: 450, max: 600 },
      bands: [
        {
          max: 200,
          text: "They step out of the belly almost under the wall. Eighty men reach the gate untouched. Your archers get one volley and then it is hands on the bar.",
        },
        {
          max: 425,
          text: "Closer. Your archers thin them badly on the run in — and enough still arrive to hold the gatehouse until the fleet lands. Not enough.",
        },
        {
          max: 600,
          text: "Half a mile of open ground under a lit wall. Kalliope works it through twice and puts the stick down. “They cannot get there in numbers. Not in the dark, not with us awake.”",
        },
        {
          max: 650,
          text: "Past the boundary stones. It is no longer Athena's ground, it is anybody's — and by mid-morning nine thousand delighted citizens have hauled it to the gate for you.",
        },
      ],
      hints: [
        "Watch the readout against the thirty-man line.",
        "More ground is better — until it stops being sacred ground.",
        "Somewhere between four hundred and fifty and six hundred paces does both jobs.",
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
        "By dusk the horse stands five hundred paces out, ringed by watchfires, with sixty archers on the rampart facing it.",
        "The city is furious with you. Deiphobus has not spoken to you since noon. Cassandra brought you bread, which was unsettling.",
        "Kalliope sits down beside you on the parapet. “Half the council still thinks Sinon was telling the truth. Say it plainly — why didn't we believe him?”",
      ],
      prompt: "Why wasn't Sinon's story enough?",
      placeholder: "Two plain sentences will do.",
      next: "t9",
    },

    /* ---------------- ACT 3 — THE SECOND STORY ---------------- */
    {
      id: "t9",
      act: 3,
      mood: "alarm",
      beat: "Empty",
      visual: {
        kind: "horse",
        title: "Third watch — the seams are open",
        caption: "A rope ladder hangs from the horse's belly. Nobody is inside.",
        status: "empty · tracks lead east",
      },
      type: "narrative",
      text: [
        "At the third watch a runner comes up the steps too fast and nearly goes over the parapet.",
        "“Captain — the horse is open.”",
        "Two planks in the belly have been unpinned from inside. A rope ladder hangs down into the grass. The horse is empty.",
        "They did not need to be dragged through the gate. They only needed to be delivered close enough to walk. The plan you broke was one half of a plan.",
        "Out on Tenedos, a signal fire is burning. The fleet is coming back tonight.",
        "And in the grass, Kalliope's torch finds footprints. Many of them. They do not lead to your gate. They lead east, along the wall.",
      ],
      next: "t10",
    },
    {
      id: "t10",
      act: 3,
      mood: "tense",
      beat: "Where they are going",
      visual: {
        kind: "walls",
        title: "Two stories again",
        caption: "One is being shouted at you. One is written in the grass.",
        status: "40 men loose · fleet inbound",
      },
      type: "choice",
      text: [
        "Deiphobus is already forming every man in the city up behind the Scaean gate. “They'll come at the main gate. They always come at the main gate.”",
        "The tracks in the grass go east. East of here the wall is highest and there is no gate at all — only the drain tunnel that carries the winter rain out under the stone.",
        "You have four hundred men and one night.",
      ],
      prompt: "Where do you put your men?",
      concept:
        "Defend where the evidence points, not where the confident voice points.",
      probe: "What made you back the tracks over the council?",
      options: [
        {
          id: "east",
          label: "Follow the tracks east to the drain tunnel",
          detail: "Forty sets of feet went that way. That is not an opinion.",
          correct: true,
          outcome:
            "The tracks run east along the wall and stop at a drain mouth wide enough for a man on his belly. The stone around the grate is scored where iron worked at it, from the outside.",
          approach: "seek_pattern",
          next: "t11",
        },
        {
          id: "main",
          label: "Mass everyone behind the main gate",
          detail: "Deiphobus has fought them for ten years. Trust him.",
          correct: false,
          approach: "follow_authority",
          next: "t10",
        },
        {
          id: "split",
          label: "Split the four hundred evenly around the whole wall",
          detail: "Cover everything. Miss nothing.",
          correct: false,
          approach: "change_many",
          next: "t10",
        },
        {
          id: "sally",
          label: "Sally out and hunt them on the plain",
          detail: "Catch them in the open before they reach anything.",
          correct: false,
          approach: "act_first",
          next: "t10",
        },
      ],
      consequences: {
        main: "Four hundred men stand all night behind a gate nobody attacks, while forty Greeks work at a grating on the far side of the city in the dark. He is not lying to you. He is certain, which is worse.",
        split:
          "A hundred paces of wall per ten men. Everywhere is covered and nowhere is defended; forty men in one place will go through any of it.",
        sally:
          "In the dark, on their ground, chasing men you cannot see, with the gate open behind you. This is the mistake the whole trick was built to produce — you are just making it a day late.",
      },
      hints: [
        "One side of this argument left physical marks. The other side is a voice.",
        "Ask what is actually east of here that forty men could use.",
        "Water gets out of a walled city somehow. So can people.",
      ],
    },
    {
      id: "t11",
      act: 3,
      mood: "insight",
      beat: "What actually happened",
      visual: {
        kind: "assembly",
        title: "Dawn assembly",
        caption: "Priam wants the whole thing, start to finish, in order.",
        status: "40 taken at the drain tunnel",
      },
      primer: {
        term: "A voice you did not choose",
        plain:
          "a source that arrives already prepared, answering the questions you were about to ask. Sinon was not found. He was left.",
        like: "a glowing review written by the person selling the thing.",
      },
      type: "reorder",
      text: [
        "You take them in the drain tunnel an hour before dawn, wet to the waist and packed into a stone tunnel four feet high, and it is over almost before it starts.",
        "In the morning Priam calls the assembly. Deiphobus will not look at you. Sinon is in chains and has stopped weeping.",
        "“From the beginning,” the king says. “So the next captain knows how it was done.”",
      ],
      prompt: "How did the trick actually work?",
      instruction: "Put the four steps in the order they happened.",
      steps: [
        {
          id: "gift",
          label: "They gave us something we wanted to believe in",
          detail: "An empty beach and a gift on the last morning.",
        },
        {
          id: "voice",
          label: "They left a voice behind to explain it for them",
        },
        {
          id: "ourselves",
          label: "They needed us to do the dangerous part ourselves",
          detail: "Open a gate, take down an arch, form up in the wrong place.",
        },
        {
          id: "ground",
          label: "The ground kept telling the truth the whole time",
          detail: "Warm ash, keel marks, shallow ruts, footprints going east.",
        },
      ],
      wrong:
        "“No,” says Priam. “You have us reading the ground before they had given us anything to be wrong about. Put it in the order a man would live through it.”",
      right:
        "“A gift, a voice, and a job for us to do,” Priam says. “And underneath all three, the ground — which never once changed its story.”",
      concept:
        "Persuasion arrives first and loudest; evidence sits there the whole time.",
      probe: "Which of those four is the one you can always go back to?",
      hints: [
        "Begin with what arrived on the beach that first morning.",
        "The voice cannot work until there is something for it to explain.",
        "Gift, then voice, then the part they needed us to do — and the ground under all of it.",
      ],
      next: "t12",
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
        "The fleet arrives at sunrise, exactly as planned, and finds a city with its gate barred, its walls manned, and forty of its best men sitting in a Trojan courtyard with their sandals off.",
        "They stand offshore for most of the morning. Then the ships come about and go north, and the plain is quiet.",
        "Kalliope scratches a last mark on her tally stick and throws it off the wall.",
        "Priam finds you on the rampart. “Everybody in that hall was certain,” he says. “You were the only one counting.”",
        "“The ash was warm,” you tell him. “That was all. The ash was warm, and it had no reason to lie to me.”",
        "Below, someone is already arguing about what to do with a four-tonne wooden horse.",
      ],
      outcome: "success",
    },
  ],
};
