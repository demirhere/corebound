import type { CrewQuartersBlueprint } from './types'

// 7 unique Crew Quarters, one per crew composition pattern (excluding the
// generic "open" mission). Unlike Ship Parts, Crew Quarters are NOT placed
// on the board and the same blueprint can be researched multiple times —
// every purchase stacks its fuel bonus on every matching pattern play.
//
// Costs are calibrated against the sim's 215-fuel ramp: investing 12-16
// Scraps in a single crew composition is a meaningful long-game choice
// (a Common-Knowledge Quarters at cost 12 typically pays back ~6-10 Fuel
// across a winning run). Stacking is intentionally expensive so the
// player can't trivially buy every offer — they have to pick patterns
// greedy actually plays and reinforce those.
//
// Mirrored in `scripts/simulate.mjs` (the CREW_QUARTERS array). Update
// both in lockstep when tuning.
export const crewQuartersCatalog: readonly CrewQuartersBlueprint[] = [
  {
    id: 'cross-training-quarters',
    label: 'Cross-Training Quarters',
    description: '+1 Fuel each Cross-Trained mission. Researchable multiple times.',
    cost: 12,
    pattern: 'cross-trained',
    fuelPerPlay: 1,
  },
  {
    id: 'common-ground-quarters',
    label: 'Common Ground Quarters',
    description: '+1 Fuel each Common Ground mission. Researchable multiple times.',
    cost: 12,
    pattern: 'common-ground',
    fuelPerPlay: 1,
  },
  {
    id: 'specialist-quarters',
    label: 'Specialist Quarters',
    description: '+1 Fuel each Specialist mission. Researchable multiple times.',
    cost: 12,
    pattern: 'specialist',
    fuelPerPlay: 1,
  },
  {
    id: 'common-knowledge-quarters',
    label: 'Common Knowledge Quarters',
    description: '+1 Fuel each Common Knowledge mission. Researchable multiple times.',
    cost: 12,
    pattern: 'common-knowledge',
    fuelPerPlay: 1,
  },
  {
    id: 'department-heads-quarters',
    label: 'Department Heads Quarters',
    description: '+1 Fuel each Department Heads mission. Researchable multiple times.',
    cost: 14,
    pattern: 'department-heads',
    fuelPerPlay: 1,
  },
  {
    id: 'common-cause-quarters',
    label: 'Common Cause Quarters',
    description: '+1 Fuel each Common Cause mission. Researchable multiple times.',
    cost: 14,
    pattern: 'common-cause',
    fuelPerPlay: 1,
  },
  {
    id: 'bridge-crew-quarters',
    label: 'Bridge Crew Quarters',
    description: '+2 Fuel each Bridge Crew mission. Researchable multiple times.',
    cost: 16,
    pattern: 'bridge-crew',
    fuelPerPlay: 2,
  },
]

export function getCrewQuartersBlueprint(id: string): CrewQuartersBlueprint | null {
  return crewQuartersCatalog.find((entry) => entry.id === id) ?? null
}
