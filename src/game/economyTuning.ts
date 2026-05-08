export const GATE_FUEL_COST = 2
export const STARTING_FUEL_SUPPLY = 0

// Scrap economy (Joker / Balatro-style):
//   - Mission Scrap reward tiers based on Fuel earned that action.
//   - Scrap-trigger Ship Parts (Recovery Drone, Cargo Hold) layer extra
//     Scraps on top.
// Tuning targets: avg ~32 Scraps earned/run, ~4–5% win rate vs the 221-Fuel
// gate ramp in scripts/simulate.mjs. Tiers tightened (was 1-2/3-4/5+ →
// 1/2/3) so greedy mid-tier patterns (Common Knowledge = 3 Fuel, the most
// common pick) only earn 1 Scrap. Players now buy ~4-5 ship parts/run vs
// ~10 under the old supply, making each shop offer a real decision.
export function getMissionScrapReward(fuelEarned: number): number {
  if (fuelEarned <= 0) return 0
  if (fuelEarned <= 3) return 1
  if (fuelEarned <= 5) return 2
  return 3
}
