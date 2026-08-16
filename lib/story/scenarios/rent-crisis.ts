import type { Scenario } from "../types";

/**
 * The intuitive answer — cap the price — is the wrong one, which is exactly
 * why it earns its place: the engine is built to let a learner commit to a
 * belief, watch it fail, and come back. A cap moves the price on a piece of
 * paper; it does not move a single brick.
 *
 * Act 3 refuses to let "just build more" be a costless answer. Building is
 * slow, the people who need help cannot wait years, and the politics of the
 * council chamber are their own constraint. The final beat is a judgement
 * call, not a physics puzzle.
 */
export const rentCrisis: Scenario = {
  id: "rent-crisis",
  title: "Fix the Rent",
  tagline: "You won on one promise. Rent. The council votes in 90 days.",
  domain: "economics",
  difficulty: "hard",
  learningGoal:
    "Learn why capping a price doesn't create the thing people are queuing for — and what does.",
  takeaway: {
    concept: "Price caps and shortages",
    field: "Economics \u2014 supply and demand",
    inOneLine:
      "A rent cap changes the number on the contract. It does not change how many homes exist. When the price is held below the level that would clear the queue, more people want a home than there are homes \u2014 and the shortage gets rationed by waiting lists, luck and who you know instead of by price.",
    rule:
      "A price is a signal, not the cause. Push the signal down and you also push down the reason anyone builds, so the shortage you were treating gets worse. Fix a shortage by changing the quantity; use price rules only to protect specific people while the quantity catches up.",
    elsewhere: [
      "Fuel price caps that end in queues at the pump rather than cheap fuel.",
      "Concert tickets priced below what fans will pay \u2014 they sell out in seconds and reappear on resale sites.",
      "Below-cost water pricing in a drought, which quietly guarantees the taps run dry.",
      "Subsidised university places: capping the fee does not build more lecture halls.",
    ],
    youUsedIt: [
      "You counted homes against families before you touched a single policy.",
      "You watched the cap work exactly as promised for people already housed, and fail for everyone in the queue.",
      "You split the money towards supply while naming the households who cannot wait for it.",
      "You held the quantity, not the price, as the thing that actually had to move.",
    ],
  },
  minutes: 12,
  stageLabel: "Halden city hall",
  partnerGreeting:
    "I'll be in the room. You run the city; I'll pay attention to how you decide.",
  intro: {
    role: "new mayor of Halden",
    cta: "Walk into city hall",
    text: [
      "You won by four thousand votes, on one promise: rent.",
      "Halden has 90,000 families and 70,000 homes to rent. The average rent is $2,500 a month. The average family here can carry about $1,800.",
      "Nora, your chief of staff, meets you on the steps with a folder and no coffee.",
      "“Councillor Brandt has already filed his rent cap bill,” she says. “The vote is in ninety days. Everyone in that building expects you to sign it.”",
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
      "Everyone already agrees on the answer. What do you do with your first week?",
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
        caption: "Forty thousand names on a waiting list that only grows.",
        status: "rent $2,500",
      },
      type: "narrative",
      text: [
        "Your office smells of new paint. The folder is thicker than your arm.",
        "Forty thousand families are on the housing list. Rent has gone up 60% in six years. Wages have gone up 14%.",
        "Nora reads you one line from the folder: “Elena Vogt, staff nurse at Halden General, eleven years. Currently sleeping in her car in the hospital staff park.”",
        "“She's not the sad exception,” Nora says. “She's the middle of the graph.”",
        "Outside your window, three tower blocks. Half the windows are dark.",
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
          "two counts that sound alike and are not. Homes is how many places exist to live in. Families is how many households need one. The gap between those two numbers is what rent is really reporting.",
        like: "chairs against guests \u2014 the music does not change how many chairs there are.",
      },
      type: "choice",
      text: [
        "Councillor Brandt is outside your office with the bill and two journalists.",
        "“$1,500 maximum, citywide, from the first of next month,” he says. “You promised. Sign it and we're heroes by Friday.”",
      ],
      prompt: "What do you do first?",
      concept:
        "Before fixing a price, find out what is actually producing that price.",
      probe: "Why start there?",
      options: [
        {
          id: "count",
          label: "Count the homes and count the families",
          detail: "Find out whether Halden has a price problem or a shortage.",
          correct: true,
          outcome:
            "Priya pulls the housing register and the tenancy roll side by side. It takes twenty minutes to line them up, and when the two numbers finally sit next to each other, nobody in the room says anything for a while.",
          approach: "measure_first",
          next: "e3",
        },
        {
          id: "sign",
          label: "Sign Brandt's bill this week",
          detail: "You promised. Deliver it before anyone talks you out of it.",
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
          detail: "Not a cap, just a pause \u2014 nobody loses anything they already have.",
          correct: false,
          approach: "act_first",
          next: "e2",
        },
        {
          id: "study",
          label: "Commission an eighteen-month expert review",
          detail: "Nobody can attack you for wanting the evidence.",
          correct: false,
          approach: "follow_authority",
          next: "e2",
        },
      ],
      consequences: {
        freeze:
          "It buys quiet for a fortnight. Then Nora puts the register in front of you: a freeze is a cap wearing a softer word, and you still have no idea whether Halden is short of money or short of homes.",
        sign: "Nora shuts the door behind the journalists. “Before you sign — do you know whether the problem is that rents are high, or that there aren't enough homes? Because those need opposite bills.”",
        landlords:
          "Eleven of them come. They nod, they smile, and four of them quietly list their flats as holiday lets the following month. You cannot lean on a market that can simply leave.",
        study:
          "Nora does the maths out loud. “Eighteen months of review, then ninety days of drafting. Elena will have spent two winters in that car and you'll still be on page one.”",
      },
      hints: [
        "The bill sets a price. Do you know yet what is setting the price now?",
        "Two very different problems look identical from outside: too little supply, or too much greed.",
        "Count what exists and count what's wanted before you legislate a number.",
      ],
    },
    {
      id: "e3",
      act: 1,
      mood: "alarm",
      beat: "The numbers",
      visual: {
        kind: "market",
        title: "Two numbers that don't meet",
        caption: "90,000 families. 70,000 homes to rent.",
        status: "1,200 built last year",
      },
      type: "narrative",
      text: [
        "It takes four days to get real numbers, and they are not complicated.",
        "Halden has 70,000 homes on the rental market. About 90,000 families want one.",
        "Last year the city built 1,200 homes. In the same year it added 9,000 new residents.",
        "You ask why so few got built. Nora turns to the last page: the average permit in Halden takes four years and eleven months to approve.",
        "“So the rent isn't high because someone decided to be greedy,” you say. “It's high because twenty thousand families are bidding for homes that don't exist.”",
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
      type: "choice",
      text: [
        "Nora has built you a model of Halden's rental market — a shortage of twenty thousand homes, drawn as two bars.",
        "Drag the price cap around before you answer. Watch what happens to the number of homes people are willing to rent out.",
      ],
      prompt: "If you cap rent at $1,500, what happens?",
      primer: [
        {
          term: "A shortage",
          plain:
            "More families wanting homes than there are homes to rent. Price is simply how the argument over who gets one gets settled.",
          like: "twenty people and twelve chairs. The problem was never that the chairs were expensive.",
        },
        {
          term: "A price cap",
          plain:
            "A law setting the most that may be charged for something. It controls the number on the contract, and nothing else about the deal.",
          like: "a ceiling price on concert tickets. The hall still has exactly as many seats in it.",
        },
      ],
      concept:
        "A price cap changes what people may charge, not how many homes exist.",
      probe: "What surprised you in the model?",
      options: [
        {
          id: "shortage",
          label: "Rent falls, and so does the number of homes on offer",
          detail: "The families who get one pay less. Thousands more get nothing.",
          correct: true,
          outcome:
            "Councillor Boyd frowns at the board. “So the people who keep their flat do brilliantly,” he says, “and the people looking for one are worse off than before.” “Yes,” says Priya. “And we only ever meet the first group.”",
          approach: "seek_pattern",
          next: "e5",
        },
        {
          id: "everyone",
          label: "Everyone on the list gets a home at $1,500",
          detail: "That's the whole point of the bill.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e4",
        },
        {
          id: "nothing",
          label: "Nothing much — landlords absorb it",
          detail: "They've made enough. They'll cope.",
          correct: false,
          approach: "act_first",
          next: "e4",
        },
        {
          id: "build",
          label: "Rent falls and builders rush in to meet the demand",
          detail: "Cheaper city, more people, more building.",
          correct: false,
          approach: "change_many",
          next: "e4",
        },
      ],
      consequences: {
        everyone:
          "Slide the model to $1,500. The homes-offered bar drops to 50,000 while the families-looking bar rises to 90,000. The cap decided the price. It did not decide who gets a key.",
        nothing:
          "Some will absorb it. Others sell, or switch to holiday lets, or leave the flat empty rather than lock in a low rent for years. In the model that is the offered bar falling — and it falls whether or not anyone is being greedy.",
        build:
          "Watch the model again: a lower price makes renting out *less* attractive, not more. Nobody builds a block of flats to charge less for it.",
      },
      hints: [
        "Move the cap and watch the second bar, not the first.",
        "Ask what a landlord does when the rent allowed is less than the trouble is worth.",
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
      type: "reorder",
      text: [
        "You take it to committee. Brandt is not persuaded and he is not stupid.",
        "“Fine,” he says. “Walk me through it. If the cap is so terrible, tell me what happens after I sign it — in order.”",
      ],
      prompt: "What follows a cap set below the going rent?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "cap",
          label: "Rent is capped below what it was",
          detail: "$1,500, when the going rate was $2,500.",
        },
        {
          id: "want",
          label: "Renting suddenly looks cheap, so more families want in",
          detail: "Including people who were sharing, or living with parents.",
        },
        {
          id: "withdraw",
          label: "Some owners stop renting out at that price",
          detail: "They sell, switch to holiday lets, or just leave it empty.",
        },
        {
          id: "queue",
          label: "Far more families are chasing far fewer homes",
        },
        {
          id: "ration",
          label: "Homes go to whoever is quickest, luckiest or best connected",
          detail: "The queue decides now, not the price.",
        },
      ],
      wrong:
        "Brandt leans back, pleased. “That's not what happens and you know it. Something has to change on the landlords' side before your queue can exist.”",
      right:
        "The room goes quiet. Brandt taps the table twice. “All right. But my people are still in that queue, mayor. What's your bill?”",
      concept:
        "A binding price cap converts a price problem into a queueing problem.",
      probe: "Who ends up worse off in that queue than they were before?",
      hints: [
        "Start with the cap itself — everything else is a reaction to it.",
        "Two things happen at once after the cap: renters react, and owners react.",
        "Cap → more want in → some owners leave → queue → whoever's connected wins.",
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
        "You put one line on the whiteboard: 90,000 families, 70,000 homes.",
        "Every argument in the building has been about the $2,500. Not one has been about the 20,000.",
        "“The rent is a number the shortage produces,” you tell the room. “Argue with the number all you like. It'll keep producing it.”",
        "Karl Mercer, who builds about a third of what gets built in Halden, has been sitting at the back all morning. He finally speaks.",
        "“I have land for eleven thousand homes,” he says. “I've been waiting four years for permits on the first three thousand.”",
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
      primer: {
        term: "Vacancy",
        plain:
          "how many homes are standing empty, waiting for a tenant. Near zero, the tenant competes for the home. A few percent, and the home has to compete for the tenant \u2014 the price follows whichever way that runs.",
        like: "the last seat on a packed train versus a half-empty carriage.",
      },
      type: "choice",
      text: [
        "Nora rebuilds the model with a second lever: instead of capping the price, unblock the building.",
        "Drag it. Nobody in this version is ordered to charge anything.",
        "\u201cWatch the vacancy line,\u201d Nora says. \u201cThat is how many homes are standing empty. Rent does whatever that number tells it to.\u201d",
      ],
      prompt: "Why does rent fall in this model without a single rule?",
      concept:
        "Rent falls on its own when there are more homes than families competing for them.",
      probe: "Why is this so much less satisfying to announce than a cap?",
      options: [
        {
          id: "compete",
          label: "Owners have to compete for tenants instead of the other way round",
          detail: "When there are spare homes, the empty one has to lower its price.",
          correct: true,
          outcome:
            "“That is the version worth having,” Priya says. “Not a rule that holds the price down, but enough homes that nobody can name their price.” Boyd writes it on the whiteboard and underlines it twice.",
          approach: "seek_pattern",
          next: "e8",
        },
        {
          id: "cheapbuild",
          label: "New homes are cheaper to build, so they're cheaper to rent",
          detail: "Modern construction costs less.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e7",
        },
        {
          id: "generous",
          label: "Builders pass the savings on to be fair",
          detail: "Karl seems reasonable enough.",
          correct: false,
          approach: "follow_authority",
          next: "e7",
        },
        {
          id: "quality",
          label: "The new homes are worse, so they drag the average down",
          detail: "Cheap flats in the average make the number look lower.",
          correct: false,
          approach: "seek_pattern",
          next: "e7",
        },
        {
          id: "nobody",
          label: "It doesn't really — the model is just optimistic",
          detail: "New flats are always the expensive ones.",
          correct: false,
          approach: "abandon_hypothesis",
          next: "e7",
        },
      ],
      consequences: {
        quality:
          "Nora filters the model to existing homes only \u2014 same flats, same streets, nothing new in the average. Their rents fall too. Whatever is happening, it is happening to homes that were already there.",
        cheapbuild:
          "New homes in Halden cost more to build than old ones, not less. The rent still falls in the model — which means the cause has to be something other than the building cost.",
        generous:
          "Karl laughs out loud at that. “I charge what I can get. So does everyone. The model isn't about my character — it's about how many empty flats I'm competing with.”",
        nobody:
          "New flats are usually the expensive ones, and rent still falls: the family who moves into the shiny new one leaves an older, cheaper one behind. Every new home frees a home somewhere down the chain.",
      },
      hints: [
        "Nobody in this model is being told what to charge. So who changed their mind, and why?",
        "Think about two identical flats and one family, versus two families and one flat.",
        "Spare homes mean the landlord with an empty one has to do something about it.",
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
      type: "slider",
      text: [
        "The rezoning bill lets Karl and everyone like him build. You choose how far it goes.",
        "Families here can carry about $1,800. Get the settled rent under that and this was worth doing.",
        "Nora has counted the votes twice. Above 44,000 new homes, three suburban councillors walk and the bill dies on the floor.",
      ],
      prompt: "How many new homes do you unblock?",
      primer: {
        term: "Rezoning",
        plain:
          "Changing the rules about what may be built where — how tall, how many, and how long permission takes.",
        like: "repainting the lines in a car park so more cars fit into exactly the same ground.",
      },
      concept:
        "The fix has to be big enough to move the price and small enough to actually pass.",
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
          demandIntercept: 120,
          demandSlope: 20,
          supplyIntercept: 20,
          supplySlope: 20,
        },
        decimals: 2,
      },
      driver: { label: "What families can carry", value: 1.8, unit: "k" },
      risk: { mode: "ceiling", safeGap: 0.9 },
      meter: "market",
      target: { min: 30, max: 44 },
      bands: [
        {
          max: 12,
          text: "A gesture. Rent drifts down by a couple of hundred dollars and the waiting list does not notice. Brandt calls it “a press release with planning permission”.",
        },
        {
          max: 28,
          text: "Real homes, real cranes — and rent settles just above what people here can carry. Close enough to hurt, not close enough to help.",
        },
        {
          max: 44,
          text: "It passes, 19 to 14. Rent is projected to settle inside what Halden families can actually pay, and there are more homes, not fewer. Karl is already on the phone.",
        },
        {
          max: 60,
          text: "Three suburban councillors walk out before the vote and the bill dies on the floor. You aimed for everything and unblocked nothing.",
        },
      ],
      hints: [
        "Drag it and watch the settled rent against the $1,800 line.",
        "You need the rent under $1,800, and no more than 44,000 homes.",
        "Somewhere between 30,000 and 44,000 does both.",
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
        "The bill passes at 11:40 p.m. Nora buys two terrible sandwiches from the machine in the corridor.",
        "A local reporter catches you on the way out. “Mayor — in one sentence, for someone paying $2,500 tomorrow morning. Why is this better than just capping it?”",
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
      type: "narrative",
      text: [
        "Six months later there are eleven cranes on the skyline and not one finished flat.",
        "Rent is $2,540. It has gone up.",
        "Elena Vogt is still in the staff car park, and now a local paper has photographed her there under the headline “THE MAYOR'S PLAN”.",
        "Brandt is enjoying himself enormously.",
        "Then the state government transfers $400 million of housing money into the city account, and everyone in the building has an idea about it.",
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
        "Four hundred million dollars. Brandt wants it as vouchers, straight into renters' hands, this month.",
        "Slide the model before you decide. Watch what happens to the rent everybody pays.",
      ],
      prompt: "Where does the money go?",
      primer: {
        term: "Vouchers",
        plain:
          "Public money handed straight to renters to help them pay. It lifts what every family can afford, without adding one home to the city.",
        like: "handing everyone at an auction an extra $400. The painting still goes to one person — just for more.",
      },
      concept:
        "Money given to renters raises what renters can bid; it does not add a home.",
      probe: "What did the model change your mind about?",
      options: [
        {
          id: "mostly",
          label: "Most of it into building, a small hardship fund for the worst cases",
          detail: "Fix the shortage; carry the people who can't wait for it.",
          correct: true,
          outcome:
            "The split goes into the paper that evening: the bulk into supply, a named fund for the households who cannot wait three years for it. It is not the headline anyone wanted, and it is the one you can defend in public.",
          approach: "isolate_variable",
          next: "e12",
        },
        {
          id: "vouchers",
          label: "$500 a month to every renter in Halden",
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
          detail: "Don't distort anything while the plan is working.",
          correct: false,
          approach: "commit_to_hypothesis",
          next: "e11",
        },
      ],
      consequences: {
        vouchers:
          "Slide the model to all-vouchers. Rent goes to $3,500. Every renter can now bid $500 more for the same unchanged pile of homes — so they do, and the landlords collect most of your $400 million.",
        buy: "You buy 4,000 flats from people who already own them. Halden still has exactly the same number of homes; 4,000 families are simply now your tenants instead of somebody else's, and the 20,000 gap has not moved a millimetre.",
        hold: "The plan works in three years. Elena is sleeping in a car tonight. “Correct in the long run” is not a housing policy if people cannot survive the short run.",
      },
      hints: [
        "Try the two ends of the slider and read the rent, not the headline.",
        "Ask, for each option: does Halden have more homes tomorrow than it does today?",
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
        "Nora wants a slide for the press. “They keep asking when rent goes down. Show them the actual sequence.”",
        "Five boxes. You have to say which comes first.",
      ],
      prompt: "How does unblocking building actually reach a renter?",
      instruction: "Put the five steps in the order they happen.",
      steps: [
        {
          id: "permits",
          label: "Permits are approved",
          detail: "Paper. Nothing visible changes.",
        },
        {
          id: "build",
          label: "Blocks get built",
          detail: "Two to three years of cranes and noise.",
        },
        {
          id: "empty",
          label: "There are more homes than families looking",
          detail: "For the first time in a decade, some flats sit empty.",
        },
        {
          id: "compete",
          label: "Owners start competing for tenants",
          detail: "An empty flat earns nothing, so somebody blinks on price.",
        },
        {
          id: "fall",
          label: "Rents come down and the waiting list shrinks",
        },
      ],
      wrong:
        "Nora frowns at the board. “That's the order we wish it went in. Nothing makes a landlord lower rent until the flat next door is empty.”",
      right:
        "“Good,” she says. “And that's also the honest bad news: three of those five steps happen before a single renter feels anything.”",
      concept:
        "Supply fixes work through competition, which is why they are slow and why they last.",
      probe: "Which step is where the pain of waiting actually sits?",
      hints: [
        "Nothing in this chain is a rule. Every step has to be caused by the one before it.",
        "Ask what has to be true before a landlord chooses to charge less.",
        "Permits → building → spare homes → competition → rent falls.",
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
        title: "Brandt's deal",
        caption: "He has the votes for phase two. He wants something for them.",
        status: "month 8 · phase two vote",
      },
      type: "choice",
      text: [
        "Phase two of the rezoning needs nineteen votes. Brandt has seven of them in his pocket and a proposal.",
        "“Pass my citywide cap alongside it and you get every vote I have. Refuse, and phase two dies and you can explain that to Elena.”",
        "Nora says nothing, which is how she says a lot.",
      ],
      prompt: "What do you take into the chamber?",
      concept:
        "Protecting people from sudden loss is not the same as fixing a price for everyone.",
      options: [
        {
          id: "protect",
          label: "Counter-offer: protect people already in their homes",
          detail: "Limit how far rent can jump on an existing tenancy — no citywide price.",
          correct: true,
          outcome:
            "Boyd reads your counter-offer twice. “You are giving them the thing they actually care about,” he says, “and keeping the thing the city needs.” The developers’ lawyer asks for the room.",
          approach: "seek_pattern",
          next: "e14",
        },
        {
          id: "refuse",
          label: "Refuse the deal and take phase two to a public vote",
          detail: "Slower, riskier, and nobody has to pretend the cap works.",
          correct: true,
          outcome:
            "You put phase two to the public instead. It is slower, louder and riskier — and it means the plan that survives is one the city chose with its eyes open.",
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
          "The cap lands the same month the first blocks top out. Owners who were about to list start hesitating, and half of Karl's phase-two investors quietly walk. You traded the fix for the thing the fix was meant to replace.",
        swap: "Renters get a number on a page and Halden gets no new homes at all. In eighteen months the queue is longer, the list is longer, and the only thing you have changed is who gets to the front.",
      },
      hints: [
        "Is there a version of “protect renters” that doesn't set one price for the whole city?",
        "Brandt's fear is families thrown out by a sudden $800 rise. That is a narrower problem than the price of everything.",
        "You can guard people against sudden loss without telling the whole market what to charge.",
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
        caption: "Rent $1,780. The waiting list is 9,000 and falling.",
        status: "year 3",
      },
      type: "ending",
      text: [
        "It takes three years, which is roughly three years longer than anyone wanted.",
        "Rent settles at $1,780. The waiting list is down from 40,000 to 9,000. Twenty-six thousand homes have been finished and eleven thousand more are going up.",
        "Elena Vogt moved into a flat on Mill Road in the second year. She is still cross about the first one.",
        "Brandt, who fought you for two years, now describes the rezoning as “what we did” in interviews. Nora says you should let him.",
        "The thing nobody puts on a poster: the rent came down because the flat next door was empty. That was the whole plan.",
      ],
      outcome: "success",
    },
  ],
};
