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
`scripts/simulate.mjs` is the canonical balance check. It mirrors the live open-mission stacking economy: 5 starting crew, 7-card cryo (1 drawn per action), tired resets at sector start, 3 mission actions per sector, fixed 10-gate ramp sorted ascending, dynamic per-action pattern matching against the highest-fuel hand the stacked crew satisfies.

**Re-run `pnpm sim` whenever you touch:** crew rosters, hand patterns + their fuel rewards, gate costs, starting fuel, sector / action counts, or the cryo-draw cadence. The simulator's data constants are mirrored at the top of the file with comments pointing at the source files (`src/game/blueprints/crewDecks.ts`, `src/game/rules.ts`, `src/game/blueprints/sectorGates.ts`, `src/game/economyTuning.ts`, `src/game/setup.ts`); update them in lockstep with the game.

**Target metrics** for greedy max-fuel-pattern play (the strategy a competent player approximates):
- **Sector 1 pass rate ≈ 94–95%.** A small bite at the start so the first gate isn't a free pass, but most runs continue.
- **Overall win rate ≈ 4–5%.** Roughly 1-in-20 runs should clear all 10 gates. Lower means players bounce off; higher means there's no resource pressure.

**Target curve shape** (cumulative reach %, sector-by-sector):
- Sector 1 ≈ 100% (everyone starts), drops to ~95% after gate 1.
- Mid-sectors (2–8) should drop gradually — ideally 3–10 percentage points per sector — so failures spread across the run instead of bunching at the end.
- Late-sector (9, 10) drops can be sharper as the Hazard-tier costs eat accumulated buffer.
- The current fixed-ramp design intentionally clusters most failures at sector 10 against a perfectly greedy strategy because greedy earnings are very consistent (~27 Fuel/sector once cryo fills). Human play with sub-optimal stacking spreads the dropouts naturally. If you want stronger mid-sector pressure even under greedy play, raise sectors 5–8 by ~3–4 Fuel each and re-run the sim.

**How to verify a design change:**
1. Update the source-of-truth file (e.g., `sectorGates.ts`).
2. Mirror the change in `scripts/simulate.mjs`.
3. Run `pnpm sim --runs=1000000` (~15s).
4. Confirm S1 reach (≈95%), Win (≈4%), and inspect the per-sector dropout curve.
5. If the metrics drift, iterate on costs/rewards/starting values until back in range.

The previous balance-tuning iterations (gate-tier scaling, starting fuel, hand-pattern fuel rewards) are documented in the playtest-log session messages and the comments inside `sectorGates.ts` / `economyTuning.ts`.

## Toolchain Quirks
- TypeScript uses project references from root `tsconfig.json`; app code is included only from `src`, and `vite.config.ts` is covered by `tsconfig.node.json`.
- `tsconfig.app.json` and `tsconfig.node.json` enable `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`; avoid unused symbols and TypeScript constructs that require runtime emit such as enums or parameter properties.
- ESLint ignores only `dist` and applies JS recommended, TypeScript recommended, React Hooks, and React Refresh Vite rules to `**/*.{ts,tsx}`.
- CSS in `src/App.css` uses native nesting and `color-mix()`; preserve the nested style unless there is a specific reason to flatten it.
