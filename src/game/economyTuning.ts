export const GATE_FUEL_COST = 2
export const STARTING_FUEL_SUPPLY = 0

// Scrap economy (Joker / Balatro-style):
//   - Mission Scrap reward tiers based on Fuel earned that action.
//   - Scrap-trigger Ship Parts (Recovery Drone, Cargo Hold) layer extra
//     Scraps on top.
// Tuning targets: avg ~25 Scraps earned/run, ~2% win rate vs the 201-Fuel
// gate ramp in scripts/simulate.mjs. Tiers loosened back to 1-2/3-4/5+
// so Common Knowledge (3 Fuel — greedy's most common pick) earns 2
// Scraps instead of 1; winners buy ~10 ship parts/run, which is what
// it takes to push through the S3=14 wall and the steep back-end ramp.
export function getMissionScrapReward(fuelEarned: number): number {
  if (fuelEarned <= 0) return 0
  if (fuelEarned <= 2) return 1
  if (fuelEarned <= 4) return 2
  return 3
}
