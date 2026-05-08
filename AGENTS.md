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
`scripts/simulate.mjs` is the canonical balance check. It mirrors the live joker economy: 5 starting crew, 7-card cryo, hand size 5 with Balatro-style tired/cryo cycle (no sector-end auto-reset), 3 mission actions per sector, fixed 10-gate ramp 10/11/12/14/18/22/26/30/33/36 (total 212, calibrated for the v2 catalog and tightened scrap tiers). Pattern fuel rewards are tight: Cross-Trained 1, Common Ground 2, Specialist 2, Common Knowledge 3, Department Heads 4, Common Cause 4, Bridge Crew 6. Scrap reward tiers: 1-3 Fuel → 1 Scrap, 4-5 Fuel → 2, 6+ Fuel → 3. After each gate the player is offered 2 random ship parts from the 25-card un-owned research pool, with a paid re-roll option (cost = cheapest current offer's cost) in the live dialog. Scraps come from missions and from joker triggers (Recovery Drone, Cargo Hold) — there is no bank-style interest and no skip consolation.

**Re-run `pnpm sim` whenever you touch:** crew rosters, hand patterns + their fuel rewards, gate costs, starting fuel, sector / action counts, ship part catalog, or scrap economy. The simulator's data constants are mirrored at the top of the file with comments pointing at the source files (`src/game/blueprints/crewDecks.ts`, `src/game/rules.ts`, `src/game/blueprints/sectorGates.ts`, `src/game/economyTuning.ts`, `src/game/setup.ts`, `src/game/shipPartCatalog.ts`); update them in lockstep with the game.

**Target metrics** for greedy max-fuel-pattern play (the strategy a competent player approximates):
- **Sector 1 pass rate = 100%.** Fuel is deterministic at S1 with the tight rewards (gate cost 10 ≤ greedy earnings ~10.96 Fuel/sector before jokers).
- **Overall win rate ≈ 4–5%** with jokers ON. Roughly 1-in-20 runs clears all 10 gates with a greedy joker buyer.
- **Win rate ≈ 0%** with jokers OFF (`NO_JOKERS=1`). The ramp is tuned so a no-joker baseline cannot beat the back-end gates 17/18/19/22/24.

**Target curve shape** (per-sector dropout, jokers ON):
- S1 0% (deterministic pass), S2 ~6%, S3 ~5%, S4 ~5% (gentle warm-up).
- S5 ~9%, S6 ~14%, S7 ~24%, S8 ~17%, S9 ~9% (monotonic rise then taper).
- S10 ~5% (last gate cost 36 — winners arrive with thin buffer).

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
