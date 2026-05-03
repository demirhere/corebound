# Game Design Principles

Here’s the useful thesis:

**A successful card/deck game is a small, legible system that repeatedly gives players constrained choices, lets those choices compound, then surprises them with consequences they feel responsible for.** The cards are not the fun by themselves. The fun is the *state-changing engine* the cards create.

I’m treating “card-deck game” broadly here: physical cards, digital cards, resource cards, market cards, modifier cards, stackable cards, board-linked cards, and deckbuilding systems.

## What modern design understanding says

Modern game-design theory usually avoids saying “make it fun” and instead asks: **what player experience are your mechanics reliably producing?** The MDA framework separates games into **mechanics**, **dynamics**, and **aesthetics**: designers create rules and systems, players experience the behaviors and emotions that emerge from those systems. It also stresses that even small rule changes can cascade into different player experiences. ([Northwestern University Computer Science][1])

The psychology side lines up with this. Self-Determination Theory research on games says players are motivated when games satisfy **autonomy** — “I chose this,” **competence** — “I’m getting better,” and **relatedness** — “this matters socially.” The PENS model specifically points to easily mastered controls, clear feedback, meaningful choices of goals/strategies, and cooperative/social opportunities as features that support engagement. ([Self Determination Theory][2])

Flow/GameFlow adds another useful checklist: good games support concentration, challenge, player skill growth, control, clear goals, feedback, immersion, and social interaction. In practical card-game terms, that means the player should always know the current goal, understand the result of a play, face a challenge just beyond comfort, and feel that their decisions shape the outcome. ([SciSpace][3])

Recent “game feel” research is also relevant, even for card games. Moment-to-moment polish is not cosmetic: tuning, juicing, and streamlining make interactions feel predictable, empowering, and clear. In card games, that means card movement, stacking, reveal timing, scoring feedback, combo cascades, and result clarity matter a lot. ([arXiv][4])

## Why Stacklands, Balatro, and Catan work

| Game               | What it teaches                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stacklands**     | It turns a complex village-builder into a tactile card grammar: stack card A on card B, wait, receive card C. Its designer described the card format as a way to simplify city-building, while the game keeps depth by always introducing a new problem to solve. Random card packs also prevent the game from becoming one perfect deterministic recipe sequence. ([Steam Store][5])                                                                                                                                                     |
| **Balatro**        | It uses familiar playing cards and poker language as an onboarding tool, then turns the real game into combo discovery, risk reduction, deck manipulation, and score escalation. LocalThunk describes it as a run-based card game about interlocking mechanics and synergies, with poker acting more like approachable wrapping than the true mechanical core. ([Game Developer][6]) Balatro’s commercial success also shows how powerful that mix can be: Playstack reported over 5 million units sold by January 2025. ([Playstack][7]) |
| **Catan**          | It is not a deckbuilder, but it is a brilliant resource-card economy. Dice create uneven production, hidden hands create uncertainty, scarcity creates trade, and the board creates spatial conflict. Its turn loop is simple: roll for production, trade, build.  Its durability is obvious: CATAN reports over 45 million games sold worldwide and availability in more than 40 languages as of Q1 2025. ([CATAN][8])                                                                                                                   |
| **Slay the Spire** | It shows that deep card systems need aggressive iteration. The developers tracked pick rate, win rate, offered-card decisions, enemy performance, and player feedback, then changed cards and archetypes early and often. Their lesson is not “balance by spreadsheet”; it is “use data to find questions, then use design judgment to make the game feel better.” ([Game Developer][9])                                                                                                                                                  |

## The design recipe

### 1. Start with the emotional promise, not the mechanics

Write this sentence before designing more cards:

> “In this game, the player feels like **___** by doing **___** under pressure from **___**.”

Examples:

> “The player feels like a clever merchant-engineer by converting junk into an economy before the village collapses.”

> “The player feels like a rule-breaking card shark by bending familiar card rules into absurd combos before the blind gets too high.”

Then choose **two primary fun types** and one secondary one:

* **Mastery:** I understand the system better each run.
* **Discovery:** I keep finding surprising card interactions.
* **Expression:** I built *my* weird engine.
* **Tension:** I barely survived that turn.
* **Optimization:** I can see a more efficient path.
* **Social drama:** I negotiated, blocked, bluffed, or persuaded.
* **Toy-like tactility:** It simply feels good to move, reveal, stack, or trigger things.

Design rule: **every major mechanic should serve one of those fun types.** If it does not, it is probably complexity rather than depth.

---

### 2. Build the 30-second loop

A good card game has a satisfying loop before it has lots of content.

A strong loop usually looks like this:

> **Reveal / draw → choose → commit → resolve → gain/change state → face new pressure.**

For each turn or action cycle, check:

| Question                                   | Good sign                                                                     | Bad sign                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------- |
| What is the player trying to do right now? | The goal is visible.                                                          | The player asks, “What am I supposed to do?” |
| What are they choosing between?            | At least two options are plausible.                                           | One option is always correct.                |
| What is the cost?                          | They give up tempo, cards, money, position, safety, or future options.        | They just click the best reward.             |
| What changes afterward?                    | Their next decisions are different.                                           | The game state barely changes.               |
| What pressure advances?                    | A clock, rival, hunger, blind, market, enemy, scarcity, or board state moves. | The player can durdle forever.               |

A card game without pressure becomes accounting. A card game without choice becomes automation.

---

### 3. Make cards into verbs, not facts

Every card should *do* one or more of these jobs:

| Card job     | What it creates                                               |
| ------------ | ------------------------------------------------------------- |
| **Generate** | Produces resources, cards, units, money, points, workers.     |
| **Convert**  | Turns one thing into another; creates economy.                |
| **Filter**   | Draw, discard, search, reorder, preview, reroll.              |
| **Multiply** | Rewards a pattern; creates scaling and combos.                |
| **Protect**  | Blocks loss, preserves resources, buys time.                  |
| **Pressure** | Adds cost, hunger, enemy, decay, debt, risk, rival benefit.   |
| **Unlock**   | Opens new card types, recipes, spaces, abilities, or markets. |
| **Score**    | Converts built state into victory progress.                   |

A weak card says: “Gain 2 wood.”

A better card says: “Gain 2 wood; if this completes a building recipe, draw an Idea.”

A stronger card says: “Convert any food into labor. If you are starving, double the labor but add sickness.”

The best cards create **a strategic question**, not just a reward.

---

### 4. Design the economy as a tension machine

Your economy should have **sources**, **sinks**, **conversion paths**, and **bottlenecks**.

A simple economy map:

> **Input → converter → output → upgrade → new bottleneck.**

For example:

> Forest → wood → building → worker capacity → food shortage.

Or:

> Low cards → poker hand → chips/mult → money → shop → deck manipulation → higher blind.

Good economies have:

* **3–5 core resources** players understand quickly.
* At least one **scarce resource** that drives hard decisions.
* At least one **renewable resource** that gives momentum.
* At least one **volatile resource** that creates risk.
* At least one **conversion inefficiency** that makes optimization interesting.
* A reason to sometimes **spend now** and sometimes **save for later**.

Avoid universal resources. If one currency solves every problem, your game will collapse into “get more of that.”

---

### 5. Use randomness to create adaptation, not helplessness

Randomness is powerful in card games because it creates replayability, surprise, and imperfect planning. But players must feel they are **managing risk**, not being mugged by the system.

Good randomness:

* Gives the player partial information.
* Lets them prepare or mitigate.
* Creates different viable paths.
* Produces short-term setbacks, not long-term irrecoverable punishment.
* Makes the player say, “I should have planned for that.”

Bad randomness:

* Hides essential information.
* Punishes without warning.
* Decides the winner too early.
* Has no mitigation tools.
* Makes the player say, “The game just decided I lose.”

Mitigation tools include redraws, scouting, card removal, drafting, trading, banking, insurance, wildcards, market refreshes, probability displays, and multiple routes to the same need.

---

### 6. Create synergy, then constrain it

The joy of Balatro-like and deckbuilder-like games is often: **“Wait, these two cards work together?”**

Build each archetype with four pieces:

| Archetype piece | Purpose                                   |
| --------------- | ----------------------------------------- |
| **Enabler**     | Makes the strategy possible.              |
| **Payoff**      | Rewards the strategy.                     |
| **Scaler**      | Lets it grow over time.                   |
| **Stabilizer**  | Helps it survive bad draws or bad timing. |

Example archetype:

> “Compost economy”
> Enabler: turn discarded food into soil.
> Payoff: farms produce extra if soil is high.
> Scaler: every harvest adds more soil.
> Stabilizer: emergency forage if food hits zero.

Then constrain it with at least one of these:

* Limited slots.
* Hand size.
* Time pressure.
* Upkeep.
* Rarity.
* One-use effects.
* Positional requirements.
* Enemy counters.
* Diminishing returns.
* Risk of collapse.

Design principle: **let players break the game sometimes, but make them earn it.** A rare absurd combo is memorable. A frequent solved combo makes the game small.

---

### 7. Make information legible

Players should be able to answer:

* What can I do?
* What will happen if I do it?
* Why did that happen?
* How close am I to danger?
* How close am I to winning?
* What changed because of my last action?

Card games die when the player cannot parse state.

For digital card games, show math, previews, arrows, highlights, stack order, and post-resolution summaries. For tabletop, use icons, reference cards, consistent card frames, and limited exception text.

A good rule of thumb: **the first time an effect happens, the game should teach itself.**

---

### 8. Give the player a medium-term plan

Great turns matter, but great card games also create a thought like:

> “Over the next few turns, I’m trying to become this kind of engine.”

That means the player needs visible strategic direction. Some ways to create it:

* Public market cards.
* Recipe/idea cards.
* Objective cards.
* Build paths.
* Technology rows.
* Player boards.
* Boss/blind previews.
* Scarcity signals.
* Achievements/quests that teach advanced play.

Stacklands’ “Idea” system is a good pattern: it guides discovery without making all combinations feel arbitrary. The designer ultimately allowed combinations from the start because gating them felt unfair, while Idea cards still taught players what was possible. ([Game Developer][10])

---

### 9. Decide whether interaction is direct, indirect, or social

For multiplayer, do not merely add “take that” cards. Decide what kind of interaction your game wants.

| Interaction type      | Example                                       | Risk                                           |
| --------------------- | --------------------------------------------- | ---------------------------------------------- |
| **Negotiation**       | Trade, promises, auctions.                    | Slow turns, kingmaking.                        |
| **Race**              | Shared goals, first-to-build, first-to-score. | Multiplayer solitaire.                         |
| **Blocking**          | Occupying spaces, denying cards.              | Feels mean if too punitive.                    |
| **Shared market**     | Buying cards others wanted.                   | Analysis paralysis.                            |
| **Shared threat**     | Players compete while danger rises.           | Runaway leader may hide behind table politics. |
| **Draft interaction** | Taking cards affects others’ options.         | New players may not see hate-drafting value.   |

Catan’s power is that dice production, hidden resource hands, trading, board placement, and robber pressure keep players socially involved even when it is not their turn. Its rules explicitly allow domestic trading with the active player, and resource production affects all players based on the die roll. 

---

### 10. Balance for interesting decisions, not perfect equality

Balance does not mean every card is equally strong. It means:

* Weak-looking cards have contexts where they shine.
* Strong cards have costs, timing problems, or deckbuilding demands.
* No card is always correct.
* No strategy wins without interacting with the game’s pressures.
* Losing players can usually identify a better future decision.

Track these during playtests:

| Metric                     | What it tells you                                      |
| -------------------------- | ------------------------------------------------------ |
| **Pick rate**              | Are players interested in this card?                   |
| **Win rate when picked**   | Is it too strong or too weak?                          |
| **Skip rate**              | Are choices boring or overcosted?                      |
| **Rule lookup frequency**  | Is the card too confusing?                             |
| **Turn length**            | Is the decision too complex?                           |
| **Comeback frequency**     | Is the game decided too early?                         |
| **Memorable moment count** | Are players getting stories?                           |
| **Blame language**         | Do players blame themselves, opponents, or randomness? |

Slay the Spire’s team treated pick rate and win presence as especially useful signals, but also emphasized that numbers alone do not say how a card feels. ([Game Developer][9])

## The design audit scorecard

Score each category from **0–10**. A design over **80** is likely worth content expansion. A design from **60–79** needs focused redesign. Under **60**, rebuild the core loop before adding more cards.

| Category                        | Score question                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **1. Emotional promise**        | Can you state the player fantasy in one sentence, and do the mechanics actually create it?            |
| **2. Core loop**                | Is the 30-second loop understandable, repeatable, and satisfying before you add lots of content?      |
| **3. Meaningful choices**       | Does each turn present at least two viable options with real trade-offs?                              |
| **4. Resource tension**         | Do resources create bottlenecks, timing decisions, and different strategic paths?                     |
| **5. Agency under randomness**  | Does randomness force adaptation while giving players mitigation tools?                               |
| **6. Synergy depth**            | Can players discover combos, engines, or emergent strategies that feel authored by them?              |
| **7. Constraints on power**     | Are strong combos limited by cost, rarity, timing, slots, risk, or counters?                          |
| **8. Legibility**               | Can players predict and understand outcomes without constant rule lookups?                            |
| **9. Feedback/game feel**       | Do plays feel good through reveal timing, scoring, animation, tactile handling, or clear resolution?  |
| **10. Pacing**                  | Does tension rise and release across turns, rounds, and the whole session?                            |
| **11. Discovery/replayability** | Does each game reveal new possibilities without requiring a wiki?                                     |
| **12. Interaction model**       | If multiplayer, are players engaged between turns? If solo, does the system create enough opposition? |
| **13. Balance knobs**           | Can you tune cards through cost, rarity, timing, quantity, caps, or targeting without rewriting them? |
| **14. Teachability**            | Can a new player make meaningful choices within the first few minutes?                                |
| **15. Memorable moments**       | After a test, can players describe one cool, tense, funny, or clever thing that happened?             |

## The per-card checklist

Before adding a card, answer these:

1. **What job does this card do?** Generate, convert, filter, multiply, protect, pressure, unlock, or score.
2. **Why would a player want it?**
3. **Why would a player sometimes reject it?**
4. **What strategy or archetype does it support?**
5. **Does it work outside that archetype, or is it narrow on purpose?**
6. **What card or system does it combo with?**
7. **What is its failure case?**
8. **What resource, timing, or opportunity cost does it create?**
9. **Can the player understand it in one read?**
10. **What knob can you tune later?** Cost, count, rarity, cooldown, cap, target, duration, trigger condition.
11. **Could it create an infinite loop?** If yes, is that rare, capped, or acceptable?
12. **Does it create a new decision, or just add arithmetic?**

A card that cannot answer #2 and #3 is usually either filler or overpowered.

## The fastest prototype path

Start smaller than you want.

**Prototype 1 should include:**

* 1 page of rules.
* 3 core resources.
* 24–40 cards.
* 3 archetypes.
* 1 pressure system.
* 1 way to improve your deck/engine.
* 1 way to remove, trade, sell, or transform weak cards.
* 1 visible win condition.
* 1 visible lose condition or timer.

Run tests in this order:

1. **Solo goldfish test:** Can the core loop function without another player?
2. **Blind teach test:** Can someone learn from the rules without you explaining?
3. **Choice test:** Pause each turn and ask, “What are you deciding between?”
4. **Emotion test:** After 10 minutes, ask, “What are you hoping to build?”
5. **Memory test:** After the session, ask, “What was the coolest moment?”
6. **Balance test:** Log which cards are always picked, never picked, or always blamed.
7. **Cut pass:** Remove 20% of cards. If the game improves, you had content bloat.

## Common red flags

* Players say, “I guess I’ll just do this.”
* The best move is obvious more than half the time.
* Players lose but cannot explain what they could have done differently.
* The game is only fun once a rare combo appears.
* New cards add exceptions instead of interactions.
* The first 20 minutes are setup for the “real game.”
* Players hoard because spending is scary but not interesting.
* The economy has one universally best resource.
* Randomness creates outcomes but not decisions.
* Multiplayer interaction only makes people feel attacked, not clever.
* The game has many cards but few verbs.
* You are fixing boredom by adding content instead of improving the loop.

## The north-star version

When checking a design, ask:

> **Does this game repeatedly let players make understandable, pressured choices that compound into surprising outcomes they feel responsible for?**

If yes, build content.

If no, do not add more cards yet. Fix the loop, the pressure, the economy, or the decision structure first.

[1]: https://www.cs.northwestern.edu/~hunicke/MDA.pdf "Microsoft Word - 2WS0404HunickeR.doc"
[2]: https://selfdeterminationtheory.org/player-experience-of-needs-satisfaction-pens/ "Player Experience of Needs Satisfaction (PENS) – selfdeterminationtheory.org"
[3]: https://scispace.com/pdf/gameflow-a-model-for-evaluating-player-enjoyment-in-games-4f7xfog0ca.pdf "GameFlow: a model for evaluating player enjoyment in games"
[4]: https://arxiv.org/abs/2011.09201 "[2011.09201] Designing Game Feel. A Survey"
[5]: https://store.steampowered.com/app/1948280/Stacklands/ "Stacklands on Steam"
[6]: https://www.gamedeveloper.com/business/localthunk-knew-balatro-needed-to-draw-players-in-with-poker "LocalThunk knew Balatro needed to draw players in with poker"
[7]: https://www.playstack.com/news/balatro-5-million-copies-sold/ "Latest News - Playstack - Balatro Deals a Full House of Success
♠️♠️♠️♦️♦️"
[8]: https://www.catan.com/about-us "About Us | CATAN"
[9]: https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder "How Slay the Spire's devs use data to balance their roguelike deck-builder"
[10]: https://www.gamedeveloper.com/business/how-stacklands-uses-simplicity-to-create-a-compelling-card-based-village-builder "How Stacklands uses simplicity to create a compelling card-based village builder"
