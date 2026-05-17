# Simulation Metrics

Latest snapshot of `scripts/simulate.mjs`. Re-generate with `pnpm sim:metrics` after touching any source-of-truth file (gate ramp, ship part catalog, crew quarter upgrade catalog, scrap economy, crew rosters). Commit the updated file alongside the gameplay change so the snapshot stays in sync.

- Generated: 2026-05-17
- Gate ramp: `[8, 9, 16, 17, 21, 24, 27, 31, 34, 38]` (total 225)
- Ship parts catalog: 20 unique
- Crew quarters upgrade: 1 generic card, 4 Scraps, +1 Fuel/play (any pattern)

## Target metrics (do not regress)

| Metric | Target |
|--------|--------|
| Win rate, jokers ON | 1.5 – 2.5% |
| Win rate, jokers OFF (`NO_JOKERS=1`) | 0% |
| S1 pass rate (random 5-of-45 opener) | ~70% |
| S4 reach, jokers OFF (S3 wall) | < 1% |
| Avg crew quarter upgrades researched per winning run | 10 – 16 |
| Avg ship parts bought per winning run | ≈ 10 (5 in slot after replacement) |

## Jokers ON

- Runs: 1,000,000 (67.11s)
- **Win rate: 0.55%** (5,532 wins)

### Sector reach (cumulative)

| Sector | Reached | Pct |
|--------|---------|-----|
| S1 | 1,000,000 | 100.00% |
| S2 | 721,139 | 72.11% |
| S3 | 603,989 | 60.40% |
| S4 | 169,083 | 16.91% |
| S5 | 92,993 | 9.30% |
| S6 | 54,105 | 5.41% |
| S7 | 36,763 | 3.68% |
| S8 | 26,882 | 2.69% |
| S9 | 18,399 | 1.84% |
| S10 | 11,716 | 1.17% |
| WIN | 5,532 | 0.55% |

### Per-sector dropout

| Sector | Failed | Pct |
|--------|--------|-----|
| S1 | 278,861 | 27.89% |
| S2 | 117,150 | 11.71% |
| S3 | 434,906 | 43.49% |
| S4 | 76,090 | 7.61% |
| S5 | 38,888 | 3.89% |
| S6 | 17,342 | 1.73% |
| S7 | 9,881 | 0.99% |
| S8 | 8,483 | 0.85% |
| S9 | 6,683 | 0.67% |
| S10 | 6,184 | 0.62% |

### Economy

- Avg scraps earned/run: 16.43
- Avg ship parts bought/run: 1.367
- Avg crew quarter upgrades researched/run: 1.461
- Avg scraps earned/win: 86.61
- Avg ship parts bought/win: 7.790
- Avg crew quarter upgrades researched/win: 11.618
- Winners' final-fuel range: 0 – 54 (avg 9.25)

### Crew Quarter Upgrades researched by winners

| Upgrade | Total stacks | Per win |
|----------|--------------|---------|
| common-ground | 16,591 | 2.999 |
| cross-trained | 16,584 | 2.998 |
| specialist | 16,554 | 2.992 |
| common-knowledge | 12,101 | 2.187 |
| department-heads | 1,938 | 0.350 |
| common-cause | 504 | 0.091 |

### Top ship parts held by winners

| Ship Part | Wins held | Pct of wins |
|-----------|-----------|-------------|
| lean-manifest | 3,406 | 61.57% |
| reserve-capacitor | 3,372 | 60.95% |
| preflight-tune-up | 2,409 | 43.55% |
| final-burn | 2,236 | 40.42% |
| scrap-forge | 2,160 | 39.05% |
| emergency-reserves | 2,009 | 36.32% |
| recovery-drone | 1,862 | 33.66% |
| cargo-hold | 1,788 | 32.32% |
| sector-engine | 1,677 | 30.31% |
| compounding-drive | 1,471 | 26.59% |
| veterans-insignia | 1,258 | 22.74% |
| adrenal-implants | 715 | 12.92% |
| fuel-cell-distillery | 487 | 8.80% |
| mission-streak | 462 | 8.35% |
| reinforced-manifold | 429 | 7.75% |
| tachyon-lens | 423 | 7.65% |
| lab-centrifuge | 419 | 7.57% |
| stellar-cartographer | 403 | 7.28% |
| hydroponics-bay | 379 | 6.85% |
| crew-synergy | 289 | 5.22% |

## Jokers OFF (`NO_JOKERS=1`)

- Runs: 1,000,000 (24.77s)
- **Win rate: 0.00%** (0 wins)

### Sector reach (cumulative)

| Sector | Reached | Pct |
|--------|---------|-----|
| S1 | 1,000,000 | 100.00% |
| S2 | 720,428 | 72.04% |
| S3 | 521,688 | 52.17% |
| S4 | 1,631 | 0.16% |
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
| S1 | 279,572 | 27.96% |
| S2 | 198,740 | 19.87% |
| S3 | 520,057 | 52.01% |
| S4 | 1,631 | 0.16% |
| S5 | 0 | 0.00% |
| S6 | 0 | 0.00% |
| S7 | 0 | 0.00% |
| S8 | 0 | 0.00% |
| S9 | 0 | 0.00% |
| S10 | 0 | 0.00% |

### Economy

- Avg scraps earned/run: 10.93
- Avg ship parts bought/run: 0.000
- Avg crew quarter upgrades researched/run: 0.000
