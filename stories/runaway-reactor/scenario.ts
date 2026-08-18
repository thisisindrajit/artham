import type { Scenario } from "@/types/story";

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
  blurb:
    "The pot should be sitting at 70°C. It is at 96°C and climbing, and the cooling jacket is already wide open. You are the only engineer on site, and every minute you spend deciding makes the thing harder to stop.",
  art: {
    alt: "A dim chemical plant control room at 2 a.m.: a steel reactor vessel glowing dull red through a window, a temperature trend on screen curving sharply upward.",
  },
  domain: "chemistry",
  difficulty: "hard",
  learningGoal:
    "Learn why some reactions heat themselves faster and faster, and why waiting makes them harder to stop.",
  takeaway: {
    concept: "Runaway reaction",
    field: "Chemistry — reaction speed",
    inOneLine:
      "Some reactions make heat. Heat makes them faster. Faster reactions make more heat. That loop can outrun full cooling.",
    rule:
      "When heat and speed feed each other, do not wait. Stop the source, or spread the chemicals out before the window shuts.",
    elsewhere: [
      "A laptop battery heats itself once the inside reaction starts racing.",
      "A damp haystack warms from inside until it begins to smoke.",
      "A bank run works this way: fear feeds withdrawals, and withdrawals feed fear.",
    ],
    youUsedIt: [
      "You checked the curve first and saw the rise was speeding up.",
      "You named the loop: hotter means faster, faster means hotter.",
      "You shut the pump before asking for more cooling.",
    ],
  },
  minutes: 7,
  stageLabel: "Reactor 4 live",
  partnerGreeting:
    "I’ll stay on the headset. You run the night room. I’ll watch how you think under a clock.",
  intro: {
    role: "night shift engineer",
    cta: "Take the control room",
    text: [
      "It is 02:14 at the plant, and you are the only engineer on site.",
      "The steel pot should sit near 70°C. It is at 96°C, cooling on full.",
      "Marta waves you to the desk. “It is going the other way,” she says.",
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
      { id: "numbers", label: "Find out how fast it is getting worse", approach: "measure_first" },
      { id: "guess", label: "Guess the cause, then check it", approach: "commit_to_hypothesis" },
      { id: "different", label: "Ask what changed since last time", approach: "seek_pattern" },
      { id: "safe", label: "Make it safe first, understand it later", approach: "act_first" },
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
        "Two chemicals in the pot are joining, and that reaction gives off heat 🔥.",
        "A cooling jacket wraps the pot and carries the heat out through the wall. Tonight the jacket is losing.",
        "“Cooling has been full since 02:00,” Marta says. “It was 82°C then.”",
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
        "The gauge reaches 97°C while Devon points at the vent switch ⚠️.",
        "Marta reaches for the phone. Nobody has looked at the shape of the reaction yet.",
      ],
      primer: {
        term: "Reaction heat",
        plain:
          "When chemicals join, they can release energy as heat. Faster joining releases more heat each minute.",
        like: "a campfire: faster burning throws off more heat.",
      },
      prompt: "What do you do first?",
      concept:
        "Before choosing a fix, find out whether the problem is steady or speeding up.",
      probe: "Why that first?",
      options: [
        {
          id: "trend",
          label: "Pull up the temperature trend",
          detail: "See how much it rose each five-minute block.",
          correct: true,
          outcome:
            "The trend fills the screen. The line bends upward — it is not straight.",
          approach: "measure_first",
          next: "k4",
        },
        { id: "vent", label: "Open the vent like Devon says", correct: false, approach: "act_first", next: "k2" },
        { id: "hose", label: "Hose the outside of the pot", correct: false, approach: "brute_force", next: "k2" },
        { id: "boss", label: "Wake Hollis at home", correct: false, approach: "follow_authority", next: "k2" },
      ],
      consequences: {
        vent: "Hot vapour puffs out. Ninety-seven becomes ninety-eight. You removed gas, not the source.",
        hose: "The hose chills paint, not the liquid inside. The gauge reaches 98°C.",
        boss: "Hollis answers on the fourth ring. “How fast is it rising?” You do not know yet.",
      },
      hints: [
        "Everyone is suggesting an action. Nobody has measured the shape of the rise.",
        "A steady rise and a speeding rise need different answers.",
        "The trend screen tells you which one this is.",
      ],
    },
    {
      id: "k4",
      act: 1,
      mood: "tense",
      beat: "Why cooling loses",
      simulation: "heat-race",
      visual: {
        kind: "reaction",
        title: "A curve, not a line",
        caption: "Each five minutes worse — the reaction is chasing itself.",
        status: "99°C",
      },
      trivia: {
        emoji: "🌡️",
        title: "The ten degree rule",
        text: "Chemists use a rough rule: reactions run about twice as fast for every ten degrees hotter. A handy guess, not a law.",
      },
      simGuide: {
        shows:
          "Two lines climb across a graph as the pot warms: red is heat the reaction makes, green is heat the jacket removes.",
        move:
          "Drag the “Cooling power” slider from off to full blast to see how the two lines change at every jacket setting.",
        watch:
          "Green rises in a straight line while red curves upward and steepens like a hill. Where they cross, cooling has lost the race, and every extra degree only makes red climb faster.",
      },
      type: "choice",
      text: [
        "The trend jumps 2°C, then 4, then 8 📈. Cooling was full the whole time.",
        "The model below races heat made against heat removed. Try the slider.",
      ],
      prompt: "Why can’t full cooling hold it?",
      concept:
        "The reaction’s heat grows with temperature. The cooling cannot grow as fast.",
      probe: "What made you rule out the other choices?",
      options: [
        {
          id: "faster",
          label: "The hotter it gets, the more heat it makes",
          detail: "Each ten degrees roughly doubles the rate.",
          correct: true,
          outcome:
            "Devon nods. “So the heat answers back.” Next question: break the loop where?",
          approach: "seek_pattern",
          next: "k5",
        },
        { id: "undersized", label: "The jacket is simply too small", correct: false, approach: "brute_force", next: "k4" },
        { id: "stirrer", label: "The mixer is not mixing well", correct: false, approach: "commit_to_hypothesis", next: "k4" },
        { id: "probe", label: "The sensor is lying", correct: false, approach: "abandon_hypothesis", next: "k4" },
        { id: "coolant", label: "The cooling water is not cold enough", correct: false, approach: "change_many", next: "k4" },
      ],
      consequences: {
        probe: "The spare sensor reads half a degree different. The curve still bends.",
        undersized: "A bigger jacket moves the crossing later. It does not remove it.",
        stirrer: "Mixer power was steady all night. A hidden hot patch would wobble.",
        coolant: "Colder water helps for four minutes. Then the red curve catches it again.",
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
        title: "Tell it as a story",
        caption: "Hollis wants the whole loop, in order.",
        status: "100°C",
      },
      type: "reorder",
      text: [
        "The desk phone rings. It’s Hollis, the day-shift chief, from home. “Do not tell me the fix yet. Tell me what is happening, step by step.”",
      ],
      prompt: "How did a normal batch start cooking itself?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        { id: "warm", label: "The batch gets a little warmer than it should" },
        { id: "faster", label: "Warmer liquid makes the reaction go faster" },
        { id: "moreheat", label: "A faster reaction gives off more heat" },
        { id: "outpace", label: "New heat arrives faster than the jacket removes it" },
        { id: "loop", label: "So the batch gets warmer again, and the loop repeats" },
      ],
      wrong:
        "“Stop,” Hollis says. “One step is before its cause. Make each line cause the next.”",
      right:
        "“That is the runaway,” Hollis says. “The loop is real. Now find what started it.”",
      concept:
        "A runaway reaction is a feedback loop: heat makes speed, and speed makes heat.",
      probe: "Which link in the loop looks easiest to cut?",
      hints: [
        "Start with the small extra warmth.",
        "Say “which means” between each step.",
        "Warmer, faster, more heat, jacket falls behind, warmer again.",
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
      simGuide: {
        shows:
          "Two bars over the temperature slider: the top is minutes before the pot runs away, the bottom is minutes the jacket needs to bite.",
        move:
          "Drag the “Batch temperature” slider anywhere from 90°C to 150°C to see how much time the pot has at each reading.",
        watch:
          "The top bar shrinks by half every ten degrees you add. Once it drops under the twelve-minute cooling bar, the jacket arrives too late to save the batch.",
      },
      primer: {
        term: "Quench",
        plain:
          "To quench is to stop a reaction with cold liquid. It cools and spreads the chemicals.",
        like: "pouring water on a barbecue.",
      },
      type: "choice",
      text: [
        "The log shows it: at 01:40 the pump doubled the feed for eleven minutes ⏳.",
        "About 40% is still waiting inside. Marta hovers over the red quench button.",
        "Drag the model below: the time left halves every 10°C.",
      ],
      prompt: "Do you wait ten minutes?",
      concept:
        "In a runaway, the time you have left shrinks much faster than the temperature rises.",
      probe: "What convinced you either way?",
      options: [
        {
          id: "now",
          label: "No — act now, while there is still time",
          detail: "Every 10°C halves the time left.",
          correct: true,
          outcome:
            "Marta steps back from the panel. Product’s lost for tonight — but the pot is still yours.",
          approach: "seek_pattern",
          next: "k8",
        },
        { id: "wait", label: "Wait ten minutes and watch", correct: false, approach: "abandon_hypothesis", next: "k7" },
        { id: "half", label: "Wait while the line is hooked up", correct: false, approach: "act_first", next: "k7" },
        { id: "sample", label: "Take a lab sample first", correct: false, approach: "measure_first", next: "k7" },
      ],
      consequences: {
        wait: "Ten minutes later, the pot is 113°C. The model gives less than 12 minutes.",
        half: "Hooking up the line helps. Waiting while doing it does not.",
        sample: "A lab sample takes 25 minutes. The model gives about 24 at 101°C.",
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
        text: "Cooks pour cold water into a boiling pot to stop it foaming over. The cold liquid takes heat away and slows the bubbling.",
      },
      type: "narrative",
      text: [
        "Devon slaps the cold-liquid line open ❄️. Marta is already on the pump kill — the feed clacks off mid-hiss.",
        "You call the order: pump first, then thin the pot with cold solvent.",
      ],
      next: "k9",
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
      primer: {
        term: "Solvent",
        plain:
          "A solvent is a liquid that does not join the reaction. Cold, it soaks up heat and thins the mix.",
        like: "adding water to strong squash: the flavour spreads out.",
      },
      type: "slider",
      text: [
        "The adding pump is off. Marta cracks the solvent valve 💧.",
        "The model predicts the hottest point after solvent mixes in. Stay under 110°C — the pot has only 700 L free.",
      ],
      prompt: "How much cold solvent goes in?",
      concept:
        "Spreading the chemicals slows the reaction and soaks up heat, but the pot has a hard limit.",
      probe: "Why that amount and not the maximum?",
      slider: { label: "Cold solvent", unit: "L", min: 0, max: 900, step: 25, initial: 0 },
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
        { max: 200, text: "A splash cools the edge. The gauge dips once, then climbs again." },
        { max: 425, text: "The climb slows, then starts again — too much waiting chemical remains." },
        { max: 700, text: "The needle stops, then falls. The loop is broken." },
        { max: 900, text: "The pot overflows into the catch pit. Nobody is hurt, but the night is a cleanup." },
      ],
      hints: [
        "Drag the slider and watch the peak against the 110°C line.",
        "You need the peak under 110°C, and cannot pass 700 litres.",
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
        "The solvent did its work. By 03:40 the gauge reads 88°C and keeps falling ✅.",
        "Devon sits down. “Next shift, before I touch a valve — what’s the first thing you want me to check?”",
      ],
      prompt: "What’s the first thing you’d tell Devon to check?",
      placeholder: "One or two plain sentences.",
      next: "k13",
    },

    /* ---------------- ACT 3 — THE FIX BREAKS ---------------- */
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
      trivia: {
        emoji: "🌾",
        title: "Haystacks self-heat",
        text: "A wet haystack warms itself for days as tiny reactions inside give off heat. Large piles have caught fire this way.",
      },
      simGuide: {
        shows:
          "A one-hour temperature graph with a red 110°C danger line, and two buttons that decide how the leftover reactant is added.",
        move:
          "Tap the “Pour it all in” and “Feed it slowly” buttons to switch modes and compare the two curves against the red line.",
        watch:
          "Pouring it all in shoots past 110°C in about ten minutes and the pot is lost. Feeding it slowly stays flat under the line, because heat leaves the jacket as fast as the reaction makes it.",
      },
      type: "choice",
      text: [
        "Two hours pass. The pot sits quiet at 74°C 🕰️, but 40% of the second chemical is still waiting inside.",
        "Hollis wants a finish plan. The model shows both choices: all at once, or a little at a time.",
      ],
      prompt: "How do you finish the night?",
      concept:
        "Waiting chemical is stored heat. Release it slowly, or do not release it at all.",
      options: [
        {
          id: "slow",
          label: "Feed the rest in slowly, drip by drip",
          detail: "Add it as fast as the jacket can carry the heat away.",
          correct: true,
          outcome:
            "You crack the feed line to a trickle. By 05:50 the batch is boring again.",
          approach: "isolate_variable",
          next: "k14",
        },
        {
          id: "dump",
          label: "Send it to the safe dump tank",
          correct: true,
          outcome:
            "The dump valve opens. The hot mix spreads thin in a cold tank built for this.",
          approach: "act_first",
          next: "k14",
        },
        { id: "straight", label: "Pour the rest in all at once", correct: false, approach: "commit_to_hypothesis", next: "k13" },
        { id: "overnight", label: "Leave it cold for the morning shift", correct: false, approach: "follow_authority", next: "k13" },
      ],
      consequences: {
        straight: "The model’s all-at-once trace shoots past 110°C in ten minutes. Not tonight.",
        overnight: "Cold is not the same as finished. Devon says, “I will not sign that handover.”",
      },
      hints: [
        "The danger is not just temperature. It is the waiting chemical.",
        "In the model, the slow-feed trace stays flat under the red line.",
        "Feed the rest in slowly, or send it to the dump tank.",
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
      ],
      outcome: "success",
    },
  ],
};
