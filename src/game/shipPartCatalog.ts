import type { ShipPartBlueprint } from './types'

// 25 unique Ship Parts (jokers). No duplicates allowed in a run — each
// blueprint is removed from the research pool when bought. Refund is
// `floor(cost/2)`. Categories balance: icon (4), pattern (6),
// first-mission (2), last-mission (2), scrap (2), interest (2),
// converter (3), hand (1), wild (1), special (2).
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
  // was dead). Balatro-mult: each crew used adds +1 Fuel, capped at +3.
  // Bridge Crew / Common Cause / Common Knowledge all hit the cap;
  // Department Heads = +2; Specialist = +1. Cap was added to keep it from
  // dominating; even with the cap it ends up in 90%+ of winning slots.
  // EXPECTED: appears in ≥60% of winning slots; lifts avg fuel/sector by
  // ~1.5–2.0 when held. Future test: Crew Synergy owners shift toward 3-4
  // crew patterns vs non-owners.
  {
    id: 'crew-synergy',
    label: 'Crew Synergy',
    description: '+1 Fuel per crew used in mission (max +3).',
    cost: 9,
    refund: 4,
    category: 'pattern',
    effects: [{ kind: 'per-crew-used', fuelPerCrew: 1, maxFuel: 3 }],
  },
  {
    id: 'specialist-gauntlets',
    label: 'Specialist Gauntlets',
    description: 'Specialist & Department Heads: +1 Fuel.',
    cost: 5,
    refund: 2,
    category: 'pattern',
    effects: [{ kind: 'pattern', patterns: ['specialist', 'department-heads'], fuel: 1 }],
  },
  {
    id: 'cluster-dynamo',
    label: 'Cluster Dynamo',
    description: 'Common Knowledge: +1 Fuel.',
    cost: 5,
    refund: 2,
    category: 'pattern',
    effects: [{ kind: 'pattern', patterns: ['common-knowledge'], fuel: 1 }],
  },
  {
    id: 'common-cause-banner',
    label: 'Common Cause Banner',
    description: 'Common Cause: +1 Fuel.',
    cost: 6,
    refund: 3,
    category: 'pattern',
    effects: [{ kind: 'pattern', patterns: ['common-cause'], fuel: 1 }],
  },
  {
    id: 'bridge-uplink',
    label: 'Bridge Uplink',
    description: 'Bridge Crew: +2 Fuel.',
    cost: 7,
    refund: 3,
    category: 'pattern',
    effects: [{ kind: 'pattern', patterns: ['bridge-crew'], fuel: 2 }],
  },

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

  // ---- Last-mission triggers (2) ---------------------------------------------------
  // DESIGN INTENT: Pattern Ladder replaces Ablative Plating (Last mission +1
  // was dominated by Final Burn). Boosts the patterns greedy actually picks
  // (Common Knowledge, Department Heads, Common Cause, Bridge Crew) by +1
  // each. Skips low-tier (Cross-Trained, Specialist, Common Ground) so it
  // doesn't compound with Lean Manifest / Crew Synergy. Power-curve part:
  // 2nd-tier boost on every successful mission.
  // EXPECTED: appears in ≥18% of winning slots (higher cost than initial
  // estimate); lifts avg fuel/sector by ~1.0 when held. Future test: Pattern
  // Ladder owners win-rate is 1.5× baseline.
  {
    id: 'pattern-ladder',
    label: 'Pattern Ladder',
    description: 'Common Knowledge / Department Heads / Common Cause / Bridge Crew: +1 Fuel.',
    cost: 6,
    refund: 3,
    category: 'last-mission',
    effects: [{
      kind: 'pattern-tier',
      patterns: ['common-knowledge', 'department-heads', 'common-cause', 'bridge-crew'],
      fuel: 1,
    }],
  },
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
  // Late-game scaling joker — gain a permanent +1 fuel/mission for every 5
  // missions completed run-wide, capped at +2. Bought early it pays off:
  // by mission 10 (sector 4) it's at +2 forever. Bought late it's a smaller
  // bump but still real. Inspired by Balatro's Hiker / Constellation:
  // scaling effects that snowball with play. Initial design (every 3
  // missions, max +3) was way too dominant; this nerf keeps it strong but
  // not auto-include.
  // EXPECTED: appears in ≥80% of winning slots when bought before sector 4;
  // lifts late-game fuel/sector by +2 (capped). Future test: among players
  // who buy this in S1-S3, win rate is 1.5× the no-Compounding baseline.
  {
    id: 'compounding-drive',
    label: 'Compounding Drive',
    description: 'Every 5 missions completed: permanent +1 Fuel/mission (max +2).',
    cost: 8,
    refund: 4,
    category: 'scrap',
    effects: [{ kind: 'mission-counter', interval: 5, fuelPerStack: 1, maxStacks: 2 }],
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
