# Agent Notes

## Project Shape
- Single-package Vite React app; use `pnpm` because `pnpm-lock.yaml` is the committed lockfile.
- App entry chain is `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- `src/App.tsx` owns board orchestration, drag/drop, keyboard handlers, reducer dispatch, and playtest-log console output; keep leaf components in `src/components/` mostly presentational.
- `src/game/` is the domain layer: `types.ts` defines state shape, `setup.ts` creates/shuffles decks and initial board state, `rules.ts` decides stacking/completion legality, `effects.ts` handles pending rewards, and `state.ts` wires reducer updates to playtest log events.
- Gameplay mutations should flow through `BoardUpdater`/`gameReducer` in `src/game/state.ts`; use `withPlaytestEvents` plus event builders in `src/game/logEvents.ts` when an action should appear in the playtest log.
- Initial setup shuffles with `Math.random()` in `src/game/setup.ts`; do not assume deterministic card/deck order in checks.
- Keep `PROTOTYPE_USER_MANUAL.md` and any simulation scripts updated when gameplay design changes, including setup counts, card rules, rewards, game loop, controls, and win/loss conditions.

## Commands
- Install dependencies: `pnpm install`.
- Start dev server: `pnpm dev`.
- Production verification: `pnpm build` runs `tsc -b && vite build`.
- Focused typecheck: `pnpm exec tsc -b`.
- Lint all files: `pnpm lint`; focused lint: `pnpm exec eslint src/path/file.tsx`.
- Preview a successful build: `pnpm preview`.
- Game balance simulation: `pnpm sim` runs `scripts/simulate.mjs` (1M runs by default; supports `--runs=N` and `--strategy=greedy|cautious`).
- No test runner, test script, CI workflow, formatter config, or pre-commit hook is currently configured; do not invent `pnpm test` as verification.

## Simulation
`scripts/simulate.mjs` is the canonical balance check. It mirrors the live joker economy: 5 starting crew, 40-card cryo (10 unique blueprints with per-template copy counts tuned for exact icon balance — Juno/Priya ×5, Oren/Malik ×3, the rest ×4), hand size 5 with Balatro-style tired/cryo cycle (no sector-end auto-reset), 3 mission actions per sector, fixed 10-gate ramp 8/8/9/10/12/17/21/25/29/32 (total 171, recalibrated for the quadrupled cryo). Crew cards carry 1 or 2 specialization icons; single-icon cards cannot satisfy Specialist / Cross-Trained / Department Heads / Bridge Crew (those patterns require length-2 specializations) — they only contribute to shared-icon patterns. The 45-card roster is exactly icon-balanced at 16 each (E=L=N=S=16). Pattern fuel rewards are tight: Cross-Trained 1, Common Ground 2, Specialist 2, Common Knowledge 3, Department Heads 4, Common Cause 4, Bridge Crew 6. Scrap reward tiers: 1-3 Fuel → 1 Scrap, 4-5 Fuel → 2, 6+ Fuel → 3. After each gate the player is offered 2 random ship parts from the 25-card un-owned research pool, with a paid re-roll option (cost = cheapest current offer's cost) in the live dialog. Scraps come from missions and from joker triggers (Recovery Drone, Cargo Hold) — there is no bank-style interest and no skip consolation.

**Re-run `pnpm sim` whenever you touch:** crew rosters, hand patterns + their fuel rewards, gate costs, starting fuel, sector / action counts, ship part catalog, or scrap economy. The simulator's data constants are mirrored at the top of the file with comments pointing at the source files (`src/game/blueprints/crewDecks.ts`, `src/game/rules.ts`, `src/game/blueprints/sectorGates.ts`, `src/game/economyTuning.ts`, `src/game/setup.ts`, `src/game/shipPartCatalog.ts`); update them in lockstep with the game.

**Target metrics** for greedy max-fuel-pattern play (the strategy a competent player approximates):
- **Sector 1 pass rate = 100%.** Greedy earnings comfortably clear gate cost 8 with the starter doubles still in hand.
- **Overall win rate ≈ 4–5%** with jokers ON. Roughly 1-in-20 runs clears all 10 gates with a greedy joker buyer.
- **Win rate ≈ 0%** with jokers OFF (`NO_JOKERS=1`). The ramp is tuned so a no-joker baseline cannot beat the back-end gates 21/25/29/32.

**Target curve shape** (per-sector dropout, jokers ON, current 45-card icon-balanced roster):
- S1 0% (deterministic pass), S2 ~2%, S3 ~7%, S4 ~8%, S5 ~10% (gentle warm-up).
- S6 ~18%, S7 ~17%, S8 ~17% (steep plateau mid-run).
- S9 ~11%, S10 ~5% (taper — winners arrive with thin buffer).

**How to verify a design change:**
1. Update the source-of-truth file (e.g., `sectorGates.ts`, `shipPartCatalog.ts`).
2. Mirror the change in `scripts/simulate.mjs`.
3. Run `pnpm sim --runs=1000000` (~15s).
4. Confirm S1 = 100%, Win ≈ 4–5% jokers ON, Win ≈ 0% jokers OFF, and inspect the per-sector dropout curve.
5. If the metrics drift, iterate on costs/rewards/catalog until back in range.

Previous balance-tuning iterations (gate ramp, pattern rewards, joker catalog) and dominance flags (Fuel Cell Distillery, replacement heuristic) are documented in the TUNING NOTES at the bottom of `scripts/simulate.mjs`.

## Toolchain Quirks
- TypeScript uses project references from root `tsconfig.json`; app code is included only from `src`, and `vite.config.ts` is covered by `tsconfig.node.json`.
- `tsconfig.app.json` and `tsconfig.node.json` enable `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`; avoid unused symbols and TypeScript constructs that require runtime emit such as enums or parameter properties.
- ESLint ignores only `dist` and applies JS recommended, TypeScript recommended, React Hooks, and React Refresh Vite rules to `**/*.{ts,tsx}`.
- CSS in `src/App.css` uses native nesting and `color-mix()`; preserve the nested style unless there is a specific reason to flatten it.
