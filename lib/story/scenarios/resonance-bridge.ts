import type { Scenario } from "../types";

/**
 * Act 1 follows one question: why is a small wind making a large bounce?
 * Act 2 uses that answer to make the bridge safe for the moment.
 * Act 3 changes the wind, so the learner sees why the gap matters more than
 * the first fix that opened it.
 *
 * Two beats are deliberately judgement calls rather than physics puzzles (s4
 * closing the bridge, s13 the permanent fix). They are what an engineer on
 * call actually spends the night deciding, and they give the partner something
 * to observe other than whether the learner can do arithmetic.
 *
 * Wrong options point `next` back at their own scene: the engine shows the
 * consequence, then returns the learner to the same decision with that option
 * marked as already tried. No dead ends, no soft-locks.
 */
export const resonanceBridge: Scenario = {
  id: "resonance-bridge",
  title: "Save the Bridge",
  tagline: "4 a.m. The bridge is bouncing. Everyone is looking at you.",
  domain: "physics",
  difficulty: "easy",
  learningGoal:
    "Learn how matching rhythms make movement grow — and the two ways to break the match.",
  takeaway: {
    concept: "Resonance",
    field: "Physics",
    inOneLine:
      "Every object has a rhythm it likes. When small pushes arrive on that beat, each push adds to the last.",
    rule:
      "Big movement does not need a big force. It needs well-timed force. Fix it by opening a gap, or by breaking the steady pushes.",
    elsewhere: [
      "A singer holds one note near a glass. If the note matches, the glass starts to shake.",
      "A microphone near its speaker can turn a tiny hum into a loud squeal.",
      "Soldiers break step on a footbridge, so their feet do not all push on one beat.",
      "Tuning a radio means moving its rhythm onto one station and away from the others.",
    ],
    youUsedIt: [
      "You measured the deck and the gusts before changing anything.",
      "You added weight to move the deck away from the first wind beat.",
      "You changed course when the storm found the new, slower deck beat.",
    ],
  },
  minutes: 10,
  stageLabel: "Aetherfall live",
  partnerGreeting:
    "I'll stay on the line. You handle the bridge; I'll notice the interesting moves.",
  intro: {
    role: "engineer on call",
    cta: "Step onto the bridge",
    text: [
      "The Aetherfall bridge opened eleven days ago.",
      "At 4:12 a.m., Nadia from the night shift calls you.",
      "“The bridge is bouncing,” she says. “Like a diving board.”",
      "You are the engineer on call. A storm is about two hours away, and the first buses arrive at 5:30.",
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
  startScene: "s1",
  scenes: [
    /* ---------------- ACT 1 — DIAGNOSE ---------------- */
    {
      id: "s1",
      act: 1,
      mood: "night",
      beat: "Arrival",
      visual: {
        kind: "bridge",
        title: "04:31",
        caption: "A hard hat is sliding across the road on its own.",
        status: "first buses in 59 min",
      },
      type: "narrative",
      text: [
        "When you reach the bridge, floodlights shine through cold wind.",
        "A hard hat slides across the empty road by itself. 🎩",
        "“It started small,” Nadia says. “Now every bounce is bigger.”",
        "Tobi, the foreman, has a crane ready. His crew is still on the moving deck.",
        "The first airport bus arrives in 59 minutes. Nobody has measured the bounce yet.",
      ],
      next: "s2",
    },
    {
      id: "s2",
      act: 1,
      mood: "tense",
      beat: "First move",
      visual: {
        kind: "bridge",
        title: "Four opinions, zero data",
        caption: "Everyone has a theory. Nobody has a number.",
        status: "crew waiting on you",
      },
      type: "choice",
      text: [
        "The deck keeps jumping under your boots.",
        "Everyone has a theory. Nobody has a number.",
      ],
      prompt: "What do you do first?",
      concept: "Measure a repeating problem before you try to fix it.",
      probe: "Why that first?",
      options: [
        {
          id: "measure",
          label: "Put sensors on the deck",
          detail: "Measure the deck's rhythm and the gusts' rhythm.",
          correct: true,
          outcome:
            "Tobi's crew bolts two sensors to the deck and a wind gauge to the north tower. At 4:40, one screen lights up with two matching lines.",
          approach: "measure_first",
          next: "s3",
        },
        {
          id: "counterweight",
          label: "Let Tobi hang the weights",
          detail: "A heavier bridge may move less.",
          correct: false,
          approach: "act_first",
          next: "s2",
        },
        {
          id: "cables",
          label: "Tighten the main cables",
          detail: "Check whether something came loose.",
          correct: false,
          approach: "brute_force",
          next: "s2",
        },
        {
          id: "designer",
          label: "Wake up the designer",
          detail: "She designed the bridge. Let her decide.",
          correct: false,
          approach: "follow_authority",
          next: "s2",
        },
      ],
      consequences: {
        counterweight:
          "Two tonnes go on. The deck settles for forty seconds, then comes back worse. Tobi looks down from the crane. “We are guessing.”",
        cables:
          "The crew tensions a cable. The deck keeps bouncing the same amount, at exactly the same speed. Slack is not the problem.",
        designer:
          "Dr. Vance answers from a taxi. “How fast is the deck bouncing? How fast are the gusts?” You have no answer yet.",
      },
      hints: [
        "You have guesses, but no numbers. What can you measure?",
        "The bounce repeats. You can count how often it happens.",
        "Measure the deck's rhythm and the gusts' rhythm before changing anything.",
      ],
    },
    {
      id: "s3",
      act: 1,
      mood: "insight",
      beat: "Readings",
      visual: {
        kind: "scan",
        title: "1.20 and 1.20 — a perfect match",
        caption: "Two different sensors show the same rhythm.",
        status: "sensors online · 04:40",
      },
      trivia: {
        emoji: "🎵",
        title: "Swing set physics",
        text: "A playground swing has one rhythm it likes. Push it right on that beat and each shove adds to the last, so it climbs higher.",
      },
      type: "narrative",
      text: [
        "The screen that lit up at 4:40 shows two lines.",
        "The deck bounces 1.20 times a second. That is its own rhythm, like a playground swing.",
        "The gusts also hit 1.20 times a second. 💨",
        "The match explains why every bounce is bigger.",
        "Tobi stops chewing his gum. “People are still standing on that thing.”",
      ],
      next: "s4",
    },
    {
      id: "s4",
      act: 1,
      mood: "alarm",
      beat: "Who's on the deck",
      visual: {
        kind: "bridge",
        title: "40 mm became 310 mm",
        caption: "The movement is growing fast. People are still on the deck.",
        status: "04:52 · deck 310 mm",
      },
      trivia: {
        emoji: "🥾",
        title: "Soldiers break step",
        text: "Marching soldiers are told to break step on old footbridges. If every boot landed at once, the pushes might match the bridge's rhythm and shake it.",
      },
      type: "choice",
      text: [
        "The matching lines would be exciting if the deck were empty.",
        "An hour ago, the deck moved 40 mm. Now it moves 310 mm. 📈",
        "Traffic opens in 38 minutes. Tobi's crew is still on the deck. The hospital says an ambulance may need this route.",
        "The city office texts: “Can we keep one lane open?”",
      ],
      prompt: "What's your call?",
      concept:
        "When something is growing and you don't yet know why, protect people before you protect the schedule.",
      options: [
        {
          id: "close",
          label: "Close the bridge, clear the deck",
          detail: "Nobody on it until you know what this is.",
          correct: true,
          outcome:
            "Barriers go up at both ends. Tobi walks his crew off, and the buses get a longer route. The bridge is empty now, so the next question is the bounce itself.",
          next: "s5",
        },
        {
          id: "onelane",
          label: "Keep one lane open for the morning shift",
          detail: "The ambulance keeps its fastest route.",
          correct: false,
          next: "s4",
        },
        {
          id: "wait",
          label: "Hold off and collect another hour of data",
          detail: "Wait until you understand the cause.",
          correct: false,
          next: "s4",
        },
        {
          id: "kiran",
          label: "Ask the city office how to handle it",
          detail: "Get the messaging right before you do anything visible.",
          correct: false,
          approach: "follow_authority",
          next: "s4",
        },
      ],
      consequences: {
        onelane:
          "One lane stays open. A test van reaches the middle just as the deck jumps. The driver stops and will not move. Nadia closes the bridge herself. “People first.”",
        wait: "You wait. The movement climbs from 310 to 380 mm. A tool case slides into the barrier. The bridge should already be empty.",
        kiran:
          "The city office writes a neat line about “routine checks.” It does not move anyone off the deck. The bounce keeps growing.",
      },
      hints: [
        "What happens if the next bounce is much bigger?",
        "The movement grew almost eight times in one hour.",
        "Close the bridge and clear the deck. You can reopen it later.",
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
      type: "choice",
      simulation: "timed-pushes",
      text: [
        "With the deck empty, you can study the bounce without risking people.",
        "The deck bounces at its own rhythm, 1.20 times a second, and the gusts repeat at 1.20 too.",
        "The wind is not stronger. Each push just lands at the right time.",
        "Try the model below. Push with the deck, then against it, and watch what changes.",
      ],
      primer: {
        term: "Own rhythm",
        plain:
          "Every object has one speed it likes to wobble at. Nudge it, let go, and it settles into that speed.",
        like: "a wine glass that rings at the same note however hard you tap it.",
      },
      prompt: "Why does the bounce keep growing?",
      concept:
        "A push that arrives in time with the movement adds to it.",
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
          label: "The gusts match the deck's rhythm",
          detail: "Each push adds to the movement already there.",
          correct: true,
          outcome:
            "You tell Dr. Vance both numbers over the phone. She goes quiet, then says, “That means the bridge is being played like an instrument.”",
          approach: "seek_pattern",
          next: "s6",
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
          "Tobi checks the steel. No cracks. No bent parts. The deck still keeps the same rhythm.",
        cables2:
          "Every cable is tight. Nothing is coming loose. The pushes are adding energy.",
      },
      hints: [
        "The wind did not get stronger. Look at the two rhythms.",
        "Both rhythms are 1.20 times a second.",
        "A push at the right time adds to the movement already there.",
      ],
    },
    {
      id: "s6",
      act: 1,
      mood: "insight",
      beat: "The match",
      visual: {
        kind: "resonance",
        title: "Perfect timing, not big force",
        caption: "Small pushes, perfectly timed, stack into a big one.",
        status: "cause found · 05:06",
      },
      trivia: {
        emoji: "🌉",
        title: "London's wobbly bridge",
        text: "London's Millennium Bridge opened in June 2000, then shut two days later. Walkers had matched their steps to its slight sway, and the sway grew.",
      },
      type: "narrative",
      text: [
        "Dr. Vance's words make the night click into place.",
        "Small pushes become dangerous when they match an object's rhythm.",
        "Think of a swing. A gentle push at the right time makes it climb higher. 🎠",
        "The wind is not powerful. Its timing is perfect.",
        "“The first design had a shock absorber for the deck,” Dr. Vance says. “It was cut to save money.”",
        "A metal joint slams against its stop below you. “Then tell me how to break the match,” you say.",
      ],
      next: "s6b",
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
        "Dr. Vance will not let you grab the crane until you can say the idea back.",
        "“Tell me the story of tonight in order,” she says. “Walk me through the resonance.”",
        "Nadia holds up her phone to record you.",
      ],
      primer: {
        term: "Resonance",
        plain:
          "Resonance happens when pushes arrive in time with an object's own rhythm. Each push adds, so tiny forces build into huge movement.",
        like: "pushing a child on a swing. You are not strong — you are just well timed.",
      },
      prompt: "How did a light breeze turn into a bouncing bridge?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "gusts",
          label: "Gusts come off the water at a steady rhythm",
          detail: "About 1.2 of them every second, all night.",
        },
        {
          id: "match",
          label: "That rhythm happens to match the deck's own bounce",
          detail: "The deck likes to move at almost exactly the same rate.",
        },
        {
          id: "timing",
          label: "Each gust lands while the deck is already moving that way",
          detail: "Like pushing a swing at just the right moment.",
        },
        {
          id: "add",
          label: "So every gust adds to the movement already there",
        },
        {
          id: "grow",
          label: "The bounce gets bigger with every single push",
        },
      ],
      wrong:
        "Dr. Vance stops you. “That order doesn\u2019t work. Something in the middle has to come before the deck can start growing.” Nadia lowers the phone.",
      right:
        "“Good,” Dr. Vance says. “You did not blame stronger wind. Now use that chain to break the match.”",
      concept:
        "Resonance is a chain: matching rhythm, then good timing, then growth.",
      probe: "Which step is the one you could actually change tonight?",
      hints: [
        "Start with the thing that was there before the bridge started moving.",
        "The wind\u2019s rhythm and the deck\u2019s rhythm have to match before timing can matter.",
        "Gusts \u2192 match \u2192 timing \u2192 pushes add up \u2192 bounce grows.",
      ],
      next: "s7",
    },

    /* ---------------- ACT 2 — INTERVENE ---------------- */
    {
      id: "s7",
      act: 2,
      mood: "tense",
      beat: "The lever",
      visual: {
        kind: "weights",
        title: "Change one of the rhythms",
        caption: "Weight slows the deck down. The amount matters.",
        status: "mounts can hold 52 t",
      },
      type: "narrative",
      text: [
        "Because you can name the chain, Tobi's weight idea finally has a purpose.",
        "Weight makes the deck bounce more slowly. Move its rhythm far enough from 1.20, and the gusts stop adding up.",
        "“How much?” Tobi asks as he climbs into the crane.",
        "The mounts can safely hold 52 tonnes. Any more could tear them out.",
      ],
      next: "s8",
    },
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
        title: "Taipei's steel ball",
        text: "High up in Taipei 101, a huge steel ball hangs on cables. When the tower sways, the ball leans the other way and quiets it.",
      },
      type: "slider",
      text: [
        "Tobi waits in the crane. A joint under the deck slams again. 🚧",
        "The gust rhythm is 1.20 times a second. Keep a separation of at least 0.25 between it and the deck. Do not go above 52 tonnes.",
      ],
      prompt: "How much weight goes on?",
      primer: {
        term: "Separation",
        plain:
          "The gap between two rhythms. When the gap is zero, pushes line up. Open a gap and they stop building the bounce.",
        like: "two people clapping at slightly different speeds — they drift apart instead of building a beat.",
      },
      concept:
        "Stop resonance by moving the deck's rhythm away from the wind's rhythm.",
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
          text: "The rhythms still almost match. The deck keeps climbing. Tobi calls down: “More?”",
        },
        {
          max: 29,
          text: "Closer, but the rhythms are still too near. The movement slows, then starts growing again.",
        },
        {
          max: 52,
          text: "It holds. The deck starts settling because the gusts now arrive at the wrong time. By 5:31, people can breathe again.",
        },
        {
          max: 70,
          text: "The load gauge turns red. The mounts creak. The crew removes the weight before anything tears loose.",
        },
      ],
      hints: [
        "Drag the slider and watch the gap between the two rhythms.",
        "You need a gap of 0.25 or more, with no more than 52 tonnes.",
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
        "By 5:31, the deck is almost still. Tobi's crew cheers from the road.",
        "Nadia hands you terrible coffee. “Tell me why that worked, but use kid words.” ☕",
      ],
      prompt: "Why did the weight actually work?",
      placeholder: "One or two simple sentences.",
      next: "s10",
    },

    /* ---------------- ACT 3 — THE FIX BREAKS ---------------- */
    {
      id: "s10",
      act: 3,
      mood: "alarm",
      beat: "The storm",
      visual: {
        kind: "storm",
        title: "The storm changes the rhythm",
        caption: "The weighted deck now sits inside the storm's danger band.",
        status: "06:04 · storm early",
      },
      trivia: {
        emoji: "🎤",
        title: "Singer breaks a glass",
        text: "A trained singer can shatter a wine glass by holding one steady note. The note matches the glass's own rhythm, so tiny waves stack until the glass cracks.",
      },
      type: "narrative",
      text: [
        "While Nadia is still holding your coffee, the storm arrives seven minutes early.",
        "The wind turns and hits the bridge from a new direction. Its rhythm now moves between 0.83 and 0.95 times a second.",
        "Your weighted deck now sits in that danger range. The two rhythms can match again.",
        "The warning siren starts. Movement jumps from 20 to 110 mm in two minutes. 🚨",
        "Tobi is still in the crane. Your fix has become the new danger.",
      ],
      next: "s11",
    },
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
      text: [
        "The storm fills a band of rhythms from 0.83 to 0.95. The weighted deck is trapped in it.",
        "Rain hides the far tower. The movement is still rising. You have minutes.",
        "Move the deck marker in the model below and find a safe gap before you choose.",
      ],
      prompt: "What now?",
      primer: {
        term: "A band of rhythms",
        plain:
          "A storm does not push at one steady speed. It pushes across a stretch, so some beats can still land at the right time.",
        like: "a radio station that isn't one point on the dial but a whole smear of it.",
      },
      concept:
        "Resonance is about the gap between two rhythms. You can open that gap from either side.",
      options: [
        {
          id: "more",
          label: "Add more weight and go lower",
          detail: "Try to move the deck below 0.83.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s11",
        },
        {
          id: "remove",
          label: "Take the weight back off",
          detail: "Return the deck to 1.20, above the storm range.",
          correct: true,
          outcome:
            "You call it over the radio. As Tobi lifts the weight, the deck's rhythm climbs back toward 1.20, above the storm band.",
          approach: "abandon_hypothesis",
          next: "s12",
        },
        {
          id: "vents",
          label: "Open the wind vents",
          detail: "Break up the gusts so they cannot keep one rhythm.",
          correct: true,
          outcome:
            "The vents crank open along the deck edge. The airflow breaks into messy chops, so the gusts cannot hold one steady beat.",
          approach: "seek_pattern",
          next: "s12",
        },
        {
          id: "nothing",
          label: "Keep the current setup",
          detail: "It worked before. Give it more time.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s11",
        },
      ],
      consequences: {
        more: "To get below 0.83, you need more than 60 tonnes. The mounts can hold only 52. Tobi shakes his head through the rain.",
        nothing:
          "You wait. The deck climbs from 90 to 240 mm in four minutes. A barrier bolt snaps and skips across the road.",
      },
      hints: [
        "The lower rhythms are dangerous now. Can you move the deck the other way?",
        "The storm stops at 0.95. The deck started at 1.20.",
        "Take the weight off. The deck returns to 1.20, above the storm.",
      ],
    },
    {
      id: "s12",
      act: 3,
      mood: "resolve",
      beat: "Dawn",
      visual: {
        kind: "dawn",
        title: "The rhythms split apart",
        caption: "The two rhythms have pulled apart. The gap is the fix.",
        status: "06:40 · movement falling",
      },
      type: "narrative",
      text: [
        "That order becomes real in the driving rain.",
        "By 6:40, the storm no longer finds a steady match.",
        "The warning siren stops. The movement falls. 🌅",
        "Nadia looks at you. “So that's twice tonight you've opened the gap — and never the same way twice.”",
        "“The real fix was the gap. The weight was only one way to make it.”",
      ],
      next: "s12b",
    },
    {
      id: "s12b",
      act: 3,
      mood: "resolve",
      beat: "Triage",
      visual: {
        kind: "dawn",
        title: "The whiteboard in the site hut",
        caption: "Four ideas. Very different shelf lives.",
        status: "07:20 \u00b7 city on the phone",
      },
      primer: [
        {
          term: "A stopgap",
          plain:
            "A fix that holds only while today's conditions hold. It buys time, but it can fail when the situation changes.",
          like: "a bucket under a leak \u2014 fine tonight, useless in a month.",
        },
        {
          term: "A damper",
          plain:
            "A weight on springs that moves late. When the deck swings one way, it pulls the other way.",
          like: "someone leaning the opposite way every time a boat rocks.",
        },
      ],
      type: "reorder",
      text: [
        "After the siren stops, someone from the city asks what happens next.",
        "Dr. Vance draws four boxes on the whiteboard.",
        "\u201cRank them,\u201d she says. \u201cNot by how good they are. By how long each one keeps working.\u201d",
        "\u201cTwo of these are stopgaps,\u201d she adds. \u201cThat is not an insult. A stopgap just comes with an expiry date. You need to know where it sits.\u201d",
      ],
      prompt: "Which fix holds for how long?",
      instruction:
        "Order them from the one that only helps right now, to the one that keeps helping for years.",
      steps: [
        {
          id: "close",
          label: "Close the bridge",
          detail: "Works in ten minutes. Fixes nothing at all.",
        },
        {
          id: "weight",
          label: "Hang weight from the deck",
          detail: "Works tonight, as long as the wind keeps last night's rhythm.",
        },
        {
          id: "damper",
          label: "Bolt on the damper that was cut",
          detail: "Pulls against any bounce, whatever its rhythm.",
        },
        {
          id: "reshape",
          label: "Reshape the deck edges",
          detail: "Stops the wind forming one steady rhythm in the first place.",
        },
      ],
      wrong:
        "Dr. Vance taps the board. \u201cNo. One of those only works for the exact wind we had last night \u2014 and the next storm will not read our notes.\u201d",
      right:
        "\u201cThat\u2019s the order,\u201d she says. \u201cThe last two keep working when the wind changes. Put one of those in the report.\u201d",
      concept:
        "A patch works for one situation; a fix works for situations you have not seen yet.",
      probe: "What makes the last one outlast the others?",
      hints: [
        "Two of these only work for last night\u2019s exact wind.",
        "Ask of each: would this still help if the next storm had a different rhythm?",
        "Close \u2192 weight \u2192 damper \u2192 reshape the deck.",
      ],
      next: "s13",
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
        text: "London's Millennium Bridge stayed shut for almost two years. Engineers bolted on dampers that pull against every sway, and it has stayed calm since 2002.",
      },
      primer: {
        term: "Permanent fix",
        plain:
          "A repair that keeps helping when weather changes. It does not depend on one lucky number from one night.",
        like: "a raincoat instead of one towel for one puddle.",
      },
      type: "choice",
      text: [
        "By 9 a.m., the storm is gone, and the report is due.",
        "Dr. Vance is in the site hut with your readings.",
        "The city needs a permanent fix — one that works in winds you have not seen yet.",
      ],
      prompt: "What goes in the report?",
      concept:
        "A permanent fix has to break the match for every driving rhythm, not just last night's.",
      options: [
        {
          id: "damper",
          label: "Fit the damper that got cut",
          detail: "A moving weight that pushes back whenever the deck bounces.",
          correct: true,
          outcome:
            "Dr. Vance signs it before you finish the sentence. The damper will pull against any bounce, so the bridge will stop feeding itself.",
          approach: "seek_pattern",
          next: "s14",
        },
        {
          id: "fairings",
          label: "Reshape the deck edges",
          detail: "Change the airflow so gusts cannot form one steady rhythm.",
          correct: true,
          outcome:
            "Dr. Vance nods. Reshaped edges will break up the gusts before they form a beat, so the next storm gets less to play.",
          approach: "seek_pattern",
          next: "s14",
        },
        {
          id: "heavier",
          label: "Bolt the weights on permanently",
          detail: "Keep the deck at the rhythm that worked before.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "s13",
        },
        {
          id: "forecast",
          label: "Close the bridge whenever wind is forecast",
          detail: "No traffic in strong wind means no risk.",
          correct: false,
          approach: "act_first",
          next: "s13",
        },
      ],
      consequences: {
        heavier:
          "That fixes only one wind. Another wind can match the new deck rhythm. Dr. Vance says, “We would be back here again.”",
        forecast:
          "Closing the bridge avoids the danger, but it does not fix it. The city would own a bridge it cannot trust.",
      },
      hints: [
        "Last night you fixed one wind. The next wind may have a new rhythm.",
        "Choose something that reacts to the deck, or stops the gusts forming a rhythm.",
        "Fit the damper, or reshape the deck edges. Both work across many winds.",
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
        "The Aetherfall bridge reopens at noon. Nadia finally goes home. 🌞",
        "The bridge was not too weak. Its rhythm matched the wind, so small pushes kept adding up.",
        "You broke that match twice. First you moved the deck. Then you changed course when the storm changed.",
        "Tomorrow, crews begin fitting the permanent fix. Tonight, the bridge is still.",
      ],
    },
  ],
};
