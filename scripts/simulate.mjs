#!/usr/bin/env node
/*
  Corebound game simulation.

  Models the current open-mission economy:
    - 5 starting crew + 7 cryo crew, tired resets at each sector start.
    - 3 mission actions per sector, each consumes 1 placeholder mission card.
    - Per action: pick the highest-fuel hand pattern the ready crew satisfies,
      use the minimum crew needed for that pattern, draw 1 cryo (until empty).
    - Pass the sector gate (9/26/56) using accumulated fuel.
    - 10 sectors per run.

  Design data mirrored here. When the game changes, update the constants
  below to match the source files referenced in each section.

  Run:
    pnpm sim
    pnpm sim --runs=1000000
    pnpm sim --strategy=cautious
*/

// === Crew deck — mirror src/game/blueprints/crewDecks.ts ============================
// Each crew is [icon0, icon1] with icons drawn from {E, L, N, S}.
const startingCrew = [
  ['L', 'N'], // Lei Watanabe — Pilot
  ['E', 'E'], // Mara Voss     — Engineer (Specialist)
  ['E', 'S'], // Ada Chen      — Scientist
  ['L', 'L'], // Sana Iqbal    — Medic (Specialist)
  ['S', 'N'], // Nia Okonkwo   — Recon
]
const cryoCrew = [
  ['E', 'N'], // Juno Pike     — Helmsman
  ['E', 'L'], // Tomas Hale    — Mechanic
  ['L', 'E'], // Priya Shah    — Mechanic
  ['L', 'S'], // Elise Tan     — Doctor
  ['N', 'S'], // Ilya Rao      — Recon
  ['S', 'S'], // Oren Vale     — Operator (Specialist)
  ['N', 'N'], // Malik Ortega  — Pilot (Specialist)
]

// === Hand patterns — mirror src/game/rules.ts (PATTERN_FUEL_DESC) ===================
// Patterns ranked by fuel reward, ties broken by min-crew efficiency.
const PATTERN_FUEL = {
  'bridge-crew':       16,
  'common-cause':       8,
  'department-heads':   5,
  'common-knowledge':   3,
  'specialist':         2,
  'cross-trained':      1,
  'common-ground':      1,
}
const PATTERN_ORDER = [
  'bridge-crew',       // 16, uses 4 specialists
  'common-cause',      //  8, uses 4 sharing one icon
  'department-heads',  //  5, uses 2 specialists with different icons
  'common-knowledge',  //  3, uses 3 sharing one icon
  'specialist',        //  2, uses 1 matched specialist
  'cross-trained',     //  1, uses 1 mixed-icon crew
  'common-ground',     //  1, uses 2 sharing one icon (last resort)
]

// === Gate deck — mirror src/game/blueprints/sectorGates.ts ==========================
// 10 fixed gates with monotonically increasing cost. createGateDeckCards
// shuffles + sorts but the shuffle is a no-op for 10 cards.
const GATE_COSTS = [9, 12, 15, 18, 22, 26, 30, 34, 38, 46]
const GATES_PER_RUN = 10  // mirror TOTAL_SECTORS in src/game/setup.ts

// === Run-time constants — mirror src/game/economyTuning.ts + src/game/setup.ts ======
const STARTING_FUEL = 0   // STARTING_FUEL_SUPPLY
const ACTIONS_PER_SECTOR = 3
const MAP_SLOT_COUNT = 3

// === Helpers ========================================================================
const ICONS = ['E', 'L', 'N', 'S']
const isMatched = (c) => c[0] === c[1]
const isMixed = (c) => c[0] !== c[1]
const sharesIcon = (a, b) =>
  a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]

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

function findPattern(ready, pattern) {
  if (pattern === 'bridge-crew') {
    const specs = ready.filter(isMatched)
    const seen = new Set()
    const picked = []
    for (const c of specs) {
      if (!seen.has(c[0])) {
        seen.add(c[0])
        picked.push(c)
        if (picked.length === 4) break
      }
    }
    return seen.size === 4 ? { fuel: 16, crewUsed: picked } : null
  }
  if (pattern === 'common-cause') {
    for (const icon of ICONS) {
      const m = ready.filter((c) => c[0] === icon || c[1] === icon)
      if (m.length >= 4) return { fuel: 8, crewUsed: m.slice(0, 4) }
    }
    return null
  }
  if (pattern === 'department-heads') {
    const specs = ready.filter(isMatched)
    const seen = new Set()
    const picked = []
    for (const c of specs) {
      if (!seen.has(c[0])) {
        seen.add(c[0])
        picked.push(c)
        if (picked.length === 2) return { fuel: 5, crewUsed: picked }
      }
    }
    return picked.length === 2 ? { fuel: 5, crewUsed: picked } : null
  }
  if (pattern === 'common-knowledge') {
    for (const icon of ICONS) {
      const m = ready.filter((c) => c[0] === icon || c[1] === icon)
      if (m.length >= 3) return { fuel: 3, crewUsed: m.slice(0, 3) }
    }
    return null
  }
  if (pattern === 'specialist') {
    const c = ready.find(isMatched)
    return c ? { fuel: 2, crewUsed: [c] } : null
  }
  if (pattern === 'cross-trained') {
    const c = ready.find(isMixed)
    return c ? { fuel: 1, crewUsed: [c] } : null
  }
  if (pattern === 'common-ground') {
    for (let i = 0; i < ready.length; i++) {
      for (let j = i + 1; j < ready.length; j++) {
        if (sharesIcon(ready[i], ready[j])) {
          return { fuel: 1, crewUsed: [ready[i], ready[j]] }
        }
      }
    }
    return null
  }
  return null
}

function pickGreedyAction(ready) {
  for (const pattern of PATTERN_ORDER) {
    const result = findPattern(ready, pattern)
    if (result) return { pattern, ...result }
  }
  return null
}

function pickCautiousAction(ready) {
  // Lowest-fuel pattern that resolves; falls back to anything if forced.
  for (const pattern of [...PATTERN_ORDER].reverse()) {
    const result = findPattern(ready, pattern)
    if (result) return { pattern, ...result }
  }
  return null
}

function buildGatePool() {
  return GATE_COSTS.map((cost) => ({ cost }))
}

function pickRunGates() {
  return shuffle(buildGatePool()).slice(0, GATES_PER_RUN).sort((a, b) => a.cost - b.cost)
}

function simulateRun(strategy) {
  const cryoOrder = shuffle(cryoCrew)
  const gates = pickRunGates()
  const pickAction = strategy === 'cautious' ? pickCautiousAction : pickGreedyAction

  let cryoIndex = 0
  let allCrew = [...startingCrew]
  let fuel = STARTING_FUEL

  for (let s = 0; s < GATES_PER_RUN; s++) {
    let ready = [...allCrew] // tired resets each sector start

    for (let action = 0; action < ACTIONS_PER_SECTOR; action++) {
      const choice = pickAction(ready)
      if (!choice) break
      fuel += choice.fuel
      // remove crew used
      for (const used of choice.crewUsed) {
        const idx = ready.indexOf(used)
        if (idx >= 0) ready.splice(idx, 1)
      }
      // cryo draw (per-action) — adds to ready and to allCrew for next sector
      if (cryoIndex < cryoOrder.length) {
        const drawn = cryoOrder[cryoIndex++]
        allCrew.push(drawn)
        ready.push(drawn)
      }
    }

    if (fuel < gates[s].cost) {
      return { sectorsPassed: s, finalFuel: fuel, won: false }
    }
    fuel -= gates[s].cost
  }
  return { sectorsPassed: GATES_PER_RUN, finalFuel: fuel, won: true }
}

// === CLI args =======================================================================
function parseArgs(argv) {
  const out = { runs: 1_000_000, strategy: 'greedy' }
  for (const arg of argv.slice(2)) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (key === 'runs') out.runs = Number(rawValue)
    if (key === 'strategy') out.strategy = rawValue
  }
  return out
}

// === Main ===========================================================================
const { runs, strategy } = parseArgs(process.argv)
if (!Number.isFinite(runs) || runs <= 0) {
  console.error(`Invalid --runs=${runs}`)
  process.exit(1)
}
if (strategy !== 'greedy' && strategy !== 'cautious') {
  console.error(`Invalid --strategy=${strategy} (use greedy or cautious)`)
  process.exit(1)
}

const passedCount = new Array(GATES_PER_RUN + 1).fill(0)
const finalFuelByOutcome = []
let cumFinalFuelWon = 0
let minWon = Infinity
let maxWon = -Infinity

const t0 = Date.now()
for (let i = 0; i < runs; i++) {
  const result = simulateRun(strategy)
  passedCount[result.sectorsPassed] += 1
  if (result.won) {
    cumFinalFuelWon += result.finalFuel
    if (result.finalFuel < minWon) minWon = result.finalFuel
    if (result.finalFuel > maxWon) maxWon = result.finalFuel
  }
}
const elapsed = ((Date.now() - t0) / 1000).toFixed(2)

const reach = new Array(GATES_PER_RUN + 1).fill(0)
for (let n = 1; n <= GATES_PER_RUN; n++) {
  let count = 0
  for (let p = n - 1; p <= GATES_PER_RUN; p++) count += passedCount[p]
  reach[n] = count
}
const won = passedCount[GATES_PER_RUN]

const maxBar = 60
const fmtPct = (n) => `${(n * 100).toFixed(2).padStart(6)}%`
const fmtCount = (n) => String(n).padStart(String(runs).length)

console.log(`Corebound simulation`)
console.log(`  strategy : ${strategy}`)
console.log(`  runs     : ${runs.toLocaleString()}  (${elapsed}s)`)
console.log(`  gates    : 23 unique costs ${GATE_COSTS[0]}–${GATE_COSTS[GATE_COSTS.length - 1]}, pick 10 sorted ascending`)
console.log(`  start    : ${STARTING_FUEL} fuel, ${startingCrew.length} starting crew, ${cryoCrew.length}-card cryo`)
console.log(`  per sec  : ${ACTIONS_PER_SECTOR} actions, tired resets at sector start`)
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
if (won > 0) {
  console.log()
  console.log(`Winners' final-fuel range: ${minWon} – ${maxWon}  (avg ${(cumFinalFuelWon / won).toFixed(2)})`)
}
