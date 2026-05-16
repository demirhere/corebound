import type { ShipPartBlueprint } from './types'

// 20 unique Ship Parts (jokers). No duplicates allowed in a run — each
// blueprint is removed from the research pool when bought. Refund is
// `floor(cost/2)`. The 5 pattern-specific upgrades (Specialist Gauntlets,
// Cluster Dynamo, Common Cause Banner, Bridge Uplink, Pattern Ladder)
// were extracted into the Crew Quarter Upgrade catalog so players can research
// the same pattern repeatedly and stack fuel bonuses. Categories now:
// icon (4), pattern (2), first-mission (2), last-mission (1),
// scrap (4), converter (3), hand (1), wild (1), special (2). Total = 20.
//
// Mirrored in `scripts/simulate.mjs` (the JOKERS array). Update both in
// lockstep when tuning.
export const shipPartCatalog: readonly ShipPartBlueprint[] = [
  // ---- Icon boosters (4) -----------------------------------------------------------
  {
    id: 'reinforced-manifold',
    label: 'Reinforced Manifold',
    description: '+1 Fuel when used crew has Engine.',
    cost: 3,
    refund: 1,
    category: 'icon',
    effects: [{ kind: 'icon', icon: 'engine', fuel: 1 }],
  },
  {
    id: 'hydroponics-bay',
    label: 'Hydroponics Bay',
    description: '+1 Fuel when used crew has Life.',
    cost: 3,
    refund: 1,
    category: 'icon',
    effects: [{ kind: 'icon', icon: 'life', fuel: 1 }],
  },
  {
    id: 'stellar-cartographer',
    label: 'Stellar Cartographer',
    description: '+1 Fuel when used crew has Nav.',
    cost: 3,
    refund: 1,
    category: 'icon',
    effects: [{ kind: 'icon', icon: 'star', fuel: 1 }],
  },
  {
    id: 'lab-centrifuge',
    label: 'Lab Centrifuge',
    description: '+1 Fuel when used crew has Science.',
    cost: 3,
    refund: 1,
    category: 'icon',
    effects: [{ kind: 'icon', icon: 'signal', fuel: 1 }],
  },

  // ---- Pattern boosters (6) --------------------------------------------------------
  // DESIGN INTENT: Lean Manifest replaces Cross-Brace Couplers (Cross-Trained
  // +1 was dead — greedy never picks 1-fuel patterns when stronger options
  // exist). Rewards small-stack play (≤2 crew used) so Cross-Trained,
  // Specialist, Common Ground, Department Heads all become viable picks.
  // EXPECTED: appears in ≥10% of winning slots (cheap parts get displaced by
  // greedy slot-replacement; sim under-rates this). Lifts avg fuel/sector by
  // ~0.5-0.8 while held. Future test: Lean Manifest owners pick Department
  // Heads / 2-crew patterns more often than non-owners.
  {
    id: 'lean-manifest',
    label: 'Lean Manifest',
    description: 'Mission using ≤2 crew: +2 Fuel.',
    cost: 5,
    refund: 2,
    category: 'pattern',
    effects: [{ kind: 'crew-count-cap', maxCrew: 2, fuel: 2 }],
  },
  // DESIGN INTENT: Crew Synergy replaces Crew Stim Packs (Common Ground +1
  // was dead). Balatro-mult: each crew used adds +1 Fuel, capped at +4.
  // Bridge Crew / Common Cause hit the cap (+4); Common Knowledge = +3;
  // Department Heads = +2; Specialist = +1. The cap pushes players toward
  // the 4-crew patterns (Common Cause, Bridge Crew) for maximum value.
  // EXPECTED: appears in ≥65% of winning slots; lifts avg fuel/sector by
  // ~2.0–2.5 when held. Cost bumped to 10 (refund 5) so it doesn't get
  // bought trivially in the first sector.
  {
    id: 'crew-synergy',
    label: 'Crew Synergy',
    description: '+1 Fuel per crew used in mission (max +4).',
    cost: 10,
    refund: 5,
    category: 'pattern',
    effects: [{ kind: 'per-crew-used', fuelPerCrew: 1, maxFuel: 4 }],
  },
  // Note: Specialist Gauntlets, Cluster Dynamo, Common Cause Banner, and
  // Bridge Uplink moved to the Crew Quarter Upgrade catalog so players can
  // research the same pattern repeatedly and stack fuel bonuses.

  // ---- First-mission triggers (2) --------------------------------------------------
  // DESIGN INTENT: Mission Streak replaces Ration Optimizer (First mission +1
  // was dominated by Pre-Flight Tune-Up). Rewards repeating the same pattern
  // mission-after-mission: 2nd consecutive = +1, 3rd = +2, 4th = +3 (capped).
  // Streak resets when pattern changes. Greedy alternates patterns based on
  // hand draws, so this is a "hot streak" lottery — when crew comes up the
  // same way for 2-3 missions, the bonus pays out.
  // EXPECTED: appears in ≥15% of winning slots (less consistent than flat
  // boosters but rewards lucky crew draws). Future test: average bonus per
  // mission for owners ≈ 0.3-0.6 fuel.
  {
    id: 'mission-streak',
    label: 'Mission Streak',
    description: 'Pattern fuel +1 per consecutive same-pattern mission (max +3). Resets on switch.',
    cost: 3,
    refund: 1,
    category: 'first-mission',
    effects: [{ kind: 'pattern-streak', fuelPerStreak: 1, maxBonus: 3 }],
  },
  {
    id: 'preflight-tune-up',
    label: 'Pre-Flight Tune-Up',
    description: 'First mission of sector: +2 Fuel.',
    cost: 5,
    refund: 2,
    category: 'first-mission',
    effects: [{ kind: 'first-mission', fuel: 2 }],
  },

  // ---- Last-mission triggers (1) ---------------------------------------------------
  // Pattern Ladder was extracted into the Crew Quarter Upgrade catalog (now four
  // separate Crew Quarter Upgrades players can stack on the patterns they want).
  {
    id: 'final-burn',
    label: 'Final Burn',
    description: 'Last (3rd) mission of sector: +2 Fuel.',
    cost: 6,
    refund: 3,
    category: 'last-mission',
    effects: [{ kind: 'last-mission', fuel: 2 }],
  },

  // ---- Economy / scraps (2) --------------------------------------------------------
  // DESIGN INTENT: Compounding Drive replaces Salvage Sifter (+1 scrap/mission
  // got displaced by greedy slot replacement and was 0% in winning slots).
  // Late-game scaling joker — gain a permanent +1 Fuel/mission for every
  // 4 missions completed run-wide, capped at +3. Bought before S3 it
  // scales to +1 by mid-S2 and helps clear the S3=16 wall. Bought late
  // it still provides +2-3 fuel for the back-end gates. Inspired by
  // Balatro's Hiker / Constellation.
  // EXPECTED: appears in ≥90% of winning slots; lifts late-game
  // fuel/sector by +3 (capped). Future test: among players who buy this
  // before S3, win rate is 3× the no-Compounding baseline.
  {
    id: 'compounding-drive',
    label: 'Compounding Drive',
    description: 'Every 4 missions completed: permanent +1 Fuel/mission (max +3).',
    cost: 8,
    refund: 4,
    category: 'scrap',
    effects: [{ kind: 'mission-counter', interval: 4, fuelPerStack: 1, maxStacks: 3 }],
  },
  // DESIGN INTENT: Reserve Capacitor replaces Quartermaster (+2 scrap/sector
  // was 0% in winning slots). Implements the user's Balatro-leftover-hands
  // insight: at sector end, +1 Fuel per Ready (unused) crew (capped at 5).
  // Pairs with Lean Manifest (use ≤2 crew/mission → save 3+ Ready) and
  // Adrenal Implants (crew capacity +1 → more potential Ready crew). Rewards
  // efficient missions that don't burn through the cryo deck.
  // EXPECTED: appears in ≥24% of winning slots; fires for +2-4 fuel/sector
  // typically. Future test: Reserve Capacitor owners average ≥3 Ready crew
  // at gate time vs ≤2 for non-owners.
  {
    id: 'reserve-capacitor',
    label: 'Reserve Capacitor',
    description: 'End of sector: +1 Fuel per unused Ready crew (max 5).',
    cost: 6,
    refund: 3,
    category: 'scrap',
    effects: [{ kind: 'sector-end-ready-crew', fuelPerCrew: 1, maxCrew: 5 }],
  },

  // ---- Scrap-trigger ship parts (replaces the old interest pair) -------------------
  {
    id: 'recovery-drone',
    label: 'Recovery Drone',
    description: 'First mission of sector: +2 Scraps.',
    cost: 5,
    refund: 2,
    category: 'scrap',
    effects: [{ kind: 'scrap', perFirstMission: 2 }],
  },
  {
    id: 'cargo-hold',
    label: 'Cargo Hold',
    description: 'Last mission of sector: +2 Scraps.',
    cost: 5,
    refund: 2,
    category: 'scrap',
    effects: [{ kind: 'scrap', perLastMission: 2 }],
  },

  // ---- Resource converters (3) -----------------------------------------------------
  {
    id: 'scrap-forge',
    label: 'Scrap Forge',
    description: 'End of sector: spend 2 Scraps → +1 Fuel (auto).',
    cost: 6,
    refund: 3,
    category: 'converter',
    effects: [{ kind: 'converter', trigger: 'sector-end', scrapsSpent: 2, fuelGained: 1 }],
  },
  {
    id: 'fuel-cell-distillery',
    label: 'Fuel Cell Distillery',
    description: 'End of sector: spend 4 Scraps → +2 Fuel (auto).',
    cost: 9,
    refund: 4,
    category: 'converter',
    effects: [{ kind: 'converter', trigger: 'sector-end', scrapsSpent: 4, fuelGained: 2 }],
  },
  {
    id: 'emergency-reserves',
    label: 'Emergency Reserves',
    description: 'First mission of sector: spend 1 Scrap → +1 Fuel (auto).',
    cost: 5,
    refund: 2,
    category: 'converter',
    effects: [{ kind: 'converter', trigger: 'first-mission', scrapsSpent: 1, fuelGained: 1 }],
  },

  // ---- Crew capacity modifier (1) --------------------------------------------------
  {
    id: 'adrenal-implants',
    label: 'Adrenal Implants',
    description: '+1 crew capacity.',
    cost: 8,
    refund: 4,
    category: 'hand',
    effects: [{ kind: 'hand', handSizeDelta: 1 }],
  },

  // ---- Wild (1) --------------------------------------------------------------------
  {
    id: 'tachyon-lens',
    label: 'Tachyon Lens',
    description: 'One designated crew slot counts as having all 4 icons for pattern matching.',
    cost: 9,
    refund: 4,
    category: 'wild',
    effects: [{ kind: 'wild' }],
  },

  // ---- Special / sector triggers (2) -----------------------------------------------
  {
    id: 'sector-engine',
    label: 'Sector Engine',
    description: 'Sectors 3, 6, 9: +2 Fuel at end of sector.',
    cost: 6,
    refund: 3,
    category: 'special',
    // Sector indices are 0-based: 2/5/8 = sectors 3/6/9.
    effects: [{ kind: 'sector-end-fuel', sectors: [2, 5, 8], fuel: 2 }],
  },
  {
    id: 'veterans-insignia',
    label: "Veteran's Insignia",
    description: 'Sector 10 only: +3 Fuel at end of sector.',
    cost: 7,
    refund: 3,
    category: 'special',
    effects: [{ kind: 'sector-end-fuel', sectors: [9], fuel: 3 }],
  },
]

export function getShipPartBlueprint(id: string): ShipPartBlueprint | null {
  return shipPartCatalog.find((part) => part.id === id) ?? null
}
