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
- Game balance simulation: `pnpm sim` runs `scripts/simulate.mjs` (1M runs by default; supports `--runs=N` and `--quiet`). To set the baseline mode, `NO_JOKERS=1 pnpm sim`.
- Refresh checked-in metrics snapshot: `pnpm sim:metrics` runs **both** jokers-on and `NO_JOKERS=1` passes at 1M each and writes `scripts/sim-metrics.md`. Commit the regenerated file alongside any gameplay change so future diffs show the metric impact.
- No test runner, test script, CI workflow, formatter config, or pre-commit hook is currently configured; do not invent `pnpm test` as verification.

## Simulation
`scripts/simulate.mjs` is the canonical balance check. It mirrors the live ship-part + crew-quarters economy: 5 starting crew, 40-card cryo (10 unique blueprints with per-template copy counts tuned for exact icon balance — Juno/Priya ×5, Oren/Malik ×3, the rest ×4), hand size 5 with Balatro-style tired/cryo cycle (no sector-end auto-reset), 3 mission actions per sector, fixed 10-gate ramp 8/9/16/17/20/23/26/30/33/37 (total 219, tuned so Sector 3 is a hard wall for no-joker play). Crew cards carry 1 or 2 specialization icons; single-icon cards cannot satisfy Specialist / Cross-Trained / Department Heads / Bridge Crew (those patterns require length-2 specializations) — they only contribute to shared-icon patterns. The 45-card roster is exactly icon-balanced at 16 each (E=L=N=S=16). Pattern fuel rewards: Cross-Trained 1, Common Ground 2, Specialist 2, Common Knowledge 3, Department Heads 4, Common Cause 4, Bridge Crew 6. Scrap reward tiers: 1-2 Fuel → 1 Scrap, 3-4 Fuel → 2, 5+ Fuel → 3. After each gate the player is offered 2 random ship parts from the 20-card un-owned research pool **plus** 2 random Crew Quarters from the static 7-card catalog (Crew Quarters cost 4-8 Scraps and can be researched multiple times — duplicates stack pattern fuel bonuses, so a winner typically owns 5-8 quarters across their favorite patterns alongside a filled 5-slot Ship Part loadout). A paid re-roll is available in the live dialog. Scraps come from missions and from joker triggers (Recovery Drone, Cargo Hold) — there is no bank-style interest and no skip consolation.

**Re-run `pnpm sim` whenever you touch:** crew rosters, hand patterns + their fuel rewards, gate costs, starting fuel, sector / action counts, ship part catalog, crew quarters catalog, or scrap economy. The simulator's data constants are mirrored at the top of the file with comments pointing at the source files (`src/game/blueprints/crewDecks.ts`, `src/game/rules.ts`, `src/game/blueprints/sectorGates.ts`, `src/game/economyTuning.ts`, `src/game/setup.ts`, `src/game/shipPartCatalog.ts`, `src/game/crewQuartersCatalog.ts`); update them in lockstep with the game.

**Target metrics** for greedy max-fuel-pattern play (the strategy a competent player approximates):
- **Sector 1 pass rate = 100%.** Starter doubles (Mara EE, Sana LL) plus Lei/Ada/Nia comfortably clear gate cost 8.
- **Sector 3 wall.** Without ship parts AND crew quarters, ~0% of runs reach Sector 4 (S3 cost 16 vs greedy ~9 fuel/sector). The game design requires the player to start buying ship parts AND/OR researching crew quarters to keep up.
- **Overall win rate ≈ 1.5–2.5%** with jokers ON. Roughly 1-in-50 greedy runs clears all 10 gates — strategic spend split between **5 Ship Parts** (Compounding Drive early, Crew Synergy mid, Veteran's Insignia / Adrenal Implants late) and **5-8 Crew Quarters** (invest deeply in the cheap common patterns greedy plays most often — Common Ground, Cross-Trained, Common Knowledge) lifts this for skilled players.
- **Win rate = 0%** with jokers OFF (`NO_JOKERS=1`). The ramp is tuned so a no-joker, no-quarters baseline cannot beat any gate from S3 onward.

**Target curve shape** (per-sector dropout, jokers ON):
- S1 0% (deterministic pass), S2 ~6%, S3 ~62% (the wall — most runs die here without scaling parts/quarters).
- S4 ~12%, S5 ~5%, S6 ~3%, S7 ~3% (steady decline as the back-end costs ramp).
- S8 ~3%, S9 ~2%, S10 ~1% (taper — only well-built joker + quarters stacks survive the late gates).

**Target loadout (winning runs):**
- 5 Ship Parts filling the slot cap (typical: Compounding Drive, Crew Synergy, Adrenal Implants, Fuel Cell Distillery, Veteran's Insignia).
- ~5-8 Crew Quarters researched. Distribution skews toward the cheap (4-5 Scrap) common-pattern quarters: Common Ground avg 2/win, Cross-Training 1.2/win, Common Knowledge / Specialist ~0.7/win, Department Heads / Common Cause ~0.3/win, Bridge Crew ~0.06/win (expensive at 8 Scrap and rarely played).

**How to verify a design change:**
1. Update the source-of-truth file (e.g., `sectorGates.ts`, `shipPartCatalog.ts`, `crewQuartersCatalog.ts`).
2. Mirror the change in `scripts/simulate.mjs` (JOKERS, CREW_QUARTERS, GATE_COSTS).
3. Iterate quickly with `pnpm sim --runs=200000` while tuning.
4. Once happy, run `pnpm sim:metrics` (~60s — covers both jokers-on and `NO_JOKERS=1` baseline at 1M each) and confirm S1 = 100%, Win ≈ 1.5–2.5% jokers ON, Win = 0% jokers OFF with < 1% reaching S4 in the baseline. The command overwrites `scripts/sim-metrics.md`.
5. **Commit `scripts/sim-metrics.md` together with the gameplay change.** The file is the canonical, diff-able snapshot of balance; reviewers (and future agents) should be able to scan it to see the impact of every tuning iteration. Do not leave it stale.

Previous balance-tuning iterations (gate ramp, pattern rewards, joker catalog) and dominance flags (Fuel Cell Distillery, replacement heuristic) are documented in the TUNING NOTES at the bottom of `scripts/simulate.mjs`. The current checked-in metric snapshot lives at `scripts/sim-metrics.md`.

## Toolchain Quirks
- TypeScript uses project references from root `tsconfig.json`; app code is included only from `src`, and `vite.config.ts` is covered by `tsconfig.node.json`.
- `tsconfig.app.json` and `tsconfig.node.json` enable `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`; avoid unused symbols and TypeScript constructs that require runtime emit such as enums or parameter properties.
- ESLint ignores only `dist` and applies JS recommended, TypeScript recommended, React Hooks, and React Refresh Vite rules to `**/*.{ts,tsx}`.
- CSS in `src/App.css` uses native nesting and `color-mix()`; preserve the nested style unless there is a specific reason to flatten it.
