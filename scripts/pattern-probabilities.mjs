#!/usr/bin/env node
/*
  Monte Carlo: draw 1M random 5-card hands from the live 45-crew deck and
  count which patterns are satisfiable. Also distinguishes between the
  CURRENT Common Ground rule (any 2 share 1 icon) and the PROPOSED rules
  (set-2 intersection, multiset-2 intersection). Same for Cross-Trained
  (current: 1 mixed crew; proposed: 2 mixed crew).

  Use the output to choose fuel rewards inversely proportional to trigger
  rates so each pattern has roughly equal expected fuel per action.
*/

const startingCrew = [
  ['L', 'N'], // Lei
  ['E', 'E'], // Mara
  ['E', 'S'], // Ada
  ['L', 'L'], // Sana
  ['S', 'N'], // Nia
]
const crewDeckTemplateCopies = [
  { spec: ['E'],      copies: 5 }, // Juno
  { spec: ['L'],      copies: 5 }, // Priya
  { spec: ['N'],      copies: 4 }, // Ilya
  { spec: ['N'],      copies: 4 }, // Kade
  { spec: ['S'],      copies: 4 }, // Beni
  { spec: ['S'],      copies: 4 }, // Vera
  { spec: ['E', 'L'], copies: 4 }, // Calla
  { spec: ['E', 'L'], copies: 4 }, // Davin
  { spec: ['S', 'S'], copies: 3 }, // Oren
  { spec: ['N', 'N'], copies: 3 }, // Malik
]
const crewDeckCards = crewDeckTemplateCopies.flatMap(
  ({ spec, copies }) => Array.from({ length: copies }, () => spec.slice()),
)
const DECK = [...startingCrew, ...crewDeckCards]
const ICONS = ['E', 'L', 'N', 'S']

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

function isMatched(c) {
  return c.length === 2 && c[0] === c[1]
}
function isMixed(c) {
  return c.length === 2 && c[0] !== c[1]
}
function hasIcon(c, icon) {
  return c.includes(icon)
}
function sharesIcon(a, b) {
  return a.some((icon) => b.includes(icon))
}

// Multiset intersection size — counts repeated specs.
function multisetIntersectionSize(a, b) {
  const ac = {}
  for (const x of a) ac[x] = (ac[x] || 0) + 1
  let n = 0
  for (const x of b) {
    if (ac[x] > 0) {
      n += 1
      ac[x] -= 1
    }
  }
  return n
}
// Set intersection size — distinct shared icons.
function setIntersectionSize(a, b) {
  const aset = new Set(a)
  let n = 0
  const counted = new Set()
  for (const x of b) {
    if (aset.has(x) && !counted.has(x)) {
      counted.add(x)
      n += 1
    }
  }
  return n
}

// Check satisfiability of every pattern under various rule variants.
function checkPatterns(hand) {
  const r = {}
  // Cross-Trained current: any 1 mixed crew.
  r.cross_trained_current = hand.some(isMixed)
  // Cross-Trained proposed: ≥2 mixed crew.
  r.cross_trained_strict = hand.filter(isMixed).length >= 2

  // Common Ground current: any pair sharing ≥1 icon.
  r.common_ground_current = false
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (sharesIcon(hand[i], hand[j])) { r.common_ground_current = true; break }
    }
    if (r.common_ground_current) break
  }
  // Common Ground set-2: any pair with set intersection ≥ 2.
  r.common_ground_set2 = false
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (setIntersectionSize(hand[i], hand[j]) >= 2) { r.common_ground_set2 = true; break }
    }
    if (r.common_ground_set2) break
  }
  // Common Ground multiset-2: any pair with multiset intersection ≥ 2.
  r.common_ground_multi2 = false
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (multisetIntersectionSize(hand[i], hand[j]) >= 2) { r.common_ground_multi2 = true; break }
    }
    if (r.common_ground_multi2) break
  }

  // Specialist: any matched single.
  r.specialist = hand.some(isMatched)
  // Common Knowledge: 3+ crew sharing one icon.
  r.common_knowledge = ICONS.some((icon) => hand.filter((c) => hasIcon(c, icon)).length >= 3)
  // Department Heads: 2+ matched specialists with distinct icons.
  const matchedIcons = new Set(hand.filter(isMatched).map((c) => c[0]))
  r.department_heads = matchedIcons.size >= 2
  r.bridge_crew = matchedIcons.size >= 4
  // Common Cause: 4+ crew sharing one icon.
  r.common_cause = ICONS.some((icon) => hand.filter((c) => hasIcon(c, icon)).length >= 4)

  return r
}

const RUNS = Number(process.argv[2]) || 1_000_000
const HAND_SIZE = 5
const counts = {}

for (let i = 0; i < RUNS; i++) {
  const drawn = shuffle(DECK).slice(0, HAND_SIZE)
  const r = checkPatterns(drawn)
  for (const [k, v] of Object.entries(r)) {
    counts[k] = (counts[k] || 0) + (v ? 1 : 0)
  }
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
const colWidth = 24
console.log(`Pattern trigger rates over ${RUNS.toLocaleString()} random ${HAND_SIZE}-card draws from ${DECK.length}-card deck:`)
console.log()
console.log(`  ${'pattern'.padEnd(colWidth)}  triggers   rate     1/rate`)
console.log(`  ${'-'.repeat(colWidth)}  --------   ------   ------`)
for (const [k, n] of sorted) {
  const rate = n / RUNS
  const inverse = rate > 0 ? (1 / rate).toFixed(2) : '∞'
  console.log(`  ${k.padEnd(colWidth)}  ${String(n).padStart(7)}  ${(rate * 100).toFixed(2).padStart(6)}%  ${String(inverse).padStart(6)}`)
}
console.log()
console.log('Suggested fuel scaling (so expected fuel/action = ~0.6-1.0):')
console.log('  fuel ≈ round(0.8 / rate) capped at base-fuel sensible ranges')
for (const [k, n] of sorted) {
  const rate = n / RUNS
  if (rate <= 0) continue
  const suggested = Math.max(1, Math.round(0.8 / rate))
  console.log(`  ${k.padEnd(colWidth)}  ${(rate * 100).toFixed(2).padStart(6)}%  → ${suggested} fuel  (EV=${(rate * suggested).toFixed(2)})`)
}
