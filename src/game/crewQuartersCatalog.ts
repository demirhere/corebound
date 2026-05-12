import type { CrewQuartersBlueprint } from './types'

// 7 unique Crew Quarters, one per crew composition pattern (excluding the
// generic "open" mission). Unlike Ship Parts, Crew Quarters are NOT placed
// on the board and the same blueprint can be researched multiple times —
// every purchase stacks its fuel bonus on every matching pattern play.
//
// Costs are tuned so a winning run typically researches 5-8 quarters
// (alongside filling the 5-slot Ship Part cap). The cheap (4-5 Scrap)
// quarters target the easier-to-satisfy patterns (cross-trained, common
// ground, specialist, common knowledge), which is the strategic axis the
// design rewards: players invest in less-rare compositions because they
// trigger more often. Department Heads / Common Cause cost 6 (rarer);
// Bridge Crew costs 8 with +2 Fuel per play (preserves the original
// Bridge Uplink power on a stackable ramp).
//
// Mirrored in `scripts/simulate.mjs` (the CREW_QUARTERS array). Update
// both in lockstep when tuning.
export const crewQuartersCatalog: readonly CrewQuartersBlueprint[] = [
  {
    id: 'cross-training-quarters',
    label: 'Cross-Training Quarters',
    description: '+1 Fuel each Cross-Trained mission. Researchable multiple times.',
    cost: 4,
    pattern: 'cross-trained',
    fuelPerPlay: 1,
  },
  {
    id: 'common-ground-quarters',
    label: 'Common Ground Quarters',
    description: '+1 Fuel each Common Ground mission. Researchable multiple times.',
    cost: 4,
    pattern: 'common-ground',
    fuelPerPlay: 1,
  },
  {
    id: 'specialist-quarters',
    label: 'Specialist Quarters',
    description: '+1 Fuel each Specialist mission. Researchable multiple times.',
    cost: 5,
    pattern: 'specialist',
    fuelPerPlay: 1,
  },
  {
    id: 'common-knowledge-quarters',
    label: 'Common Knowledge Quarters',
    description: '+1 Fuel each Common Knowledge mission. Researchable multiple times.',
    cost: 5,
    pattern: 'common-knowledge',
    fuelPerPlay: 1,
  },
  {
    id: 'department-heads-quarters',
    label: 'Department Heads Quarters',
    description: '+1 Fuel each Department Heads mission. Researchable multiple times.',
    cost: 6,
    pattern: 'department-heads',
    fuelPerPlay: 1,
  },
  {
    id: 'common-cause-quarters',
    label: 'Common Cause Quarters',
    description: '+1 Fuel each Common Cause mission. Researchable multiple times.',
    cost: 6,
    pattern: 'common-cause',
    fuelPerPlay: 1,
  },
  {
    id: 'bridge-crew-quarters',
    label: 'Bridge Crew Quarters',
    description: '+2 Fuel each Bridge Crew mission. Researchable multiple times.',
    cost: 8,
    pattern: 'bridge-crew',
    fuelPerPlay: 2,
  },
]

export function getCrewQuartersBlueprint(id: string): CrewQuartersBlueprint | null {
  return crewQuartersCatalog.find((entry) => entry.id === id) ?? null
}
