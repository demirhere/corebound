# Simulation Metrics

Latest snapshot of `scripts/simulate.mjs`. Re-generate with `pnpm sim:metrics` after touching any source-of-truth file (gate ramp, ship part catalog, crew quarters catalog, scrap economy, crew rosters). Commit the updated file alongside the gameplay change so the snapshot stays in sync.

- Generated: 2026-05-12
- Gate ramp: `[8, 9, 16, 17, 20, 23, 26, 30, 33, 37]` (total 219)
- Ship parts catalog: 20 unique
- Crew quarters catalog: 7 unique (costs 4, 4, 5, 5, 6, 6, 8)

## Target metrics (do not regress)

| Metric | Target |
|--------|--------|
| Win rate, jokers ON | 1.5 – 2.5% |
| Win rate, jokers OFF (`NO_JOKERS=1`) | 0% |
| S1 pass rate (deterministic) | 100% |
| S4 reach, jokers OFF (S3 wall) | < 1% |
| Avg crew quarters researched per winning run | 5 – 8 |
| Avg ship parts bought per winning run | ≈ 10 (5 in slot after replacement) |

## Jokers ON

- Runs: 1,000,000 (38.78s)
- **Win rate: 2.19%** (21,861 wins)

### Sector reach (cumulative)

| Sector | Reached | Pct |
|--------|---------|-----|
| S1 | 1,000,000 | 100.00% |
| S2 | 1,000,000 | 100.00% |
| S3 | 937,501 | 93.75% |
| S4 | 314,607 | 31.46% |
| S5 | 196,894 | 19.69% |
| S6 | 144,397 | 14.44% |
| S7 | 110,708 | 11.07% |
| S8 | 77,702 | 7.77% |
| S9 | 50,425 | 5.04% |
| S10 | 33,905 | 3.39% |
| WIN | 21,861 | 2.19% |

### Per-sector dropout

| Sector | Failed | Pct |
|--------|--------|-----|
| S1 | 0 | 0.00% |
| S2 | 62,499 | 6.25% |
| S3 | 622,894 | 62.29% |
| S4 | 117,713 | 11.77% |
| S5 | 52,497 | 5.25% |
| S6 | 33,689 | 3.37% |
| S7 | 33,006 | 3.30% |
| S8 | 27,277 | 2.73% |
| S9 | 16,520 | 1.65% |
| S10 | 12,044 | 1.20% |

### Economy

- Avg scraps earned/run: 25.39
- Avg ship parts bought/run: 2.971
- Avg crew quarters researched/run: 0.754
- Avg scraps earned/win: 86.21
- Avg ship parts bought/win: 10.215
- Avg crew quarters researched/win: 5.464
- Winners' final-fuel range: 0 – 97 (avg 13.42)

### Crew Quarters researched by winners

| Quarters | Total stacks | Per win |
|----------|--------------|---------|
| common-ground-quarters | 45,434 | 2.078 |
| cross-training-quarters | 26,449 | 1.210 |
| common-knowledge-quarters | 17,263 | 0.790 |
| specialist-quarters | 15,211 | 0.696 |
| common-cause-quarters | 6,915 | 0.316 |
| department-heads-quarters | 6,903 | 0.316 |
| bridge-crew-quarters | 1,283 | 0.059 |

### Top ship parts held by winners

| Ship Part | Wins held | Pct of wins |
|-----------|-----------|-------------|
| compounding-drive | 19,943 | 91.23% |
| veterans-insignia | 12,401 | 56.73% |
| crew-synergy | 11,952 | 54.67% |
| adrenal-implants | 11,518 | 52.69% |
| fuel-cell-distillery | 11,036 | 50.48% |
| reserve-capacitor | 9,186 | 42.02% |
| tachyon-lens | 9,037 | 41.34% |
| final-burn | 7,935 | 36.30% |
| scrap-forge | 7,601 | 34.77% |
| sector-engine | 6,901 | 31.57% |
| emergency-reserves | 485 | 2.22% |
| lean-manifest | 428 | 1.96% |
| preflight-tune-up | 405 | 1.85% |
| recovery-drone | 247 | 1.13% |
| cargo-hold | 224 | 1.02% |
| mission-streak | 4 | 0.02% |
| reinforced-manifold | 1 | 0.00% |
| stellar-cartographer | 1 | 0.00% |

## Jokers OFF (`NO_JOKERS=1`)

- Runs: 1,000,000 (19.16s)
- **Win rate: 0.00%** (0 wins)

### Sector reach (cumulative)

| Sector | Reached | Pct |
|--------|---------|-----|
| S1 | 1,000,000 | 100.00% |
| S2 | 1,000,000 | 100.00% |
| S3 | 855,340 | 85.53% |
| S4 | 1,133 | 0.11% |
| S5 | 0 | 0.00% |
| S6 | 0 | 0.00% |
| S7 | 0 | 0.00% |
| S8 | 0 | 0.00% |
| S9 | 0 | 0.00% |
| S10 | 0 | 0.00% |
| WIN | 0 | 0.00% |

### Per-sector dropout

| Sector | Failed | Pct |
|--------|--------|-----|
| S1 | 0 | 0.00% |
| S2 | 144,660 | 14.47% |
| S3 | 854,207 | 85.42% |
| S4 | 1,133 | 0.11% |
| S5 | 0 | 0.00% |
| S6 | 0 | 0.00% |
| S7 | 0 | 0.00% |
| S8 | 0 | 0.00% |
| S9 | 0 | 0.00% |
| S10 | 0 | 0.00% |

### Economy

- Avg scraps earned/run: 14.35
- Avg ship parts bought/run: 0.000
- Avg crew quarters researched/run: 0.000
