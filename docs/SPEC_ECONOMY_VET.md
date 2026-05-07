# Spec — Fuel Economy Vet

## Goal

Test Fuel pressure with a minimal, reversible change before committing to a full economy rework:

1. **Fuel pressure as the primary economic axis.** If Fuel is scarce *and* every Gate consumes it, the run becomes a sustained Fuel-management puzzle rather than a crew-icon-matching puzzle.

If this feels right after 3–4 playtests, we expand to crew-as-Fuel-engines, scaling Gate costs, and unique-per-Gate Fuel twists. If it doesn't, we revert and try alternatives.

## TL;DR — Two Knobs

| # | Change | Tuning value |
|---|---|---|
| 1 | Every Gate requires Fuel to pass | 2 Fuel per Gate (flat) |
| 2 | Starting Fuel Supply reduced | 1 Fuel Cell face-up (was 2) |

Plus targeted economy adjustments to `horizonDeck.ts` rewards/costs (see §3).

## 1. Gate Fuel Cost

### Mechanic

Every Gate has a Fuel cost. To pass a Gate, the Mission Lead must spend that many Fuel Cells from the Fuel Supply *in addition to* satisfying crew slots and icons. Fuel is paid as part of the Pass Gate stack action; the existing button only enables when crew slots, icons, *and* Fuel are satisfiable.

If the player cannot pay the Gate Fuel cost (and cannot generate it via Scientist + Mechanic Fuel pairs from Ready crew on the stack), the Gate cannot be passed and the run loses (`game-loss-reason: gate-failed`).

Gate Fuel cost stacks with effect-driven Fuel costs (e.g., Old Pass adds +1 Fuel per Engine crew on top of the base Fuel cost) and Damage cards (Long Reach already adds +1 to Mission Fuel; that does not change here).

### Tuning

Flat **2 Fuel per Gate** for all 14 Gates in the deck. Total Gate Fuel demand over a 10-Gate run = 20.

Rationale for flat (vs. per-Gate variation): the Gate deck is shuffled, so per-Gate variation would create order-dependent runs. Variation can be added in iteration 2 if the axis works.

### Code touch points

- `src/game/types.ts` — extend `GateDetails.need` with `fuel: number`. Keep this in `need` (alongside `crew` and `icons`) so callers that reason about Gate requirements all hit one spot.
- `src/game/blueprints/factories.ts` — update `createGateCard` factory signature to accept and store `fuel`.
- `src/game/blueprints/sectorGates.ts` — add `2` Fuel cost to all 14 entries.
- `src/game/rules.ts` — Pass Gate legality check must require Fuel availability (Fuel Supply count + Scientist + Mechanic Fuel pairs from Ready crew already on the Gate stack).
- `src/game/state.ts` / Pass Gate reducer — on success, decrement Fuel Supply by `gate.need.fuel`.
- Loss-condition computation (currently surfaces `'gate-failed'`) — factor Fuel availability into the check.

### Display

- Gate card UI: render Fuel cost prominently next to the existing slot/icon row (a Fuel Cell glyph × N).
- Tooltip / hover copy: "Cost: N Fuel. Spent from Fuel Supply when the Gate is passed."

## 2. Starting Fuel Reduction & Reshuffle

### Mechanic

Setup deals **1 Fuel Cell** to the Fuel Supply (was 2). The Fuel Deck stays at 10 cards. Total Fuel Cells in the game stay at 12.

Because run-level demand can exceed 12 Fuel (Gates 20 + Cryo missions ~5 = ~25), spent Fuel Cells must be recoverable. Add a Fuel Discard pile: when Fuel is spent (on Gate, mission, MOTHER+1 from Comm Failure, etc.), the Cell goes to the Fuel Discard, not out of the game. When the Fuel Deck would draw and is empty, shuffle the Fuel Discard back into the Fuel Deck.

If the Fuel Supply, Fuel Deck, and Fuel Discard are all empty and the Map has no fuel-positive missions reachable with available Ready crew, the run loses as Stranded (`game-loss-reason: sector-stranded`).

### Tuning

- `STARTING_FUEL_SUPPLY = 1`
- Fuel Deck: 10 (unchanged)
- Reshuffle on empty: **yes**

If 1 starting Fuel feels too punitive, dial up to 2. If 1 still feels comfortable, dial down to 0 — the Mission Lead must earn Fuel before doing anything.

### Code touch points

- `src/game/setup.ts` — change starting Fuel Supply from 2 to 1.
- Fuel-spend path (wherever Fuel Cells leave the Supply today) — route them to a new Fuel Discard pile rather than removing them from the game.
- Fuel Deck draw logic — on empty, reshuffle Fuel Discard into the Fuel Deck. Emit a playtest log event.
- `Stranded` loss check in `src/game/state.ts` — include "no Fuel anywhere reachable" in the no-progress detection.

## 3. Mission Economy Rebalance

### Why missions need rebalancing

With Gates demanding 20 Fuel, the existing mission economy is too Fuel-negative. Currently only Red Salvage produces Fuel, at +1 Fuel per attempt — far too little to cover a run.

Goal: missions should produce ~20 Fuel net across a run (assuming 2–3 missions per sector × 10 sectors = 20–30 mission attempts), with 3 of the 9 mission designs being clearly Fuel-positive.

### Proposed changes (`src/game/blueprints/horizonDeck.ts`)

Five missions stay unchanged. Four are adjusted:

| Destination | Current cost / reward | Proposed cost / reward | Rationale |
|---|---|---|---|
| Red Salvage | Fuel 1, Engine, Signal → +1 Fuel | **Fuel 0, Engine, Signal → +3 Fuel** | Becomes the premier resupply mission. Cheap, generous. |
| Iron Wake | Fuel 1, Engine, Engine → Service Drone Bay | **Fuel 0, Engine, Engine → Service Drone Bay + 1 Fuel** | Engineer-heavy mission gives both a part and Fuel. Engineers become more valuable. |
| Cryo Choir | Fuel 2, Life, Signal → Wake 1 | **Fuel 1, Life, Signal → Wake 1** | The 2-Fuel cost was prohibitive under the tighter Fuel economy. |
| Sleeper Arklet | Fuel 2, Life, Life, Star → Wake 1 | **Fuel 1, Life, Life, Star → Wake 1** | Same rationale as Cryo Choir. |
| Gravity Sling | Fuel 2, Star, Engine → Next Mission −1 Fuel | **Fuel 1, Star, Engine → Next Gate −1 Fuel** | Discount now applies to Gates (the new Fuel sink), not just Missions. Reduced cost since Missions are also more expensive. |
| Dust Garden | Life, Star → Medbay Rehydrator | (unchanged) | Already free; the Rehydrator is valuable under heavier crew fatigue. |
| Life Orchard | Fuel 1, Life, Engine → Ready 1 crew | (unchanged) | Already viable. |
| Broken Atlas | Signal, Signal → Peek 2 keep 1 | (unchanged) | Free utility. |
| Quiet Relay | Fuel 1, Signal, Star → Adaptive Control Console | (unchanged) | Already viable. |

### Reward-kind work

- Add `next_gate_fuel_discount` to `DiscoveryEffectKind` and the horizon reward union, or repurpose `next_mission_fuel_discount` to cover Gates as well (engineer's call; new kind is cleaner because the pending-effect lifecycle differs). The discount should expire at sector transition if unused.
- Update `Iron Wake` reward array to include both `shipPartFind('Service Drone Bay', 'service-drone-bay')` and `{ kind: 'resource', resource: 'fuel', count: 1 }` (need to allow shipPartFind to compose with a fuel reward, or split into two horizon rewards on the same horizon).

### Run-level economy check (rough)

Spend:
- Gate Fuel: 20 (10 × 2)
- Optional Cryo missions (~5 across run for ~5 wakes): 5
- Discretionary (Life Orchard / Quiet Relay etc.): ~3
- **Total spend: ~28 Fuel**

Earnings:
- Starting Fuel: 1
- Red Salvage ~3 hits × 3 Fuel = 9
- Iron Wake ~3 hits × 1 Fuel = 3
- Ration Pack discoveries × ~6 = 6
- **Total earnings without crew-made Fuel: ~19 Fuel**

Deficit: ~9 Fuel, expected to be covered by Scientist + Mechanic Fuel pairs (~9 pair activations across the run = 18 crew → Tired). This is **intentionally tight** — we want the player to feel the pressure. If RNG is unkind (Red Salvage shows up only twice), the run is winnable only with aggressive crew-made Fuel and Ration Pack draws. If unwinnable runs are too common in playtest, buff Red Salvage to 4 Fuel or reduce Gate cost on the first sector.

## 4. UI / UX Requirements

### Gate card display

- Fuel cost rendered alongside crew slots and required icons. Suggested glyph cluster: `[ slots ] [ icons ] [ ⛽×2 ]`.
- Pass Gate stack-action button only enables when crew slots, icons, *and* Fuel are all satisfiable.

### Fuel Supply visibility

- Make the Fuel Supply count obvious. Suggested: a numeric pip near the Fuel Supply (e.g. `Fuel: 3`) plus the existing card stack visual.
- Toast / log event when the Fuel Deck reshuffles ("Fuel Deck reshuffled.").

### How To Play (in-game)

Update the in-game How To Play screen so playtesters see the new rules immediately:
- "Each Gate costs 2 Fuel to pass."

### `PROTOTYPE_USER_MANUAL.md`

Per `AGENTS.md`, the manual must stay aligned with shipped behavior. Update it as part of the implementation PR:
- Setup table (starting Fuel Supply: 1).
- Gate Cards section (add Fuel column to the gate table).
- Win And Loss Summary (add Fuel exhaustion as a Stranded sub-cause).
- Player Aid (mention the Fuel rules).
- Discovery / mission tables to reflect rebalanced costs/rewards.

## 5. Out Of Scope (do NOT change in this PR)

To keep the vet a clean signal, do not touch these in the same change:

- Crew rosters, icon assignments, or roles.
- Discovery deck composition or effects (Ration Pack still gives +1 Fuel; that's enough).
- Drift deck composition or effects (Burn already discards Fuel and that interaction stays; we'll observe whether it bites harder under the new economy).
- Damage deck composition or effects.
- Gate icon requirements, slot counts, effects, or clear conditions.
- MOTHER deck or Stress mechanics.
- Number of sectors (10), Gates drawn (10 of 14), or missions per sector (9, reshuffled per sector).
- Scientist + Mechanic Fuel-pair rate (1 Fuel from 2 crew, both → Tired).

If during implementation any of these *seem* to need a change, flag it for discussion rather than bundling.

## 6. Tunable Constants

Implement these as named constants (one module, e.g., `src/game/economyTuning.ts`) so playtest tuning doesn't require structural edits:

```ts
export const GATE_FUEL_COST = 2
export const STARTING_FUEL_SUPPLY = 1
export const RED_SALVAGE_FUEL_REWARD = 3
export const IRON_WAKE_FUEL_REWARD = 1
export const CRYO_MISSION_FUEL_COST = 1
export const GRAVITY_SLING_FUEL_COST = 1
```

Have the blueprints and reducers read from these constants rather than literals so a single-file edit retunes the whole economy.

## 7. Playtest Signals

After 3–4 full runs, gather observations on:

### Fuel pressure
- Did Fuel ever feel scarce?
- Did mission choice ever come down to "I need Fuel" vs. "I want a part / crew benefit"?
- Did Scientist + Mechanic Fuel pairs become a real lever (used at least once per run)?
- Did any run fail purely from Fuel exhaustion?

### Combined
- Did the run feel meaningfully tighter than current?
- Was there a sector that felt like a turning point ("if I don't earn Fuel here, I lose")?
- Did the run end in a *satisfying* loss (close to winning, ran out of resources) or an *unsatisfying* loss (no agency, bad RNG)?

### Failure cases (revert or retune)
- If Fuel is never scarce → reduce starting Fuel to 0, or raise Gate cost to 3.
- If runs are unwinnable → buff Red Salvage to 4 Fuel, or set the first sector's Gate cost to 1 (`gate.need.fuel = 1` for sector index 0).

## 8. Open Questions

If anything below is unclear, ask before implementing:

1. **Gate Fuel field placement.** `GateDetails.need.fuel: number` (alongside `crew` and `icons`) vs. a separate `gate.fuelCost` field. Recommendation: keep in `need` so all requirement-reasoning code looks in one place. Affects how Old Pass's per-Engine Fuel cost stacks (it should be additional cost, summed at resolve time).
2. **"Next Gate −1 Fuel" expiry.** Should it carry across sector transitions if unused? Recommendation: it expires at sector end, mirroring the current "Next Mission −1 Fuel" behavior.
3. **Iron Wake reward composition.** Existing `shipPartFind` and `visitRewardFind` are separate factories; Iron Wake now needs both. Recommendation: extend `createHorizonCard` to accept an array of reward operations, or compose at the blueprint level.

## 9. Rollback Plan

If the vet fails:
- Revert all card cost/reward changes in `horizonDeck.ts`.
- Set `GATE_FUEL_COST = 0` (or remove the field from `GateDetails.need`).
- Restore `STARTING_FUEL_SUPPLY = 2`.

All changes are localized; no cross-cutting refactor required.

## Appendix — Why these specific knobs

- **Fuel as primary axis** matches the game's theme (leaving Earth, journeying across sectors); offers a single-counter readability like Balatro chips; underused in the current design.
- **Flat 2-Fuel Gate cost (not scaling)** tests the *axis*, not a tuning curve. If the axis works, scaling is iteration 2.
- **Targeted mission rebalance (4 of 9)** keeps the unchanged 5 as a control group so we can see how they perform in the new economy and decide whether broader changes are needed.

## Iteration 2 (post-vet, do not implement now)

If the vet succeeds, the natural follow-ups — listed here so they aren't smuggled into this PR:

- **Per-Gate Fuel-economy twists** that warp the basic 2-Fuel cost (e.g., Echo Vault: cannot use stored Fuel — must be generated this sector via Fuel pairs; Old Pass: existing +1/Engine stays; The Reach: pay double Fuel if any icon is doubled).
- **Crew-as-Fuel-engines** to replace icon-key feel with Balatro-joker feel (e.g., Mechanic crew: +1 Fuel per Mechanic-led Fuel pair; Scientist crew: convert 1 Stress to 1 Fuel once per sector; Recon: peek + free scout reduces Fuel-mission RNG dependence).
- **Reduced crew count (~6–8 unique designs)** with named active abilities instead of icon-pair generic crew, to lower the "too many specialties to track" cognitive load.
- **Difficulty curve revisit** — if Fuel pressure is still too flat, scale per-Gate `need.fuel` and `need.crew` by deck-position rather than reorder.
