import type { Scenario } from "@/types/story";

/**
 * Act 1 follows one question: why is a small wind making a large bounce?
 * Act 2 uses that answer to make the bridge safe for the moment.
 * Act 3 changes the wind, so the learner sees why the gap matters more than
 * the first fix that opened it.
 *
 * Two beats are judgement calls rather than physics puzzles (s4 closing the
 * bridge, s13 the permanent fix). They are what an engineer on call actually
 * spends the night deciding.
 *
 * Wrong options point `next` back at their own scene: the engine shows the
 * consequence, then returns the learner to the same decision with that option
 * marked as already tried.
 */
export const resonanceBridge: Scenario = {
  id: "resonance-bridge",
  title: "Save the Bridge",
  tagline: "4 a.m. The bridge is bouncing. Everyone is looking at you.",
  blurb:
    "An eleven-day-old bridge is swinging like a diving board in a steady wind, and the storm behind it arrives in two hours. You are the engineer on call. Nobody can tell you why a gentle breeze is doing this, so you have to find the rhythm behind it before the weather turns.",
  art: {
    alt: "A slender modern bridge deck at night under floodlights, visibly rippling mid-span, with rain starting and a storm front massing over the water behind it.",
  },
  domain: "physics",
  difficulty: "easy",
  learningGoal:
    "Learn how matching rhythms make movement grow — and the two ways to break the match.",
  takeaway: {
    concept: "Resonance",
    field: "Physics",
    inOneLine:
      "Every object has a rhythm. Small pushes on that rhythm add up into big movement.",
    rule:
      "Movement grows on well-timed force, not big force. Open a gap or break the pushes.",
    elsewhere: [
      "A singer’s steady note can crack a wine glass on the same pitch.",
      "A microphone near its speaker turns a hum into a squeal.",
      "Tuning a radio moves its rhythm onto one station.",
    ],
    youUsedIt: [
      "You measured the deck and gusts before touching anything.",
      "You added weight to move the deck off the wind’s beat.",
      "You changed course when the storm found the slower beat.",
    ],
  },
  minutes: 6,
  stageLabel: "Aetherfall live",
  partnerGreeting:
    "I’ll stay on the line. You handle the bridge; I’ll notice the interesting moves.",
  intro: {
    role: "engineer on call",
    cta: "Step onto the bridge",
    text: [
      "The Aetherfall bridge opened eleven days ago.",
      "At 4:12 a.m., Nadia calls: “The bridge is bouncing like a diving board.”",
      "You are on call. Storm is two hours out.",
    ],
    visual: {
      kind: "bridge",
      title: "Aetherfall, eleven days old",
      caption: "A brand new bridge doing something a bridge should not do.",
      status: "04:12 · storm near 06:10",
    },
  },
  preSession: {
    prompt:
      "You do not know why the bridge is moving yet. What do you do first?",
    options: [
      {
        id: "measure",
        label: "Get numbers before anything else",
        approach: "measure_first",
      },
      {
        id: "hypothesis",
        label: "Try your best guess, then test it",
        approach: "commit_to_hypothesis",
      },
      {
        id: "clue",
        label: "Look for one clue that explains it",
        approach: "seek_pattern",
      },
      {
        id: "act",
        label: "Do something safe immediately",
        approach: "act_first",
      },
    ],
  },
  startScene: "s4",
  scenes: [
    /* ---------------- ACT 1 — DIAGNOSE ---------------- */
    {
      id: "s4",
      act: 1,
      mood: "alarm",
      beat: "Who’s on the deck",
      visual: {
        kind: "bridge",
        title: "40 mm became 310 mm",
        caption: "The movement is growing fast. People are still on the deck.",
        status: "04:52 · deck 310 mm",
      },
      type: "choice",
      text: [
        "You reach the site office at 4:44. Nadia meets you at the door — Tobi, the crew foreman, is holding his people at the near end of the deck.",
        "Deck sensors show one rhythm: 1.20 bounces a second. So do the gusts. 📈",
        "The deck moved 40 mm an hour ago. Now 310 mm — and Tobi’s crew is still out there.",
      ],
      prompt: "What’s your call?",
      concept:
        "When something is growing and you don’t yet know why, protect people before schedule.",
      options: [
        {
          id: "close",
          label: "Close the bridge, clear the deck",
          correct: true,
          outcome:
            "Barriers go up at both ends. Tobi walks his crew off, and the deck sits empty as the storm builds toward six a.m.",
          next: "s5",
        },
        {
          id: "onelane",
          label: "Keep one lane open",
          correct: false,
          next: "s4",
        },
        {
          id: "wait",
          label: "Wait for more data",
          correct: false,
          next: "s4",
        },
        {
          id: "kiran",
          label: "Ask the city office",
          correct: false,
          approach: "follow_authority",
          next: "s4",
        },
      ],
      consequences: {
        onelane:
          "One lane stays open. A van reaches the middle just as the deck jumps. Nadia closes it herself. “People first.”",
        wait: "You wait. The movement climbs from 310 to 380 mm. A tool case slides across the deck.",
        kiran:
          "The city office writes a line about “routine checks.” It does not move anyone off the deck.",
      },
      hints: [
        "What happens if the next bounce is much bigger?",
        "The movement grew almost eight times in one hour.",
        "Close the bridge and clear the deck. You can reopen later.",
      ],
    },
    {
      id: "s5",
      act: 1,
      mood: "tense",
      beat: "Diagnosis",
      visual: {
        kind: "scan",
        title: "Same wind. Much bigger bounce.",
        caption: "The force stayed the same. The timing did not.",
        status: "bridge closed · deck rising",
      },
      trivia: {
        emoji: "🥾",
        title: "Soldiers break step",
        text: "Soldiers break step on footbridges. If every boot hit on one beat, pushes match the bridge’s rhythm.",
      },
      type: "choice",
      simulation: "timed-pushes",
      simGuide: {
        shows:
          "A wavy line ripples across the panel — that is the deck, moving. A number at the bottom right shows how far it swings, before and after: 40 → 310 mm, or 40 → 18 mm.",
        move:
          "Tap the two pill buttons side by side. “Push in time” hits on the deck’s own beat; “Push off-beat” hits against it.",
        watch:
          "Push in time and the wave swells while the number reads 40 → 310 mm in red — that stacking-up is resonance. Push off-beat and the wave flattens and the number falls to 40 → 18 mm.",
      },
      text: [
        "The wind log is flat. Same wind, bigger bounce, same rhythm. 💨",
        "Dr. Vance, the city’s bridge consultant, is at the console already. She taps the deck’s edge vents on the schematic — narrow slots meant to chop steady wind, sealed shut since opening.",
        "Try the model: push in time first, then off the beat. Pushes that land on the deck’s own rhythm stack up. That is resonance.",
      ],
      primer: {
        term: "Rhythm",
        plain:
          "Every object has one speed it likes to wobble at. It comes back to that speed.",
        like: "a wine glass rings at one note however you tap it.",
      },
      prompt: "Why does the bounce keep growing?",
      concept: "A push that arrives in time with the movement adds to it.",
      options: [
        {
          id: "stronger",
          label: "The wind must be picking up",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s5",
        },
        {
          id: "phase",
          label: "The gusts match the deck’s rhythm",
          detail: "Each push adds up.",
          correct: true,
          outcome:
            "Dr. Vance goes quiet. “The bridge is played like an instrument.”",
          approach: "seek_pattern",
          next: "s6b",
        },
        {
          id: "fatigue",
          label: "The steel is giving way",
          correct: false,
          approach: "brute_force",
          next: "s5",
        },
        {
          id: "cables2",
          label: "A cable is losing tension",
          correct: false,
          approach: "brute_force",
          next: "s5",
        },
      ],
      consequences: {
        stronger:
          "The wind log is flat. Same wind, much bigger bounce. More force is not the answer.",
        fatigue:
          "Tobi checks the steel. No cracks. The deck keeps the same rhythm.",
        cables2:
          "Every cable is tight. Nothing is loose. The pushes are adding energy.",
      },
      hints: [
        "The wind did not get stronger. Look at the two rhythms.",
        "Both rhythms are 1.20 times a second.",
        "A push at the right time adds to the movement already there.",
      ],
    },
    {
      id: "s6b",
      act: 1,
      mood: "insight",
      beat: "The chain",
      visual: {
        kind: "resonance",
        title: "Say it back to her",
        caption: "Five things happened, one after the other.",
        status: "Dr. Vance is listening",
      },
      type: "reorder",
      text: [
        "Dr. Vance won’t sign off on the fix until you say the chain of resonance back to her. 🎠",
      ],
      primer: {
        term: "Resonance",
        plain:
          "Resonance is when pushes arrive in time with a thing’s own rhythm. Each push adds, so tiny forces grow.",
        like: "pushing a child on a swing — you aren’t strong, just well timed.",
      },
      prompt: "How did a light breeze turn into a bouncing bridge?",
      instruction: "Put the five steps in order.",
      steps: [
        {
          id: "gusts",
          label: "Gusts hit at a steady rhythm",
        },
        {
          id: "match",
          label: "That rhythm matches the deck’s own bounce",
        },
        {
          id: "timing",
          label: "Each gust lands as the deck moves that way",
        },
        {
          id: "add",
          label: "Each gust adds to the movement",
        },
        {
          id: "grow",
          label: "The bounce gets bigger with every push",
        },
      ],
      wrong:
        "Dr. Vance stops you. “That order does not work. Something has to come before the deck can start growing.”",
      right: "“That’s the resonance chain. Now use it to break the match — either move the deck, or break the wind’s beat.”",
      concept:
        "Resonance is a chain: matching rhythm, then good timing, then growth.",
      probe: "Which step is the one you could actually change tonight?",
      hints: [
        "Start with what was there before the bridge started moving.",
        "The wind’s rhythm and the deck’s rhythm must match before timing can matter.",
        "Gusts → match → timing → pushes add up → bounce grows.",
      ],
      next: "s8",
    },

    /* ---------------- ACT 2 — INTERVENE ---------------- */
    {
      id: "s8",
      act: 2,
      mood: "alarm",
      beat: "The hanging weight",
      visual: {
        kind: "weights",
        title: "The crane is waiting",
        caption: "Choose enough weight to break the match — but not too much.",
        status: "crane hooked up · 05:14",
      },
      trivia: {
        emoji: "🏢",
        title: "Taipei’s steel weight",
        text: "In Taipei 101 a huge steel weight hangs on cables. When the tower sways, the weight swings the other way.",
      },
      type: "slider",
      text: [
        "Weight slows the deck. Push its rhythm far from 1.20 and gusts stop adding. 🚧",
        "Big steel weights hang under the deck: more mass, slower bounce, wider gap from the gusts.",
        "Keep a separation of at least 0.25. Mounts safely hold 52 tonnes.",
      ],
      prompt: "How much weight goes on?",
      primer: {
        term: "Separation",
        plain:
          "The gap between two rhythms. Zero gap and pushes line up; open one and the bounce stops.",
        like: "two people clapping slightly out of sync — they drift apart.",
      },
      concept:
        "Stop resonance by moving the deck’s rhythm away from the wind’s rhythm.",
      probe: "Why that number and not more?",
      slider: {
        label: "Hanging weight",
        unit: "t",
        min: 0,
        max: 70,
        step: 1,
        initial: 0,
      },
      readout: {
        label: "Deck rhythm",
        unit: "/s",
        expr: "natural_frequency",
        params: { baseHz: 1.2, baseMass: 400, massScale: 8 },
        decimals: 2,
      },
      driver: { label: "Gust rhythm", value: 1.2, unit: "/s" },
      risk: { mode: "separation", safeGap: 0.25 },
      meter: "wave",
      target: { min: 30, max: 52 },
      bands: [
        {
          max: 12,
          text: "Rhythms still almost match. The deck climbs.",
        },
        {
          max: 29,
          text: "Closer, but too near. It slows, then grows again.",
        },
        {
          max: 52,
          text: "It holds. Gusts now arrive off-beat.",
        },
        {
          max: 70,
          text: "Load gauge red. Crew pulls the weight before anything tears.",
        },
      ],
      hints: [
        "Drag the slider and watch the gap between the two rhythms.",
        "You need a gap of 0.25 or more, and no more than 52 tonnes.",
        "A weight from 30 to 52 tonnes does both.",
      ],
      next: "s9",
    },
    {
      id: "s9",
      act: 2,
      mood: "calm",
      beat: "Debrief",
      visual: {
        kind: "weights",
        title: "The bridge goes still",
        caption: "The danger is down. The storm is still coming.",
        status: "05:31 · storm in 40 min",
      },
      type: "reflect",
      text: [
        "By 5:31 the deck is nearly still. Nadia hands you coffee. ☕",
        "Dr. Vance leans on the rail. “The storm is 40 minutes out. Say what still worries you.”",
      ],
      prompt: "What still worries you before the storm hits?",
      placeholder: "One or two plain sentences.",
      next: "s11",
    },

    /* ---------------- ACT 3 — THE FIX BREAKS ---------------- */
    {
      id: "s11",
      act: 3,
      mood: "alarm",
      beat: "The real lesson",
      visual: {
        kind: "storm",
        title: "The fix is feeding the bounce",
        caption: "The storm owns the lower rhythms. You need a new gap.",
        status: "movement doubling · act now",
      },
      type: "choice",
      simulation: "storm-band",
      simGuide: {
        shows:
          "The bar covers every possible bounce speed for the deck, from slow on the left to fast on the right. The red patch marks the range of rhythms the storm is pushing at, from 0.83 to 0.95 per second.",
        move: "Drag the slider to move the deck’s own rhythm along the bar. Or tap the presets: With weight lands the marker at 0.89, Weight off returns it to 1.20.",
        watch:
          "Inside the red band the storm’s pushes fall in time with the deck and the swing grows. Slide the marker clear of the band and the label turns safe.",
      },
      text: [
        "Storm’s early. Its rhythm now sits at 0.83–0.95. 🚨",
        "Your weighted deck is inside the band. Move the marker in the model to find a safe gap.",
      ],
      prompt: "What now?",
      primer: {
        term: "A band of rhythms",
        plain:
          "A storm doesn’t push at one speed. It spreads across a range, so beats can still land right.",
        like: "a radio station smeared across the dial.",
      },
      concept:
        "Resonance is about the gap between two rhythms. You can open that gap from either side.",
      options: [
        {
          id: "more",
          label: "Add more weight, go lower",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s11",
        },
        {
          id: "remove",
          label: "Take the weight off",
          detail: "Return the deck to 1.20.",
          correct: true,
          outcome:
            "Tobi lifts the weight. Deck rhythm climbs above the storm band.",
          approach: "abandon_hypothesis",
          next: "s13",
        },
        {
          id: "vents",
          label: "Open the wind vents",
          detail: "Chop up the gusts.",
          correct: true,
          outcome:
            "The vents crank open. The airflow breaks into messy chops, so no steady beat.",
          approach: "seek_pattern",
          next: "s13",
        },
        {
          id: "nothing",
          label: "Keep the current setup",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s11",
        },
      ],
      consequences: {
        more: "To get below 0.83 you need more than 60 tonnes. Mounts only hold 52. Tobi shakes his head.",
        nothing:
          "You wait. The deck climbs from 90 to 240 mm in four minutes. A barrier bolt snaps.",
      },
      hints: [
        "The lower rhythms are dangerous now. Can you move the deck the other way?",
        "The storm stops at 0.95. The deck started at 1.20.",
        "Take the weight off. The deck returns to 1.20, above the storm.",
      ],
    },
    {
      id: "s13",
      act: 3,
      mood: "resolve",
      beat: "The report",
      visual: {
        kind: "dawn",
        title: "09:00 — choose the permanent fix",
        caption: "The next storm will have a different rhythm.",
        status: "storm gone · report due",
      },
      trivia: {
        emoji: "🔧",
        title: "Fixing the wobble",
        text: "London’s Millennium Bridge shut two years while engineers bolted on a permanent set of dampers. Calm since 2002.",
      },
      primer: {
        term: "Permanent fix",
        plain:
          "A repair that keeps helping when weather changes. Not one tuned to tonight’s numbers.",
        like: "a raincoat, not a towel for one puddle.",
      },
      type: "choice",
      text: [
        "By 6:40 the siren stops. Sunlight reaches the deck; the bridge holds through dawn. 🌅",
        "The city wants a permanent fix — one for winds you haven’t seen yet.",
      ],
      prompt: "What goes in the report?",
      concept:
        "A permanent fix has to break the match for every driving rhythm, not just last night’s.",
      options: [
        {
          id: "damper",
          label: "Fit the damper that got cut",
          detail: "A weight that pushes back on every bounce.",
          correct: true,
          outcome:
            "Dr. Vance signs. The damper pulls against any bounce; the bridge can’t feed itself.",
          approach: "seek_pattern",
          next: "s14",
        },
        {
          id: "fairings",
          label: "Reshape the deck edges",
          detail: "Break the steady rhythm.",
          correct: true,
          outcome:
            "Dr. Vance nods. Reshaped edges break up the gusts before they form a beat.",
          approach: "seek_pattern",
          next: "s14",
        },
        {
          id: "heavier",
          label: "Bolt weights on permanently",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s13",
        },
        {
          id: "forecast",
          label: "Close in every wind forecast",
          correct: false,
          approach: "act_first",
          next: "s13",
        },
      ],
      consequences: {
        heavier:
          "That fixes only one wind. Another wind can match the new deck rhythm.",
        forecast:
          "Closing avoids the danger but does not fix it. The city would own a bridge it cannot trust.",
      },
      hints: [
        "Last night you fixed one wind. The next may have a new rhythm.",
        "Choose something that reacts to the deck, or stops the gusts forming a rhythm.",
        "Fit the damper, or reshape the deck edges.",
      ],
    },
    {
      id: "s14",
      act: 3,
      mood: "resolve",
      beat: "After",
      visual: {
        kind: "dawn",
        title: "Open at noon",
        caption: "The bridge is calm. The permanent work starts tomorrow.",
        status: "12:00 · bridge open",
      },
      type: "ending",
      outcome: "success",
      text: [
        "The Aetherfall bridge reopens at noon. 🌞 Nadia radios Tobi from the middle span — the deck is quiet under her feet.",
        "You broke the match twice tonight: once with weight, once by taking it back off. Tomorrow the permanent fix begins.",
      ],
    },
  ],
};
