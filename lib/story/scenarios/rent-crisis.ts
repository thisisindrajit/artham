import type { Scenario } from "../types";

/**
 * The tempting answer is a rent cap. That is why the story starts there.
 * A learner can try to lower the number, then see the queue grow. The lesson
 * lands because the city keeps asking the same question: how many homes exist?
 *
 * Act 3 keeps the answer honest. Building more homes works, but it is slow.
 * People like Elena need help before the cranes become keys. The final choice
 * separates help for people from a rule that hides the shortage.
 */
export const rentCrisis: Scenario = {
  id: "rent-crisis",
  title: "Fix the Rent",
  tagline: "You won on one promise. Rent. The council votes in 90 days.",
  domain: "economics",
  difficulty: "hard",
  learningGoal:
    "Learn why a low legal price cannot create the homes people are waiting for.",
  takeaway: {
    concept: "Price caps and shortages",
    field: "Economics — supply and demand",
    inOneLine:
      "You found 90,000 families and 70,000 rental homes. A rent cap lowered the price on paper. It did not create the 20,000 missing homes.",
    rule:
      "When a price is held too low, the line gets longer. The good fix is more homes. Short-term help should go to people who cannot wait.",
    elsewhere: [
      "Fuel price caps can make pump lines longer. The rule lowers the sign, but it does not fill the tanks.",
      "Cheap concert tickets sell out fast. The hall still has the same number of seats.",
      "Low water prices during a drought can empty the taps. The price rule does not make rain.",
      "Cheap college seats still need rooms and teachers. A low fee cannot build a bigger school.",
    ],
    youUsedIt: [
      "You counted 70,000 homes against 90,000 families before changing any rule.",
      "You saw a $1,500 cap help some housed renters, while the list grew longer.",
      "You unblocked 42,000 to 44,000 homes, because that range could pass and lower rent.",
      "You split $400 million toward homes first, with quick help for people who could not wait.",
    ],
  },
  minutes: 12,
  stageLabel: "Halden city hall",
  partnerGreeting:
    "I’ll stay beside you. You run the city, and I’ll watch how you decide.",
  intro: {
    role: "new mayor of Halden",
    cta: "Start at city hall",
    text: [
      "You won by four thousand votes on one promise: lower rent.",
      "Halden has 90,000 families who need rental homes. It has 70,000 rental homes.",
      "The average rent is $2,500 a month. The average family can safely pay $1,800.",
      "Nora, your chief helper, meets you on the steps with a thick folder.",
      "“Brandt has filed a rent cap bill,” she says. “The vote is in ninety days.”",
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
        "You open the folder 📄 in your new office. The first page has only two numbers.",
        "There are 90,000 families looking for rental homes. There are 70,000 homes to rent.",
        "That leaves 20,000 families on the city list. Rent has climbed for six years.",
        "Nora points to one name: Elena, a nurse who sleeps in her car 🚗 after late shifts.",
        "“She is not a strange case,” Nora says. “She is what the gap looks like.”",
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
      primer: {
        term: "Homes and families",
        plain:
          "Homes means places that exist to live in. Families means households that need one. The gap is the real problem.",
        like: "chairs and guests at a party. Music cannot make more chairs.",
      },
      type: "choice",
      text: [
        "The folder is still open when Brandt knocks with the bill in his hand.",
        "“$1,500 a month, citywide, from next month,” he says. “Sign it and we win by Friday.”",
      ],
      prompt: "What do you do first?",
      concept:
        "Before fixing a price, find out what is actually producing that price.",
      probe: "Why start there?",
      options: [
        {
          id: "count",
          label: "Count the homes and count the families",
          detail: "See whether Halden has a price problem or a home problem.",
          correct: true,
          outcome:
            "Nora puts the two counts on the wall. The room sees 90,000 families and 70,000 homes. Now the next question is simple: what made the gap?",
          approach: "measure_first",
          next: "e3",
        },
        {
          id: "sign",
          label: "Sign Brandt’s bill this week",
          detail: "You promised. Deliver it before anyone argues again.",
          correct: false,
          approach: "act_first",
          next: "e2",
        },
        {
          id: "landlords",
          label: "Call in the biggest landlords and lean on them",
          detail: "Ask them, firmly, to hold rents where they are.",
          correct: false,
          approach: "brute_force",
          next: "e2",
        },
        {
          id: "freeze",
          label: "Freeze rents where they stand for six months",
          detail: "Not a cap, just a pause.",
          correct: false,
          approach: "act_first",
          next: "e2",
        },
        {
          id: "study",
          label: "Order an eighteen-month expert review",
          detail: "Nobody can attack you for wanting proof.",
          correct: false,
          approach: "follow_authority",
          next: "e2",
        },
      ],
      consequences: {
        freeze:
          "The pause buys quiet for two weeks. Then the list keeps growing. A softer name still does not tell you whether Halden lacks money or homes.",
        sign: "Nora closes the door. “Before you sign, answer one thing. Are rents high because homes are scarce, or for some other reason?”",
        landlords:
          "They nod and smile. A month later, some flats become short-stay rentals. You pushed on people who could simply step away.",
        study:
          "Nora taps Elena’s page. “Eighteen months is two more winters in that car. We need numbers now, not a shelf of reports.”",
      },
      hints: [
        "The bill sets a price. Do you know yet what is setting the price now?",
        "Two problems can look the same: not enough homes, or unfair prices.",
        "Count what exists and count who needs it before you choose a number.",
      ],
    },
    {
      id: "e3",
      act: 1,
      mood: "alarm",
      beat: "The numbers",
      visual: {
        kind: "market",
        title: "Two numbers that don’t meet",
        caption: "90,000 families. 70,000 homes to rent.",
        status: "1,200 built last year",
      },
      type: "narrative",
      text: [
        "Nora’s team spends four days checking the gap. The answer does not change.",
        "Halden has 70,000 rental homes. About 90,000 families want one.",
        "Last year the city built 1,200 homes. In the same year, 3,000 new families joined the search.",
        "The reason is on the last page. A building permit takes almost five years ⏳.",
        "“So rent is high because 20,000 homes are missing,” you say. “A cap does not build them.”",
      ],
      next: "e4",
    },
    {
      id: "e4",
      act: 1,
      mood: "tense",
      beat: "The cap",
      simulation: "price-cap",
      visual: {
        kind: "market",
        title: "What a cap actually does",
        caption: "Drag it down and watch both bars, not just the price.",
        status: "day 9",
      },
      trivia: {
        emoji: "🗽",
        title: "New York's oldest cap",
        text: "Some homes in New York City still fall under a rent rule that started during World War Two.",
      },
      type: "choice",
      text: [
        "Because the cap is still on the table, Nora turns the shortage into a model.",
        "One bar is families looking. One bar is homes offered for rent.",
        "Drag the price cap before you answer. Watch whether the bars move toward each other.",
      ],
      prompt: "If you cap rent at $1,500, what happens?",
      primer: [
        {
          term: "A shortage",
          plain:
            "A shortage means more people want a thing than there are things to share. Someone still misses out.",
          like: "twenty children and twelve chairs. The chair price was not the main problem.",
        },
        {
          term: "A price cap",
          plain:
            "A price cap is a rule that sets the most someone may charge. It changes the price tag, not the amount.",
          like: "a cheap ticket rule for a hall. The hall still has the same seats.",
        },
      ],
      concept:
        "A price cap changes what people may charge, not how many homes exist.",
      probe: "What surprised you in the model?",
      options: [
        {
          id: "shortage",
          label: "Rent falls on paper, but the queue gets longer",
          detail: "Some housed families pay less. Many waiting families get nothing.",
          correct: true,
          outcome:
            "Brandt stares at the bars. At $1,500, only 50,000 homes are offered. The next task is to explain that chain in plain order.",
          approach: "seek_pattern",
          next: "e5",
        },
        {
          id: "everyone",
          label: "Everyone on the list gets a home at $1,500",
          detail: "That is the whole point of the bill.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e4",
        },
        {
          id: "nothing",
          label: "Nothing much — landlords absorb it",
          detail: "They have made enough. They will cope.",
          correct: false,
          approach: "act_first",
          next: "e4",
        },
        {
          id: "build",
          label: "Rent falls and builders rush in",
          detail: "A cheaper city brings more building.",
          correct: false,
          approach: "change_many",
          next: "e4",
        },
      ],
      consequences: {
        everyone:
          "Slide the model to $1,500. The offered homes bar drops to 50,000. The cap chose a price, but not who gets a key.",
        nothing:
          "Some owners absorb it. Others sell, switch uses, or leave a flat empty. The offered homes bar falls either way.",
        build:
          "Watch the model again. A lower allowed rent makes new building less tempting, not more. Nobody builds flats to charge less.",
      },
      hints: [
        "Move the cap and watch the homes bar, not just the rent number.",
        "Ask what an owner does when the allowed rent feels too low.",
        "The cap sets the price. It does not build anything.",
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
      trivia: {
        emoji: "⏳",
        title: "Stockholm's long queue",
        text: "In Stockholm people join a public list for cheap rent-controlled flats. The wait can stretch past ten years downtown.",
      },
      type: "reorder",
      text: [
        "You bring the model to the small committee room. Brandt points at the 50,000 homes bar.",
        "“Do not wave at a chart,” he says. “Tell me what happens after I sign, step by step.”",
      ],
      prompt: "What follows a cap set below the going rent?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "cap",
          label: "Rent is capped below what it was",
          detail: "$1,500, when the average rent was $2,500.",
        },
        {
          id: "want",
          label: "The low price brings more families into the hunt",
          detail: "Some people who were sharing now try for their own place.",
        },
        {
          id: "withdraw",
          label: "Some owners stop offering homes at that price",
          detail: "They sell, switch uses, or leave a home empty.",
        },
        {
          id: "queue",
          label: "Far more families chase far fewer homes",
        },
        {
          id: "ration",
          label: "Keys go to whoever is fastest or luckiest",
          detail: "The line decides now, not the price.",
        },
      ],
      wrong:
        "Brandt shakes his head. “The queue cannot grow until people react to the cap. Start with the rule, then follow the reactions.”",
      right:
        "The room goes quiet. Brandt taps the table. “All right. My people are still in that line. What is your bill?”",
      concept:
        "A low price rule can turn a price problem into a line problem.",
      probe: "Who ends up worse off in that line than before?",
      hints: [
        "Start with the cap itself. Everything else reacts to it.",
        "Two groups react after the cap: families and owners.",
        "Cap → more want in → some homes leave → longer line → luck chooses.",
      ],
      next: "e6",
    },
    {
      id: "e6",
      act: 1,
      mood: "insight",
      beat: "The real problem",
      visual: {
        kind: "city",
        title: "Twenty thousand missing homes",
        caption: "The price was the symptom. This is the disease.",
        status: "day 14",
      },
      type: "narrative",
      text: [
        "Brandt’s question stays on the table after the meeting. You write one line under it.",
        "90,000 families. 70,000 rental homes. 20,000 missing homes.",
        "Every argument has been about $2,500. None of those arguments added a door 🚪.",
        "A builder at the back raises his hand. He says he has land for 11,000 homes.",
        "“The first 3,000 have waited four years for permits,” he says. Now you know the other lever.",
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
      visual: {
        kind: "market",
        title: "Nobody is told what to charge",
        caption: "Same rent as the cap — with tens of thousands more homes.",
        status: "day 21",
      },
      trivia: {
        emoji: "🌉",
        title: "A San Francisco study",
        text: "A study of San Francisco found that after the city widened its rent rules in 1994, some owners rented out fewer flats.",
      },
      primer: {
        term: "Vacancy",
        plain:
          "Vacancy means empty homes waiting for renters. When some homes sit empty, owners compete for families and prices fall.",
        like: "the last seat on a full bus compared with many open seats.",
      },
      type: "choice",
      text: [
        "The permit problem becomes Nora’s next model. This time the lever adds homes instead of capping rent.",
        "Drag it and watch the vacancy line. That line shows homes with nobody in them.",
        "When the line rises, rent moves without a price rule 📉.",
      ],
      prompt: "Why does rent fall in this model without a single rule?",
      concept:
        "Rent falls on its own when owners must compete for renters.",
      probe: "Why is this harder to announce than a cap?",
      options: [
        {
          id: "compete",
          label: "Owners have to compete for renters",
          detail: "When homes sit empty, owners lower prices to fill them.",
          correct: true,
          outcome:
            "Nora writes the lesson under the model: lower rent by making homes compete for families. The next step is choosing how many homes to unblock.",
          approach: "seek_pattern",
          next: "e8",
        },
        {
          id: "cheapbuild",
          label: "New homes are cheaper to build",
          detail: "Modern building must cost less.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e7",
        },
        {
          id: "generous",
          label: "Builders pass savings on to be fair",
          detail: "The builder sounded reasonable enough.",
          correct: false,
          approach: "follow_authority",
          next: "e7",
        },
        {
          id: "quality",
          label: "The new homes are worse",
          detail: "Cheap flats drag the average down.",
          correct: false,
          approach: "seek_pattern",
          next: "e7",
        },
        {
          id: "nobody",
          label: "It does not really fall",
          detail: "The model is just too hopeful.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "e7",
        },
      ],
      consequences: {
        quality:
          "Nora hides the new homes and checks old flats only. Their rents fall too. The cause is not cheap new flats.",
        cheapbuild:
          "New homes cost more to build than old homes. Rent still falls in the model, so building cost is not the cause.",
        generous:
          "The builder laughs. “I charge what I can get. The model is about empty homes, not my kindness.”",
        nobody:
          "New flats can be costly, and rent still falls. A family moving into one leaves another home behind.",
      },
      hints: [
        "Nobody in this model is told what to charge. So who changes behavior?",
        "Think about two families and one flat, then one family and two flats.",
        "A landlord with an empty flat has a reason to lower the price.",
      ],
    },
    {
      id: "e8",
      act: 2,
      mood: "alarm",
      beat: "The rezoning",
      visual: {
        kind: "council",
        title: "Counting votes, not homes",
        caption: "Enough homes to matter. Not so many that the vote dies.",
        status: "day 46 · council chamber",
      },
      trivia: {
        emoji: "🗼",
        title: "Tokyo builds anywhere",
        text: "Tokyo lets builders add homes almost anywhere in the city. Its rents have stayed steady even as many more people moved in.",
      },
      type: "slider",
      text: [
        "Because competition needs empty homes, Nora turns the model into a bill.",
        "The rezoning bill changes what can be built and how fast permits move.",
        "Families can carry about $1,800. Above 44,000 new homes, three council members leave and the bill fails.",
      ],
      prompt: "How many new homes do you unblock?",
      primer: {
        term: "Rezoning",
        plain:
          "Rezoning means changing building rules for a place. It can allow more homes on the same land.",
        like: "redrawing a car park so more cars fit in the same ground.",
      },
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
          text: "A small gesture passes. Rent stays far above $2,000, and the 20,000-family list barely moves.",
        },
        {
          max: 40,
          text: "Real cranes appear, but rent only just reaches $1,800. That is still too tight for many families.",
        },
        {
          max: 44,
          text: "The bill passes 19 to 14. Rent is projected below $1,800, and the first permits go out before dawn.",
        },
        {
          max: 60,
          text: "Three council members walk out before the vote. You aimed for every home and unblocked none.",
        },
      ],
      hints: [
        "Drag it and watch the settled rent against the $1,800 line.",
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
        "A reporter catches you in the hall. “Mayor, people still owe $2,500 tomorrow.”",
        "“Why is this better than just capping it?”",
      ],
      prompt: "Why is building better than capping?",
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
        text: "A big block of new flats usually takes two or three years to finish. Paperwork can add even longer at the start.",
      },
      type: "narrative",
      text: [
        "Six months after that hallway answer, the cranes are easy to see 🏗️.",
        "Not one finished flat is ready. Rent is $2,540, so the pain is worse today.",
        "Elena is still sleeping in the hospital car park. A paper puts her photo under THE MAYOR’S PLAN.",
        "Brandt points at the headline during the next meeting. Then Nora slides in with new news.",
        "The state has sent $400 million for housing 💰. Everyone wants to spend it first.",
      ],
      next: "e11",
    },
    {
      id: "e11",
      act: 3,
      mood: "alarm",
      beat: "The money",
      simulation: "budget-split",
      visual: {
        kind: "council",
        title: "$400 million, one decision",
        caption: "Everything here helps somebody. Only some of it helps everybody.",
        status: "month 6 · budget meeting",
      },
      type: "choice",
      text: [
        "The $400 million lands while the cranes are still only promises.",
        "Brandt wants cash help sent to renters this month. Slide the model before you decide.",
        "Watch the rent everyone pays, not just the check people receive.",
      ],
      prompt: "Where does the money go?",
      primer: {
        term: "Cash help",
        plain:
          "Cash help is public money given to renters for rent. It adds spending power, but no homes.",
        like: "giving bidders more money at an auction. The painting still goes to one bidder.",
      },
      concept:
        "Money given to renters raises what renters can bid; it does not add a home.",
      probe: "What did the model change your mind about?",
      options: [
        {
          id: "mostly",
          label: "Put most money into homes, with quick help for the worst cases",
          detail: "Fix the shortage, and carry people who cannot wait.",
          correct: true,
          outcome:
            "The split is printed that night: most money speeds homes, and a small fund gets people like Elena indoors. Next, Nora needs the order explained in public.",
          approach: "isolate_variable",
          next: "e12",
        },
        {
          id: "cash",
          label: "$400 a month to every housed renter for one year",
          detail: "Instant, visible, and popular.",
          correct: false,
          approach: "act_first",
          next: "e11",
        },
        {
          id: "buy",
          label: "Buy 4,000 existing flats and rent them out cheaply",
          detail: "The city becomes the good landlord.",
          correct: false,
          approach: "brute_force",
          next: "e11",
        },
        {
          id: "hold",
          label: "Hold the money until the new blocks are finished",
          detail: "Do not change anything while the plan works.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e11",
        },
      ],
      consequences: {
        cash:
          "Slide the model to all cash help. Rent rises by almost the same amount. Renters can bid more for the same homes, so owners charge more.",
        buy: "The city buys 4,000 flats from current owners. Halden still has 70,000 rental homes, so the 20,000-home gap barely changes.",
        hold: "The plan may work in three years. Elena is in a car tonight. A long-run answer still needs a short-run bridge.",
      },
      hints: [
        "Try the two ends of the slider and read the rent, not the headline.",
        "Ask whether each option gives Halden more homes tomorrow.",
        "Money for building adds homes. Money for renters adds bidders.",
      ],
    },
    {
      id: "e12",
      act: 3,
      mood: "insight",
      beat: "How it lands",
      visual: {
        kind: "city-dawn",
        title: "The board in the war room",
        caption: "It works. But not in the order anyone wants.",
        status: "month 7",
      },
      type: "reorder",
      text: [
        "Because the split is hard to defend, Nora makes one press slide.",
        "“People keep asking when rent falls,” she says. “Show the real order, not the wish.”",
      ],
      prompt: "How does unblocking building actually reach a renter?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "permits",
          label: "Permits are approved",
          detail: "Paper changes first. Most families see nothing yet.",
        },
        {
          id: "build",
          label: "Blocks get built",
          detail: "Two to three years of cranes and noise.",
        },
        {
          id: "empty",
          label: "Some homes sit empty",
          detail: "For the first time in years, renters have choices.",
        },
        {
          id: "compete",
          label: "Owners start competing for renters",
          detail: "An empty flat earns nothing, so someone lowers the price.",
        },
        {
          id: "fall",
          label: "Rents come down and the list shrinks",
        },
      ],
      wrong:
        "Nora points to the middle of the board. “Rent cannot fall first. Owners lower prices only after empty homes appear.”",
      right:
        "“Good,” Nora says. “Now the honest bad news is clear. Three steps happen before most renters feel relief.”",
      concept:
        "Supply fixes work through competition, which is why they are slow and lasting.",
      probe: "Which step is where the painful wait sits?",
      hints: [
        "Nothing in this chain is magic. Each step causes the next.",
        "Ask what must happen before an owner lowers rent.",
        "Permits → building → empty homes → competition → rent falls.",
      ],
      next: "e13",
    },
    {
      id: "e13",
      act: 3,
      mood: "resolve",
      beat: "The offer",
      visual: {
        kind: "council",
        title: "Brandt’s deal",
        caption: "He has the votes for phase two. He wants something for them.",
        status: "month 8 · phase two vote",
      },
      type: "choice",
      text: [
        "After Nora’s slide, the waiting part is no longer hidden. Brandt uses that pain in the next vote.",
        "Phase two needs nineteen votes. Brandt has seven, and he offers a trade 🤝.",
        "“Pass my citywide cap with it,” he says. “Refuse, and explain the delay to Elena.”",
      ],
      prompt: "What do you take into the chamber?",
      concept:
        "Protecting people from sudden loss is not the same as fixing one price for everyone.",
      options: [
        {
          id: "protect",
          label: "Counter-offer: protect people already in their homes",
          detail: "Limit sudden rent jumps on current leases, with no citywide cap.",
          correct: true,
          outcome:
            "Brandt reads the offer twice. It guards housed families without killing new homes. The chamber now has a deal it can pass.",
          approach: "seek_pattern",
          next: "e14",
        },
        {
          id: "refuse",
          label: "Refuse the deal and take phase two to a public vote",
          detail: "Slower and louder, but no one has to pretend the cap works.",
          correct: true,
          outcome:
            "You send phase two to the public instead. It is slow and loud. The city chooses the plan with its eyes open.",
          approach: "commit_to_hypothesis",
          next: "e14",
        },
        {
          id: "accept",
          label: "Accept the citywide cap to get phase two through",
          detail: "One bad bill for one good one.",
          correct: false,
          approach: "follow_authority",
          next: "e13",
        },
        {
          id: "swap",
          label: "Drop phase two and take the cap on its own",
          detail: "At least renters get something this month.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "e13",
        },
      ],
      consequences: {
        accept:
          "The cap lands as the first blocks top out. Owners hesitate, and new money backs away. You traded the fix for the thing it replaced.",
        swap: "Renters get a number on a page, but Halden gets no new homes. The line grows, and luck chooses the winners.",
      },
      hints: [
        "Can you protect renters without setting one price for the whole city?",
        "Brandt fears sudden jumps for housed families. That is narrower than every rent.",
        "You can guard people from shocks while still adding homes.",
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
        "Three years later, the deal has become streets, doors, and keys 🔑.",
        "Rent settles at $1,780. The list is down from 20,000 families to 2,000.",
        "Twenty-six thousand homes are finished. Eleven thousand more are going up.",
        "Elena moved indoors in year two. She still says the first year was too long.",
        "Brandt now calls the building plan “what we did.” Nora tells you to let him.",
        "The plain lesson is not on any poster. Rent fell because the next flat was empty.",
      ],
      outcome: "success",
    },
  ],
};
