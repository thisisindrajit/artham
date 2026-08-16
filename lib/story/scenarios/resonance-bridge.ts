import type { Scenario } from "../types";

/**
 * Act 1 diagnoses, act 2 intervenes, act 3 breaks the learner's fix so the
 * scenario tests whether they understood the *relationship* between the
 * driving frequency and the natural frequency — not just "heavier is safer".
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
      "Every object has a rhythm it prefers to move at. When pushes keep arriving in time with that rhythm, each one adds to the last, so a gentle force builds enormous movement.",
    rule:
      "Big movement does not need a big force — it needs well-timed force. So you don't fix it by making things stronger. You break the match: shift the object's rhythm away from the pushes, or stop the pushes arriving in step.",
    elsewhere: [
      "A singer holding one note until a wine glass shatters — the note matches the glass's rhythm.",
      "A microphone creeping towards its own speaker until a faint hum becomes a scream.",
      "Soldiers breaking step before crossing a footbridge, so their marching never lines up with it.",
      "Tuning a radio: you are moving a circuit's rhythm onto one station's and away from every other.",
    ],
    youUsedIt: [
      "You measured the deck's own rhythm instead of guessing at the wind.",
      "You hung weight to move that rhythm away from the gusts.",
      "You took the weight straight back off when the storm's band swallowed the new rhythm.",
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
      "The Aetherfall Bridge opened eleven days ago.",
      "At 4:12 a.m., Nadia from the night shift calls you.",
      "“The bridge is bouncing,” she says. “Like a diving board.”",
      "You are the engineer on call. A storm is 90 minutes away, and the first buses arrive at 5:30.",
    ],
    visual: {
      kind: "bridge",
      title: "Aetherfall, eleven days old",
      caption: "A brand new bridge doing something a bridge should not do.",
      status: "04:12 · storm in 90 min",
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
        "Floodlights. Cold wind. A hard hat slides across the empty road by itself.",
        "“It started small,” Nadia says. “Now every bounce is bigger.”",
        "Tobi, the foreman, has a crane ready. His crew is still standing on the moving deck.",
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
      text: ["Everyone has a theory. Nobody has a number."],
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
            "Tobi's crew bolts two sensors to the deck and a wind gauge to the north tower. By 4:40 you have numbers instead of theories — and the numbers are stranger than anyone guessed.",
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
          "Two tonnes go on. The deck settles for forty seconds, then comes back worse. Tobi looks down from the crane. “That made it bigger.”",
        cables:
          "The crew tensions a cable. The deck keeps bouncing the same amount, at exactly the same speed. Slack is not the problem.",
        designer:
          "Dr. Vance answers from an airport. “How fast is the deck bouncing? How fast are the gusts?” You have no answer. “Call me when you have those two numbers.”",
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
      type: "narrative",
      text: [
        "By 4:40, the sensors are ready.",
        "The deck bounces 1.20 times a second. That is its own rhythm — like the rhythm of a playground swing.",
        "The gusts also hit 1.20 times a second.",
        "The two rhythms match exactly. Tobi stops chewing his gum.",
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
      type: "choice",
      text: [
        "An hour ago, the deck moved 40 mm. Now it moves 310 mm.",
        "Traffic opens in 38 minutes. Tobi's crew is still on the deck. The hospital says an ambulance may need this route.",
        "Kiran from the mayor's office texts: “Can we keep one lane open?”",
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
            "Barriers go up at both ends. Tobi walks his crew off the deck and Kiran reroutes the buses, unhappily. The bridge is empty, still bouncing — and now it can only cost the city money, not people.",
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
          label: "Ask Kiran how to handle it",
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
          "Kiran is a press officer. He writes you a lovely sentence about “routine monitoring by our engineering team.” The deck keeps bouncing throughout.",
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
        "The deck bounces at its own rhythm, 1.20 times a second, and the gusts repeat at 1.20 too.",
        "The wind is not stronger. But each push lands at just the right time.",
      ],
      primer: {
        term: "Its own rhythm",
        plain:
          "Every object has one speed it prefers to wobble at. Nudge it, let go, and that is the speed it settles into — its size and weight decide it, not you.",
        like: "a wine glass that rings at the same note however hard you tap it.",
      },
      prompt: "Why does the bounce keep growing?",
      concept:
        "Resonance: a push that arrives in time with the movement adds to it.",
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
            "Dr. Vance, on the phone from her kitchen, goes quiet for a long moment. “Say that number again,” she says. “Both of them.” You have just told her the bridge is not breaking. It is being played like an instrument.",
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
      beat: "Resonance",
      visual: {
        kind: "resonance",
        title: "Perfect timing, not big force",
        caption: "Small pushes, perfectly timed, stack into a big one.",
        status: "cause found · 05:06",
      },
      type: "narrative",
      text: [
        "This is resonance: small pushes become dangerous when they match an object's rhythm.",
        "Think of a swing. A gentle push at the right time makes it climb higher and higher.",
        "The wind is not powerful. Its timing is perfect.",
        "Dr. Vance goes quiet when you give her the numbers. “The first design had a damper — a shock absorber for bridges. It was cut to save money.”",
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
        "“Before I sign off on anything,” Dr. Vance says, “tell me the story of tonight in order. Walk me through the resonance. If you can\u2019t, you don\u2019t know it yet.”",
        "Nadia holds up her phone to record you.",
      ],
      primer: {
        term: "Resonance",
        plain:
          "What happens when pushes arrive in time with an object's own rhythm. Each push adds to the last instead of fighting it, so tiny forces build into huge movement.",
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
        "“Good,” Dr. Vance says. “You didn\u2019t say the wind got stronger, because it didn\u2019t. Now go break the match.”",
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
        "Tobi's weight idea can work now that you know why.",
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
      type: "slider",
      text: [
        "The crane is ready. A joint under the deck slams again. The crew needs your number now.",
        "The gust rhythm is 1.20 times a second. Keep a separation of at least 0.25 between it and the deck. Do not go above 52 tonnes.",
      ],
      prompt: "How much weight goes on?",
      primer: {
        term: "Separation",
        plain:
          "The gap between the two rhythms. When the gap is zero the pushes line up perfectly; open a gap and they start cancelling each other out instead.",
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
          text: "It holds. The deck starts settling because the gusts now arrive at the wrong time.",
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
        "At 5:31, the deck is almost still. Tobi's crew cheers from the road.",
        "Nadia hands you terrible coffee. “Explain that fix without engineer words.”",
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
      type: "narrative",
      text: [
        "At 6:04, the storm arrives twenty minutes early.",
        "The wind turns and hits the bridge from a new direction. Its rhythm now moves between 0.83 and 0.95 times a second.",
        "Your weighted deck sits inside that range. The two rhythms can match again.",
        "The warning siren starts. Movement jumps from 20 to 110 mm in two minutes.",
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
        "The storm fills a band of rhythms from 0.83 to 0.95. The weighted deck is trapped inside it.",
        "Rain hides the far tower. The movement is still rising. You have minutes.",
      ],
      prompt: "What now?",
      primer: {
        term: "A band of rhythms",
        plain:
          "A storm does not push at one steady speed. It pushes at every speed across a stretch, so anything whose own rhythm falls inside that stretch gets hit in time.",
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
            "You call it over the radio and Tobi swings the crane out into the rain. It is the hardest order of the night: undoing, on purpose, the thing that worked an hour ago.",
          approach: "abandon_hypothesis",
          next: "s12",
        },
        {
          id: "vents",
          label: "Open the wind vents",
          detail: "Break up the gusts so they cannot keep one rhythm.",
          correct: true,
          outcome:
            "The vents crank open along the deck edge and the airflow breaks into chop. The gusts are still there — they just cannot arrange themselves into one steady beat any more.",
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
        caption: "Deck at 1.20. Storm below 0.95. The gap is the fix.",
        status: "06:40 · movement falling",
      },
      type: "narrative",
      text: [
        "Tobi removes the weight in driving rain while the deck bucks under the crane.",
        "At 6:40, the deck is back at 1.20. The storm stays below 0.95. The rhythms no longer meet.",
        "The warning siren stops. The movement falls.",
        "Nadia looks at you. “So the fix was undoing the fix?”",
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
      primer: {
        term: "A stopgap",
        plain:
          "a fix that holds only while today's conditions hold. It buys you time, and it stops working the moment the situation changes.",
        like: "a bucket under a leak \u2014 fine tonight, useless in a month.",
      },
      type: "reorder",
      text: [
        "Someone from the city is on the phone asking what happens next. Dr. Vance draws four boxes on the whiteboard.",
        "\u201cRank them,\u201d she says. \u201cNot by how good they are. By how long each one keeps working.\u201d",
        "\u201cTwo of these are stopgaps,\u201d she adds. \u201cThat is not an insult \u2014 a stopgap just comes with an expiry date, and you need to know which end of the list it sits at.\u201d",
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
          detail: "Pushes back against any bounce, whatever its rhythm.",
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
        "\u201cThat\u2019s the order,\u201d she says. \u201cThe last two stop caring what the wind does. That is the difference between a patch and a fix.\u201d",
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
      primer: {
        term: "A damper",
        plain:
          "a heavy weight hung on springs inside the deck. When the deck swings one way the weight lags behind and pulls the other way, so it fights the bounce instead of joining in.",
        like: "someone leaning the opposite way every time a boat rocks.",
      },
      type: "choice",
      text: [
        "By 9 a.m., the storm is gone. Dr. Vance is in the site hut with your readings.",
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
            "Dr. Vance signs it before you finish the sentence. “It was on the drawings in 2019,” she says. “Somebody costed it out at a meeting I wasn't in.”",
          approach: "seek_pattern",
          next: "s14",
        },
        {
          id: "fairings",
          label: "Reshape the deck edges",
          detail: "Change the airflow so gusts cannot form one steady rhythm.",
          correct: true,
          outcome:
            "Dr. Vance nods slowly. “Attack the pushes instead of the bridge. That holds for winds we haven't met yet.” She starts sketching edge profiles on the back of your readings.",
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
        "The Aetherfall Bridge reopens at noon. Nadia finally goes home.",
        "The bridge was not too weak. Its rhythm matched the wind, so small pushes kept adding up.",
        "You broke that match twice, in opposite directions.",
        "Tomorrow, crews begin fitting the permanent fix. Tonight, the bridge is still.",
      ],
    },
  ],
};
