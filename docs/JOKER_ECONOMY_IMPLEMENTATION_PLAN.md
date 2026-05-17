# Joker Economy — Implementation Plan

Reference doc for the Balatro-inspired redesign: crew ranks, ship parts (jokers), Scraps currency, research dialog, no-duplicates shop, monotonic gate ramp. Sim-verified design ready for code.

## Verified targets (sim, 1M runs)

| Mode | Win | S1 pass | Avg scraps/run | Avg jokers/run |
|---|---:|---:|---:|---:|
| With jokers | **4.80%** | 100% | 73.9 | 8.27 |
| No jokers | **0.00%** | 100% | 32.6 | 0 |

**Curve** — monotonic dropout:

```
S1 100% → S3 96% → S5 90% → S6 84% → S7 74% → S8 57% → S9 38% → S10 17% → WIN 4.80%
```

**Per-sector dropouts:** S2 4.2% → S3 3.7% → S4 2.4% → S5 5.7% → S6 10.1% → S7 16.9% → S8 19.2% → S9 20.7% → S10 12.5%.

Sim source of truth: `scripts/simulate-tight.mjs`.

---

## Final game-rule decisions (locked)

### Crew

- 12 crew unchanged; each gains `rank: number = 1` (later upgrades will raise rank, multiplying fuel rewards).
- 4 specialty icons unchanged: Engine, Life, Nav, Science.
- Single-spec crew deferred — all 12 keep 2 specs.

### Pattern fuel rewards

Tight, no jackpot. Formula: `fuel = sum(crew_ranks) × pattern_mult`. With rank=1, simplifies to `crew_count × pattern_mult`.

| Pattern | Crew | Mult | Fuel |
|---|---:|---:|---:|
| Cross-Trained | 1 | 1 | **1** |
| Common Ground | 2 | 1 | **2** |
| Specialist | 1 | 2 | **2** |
| Common Knowledge | 3 | 1 | **3** |
| Department Heads | 2 | 2 | **4** |
| Common Cause | 4 | 1 | **4** |
| Bridge Crew | 4 | 1.5 | **6** |

### Hand cycle

- Hand size cap: **5** (will become a stat affected by jokers).
- Played crew → tired pile.
- Hand refills from the Crew deck after each action.
- Crew deck empty → tired reshuffles into the Crew deck, draws continue.
- **No sector-end auto-reset** of tired (the cycle is continuous).

### Scraps (currency)

- Per mission: `1 fuel`→0, `1-2 fuel`→1, `3-4 fuel`→2, `5+ fuel`→3.
  - (zero fuel = no scraps; mission must produce fuel to pay)
- End-of-sector interest: **+1 Scrap per 4 held, cap +3**.
- Skipping research dialog: **+1 Scrap consolation**.

### Ship Parts (jokers)

- **5 active slots max.**
- **No duplicates.** Each ship part is unique; once owned it's removed from the research pool for the rest of the run. Shop only ever offers parts not already owned.
- Research dialog opens after every gate clear: 2 cards drawn from the un-owned pool, player buys 0/1/2 (afford permitting).
- **Stacking discard**: stacking an active joker on a mission consumes it for `floor(cost/2)` Scraps refund when the mission resolves. Frees the slot.

### Gate ramp

Fixed 10-gate sequence, sorted ascending in the visible Gate Deck. Total 161 Fuel.

| Sector | Cost |
|---:|---:|
| 1 | 10 |
| 2 | 11 |
| 3 | 12 |
| 4 | 13 |
| 5 | 15 |
| 6 | 17 |
| 7 | 18 |
| 8 | 19 |
| 9 | 22 |
| 10 | 24 |

---

## Ship-part catalog (25 unique)

Cost / Refund / Effect. Refunds = `floor(cost/2)`.

| Name | Cost | Refund | Category | Effect |
|---|---:|---:|---|---|
| Reinforced Manifold | 3 | 1 | Icon (E) | +1 Fuel when used crew has Engine icon |
| Hydroponics Bay | 3 | 1 | Icon (L) | +1 Fuel when used crew has Life icon |
| Stellar Cartographer | 3 | 1 | Icon (N) | +1 Fuel when used crew has Nav icon |
| Lab Centrifuge | 3 | 1 | Icon (S) | +1 Fuel when used crew has Science icon |
| Cross-Brace Couplers | 4 | 2 | Pattern | Cross-Trained pattern: +1 Fuel |
| Crew Stim Packs | 4 | 2 | Pattern | Common Ground: +1 Fuel |
| Specialist Gauntlets | 5 | 2 | Pattern | Specialist & Department Heads: +1 Fuel |
| Cluster Dynamo | 5 | 2 | Pattern | Common Knowledge: +1 Fuel |
| Common Cause Banner | 6 | 3 | Pattern | Common Cause: +1 Fuel |
| Bridge Uplink | 7 | 3 | Pattern | Bridge Crew: +2 Fuel |
| Ration Optimizer | 3 | 1 | First-mission | First mission of sector: +1 Fuel |
| Pre-Flight Tune-Up | 5 | 2 | First-mission | First mission of sector: +2 Fuel |
| Ablative Plating | 4 | 2 | Last-mission | Last (3rd) mission of sector: +1 Fuel |
| Final Burn | 6 | 3 | Last-mission | Last (3rd) mission of sector: +2 Fuel |
| Salvage Sifter | 4 | 2 | Scrap | +1 Scrap per mission |
| Quartermaster | 4 | 2 | Scrap | +2 Scraps at end of sector |
| Compound Interest | 5 | 2 | Interest | Interest threshold 4 → 3 |
| Auction House | 5 | 2 | Interest | Interest cap 3 → 4 |
| Scrap Forge | 6 | 3 | Converter | End of sector: spend 2 Scraps → +1 Fuel (auto) |
| Fuel Cell Distillery | 9 | 4 | Converter | End of sector: spend 4 Scraps → +2 Fuel (auto) — **bumped from 8 to 9 per pre-emptive nerf** |
| Emergency Reserves | 5 | 2 | Converter | First mission of sector: spend 1 Scrap → +1 Fuel (auto) |
| Adrenal Implants | 8 | 4 | Hand | Hand size +1 |
| Tachyon Lens | 9 | 4 | Wild | One designated crew slot counts as having all 4 icons for pattern matching |
| Sector Engine | 6 | 3 | Special | Sectors 3, 6, 9: +2 Fuel at end of sector |
| Veteran's Insignia | 7 | 3 | Special | Sector 10 only: +3 Fuel at end of sector |

---

## Implementation phases

### Phase 1 — Math foundation

**Goal:** new pattern fuel rewards + gate ramp + scrap accumulation, no joker effects yet. Game is unwinnable but stable.

Files to touch:

- `src/game/types.ts`
  - Add `rank: number` to crew blueprint.
  - Add `'scrap'` to `ResourceKind` union.
  - Add `BoardState.scraps: number`.
- `src/game/blueprints/crewDecks.ts` — add `rank: 1` to all 12 crew.
- `src/game/blueprints/factories.ts` — `createCrewCard` accepts `rank` (default 1).
- `src/game/rules.ts`
  - `getMissionPatternFuel` returns the new rewards (1/2/2/3/4/4/6).
  - Update completion logic to compute fuel from `rank × mult`.
- `src/game/blueprints/sectorGates.ts` — replace ramp with 10/11/12/13/15/17/18/19/22/24.
- `src/game/setup.ts`
  - Initialize `scraps: 0`.
  - Update `STARTING_FUEL_SUPPLY` if needed (still 0).
- `src/board/boardUpdaters.ts`
  - Mission completion: compute Scrap reward based on fuel earned (1-2→1, 3-4→2, 5+→3); add to `scraps`.
  - Gate clear: end-of-sector interest (+1 per 4 scraps held, cap +3).
- Manual + AGENTS.md: update gate ramp + scrap rules.
- `scripts/simulate.mjs` — replace contents with `simulate-tight.mjs` (canonical sim).

**Verify:** `pnpm exec tsc -b`, `pnpm lint`, `pnpm build`. Dev server boots, gates show new costs, missions show pattern fuel + grant scraps.

### Phase 2 — Joker engine

**Goal:** ship-part data model + 25-card catalog + effect engine. Active slots store + apply effects on mission resolution.

Files to touch:

- `src/game/types.ts`
  - Add `ShipPartCategory` discriminated union covering all 10 categories listed above.
  - Add `ShipPartBlueprint` (cost, refund, category, effect-data).
  - Add `BoardState.activeShipParts: ShipPart[]` (max 5).
  - Add `BoardState.shipPartShopPool: ShipPartBlueprint[]` (un-owned).
- `src/game/blueprints/shipParts.ts` — replace contents with the 25-card catalog. Each entry has the data the engine needs (icon for icon-boosters, pattern for pattern-boosters, etc.).
- New: `src/game/shipPartEffects.ts`
  - `applyJokerFuelBonus(missionContext) → number` — sum fuel bonuses from all active jokers.
  - `applyJokerScrapBonus(missionContext) → number` — extra scraps.
  - `applyEndOfSectorEffects(boardState) → { fuel, scraps }` — converters, special-sector bonuses, interest modifiers.
  - `applyJokerHandSize(boardState) → number` — base 5 + Adrenal Implants.
  - `applyJokerWildSlot(boardState, crewCardIds) → string | null` — returns ID of crew counted as wild.
- `src/board/boardUpdaters.ts`
  - Mission completion path: pass mission context (crew used, pattern matched, sector#, action#) through joker engine, add the bonus fuel/scraps to the result.
  - Gate clear path: after interest, run `applyEndOfSectorEffects`.
  - Hand size getter: read from `applyJokerHandSize`.
- `src/game/rules.ts`
  - `canCompleteHandPattern` accepts a wild-slot override (Tachyon Lens).
- `setup.ts` — `activeShipParts: []`, `shipPartShopPool: [...all 25]`.

**Verify:** Add cheat-mode toggle or dev hook to grant a joker; verify mission completion shows altered fuel/scraps. Sim still hits ~5% with `simulate-tight.mjs`.

### Phase 3 — Research dialog + stacking discard

**Goal:** between-sector dialog, no-duplicates shop, skip consolation, stacking-discard refund mechanic.

Files to touch:

- `src/game/types.ts`
  - Add `BoardState.pendingResearchChoice: { offers: ShipPartBlueprint[] } | null`.
- `src/board/boardUpdaters.ts`
  - On gate clear (`applyGatePassed`): draw 2 random ship parts from shop pool, set `pendingResearchChoice`. (If pool empty, skip.)
  - New action: `purchaseShipPart(cardId)` — deducts cost, adds to slots, removes from pool, removes from offers.
  - New action: `closeResearchDialog()` — if no purchase made, +1 Scrap consolation. Clears pending state.
  - Stacking discard: if a stack contains 1 active ship part + crew + a mission, on action complete: refund the part's `floor(cost/2)` Scraps, remove from active slots.
- New component: `src/components/ResearchDialog.tsx`
  - Renders 2 ship-part offers + buy buttons + skip.
  - Shows current scraps balance, current slots filled.
- `src/components/Board.tsx` — render `<ResearchDialog>` when `board.pendingResearchChoice` is set.
- `src/App.tsx` — block other interactions while research dialog is open (similar to existing `pendingShipPartChoice` gating).
- `src/game/logEvents.ts` — `researchOfferedEvent`, `shipPartBoughtEvent`, `researchSkippedEvent`, `shipPartDiscardedEvent`.

**Verify:** Play a full sector, gate clears, dialog opens, can buy / skip / dismiss, scraps deducted, joker added to slots. Stack a joker on a mission, see refund.

### Phase 4 — Polish & docs

- Manual update: full rewrite of mission, gate, ship-parts sections.
- AGENTS.md sim section: new target metrics (4.80% / 0% jokers-off / smooth dropout).
- `scripts/simulate.mjs` ↔ `scripts/simulate-tight.mjs`: pick one canonical, delete the other (or have `simulate.mjs` re-export from `-tight.mjs`).

---

## Open decisions

| # | Question | Default if no override |
|---|---|---|
| A | Apply preemptive Fuel Cell Distillery nerf (cost 8 → 9)? | **Yes** (already in plan) |
| B | Tachyon Lens designated-slot UX — auto-bind to "first crew stacked" or let player click to pick? | **Auto-bind** (simpler) |
| C | Cryo Recycler (older catalog item) — keep, replace, or drop? | **Drop** (already not in 25-card catalog) |
| D | Mission Skipper (older) — keep? | **Drop** (greedy never skips, hard to model) |
| E | What happens if research pool empties (player owns all 25)? | Skip dialog silently with consolation |
| F | Stacking discard: must be on a Mission stack, or also Gate stack? | **Mission only** (gate is fuel-only) |

---

## Verification checklist

After all 4 phases:

- [ ] `pnpm exec tsc -b` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm build` clean
- [ ] `pnpm sim --runs=1000000` shows: S1 100%, win ~5%, smooth dropout
- [ ] Dev server: full run from sector 1 to win
- [ ] Multi-player setup still works (per-player ownership stays intact via `crewOwnerIds`)
- [ ] Restart resets all state (active jokers, scraps, shop pool)
- [ ] Manual matches actual behavior

---

## Notes from sim agent

Concerns to revisit after first playtest:

1. **Fuel Cell Distillery 84% slot occupancy in winners** — already nerfed to 9 in this plan, but if it's still dominant, raise yield threshold to 5 or output to 1.
2. **Sim's greedy buyer underrates steady-bonus jokers** (Salvage Sifter, Compound Interest). Real human play likely values these higher than the sim shows.
3. **Ablative Plating** is structurally dominated by Final Burn — intentional cheap-vs-expensive ladder, but if it never gets bought in playtest, drop it for variety.
4. **Hand-size joker (Adrenal Implants)** modeled as a small effect (~+0.4 fuel/sector). May feel weaker than its 8-Scrap cost suggests; bump to +0.5 fuel/mission flat or reduce cost if so.
