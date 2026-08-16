import type { Scenario } from "../types";

/**
 * The trap here is that the obvious lever (cooling) is the one that cannot
 * win. Heat generation climbs exponentially with temperature; heat removal
 * climbs only in proportion to the temperature gap. Past the crossover there
 * is no jacket big enough — the only move left is to stop *making* heat.
 *
 * Act 3 then turns the successful fix into the next problem: a quenched batch
 * is a pot full of unreacted material, which is exactly what caused the
 * runaway in the first place. Same concept, opposite direction.
 */
export const runawayReactor: Scenario = {
  id: "runaway-reactor",
  title: "Stop the Runaway",
  tagline: "2 a.m. Reactor 4 is heating itself, and cooling is already maxed.",
  domain: "chemistry",
  difficulty: "hard",
  learningGoal:
    "Learn why some reactions heat themselves faster and faster — and why cooling alone cannot stop them.",
  takeaway: {
    concept: "Thermal runaway",
    field: "Chemistry \u2014 reaction kinetics",
    inOneLine:
      "Some reactions make heat, and heat makes them go faster, which makes more heat. Heat production climbs by multiplying; cooling only climbs in proportion to how much colder the jacket is than the contents. Past the point where those two curves cross, no cooling system is big enough.",
    rule:
      "When something feeds itself, fighting the symptom loses on a long enough timeline. You have to cut the loop: remove the fuel, or dilute what is left. And act while it still looks manageable \u2014 the window shuts faster than the number climbs.",
    elsewhere: [
      "A laptop battery in thermal runaway: the fire is the reaction heating itself, not the fire spreading.",
      "A compost heap or a damp haystack heating from the inside until it smokes.",
      "A bank run: withdrawals make people nervous, nervous people withdraw.",
      "A crowd surge, a rumour, a chain reaction \u2014 anything where the output is also the input.",
    ],
    youUsedIt: [
      "You looked at the shape of the temperature trend, not just its value, and saw a curve instead of a slope.",
      "You named the loop \u2014 hotter means faster means hotter \u2014 rather than blaming the cooling system.",
      "You killed the feed instead of asking for more cooling, because you cannot out-cool something that answers back.",
      "You chose a quench volume that beat the heat without overflowing the vessel.",
    ],
  },
  minutes: 12,
  stageLabel: "Reactor 4 live",
  partnerGreeting:
    "I'll be on the headset. You run the reactor; I'll watch how you think under a clock.",
  intro: {
    role: "night shift process engineer",
    cta: "Take the control room",
    text: [
      "Kestrel Chemicals, Unit 4. It is 02:14 and you are the only engineer on site.",
      "Marta, the control room operator, waves you over without saying hello.",
      "Reactor 4 should be sitting at 70°C. It is at 96°C, and the cooling has been at full blast for twenty minutes.",
      "“It's not coming down,” she says. “It's going the other way.”",
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
        label: "Find out how fast it's getting worse",
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
        caption: "The stirrer is running. Everything looks normal except one number.",
        status: "cooling at 100%",
      },
      type: "narrative",
      text: [
        "The control room hums. Outside the window, Reactor 4 is a four-metre steel pot with a cooling jacket wrapped round it like a blanket.",
        "Inside it, two chemicals are reacting, and that reaction gives off heat. That is normal. The jacket is supposed to carry the heat away.",
        "Tonight the jacket is losing.",
        "“I've had it on maximum since two,” Marta says. “Twenty minutes ago it was 82.”",
        "Devon, the shift supervisor, is already pulling on his boots.",
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
        caption: "Everyone wants to do something. Nobody has looked at the trend.",
        status: "97°C",
      },
      type: "choice",
      text: [
        "“Vent it,” says Devon. “Now, while it's still only 97.”",
        "Marta wants to call Mr. Hollis at home. The maintenance lad wants to hose the outside of the vessel with cold water. Nobody has asked whether the reaction heat is steady or climbing.",
      ],
      primer: {
        term: "Reaction heat",
        plain:
          "When these two chemicals join up, they let go of energy as heat. The faster they join, the more heat pours out every minute.",
        like: "a fire — the harder it burns, the more heat it throws off.",
      },
      prompt: "What do you do first?",
      concept:
        "Before choosing a fix, find out whether the problem is steady or speeding up.",
      probe: "Why that first?",
      options: [
        {
          id: "trend",
          label: "Pull up the temperature trend",
          detail: "Find out how fast it climbed in each of the last few minutes.",
          correct: true,
          outcome:
            "Marta throws the last four hours onto the big screen. Devon stops pulling his boots on halfway. The line is not a slope. It is a curve, and it is bending upwards.",
          approach: "measure_first",
          next: "k3",
        },
        {
          id: "vent",
          label: "Open the vent like Devon says",
          detail: "Let the pressure out before it builds.",
          correct: false,
          approach: "act_first",
          next: "k2",
        },
        {
          id: "hose",
          label: "Hose down the outside of the vessel",
          detail: "More cold on the outside has to help.",
          correct: false,
          approach: "brute_force",
          next: "k2",
        },
        {
          id: "boss",
          label: "Wake up Mr. Hollis",
          detail: "He has run this plant for nineteen years.",
          correct: false,
          approach: "follow_authority",
          next: "k2",
        },
      ],
      consequences: {
        vent: "The vent dumps hot vapour to the scrubber. Pressure drops for a moment — and the temperature carries on climbing, because you removed vapour, not heat. Devon swears quietly.",
        hose: "A cold hose on a hot steel wall does almost nothing; the jacket underneath is already doing the same job far better. The number moves from 97 to 98.",
        boss: "Mr. Hollis picks up on the fourth ring. “How fast is it rising, and is that speed changing?” You do not know. “Then look, and call me back.”",
      },
      hints: [
        "Everyone is suggesting an action. Nobody has said how fast this is happening.",
        "A problem that grows steadily and a problem that accelerates need different answers.",
        "The trend screen will tell you which one this is.",
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
      type: "narrative",
      text: [
        "Marta pulls the trend onto the big screen.",
        "02:00 to 02:05 — up 1 degree. 02:05 to 02:10 — up 2. 02:10 to 02:15 — up 4.",
        "It is not creeping. It is accelerating, and it has been accelerating the whole time the cooling has been flat out.",
        "“So the cooling is broken,” Marta says.",
        "You check the jacket. Water going in cold, coming out hot, at full flow. The jacket is working perfectly.",
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
        caption: "One of them is allowed to curve upwards.",
        status: "99°C",
      },
      primer: {
        term: "The jacket",
        plain:
          "the cooling shell around the vessel. It removes heat in proportion to how much colder it is than the contents \u2014 so even on its best day it takes out a fixed amount per minute.",
        like: "a fan stuck on one speed.",
      },
      type: "choice",
      text: [
        "The jacket is fine. The cooling is fine. And the batch is still getting hotter.",
        "Have a play with the two lines below before you answer.",
      ],
      prompt: "Why can't full cooling hold it?",
      concept:
        "The reaction's heat output grows with temperature; the cooling's does not grow nearly as fast.",
      probe: "What made you rule out the other three?",
      options: [
        {
          id: "faster",
          label: "The hotter it gets, the more heat it makes",
          detail: "So heating it up makes it heat up harder. Cooling can't keep pace.",
          correct: true,
          outcome:
            "“Then cooling was never going to win,” Devon says slowly. “We are not fighting a fixed amount of heat. We are fighting something that answers back every time it gets warmer.”",
          approach: "seek_pattern",
          next: "k5",
        },
        {
          id: "undersized",
          label: "The jacket is simply too small",
          detail: "We need a bigger cooling system.",
          correct: false,
          approach: "brute_force",
          next: "k4",
        },
        {
          id: "stirrer",
          label: "The stirrer isn't mixing well enough",
          detail: "Hot spots are forming that the jacket never reaches.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "k4",
        },
        {
          id: "probe",
          label: "The probe is lying \u2014 nothing is really happening",
          detail: "Swap the sensor and the number comes back down.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "k4",
        },
        {
          id: "coolant",
          label: "The coolant is not cold enough",
          detail: "Get colder coolant and the problem goes away.",
          correct: false,
          approach: "change_many",
          next: "k4",
        },
      ],
      consequences: {
        probe:
          "Marta pulls the redundant channel. Two independent probes, half a degree apart, both curving. Eleven minutes gone and the batch is a degree and a half warmer than when you started doubting it.",
        undersized:
          "Slide the cooling to full in the model. The red line still overtakes the green one — just further along. A bigger jacket moves the danger point; it does not remove it.",
        stirrer:
          "Marta checks the stirrer current. Perfect, all night. And a hot spot would show up as a wobble in the trend, not a smooth curve upwards.",
        coolant:
          "Colder coolant tilts the green line up a bit. It is still a straight line, and it is still racing something that curves. Above the crossing point it loses again.",
      },
      hints: [
        "One of the two lines in the model bends upward. The other one doesn't.",
        "Ask what happens to each line when you make the batch 10°C hotter.",
        "Heat removed depends on the temperature gap. Heat made depends on temperature much more steeply.",
      ],
    },
    {
      id: "k5",
      act: 1,
      mood: "insight",
      beat: "The chain",
      visual: {
        kind: "reaction",
        title: "Mr. Hollis is back on the line",
        caption: "He wants the whole story, in order, in plain words.",
        status: "100°C",
      },
      type: "reorder",
      text: [
        "Mr. Hollis calls back. You can hear him putting the phone on speaker.",
        "“Don't tell me what you want to do yet. Tell me what is happening, step by step.”",
      ],
      prompt: "How did a normal batch start cooking itself?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "warm",
          label: "The batch gets a little warmer than it should be",
          detail: "For whatever reason — this is just the starting nudge.",
        },
        {
          id: "faster",
          label: "Warmer means the reaction goes faster",
        },
        {
          id: "moreheat",
          label: "Going faster means it gives off more heat",
        },
        {
          id: "outpace",
          label: "That heat arrives faster than the jacket can carry it away",
        },
        {
          id: "loop",
          label: "So it gets warmer still — and the whole thing repeats, harder",
          detail: "Each lap round the loop is quicker than the last.",
        },
      ],
      wrong:
        "“Stop,” says Mr. Hollis. “You've got an effect before its cause. Read it back to yourself as a sentence — does each step actually make the next one happen?”",
      right:
        "“That's it,” he says. “It's a loop that feeds itself. We call it a runaway. Now — knowing it's a loop, what would you break?”",
      concept:
        "A thermal runaway is a feedback loop: heat makes rate, rate makes heat.",
      probe: "Which link in that loop looks easiest to cut?",
      hints: [
        "Start with the smallest thing — the little nudge that begins it.",
        "Each step should cause the one after it. Say it out loud as “…which means…”.",
        "Warmer → faster → more heat → jacket falls behind → warmer still.",
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
        caption: "One line, entered at 01:40, explains everything.",
        status: "101°C",
      },
      type: "narrative",
      text: [
        "Marta finds it in the log. At 01:40, the feed pump ran at double the normal rate for eleven minutes.",
        "Normally the second chemical is dripped in slowly, so it reacts away as fast as it arrives.",
        "Tonight, far more went in than could react. It is still in there — a large amount of unreacted chemical, sitting in a pot that is getting hotter.",
        "“That's our nudge,” you say. “Everything after that is the loop. This is a runaway.”",
        "Devon looks at the gauge. 101. “Fine. So how do we break it?”",
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
        caption: "The window is closing faster than the temperature is rising.",
        status: "101°C · decision now",
      },
      type: "choice",
      text: [
        "“Give the cooling ten more minutes,” Marta says. “It might catch up. If we quench, we lose the batch and Hollis loses four hundred thousand.”",
        "It is a fair point — except the runaway loop does not wait for fair points. Drag the temperature in the model before you answer her.",
      ],
      prompt: "Do you wait ten minutes?",
      primer: [
        {
          term: "The runaway loop",
          plain:
            "Heat makes the reaction go faster, and going faster makes more heat. Each turn round the circle is bigger than the one before.",
          like: "a microphone held up to its own speaker — a faint hum becomes a scream in seconds.",
        },
        {
          term: "Quenching",
          plain:
            "Stopping a reaction by dumping in something cold that takes no part in it, chilling the mixture and spreading it thin at the same time.",
          like: "throwing a bucket of water over a barbecue. It ends the fire, and it also ends dinner.",
        },
      ],
      concept:
        "In a runaway the time you have left shrinks much faster than the temperature rises.",
      probe: "What convinced you either way?",
      options: [
        {
          id: "now",
          label: "No — act now, while it still looks manageable",
          detail: "Every 10°C halves the time we have to do anything.",
          correct: true,
          outcome:
            "Marta does not argue. She has seen the same curve you have. “Four hundred thousand,” she says, and reaches for the feed isolator anyway. The batch is gone from this moment on.",
          approach: "seek_pattern",
          next: "k8",
        },
        {
          id: "wait",
          label: "Wait ten minutes and watch",
          detail: "It's only gone up five degrees in twenty minutes.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "k7",
        },
        {
          id: "half",
          label: "Wait, but get the quench line hooked up ready",
          detail: "Lose nothing, be ready for everything.",
          correct: false,
          approach: "act_first",
          next: "k7",
        },
        {
          id: "sample",
          label: "Take a sample to the lab first",
          detail: "Find out exactly how much unreacted chemical is in there.",
          correct: false,
          approach: "measure_first",
          next: "k7",
        },
      ],
      consequences: {
        wait: "Ten minutes later it is at 113 and gaining four degrees a minute. In the model, 113°C leaves you about nine minutes — and the jacket needs twelve. You waited your way out of the only fix you had.",
        half: "Hooking up the line is sensible. Waiting while you do it is not: the model says the window shrinks by half every 10°C, and you will spend six of those degrees holding a spanner.",
        sample: "A lab sample takes twenty-five minutes. The model says you have about thirty. You would get a beautiful number back, for a reactor you could no longer save.",
      },
      hints: [
        "Look at what the “time left” bar does as you drag the temperature up.",
        "Compare it against the fixed bar underneath — cooling always needs the same twelve minutes.",
        "The two bars cross at about 114°C. After that, cooling is not a plan.",
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
        caption: "You cannot take heat out fast enough. So stop putting it in.",
        status: "102°C · hands on valves",
      },
      type: "choice",
      text: [
        "The loop is: heat makes rate, rate makes heat. You cannot remove heat fast enough. So the other end of the loop it is.",
        "Marta's hand is on the panel. “Tell me what to hit.”",
      ],
      prompt: "What actually breaks the loop?",
      concept:
        "When you cannot remove heat fast enough, stop the thing that is making it.",
      probe: "Why is that better than the other three?",
      options: [
        {
          id: "quench",
          label: "Kill the feed, then quench with cold solvent",
          detail: "Stop making heat, then dilute what's left so it reacts slowly.",
          correct: true,
          outcome:
            "The feed valve slams shut. Devon’s hand is on the solvent line, waiting on your number — too little and the loop keeps turning, too much and the vessel overflows into the bund.",
          approach: "isolate_variable",
          next: "k9",
        },
        {
          id: "colder",
          label: "Switch to the chilled coolant loop",
          detail: "Colder jacket, more heat removed.",
          correct: false,
          approach: "brute_force",
          next: "k8",
        },
        {
          id: "stir",
          label: "Run the stirrer at maximum",
          detail: "Move heat to the wall faster.",
          correct: false,
          approach: "change_many",
          next: "k8",
        },
        {
          id: "seed",
          label: "Add inhibitor to poison the reaction",
          detail: "Kill the chemistry outright rather than starve it.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "k8",
        },
        {
          id: "vent2",
          label: "Open the emergency vent",
          detail: "Let the pressure out and let it boil off.",
          correct: false,
          approach: "act_first",
          next: "k8",
        },
      ],
      consequences: {
        seed:
          "Devon checks the store. The inhibitor is a twenty-minute delivery from the other side of the site, and it needs mixing in \u2014 which means running the stirrer through a vessel that is already too hot. You do not have twenty minutes.",
        colder:
          "You get the chilled loop on. The climb slows for four minutes, then resumes. You have made the green line steeper. The red line still curves.",
        stir: "Better mixing gets heat to the wall a little quicker, and does nothing about how much heat is being made. The trend barely notices.",
        vent2:
          "Venting takes pressure out, not heat — and the unreacted chemical stays exactly where it is, at the same temperature, in a pot that is now open to the scrubber.",
      },
      hints: [
        "You have two ends of the loop. One of them you have already failed to move.",
        "What is actually producing the heat, and can you stop supplying it?",
        "Cut the feed, then dilute what has already piled up.",
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
        caption: "Enough to stop the loop. Not so much that the vessel overflows.",
        status: "103°C · 700 L of space",
      },
      type: "slider",
      text: [
        "The feed is off. Marta has the cold solvent line cracked open and her hand on the valve.",
        "Below about 110°C this batch calms down on its own. Above it, nothing you own will stop it.",
        "There are 700 litres of empty space in the vessel. Put in more than that and it comes over the top.",
      ],
      prompt: "How much cold solvent goes in?",
      primer: {
        term: "Solvent",
        plain:
          "A cold liquid that takes no part in the reaction. It soaks up heat and pushes the reacting chemicals further apart, so they bump into each other less often.",
        like: "watering down a strong drink — the same amount of syrup, spread through far more liquid.",
      },
      concept:
        "Dilution slows the reaction and soaks up heat — but the vessel has a hard limit.",
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
      driver: { label: "Point of no return", value: 110, unit: "°C" },
      risk: { mode: "ceiling", safeGap: 45 },
      meter: "thermometer",
      target: { min: 450, max: 700 },
      bands: [
        {
          max: 200,
          text: "A splash. The gauge dips one degree, shrugs, and carries on upward. Marta looks at you.",
        },
        {
          max: 425,
          text: "The climb slows and everyone breathes out — then it starts again. Still too much unreacted chemical, still too hot.",
        },
        {
          max: 700,
          text: "The needle stops. Then, for the first time tonight, it goes backwards. Devon puts both hands on the desk and leans on them.",
        },
        {
          max: 900,
          text: "Hot solvent comes over the top of the vessel and onto the bund floor. Nobody is hurt, but the unit is shut for a week and the report will have your name on it.",
        },
      ],
      hints: [
        "Drag it and watch the peak temperature against the 110°C line.",
        "You need the peak under 110°C, and you cannot go past 700 litres.",
        "Somewhere from 450 to 700 litres does both.",
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
        "By 03:40 the gauge reads 88 and is dropping steadily. Marta makes tea in a beaker, which is against about four rules.",
        "Devon sits down heavily. “Right. Explain that to me like I'm the new starter, because I'd have opened the vent.”",
      ],
      prompt: "Why didn't more cooling work?",
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
        caption: "Cold, calm — and still full of the thing that caused all this.",
        status: "04:20 · batch on hold",
      },
      type: "narrative",
      text: [
        "The lab result comes back at 04:20. Marta reads it twice before she hands it over.",
        "Roughly forty per cent of the second chemical never reacted. It is all still in the pot, sitting quietly at 74°C.",
        "Cold, that is harmless. Warm, it is exactly the pile-up that started tonight — only bigger.",
        "Mr. Hollis arrives with his coat over his pyjamas. “Good work. Now finish the batch. That's four hundred thousand dollars of product and the customer is expecting it Friday.”",
        "Devon catches your eye. “Or we dump it and eat the cost.”",
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
        caption: "They all work. They do not all work in time.",
        status: "writing the restart plan",
      },
      type: "reorder",
      text: [
        "Before anyone touches a valve, Mr. Hollis makes you write the restart plan on the board.",
        "“Four ways to bring a temperature down,” he says. “Rank them by how quickly they take effect. That ranking is the whole job.”",
      ],
      prompt: "Which lever acts fastest?",
      instruction: "Order them from the fastest to take effect to the slowest.",
      steps: [
        {
          id: "feed",
          label: "Shut the feed valve",
          detail: "The heat source stops the second it closes.",
        },
        {
          id: "quench",
          label: "Add cold solvent",
          detail: "A minute or two to pump in and mix.",
        },
        {
          id: "jacket",
          label: "Turn the cooling jacket up",
          detail: "Ten to fifteen minutes before the batch really feels it.",
        },
        {
          id: "wait",
          label: "Let it cool down by itself",
          detail: "Hours, and only once the reaction has finished anyway.",
        },
      ],
      wrong:
        "Mr. Hollis shakes his head. “You've put something ahead of the valve. Nothing beats the valve — it's the only one that acts before the heat is even made.”",
      right:
        "“Right,” he says. “And notice the fastest one is free and the slowest one is the one everybody reaches for. That's why tonight happened.”",
      concept:
        "Preventing heat is instant; removing heat always takes time you may not have.",
      probe: "Why is stopping the source faster than any kind of cooling?",
      hints: [
        "Two of these remove heat that already exists. Two of them change how much is made.",
        "Ask how long each one takes between your hand moving and the gauge moving.",
        "Valve → solvent → jacket → time.",
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
        caption: "One decision left, and it is not really a chemistry question.",
        status: "batch on hold · Friday deadline",
      },
      type: "choice",
      text: [
        "The batch is stable at 74°C with a large amount of unreacted chemical in it. Friday is Friday.",
        "The model below is the same two options you have on the desk: put the heat in all at once, or a bit at a time.",
      ],
      prompt: "How do you finish the night?",
      concept:
        "A pile of unreacted material is stored heat; release it slowly or not at all.",
      options: [
        {
          id: "slow",
          label: "Warm it back in small steps",
          detail: "Two degrees at a time, checking the rate settles before the next step.",
          correct: true,
          outcome:
            "You bring it back five degrees at a time, watching the curve after each one. It stays a straight line. At 04:50 the vessel is warm, stable and boring — which is what a reactor is supposed to be.",
          approach: "isolate_variable",
          next: "k14",
        },
        {
          id: "dump",
          label: "Send it to the emergency dump tank",
          detail: "Lose the four hundred thousand. Lose nothing else.",
          correct: true,
          outcome:
            "The dump valve opens and four tonnes of hot mixture drops into a tank built for exactly this, spread thin and cold within seconds. Devon exhales for the first time in an hour.",
          approach: "act_first",
          next: "k14",
        },
        {
          id: "straight",
          label: "Heat it straight back to 70°C and let it run",
          detail: "It was fine at 70 all week. Catch up on the schedule.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "k13",
        },
        {
          id: "overnight",
          label: "Leave it cold and hand it to the morning shift",
          detail: "Not your problem in ninety minutes.",
          correct: false,
          approach: "follow_authority",
          next: "k13",
        },
      ],
      consequences: {
        straight:
          "Look at the “pour it all in” trace in the model. That is what forty per cent of unreacted chemical does when you hand it the energy to react all at once — except this time it is already in the pot.",
        overnight:
          "It is not stable, it is slow. It is still reacting gently, still warming, with nobody watching it and a shift that has not been told what is in there. Devon says, quietly, “I'm not signing that handover.”",
      },
      hints: [
        "The danger is not the temperature. It is the unreacted chemical waiting for a reason to go.",
        "In the model, what makes the difference is how quickly the reaction is allowed to happen.",
        "Either release it slowly and watch, or do not release it at all.",
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
        "At 06:30 the day shift walks in to a reactor sitting calmly at 71°C and a handover sheet three pages long.",
        "Mr. Hollis reads the last line out loud: “Root cause — feed pump ran at double rate for eleven minutes. Fix — wire the pump to the temperature reading so it shuts itself off.”",
        "“Eleven minutes,” he says. “Four hours of your night, and one line of code to make sure it never happens again.”",
        "Marta has already put the request in for it. Devon is asleep in a plastic chair.",
        "Outside, it is getting light over the tank farm.",
      ],
      outcome: "success",
    },
  ],
};
