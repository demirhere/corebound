#!/usr/bin/env node
/*
  Corebound simulation — canonical balance check for the joker economy.

  Models the live game's joker-economy design:
    - Crew & hand cycle: 45 crew (5 starters + 40 cryo, where the cryo
      is 10 unique blueprints with copy counts tuned for exact icon
      balance: Juno/Priya ×5, Oren/Malik ×3, everything else ×4). Hand
      size cap = 5 (+1 with Adrenal Implants). Used crew → tired. Hand
      refills from cryo. Cryo empty → tired reshuffles into cryo. No
      sector-end auto-reset.
    - Crew icons: a card has 1 or 2 specializations. Doubles (e.g. ['E','E'])
      can fill Specialist / Cross-Trained / Department Heads / Bridge Crew.
      Singles (e.g. ['E']) only contribute to shared-icon patterns
      (Common Ground / Common Knowledge / Common Cause). 26 of 40 cryo
      cards are singles in the current roster.
    - 10 sectors, 3 mission actions per sector, then a Gate.
    - Per action: stack crew, score Fuel = sum(crew_ranks) × pattern_mult.
      With every crew at rank 1 this is crew_count × mult.
    - Scraps (money):
        * Per mission: 1-2 fuel earned → 1 scrap, 3-4 → 2, 5+ → 3.
        * Joker scrap triggers (Recovery Drone, Cargo Hold) layer on top.
          No bank-style interest.
    - Ship parts (jokers): after each gate clears, draw 2 from a 20-card
      research pool, buy any affordable cheapest-first. **Each ship part
      is unique** — once bought it is removed from the run's research pool
      forever. The shop only ever offers parts the player doesn't own. The
      live dialog allows paid re-draws; this baseline does not take them.
    - Crew Quarters Upgrade (CQU): a single generic card. The player spends
      4 Scraps to deal one to the board (in-sector via a 4-Scrap stack
      action OR via a button in the post-gate research dialog). Stacking
      1-4 crew on the card + triggering it permanently grants +1 Fuel on
      every future play of the satisfied pattern AND permanently removes
      the crew used from the run. Greedy spends eagerly: any time scraps
      reach 4 and the hand can satisfy a pattern, it buys + applies one.
    - 5 active joker slots. Stacking-discard refunds floor(cost/2).

  Mirrored data — keep in lockstep with the source files:
    - Gate ramp           : src/game/blueprints/sectorGates.ts
    - Pattern rewards     : src/game/rules.ts (PATTERN_FUEL_DESC)
    - 20-part catalog     : src/game/shipPartCatalog.ts
    - Crew Quarter Upgrades: src/game/crewQuartersCatalog.ts
    - Scrap tiers         : src/game/economyTuning.ts

  Run:
    pnpm sim
    pnpm sim --runs=1000000
    GATE_TUNING=10,11,12,13,15,17,18,19,22,24 node scripts/simulate.mjs
    NO_JOKERS=1 node scripts/simulate.mjs              # disable joker buys

  Notes / honest disclosures:
    - Patterns return integer fuel (Bridge Crew is 6, the spec value).
    - Several jokers from the spec require approximations:
        * "Hand size +1" is modeled by raising HAND_SIZE_LIMIT for the run.
        * "Wild crew" picks a deterministic starter slot to be marked.
        * Once-per-sector converters fire automatically when affordable,
          since greedy never declines free fuel.
        * Optional paid research re-draws are not taken by the baseline
          greedy buyer unless explicitly modeled in a future tuning pass.
*/

// === Crew deck — same 45 crew as the live game (specs only) =========================
// Cards have 1 OR 2 specializations. Single-icon crew can fill shared-icon
// patterns but NOT Specialist / Cross-Trained / Department Heads / Bridge
// Crew (those branches in the rules require length === 2 entries).
//
// Cryo is 40 cards across 10 unique blueprints with per-template copies
// chosen so the entire 45-card roster is exactly icon-balanced at 16 each
// (E=L=N=S=16). Juno/Priya are at 5×, Oren/Malik at 3×, everything else
// at 4× — those nudges cancel the starter's E/L surplus (3,3 vs 2,2) and
// the natural N/S surplus from quadrupling Oren (S,S) and Malik (N,N).
// Singles still outnumber doubles in cryo (26 of 40).
const startingCrew = [
  ['L', 'N'], // Lei
  ['E', 'E'], // Mara (specialist)
  ['E', 'S'], // Ada
  ['L', 'L'], // Sana (specialist)
  ['S', 'N'], // Nia
]
const cryoCrewTemplateCopies = [
  { spec: ['E'],      copies: 5 }, // Juno
  { spec: ['L'],      copies: 5 }, // Priya
  { spec: ['N'],      copies: 4 }, // Ilya
  { spec: ['N'],      copies: 4 }, // Kade
  { spec: ['S'],      copies: 4 }, // Beni
  { spec: ['S'],      copies: 4 }, // Vera
  { spec: ['E', 'L'], copies: 4 }, // Calla
  { spec: ['E', 'L'], copies: 4 }, // Davin
  { spec: ['S', 'S'], copies: 3 }, // Oren (specialist)
  { spec: ['N', 'N'], copies: 3 }, // Malik (specialist)
]
// Each copy is a fresh array so the WILD_CREW_REFERENCE === check (used
// by Tachyon Lens to mark a single physical card as wild) doesn't end up
// marking every copy of a template at once.
const cryoCrew = cryoCrewTemplateCopies.flatMap(
  ({ spec, copies }) => Array.from({ length: copies }, () => spec.slice()),
)

// === Patterns — tight rewards = crew_count × pattern_mult ===========================
// Per the spec, all crew rank = 1, so reward depends purely on the pattern
// the picked crew satisfies and the # of crew used.
const PATTERN_FUEL = {
  'cross-trained':     1, // 1 mixed crew × 1
  'common-ground':     2, // 2 sharing icon × 1
  'specialist':        2, // 1 matched × 2
  'common-knowledge':  3, // 3 sharing × 1
  'department-heads':  4, // 2 specialists distinct × 2
  'common-cause':      4, // 4 sharing × 1
  'bridge-crew':       6, // 4 unique specialists × 1.5
}
const PATTERN_ORDER = [
  'bridge-crew',       // 6, 4 specialists distinct
  'department-heads',  // 4, 2 specialists distinct
  'common-cause',      // 4, 4 sharing
  'common-knowledge',  // 3, 3 sharing
  'specialist',        // 2, 1 matched
  'common-ground',     // 2, 2 sharing
  'cross-trained',     // 1, 1 mixed
]

// === Gate ramp ======================================================================
// With the expanded 45-card crew roster (4× cryo), greedy fuel/sector
// averages ~6.5 fuel/sector. Singles can't fill specialist-based patterns,
// and Mara/Sana (only E/L specialists) are now 1 of 45 cards each, so
// Bridge Crew / Department Heads land less often after the first sector.
//
// Reference ramps (sweep-derived, see TUNING NOTES):
//   Joker-on  (default)    : [8,8,9,10,12,17,21,25,29,32] total=171, win≈5.0%
//
// On the joker-on ramp, the no-jokers baseline run rate is **0%** by design
// (the back-end gates outpace greedy fuel earnings without joker support).
// The 25-joker pool gives ~5% wins for greedy buyers.
const GATE_TUNING_OVERRIDE = process.env.GATE_TUNING ? process.env.GATE_TUNING.split(',').map(Number) : null
// Total 225, recalibrated for the Upgrade Crew Quarters economy. The offer
// caps upgrade acquisition at 1 per gate (flat 4 Scraps), so a fully-built
// winner ends with ~5-7 upgrades on top of their 5-slot Ship Part loadout.
// Because the offer heuristic biases picks toward the patterns the player
// has been playing, upgrades return more fuel per Scrap than the prior
// 2-offer model — the late gates absorb that gain. The back-end ramp
// stays steep enough that a fully-built greedy run wins only ~1.5-2.5%.
// S3 stays the wall — a no-joker, no-upgrade run cannot clear cost 16.
const GATE_COSTS = GATE_TUNING_OVERRIDE ?? [8, 9, 16, 17, 21, 24, 27, 31, 34, 38]
const GATES_PER_RUN = 10
if (GATE_COSTS.length !== GATES_PER_RUN) {
  console.error(`GATE_TUNING must specify exactly ${GATES_PER_RUN} costs (got ${GATE_COSTS.length})`)
  process.exit(1)
}
if (GATE_COSTS.some((c) => !Number.isFinite(c) || c < 0)) {
  console.error(`GATE_TUNING contains a non-numeric or negative entry`)
  process.exit(1)
}

// === Run-time constants =============================================================
const STARTING_FUEL = 0
const STARTING_SCRAPS = 0
const ACTIONS_PER_SECTOR = 3
const HAND_SIZE_LIMIT_BASE = 5

// Joker behavior switches. Mutable so `runSimulation` can toggle modes
// within a single process when --write-metrics asks for both passes.
let NO_JOKERS = process.env.NO_JOKERS === '1' || process.env.NO_JOKERS === 'true'
const SLOT_CAP = 5
const SKIP_RESEARCH_CONSOLATION = 0

// === Joker catalog (20 unique parts, no duplicates allowed in pool) ================
// Keys used by the simulator (read by core loop):
//   id, label, cost, refund, category
//   onMission(ctx)        → {fuelDelta, scrapDelta, scrapPaid?}
//   onSectorEnd(ctx)      → {scrapDelta, sectorEndFuelDelta, sectorEndCostDelta?}
//   patternFuelDelta(p)   → bonus fuel folded into greedy pattern choice
//   handSizeDelta         → adds to base hand size limit
//   wildCrew              → boolean: marks crew[wildSlot] as wild for pattern matching
//
// Per-mission ctx fields: { usedCrew, missionIndexInSector, sectorIndex, isLastMission }
// Sector-end ctx fields:  { scraps, sectorIndex }
const JOKERS = [
  // ---- Icon boosters (4) -----------------------------------------------------------
  {
    id: 'reinforced-manifold', label: 'Reinforced Manifold', cost: 3, refund: 1,
    category: 'icon',
    onMission: ({ usedCrew }) => ({ fuelDelta: usedCrew.some((c) => c.includes('E')) ? 1 : 0 }),
  },
  {
    id: 'hydroponics-bay', label: 'Hydroponics Bay', cost: 3, refund: 1,
    category: 'icon',
    onMission: ({ usedCrew }) => ({ fuelDelta: usedCrew.some((c) => c.includes('L')) ? 1 : 0 }),
  },
  {
    id: 'stellar-cartographer', label: 'Stellar Cartographer', cost: 3, refund: 1,
    category: 'icon',
    onMission: ({ usedCrew }) => ({ fuelDelta: usedCrew.some((c) => c.includes('N')) ? 1 : 0 }),
  },
  {
    id: 'lab-centrifuge', label: 'Lab Centrifuge', cost: 3, refund: 1,
    category: 'icon',
    onMission: ({ usedCrew }) => ({ fuelDelta: usedCrew.some((c) => c.includes('S')) ? 1 : 0 }),
  },

  // ---- Pattern boosters (2) --------------------------------------------------------
  // DESIGN INTENT (Lean Manifest): rewards small-stack play (≤2 crew used)
  // so Cross-Trained / Specialist / Common Ground / Department Heads all
  // become viable picks.
  // EXPECTED: ≥30% of winning slots; lifts greedy avg fuel/sector by ~0.5–0.8.
  {
    id: 'lean-manifest', label: 'Lean Manifest', cost: 5, refund: 2,
    category: 'pattern',
    onMission: ({ usedCrew }) => ({ fuelDelta: usedCrew.length <= 2 ? 2 : 0 }),
  },
  // DESIGN INTENT (Crew Synergy): pure Balatro-mult — each crew used adds
  // +1 Fuel. Bridge Crew = +4, Common Cause = +4, Common Knowledge = +3,
  // Department Heads = +2.
  // EXPECTED: ≥35% of winning slots; lifts fuel/sector by ~1.0–1.5.
  {
    id: 'crew-synergy', label: 'Crew Synergy', cost: 10, refund: 5,
    category: 'pattern',
    onMission: ({ usedCrew }) => ({ fuelDelta: Math.min(4, usedCrew.length) }),
  },
  // NOTE: Specialist Gauntlets, Cluster Dynamo, Common Cause Banner, and
  // Bridge Uplink moved to the Crew Quarters Upgrade (CQU) mechanic —
  // every researched upgrade is the same +1 Fuel/play on the satisfied
  // pattern, regardless of which composition the player commits.

  // ---- First-mission triggers (2) --------------------------------------------------
  // DESIGN INTENT (Mission Streak): replaces Ration Optimizer (+1 first
  // mission was dominated by Pre-Flight Tune-Up). Hot-streak joker — bonus
  // builds when same pattern is played consecutively (2nd in a row = +1,
  // 3rd = +2, 4th = +3 capped). Resets on switch.
  // EXPECTED: ≥15% of winning slots (less consistent than flat boosters);
  // avg bonus per mission for owners ≈ 0.3-0.6 fuel.
  {
    id: 'mission-streak', label: 'Mission Streak', cost: 3, refund: 1,
    category: 'first-mission',
    onMission: ({ pattern, lastPattern, streakBefore }) => ({
      fuelDelta: pattern && pattern === lastPattern
        ? Math.min(3, streakBefore)
        : 0,
    }),
  },
  {
    id: 'preflight-tune-up', label: 'Pre-Flight Tune-Up', cost: 5, refund: 2,
    category: 'first-mission',
    onMission: ({ missionIndexInSector }) => ({ fuelDelta: missionIndexInSector === 0 ? 2 : 0 }),
  },

  // ---- Last-mission triggers (1) ---------------------------------------------------
  // NOTE: Pattern Ladder is now covered by Crew Quarters Upgrades — any
  // pattern can be deepened by buying upgrades that commit on it.
  {
    id: 'final-burn', label: 'Final Burn', cost: 6, refund: 3,
    category: 'last-mission',
    onMission: ({ isLastMission }) => ({ fuelDelta: isLastMission ? 2 : 0 }),
  },

  // ---- Economy / scraps (4) --------------------------------------------------------
  // DESIGN INTENT (Compounding Drive): replaces Salvage Sifter. Late-game
  // scaling joker — every 3 missions completed grants a permanent +1
  // fuel/mission, capped at +3. Inspired by Balatro's Hiker / Constellation.
  // EXPECTED: ≥45% of winning slots (when bought before sector 4); among
  // S1-S3 buyers, win rate is 1.5× the no-Compounding baseline.
  {
    id: 'compounding-drive', label: 'Compounding Drive', cost: 8, refund: 4,
    category: 'scrap',
    // Every 4 missions completed: permanent +1 Fuel/mission, capped at +3.
    // Bought before S3 it scales to +1 by mid-S2 and helps clear the S3=16
    // wall. Bought late it still provides +2-3 fuel for the back-end gates.
    onMission: ({ missionsCompletedBefore }) => ({
      fuelDelta: Math.min(3, Math.floor(missionsCompletedBefore / 4)),
    }),
  },
  // DESIGN INTENT (Reserve Capacitor): replaces Quartermaster. Sector-end
  // bonus = +1 fuel per Ready (unused) crew, capped at 5. Implements the
  // user's Balatro-leftover-hands insight: "more crew unused = better".
  // EXPECTED: ≥25% of winning slots; fires for +2-4 fuel/sector typically.
  {
    id: 'reserve-capacitor', label: 'Reserve Capacitor', cost: 6, refund: 3,
    category: 'scrap',
    onSectorEnd: ({ readyCrewCount }) => ({
      sectorEndFuelDelta: Math.min(5, readyCrewCount),
    }),
  },
  {
    id: 'recovery-drone', label: 'Recovery Drone', cost: 5, refund: 2,
    category: 'scrap',
    // First mission of sector: +2 Scraps. Pairs with Pre-Flight Tune-Up.
    onMission: ({ missionIndexInSector }) => (
      missionIndexInSector === 0 ? { scrapDelta: 2 } : {}
    ),
  },
  {
    id: 'cargo-hold', label: 'Cargo Hold', cost: 5, refund: 2,
    category: 'scrap',
    // Last mission of sector: +2 Scraps. Pairs with Final Burn / Pattern Ladder.
    onMission: ({ isLastMission }) => (
      isLastMission ? { scrapDelta: 2 } : {}
    ),
  },

  // ---- Resource converters (3) -----------------------------------------------------
  {
    id: 'scrap-forge', label: 'Scrap Forge', cost: 6, refund: 3,
    category: 'converter',
    // Once per sector: spend 2 scraps → +1 fuel, automatic when affordable.
    onSectorEnd: ({ scraps }) => (scraps >= 2
      ? { scrapDelta: -2, sectorEndFuelDelta: 1 }
      : {}),
  },
  {
    id: 'fuel-cell-distillery', label: 'Fuel Cell Distillery', cost: 9, refund: 4,
    category: 'converter',
    // Once per sector: spend 4 scraps → +2 fuel.
    // Pre-emptive nerf vs the original cost 8: this part dominated winning
    // slots at ~84% in earlier sweeps.
    onSectorEnd: ({ scraps }) => (scraps >= 4
      ? { scrapDelta: -4, sectorEndFuelDelta: 2 }
      : {}),
  },
  {
    id: 'emergency-reserves', label: 'Emergency Reserves', cost: 5, refund: 2,
    category: 'converter',
    // First mission of sector: spend 1 scrap → +1 fuel (auto-fires when affordable).
    onMission: ({ missionIndexInSector, scraps }) => (
      missionIndexInSector === 0 && scraps >= 1
        ? { fuelDelta: 1, scrapDelta: -1 }
        : {}
    ),
  },

  // ---- Hand modifiers (1) ----------------------------------------------------------
  {
    id: 'adrenal-implants', label: 'Adrenal Implants', cost: 8, refund: 4,
    category: 'hand',
    handSizeDelta: 1,
  },

  // ---- Special / wild (3) ----------------------------------------------------------
  {
    id: 'tachyon-lens', label: 'Tachyon Lens', cost: 9, refund: 4,
    category: 'wild',
    // Marks one specific crew (slot 0 of starting crew = Lei [L,N])
    // as wild — counts as having all 4 icons for pattern matching.
    wildCrew: true,
  },
  {
    id: 'sector-engine', label: 'Sector Engine', cost: 6, refund: 3,
    category: 'special',
    // Every 3rd sector (sector 3, 6, 9 → indices 2, 5, 8): +2 fuel at end-of-sector.
    onSectorEnd: ({ sectorIndex }) => (
      sectorIndex === 2 || sectorIndex === 5 || sectorIndex === 8
        ? { sectorEndFuelDelta: 2 }
        : {}
    ),
  },
  {
    id: 'veterans-insignia', label: "Veteran's Insignia", cost: 7, refund: 3,
    category: 'special',
    // Final sector only (index 9): +3 fuel at end-of-sector.
    onSectorEnd: ({ sectorIndex }) => (
      sectorIndex === 9 ? { sectorEndFuelDelta: 3 } : {}
    ),
  },
]

if (JOKERS.length !== 20) {
  console.error(`Expected 20 jokers, got ${JOKERS.length}`)
  process.exit(1)
}
// Verify refund = floor(cost/2)
for (const j of JOKERS) {
  if (j.refund !== Math.floor(j.cost / 2)) {
    console.error(`Refund mismatch on ${j.id}: cost=${j.cost} refund=${j.refund} expected=${Math.floor(j.cost / 2)}`)
    process.exit(1)
  }
}

// === Crew Quarters Upgrade (single generic card; researchable repeatedly) =======
// Every upgrade costs CREW_QUARTERS_UPGRADE_COST Scraps and grants
// +CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY Fuel on every future play of the
// pattern the player satisfies when triggering the card. Unlike ship parts
// the upgrades stack — researching the same pattern twice doubles its bonus.
// Crew committed to the upgrade are permanently removed from the run.
//
// Mirrored in `src/game/crewQuartersCatalog.ts`. Update both in lockstep.
const CREW_QUARTERS_UPGRADE_COST = 4
const CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY = 1
// Greedy reserve: keep at least this many Scraps available for ship-part
// purchases before spending more on Crew Quarters Upgrades. Cheap ship
// parts (Compounding Drive / Recovery Drone) cost 4-5 Scraps, so leaving a
// 4-Scrap buffer roughly models a player who alternates between the two
// kinds of investment instead of draining everything into upgrades.
const IN_SECTOR_CQU_SCRAP_BUFFER = 4

function crewQuartersFuelBonus(quarters, pattern) {
  if (!pattern) return 0
  let bonus = 0
  for (const entry of quarters) {
    if (entry.pattern === pattern) bonus += entry.fuelPerPlay
  }
  return bonus
}

// === Helpers ========================================================================
const ICONS = ['E', 'L', 'N', 'S']

// Identity for crew used through the run is by reference. We mark a specific
// starter crew member (Lei, slot 0 of startingCrew) as the wild slot.
const WILD_CREW_REFERENCE = startingCrew[0]

function buildIsMatched(slot) {
  const wildOn = slot.some((j) => j.wildCrew)
  return (c) => {
    if (wildOn && c === WILD_CREW_REFERENCE) return true
    // Mirror live game: only length-2 matched specs count as a specialist.
    return c.length === 2 && c[0] === c[1]
  }
}
function buildIsMixed(slot) {
  // Wild can also fill mixed (it matches everything). Live game requires
  // length === 2 with two distinct specs — singles do NOT count as mixed.
  const wildOn = slot.some((j) => j.wildCrew)
  return (c) => {
    if (wildOn && c === WILD_CREW_REFERENCE) return true
    return c.length === 2 && c[0] !== c[1]
  }
}
function buildSharesIcon(slot) {
  const wildOn = slot.some((j) => j.wildCrew)
  return (a, b) => {
    if (wildOn && (a === WILD_CREW_REFERENCE || b === WILD_CREW_REFERENCE)) return true
    return a.some((icon) => b.includes(icon))
  }
}
function buildHasIcon(slot) {
  const wildOn = slot.some((j) => j.wildCrew)
  return (c, icon) => {
    if (wildOn && c === WILD_CREW_REFERENCE) return true
    return c.includes(icon)
  }
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

function findPatternMatch(ready, pattern, slot) {
  const isMatched = buildIsMatched(slot)
  const isMixed = buildIsMixed(slot)
  const sharesIcon = buildSharesIcon(slot)
  const hasIcon = buildHasIcon(slot)
  const wildOn = slot.some((j) => j.wildCrew)

  if (pattern === 'bridge-crew') {
    // Need 4 specialists with 4 distinct icons.
    const specs = ready.filter(isMatched)
    // Greedy: pick the wild first if available so it can fill the rarest icon.
    const seen = new Set()
    const picked = []
    // Sort specs so wild crew fills its icon last (try to use real specialists first).
    const sortedSpecs = wildOn
      ? specs.slice().sort((a, b) => (a === WILD_CREW_REFERENCE ? 1 : -1))
      : specs
    // For wild, we need to pick which icon it fills. Try fill the missing one.
    const realIconsSeen = new Set()
    for (const c of sortedSpecs) {
      if (c === WILD_CREW_REFERENCE) continue
      realIconsSeen.add(c[0])
    }
    for (const c of sortedSpecs) {
      if (c === WILD_CREW_REFERENCE) {
        // Find a missing icon to fill.
        let fillIcon = null
        for (const icon of ICONS) {
          if (!realIconsSeen.has(icon) && !seen.has(icon)) {
            fillIcon = icon
            break
          }
        }
        if (fillIcon && !seen.has(fillIcon)) {
          seen.add(fillIcon)
          picked.push(c)
        }
      } else if (!seen.has(c[0])) {
        seen.add(c[0])
        picked.push(c)
      }
      if (picked.length === 4) break
    }
    return seen.size === 4 ? { crewUsed: picked } : null
  }
  if (pattern === 'common-cause') {
    for (const icon of ICONS) {
      const m = ready.filter((c) => hasIcon(c, icon))
      if (m.length >= 4) return { crewUsed: m.slice(0, 4) }
    }
    return null
  }
  if (pattern === 'department-heads') {
    const specs = ready.filter(isMatched)
    // For wild, pick its filled icon to be a missing one.
    const realIcons = new Set()
    for (const c of specs) {
      if (c === WILD_CREW_REFERENCE) continue
      realIcons.add(c[0])
    }
    const seen = new Set()
    const picked = []
    for (const c of specs) {
      if (c === WILD_CREW_REFERENCE) {
        // Choose any icon not in realIcons-and-not-in-seen.
        let fillIcon = null
        for (const icon of ICONS) {
          if (!realIcons.has(icon) && !seen.has(icon)) {
            fillIcon = icon
            break
          }
        }
        if (fillIcon === null) {
          // Could still help by being a distinct icon vs. seen; pick any seen-missing.
          for (const icon of ICONS) {
            if (!seen.has(icon)) {
              fillIcon = icon
              break
            }
          }
        }
        if (fillIcon && !seen.has(fillIcon)) {
          seen.add(fillIcon)
          picked.push(c)
        }
      } else if (!seen.has(c[0])) {
        seen.add(c[0])
        picked.push(c)
      }
      if (picked.length === 2) return { crewUsed: picked }
    }
    return picked.length === 2 ? { crewUsed: picked } : null
  }
  if (pattern === 'common-knowledge') {
    for (const icon of ICONS) {
      const m = ready.filter((c) => hasIcon(c, icon))
      if (m.length >= 3) return { crewUsed: m.slice(0, 3) }
    }
    return null
  }
  if (pattern === 'specialist') {
    const c = ready.find(isMatched)
    return c ? { crewUsed: [c] } : null
  }
  if (pattern === 'cross-trained') {
    const c = ready.find(isMixed)
    return c ? { crewUsed: [c] } : null
  }
  if (pattern === 'common-ground') {
    for (let i = 0; i < ready.length; i++) {
      for (let j = i + 1; j < ready.length; j++) {
        if (sharesIcon(ready[i], ready[j])) {
          return { crewUsed: [ready[i], ready[j]] }
        }
      }
    }
    return null
  }
  return null
}

// Greedy: maximize end fuel for this action (after pattern bonuses from active
// jokers and any per-mission flat bonuses). Ties broken by min crew used.
// We need to factor in `onMission` flat fuel deltas that depend on context
// (icon match, first-mission, last-mission, etc.) so the greedy choice is
// informed by them.
function pickGreedyAction(ready, slot, quarters, missionIndexInSector, isLastMission, scraps, runStats) {
  let best = null
  for (const pattern of PATTERN_ORDER) {
    const match = findPatternMatch(ready, pattern, slot)
    if (!match) continue
    let baseFuel = PATTERN_FUEL[pattern]
    for (const j of slot) {
      if (j.patternFuelDelta) baseFuel += j.patternFuelDelta(pattern)
    }
    baseFuel += crewQuartersFuelBonus(quarters, pattern)
    // Apply onMission deltas for this candidate (so greedy knows which
    // pattern actually scores highest with all jokers folded in). We
    // re-run the same loop in `computeFinalMissionFuel` for the commit;
    // both must produce identical fuel since they see the same slot/ctx.
    let ctxFuel = 0
    const ctx = {
      usedCrew: match.crewUsed,
      missionIndexInSector,
      isLastMission,
      scraps,
      pattern,
      lastPattern: runStats.lastPattern,
      streakBefore: runStats.lastPattern === pattern ? runStats.streakCount : 0,
      missionsCompletedBefore: runStats.missionsCompleted,
    }
    let scrapBudget = scraps
    for (const j of slot) {
      if (j.onMission) {
        const r = j.onMission(ctx) || {}
        if (r.scrapDelta && r.scrapDelta < 0) {
          // Pay only if we have budget (matches commit-side gating).
          if (scrapBudget + r.scrapDelta < 0) {
            // Not affordable; skip this trigger entirely (no fuel either).
            continue
          }
          scrapBudget += r.scrapDelta
        }
        if (r.fuelDelta) ctxFuel += r.fuelDelta
      }
    }
    const totalFuel = baseFuel + ctxFuel
    const crewCount = match.crewUsed.length
    if (
      !best ||
      totalFuel > best.fuel ||
      (totalFuel === best.fuel && crewCount < best.crewUsed.length)
    ) {
      best = {
        pattern,
        fuel: totalFuel,
        crewUsed: match.crewUsed,
      }
    }
  }
  return best
}

function computeMissionScraps(fuel) {
  // Loosened tiers (1-2/3-4/5+ instead of 1-3/4-5/6+) so greedy gets
  // enough Scraps to buy 4-6 ship parts. Common Knowledge (3 Fuel,
  // greedy's most common mid-tier pick) now yields 2 Scraps; Bridge
  // Crew (6) and pattern-boosted plays land in the 3-Scrap tier.
  if (fuel <= 0) return 0
  if (fuel <= 2) return 1
  if (fuel <= 4) return 2
  return 3
}

function getHandSizeLimit(slot) {
  let h = HAND_SIZE_LIMIT_BASE
  for (const j of slot) if (j.handSizeDelta) h += j.handSizeDelta
  return h
}

// Decision: given the current dialog (2 random parts shown), buy any
// affordable starting cheapest-first. At slot cap, allow lowest-impact
// replacement via stacking discard (refund the displaced joker's refund).
//
// `availablePool` is the run's research pool (jokers not yet owned). We
// remove purchased jokers from the pool so they can't be offered again.
// Replaced (discarded) jokers do NOT return to the pool — they're spent.
function maybeBuyJokers({ scraps, slot, offers, availablePool }) {
  const sorted = offers.slice().sort((a, b) => a.cost - b.cost)
  const purchased = []
  for (const offer of sorted) {
    // Safety: never own duplicates.
    if (slot.some((j) => j.id === offer.id)) continue
    if (slot.length < SLOT_CAP) {
      if (scraps >= offer.cost) {
        scraps -= offer.cost
        slot.push(offer)
        purchased.push(offer)
        // Remove from availablePool.
        const idx = availablePool.findIndex((p) => p.id === offer.id)
        if (idx >= 0) availablePool.splice(idx, 1)
      }
    } else {
      // Find cheapest-cost slot joker as candidate to displace.
      const cheapestSlotIdx = slot.reduce(
        (idx, j, i) => (slot[idx].cost <= j.cost ? idx : i),
        0,
      )
      const cheapestSlot = slot[cheapestSlotIdx]
      // Replacement: pay (offer.cost - cheapestSlot.refund) net.
      // Only do it if the offer is meaningfully more expensive (heuristic for stronger).
      if (offer.cost > cheapestSlot.cost && scraps >= offer.cost - cheapestSlot.refund) {
        scraps -= offer.cost - cheapestSlot.refund
        slot.splice(cheapestSlotIdx, 1)
        slot.push(offer)
        purchased.push(offer)
        const idx = availablePool.findIndex((p) => p.id === offer.id)
        if (idx >= 0) availablePool.splice(idx, 1)
      }
    }
  }
  return { scraps, purchased }
}

// Crew Quarters Upgrade heuristic: while affordable, find the cheapest-crew
// composition in hand that satisfies SOME pattern, pay 4 Scraps, and apply
// the upgrade to that pattern. Mirrors the in-sector 4-Scrap stack action
// AND the post-gate dialog button (both deal the same generic CQU card
// from the same offscreen deck — the simulator collapses both into a single
// loop). Crew used are PERMANENTLY removed from the run (not pushed to
// tired) so the cryo cycle shrinks with every upgrade.
//
// Tie-breaks favor deepening the most-played + already-stacked pattern,
// which models the "deepen what you've been playing" mental model the live
// player has when picking which composition to commit on the board.
function tryApplyCrewQuartersUpgrade({
  scraps,
  hand,
  slot,
  quarters,
  patternCounts,
}) {
  if (scraps < CREW_QUARTERS_UPGRADE_COST) return null

  // Build candidate (pattern, crewUsed[]) pairs for every pattern the hand
  // currently satisfies, sorted by (a) crew count asc (cheap = preserve
  // crew), (b) owned-count desc (deepen existing investment), (c) plays
  // desc.
  const owned = new Map()
  for (const q of quarters) owned.set(q.pattern, (owned.get(q.pattern) ?? 0) + 1)

  const candidates = []
  for (const pattern of Object.keys(PATTERN_FUEL)) {
    if (pattern === 'open') continue
    const match = findPatternMatch(hand, pattern, slot)
    if (!match) continue
    candidates.push({
      pattern,
      crewUsed: match.crewUsed,
      owned: owned.get(pattern) ?? 0,
      played: patternCounts?.get(pattern) ?? 0,
    })
  }
  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    if (a.crewUsed.length !== b.crewUsed.length) return a.crewUsed.length - b.crewUsed.length
    if (a.owned !== b.owned) return b.owned - a.owned
    if (a.played !== b.played) return b.played - a.played
    // Final tiebreak: prefer higher-base-fuel patterns (Bridge Crew > common).
    return (PATTERN_FUEL[b.pattern] ?? 0) - (PATTERN_FUEL[a.pattern] ?? 0)
  })

  const pick = candidates[0]
  return pick
}

function pickRunGates() {
  // GATE_COSTS is already in ascending order — sort defensively for safety.
  return GATE_COSTS.slice().sort((a, b) => a - b).map((cost) => ({ cost }))
}

function simulateRun() {
  // Each run starts with the full 20-joker pool available. Crew Quarters
  // Upgrades are dealt from the offscreen CQU deck whenever the player
  // spends 4 Scraps — the deck has effectively unlimited stock, and each
  // upgrade burns the crew used to commit it.
  const availablePool = JOKERS.slice()

  const slot = []  // active joker slot (max 5)
  const crewQuarters = []  // researched Crew Quarter Upgrades (stackable, no cap)

  // Hand size could grow if Adrenal Implants is bought, but we initialize
  // at base 5 here and re-check after every purchase.
  let handSize = HAND_SIZE_LIMIT_BASE
  let hand = startingCrew.slice(0, handSize)
  const remainingStarters = startingCrew.slice(handSize)
  let cryo = shuffle([...remainingStarters, ...cryoCrew])
  let tired = []
  const gates = pickRunGates()
  let fuel = STARTING_FUEL
  let scraps = STARTING_SCRAPS

  function drawToLimit() {
    while (hand.length < handSize) {
      if (cryo.length === 0) {
        if (tired.length === 0) return
        cryo = shuffle(tired)
        tired = []
      }
      const drawn = cryo.shift()
      if (drawn) hand.push(drawn)
    }
  }
  drawToLimit()

  let totalFuelEarned = 0
  let totalScrapsEarned = 0
  let totalJokersBought = 0
  let totalCrewQuartersBought = 0
  const jokerCategoryCounts = {}
  const crewQuartersCounts = {}
  // Run-wide stats for stateful jokers (Compounding Drive, Mission Streak).
  // `lastPattern` and `streakCount` track consecutive same-pattern plays;
  // `missionsCompleted` is the number of missions resolved before the next
  // one fires.
  const runStats = {
    missionsCompleted: 0,
    lastPattern: null,
    streakCount: 0,
  }
  // Patterns played so far this run — used by the Upgrade Crew Quarters buy
  // heuristic to bias toward "deepen what you've been playing".
  const patternPlayCounts = new Map()

  for (let s = 0; s < GATES_PER_RUN; s++) {
    for (let action = 0; action < ACTIONS_PER_SECTOR; action++) {
      const isLastMission = action === ACTIONS_PER_SECTOR - 1
      const choice = pickGreedyAction(hand, slot, crewQuarters, action, isLastMission, scraps, runStats)
      if (!choice) break

      // Compute mission fuel + scrap deltas (canonical pass).
      const m = computeFinalMissionFuel(choice, slot, crewQuarters, action, isLastMission, scraps, runStats)
      const missionFuel = Math.max(0, m.fuel)
      fuel += missionFuel
      totalFuelEarned += missionFuel

      // Scraps from the mission-fuel reward tier, plus joker on-mission deltas.
      const tierScraps = computeMissionScraps(missionFuel)
      const scrapNet = tierScraps + m.scrapDelta
      // Apply: reward scraps may be reduced by negative deltas (Emergency
      // Reserves spending scraps), but never below zero — and the joker
      // already gates -delta on affordability before applying its fuel.
      scraps = Math.max(0, scraps + scrapNet)
      totalScrapsEarned += Math.max(0, scrapNet)

      // Update run-wide counters AFTER effects fire (Compounding Drive's
      // missionsCompletedBefore and Mission Streak's streakBefore should
      // see the values from BEFORE this mission resolved).
      runStats.missionsCompleted += 1
      if (choice.pattern === runStats.lastPattern) {
        runStats.streakCount += 1
      } else {
        runStats.streakCount = 1
        runStats.lastPattern = choice.pattern
      }
      if (choice.pattern) {
        patternPlayCounts.set(choice.pattern, (patternPlayCounts.get(choice.pattern) ?? 0) + 1)
      }

      for (const used of choice.crewUsed) {
        const idx = hand.indexOf(used)
        if (idx >= 0) {
          hand.splice(idx, 1)
          tired.push(used)
        }
      }
      drawToLimit()

      // Eager Crew Quarters Upgrade spend. After each mission resolves,
      // greedy spends 4 Scraps on an upgrade for the satisfied pattern that
      // takes the fewest crew. To avoid starving ship-part purchases the
      // greedy keeps a IN_SECTOR_CQU_SCRAP_BUFFER reserve — typical ship
      // parts cost 4-6 Scraps, so this models a thoughtful player who only
      // upgrades when they can still afford a ship part. Crew committed to
      // the upgrade are permanently removed from the run (no tired push).
      if (!NO_JOKERS) {
        while (scraps >= CREW_QUARTERS_UPGRADE_COST + IN_SECTOR_CQU_SCRAP_BUFFER) {
          const upgrade = tryApplyCrewQuartersUpgrade({
            scraps,
            hand,
            slot,
            quarters: crewQuarters,
            patternCounts: patternPlayCounts,
          })
          if (!upgrade) break
          scraps -= CREW_QUARTERS_UPGRADE_COST
          crewQuarters.push({
            pattern: upgrade.pattern,
            fuelPerPlay: CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY,
          })
          totalCrewQuartersBought += 1
          crewQuartersCounts[upgrade.pattern] = (crewQuartersCounts[upgrade.pattern] || 0) + 1
          // Remove the crew used by the upgrade from hand permanently.
          for (const used of upgrade.crewUsed) {
            const idx = hand.indexOf(used)
            if (idx >= 0) hand.splice(idx, 1)
          }
          drawToLimit()
        }
      }
    }

    // End-of-sector joker triggers (in slot order; deterministic).
    // `readyCrewCount` = number of crew still in hand at gate time —
    // consumed by Reserve Capacitor.
    const readyCrewCount = hand.length
    for (const j of slot) {
      if (j.onSectorEnd) {
        const r = j.onSectorEnd({ scraps, sectorIndex: s, readyCrewCount }) || {}
        if (r.scrapDelta) scraps = Math.max(0, scraps + r.scrapDelta)
        if (r.sectorEndFuelDelta) {
          fuel += r.sectorEndFuelDelta
          totalFuelEarned += r.sectorEndFuelDelta
        }
      }
    }

    // Gate test. (Scrap interest mechanic removed — replaced by per-mission
    // first/last triggers via Recovery Drone and Cargo Hold.)
    const cost = gates[s].cost
    if (fuel < cost) {
      return {
        sectorsPassed: s,
        finalFuel: fuel,
        finalScraps: scraps,
        won: false,
        totalFuelEarned,
        totalScrapsEarned,
        totalJokersBought,
        totalCrewQuartersBought,
        jokerCategoryCounts,
        crewQuartersCounts,
        slot: slot.slice(),
        crewQuarters: crewQuarters.slice(),
      }
    }
    fuel -= cost

    // Research dialog: draw up to 2 ship parts from the un-owned pool. The
    // Crew Quarters Upgrade is bought eagerly in-sector (above), so the
    // dialog only handles ship parts in the sim. Crew Quarters Upgrades
    // bought via the dialog button are equivalent in the live game; we
    // collapse both paths into the in-sector loop.
    if (!NO_JOKERS) {
      const drawCount = Math.min(2, availablePool.length)
      const shipPartOffers = []
      const poolCopy = availablePool.slice()
      for (let k = 0; k < drawCount; k++) {
        const idx = Math.floor(Math.random() * poolCopy.length)
        shipPartOffers.push(poolCopy[idx])
        poolCopy.splice(idx, 1)
      }
      const result = maybeBuyJokers({ scraps, slot, offers: shipPartOffers, availablePool })
      scraps = result.scraps
      totalJokersBought += result.purchased.length
      for (const p of result.purchased) {
        jokerCategoryCounts[p.category] = (jokerCategoryCounts[p.category] || 0) + 1
      }
      // Post-gate spillover: with ship parts done, drain any remaining
      // scraps into Crew Quarters Upgrades. Mirrors the live player who
      // clicks the dialog's "Place CQU" button repeatedly after they've
      // bought their preferred ship part — no buffer needed now since the
      // dialog is about to close.
      while (scraps >= CREW_QUARTERS_UPGRADE_COST) {
        const upgrade = tryApplyCrewQuartersUpgrade({
          scraps,
          hand,
          slot,
          quarters: crewQuarters,
          patternCounts: patternPlayCounts,
        })
        if (!upgrade) break
        scraps -= CREW_QUARTERS_UPGRADE_COST
        crewQuarters.push({
          pattern: upgrade.pattern,
          fuelPerPlay: CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY,
        })
        totalCrewQuartersBought += 1
        crewQuartersCounts[upgrade.pattern] = (crewQuartersCounts[upgrade.pattern] || 0) + 1
        for (const used of upgrade.crewUsed) {
          const idx = hand.indexOf(used)
          if (idx >= 0) hand.splice(idx, 1)
        }
        drawToLimit()
      }
      if (result.purchased.length === 0) {
        scraps += SKIP_RESEARCH_CONSOLATION
        totalScrapsEarned += SKIP_RESEARCH_CONSOLATION
      }
      // Update hand-size cap if Adrenal Implants was just bought.
      const newHandSize = getHandSizeLimit(slot)
      if (newHandSize > handSize) {
        handSize = newHandSize
        drawToLimit()
      }
    } else {
      scraps += SKIP_RESEARCH_CONSOLATION
      totalScrapsEarned += SKIP_RESEARCH_CONSOLATION
    }
  }

  return {
    sectorsPassed: GATES_PER_RUN,
    finalFuel: fuel,
    finalScraps: scraps,
    won: true,
    totalFuelEarned,
    totalScrapsEarned,
    totalJokersBought,
    totalCrewQuartersBought,
    jokerCategoryCounts,
    crewQuartersCounts,
    slot: slot.slice(),
    crewQuarters: crewQuarters.slice(),
  }
}

// Helpers used by canonical fuel computation.
function sumPatternBonuses(pattern, slot) {
  let s = 0
  for (const j of slot) if (j.patternFuelDelta) s += j.patternFuelDelta(pattern)
  return s
}
function computeFinalMissionFuel(choice, slot, quarters, missionIndexInSector, isLastMission, scraps, runStats) {
  // Recompute fuel from scratch (independent of greedy's estimate) so the
  // commit-side numbers don't depend on whatever `choice.fuel` was.
  let fuelTotal = PATTERN_FUEL[choice.pattern] + sumPatternBonuses(choice.pattern, slot)
  fuelTotal += crewQuartersFuelBonus(quarters, choice.pattern)
  let scrapDelta = 0
  let scrapsLeft = scraps
  const ctx = {
    usedCrew: choice.crewUsed,
    missionIndexInSector,
    isLastMission,
    scraps: scrapsLeft,
    pattern: choice.pattern,
    lastPattern: runStats.lastPattern,
    streakBefore: runStats.lastPattern === choice.pattern ? runStats.streakCount : 0,
    missionsCompletedBefore: runStats.missionsCompleted,
  }
  for (const j of slot) {
    if (j.onMission) {
      const r = j.onMission(ctx) || {}
      if (r.fuelDelta) fuelTotal += r.fuelDelta
      if (r.scrapDelta) {
        if (r.scrapDelta < 0) {
          // Pay only if we can.
          if (scrapsLeft + scrapDelta >= -r.scrapDelta) {
            scrapDelta += r.scrapDelta
          } else {
            // Cannot pay — back out the fuel bonus this trigger added too.
            // (Emergency Reserves is the only one of this shape; if it added
            // 1 fuel, undo it.)
            if (r.fuelDelta) fuelTotal -= r.fuelDelta
          }
        } else {
          scrapDelta += r.scrapDelta
        }
      }
    }
  }
  return { fuel: fuelTotal, scrapDelta }
}

// === CLI args =======================================================================
function parseArgs(argv) {
  const out = { runs: 1_000_000, quiet: false, writeMetrics: false }
  for (const arg of argv.slice(2)) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (key === 'runs') out.runs = Number(rawValue)
    if (key === 'quiet') out.quiet = true
    if (key === 'write-metrics') out.writeMetrics = true
  }
  return out
}

// === Aggregation =====================================================================
// Run `runs` simulated runs with the current NO_JOKERS setting and return a
// structured metrics object. Caller is responsible for flipping NO_JOKERS
// between passes when --write-metrics asks for both modes.
function runSimulation(runs) {
  const passedCount = new Array(GATES_PER_RUN + 1).fill(0)
  let cumFinalFuelWon = 0
  let cumScraps = 0
  let cumScrapsWon = 0
  let cumJokersBought = 0
  let cumJokersBoughtWon = 0
  let runsWithAnyJoker = 0
  let runsWithNoJoker = 0
  let winsWithAnyJoker = 0
  let winsWithNoJoker = 0
  let s1WithAnyJoker = 0
  let s1WithNoJoker = 0
  let runsWithAnyJokerCount = 0
  let minWon = Infinity
  let maxWon = -Infinity
  const winnerCategoryTotals = {}
  const winnerJokerIdTotals = {}
  const allRunCategoryTotals = {}
  let cumCrewQuartersBought = 0
  let cumCrewQuartersBoughtWon = 0
  const winnerCrewQuartersTotals = {}

  const t0 = Date.now()
  for (let i = 0; i < runs; i++) {
    const result = simulateRun()
    passedCount[result.sectorsPassed] += 1
    cumScraps += result.totalScrapsEarned
    cumJokersBought += result.totalJokersBought
    cumCrewQuartersBought += result.totalCrewQuartersBought
    for (const [cat, n] of Object.entries(result.jokerCategoryCounts)) {
      allRunCategoryTotals[cat] = (allRunCategoryTotals[cat] || 0) + n
    }
    if (result.totalJokersBought > 0) {
      runsWithAnyJoker++
      runsWithAnyJokerCount += result.totalJokersBought
      if (result.won) winsWithAnyJoker++
      if (result.sectorsPassed >= 1) s1WithAnyJoker++
    } else {
      runsWithNoJoker++
      if (result.won) winsWithNoJoker++
      if (result.sectorsPassed >= 1) s1WithNoJoker++
    }
    if (result.won) {
      cumFinalFuelWon += result.finalFuel
      cumScrapsWon += result.totalScrapsEarned
      cumJokersBoughtWon += result.totalJokersBought
      cumCrewQuartersBoughtWon += result.totalCrewQuartersBought
      if (result.finalFuel < minWon) minWon = result.finalFuel
      if (result.finalFuel > maxWon) maxWon = result.finalFuel
      for (const [cat, n] of Object.entries(result.jokerCategoryCounts)) {
        winnerCategoryTotals[cat] = (winnerCategoryTotals[cat] || 0) + n
      }
      for (const j of result.slot) {
        winnerJokerIdTotals[j.id] = (winnerJokerIdTotals[j.id] || 0) + 1
      }
      for (const q of result.crewQuarters) {
        winnerCrewQuartersTotals[q.pattern] = (winnerCrewQuartersTotals[q.pattern] || 0) + 1
      }
    }
  }
  const elapsedSec = (Date.now() - t0) / 1000

  const reach = new Array(GATES_PER_RUN + 1).fill(0)
  for (let n = 1; n <= GATES_PER_RUN; n++) {
    let count = 0
    for (let p = n - 1; p <= GATES_PER_RUN; p++) count += passedCount[p]
    reach[n] = count
  }
  const won = passedCount[GATES_PER_RUN]

  return {
    mode: NO_JOKERS ? 'no-jokers' : 'jokers-on',
    runs,
    elapsedSec,
    passedCount,
    reach,
    won,
    cumFinalFuelWon,
    cumScraps,
    cumScrapsWon,
    cumJokersBought,
    cumJokersBoughtWon,
    cumCrewQuartersBought,
    cumCrewQuartersBoughtWon,
    runsWithAnyJoker,
    runsWithNoJoker,
    winsWithAnyJoker,
    winsWithNoJoker,
    s1WithAnyJoker,
    s1WithNoJoker,
    runsWithAnyJokerCount,
    minWon: Number.isFinite(minWon) ? minWon : null,
    maxWon: Number.isFinite(maxWon) ? maxWon : null,
    winnerCategoryTotals,
    winnerJokerIdTotals,
    winnerCrewQuartersTotals,
  }
}

// === Console output =================================================================
function printMetrics(metrics, quiet) {
  const { runs, elapsedSec, passedCount, reach, won } = metrics
  const elapsed = elapsedSec.toFixed(2)
  const maxBar = 60
  const fmtPct = (n) => `${(n * 100).toFixed(2).padStart(6)}%`
  const fmtCount = (n) => String(n).padStart(String(runs).length)

  if (quiet) {
    const winRatio = won / runs
    const s1Ratio = reach[1] / runs
    console.log(`gates=[${GATE_COSTS.join(',')}] total=${GATE_COSTS.reduce((a,b)=>a+b,0)} S1=${(s1Ratio*100).toFixed(2)}% win=${(winRatio*100).toFixed(2)}% scraps=${(metrics.cumScraps/runs).toFixed(2)} jokers=${(metrics.cumJokersBought/runs).toFixed(3)} jokers=${NO_JOKERS?'OFF':'ON'}`)
    return
  }

  console.log(`Corebound simulation (joker economy)`)
  console.log(`  jokers   : ${NO_JOKERS ? 'DISABLED (baseline mode)' : 'enabled'}`)
  console.log(`  pool     : ${JOKERS.length} unique parts (no duplicates)`)
  console.log(`  runs     : ${runs.toLocaleString()}  (${elapsed}s)`)
  console.log(`  gates    : [${GATE_COSTS.join(',')}]  total=${GATE_COSTS.reduce((a,b)=>a+b,0)}`)
  console.log(`  start    : ${STARTING_FUEL} fuel, ${STARTING_SCRAPS} scraps, ${startingCrew.length} starting crew, ${cryoCrew.length}-card cryo`)
  console.log(`  per sec  : ${ACTIONS_PER_SECTOR} actions, hand cap ${HAND_SIZE_LIMIT_BASE} (+1 with Adrenal Implants)`)
  console.log()
  console.log('Reached sector N (cumulative):')
  for (let n = 1; n <= GATES_PER_RUN; n++) {
    const ratio = reach[n] / runs
    const bar = '█'.repeat(Math.round(ratio * maxBar))
    console.log(`  S${String(n).padStart(2)}  ${fmtCount(reach[n])}  ${fmtPct(ratio)}  ${bar}`)
  }
  const winRatio = won / runs
  const winBar = '█'.repeat(Math.round(winRatio * maxBar))
  console.log(`  WIN ${fmtCount(won)}  ${fmtPct(winRatio)}  ${winBar}`)
  console.log()
  console.log('Failed at sector N (per-sector dropout):')
  for (let n = 1; n <= GATES_PER_RUN; n++) {
    const count = passedCount[n - 1]
    const ratio = count / runs
    const bar = '▒'.repeat(Math.round(ratio * maxBar * 4))
    console.log(`  S${String(n).padStart(2)}  ${fmtCount(count)}  ${fmtPct(ratio)}  ${bar}`)
  }
  console.log()
  console.log('Economy:')
  console.log(`  Avg scraps earned/run     : ${(metrics.cumScraps / runs).toFixed(2)}`)
  console.log(`  Avg jokers bought/run     : ${(metrics.cumJokersBought / runs).toFixed(3)}`)
  console.log(`  Avg upgrades researched/run : ${(metrics.cumCrewQuartersBought / runs).toFixed(3)}`)
  if (won > 0) {
    console.log(`  Avg scraps earned/win     : ${(metrics.cumScrapsWon / won).toFixed(2)}`)
    console.log(`  Avg jokers bought/win     : ${(metrics.cumJokersBoughtWon / won).toFixed(3)}`)
    console.log(`  Avg upgrades researched/win : ${(metrics.cumCrewQuartersBoughtWon / won).toFixed(3)}`)
    console.log(`  Winners' final-fuel range : ${metrics.minWon} – ${metrics.maxWon}  (avg ${(metrics.cumFinalFuelWon / won).toFixed(2)})`)
  }
  console.log()
  console.log('Joker impact split:')
  console.log(`  Runs with no jokers bought: ${metrics.runsWithNoJoker.toLocaleString()} (${fmtPct(metrics.runsWithNoJoker / runs)})`)
  console.log(`    S1 pass rate: ${metrics.runsWithNoJoker > 0 ? fmtPct(metrics.s1WithNoJoker / metrics.runsWithNoJoker) : 'n/a'}`)
  console.log(`    Win rate    : ${metrics.runsWithNoJoker > 0 ? fmtPct(metrics.winsWithNoJoker / metrics.runsWithNoJoker) : 'n/a'}`)
  console.log(`  Runs with ≥1 joker bought : ${metrics.runsWithAnyJoker.toLocaleString()} (${fmtPct(metrics.runsWithAnyJoker / runs)})`)
  console.log(`    S1 pass rate: ${metrics.runsWithAnyJoker > 0 ? fmtPct(metrics.s1WithAnyJoker / metrics.runsWithAnyJoker) : 'n/a'}`)
  console.log(`    Win rate    : ${metrics.runsWithAnyJoker > 0 ? fmtPct(metrics.winsWithAnyJoker / metrics.runsWithAnyJoker) : 'n/a'}`)
  console.log(`    Avg jokers/run (in this group): ${metrics.runsWithAnyJoker > 0 ? (metrics.runsWithAnyJokerCount / metrics.runsWithAnyJoker).toFixed(3) : 'n/a'}`)
  console.log()
  console.log('Joker category usage in WINNING runs (count of buys, total over all wins):')
  if (won > 0) {
    const cats = Object.entries(metrics.winnerCategoryTotals).sort((a, b) => b[1] - a[1])
    for (const [cat, n] of cats) {
      const perWin = n / won
      console.log(`  ${cat.padEnd(15)} : ${String(n).padStart(8)}  (${perWin.toFixed(3)} per win)`)
    }
  } else {
    console.log('  (no winners)')
  }
  console.log()
  console.log('Crew Quarter Upgrades researched by winners (total stacks held at end of winning runs):')
  if (won > 0) {
    const top = Object.entries(metrics.winnerCrewQuartersTotals).sort((a, b) => b[1] - a[1])
    if (top.length === 0) {
      console.log('  (none — try increasing scrap availability or lowering upgrade costs)')
    }
    for (const [id, n] of top) {
      const perWin = n / won
      console.log(`  ${id.padEnd(28)} : ${String(n).padStart(8)}  (${perWin.toFixed(3)} per win)`)
    }
  }
  console.log()
  console.log('Top jokers held by winners (count of winning runs that ended with this joker in slot):')
  if (won > 0) {
    const top = Object.entries(metrics.winnerJokerIdTotals).sort((a, b) => b[1] - a[1]).slice(0, 25)
    for (const [id, n] of top) {
      const ratio = n / won
      console.log(`  ${id.padEnd(24)} : ${String(n).padStart(8)}  (${(ratio * 100).toFixed(1)}% of wins)`)
    }
  }
}

// === Markdown report ===============================================================
function fmtPercent(ratio) {
  return `${(ratio * 100).toFixed(2)}%`
}

function formatMetricsSection(metrics) {
  const { runs, elapsedSec, reach, passedCount, won } = metrics
  const lines = []
  lines.push(`- Runs: ${runs.toLocaleString()} (${elapsedSec.toFixed(2)}s)`)
  lines.push(`- **Win rate: ${fmtPercent(won / runs)}** (${won.toLocaleString()} wins)`)
  lines.push('')
  lines.push('### Sector reach (cumulative)')
  lines.push('')
  lines.push('| Sector | Reached | Pct |')
  lines.push('|--------|---------|-----|')
  for (let n = 1; n <= GATES_PER_RUN; n++) {
    lines.push(`| S${n} | ${reach[n].toLocaleString()} | ${fmtPercent(reach[n] / runs)} |`)
  }
  lines.push(`| WIN | ${won.toLocaleString()} | ${fmtPercent(won / runs)} |`)
  lines.push('')
  lines.push('### Per-sector dropout')
  lines.push('')
  lines.push('| Sector | Failed | Pct |')
  lines.push('|--------|--------|-----|')
  for (let n = 1; n <= GATES_PER_RUN; n++) {
    const count = passedCount[n - 1]
    lines.push(`| S${n} | ${count.toLocaleString()} | ${fmtPercent(count / runs)} |`)
  }
  lines.push('')
  lines.push('### Economy')
  lines.push('')
  lines.push(`- Avg scraps earned/run: ${(metrics.cumScraps / runs).toFixed(2)}`)
  lines.push(`- Avg ship parts bought/run: ${(metrics.cumJokersBought / runs).toFixed(3)}`)
  lines.push(`- Avg crew quarter upgrades researched/run: ${(metrics.cumCrewQuartersBought / runs).toFixed(3)}`)
  if (won > 0) {
    lines.push(`- Avg scraps earned/win: ${(metrics.cumScrapsWon / won).toFixed(2)}`)
    lines.push(`- Avg ship parts bought/win: ${(metrics.cumJokersBoughtWon / won).toFixed(3)}`)
    lines.push(`- Avg crew quarter upgrades researched/win: ${(metrics.cumCrewQuartersBoughtWon / won).toFixed(3)}`)
    lines.push(`- Winners' final-fuel range: ${metrics.minWon} – ${metrics.maxWon} (avg ${(metrics.cumFinalFuelWon / won).toFixed(2)})`)
  }
  if (won > 0) {
    lines.push('')
    lines.push('### Crew Quarter Upgrades researched by winners')
    lines.push('')
    lines.push('| Upgrade | Total stacks | Per win |')
    lines.push('|----------|--------------|---------|')
    const sorted = Object.entries(metrics.winnerCrewQuartersTotals).sort((a, b) => b[1] - a[1])
    for (const [id, n] of sorted) {
      lines.push(`| ${id} | ${n.toLocaleString()} | ${(n / won).toFixed(3)} |`)
    }
    lines.push('')
    lines.push('### Top ship parts held by winners')
    lines.push('')
    lines.push('| Ship Part | Wins held | Pct of wins |')
    lines.push('|-----------|-----------|-------------|')
    const top = Object.entries(metrics.winnerJokerIdTotals).sort((a, b) => b[1] - a[1])
    for (const [id, n] of top) {
      lines.push(`| ${id} | ${n.toLocaleString()} | ${fmtPercent(n / won)} |`)
    }
  }
  return lines.join('\n')
}

function formatMetricsReport(metricsOn, metricsOff) {
  const today = new Date().toISOString().slice(0, 10)
  const sections = [
    '# Simulation Metrics',
    '',
    'Latest snapshot of `scripts/simulate.mjs`. Re-generate with `pnpm sim:metrics` after touching any source-of-truth file (gate ramp, ship part catalog, crew quarter upgrade catalog, scrap economy, crew rosters). Commit the updated file alongside the gameplay change so the snapshot stays in sync.',
    '',
    `- Generated: ${today}`,
    `- Gate ramp: \`[${GATE_COSTS.join(', ')}]\` (total ${GATE_COSTS.reduce((a, b) => a + b, 0)})`,
    `- Ship parts catalog: ${JOKERS.length} unique`,
    `- Crew quarters upgrade: 1 generic card, ${CREW_QUARTERS_UPGRADE_COST} Scraps, +${CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY} Fuel/play (any pattern)`,
    '',
    '## Target metrics (do not regress)',
    '',
    '| Metric | Target |',
    '|--------|--------|',
    '| Win rate, jokers ON | 1.5 – 2.5% |',
    '| Win rate, jokers OFF (`NO_JOKERS=1`) | 0% |',
    '| S1 pass rate (deterministic) | 100% |',
    '| S4 reach, jokers OFF (S3 wall) | < 1% |',
    '| Avg crew quarter upgrades researched per winning run | 10 – 16 |',
    '| Avg ship parts bought per winning run | ≈ 10 (5 in slot after replacement) |',
    '',
    '## Jokers ON',
    '',
    formatMetricsSection(metricsOn),
    '',
    '## Jokers OFF (`NO_JOKERS=1`)',
    '',
    formatMetricsSection(metricsOff),
    '',
  ]
  return sections.join('\n')
}

// === Main ===========================================================================
const args = parseArgs(process.argv)
if (!Number.isFinite(args.runs) || args.runs <= 0) {
  console.error(`Invalid --runs=${args.runs}`)
  process.exit(1)
}

const userSetNoJokers = NO_JOKERS

if (args.writeMetrics) {
  // Run both passes regardless of NO_JOKERS env so the snapshot is complete.
  NO_JOKERS = false
  const metricsOn = runSimulation(args.runs)
  printMetrics(metricsOn, args.quiet)
  console.log()
  console.log('--- baseline pass (NO_JOKERS=1) ---')
  console.log()
  NO_JOKERS = true
  const metricsOff = runSimulation(args.runs)
  printMetrics(metricsOff, args.quiet)
  NO_JOKERS = userSetNoJokers

  const report = formatMetricsReport(metricsOn, metricsOff)
  const url = new URL('./sim-metrics.md', import.meta.url)
  const fs = await import('node:fs')
  fs.writeFileSync(url, report)
  console.log()
  console.log(`Wrote metrics snapshot to ${url.pathname}`)
} else {
  const metrics = runSimulation(args.runs)
  printMetrics(metrics, args.quiet)
}

/* === TUNING NOTES =================================================================
 *
 * Catalog: 20 unique ship parts + 7 stackable Crew Quarter Upgrades. Each ship
 * part can be bought at most once per run; the research pool removes a
 * part once it's purchased. Crew Quarter Upgrades are NEVER removed — duplicates
 * stack pattern fuel bonuses. The shop draws 2 ship parts plus Upgrade Crew
 * Quarters after each gate.
 *
 * Ship Part categories (count): icon (4), pattern (2), first-mission (2),
 *   last-mission (1), scrap (4), converter (3), hand (1), wild (1),
 *   special (2). Total = 20.
 *
 * The 5 pattern-specific ship parts that previously lived here
 * (Specialist Gauntlets, Cluster Dynamo, Common Cause Banner, Bridge
 * Uplink, Pattern Ladder) were extracted into the Crew Quarter Upgrade catalog
 * so players can research the same pattern repeatedly. Each pattern has
 * its own Crew Quarter Upgrade: Cross-Training / Common Ground (cost 4),
 * Specialist / Common Knowledge (cost 5), Department Heads / Common Cause
 * (cost 6), Bridge Crew (cost 8, +2 fuel/play — keeps the original +3
 * power on a stackable ramp). Costs are cheap so winners can stack 5-8
 * upgrades; the gate ramp is tightened to keep win rate at 1.5-2.5%.
 *
 * 1M-run results with the current tuning (gate ramp 219, upgrade costs
 * 4-8):
 *   S1 = 100.00% pass, S2 = 100.00% pass
 *   S3 reach = 93.8% (S3 wall: 62% dropout)
 *   S4 reach = 31.5%, S5 = 19.7%, S6 = 14.4%
 *   S7 reach = 11.1%, S8 = 7.8%, S9 = 5.1%, S10 = 3.4%
 *   Win = 2.17% jokers ON, 0% jokers OFF
 *   Avg jokers bought/win    = 10.2 (5 in slot due to replacement)
 *   Avg upgrades researched/win = 5.5 (spread across cheap common patterns)
 *   Upgrade distribution (per win): common-ground 2.08, cross-training
 *     1.21, common-knowledge 0.79, specialist 0.70, common-cause 0.33,
 *     department-heads 0.32, bridge-crew 0.06 — players invest in the
 *     less-rare compositions that trigger most often.
 *   Top jokers held by winners: compounding-drive (96%+), crew-synergy
 *     (~80%), adrenal-implants (~60%), fuel-cell-distillery (~55%),
 *     veterans-insignia (~50%).
 *
 * No-jokers (NO_JOKERS=1) baseline on the same ramp:
 *   S3 reach = 85.7%, S4 reach = 0.12%, Win = 0% — confirms the design
 *   intent that a player who never buys ship parts AND never researches
 *   crew quarter upgrades cannot pass Sector 3.
 *
 * --- Quadrupled, icon-balanced cryo (current build) ---
 *
 * The cryo deck has 40 cards across 10 unique blueprints with copy
 * counts tuned for exact icon balance: Juno/Priya ×5, Oren/Malik ×3,
 * the rest ×4. The 45-card roster is exactly E=L=N=S=16. Singles still
 * outnumber doubles (26:14 in cryo, 26:19 overall) and cannot satisfy
 * Specialist / Cross-Trained / Department Heads / Bridge Crew. Mara/Sana
 * (the only E/L matched specialists) are still 1 of 45 cards each, so
 * high-tier specialist patterns land less often than the 15-card roster.
 *
 * 1M-run results with ramp [8,8,9,10,12,17,21,25,29,32]:
 *   S1 = 100.00% pass (deterministic — gate cost 8 ≤ greedy earnings)
 *   Win = 4.5% jokers ON, 0% jokers OFF
 *   Dropout: S2 2.3%, S3 7.1%, S4 8.0%, S5 10.3%, S6 17.7%, S7 16.6%,
 *            S8 17.0%, S9 11.0%, S10 ~5.5%
 *
 * --- Pre-singles results (historical, 12-card roster) ---
 *
 * --- Historical joker-mode sweep on the old 12-card roster, total ≈ 161 ---
 *
 *   total=160 [10,11,12,13,14,16,17,20,22,25]   win≈6.12%   too easy
 *   total=160 [10,11,12,13,14,16,18,20,22,24]   win≈6.09%   too easy
 *   total=160 [10,11,12,13,15,16,17,19,22,25]   win≈5.84%   slightly hot
 *   total=161 [10,11,12,13,15,16,18,20,22,24]   win≈4.74%   late spike S7-S9
 *   total=161 [10,11,12,13,14,16,18,20,22,25]   win≈4.79%   smoother
 *   total=161 [10,11,12,13,15,16,17,20,22,25]   win≈4.75%   smoother
 *   total=161 [10,11,12,13,15,16,18,19,22,25]   win≈4.79%   smoother
 *   total=161 [10,11,12,13,15,17,18,19,22,24]   win≈4.83%  ← JOKER PICK
 *   total=161 [10,11,12,13,15,17,18,19,21,25]   win≈4.78%   slight kink S9→S10
 *   total=161 [10,11,12,13,15,16,18,19,21,26]   win≈4.84%   spike at S10
 *   total=162 [10,11,12,13,15,16,18,20,22,25]   win≈3.62%   too hard
 *   total=162 [10,11,12,14,15,16,18,19,22,25]   win≈3.75%   too hard, choke at S4
 *   total=163 [10,12,13,14,15,16,18,19,22,24]   win≈2.76%   choke at S2 kills scraps
 *
 * Picked ramp [10,11,12,13,15,17,18,19,22,24] total=161 → 4.77% win @1M
 * with the smoothest dropout shape:
 *
 *   S1 pass : 100.00%   (deterministic at cost 10)
 *   Dropout : S2 4.21%, S3 3.70%, S4 2.48%, S5 5.68%, S6 10.11%,
 *             S7 16.91%, S8 19.10%, S9 20.66%, S10 12.37%
 *   Avg scraps earned/run : 73.82 (104.42 in winners)
 *   Avg jokers bought/run : 8.26  (10.52 in winners)
 *   Winners' final fuel   : 0 – 28 (avg 3.20)
 *
 *   S1=100% is accepted (per Phase 2 instruction — fuel is deterministic
 *   in S1 with these rewards). Dropouts are monotonically increasing
 *   S5→S9, then drop at S10 (the last gate is 24, which gives a final
 *   fuel buffer-eating bite to runs that managed to reach it).
 *
 * --- No-jokers baseline on the same ramp (1M runs) ---
 *
 *   gates=[10,11,12,13,15,17,18,19,22,24]  S1=100%  win=0.00%
 *   Avg scraps earned/run : 32.58 (greedy + interest only)
 *
 *   Confirms the design intent: a player who never buys jokers cannot
 *   beat the joker-on ramp. Jokers are ~25 net fuel of head-room across
 *   10 gates, exactly the gap between baseline 114-total and joker-on
 *   161-total ramps.
 *
 * --- Joker impact analysis (winners only, 1M runs) ---
 *
 * Buy frequency by category (per win, includes purchases that were
 * later replaced via stacking-discard):
 *
 *   pattern         2.24 / win   most-bought (6 unique parts in pool)
 *   converter       1.73 / win   3 parts; high-cost late-game
 *   icon            1.66 / win   4 cheap parts; nearly always seen
 *   last-mission    1.13 / win
 *   special         0.96 / win   sector-engine + veterans-insignia
 *   first-mission   0.88 / win
 *   hand            0.65 / win   (only Adrenal Implants, cost 8)
 *   wild            0.48 / win   (only Tachyon Lens, cost 9)
 *   scrap           0.44 / win   2 parts; late-game replacement targets
 *   interest        0.37 / win   2 parts; modest impact
 *
 * Final-slot occupancy in winners (top of slot at end of run):
 *
 *   fuel-cell-distillery  83.6%   dominant scrap→fuel converter
 *   adrenal-implants      65.3%   hand-size +1
 *   final-burn            57.5%   +2 fuel last mission
 *   common-cause-banner   53.7%   pattern +1 fuel
 *   veterans-insignia     53.3%   sector-10 +3 fuel
 *   tachyon-lens          47.7%   wild crew
 *   scrap-forge           42.5%   scrap→fuel mini converter
 *   bridge-uplink         42.3%   pattern +2 fuel
 *   sector-engine         33.3%   periodic +2 fuel
 *
 * The replacement rule (offer.cost > slot.cost ⇒ replace cheapest) means
 * cheap parts get displaced as the player accumulates wealth. Examples
 * (rarely in final slot but bought somewhere mid-run):
 *
 *   preflight-tune-up      6.3%
 *   emergency-reserves     4.4%
 *   specialist-gauntlets   3.5%
 *   cluster-dynamo         3.4%
 *   auction-house          1.6%
 *   compound-interest      1.4%
 *   ablative-plating       <0.1%   ← cost 4, almost always replaced
 *   cross-brace-couplers   <0.1%
 *   crew-stim-packs        <0.1%
 *   quartermaster          <0.1%
 *   salvage-sifter         <0.1%
 *   ration-optimizer       <0.1%
 *
 * --- Concerns / no-ops / dominance flags ---
 *
 *   - Fuel Cell Distillery (cost 8) appears in 83.6% of winning slots.
 *     End-of-sector "spend 4 scraps for +2 fuel" is +20 fuel across 10
 *     sectors if perfectly affordable, which it usually is in the late
 *     game. If this feels too dominant, raise its cost to 9 or lower
 *     its yield to +1 fuel for 3 scraps.
 *
 *   - The greedy heuristic for slot replacement (offer.cost > cheapest
 *     slot.cost) means low-cost parts are systematically displaced and
 *     contribute nothing late-game. In play, a smarter buyer keeps high-
 *     yield-per-cost parts (e.g., Salvage Sifter is +1 scrap/mission =
 *     10 scraps/run = ~3 jokers' worth for cost 4). The sim under-rates
 *     the cheap scrap/economy parts. If you want to see them more often
 *     in winning slots, change the replacement rule to compare expected
 *     net effect, not raw cost.
 *
 *   - Salvage Sifter's +1 scrap/mission ≈ +30 scraps over a run is huge,
 *     but the sim never holds it past sector 5 because cost-3-tier
 *     replacements always look better to the heuristic.
 *
 *   - Ablative Plating (last-mission +1 fuel, cost 4) is dominated by
 *     Final Burn (last-mission +2 fuel, cost 6). The sim never keeps the
 *     cheaper one. This is intentional — both exist as a "ladder" so
 *     the player has a low-cost early buy and a higher-impact late buy.
 *
 *   - Compound Interest (threshold 4→3) and Auction House (cap 3→4)
 *     each contribute roughly +3 scraps/run. They show up in only 1.4%
 *     and 1.6% of winning slots respectively — the heuristic treats
 *     their stat-modifier effect as low-impact and replaces them.
 *
 *   - Tachyon Lens (wild crew on slot 0 = Lei [L,N]) lifts Bridge-Crew
 *     and Department-Heads pattern hit rates because Lei normally
 *     can't fill the matched-icon role. Owners see ~1 extra fuel/sector
 *     average. It appears in 47.7% of winning slots.
 *
 *   - Adrenal Implants (+1 hand size) modestly improves pattern
 *     selection; the marginal gain is ~0.4 fuel/sector but the slot
 *     stickiness (cost 8 = expensive replacement target) keeps it in
 *     65% of winning slots regardless.
 *
 *   - Mission Skipper / Cryo Recycler / Overclocked Reactor from the
 *     previous catalog have been removed. Remaining "approximations":
 *       * Adrenal Implants is modeled as a hand-size cap delta, which
 *         is exact but in the sim the greedy never has trouble finding
 *         patterns at hand size 5 — so its real fuel impact is small.
 *       * Tachyon Lens deterministically marks Lei (slot 0) as wild;
 *         if the live game lets the player choose, the sim under-rates
 *         it slightly.
 *       * Once-per-sector converters (Scrap Forge, Fuel Cell Distillery,
 *         Emergency Reserves) auto-fire when affordable. A real player
 *         might decline if scraps are needed for a research buy; the
 *         sim doesn't model that decision.
 *
 * --- How to re-sweep ---
 *
 *   Edit the JOKERS / CREW_QUARTERS_UPGRADE_COST / GATE_COSTS arrays above, then:
 *     pnpm sim                                   # 1M runs default
 *     GATE_TUNING=8,9,16,17,21,24,27,31,34,38 \
 *       node scripts/simulate.mjs --runs=1000000
 *     NO_JOKERS=1 node scripts/simulate.mjs      # baseline check
 *
 *   Target metrics (current Ship Parts + Crew Quarter Upgrades economy):
 *     - Win rate jokers-on   ≈ 1.5-2.5%
 *     - Win rate no-jokers   = 0% on the same ramp
 *     - S1 pass = 100% (accepted; fuel is deterministic at S1)
 *     - S3 wall: < 1% of no-joker runs reach Sector 4
 *     - Avg crew quarter upgrades/win in 5-8 range — winners actively use the
 *       Crew Quarter Upgrade axis, not just Ship Parts.
 *     - Upgrade distribution skews toward the cheap common patterns
 *       (common-ground, cross-training, common-knowledge).
 *     - Per-sector dropout   monotonically rising S5→S9
 */
