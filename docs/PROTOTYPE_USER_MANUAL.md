# Corebound Prototype User Manual

This manual describes the current ten-sector Corebound board prototype. It supports solo play and PartyKit multiplayer. The app sets up the board automatically when the run launches or restarts, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Each sector deals 3 Mission cards. Stack Ready crew on a Mission to recover Fuel — the action shows the Fuel reward based on the best hand pattern your crew forms. Confirming the action consumes that Mission, sends the used crew to Tired, and draws 1 Cryo crew. After 3 Missions (or fewer), pay the Sector Gate's Fuel cost to proceed.
```

## Objective

Pass 10 sector Gates. At setup, 23 Gates shuffle, 10 are picked and ordered easiest → hardest by Fuel cost. The first (cheapest) Gate is dealt face up; each successful Gate clear draws the next from the visible Gate Deck.

Solo: you win after the 10th Gate is cleared and **End run** is pressed.

Multiplayer: the ship has to survive together. If any Gate cannot be paid, the run ends. If the final Gate clears, press **End run** and count each player's owned crew (Ready + Tired); the player with the most crew leads the new world.

Multiplayer tie-breakers:

1. Most Blueprints built.
2. Most Ready crew.
3. Shared victory.

You lose if the current Gate cannot be paid with available Fuel and crew-made Fuel.

## Starting Setup

The prototype uses 10 sectors, an off-screen Mission deck, an off-screen Cryo deck, an on-screen Gate deck, an off-screen Fuel deck + Discard, an off-screen Drift deck, a 3-slot Map, one face-up Gate, and a Hand area for each player. **MOTHER, Stress, Damage, and Discovery systems are temporarily disabled** while the open-mission economy is being tuned.

On load or restart, setup is staged as an animated deal. After the animation, the Map is already populated with 3 Mission cards — no click required.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 0 Fuel Cell cards | Starts empty. The first sector Gate forces players to earn Fuel from Missions before passing. |
| Fuel Deck | 50 Fuel Cell cards | Off-screen. Fuel rewards draw from here. If empty when Fuel would be drawn, shuffle the Fuel Discard back in first. |
| Fuel Discard | 0 Fuel Cell cards | Off-screen. Spent Fuel goes here, then can be reshuffled. |
| Starting Crew | 5 crew in solo, even hands in multiplayer | Deal 5 starting crew Ready. Multiplayer pads from the Cryo deck if 5 doesn't divide evenly. |
| Tired Crew | 0 crew | Starts empty. Crew used on Missions or the Gate go here. **All Tired crew untire automatically when a sector ends (after the Gate clears).** |
| Missions | 30 Open Mission placeholders | Off-screen. 3 are auto-dealt to the Map at sector 1 setup; another 3 are auto-dealt at the start of each subsequent sector. After 10 sectors the deck is empty by design. |
| Map | 3 Mission cards (auto-dealt) | The Map starts each sector with 3 face-up Mission placeholders. Each Mission is consumed by exactly one stack action. After all 3 are consumed, only the Gate is reachable. |
| Ship Parts | 4 Ship Part cards | Shuffle Medbay Rehydrator, Service Drone Bay, Adaptive Control Console, and Fuel Synthesizer. Research draws the top 2 for a draft choice. |
| Gate | 1 Gate card | Shuffle 23 Gates, pick 10, order them easiest → hardest by Fuel cost. The cheapest sits face up below the Map; the rest stack in the visible Gate Deck. |
| Gate Deck | 9 remaining Gates | Visible deck, ordered easiest → hardest. Each Gate clear draws the next. |
| MOTHER Deck | Disabled (0 cards) | Temporarily empty. MOTHER substitution and Stress are off. |
| Discovery Deck | Disabled | Not set up. Completing a Mission does not award a Discovery. |
| Drift Deck | 10 Drift cards | Shuffle 7 Burn + 3 Fatigue. Currently inert: no Gate carries an extra-Drift effect in this build. |
| Damage Deck | Disabled (0 cards) | Temporarily empty. Gates always clear cleanly; no Damage drawn. |
| Stress | Always 0 | Disabled. No source of Stress increment in this build. |
| Cryo Deck | 7 Cryo crew | Off-screen. After every action, the player draws 1 Cryo crew into Ready. After ~3 sectors (9 actions) the deck typically empties; from then on no replenishment until cryo wakes resume in a future build. |

## Crew Icons

Each crew card has two specialization icons. Icons are Engine, Life, Nav (formerly Star), and Science (beaker). Crew types are derived from the icon pair:

- 2 same icons → **Specialist** (Engineer, Medic, Pilot, Operator).
- 2 different icons → **Generalist** (Mechanic, Scientist, Helmsman, Doctor, Recon, Pilot).

A Scientist + Mechanic stack still makes 1 Fuel (or 2 with Fuel Synthesizer drafted). A stack with 2 Engine icons + 2 Fuel Cells can still draft a Ship Part.

| Starting Crew | Icons | Role |
| --- | --- | --- |
| Lei Watanabe | Life, Nav | Pilot |
| Mara Voss | Engine, Engine | Engineer |
| Ada Chen | Engine, Science | Scientist |
| Sana Iqbal | Life, Life | Medic |
| Nia Okonkwo | Science, Nav | Recon |

| Cryo Crew | Icons | Role |
| --- | --- | --- |
| Juno Pike | Engine, Nav | Helmsman |
| Tomas Hale | Engine, Life | Mechanic |
| Priya Shah | Life, Engine | Mechanic |
| Elise Tan | Life, Science | Doctor |
| Ilya Rao | Nav, Science | Recon |
| Oren Vale | Science, Science | Operator |
| Malik Ortega | Nav, Nav | Pilot |

## Missions

Mission cards are identical "Open Mission" placeholders. They do not display a specific icon requirement — the Fuel reward is computed dynamically when crew is stacked on them, based on the best hand pattern that crew satisfies.

**Hand patterns** (the system picks the highest-paying one your stacked crew matches):

| Pattern | Crew Need | Fuel |
| --- | --- | ---: |
| Cross-Trained | 1 crew with 2 different icons | 1 |
| Common Ground | 2 crew sharing at least 1 icon | 1 |
| Specialist | 1 crew with matched icons | 2 |
| Common Knowledge | 3 crew that all share 1 icon | 3 |
| Department Heads | 2 different Specialists (different doubled icons) | 5 |
| Common Cause | 4 crew that all share 1 icon | 8 |
| Bridge Crew | 4 Specialists, one per icon (Mara + Sana + Malik + Oren) | 16 |

When you stack crew on a Mission, the action button above the stack reads `Recover N Fuel` where N is the highest pattern your crew matches. Click the action to confirm.

**Per-action effects:**
1. The Mission card is consumed (removed from the Map).
2. All crew on the stack become Tired.
3. The active player draws 1 crew from the Cryo deck (if any remain).
4. The fuel reward draws N Fuel Cells from the Fuel Deck into the Fuel Supply. Automatic Fuel placement fills fuel-only stacks up to 9 cards, then uses the next largest fuel-only stack or starts a new stack; manual stacking can exceed 9 cards.

A sector has at most 3 Mission actions because only 3 Mission placeholders are dealt. After all 3 are consumed (or skipped), only the Gate remains.

### Fuel-per-crew efficiency

Greedy strategy is to maximize Fuel per crew used, because crew tire on use:

| Pattern | Crew Used | Fuel | Fuel/Crew |
| --- | ---: | ---: | ---: |
| Bridge Crew | 4 | 16 | 4.0 |
| Department Heads | 2 | 5 | 2.5 |
| Specialist | 1 | 2 | 2.0 |
| Common Cause | 4 | 8 | 2.0 |
| Cross-Trained | 1 | 1 | 1.0 |
| Common Knowledge | 3 | 3 | 1.0 |
| Common Ground | 2 | 1 | 0.5 |

Sim shows greedy max-fuel-pattern play earns ~7 Fuel in sector 1 (limited starting crew), rising to ~27 Fuel/sector once Cryo fills out by sector 4+.

## Sector Loop

At sector start the Map already has 3 face-up Mission cards and the Gate sits face up below them. There is no manual Mission draw. On each turn:

1. Stack Ready crew (and optionally Fuel Cells) onto a target — a Mission, a Ship Part Research stack, or the Gate.
2. The stack shows an action button when it satisfies a known pattern. Common labels:
   - **Recover N Fuel** — Mission stack satisfies a hand pattern.
   - **Make 1 Fuel / Make 2 Fuel** — Scientist + Mechanic pair.
   - **Draft ship part** — 2 Engine icons + 2 Fuel Cells.
   - **Complete sector** — Gate stack satisfies the Fuel cost.
3. Click the action to resolve. Used crew become Tired and the next Cryo crew comes off the deck into Ready.

The sector ends when the Gate clears. All Tired crew untire (return to Ready) automatically; the next sector deals 3 fresh Mission cards.

## Gate Cards

Gate requirements are Fuel-only checks. **None of the current Gates carry a special effect or extra clean-clear cost** — passing always clears cleanly. Damage is not drawn in this build.

Gates form a fixed 10-card sequence with monotonically increasing Fuel cost — every run faces the same difficulty ramp from sector 1 to sector 10. Total cost 250 Fuel. Tuned so sector-1 pass rate is ~95% and overall win rate is ~4% with greedy stack play (verified by `pnpm sim`).

| Sector | Gate | Pass Fuel |
| ---: | --- | ---: |
| 1 | Narrow Crossing | 9 |
| 2 | Old Pass | 12 |
| 3 | Lost Beacon | 15 |
| 4 | Dust Reach | 18 |
| 5 | Cold Mirror | 22 |
| 6 | Echo Vault | 26 |
| 7 | Hollow Span | 30 |
| 8 | Iron Shoal | 34 |
| 9 | Black Threshold | 38 |
| 10 | Drowned Comm | 46 |

Gate resolution:
1. Stack Fuel Cells (and optionally Scientist + Mechanic pairs to make Fuel) on the Gate.
2. Click **Complete sector** when the stack covers the Fuel cost.
3. The Gate clears, the next Gate flips face up, all Tired crew reset to Ready, and the Map deals 3 new Mission cards automatically.

If you can't pay the Fuel cost and there's no productive Mission left, the run ends.

## Ship Parts

Research costs 2 Engine icons + 2 Fuel Cells. When that stack is ready, click **Draft ship part**, draw the top 2 Ship Parts, choose 1, and bottom the other.

| Ship Part | Effect |
| --- | --- |
| Medbay Rehydrator | Ready +1 crew after each sector (additive on top of the automatic Tired reset). |
| Service Drone Bay | Reduce Sector Gate crew need by 1 (currently irrelevant — Gates have 0 crew need). |
| Adaptive Control Console | Reduce required Gate Fuel by 1. |
| Fuel Synthesizer | Scientist + Mechanic pair makes 2 Fuel instead of 1. |

In multiplayer, drafted Ship Parts are credited to the current Mission Lead for tie-break scoring; their effects help the whole ship.

## Disabled Systems

The following are present in code but currently inert. They will be re-enabled after the open-mission economy stabilizes.

- **MOTHER + Stress.** MOTHER deck has 0 cards. No MOTHER substitution, no Stress accumulation.
- **Damage / Hazards.** Damage deck has 0 cards. Gates always clear cleanly; no Damage drawn.
- **Discoveries.** Discovery deck not set up. Mission completion does not award a Discovery.
- **Drift effects.** No Gate currently calls for Drift, so the Drift deck is unused.

Reach into the corresponding blueprint files (`damageDeck.ts`, `setup.ts`'s `MOTHER_DECK_SIZE`, etc.) when re-enabling.

## Valid Completion Stacks

A **Mission** completion stack contains the Mission card + Ready crew. The action label reads `Recover N Fuel` where N comes from the best matching hand pattern.

A **Research** stack contains Ready crew with 2 total Engine icons + exactly 2 Fuel Cells. The action label reads `Draft ship part`.

A **Gate** completion stack contains the Gate card + Fuel Cells (and optionally Scientist + Mechanic pairs to convert crew to Fuel). The action label reads `Complete sector` when the pass cost is covered.

A **Scientist + Mechanic** crew-only stack (no Mission) makes 1 Fuel (2 with Fuel Synthesizer) on its own action.

Other card types in the same stack block completion.

## Sector Transition

After each non-final Gate clears:

1. The Gate, the unconsumed Mission cards, and any expired stacks clear off the board.
2. **All Tired crew return to Ready automatically.** Medbay Rehydrator additionally readies +1 crew on top of the reset (currently no-op since reset already empties Tired).
3. Drafted Ship Part cards stay; unspent Ship Parts remain available, spent ones remain spent.
4. Fuel and any spent Fuel in the Discard carry forward.
5. The next Gate flips face up below the Map.
6. 3 new Mission cards are auto-dealt to the Map.

After the 10th Gate clears, play locks to **End run**. Pressing it shows the arrival screen.

## Prototype Controls

The Mission deck is off-screen and not clickable — Missions are dealt automatically.

Drag Ready crew from the Hand area onto a Mission, the Gate, or empty space to start a stack. Drop another card on a stack to grow it. Click Ready crew to add it to the top valid stack that already contains crew, or to start a new stack if no crew is on the board. Click the action button above a ready stack to confirm.

Drag visible drafted Ship Part cards onto each other to organize space. Ship Part cards cannot be discarded.

Use the **End turn** button to advance turns and let multiplayer rotate. The next turn player immediately draws 1 Cryo crew into Ready if any remain. After the final Gate succeeds, this control becomes **End run**.

Drag a stack to the discard zone to discard it. Gates, active Map Missions, and visible drafted Ship Parts cannot be discarded.

Use **Restart and reshuffle** to start a fresh random run.

## Realtime Multiplayer

The prototype can run with a PartyKit room so other browsers can join the same table in realtime. Start the Vite app and PartyKit dev server together:

```text
pnpm dev
pnpm party:dev
```

The first browser is a host by default. When the host opens the root table without a `room` query parameter, the launch screen creates a four-letter table code and updates the URL with that room. Other players join the same room with `role=player`, for example:

```text
http://localhost:5173/?room=corebound-table&role=player
```

Use the launch screen's **Copy link** control or the Network panel's **Copy player link** control when sharing across browsers; both include the resolved PartyKit host.

On the Netlify deployment, the app expects the PartyKit server at `corebound.demirhere.partykit.dev`. If using a different PartyKit project host, open the host page with `partyHost=your-project.your-name.partykit.dev`; the copied player link will keep that override.

Players who are connected on the start screen become the player roster when **Launch** is pressed. Late joiners after launch receive the current table state but are not added to the scoring roster for that run.

The app still accepts `role=observer` for a read-only view.

## Win And Loss Summary

Solo: win by completing the 10th Gate and pressing **End run**.

Multiplayer scoring happens only if the ship survives:

```text
If any Gate fails: everyone loses.
If the final Gate succeeds: press End run, then count each player's owned crew (Ready + Tired).
Most crew wins.
```

If crew totals tie, compare Blueprints built, then Ready crew. If still tied, the victory is shared.

You lose if the current Gate cannot be paid with available Fuel + crew-made Fuel.

## Player Aid

```text
CORE LOOP

Sector start: 3 Mission cards auto-deal to the Map. Gate sits face up.
1. Stack Ready crew on a Mission. Action button reads "Recover N Fuel".
2. Click the action.
   - Mission card consumed.
   - Used crew → Tired.
   - Draw 1 Cryo crew into Ready.
3. Repeat up to 3 Missions.
4. Stack Fuel on the Gate to cover its cost.
5. Click "Complete sector". All Tired crew untire. Next sector auto-deals 3 Missions.

PATTERNS (highest pays best)

Bridge Crew: 4 Specialists, one of each icon → 16 Fuel
Common Cause: 4 crew sharing 1 icon → 8 Fuel
Department Heads: 2 different Specialists → 5 Fuel
Common Knowledge: 3 crew sharing 1 icon → 3 Fuel
Specialist: 1 matched-icon crew → 2 Fuel
Cross-Trained: 1 mixed-icon crew → 1 Fuel
Common Ground: 2 crew sharing 1 icon → 1 Fuel

GATES

Standard: 9 Fuel × 6 cards (sectors 1-2 typically)
Tough: 26 Fuel × 9 cards (mid sectors)
Hazard: 56 Fuel × 8 cards (late sectors)

SHIP PARTS

Medbay Rehydrator: ready +1 crew after each sector (on top of automatic reset).
Service Drone Bay: reduce Sector Gate crew need by 1 (no-op in this build).
Adaptive Control Console: reduce required Gate Fuel by 1.
Fuel Synthesizer: Scientist + Mechanic pair makes 2 Fuel.
Unspent Ship Parts carry forward.

DISABLED THIS BUILD

MOTHER, Stress, Damage, Discoveries — wiring intact, decks empty.

MULTIPLAYER

Mission Lead takes the full turn.
Other players add or remove their own crew with click or drag.
Fuel rewards help the shared ship.
Cryo draws go to the active player.
Blueprints help everyone, score for the Mission Lead who drafted them.
Any Gate failure means everyone loses.
```
