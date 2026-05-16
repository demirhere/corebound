# Simulation Metrics

Latest snapshot of `scripts/simulate.mjs`. Re-generate with `pnpm sim:metrics` after touching any source-of-truth file (gate ramp, ship part catalog, crew quarter upgrade catalog, scrap economy, crew rosters). Commit the updated file alongside the gameplay change so the snapshot stays in sync.

- Generated: 2026-05-16
- Gate ramp: `[8, 9, 16, 17, 21, 24, 27, 31, 34, 38]` (total 225)
- Ship parts catalog: 20 unique
- Crew quarters upgrade: 1 generic card, 4 Scraps, +1 Fuel/play (any pattern)

## Target metrics (do not regress)

| Metric | Target |
|--------|--------|
| Win rate, jokers ON | 1.5 – 2.5% |
| Win rate, jokers OFF (`NO_JOKERS=1`) | 0% |
| S1 pass rate (deterministic) | 100% |
| S4 reach, jokers OFF (S3 wall) | < 1% |
| Avg crew quarter upgrades researched per winning run | 10 – 16 |
| Avg ship parts bought per winning run | ≈ 10 (5 in slot after replacement) |

## Jokers ON

- Runs: 1,000,000 (39.91s)
- **Win rate: 1.52%** (15,192 wins)

### Sector reach (cumulative)

| Sector | Reached | Pct |
|--------|---------|-----|
| S1 | 1,000,000 | 100.00% |
| S2 | 1,000,000 | 100.00% |
| S3 | 932,775 | 93.28% |
| S4 | 275,915 | 27.59% |
| S5 | 169,029 | 16.90% |
| S6 | 111,115 | 11.11% |
| S7 | 84,955 | 8.50% |
| S8 | 64,506 | 6.45% |
| S9 | 43,502 | 4.35% |
| S10 | 27,961 | 2.80% |
| WIN | 15,192 | 1.52% |

### Per-sector dropout

| Sector | Failed | Pct |
|--------|--------|-----|
| S1 | 0 | 0.00% |
| S2 | 67,225 | 6.72% |
| S3 | 656,860 | 65.69% |
| S4 | 106,886 | 10.69% |
| S5 | 57,914 | 5.79% |
| S6 | 26,160 | 2.62% |
| S7 | 20,449 | 2.04% |
| S8 | 21,004 | 2.10% |
| S9 | 15,541 | 1.55% |
| S10 | 12,769 | 1.28% |

### Economy

- Avg scraps earned/run: 24.08
- Avg ship parts bought/run: 2.195
- Avg crew quarter upgrades researched/run: 2.387
- Avg scraps earned/win: 87.77
- Avg ship parts bought/win: 7.163
- Avg crew quarter upgrades researched/win: 13.640
- Winners' final-fuel range: 0 – 69 (avg 11.36)

### Crew Quarter Upgrades researched by winners

| Upgrade | Total stacks | Per win |
|----------|--------------|---------|
| cross-trained | 82,550 | 5.434 |
| specialist | 67,449 | 4.440 |
| common-ground | 57,217 | 3.766 |

### Top ship parts held by winners

| Ship Part | Wins held | Pct of wins |
|-----------|-----------|-------------|
| lean-manifest | 11,359 | 74.77% |
| reserve-capacitor | 8,306 | 54.67% |
| preflight-tune-up | 7,452 | 49.05% |
| recovery-drone | 6,255 | 41.17% |
| cargo-hold | 6,129 | 40.34% |
| emergency-reserves | 5,840 | 38.44% |
| final-burn | 5,174 | 34.06% |
| scrap-forge | 4,880 | 32.12% |
| sector-engine | 4,225 | 27.81% |
| mission-streak | 2,633 | 17.33% |
| veterans-insignia | 2,227 | 14.66% |
| reinforced-manifold | 2,099 | 13.82% |
| hydroponics-bay | 2,090 | 13.76% |
| lab-centrifuge | 2,076 | 13.67% |
| stellar-cartographer | 2,032 | 13.38% |
| compounding-drive | 1,893 | 12.46% |
| adrenal-implants | 791 | 5.21% |
| fuel-cell-distillery | 175 | 1.15% |
| tachyon-lens | 156 | 1.03% |

## Jokers OFF (`NO_JOKERS=1`)

- Runs: 1,000,000 (18.54s)
- **Win rate: 0.00%** (0 wins)

### Sector reach (cumulative)

| Sector | Reached | Pct |
|--------|---------|-----|
| S1 | 1,000,000 | 100.00% |
| S2 | 1,000,000 | 100.00% |
| S3 | 854,698 | 85.47% |
| S4 | 1,152 | 0.12% |
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
| S2 | 145,302 | 14.53% |
| S3 | 853,546 | 85.35% |
| S4 | 1,152 | 0.12% |
| S5 | 0 | 0.00% |
| S6 | 0 | 0.00% |
| S7 | 0 | 0.00% |
| S8 | 0 | 0.00% |
| S9 | 0 | 0.00% |
| S10 | 0 | 0.00% |

### Economy

- Avg scraps earned/run: 14.35
- Avg ship parts bought/run: 0.000
- Avg crew quarter upgrades researched/run: 0.000
