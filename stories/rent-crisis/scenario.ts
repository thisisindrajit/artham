import type { Scenario } from "@/types/story";

/**
 * The tempting answer is a rent cap. That is why the story starts there.
 * A learner drags it, watches the queue grow, and sees the same question
 * the city keeps asking: how many homes exist? Act 3 keeps the answer
 * honest. Building more homes works, but it is slow, so short-term help
 * has to reach the families who cannot wait.
 */
export const rentCrisis: Scenario = {
  id: "rent-crisis",
  title: "Fix the Rent",
  tagline: "You won on one promise. Rent. The council votes in 90 days.",
  blurb:
    "Ninety thousand families in Halden are chasing seventy thousand homes, and you were elected to fix it. A rent cap is already on the table and the whole city wants you to sign it. You have ninety days, four hundred million dollars, and a promise the numbers may not let you keep.",
  art: {
    alt: "A city hall office at dusk overlooking apartment blocks: a housing waiting-list folder open on the desk, a queue of names running off the page.",
  },
  domain: "economics",
  difficulty: "hard",
  learningGoal:
    "Learn why a low legal price cannot create the homes people are waiting for.",
  takeaway: {
    concept: "Price caps and shortages",
    field: "Economics — supply and demand",
    inOneLine:
      "You found 90,000 families, 70,000 rental homes, and a cap that lowered the price on paper without creating the 20,000 missing homes.",
    rule:
      "Holding a price too low grows the line. The fix is more homes. Help those who cannot wait.",
    elsewhere: [
      "Fuel price caps make pump lines longer; the rule lowers the sign, not the fuel.",
      "Cheap concert tickets sell out fast; the hall still has the same seats.",
      "Low water prices in a drought empty the taps; cheap water is not more water.",
    ],
    youUsedIt: [
      "You counted 70,000 homes against 90,000 families before touching a rule.",
      "You saw a $1,500 cap house some families while the queue grew.",
      "You sent most of $400 million to build, plus quick help for the worst cases.",
    ],
  },
  minutes: 7,
  stageLabel: "Halden city hall",
  partnerGreeting:
    "I’ll stay beside you. You run the city, and I’ll watch how you decide.",
  intro: {
    role: "new mayor of Halden",
    cta: "Start at city hall",
    text: [
      "You won by four thousand votes on one promise: lower rent.",
      "Halden has 90,000 families and only 70,000 rental homes at $2,500 a month.",
      "Nora, your chief of staff, meets you at the steps. “Brandt, from the east side, has filed a rent cap bill. Vote in ninety days.”",
    ],
    visual: {
      kind: "city",
      title: "Halden, day one",
      caption: "Twenty thousand families more than there are homes.",
      status: "90 days to the vote",
    },
  },
  preSession: {
    prompt:
      "Everyone already says the answer is a cap. What do you do first?",
    options: [
      {
        id: "numbers",
        label: "Find out what the numbers actually say",
        approach: "measure_first",
      },
      {
        id: "deliver",
        label: "Deliver the promise you were elected on",
        approach: "act_first",
      },
      {
        id: "cause",
        label: "Ask why rent got this high in the first place",
        approach: "seek_pattern",
      },
      {
        id: "consensus",
        label: "Find out what the council will actually pass",
        approach: "follow_authority",
      },
    ],
  },
  startScene: "e1",
  scenes: [
    /* ---------------- ACT 1 — DIAGNOSE ---------------- */
    {
      id: "e1",
      act: 1,
      mood: "night",
      beat: "Day one",
      visual: {
        kind: "city",
        title: "The folder",
        caption: "Twenty thousand names on a list that keeps growing.",
        status: "rent $2,500",
      },
      type: "narrative",
      text: [
        "You open the folder 📄 in your new office. Page one is a list — twenty thousand names, and it grew again this year.",
        "Nora points to Elena, a nurse who sleeps in her car 🚗 after night shifts.",
        "“She is what the gap looks like,” Nora says quietly.",
      ],
      next: "e2",
    },
    {
      id: "e2",
      act: 1,
      mood: "tense",
      beat: "First week",
      visual: {
        kind: "council",
        title: "Everyone has already decided",
        caption: "The bill is written. It just needs your name.",
        status: "day 3 · Brandt waiting",
      },
      type: "choice",
      text: [
        "Brandt knocks with the bill in his hand.",
        "“$1,500 a month, citywide, from next month. Sign it and we win by Friday.”",
      ],
      prompt: "What do you do first?",
      concept:
        "Before capping a price, learn what is producing that price.",
      probe: "Why start there?",
      options: [
        {
          id: "count",
          label: "Count the homes and count the families",
          correct: true,
          outcome:
            "Nora puts the count on the wall. Halden is 20,000 homes short, and the gap grows every winter.",
          approach: "measure_first",
          next: "e4",
        },
        {
          id: "sign",
          label: "Sign Brandt’s bill this week",
          correct: false,
          approach: "act_first",
          next: "e2",
        },
        {
          id: "landlords",
          label: "Pressure the biggest landlords to keep rents steady",
          correct: false,
          approach: "brute_force",
          next: "e2",
        },
        {
          id: "freeze",
          label: "Freeze all rents where they stand for six months",
          correct: false,
          approach: "act_first",
          next: "e2",
        },
        {
          id: "study",
          label: "Order an eighteen-month expert review",
          correct: false,
          approach: "follow_authority",
          next: "e2",
        },
      ],
      consequences: {
        freeze:
          "The pause buys quiet for two weeks. Then the waiting list keeps growing. A softer name still does not add a home.",
        sign:
          "Nora shuts the door. “Before you sign, tell me why rents got this high in the first place.”",
        landlords:
          "They nod and smile. A month later, some flats become tourist rentals instead. You pushed on people who could simply step away.",
        study:
          "Nora taps Elena’s page. “Eighteen months is two more winters in that car. We need numbers now.”",
      },
      hints: [
        "The bill sets a price. Do you know yet what is setting the price now?",
        "Two problems can look the same: not enough homes, or unfair prices.",
        "Count what exists and count who needs it before you pick a number.",
      ],
    },
    {
      id: "e4",
      act: 1,
      mood: "tense",
      beat: "The cap",
      simulation: "price-cap",
      simGuide: {
        shows:
          "Two long horizontal bars stack across the screen: families still looking for a home on top, and homes actually put up for rent below. A number under each bar counts them in thousands.",
        move:
          "Drag the slider under the bars. It runs from $1,000 on the left to $4,000, and sets the highest monthly rent any owner may charge.",
        watch:
          "The slider opens at Brandt’s $1,500 cap. The rented bar shrinks red, the looking bar grows, and a badge counts the families left out.",
      },
      visual: {
        kind: "market",
        title: "What a cap actually does",
        caption: "Drag it down and watch both bars, not just the price.",
        status: "day 9",
      },
      trivia: {
        emoji: "🗽",
        title: "New York’s oldest cap",
        text: "Homes in New York City still fall under a rent rule that started in World War Two.",
      },
      primer: {
        term: "Rent cap",
        plain:
          "A rent cap is a legal maximum. Owners are not allowed to charge more than the cap says, even if renters would pay it.",
        like: "the top line on a road sign that says “no faster than 30”.",
      },
      type: "choice",
      text: [
        "Nora turns the shortage into a live model. One bar shows families looking; the other shows homes offered at the allowed rent.",
      ],
      prompt: "If you cap rent at $1,500, what happens?",
      concept:
        "A price cap changes what people may charge, not how many homes exist.",
      probe: "What surprised you in the model?",
      options: [
        {
          id: "shortage",
          label: "Rent falls on paper, but the queue gets longer",
          correct: true,
          outcome:
            "At $1,500 the offered bar shrinks fast. Nora slides the paper across. “What does the city look like the day after you sign?”",
          approach: "seek_pattern",
          next: "e5",
        },
        {
          id: "everyone",
          label: "Everyone on the list gets a home at $1,500",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e4",
        },
        {
          id: "nothing",
          label: "Nothing much — landlords absorb it",
          correct: false,
          approach: "act_first",
          next: "e4",
        },
        {
          id: "build",
          label: "Rent falls and builders rush in",
          correct: false,
          approach: "change_many",
          next: "e4",
        },
      ],
      consequences: {
        everyone:
          "Slide the model to $1,500. Only 50,000 homes are offered. The cap chose a price, not who gets a key.",
        nothing:
          "Some owners absorb it. Others sell, switch uses, or leave a flat empty. The offered bar falls either way.",
        build:
          "A lower allowed rent makes new building less tempting, not more. Nobody builds flats to charge less.",
      },
      hints: [
        "Move the slider and watch the homes bar, not just the rent number.",
        "Ask what an owner does when the allowed rent feels too low.",
        "The cap sets a price. It does not build anything.",
      ],
    },
    {
      id: "e5",
      act: 1,
      mood: "insight",
      beat: "The chain",
      visual: {
        kind: "queue",
        title: "Brandt wants it in one breath",
        caption: "Five things follow the cap. In this order.",
        status: "day 12 · committee room",
      },
      type: "reorder",
      text: [
        "Brandt points at the 50,000 homes bar.",
        "“Do not wave at a chart. Tell me what happens after I sign.”",
      ],
      prompt: "What follows a cap set below the going rent?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "cap",
          label: "Rent is capped below what it was",
        },
        {
          id: "want",
          label: "The low price brings more families into the hunt",
        },
        {
          id: "withdraw",
          label: "Some owners stop offering homes at that price",
        },
        {
          id: "queue",
          label: "Far more families chase far fewer homes",
        },
        {
          id: "ration",
          label: "Keys go to whoever is fastest or luckiest",
        },
      ],
      wrong:
        "Brandt shakes his head. “The queue cannot grow until people react. Start with the rule.”",
      right:
        "Brandt taps the table. “All right. My people are still in that line. What is your bill?”",
      concept:
        "A low price rule can turn a price problem into a line problem.",
      probe: "Who ends up worse off in that line than before?",
      hints: [
        "Start with the cap itself. Everything else reacts to it.",
        "Two groups react after the cap: families and owners.",
        "Cap → more want in → some homes leave → longer line → luck chooses.",
      ],
      next: "e7",
    },

    /* ---------------- ACT 2 — INTERVENE ---------------- */
    {
      id: "e7",
      act: 2,
      mood: "tense",
      beat: "The other lever",
      simulation: "supply-shift",
      simGuide: {
        shows:
          "Above the slider sits one big number: the rent per month. A smaller sage count shows homes that actually find a family.",
        move:
          "Drag the slider right to unblock more new homes, from zero doors all the way up to sixty thousand.",
        watch:
          "As the slider climbs, empty flats appear, so owners must compete for renters. The rent number falls with no rule set anywhere.",
      },
      visual: {
        kind: "market",
        title: "Nobody is told what to charge",
        caption: "Same rent as the cap — with tens of thousands more homes.",
        status: "day 21",
      },
      primer: {
        term: "Vacancy",
        plain:
          "Vacancy means empty homes waiting for renters. Owners compete for families, so prices fall on their own.",
        like: "the last seat on a full bus, versus many open seats.",
      },
      type: "choice",
      text: [
        "Nora asks what made the gap. Halden built almost nothing in six years — permits and land rules block new homes.",
        "She turns the answer into a new model. Drag the lever and watch the rent number — when a vacancy appears, rent falls with no rule.",
      ],
      prompt: "Why does rent fall in this model without any rule?",
      concept:
        "Rent falls on its own when owners must compete for renters.",
      probe: "Why is this harder to announce than a cap?",
      options: [
        {
          id: "compete",
          label: "Owners have to compete for renters",
          correct: true,
          outcome:
            "Nora writes: lower rent by making homes compete. Now choose how many to unblock.",
          approach: "seek_pattern",
          next: "e8",
        },
        {
          id: "cheapbuild",
          label: "New homes are cheaper to build",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e7",
        },
        {
          id: "generous",
          label: "Builders pass savings on to be fair",
          correct: false,
          approach: "follow_authority",
          next: "e7",
        },
        {
          id: "quality",
          label: "The new homes are worse",
          correct: false,
          approach: "seek_pattern",
          next: "e7",
        },
      ],
      consequences: {
        quality:
          "Nora hides the new homes and checks old flats only. Their rents fall too. Cheap new flats are not the cause.",
        cheapbuild:
          "New homes cost more to build than old homes. Rent still falls in the model, so building cost is not the cause.",
        generous:
          "The builder laughs. “I charge what I can get. The model is about empty homes, not my kindness.”",
      },
      hints: [
        "Nobody in this model is told what to charge. So who changes behaviour?",
        "Think about two families and one flat, then one family and two flats.",
        "A landlord with an empty flat has a reason to lower the price.",
      ],
    },
    {
      id: "e8",
      act: 2,
      mood: "alarm",
      beat: "The building bill",
      visual: {
        kind: "council",
        title: "Counting votes, not homes",
        caption: "Enough homes to matter. Not so many that the vote dies.",
        status: "day 46 · council chamber",
      },
      trivia: {
        emoji: "🗼",
        title: "Tokyo builds anywhere",
        text: "Tokyo lets builders add homes almost anywhere in the city. Its rents have stayed steady as many more people moved in.",
      },
      type: "slider",
      text: [
        "Because competition needs empty homes, Nora turns the model into a bill.",
        "The building bill frees up land and speeds up permits.",
        "Above 44,000 new homes, three council members walk out and the bill fails.",
      ],
      prompt: "How many new homes do you unblock?",
      concept:
        "The fix has to be big enough to lower rent and small enough to pass.",
      probe: "Why not push for the maximum?",
      slider: {
        label: "Homes unblocked",
        unit: "k",
        min: 0,
        max: 60,
        step: 2,
        initial: 0,
      },
      readout: {
        label: "Settled rent",
        unit: "k",
        expr: "market_rent",
        params: {
          demandIntercept: 780 / 7,
          demandSlope: 60 / 7,
          supplyIntercept: 20,
          supplySlope: 20,
        },
        decimals: 2,
      },
      driver: { label: "What families can carry", value: 1.8, unit: "k" },
      risk: { mode: "ceiling", safeGap: 0.9 },
      meter: "market",
      target: { min: 42, max: 44 },
      bands: [
        {
          max: 20,
          text: "A small gesture passes; rent stays above $2,000 and the list barely moves.",
        },
        {
          max: 40,
          text: "Real cranes appear, but rent only just reaches $1,800. Still too tight.",
        },
        {
          max: 44,
          text: "The bill passes 19 to 14. Rent projects below $1,800; first permits go out.",
        },
        {
          max: 60,
          text: "Three council members walk. You aimed too high and unblocked nothing.",
        },
      ],
      hints: [
        "Drag the slider and watch the settled rent against the $1,800 line.",
        "You need rent under $1,800, with no more than 44,000 homes.",
        "Somewhere between 42,000 and 44,000 does both.",
      ],
      next: "e9",
    },
    {
      id: "e9",
      act: 2,
      mood: "calm",
      beat: "Debrief",
      visual: {
        kind: "city-dawn",
        title: "Day 47 — the cranes go up",
        caption: "It passed. Nothing has changed yet.",
        status: "first permits issued",
      },
      type: "reflect",
      text: [
        "The first permits go out before dawn 🌅. By midnight, the vote story is everywhere.",
        "A reporter catches you in the hall. “Mayor, people still owe $2,500 tomorrow. Why is this better than just capping it?”",
      ],
      prompt: "Would you promise the reporter rent falls this year?",
      placeholder: "One or two plain sentences.",
      next: "e10",
    },

    /* ---------------- ACT 3 — THE FIX BREAKS ---------------- */
    {
      id: "e10",
      act: 3,
      mood: "tense",
      beat: "Six months later",
      visual: {
        kind: "queue",
        title: "Cranes are not homes",
        caption: "Elena is still in the car park.",
        status: "month 6 · rent $2,540",
      },
      trivia: {
        emoji: "🏗️",
        title: "Cranes take years",
        text: "A big block of new flats usually takes two or three years to finish. Paperwork can add many more months.",
      },
      type: "narrative",
      text: [
        "Six months on, the cranes are easy to see 🏗️. Not one flat is finished.",
        "Rent is $2,540. Nora shrugs. “Cranes are not homes. Rent falls when a flat sits empty.”",
        "Elena stops you. “I read the bill. Two years is a long car park.”",
        "Nora slides in again. The state has sent $400 million for housing 💰.",
      ],
      next: "e11",
    },
    {
      id: "e11",
      act: 3,
      mood: "alarm",
      beat: "The money",
      simulation: "budget-split",
      simGuide: {
        shows:
          "Two cards sit side by side: families helped now with cash, and homes the money builds. A rent bar underneath shows what everyone in the city ends up paying.",
        move:
          "Drag the slider from “all to building” on the left to “all to cash help” on the right, in ten-percent steps.",
        watch:
          "Push toward cash help and the rent bar climbs red. More renters can now bid more for the same homes, so rent rises for everyone — even families you did not help.",
      },
      visual: {
        kind: "council",
        title: "$400 million, one decision",
        caption: "Everything here helps somebody. Only some of it helps everybody.",
        status: "month 6 · budget meeting",
      },
      type: "choice",
      text: [
        "The $400 million lands while cranes are still only promises.",
        "Brandt makes his case: caps hurt to end, cash help ends by itself.",
        "Try the model before you decide.",
      ],
      prompt: "Where does the money go?",
      primer: {
        term: "Cash help",
        plain:
          "Cash help is public money given to renters for rent. It adds spending power, not homes.",
        like: "handing bidders more money at an auction; still one painting.",
      },
      concept:
        "Money given to renters raises what renters can bid; it does not add a home.",
      probe: "What did the model change your mind about?",
      options: [
        {
          id: "mostly",
          label: "Most into homes, plus quick help for the worst cases",
          correct: true,
          outcome:
            "Most speeds homes; a small fund gets people like Elena indoors that night. The bill passes — but permits, then blocks, then empty flats have to come first. The model already told you the wait is long.",
          approach: "isolate_variable",
          next: "e14",
        },
        {
          id: "cash",
          label: "$400 a month to every housed renter for a year",
          correct: false,
          approach: "act_first",
          next: "e11",
        },
        {
          id: "buy",
          label: "Buy 4,000 existing flats and rent them cheaply",
          correct: false,
          approach: "brute_force",
          next: "e11",
        },
        {
          id: "hold",
          label: "Hold the money until the blocks are finished",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e11",
        },
      ],
      consequences: {
        cash:
          "Slide to all cash help. Rent rises by almost the same amount. Renters can bid more for the same homes.",
        buy: "The city buys 4,000 flats from current owners. Halden still has 70,000 rental homes, so the gap barely changes.",
        hold: "The plan may work in three years. Elena is in a car tonight. A long-run answer still needs a short-run bridge.",
      },
      hints: [
        "Try the two ends of the slider and read the rent, not the headline.",
        "Ask whether each option gives Halden more homes tomorrow.",
        "Money for building adds homes. Money for renters adds bidders.",
      ],
    },
    {
      id: "e14",
      act: 3,
      mood: "resolve",
      beat: "Three years on",
      visual: {
        kind: "city-dawn",
        title: "The tower on Mill Road",
        caption: "Rent $1,780. The waiting list is 2,000 and falling.",
        status: "year 3",
      },
      type: "ending",
      text: [
        "Three years later, the plan has become streets, doors, and keys 🔑.",
        "Rent settles at $1,780; the list is down to 2,000 families.",
        "Elena moved indoors in year two. Her new landlord had cut his rent $180 — the block next door had just opened.",
        "That was the whole lesson. Rent fell because the next flat was empty.",
      ],
      outcome: "success",
    },
  ],
};
