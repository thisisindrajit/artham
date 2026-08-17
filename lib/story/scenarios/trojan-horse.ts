import type { Scenario } from "../types";

/**
 * The trap in this story is a *source*. Sinon's account is vivid, complete and
 * answers every question the city has — which is exactly what a prepared story
 * is built to do. The counter-move is not doubting everything. It is finding
 * something that wants nothing from you: warm ash, ship marks, the depth of a
 * rut.
 *
 * The spine is one continuous run from dawn to dawn, and every beat hands the
 * next one its starting condition:
 *
 *   t1  the beach is empty; the scout wants you to look at the fire pits
 *   t2  walk the camp instead of celebrating
 *   t3  warm ash, ship marks, two deep ruts — and a Greek found in a ditch
 *   t4  split his account into claims; only the claim you could already see holds
 *   t5  the ruts are a scale: six tonnes, so three tonnes of it is not wood
 *   t6  *now* the chain can be laid out, because you know men are inside
 *   t7  you may not burn it, so you place it — open ground is the weapon
 *   t8  say out loud why one man's word was not enough
 *   t9  they climb out at night — and refuse to cross the ground you gave them
 *   t10 the footprints go east; the confident voice says main gate
 *   t11 name the shape of the trick, in the order it was lived
 *   t12 the fleet returns to a barred gate
 *
 * Two ordering rules are load-bearing. The horse is weighed (t5) *before* the
 * learner is asked to lay out how the trap runs (t6) — stating a conclusion and
 * then going to find the evidence for it is the exact habit this story exists
 * to break. And act 3 is a *consequence* of the slider: the raiders walk east
 * because the learner left them too much open ground to cross.
 *
 * Numbers, fixed once and used everywhere: the ruts say six tonnes, an empty
 * shell would be three, solid oak would be fourteen. The extra three tonnes is
 * forty men. Fifteen men can lift the gate bar. Every hundred paces of open
 * ground costs the raiders six men.
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
    field: "History — how we know things",
    inOneLine:
      "A story that convinces you proves only one thing: somebody wanted you to believe it. Marks left in the world — warm ash, ship tracks, the depth of a rut — were not made to persuade anybody. That is why you check the story against them.",
    rule:
      "Ask of anything you are told: who gains if I believe this? Then find something that could not have been arranged for your benefit, and see whether the two agree. The parts of the story that survive that test are the parts you can build on.",
    elsewhere: [
      "A witness who is sure of the time, checked against the clock on a camera.",
      "An expenses claim checked against the card record, not the note explaining it.",
      "A company letter full of good news, checked against what it actually banked.",
      "An old tale written to flatter a king, checked against what diggers found in the ground.",
    ],
    youUsedIt: [
      "You walked the empty camp and read the ground before you read the man.",
      "You cut his account into four claims and held each one against the sand.",
      "You measured the ruts, and let the weight argue with everybody, including your own side.",
      "You used the same test twice — the second time on the story your own city believed.",
    ],
  },
  minutes: 13,
  stageLabel: "Main gate watch",
  partnerGreeting:
    "I'll walk the wall with you. You make the calls; I'll watch how you weigh what people tell you.",
  intro: {
    role: "captain of the gate watch",
    cta: "Take the wall",
    text: [
      "Troy, the tenth summer of the siege. You command the watch on the main gate.",
      "For ten years you have looked out at the same view. A thousand Greek ships on the beach, and the smoke of their cooking fires.",
      "This morning the beach is empty.",
      "The ships are gone. The camp is flat. And out where the enemy lines used to be, one thing is standing on the plain.",
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
      trivia: {
        emoji: "📜",
        title: "Homer skips the horse",
        text: "The Iliad stops before the horse is ever built. The full story of it was written down centuries later, by a Roman poet called Virgil.",
      },
      text: [
        "The city goes mad before the sun is properly up. People run for the walls. Somebody is already singing. 🎉",
        "The king's son takes the steps three at a time. “They have broken! Ten years, and they have broken!”",
        "Maia, your scout, is not singing. She is kneeling on the wall top with a counting stick, adding things up.",
        "“Come and look at the fire pits,” she says, without looking up. “They are still warm.” 🔥",
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
      trivia: {
        emoji: "⏳",
        title: "Ten years is nothing",
        text: "Herodotus wrote that one Egyptian king sat outside a single city for twenty-nine years before it fell. Waiting really was a weapon.",
      },
      text: [
        "Warm ash means somebody was here last night. Nobody in the square wants to hear it.",
        "The king's son wants the gates open and the whole city out on the plain before noon.",
        "Before you answer him, look at what all that waiting was actually doing for Troy.",
      ],
      prompt: "What do you do first?",
      concept:
        "A city behind a wall wins by waiting — so a trick must persuade it to come out.",
      probe: "Why that first?",
      options: [
        {
          id: "walk",
          label: "Walk the empty camp and read the ground",
          detail: "Ash, tracks, rubbish. Things nobody bothered to arrange.",
          correct: true,
          outcome:
            "You spend the morning in the empty camp with Maia, reading ash and tent-pole holes instead of songs. By noon you have a page of things the ground insists on, whatever anyone in the square says.",
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
        open: "Nine thousand people pour onto open ground with no order and no way back. Your gate stands wide behind them. If one enemy company is still out there, Troy ends this morning.",
        burn: "Maia catches your arm. “Burn it and we never learn what it was for. It is the only thing they left us that might tell us the truth.”",
        priam:
          "Priam is awake already, in the square, being told six different stories by six different men. He needs somebody who has walked the ground. That is you.",
      },
      hints: [
        "The camp is the one place nobody has been standing over, arranging things.",
        "Look at the model: how does Troy actually win a siege?",
        "If waiting wins, the trick has to be something that makes you stop waiting.",
      ],
    },
    {
      id: "t3",
      act: 1,
      mood: "alarm",
      beat: "Warm ash",
      visual: {
        kind: "shore",
        title: "Maia's tally",
        caption: "The ground has not been told what to say.",
        status: "fire pits still warm",
      },
      type: "narrative",
      trivia: {
        emoji: "⛏️",
        title: "Troy was real",
        text: "People thought Troy was made up until diggers found it under a hill in Turkey in the 1870s. At least nine cities sit stacked on that one spot.",
      },
      text: [
        "You walk the camp with Maia. She has counted every physical thing the Greeks left behind.",
        "“Fire pits still warm in the middle. That is last night, not last week.”",
        "“And look at the sand. Long grooves where ship bottoms sat. They run out to sea and back again. Ships were here this morning.” ⛵",
        "“Then these.” She points at two deep lines running from the shore inland. Something very heavy was dragged on wheels. The lines stop at the horse.",
        "Behind you, from a ditch, a man starts shouting in Greek. Two of your soldiers pull him out. He is filthy, tied at the wrists, and weeping with relief. 😭",
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
      trivia: {
        emoji: "🦷",
        title: "Gift horse, open mouth",
        text: "People once judged a horse's age by looking at its teeth. That is where the old rule comes from: never look a gift horse in the mouth.",
      },
      text: [
        "Sinon's story is perfect. The fleet has sailed for home. His own side left him behind to die, and he ran.",
        "The horse, he says, is a gift for the goddess. It was built too big for your gates on purpose, so Troy could never take it in and win her favour.",
        "It explains the empty beach, the horse, its size, and him. Half the council already believes his testimony.",
        "Hold each piece of what he says against the physical evidence you spent the morning reading.",
      ],
      prompt: "How do you handle what Sinon told you?",
      primer: [
        {
          term: "Physical evidence",
          plain:
            "Marks left behind by what really happened — ash, ruts, footprints. It has no reason to lie to you, because it was never trying to tell you anything.",
          like: "footprints in fresh snow. Nobody made them to convince you of something.",
        },
        {
          term: "Testimony",
          plain:
            "What a person tells you happened. It can be completely true. It can also be exactly what somebody prepared for you to hear.",
          like: "an answer to every question you had. That is either luck, or practice.",
        },
      ],
      concept:
        "One source who wants something from you is a claim, not evidence — check it against something that wants nothing.",
      probe: "What made you distrust the story that explained everything?",
      options: [
        {
          id: "check",
          label: "Test each claim against the camp and the sand",
          detail: "Warm ash and ship marks do not want anything from you.",
          correct: true,
          outcome:
            "Maia sets it out in two columns: what he says, what the ground shows. One claim of four survives — the horse really is too big for your gates, and anyone can see that. The rest fail. The fleet did not sail for home; the ash is warm and the ship marks come back.",
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
          "Look at his wrists. The knot fell open the moment your soldier pulled it. Somebody tied him to be found. A story that fits everything is not proof that it is true. It is proof that it was written.",
        torture:
          "He tells you exactly what he was told to tell you, only louder. Now you can never catch him out on a detail. You have broken the one thing you could have tested him against.",
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
      visual: {
        kind: "horse",
        title: "Six men high, on eight wheels",
        caption: "Oak planks, sealed with fresh tar. You cannot get inside it.",
        status: "standing on holy ground",
      },
      primer: {
        term: "The ruts",
        plain:
          "How deep a wheel track is cut tells you the weight that made it. Set that weight against what the thing ought to weigh, and the gap tells you what is hiding inside.",
        like: "a parcel far too heavy for its size. You know something is in there before you open it.",
      },
      type: "choice",
      trivia: {
        emoji: "🛞",
        title: "Ruts outlast cities",
        text: "Cart wheels wore grooves into the stone streets of Pompeii that you can still trip over today. Wheels keep writing down how heavy the load was.",
      },
      text: [
        "So one claim of four stands up, and it is the one you could see for yourself. That is not enough to open a gate for.",
        "The king's son has forty men on ropes and a plan. He wants to knock out the stone beam above the gate and widen the arch.",
        "You may not open the horse. It is a gift to a goddess, it stands on her ground, and no priest will let a blade near it. 🐴",
        "But it is standing at the end of two very deep ruts. Play with the model below.",
      ],
      prompt: "How do you find out what is inside it?",
      concept:
        "When you cannot look inside, measure something outside that depends on the inside.",
      probe: "Why is a measurement better than an argument here?",
      options: [
        {
          id: "ruts",
          label: "Measure the ruts it left and work out its weight",
          detail: "Solid oak this size would sink to the axles. These ruts are shallow.",
          correct: true,
          outcome:
            "You measure the ruts where it stood: depth, spacing, the way the sand is crushed. Six tonnes. An empty shell that size would be three. Solid oak would be fourteen. So three tonnes of it is not wood — and Maia says three tonnes is about forty men with their weapons.",
          approach: "isolate_variable",
          next: "t6",
        },
        {
          id: "spear",
          label: "Throw spears at it until it answers",
          detail: "It sounded hollow once. Do it harder.",
          correct: false,
          approach: "brute_force",
          next: "t5",
        },
        {
          id: "widen",
          label: "Knock out the stone beam and bring it in where we can open it",
          detail: "Get it inside, then we can take our time with it.",
          correct: false,
          approach: "act_first",
          next: "t5",
        },
        {
          id: "priests",
          label: "Ask the priests what the goddess intends",
          detail: "It is a holy object. Let the priests answer.",
          correct: false,
          approach: "follow_authority",
          next: "t5",
        },
      ],
      consequences: {
        spear:
          "A spear tells you a plank bent. Somebody already tried that this morning and the council decided he was a fool. You need a number, not a noise.",
        widen:
          "Think about what you are about to do. You would be carrying it inside yourself, and taking down your own gate arch to manage it.",
        priests:
          "The priests answer within the hour, and it is the answer Sinon planted three hours ago. Faith is not a measuring stick.",
      },
      hints: [
        "You cannot see inside. What did the inside leave a mark of?",
        "Something very heavy was dragged across wet sand. What should that look like?",
        "In the model, slide the fill down until the weight matches the ruts.",
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
          "the strongest kind. It has one step the enemy cannot do themselves. The plan only runs if the victim agrees to do that step for them.",
        like: "a door that can only be unlocked from the inside.",
      },
      type: "reorder",
      trivia: {
        emoji: "💻",
        title: "The name never died",
        text: "Computer people still call a program that hides inside something you chose to install a Trojan horse. Same trick, three thousand years later.",
      },
      text: [
        "You carry the number into the hall: six tonnes, and forty men of it.",
        "The room stops shouting. Priam turns to you.",
        "“Forty men in a box on my plain,” he says. “That is not a plan on its own. If this is a trap, tell me how it is supposed to work. In order.”",
      ],
      prompt: "How is this trap meant to run?",
      instruction: "Put the five steps in the order they are designed to happen.",
      steps: [
        {
          id: "vanish",
          label: "The fleet sails out of sight behind the island",
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
          label: "The forty climb out at night and lift the gate bar",
        },
        {
          id: "return",
          label: "The fleet rows back to a city standing wide open",
        },
      ],
      wrong:
        "“Stop,” says Priam. “You have them lifting my gate bar before anybody has brought the thing inside. Tell it to me as one step following another.”",
      right:
        "“Every step of that needs the one before it,” Priam says slowly. “And the whole chain hangs on us opening the gate ourselves.” The hall has gone very quiet.",
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
        "The council agrees on one thing only: the gate stays shut. But Priam will not let you burn a gift to a goddess.",
        "So the horse stays out on the plain, and you decide where on the plain it stands.",
        "Maia has done the sums. Forty men are in there. Fifteen is all it takes to lift your gate bar and hold the gatehouse.",
        "Every hundred paces of open ground they must cross costs them about six men, to the ditch, the dark and your archers. 🏹",
        "One limit: the goddess's ground ends at six hundred paces. Push it past that and the crowd will drag it in themselves.",
      ],
      prompt: "How far from the wall do you leave it?",
      primer: {
        term: "Open ground",
        plain:
          "empty space an attacker has to cross in the open, with nothing to hide behind. Distance is not just a gap. It is time for you and losses for them.",
        like: "a goal you have to dribble the whole length of the pitch to reach.",
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
          text: "They climb out almost under the wall. Nearly thirty reach the gate untouched. Your archers get one volley, and then it is hands on the bar.",
        },
        {
          max: 424,
          text: "Better. Your archers thin them badly on the run in. But about sixteen still arrive, and fifteen is all they need. Not enough.",
        },
        {
          max: 600,
          text: "Half a mile of open ground under a lit wall. Maia works it through twice and puts the stick down. “Ten of them, at best, and awake men waiting. They cannot do it.”",
        },
        {
          max: 650,
          text: "Past the edge stones. It is not the goddess's ground any more, it is anybody's. By mid-morning nine thousand delighted citizens have hauled it to your gate for you.",
        },
      ],
      hints: [
        "Watch the readout against the fifteen-man line.",
        "More ground is better — right up until it stops being the goddess's ground.",
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
        "By dusk the horse stands five hundred paces out, ringed by watchfires. Sixty archers face it from the wall.",
        "The city is furious with you. The king's son has not spoken to you since noon.",
        "Maia sits down beside you on the stone. “Half the council still thinks Sinon told the truth. Say it plainly. Why didn't we believe him?”",
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
      trivia: {
        emoji: "🔦",
        title: "Fire carried the news",
        text: "A Greek play has the news of Troy's fall crossing the whole sea in one night, passed from hilltop to hilltop by watch fires. Light was the fastest post there was.",
      },
      text: [
        "At the third watch a runner comes up the steps too fast and nearly goes over the edge.",
        "“Captain — the horse is open.”",
        "Two planks in the belly have been pushed out from the inside. A rope ladder hangs down into the grass. The horse is empty.",
        "So you were right. Forty men were riding in it, and tonight they climbed out.",
        "But they did not come at you. Five hundred paces of lit grass with sixty bows above it is not a thing forty men walk across.",
        "You made that crossing too expensive, so they never tried it. Maia's torch finds their footprints in the grass instead. 👣",
        "The prints do not lead to your gate. They lead east, along the wall. And out on the island, a signal fire is burning. The fleet is coming back tonight.",
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
      trivia: {
        emoji: "🕳️",
        title: "Walls have back doors",
        text: "Herodotus says Persian soldiers took Babylon by walking in along the bed of a river they had drained. The strong wall was never the way in.",
      },
      text: [
        "The king's son is already forming every man in the city up behind the main gate. “They will come at the main gate. They always come at the main gate.”",
        "But the footprints in the grass go east. East of here the wall is highest and there is no gate at all.",
        "There is only the drain tunnel that carries the winter rain out under the stone. 🌧️",
        "You have four hundred men and one night. This is the same test as this morning, in the dark.",
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
            "The prints run east along the wall and stop at a drain mouth, just wide enough for a man on his belly. The stone around the grate is freshly scratched, where iron has been working at it from the outside.",
          approach: "seek_pattern",
          next: "t11",
        },
        {
          id: "main",
          label: "Mass everyone behind the main gate",
          detail: "He has fought them for ten years. Trust him.",
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
          label: "Ride out and hunt them on the plain",
          detail: "Catch them in the open before they reach anything.",
          correct: false,
          approach: "act_first",
          next: "t10",
        },
      ],
      consequences: {
        main: "Four hundred men stand all night behind a gate nobody attacks. Forty Greeks work at a grating on the far side of the city. He is not lying to you. He is certain, which is worse.",
        split:
          "A hundred paces of wall for every ten men. Everywhere is covered and nowhere is defended. Forty men in one place will go straight through any of it.",
        sally:
          "In the dark, on their ground, chasing men you cannot see, with your gate open behind you. This is the mistake the whole trick was built to produce. You would just be making it a day late.",
      },
      hints: [
        "One side of this argument left marks in the ground. The other side is a voice.",
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
        title: "Dawn in the great hall",
        caption: "Priam wants the whole thing, start to finish, in order.",
        status: "40 taken at the drain tunnel",
      },
      primer: {
        term: "A voice you did not choose",
        plain:
          "a source that arrives already prepared, answering the questions you were about to ask. Sinon was not found by accident. He was left there for you.",
        like: "a glowing review written by the person selling the thing.",
      },
      type: "reorder",
      text: [
        "You take them in the drain tunnel an hour before dawn. They are wet to the waist and packed into a stone pipe four feet high. It is over almost before it starts.",
        "In the morning Priam calls the hall together. Sinon is in chains and has stopped weeping.",
        "“From the beginning,” the king says. “So the next captain knows how it was done.”",
      ],
      prompt: "How did the trick actually work?",
      instruction: "Put the four steps in the order they happened.",
      steps: [
        {
          id: "gift",
          label: "They gave us something we wanted to believe in",
          detail: "An empty beach and a gift, on the tenth summer.",
        },
        {
          id: "voice",
          label: "They left a voice behind to explain it for them",
        },
        {
          id: "ourselves",
          label: "They needed us to do the dangerous part ourselves",
          detail: "Open a gate, take down an arch, line up in the wrong place.",
        },
        {
          id: "ground",
          label: "The ground kept telling the truth the whole time",
          detail: "Warm ash, ship marks, shallow ruts, footprints going east.",
        },
      ],
      wrong:
        "“No,” says Priam. “You have us reading the ground before they had given us anything to be wrong about. Put it in the order a man would live through it.”",
      right:
        "“A gift, a voice, and a job for us to do,” Priam says. “And under all three, the ground — which never once changed its story.”",
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
        "The fleet arrives at sunrise, exactly on time. It finds a city with its gate barred and its walls manned. 🌅",
        "Forty of its best men are sitting in a courtyard inside Troy with their sandals off.",
        "The ships stand offshore most of the morning. Then they come about and go north, and the plain is quiet.",
        "Maia scratches a last mark on her counting stick and throws it off the wall.",
        "Priam finds you above the gate. “Everybody in that hall was certain,” he says. “You were the only one counting.”",
        "“The ash was warm,” you tell him. “That was all. The ash was warm, and it had no reason to lie to me.”",
        "Below you, someone is already arguing about what to do with a six-tonne wooden horse.",
      ],
      outcome: "success",
    },
  ],
};
