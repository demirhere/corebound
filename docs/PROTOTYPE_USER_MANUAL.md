# Corebound Prototype User Manual

This manual describes the current ten-sector Corebound board prototype. It supports solo play and PartyKit multiplayer. The app sets up the board automatically when the run launches or restarts, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Each sector deals a 3-card Mission deck. Click the deck to draw a Mission onto the Map when you need one, then stack Ready crew on that Mission to recover Fuel — the action shows the Fuel reward based on the best hand pattern your crew forms. Confirming the action consumes that Mission, sends the used crew to Tired, and draws 1 Cryo crew. After 3 Missions, pay the Sector Gate's Fuel cost to proceed.
```

## Objective

Pass 10 sector Gates. The 10-card ramp is fixed (8/9/16/17/21/24/27/31/34/38 Fuel, total 225) and shown in ascending order — every run faces the same difficulty curve. The first Gate is dealt face up; each successful Gate clear flips the next. **Sector 3 (cost 16) is a hard wall**: without Ship Parts and Crew Quarter Upgrades a greedy run averages ~9 Fuel/sector and cannot pass it.

Solo: you win immediately after the 10th Gate is cleared.

Multiplayer: the ship has to survive together. If any Gate cannot be paid, the run ends. If the final Gate clears, count each player's owned crew (Ready + Tired); the player with the most crew leads the new world.

Multiplayer tie-breakers:

1. Most Blueprints built.
2. Most Ready crew.
3. Shared victory.

You lose if the current Gate cannot be paid with available Fuel and crew-made Fuel.

## Starting Setup

The prototype uses 10 sectors, an on-screen 3-card Mission deck, an off-screen Cryo deck, an on-screen Gate deck, an off-screen Fuel deck + Discard, an off-screen Drift deck, a 3-slot Map, one face-up Gate, and a Hand area for each player. **MOTHER, Stress, Damage, and Discovery systems are temporarily disabled** while the open-mission economy is being tuned.

On load or restart, setup is staged as an animated deal. After the animation, the Map is empty and the current sector's Mission deck is ready to click.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 0 Fuel Cell cards | Starts empty. The first sector Gate forces players to earn Fuel from Missions before passing. |
| Fuel Deck | 50 Fuel Cell cards | Off-screen. Fuel rewards draw from here. If empty when Fuel would be drawn, shuffle the Fuel Discard back in first. |
| Fuel Discard | 0 Fuel Cell cards | Off-screen. Spent Fuel goes here, then can be reshuffled. |
| Starting Crew | 5 crew in solo, even hands in multiplayer | Deal 5 starting crew Ready. Multiplayer pads from the Cryo deck if 5 doesn't divide evenly. |
| Tired Crew | 0 crew | Starts empty. Crew used on Missions or the Gate go here. **Tired carries across sectors — there is no auto-reset.** When the Cryo Deck empties, the entire Tired pile reshuffles back into Cryo. |
| Missions | 3 Open Mission placeholders | On-screen sector deck. Click it to draw 1 Mission card onto the Map. Each new sector creates a fresh 3-card Mission deck. |
| Map | Empty | The Map starts each sector empty. Drawn Missions occupy one of the 3 Map slots and are consumed by exactly one stack action. After all 3 are consumed, only the Gate is reachable. |
| Ship Parts (Research Pool) | 20 unique blueprints | The joker-economy research pool. After each Gate clears, 2 random un-owned parts are offered for purchase with Scraps. Bought parts are removed from the pool for the rest of the run. You may pay the cheapest visible offer's cost to re-draw 2 new offers plus Upgrade Crew Quarters. |
| Active Ship Parts | 0 (max 5) | Passive bonuses owned by the run. Click *Discard* to refund `floor(cost/2)` Scraps and free the slot. |
| Upgrade Crew Quarters | 1 offer after each non-final Gate | Costs 4 Scraps to open. Reveals 3 random Crew Quarter Upgrades, then you pick 1 to research. Crew Quarter Upgrades are not removed from the catalog and duplicates stack. |
| Active Crew Quarter Upgrades | 0 | Stackable pattern bonuses owned by the run. Each researched upgrade grants +1 Fuel to its matching mission pattern, except Bridge Bunks grants +2 Fuel to Bridge Crew. |
| Scraps | 0 | The run's currency. Earned per mission (1–2 Fuel → 1, 3–4 → 2, 5+ → 3) plus any Ship Part scrap triggers (Recovery Drone, Cargo Hold). |
| Gate | 1 Gate card | The 10 Gates are dealt in fixed ascending order. The cheapest sits face up below the Map; the rest stack in the visible Gate Deck. |
| Gate Deck | 9 remaining Gates | Visible deck, ordered easiest → hardest. Each Gate clear draws the next. |
| MOTHER Deck | Disabled (0 cards) | Temporarily empty. MOTHER substitution and Stress are off. |
| Discovery Deck | Disabled | Not set up. Completing a Mission does not award a Discovery. |
| Drift Deck | 10 Drift cards | Shuffle 7 Burn + 3 Fatigue. Currently inert: no Gate carries an extra-Drift effect in this build. |
| Damage Deck | Disabled (0 cards) | Temporarily empty. Gates always clear cleanly; no Damage drawn. |
| Stress | Always 0 | Disabled. No source of Stress increment in this build. |
| Cryo Deck | 40 Cryo crew | Off-screen. 10 unique crew blueprints with varied copy counts (Juno/Priya ×5, Oren/Malik ×3, the rest ×4) so the 45-card roster lands on exactly 16 of each icon. After every action, the hand refills to its size cap (5, plus +1 with Adrenal Implants). Refill first reclaims any crew you parked on the board in stacks that aren't yet attached to a destination, gate, or hazard, then draws from Cryo for the rest. When Cryo runs out, the entire Tired pile reshuffles back into Cryo and refilling continues. |

## Crew Icons

Crew cards have **1 or 2** specialization icons. Icons are Engine, Life, Nav (formerly Star), and Science (beaker). Crew types are derived from how many icons a card carries:

- 2 same icons → **Specialist** (Engineer, Medic, Pilot, Operator).
- 2 different icons → **Generalist** (Mechanic, Scientist, Helmsman, Doctor, Recon, Pilot).
- 1 icon → **Single-icon crew**. Cannot satisfy Specialist, Cross-Trained, Department Heads, or Bridge Crew. They only contribute to shared-icon patterns (Common Ground, Common Knowledge, Common Cause).

Single-icon crew make up the majority of the Cryo deck (26 of 40), so the hand cycles toward shared-icon patterns once the starter doubles tire. The 4 matched specialists (Mara, Sana, Oren, Malik) are split across the starter + cryo decks so Bridge Crew remains reachable — though Mara and Sana are each 1 of 45 cards, so the high-tier specialist patterns are harder to assemble after sector 1.

The overall 45-card roster is exactly icon-balanced: 16 Engine, 16 Life, 16 Nav, 16 Science.

A Scientist + Mechanic stack still makes 1 Fuel (or 2 with Fuel Synthesizer drafted). A stack with 2 Engine icons + 2 Fuel Cells can still draft a Ship Part.

| Starting Crew | Icons | Role |
| --- | --- | --- |
| Lei Watanabe | Life, Nav | Pilot |
| Mara Voss | Engine, Engine | Engineer |
| Ada Chen | Engine, Science | Scientist |
| Sana Iqbal | Life, Life | Medic |
| Nia Okonkwo | Science, Nav | Recon |

| Cryo Crew | Icons | Role | Copies |
| --- | --- | --- | --- |
| Juno Pike | Engine | Engineer | 5 |
| Priya Shah | Life | Medic | 5 |
| Ilya Rao | Nav | Pilot | 4 |
| Kade Solis | Nav | Pilot | 4 |
| Beni Akpan | Science | Operator | 4 |
| Vera Kross | Science | Operator | 4 |
| Calla Reyes | Engine, Life | Mechanic | 4 |
| Davin Mori | Engine, Life | Mechanic | 4 |
| Oren Vale | Science, Science | Operator | 3 |
| Malik Ortega | Nav, Nav | Pilot | 3 |

## Missions

Mission cards are identical "Open Mission" placeholders. They do not display a specific icon requirement — the Fuel reward is computed dynamically when crew is stacked on them, based on the best hand pattern that crew satisfies.

**Hand patterns** (the system picks the highest-paying one your stacked crew matches). Reward = `sum(crew_ranks) × pattern_mult`; with every crew at rank 1 this simplifies to `crew_count × mult`:

| Pattern | Crew Need | Crew × Mult | Fuel |
| --- | --- | --- | ---: |
| Cross-Trained | 1 crew with 2 different icons | 1 × 1 | 1 |
| Common Ground | 2 crew sharing at least 1 icon | 2 × 1 | 2 |
| Specialist | 1 crew with matched icons | 1 × 2 | 2 |
| Common Knowledge | 3 crew that all share 1 icon | 3 × 1 | 3 |
| Department Heads | 2 different Specialists (different doubled icons) | 2 × 2 | 4 |
| Common Cause | 4 crew that all share 1 icon | 4 × 1 | 4 |
| Bridge Crew | 4 Specialists, one per icon (Mara + Sana + Malik + Oren) | 4 × 1.5 | 6 |

When you stack crew on a Mission, the action button above the stack reads `Recover N Fuel` where N is the highest pattern your crew matches. Click the action to confirm.

**Per-action effects:**
1. The Mission card is consumed (removed from the Map).
2. All crew on the stack become Tired.
3. The active player draws 1 crew from the Cryo deck (if any remain).
4. The fuel reward draws N Fuel Cells from the Fuel Deck into the Fuel Supply. Active Ship Parts (jokers) can add bonus Fuel — see the Ship Parts section below. Automatic Fuel placement fills fuel-only stacks up to 9 cards, then uses the next largest fuel-only stack or starts a new stack; manual stacking can exceed 9 cards.
5. The mission also pays Scraps — the run's currency for buying Ship Parts and opening Upgrade Crew Quarters. Scrap reward tier: 1–2 Fuel earned → 1 Scrap, 3–4 → 2, 5+ → 3. Zero Fuel earns no Scraps.

A sector has at most 3 Mission actions because the sector Mission deck has only 3 placeholders. After all 3 are drawn and consumed, only the Gate remains.

### Fuel-per-crew efficiency

Greedy strategy is to maximize Fuel per crew used, because crew tire on use:

| Pattern | Crew Used | Fuel | Fuel/Crew |
| --- | ---: | ---: | ---: |
| Bridge Crew | 4 | 6 | 1.5 |
| Department Heads | 2 | 4 | 2.0 |
| Specialist | 1 | 2 | 2.0 |
| Common Cause | 4 | 4 | 1.0 |
| Common Ground | 2 | 2 | 1.0 |
| Common Knowledge | 3 | 3 | 1.0 |
| Cross-Trained | 1 | 1 | 1.0 |

Sim shows greedy max-fuel-pattern play earns ~6.5 Fuel/sector (without joker bonuses) — single-icon crew dilute the hand once starters tire, and with cryo at 40 cards Mara/Sana are each 1 of 45, so high-tier specialist patterns appear less often. Without Ship Parts and Crew Quarter Upgrades the back-end gates 21/24/27/31/34/38 are unreachable; even with a greedy joker buyer, only ~2% of runs win.

## Sector Loop

At sector start the Map is empty, the 3-card Mission deck is clickable, and the Gate sits face up below the Map. Click the Mission deck to draw a Mission when you need one. On each turn:

1. Stack Ready crew (and optionally Fuel Cells) onto a target — a Mission, a Ship Part Research stack, or the Gate.
2. The stack shows an action button when it satisfies a known pattern. Common labels:
   - **Recover N Fuel** — Mission stack satisfies a hand pattern.
   - **Make 1 Fuel / Make 2 Fuel** — Scientist + Mechanic pair.
   - **Draft ship part** — 2 Engine icons + 2 Fuel Cells.
   - **Complete sector** — Gate stack satisfies the Fuel cost.
3. Click the action to resolve. Used crew become Tired and the hand immediately refills back to its size cap (5, +1 with Adrenal Implants). Refill first reclaims any crew you parked on the board in stacks that aren't yet attached to a destination, gate, or hazard, then draws from Cryo for the rest. When Cryo is empty, the entire Tired pile reshuffles back into Cryo before refilling continues.

The sector ends when the Gate clears. **There is no Tired-to-Ready auto-reset** — the Balatro-style cycle keeps running across sectors. The next sector creates a fresh 3-card Mission deck and opens the Research Dialog.

## Gate Cards

Gate requirements are Fuel-only checks. **None of the current Gates carry a special effect or extra clean-clear cost** — passing always clears cleanly. Damage is not drawn in this build.

Gates form a fixed 10-card sequence with monotonically increasing Fuel cost — every run faces the same difficulty ramp from sector 1 to sector 10. Total cost 225 Fuel. Tuned so that S1-S2 are passable for unaided play, S3 is a hard wall that requires Ship Parts and Crew Quarter Upgrades to clear, and the back-end gates demand a deliberate joker stack. Overall win rate ≈ 2% with greedy joker buying, 0% without (verified by `pnpm sim`).

| Sector | Gate | Pass Fuel |
| ---: | --- | ---: |
| 1 | Narrow Crossing | 8 |
| 2 | Old Pass | 9 |
| 3 | Lost Beacon | 16 |
| 4 | Dust Reach | 17 |
| 5 | Cold Mirror | 21 |
| 6 | Echo Vault | 24 |
| 7 | Hollow Span | 27 |
| 8 | Iron Shoal | 31 |
| 9 | Black Threshold | 34 |
| 10 | Drowned Comm | 38 |

Gate resolution:
1. Stack Fuel Cells (and optionally Scientist + Mechanic pairs to make Fuel) on the Gate.
2. Click **Complete sector** when the stack covers the Fuel cost.
3. The Gate clears and the next sector creates a fresh 3-card Mission deck with an empty Map. Active Ship Parts then apply their sector-end effects (extra Fuel from Reserve Capacitor / Sector Engine / Veteran's Insignia, Scraps→Fuel from Scrap Forge / Fuel Cell Distillery), and the **Research Dialog** opens with 2 random Ship Part offers from the un-owned pool plus Upgrade Crew Quarters.

If you can't pay the Fuel cost and there's no productive Mission left, the run ends.

## Ship Parts

Ship Parts are passive bonuses bought with Scraps from the Research Dialog after each gate. Click an offer card to research it. The pool has **20 unique parts**; once owned, a part is removed from the pool for the rest of the run, so each shop draw gets steadily rarer cards. You can hold at most **5 active Ship Parts**. Clicking **Next Sector** closes the dialog without a default Scrap consolation. Clicking **Re-draw** spends Scraps equal to the cheapest visible offer and replaces the visible offers with up to 2 new un-owned parts plus fresh Upgrade Crew Quarters.

**Stacking discard** — clicking *Discard* on an active Ship Part frees the slot and refunds `floor(cost/2)` Scraps. Use this when a stronger offer appears and your slots are full.

**Catalog (20 unique parts):**

| Name | Cost | Refund | Category | Effect |
| --- | ---: | ---: | --- | --- |
| Reinforced Manifold | 3 | 1 | Icon (Engine) | +1 Fuel when used crew has Engine |
| Hydroponics Bay | 3 | 1 | Icon (Life) | +1 Fuel when used crew has Life |
| Stellar Cartographer | 3 | 1 | Icon (Nav) | +1 Fuel when used crew has Nav |
| Lab Centrifuge | 3 | 1 | Icon (Science) | +1 Fuel when used crew has Science |
| Lean Manifest | 5 | 2 | Pattern | Mission using ≤2 crew: +2 Fuel |
| Crew Synergy | 10 | 5 | Pattern | +1 Fuel per crew used in mission (max +4) |
| Mission Streak | 3 | 1 | First-mission | Pattern fuel +1 per consecutive same-pattern mission (max +3) |
| Pre-Flight Tune-Up | 5 | 2 | First-mission | First mission of sector: +2 Fuel |
| Final Burn | 6 | 3 | Last-mission | Last mission of sector: +2 Fuel |
| Compounding Drive | 8 | 4 | Scrap | Every 4 missions completed: permanent +1 Fuel/mission (max +3) |
| Reserve Capacitor | 6 | 3 | Scrap | End of sector: +1 Fuel per unused Ready crew (max 5) |
| Recovery Drone | 5 | 2 | Scrap | First mission of sector: +2 Scraps |
| Cargo Hold | 5 | 2 | Scrap | Last mission of sector: +2 Scraps |
| Scrap Forge | 6 | 3 | Converter | End of sector: spend 2 Scraps → +1 Fuel (auto) |
| Fuel Cell Distillery | 9 | 4 | Converter | End of sector: spend 4 Scraps → +2 Fuel (auto) |
| Emergency Reserves | 5 | 2 | Converter | First mission of sector: spend 1 Scrap → +1 Fuel (auto) |
| Adrenal Implants | 8 | 4 | Hand | Hand size +1 |
| Tachyon Lens | 9 | 4 | Wild | First crew stacked counts as having all 4 icons |
| Sector Engine | 6 | 3 | Special | Sectors 3, 6, 9: +2 Fuel at end of sector |
| Veteran's Insignia | 7 | 3 | Special | Sector 10 only: +3 Fuel at end of sector |

## Crew Quarter Upgrades

Crew Quarter Upgrades are stackable pattern bonuses bought through Upgrade Crew Quarters in the Research Dialog after each non-final Gate. Opening Upgrade Crew Quarters costs **4 Scraps**, reveals **3 random Crew Quarter Upgrades**, and forces you to pick 1. Picking consumes the offer; there is no refund or back-out after opening. Re-draw replaces both Ship Part offers and the unopened or opened upgrade contents.

Unlike Ship Parts, Crew Quarter Upgrades have no slot cap and are not removed from the catalog. Researching the same upgrade again stacks its bonus on every future mission that resolves as that pattern.

| Name | Pack Cost | Pattern | Effect |
| --- | ---: | --- | --- |
| Training Bay | 4 | Cross-Trained | +1 Fuel each Cross-Trained mission |
| Shared Berths | 4 | Common Ground | +1 Fuel each Common Ground mission |
| Specialist Pod | 4 | Specialist | +1 Fuel each Specialist mission |
| Study Module | 4 | Common Knowledge | +1 Fuel each Common Knowledge mission |
| Command Suite | 4 | Department Heads | +1 Fuel each Department Heads mission |
| Unity Dorm | 4 | Common Cause | +1 Fuel each Common Cause mission |
| Bridge Bunks | 4 | Bridge Crew | +2 Fuel each Bridge Crew mission |

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
2. Tired crew remain Tired; there is no sector-end auto-reset.
3. Active Ship Parts and researched Crew Quarter Upgrades stay active.
4. Fuel and any spent Fuel in the Discard carry forward.
5. The next Gate flips face up below the Map.
6. A fresh 3-card Mission deck is dealt on-screen; the Map starts empty until a player clicks the deck.

After the 10th Gate clears, the arrival screen opens automatically.

## Prototype Controls

The Mission deck is on-screen and clickable. Click it to draw 1 Mission card onto the next Map slot; drag it only if you want to move the deck.

Drag Ready crew from the Hand area onto a Mission, the Gate, or empty space to start a stack. Drop another card on a stack to grow it. Click Ready crew to add it to the top valid stack that already contains crew, or to start a new stack if no crew is on the board. Click the action button above a ready stack to confirm.

Drag visible drafted Ship Part cards onto each other to organize space. Ship Part cards cannot be discarded.

Use the **End turn** button to advance turns and let multiplayer rotate. The next turn player immediately draws 1 Cryo crew into Ready if any remain. After the final Gate succeeds, the arrival screen opens automatically.

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

Solo: win by completing the 10th Gate.

Multiplayer scoring happens only if the ship survives:

```text
If any Gate fails: everyone loses.
If the final Gate succeeds: count each player's owned crew (Ready + Tired).
Most crew wins.
```

If crew totals tie, compare Blueprints built, then Ready crew. If still tied, the victory is shared.

You lose if the current Gate cannot be paid with available Fuel + crew-made Fuel.

## Player Aid

```text
CORE LOOP

Sector start: 3-card Mission deck and empty Map. Gate sits face up.
1. Click the Mission deck to draw a Mission, then stack Ready crew on it. Action button reads "Recover N Fuel".
2. Click the action.
   - Mission card consumed.
   - Used crew → Tired.
   - Draw 1 Cryo crew into Ready.
3. Repeat up to 3 Missions.
4. Stack Fuel on the Gate to cover its cost.
5. Click "Complete sector". Next sector creates a fresh 3-card Mission deck and opens Research.

PATTERNS (highest pays best)

Bridge Crew: 4 Specialists, one of each icon → 6 Fuel
Department Heads: 2 different Specialists → 4 Fuel
Common Cause: 4 crew sharing 1 icon → 4 Fuel
Common Knowledge: 3 crew sharing 1 icon → 3 Fuel
Specialist: 1 matched-icon crew → 2 Fuel
Common Ground: 2 crew sharing 1 icon → 2 Fuel
Cross-Trained: 1 mixed-icon crew → 1 Fuel

GATES

Fixed 10-gate ramp: 8/9/16/17/21/24/27/31/34/38 Fuel.
Sectors 1-2 are passable unaided; Sector 3 is the Ship Parts + Crew Quarter Upgrades wall.

RESEARCH

After each non-final Gate: 2 Ship Part offers plus Upgrade Crew Quarters.
Ship Parts: 20-card pool, max 5 active, bought parts leave the pool.
Upgrade Crew Quarters: pay 4 Scraps, reveal 3 Crew Quarter Upgrades, pick 1. Duplicates stack.
Re-draw costs the cheapest visible offer and refreshes both Ship Parts and Upgrade Crew Quarters.

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
