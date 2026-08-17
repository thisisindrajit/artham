import type { Scenario } from "../types";

/**
 * The story is one night in one control room. Each beat picks up the last
 * physical change: the curve appears, the loop is named, the pump is stopped,
 * the cold liquid is measured, then the saved batch becomes the next risk.
 *
 * The chemistry idea stays simple throughout. A reaction that makes heat can
 * speed itself up. Waiting makes the safe window shrink by half every 10°C.
 * The learner wins by cutting heat at its source, then by adding only enough
 * cold liquid to stop the loop without overflowing the pot.
 */
export const runawayReactor: Scenario = {
  id: "runaway-reactor",
  title: "Stop the Runaway",
  tagline: "2 a.m. Reactor 4 is heating itself, and cooling is already maxed.",
  domain: "chemistry",
  difficulty: "hard",
  learningGoal:
    "Learn why some reactions heat themselves faster and faster, and why waiting makes them harder to stop.",
  takeaway: {
    concept: "Runaway reaction",
    field: "Chemistry — reaction speed",
    inOneLine:
      "Some reactions make heat. Heat makes them go faster. Faster reactions make still more heat. That loop can outrun full cooling.",
    rule:
      "When heat and speed feed each other, do not wait. Stop the heat source, or spread the chemicals out before the window shuts.",
    elsewhere: [
      "A laptop battery can heat itself once the inside reaction starts racing.",
      "A damp haystack can warm from the inside until it begins to smoke.",
      "A bank run works the same way. Fear causes withdrawals, and withdrawals cause more fear.",
      "A rumour can grow this way too. Each retelling gives it more fuel.",
    ],
    youUsedIt: [
      "You checked the curve before acting, so you saw that each five minutes was worse.",
      "You named the loop: hotter means faster, and faster means hotter.",
      "You shut the adding pump before asking for more cooling.",
      "You added enough cold solvent to stop the loop, but not enough to overflow the pot.",
    ],
  },
  minutes: 12,
  stageLabel: "Reactor 4 live",
  partnerGreeting:
    "I’ll stay on the headset. You run the night room. I’ll watch how you think under a clock.",
  intro: {
    role: "night shift engineer",
    cta: "Take the control room",
    text: [
      "It is 02:14 at the plant. You are the only engineer on site.",
      "Marta waves you to the control desk before you take off your coat.",
      "The steel pot should sit near 70°C. It is at 96°C, with cooling water on full.",
      "“It is not coming down,” she says. “It is going the other way.”",
    ],
    visual: {
      kind: "reactor",
      title: "Reactor 4, 02:14",
      caption: "Full cooling. Rising anyway.",
      status: "96°C and climbing",
    },
  },
  preSession: {
    prompt: "A machine is doing something it should not. What is your instinct?",
    options: [
      {
        id: "numbers",
        label: "Find out how fast it is getting worse",
        approach: "measure_first",
      },
      {
        id: "guess",
        label: "Guess the cause, then check it",
        approach: "commit_to_hypothesis",
      },
      {
        id: "different",
        label: "Ask what changed since last time",
        approach: "seek_pattern",
      },
      {
        id: "safe",
        label: "Make it safe first, understand it later",
        approach: "act_first",
      },
    ],
  },
  startScene: "k1",
  scenes: [
    /* ---------------- ACT 1 — DIAGNOSE ---------------- */
    {
      id: "k1",
      act: 1,
      mood: "night",
      beat: "Night shift",
      visual: {
        kind: "reactor",
        title: "02:14",
        caption: "The mixer is running. Everything looks normal except one number.",
        status: "cooling at 100%",
      },
      type: "narrative",
      text: [
        "The control room hums. Through the window, the steel pot looks calm.",
        "Inside it, two chemicals are joining together. That reaction gives off heat 🔥.",
        "A cooling shell carries heat away. Tonight the shell is losing.",
        "“Cooling has been full since 02:00,” Marta says. “It was 82°C then.”",
        "Devon, the shift lead, is already pulling on his boots.",
      ],
      next: "k2",
    },
    {
      id: "k2",
      act: 1,
      mood: "tense",
      beat: "First move",
      visual: {
        kind: "reactor",
        title: "Three people, three ideas",
        caption: "Everyone wants action. Nobody has looked at the curve.",
        status: "97°C",
      },
      type: "choice",
      text: [
        "The number reaches 97°C while Devon points at the vent switch ⚠️.",
        "Marta reaches for the phone. A worker asks for a cold hose.",
        "Before choosing a fix, ask this: is the reaction heat steady, or is it growing each minute?",
      ],
      primer: {
        term: "Reaction heat",
        plain:
          "When chemicals join, they can let go of energy as heat. If they join faster, more heat pours out each minute.",
        like: "a campfire — faster burning throws off more heat.",
      },
      prompt: "What do you do first?",
      concept:
        "Before choosing a fix, find out whether the problem is steady or speeding up.",
      probe: "Why that first?",
      options: [
        {
          id: "trend",
          label: "Pull up the temperature trend",
          detail: "Check how much it rose in each five-minute block.",
          correct: true,
          outcome:
            "Marta puts the trend on the big screen. The room goes quiet. The line is not straight; it bends upward.",
          approach: "measure_first",
          next: "k3",
        },
        {
          id: "vent",
          label: "Open the vent like Devon says",
          detail: "Let pressure out before it builds.",
          correct: false,
          approach: "act_first",
          next: "k2",
        },
        {
          id: "hose",
          label: "Hose the outside of the steel pot",
          detail: "More cold on the outside has to help.",
          correct: false,
          approach: "brute_force",
          next: "k2",
        },
        {
          id: "boss",
          label: "Wake Hollis at home",
          detail: "He has run this plant for years.",
          correct: false,
          approach: "follow_authority",
          next: "k2",
        },
      ],
      consequences: {
        vent: "The vent coughs out hot vapour. Pressure drops for one breath, but 97 becomes 98. You removed gas, not the heat source.",
        hose: "The hose chills the paint, not the liquid inside. The cooling shell is already doing that job better. The gauge reaches 98.",
        boss: "Hollis answers on the fourth ring. “How fast is it rising?” he asks. You do not know yet, so Marta points back to the trend screen.",
      },
      hints: [
        "Everyone is suggesting an action. Nobody has measured the shape of the rise.",
        "A steady rise and a speeding rise need different answers.",
        "The trend screen tells you which one this is.",
      ],
    },
    {
      id: "k3",
      act: 1,
      mood: "alarm",
      beat: "The trend",
      visual: {
        kind: "reaction",
        title: "Not a straight line",
        caption: "Each five minutes is worse than the one before it.",
        status: "98°C · rising faster",
      },
      trivia: {
        emoji: "🌡️",
        title: "The ten degree rule",
        text: "Chemists use a rough rule: a reaction often runs about twice as fast for every ten degrees hotter it gets. It is a handy guess, not a law.",
      },
      type: "narrative",
      text: [
        "The curved line gives the answer Marta needed 📈.",
        "From 02:00 to 02:05, the pot warmed by 2°C. Then it warmed by 4°C. Then it warmed by 8°C.",
        "Cooling was full the whole time. Still, each block rose faster than the last.",
        "“So the cooling is broken,” Marta says.",
        "You check the shell. Cold water goes in. Hot water comes out. The cooling is working.",
      ],
      next: "k4",
    },
    {
      id: "k4",
      act: 1,
      mood: "tense",
      beat: "Why cooling loses",
      simulation: "heat-race",
      visual: {
        kind: "reaction",
        title: "A race between two lines",
        caption: "One line curves upward. One line does not.",
        status: "99°C",
      },
      trivia: {
        emoji: "🍲",
        title: "Big pot problem",
        text: "Double a pot’s width and its inside grows eight times, but its skin only grows four times. That is why a big batch heats itself much faster than a small one.",
      },
      primer: {
        term: "The jacket",
        plain:
          "The jacket is the cooling shell around the pot. It removes heat by carrying warm water away from the outside wall.",
        like: "a fan on one speed. It helps, but it cannot suddenly blow twice as hard.",
      },
      type: "choice",
      text: [
        "The cooling shell is working. The pot is still getting hotter.",
        "Look at the model below. It shows heat made against heat carried away.",
      ],
      prompt: "Why can’t full cooling hold it?",
      concept:
        "The reaction’s heat grows with temperature. The cooling cannot grow as fast.",
      probe: "What made you rule out the other choices?",
      options: [
        {
          id: "faster",
          label: "The hotter it gets, the more heat it makes",
          detail: "Heating it makes it heat harder. Cooling cannot keep pace.",
          correct: true,
          outcome:
            "Devon stops at the window. “So the heat answers back,” he says. The curved line points to the next question: break the loop where?",
          approach: "seek_pattern",
          next: "k5",
        },
        {
          id: "undersized",
          label: "The jacket is simply too small",
          detail: "A bigger cooling system would solve it.",
          correct: false,
          approach: "brute_force",
          next: "k4",
        },
        {
          id: "stirrer",
          label: "The mixer is not mixing well enough",
          detail: "Hot patches are hiding inside the pot.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "k4",
        },
        {
          id: "probe",
          label: "The sensor is lying",
          detail: "Swap it and the number comes down.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "k4",
        },
        {
          id: "coolant",
          label: "The cooling water is not cold enough",
          detail: "Colder water would make the problem go away.",
          correct: false,
          approach: "change_many",
          next: "k4",
        },
      ],
      consequences: {
        probe:
          "Marta checks the spare sensor. It is only half a degree different. Both lines curve upward, and the pot reaches 100°C.",
        undersized:
          "In the model, a bigger jacket moves the crossing later. It does not remove it. The red curve still overtakes the green line.",
        stirrer:
          "Marta checks the mixer power. It has been steady all night. A hidden hot patch would wobble, but the trend is smooth.",
        coolant:
          "Colder water helps for a few minutes in the model. Then the red curve catches it again, because the reaction speeds up.",
      },
      hints: [
        "One line in the model bends upward. The other line stays almost straight.",
        "Ask what happens to each line when the pot is 10°C hotter.",
        "Heat removed grows slowly. Heat made grows much faster.",
      ],
    },
    {
      id: "k5",
      act: 1,
      mood: "insight",
      beat: "The chain",
      visual: {
        kind: "reaction",
        title: "Hollis is back on the line",
        caption: "He wants the whole story in order.",
        status: "100°C",
      },
      type: "reorder",
      text: [
        "The curved line has shown the loop. Hollis calls back as you stare at it.",
        "“Do not tell me the fix yet,” he says. “Tell me what is happening, step by step.”",
      ],
      prompt: "How did a normal batch start cooking itself?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "warm",
          label: "The batch gets a little warmer than it should be",
          detail: "This is the first small nudge.",
        },
        {
          id: "faster",
          label: "Warmer liquid makes the reaction go faster",
        },
        {
          id: "moreheat",
          label: "A faster reaction gives off more heat",
        },
        {
          id: "outpace",
          label: "The new heat arrives faster than the jacket removes it",
        },
        {
          id: "loop",
          label: "So the batch gets warmer again, and the loop repeats",
          detail: "Each trip around the loop is quicker.",
        },
      ],
      wrong:
        "“Stop,” Hollis says. “One step is before its cause. Read it as a sentence, and make each line cause the next.”",
      right:
        "“That is the runaway,” Hollis says. “The loop is real. Now find what filled the pot enough to start it.”",
      concept:
        "A runaway reaction is a feedback loop: heat makes speed, and speed makes heat.",
      probe: "Which link in that loop looks easiest to cut?",
      hints: [
        "Start with the small extra warmth.",
        "Each step should cause the one after it. Say “which means” between them.",
        "Warmer, faster, more heat, jacket falls behind, warmer again.",
      ],
      next: "k6",
    },
    {
      id: "k6",
      act: 1,
      mood: "insight",
      beat: "What changed",
      visual: {
        kind: "reaction",
        title: "The night shift log",
        caption: "One line, entered at 01:40, explains the nudge.",
        status: "101°C",
      },
      type: "narrative",
      text: [
        "Hollis asked what filled the pot. Marta finds it in the log.",
        "At 01:40, the pump added the second chemical twice as fast for eleven minutes.",
        "Normally, that chemical drips in slowly and gets used up as it arrives.",
        "Tonight, too much arrived. About 40% of it is still waiting in the hot pot ⏳.",
        "“That was the nudge,” you say. Devon points at 101°C. “Then we break it now.”",
      ],
      next: "k7",
    },

    /* ---------------- ACT 2 — INTERVENE ---------------- */
    {
      id: "k7",
      act: 2,
      mood: "alarm",
      beat: "The clock",
      simulation: "runaway-clock",
      visual: {
        kind: "reaction",
        title: "“Give it ten minutes”",
        caption: "The safe window shrinks as the pot warms.",
        status: "101°C · decision now",
      },
      type: "choice",
      text: [
        "Devon says to break it now. Marta hesitates with her hand over the red button 🔴.",
        "“If we quench, the batch is lost,” she says. “Can cooling have ten more minutes?”",
        "Drag the temperature in the model. Watch the time left halve every 10°C.",
      ],
      prompt: "Do you wait ten minutes?",
      primer: {
        term: "Quench",
        plain:
          "To quench is to stop a reaction by adding cold liquid fast. It cools the mix and spreads the chemicals apart.",
        like: "pouring water on a barbecue. The fire stops, and dinner is over.",
      },
      concept:
        "In a runaway, the time you have left shrinks much faster than the temperature rises.",
      probe: "What convinced you either way?",
      options: [
        {
          id: "now",
          label: "No — act now, while there is still time",
          detail: "Every 10°C halves the time left to stop the loop.",
          correct: true,
          outcome:
            "Marta steps back from the panel. The batch is lost, but the pot is still yours. Devon moves to the cold-liquid line.",
          approach: "seek_pattern",
          next: "k8",
        },
        {
          id: "wait",
          label: "Wait ten minutes and watch",
          detail: "It has only climbed since 02:00. Maybe it slows soon.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "k7",
        },
        {
          id: "half",
          label: "Wait while the line is hooked up",
          detail: "Be ready, but do not lose the batch yet.",
          correct: false,
          approach: "act_first",
          next: "k7",
        },
        {
          id: "sample",
          label: "Take a lab sample first",
          detail: "Measure exactly how much chemical is still waiting.",
          correct: false,
          approach: "measure_first",
          next: "k7",
        },
      ],
      consequences: {
        wait: "Ten minutes later, the pot is 113°C and rising fast. The model gives less than 12 minutes. The pump needs 12 minutes.",
        half: "Hooking up the line helps. Waiting while doing it does not. At 111°C, the model says half your time is gone.",
        sample: "A lab sample takes 25 minutes. The model gives about 24 minutes at 101°C, and less after every 10°C.",
      },
      hints: [
        "Look at what the time-left bar does as you drag the temperature up.",
        "At 101°C, you have about 24 minutes. At 111°C, you have about 12.",
        "If a fix needs 12 minutes, waiting ten minutes is not safe.",
      ],
    },
    {
      id: "k8",
      act: 2,
      mood: "tense",
      beat: "Break the loop",
      visual: {
        kind: "cooling",
        title: "Cut the cause, not the symptom",
        caption: "You cannot remove heat fast enough. Stop making it.",
        status: "102°C · hands on valves",
      },
      trivia: {
        emoji: "🥣",
        title: "Cold water in cooking",
        text: "Cooks pour cold water into a boiling pot to stop it foaming over. The trick works the same way here: cold liquid takes heat away and slows the bubbling.",
      },
      primer: {
        term: "Solvent",
        plain:
          "Solvent is a liquid that does not join the reaction. Here it is cold, so it soaks up heat and thins the mix.",
        like: "adding water to strong squash. The flavour is still there, but it is spread out.",
      },
      type: "choice",
      text: [
        "Devon reaches the cold-liquid line because you chose not to wait ❄️.",
        "The loop is heat, speed, more heat. Cooling cannot pull heat out fast enough.",
        "Marta asks, “What do I shut first?”",
      ],
      prompt: "What actually breaks the loop?",
      concept:
        "When you cannot remove heat fast enough, stop the thing that is making it.",
      probe: "Why is that better than the other choices?",
      options: [
        {
          id: "quench",
          label: "Stop the adding pump, then quench with cold solvent",
          detail: "Stop new heat, then thin and cool what is already inside.",
          correct: true,
          outcome:
            "The adding pump shuts with a hard clack. The loop loses its new fuel. Devon waits for your solvent number.",
          approach: "isolate_variable",
          next: "k9",
        },
        {
          id: "colder",
          label: "Switch to even colder cooling water",
          detail: "A colder shell removes more heat.",
          correct: false,
          approach: "brute_force",
          next: "k8",
        },
        {
          id: "stir",
          label: "Run the mixer at maximum",
          detail: "Move heat to the wall faster.",
          correct: false,
          approach: "change_many",
          next: "k8",
        },
        {
          id: "seed",
          label: "Add a chemical stopper",
          detail: "Poison the reaction instead of starving it.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "k8",
        },
        {
          id: "vent2",
          label: "Open the emergency vent",
          detail: "Let pressure out and let vapour boil off.",
          correct: false,
          approach: "act_first",
          next: "k8",
        },
      ],
      consequences: {
        seed:
          "The stopper chemical is across the site. It needs 20 minutes, and it must be mixed in. The clock will not wait.",
        colder:
          "The colder water slows the climb for four minutes. Then 102 becomes 103. The red curve is still curving.",
        stir: "Better mixing moves heat to the wall a little faster. It does nothing about the heat being made inside.",
        vent2:
          "The vent drops pressure, not the reaction speed. The waiting chemical stays in the hot pot and keeps reacting.",
      },
      hints: [
        "You have already tried the cooling end of the loop.",
        "Ask what is making the heat right now.",
        "Stop adding chemical, then spread out what is already inside.",
      ],
    },
    {
      id: "k9",
      act: 2,
      mood: "alarm",
      beat: "The quench",
      visual: {
        kind: "cooling",
        title: "The solvent line is open",
        caption: "Enough to stop the loop. Not enough to overflow.",
        status: "103°C · 700 L of space",
      },
      trivia: {
        emoji: "🪣",
        title: "Plants keep dump tanks",
        text: "Most chemical plants keep a large empty tank ready as a bail-out. If a batch turns dangerous, valves open and the whole pot pours into cold safety below.",
      },
      type: "slider",
      text: [
        "The adding pump is off. Marta cracks the cold solvent valve 💧.",
        "The model below predicts the hottest point after the solvent mixes in.",
        "Keep that peak below 110°C. The pot has only 700 litres of empty space.",
      ],
      prompt: "How much cold solvent goes in?",
      concept:
        "Spreading the chemicals slows the reaction and soaks up heat, but the pot has a hard limit.",
      probe: "Why that amount and not the maximum?",
      slider: {
        label: "Cold solvent",
        unit: "L",
        min: 0,
        max: 900,
        step: 25,
        initial: 0,
      },
      readout: {
        label: "Peak temperature",
        unit: "°C",
        expr: "peak_temperature",
        params: { base: 148, perUnit: -0.085 },
        decimals: 1,
      },
      driver: { label: "Danger line", value: 110, unit: "°C" },
      risk: { mode: "ceiling", safeGap: 45 },
      meter: "thermometer",
      target: { min: 450, max: 700 },
      bands: [
        {
          max: 200,
          text: "A splash cools the edge. The gauge dips once, then climbs again. The same choice is still in your hands.",
        },
        {
          max: 425,
          text: "The climb slows. Then it starts again, because too much waiting chemical remains too close together.",
        },
        {
          max: 700,
          text: "The needle stops, then falls. The loop is broken, and Devon turns to ask how cooling lost.",
        },
        {
          max: 900,
          text: "The pot overflows into the catch pit. Nobody is hurt, but the night now becomes a cleanup.",
        },
      ],
      hints: [
        "Drag the slider and watch the peak against the 110°C line.",
        "You need the peak under 110°C, and you cannot pass 700 litres.",
        "Any value from 450 to 700 litres does both jobs.",
      ],
      next: "k10",
    },
    {
      id: "k10",
      act: 2,
      mood: "calm",
      beat: "Debrief",
      visual: {
        kind: "cooling",
        title: "03:40 — 88°C and falling",
        caption: "The loop is broken. The batch is not finished.",
        status: "falling 1°C per minute",
      },
      type: "reflect",
      text: [
        "The solvent did its work. By 03:40, the gauge reads 88°C and keeps falling ✅.",
        "Marta makes tea in a beaker, which is against many rules.",
        "Devon sits down. “Explain it like I am new, because I would have opened the vent.”",
      ],
      prompt: "Why didn’t more cooling work?",
      placeholder: "One or two plain sentences.",
      next: "k11",
    },

    /* ---------------- ACT 3 — THE FIX BREAKS ---------------- */
    {
      id: "k11",
      act: 3,
      mood: "tense",
      beat: "Still loaded",
      visual: {
        kind: "vent",
        title: "The sample bottle",
        caption: "Cold, calm, and still holding the night’s real cause.",
        status: "04:20 · batch on hold",
      },
      trivia: {
        emoji: "🌾",
        title: "Haystacks can heat themselves",
        text: "A wet haystack or compost heap can warm itself for days as tiny reactions inside give off heat. Farmers watch the pile because a large heap has caught fire before.",
      },
      type: "narrative",
      text: [
        "Your answer to Devon is still on the board when the lab result arrives.",
        "Marta reads it twice. About 40% of the second chemical is still in the pot.",
        "Cold at 74°C, it is quiet. Warm it too fast, and it becomes the same pile-up again.",
        "Hollis arrives with his coat over pyjamas. “Good save,” he says. “Now can we finish it?”",
        "Devon looks at you. “Or do we dump it and keep everyone safe?”",
      ],
      next: "k12",
    },
    {
      id: "k12",
      act: 3,
      mood: "insight",
      beat: "How fast is fast",
      visual: {
        kind: "vent",
        title: "Four ways to take heat out",
        caption: "They all help. They do not all help in time.",
        status: "writing the restart plan",
      },
      trivia: {
        emoji: "🏭",
        title: "Bhopal 1984",
        text: "In Bhopal, India in 1984, water leaked into a tank of methyl isocyanate and started a runaway reaction. The gas escaped into the city overnight, and it remains one of the worst factory disasters ever.",
      },
      type: "reorder",
      text: [
        "The quiet sample raises the next problem: how to finish without waking the loop.",
        "Before anyone touches a valve, Hollis makes you write a plan on the board.",
        "“Rank the levers by how fast they act,” he says. “That ranking decides the night.”",
      ],
      prompt: "Which lever acts fastest?",
      instruction: "Order them from fastest to slowest.",
      steps: [
        {
          id: "feed",
          label: "Shut the pump that adds chemical",
          detail: "The heat source stops the second it closes.",
        },
        {
          id: "quench",
          label: "Add cold solvent",
          detail: "It takes a minute or two to pump in and mix.",
        },
        {
          id: "jacket",
          label: "Turn the cooling jacket up",
          detail: "The batch feels it after ten to fifteen minutes.",
        },
        {
          id: "wait",
          label: "Let the pot cool by itself",
          detail: "That takes hours, and only after the reaction slows.",
        },
      ],
      wrong:
        "Hollis shakes his head. “Nothing beats the pump. It stops heat before that heat is even made.”",
      right:
        "“Right,” Hollis says. “Prevent heat first. Then add cold. Now choose how this quiet batch ends.”",
      concept:
        "Preventing heat is instant. Removing heat always takes time you may not have.",
      probe: "Why is stopping the source faster than any kind of cooling?",
      hints: [
        "Two levers stop new heat. Two only remove heat after it exists.",
        "Ask how long it takes between your hand moving and the gauge changing.",
        "Pump, solvent, jacket, waiting.",
      ],
      next: "k13",
    },
    {
      id: "k13",
      act: 3,
      mood: "resolve",
      beat: "Finish it",
      simulation: "feed-slow",
      visual: {
        kind: "plant-dawn",
        title: "05:50 — the shift is nearly over",
        caption: "One decision remains. It is about pace, not bravery.",
        status: "batch on hold · Friday deadline",
      },
      type: "choice",
      text: [
        "The board now says pump, solvent, jacket, waiting.",
        "The batch is stable at 74°C, but 40% of the second chemical is still waiting inside.",
        "The model below shows the two choices on the desk: all at once, or a little at a time.",
      ],
      prompt: "How do you finish the night?",
      concept:
        "Waiting chemical is stored heat. Release it slowly, or do not release it at all.",
      options: [
        {
          id: "slow",
          label: "Warm it back in five-degree steps",
          detail: "After each step, wait until the line stays straight.",
          correct: true,
          outcome:
            "You warm the pot five degrees at a time. The curve stays straight. By 05:50, the batch is boring again.",
          approach: "isolate_variable",
          next: "k14",
        },
        {
          id: "dump",
          label: "Send it to the safe dump tank",
          detail: "Lose the product. Lose nothing else.",
          correct: true,
          outcome:
            "The dump valve opens. The hot mix spreads thin in a cold tank built for this job. Devon finally exhales.",
          approach: "act_first",
          next: "k14",
        },
        {
          id: "straight",
          label: "Heat it straight back to 70°C",
          detail: "It ran at 70°C all week. Catch up on schedule.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "k13",
        },
        {
          id: "overnight",
          label: "Leave it cold for the morning shift",
          detail: "Write a note and let them decide.",
          correct: false,
          approach: "follow_authority",
          next: "k13",
        },
      ],
      consequences: {
        straight:
          "The model’s all-at-once trace jumps upward. That is the waiting 40% reacting together, with no slow steps to watch it.",
        overnight:
          "Cold is not the same as finished. The waiting chemical is still there. Devon says, “I will not sign that handover.”",
      },
      hints: [
        "The danger is not just temperature. It is the waiting chemical.",
        "In the model, the safe trace changes the reaction pace.",
        "Either release the heat slowly and watch, or do not release it.",
      ],
    },
    {
      id: "k14",
      act: 3,
      mood: "resolve",
      beat: "06:30",
      visual: {
        kind: "plant-dawn",
        title: "Shift change",
        caption: "Reactor 4 at 71°C, exactly where it should be.",
        status: "handover written",
      },
      type: "ending",
      text: [
        "At 06:30, the day shift walks in to a calm pot at 71°C ☀️.",
        "The handover says the same thing three ways: heat made speed, and speed made heat.",
        "Hollis reads the last line. “Fix: if temperature climbs in a curve, the adding pump shuts itself.”",
        "“Eleven bad minutes,” he says, “and one rule to stop the next one.”",
        "Marta has already filed the request. Devon is asleep in a plastic chair.",
      ],
      outcome: "success",
    },
  ],
};
