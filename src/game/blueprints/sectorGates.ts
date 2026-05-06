import { createGateCard } from './factories'
import type { Card, CrewRoleKind, GateDetails, RequirementIconKind } from '../types'

const nav = 'star'
const science = 'signal'

export const sectorGates = [
  createGateCard(
    'Narrow Crossing',
    'SECTOR GATE',
    ['engine', 'life', nav],
    3,
    'clean',
    'None. Clean Gate.',
    { kind: 'extra-crew-beyond-minimum', count: 1 },
    'Commit 1 crew beyond minimum.',
  ),
  createGateCard(
    'Quiet Drift',
    'SECTOR GATE',
    ['engine', 'engine', nav],
    3,
    'first-crew-no-icons',
    'First crew committed contributes 0 icons.',
    { kind: 'crew-count-at-least', count: 4 },
    'Commit 4+ crew total.',
  ),
  createGateCard(
    'Old Pass',
    'SECTOR GATE',
    [nav, 'life', science],
    3,
    'engine-icons-cost-fuel',
    'Engine-icon crew cost +1 Fuel each.',
    { kind: 'role-count-at-least', roles: ['engineer'], count: 2 },
    'Commit 2+ Engineers.',
  ),
  createGateCard(
    'Lost Beacon',
    'SECTOR GATE',
    ['engine', 'life', nav],
    3,
    'extra-crew-slot',
    '-1 slot capacity: need 1 extra crew.',
    { kind: 'mother-spent-at-least', count: 2 },
    'Spend 2 MOTHER.',
  ),
  createGateCard(
    'Dust Reach',
    'SECTOR GATE',
    ['engine', nav, 'life'],
    4,
    'block-discoveries',
    'Discoveries cannot be played.',
    { kind: 'no-tired-crew' },
    'Have 0 Tired crew committed.',
  ),
  createGateCard(
    'Cold Mirror',
    'SECTOR GATE',
    ['engine', 'engine', 'life'],
    4,
    'block-ready-tired',
    'Ship Part / Blueprint "ready Tired" effects blocked.',
    { kind: 'role-count-at-least', roles: ['medic'], count: 2 },
    'Commit 2+ Medics.',
  ),
  createGateCard(
    'Echo Vault',
    'SECTOR GATE',
    [nav, science, 'life'],
    4,
    'block-mother',
    'MOTHER unusable.',
    { kind: 'role-count-at-least', roles: ['pilot'], count: 1 },
    'Commit a Pilot.',
  ),
  createGateCard(
    'Ash Belt',
    'SECTOR GATE',
    ['engine', 'engine', nav],
    4,
    'stress-extra-slot',
    'If Stress is 3+, +1 slot needed.',
    { kind: 'stress-zero' },
    'Stress = 0 at Resolve.',
  ),
  createGateCard(
    'Black Threshold',
    'SECTOR GATE',
    ['life', 'life', science],
    4,
    'blueprints-add-stress',
    'Each Blueprint that triggers adds 1 Stress.',
    { kind: 'role-count-at-least', roles: ['scientist'], count: 2 },
    'Commit 2+ Scientists.',
  ),
  createGateCard(
    'Hollow Span',
    'SECTOR GATE',
    [nav, 'engine', science],
    4,
    'block-ship-parts',
    'Ship Parts unusable.',
    { kind: 'crew-count-at-least', count: 5 },
    'Commit 5+ crew total.',
  ),
  createGateCard(
    'Iron Shoal',
    'SECTOR GATE',
    ['engine', 'engine', nav, science],
    5,
    'block-mother-icons',
    'MOTHER cannot substitute for icons.',
    { kind: 'different-role-count-at-least', count: 5 },
    'Commit 5 different crew roles.',
  ),
  createGateCard(
    'Last Verge',
    'SECTOR GATE',
    ['engine', 'life', nav, science],
    5,
    'hold-drift',
    'All Drift cards held in reserve trigger before Resolve.',
    { kind: 'same-role-count-at-least', count: 2 },
    'Commit 2+ crew of same role.',
  ),
  createGateCard(
    'Drowned Comm',
    'SECTOR GATE',
    ['engine', 'life', 'life', nav],
    5,
    'leftmost-crew-ignore-icon',
    'The leftmost committed crew has 1 icon ignored.',
    { kind: 'roles-committed', roles: ['recon', 'medic'] },
    'Commit a Recon and a Medic.',
  ),
  createGateCard(
    'The Reach',
    'SECTOR GATE',
    ['engine', 'life', nav, science],
    5,
    'double-chosen-icon',
    'One icon type chosen by the Mission Lead must be covered twice.',
    { kind: 'crew-count-at-least', count: 6 },
    'Commit 6+ crew total.',
  ),
]

export function getCrewRole(card: Card | undefined): CrewRoleKind {
  if (card?.kind !== 'crew') {
    return 'crew'
  }

  const specializations = card.specializations ?? []

  if (specializations.length === 0) {
    return 'crew'
  }

  const [firstSpecialization] = specializations

  if (firstSpecialization && specializations.every((specialization) => specialization === firstSpecialization)) {
    if (firstSpecialization === 'engine') return 'engineer'
    if (firstSpecialization === 'life') return 'medic'
    if (firstSpecialization === 'star') return 'pilot'
    return 'operator'
  }

  const specializationSet = new Set(specializations)

  if (specializationSet.has('engine') && specializationSet.has('life')) return 'mechanic'
  if (specializationSet.has('engine') && specializationSet.has('signal')) return 'scientist'
  if (specializationSet.has('engine') && specializationSet.has('star')) return 'helmsman'
  if (specializationSet.has('life') && specializationSet.has('signal')) return 'doctor'
  if (specializationSet.has('life') && specializationSet.has('star')) return 'pilot'
  if (specializationSet.has('signal') && specializationSet.has('star')) return 'recon'

  return 'crew'
}

export function getGateExtraCrewSlots(
  gate: GateDetails,
  stressCount: number,
  skippedSlots = 0,
) {
  const printedExtraSlots =
    gate.effectKind === 'extra-crew-slot' ||
    (gate.effectKind === 'stress-extra-slot' && stressCount >= 3)
      ? 1
      : 0

  return Math.max(0, printedExtraSlots - skippedSlots)
}

export function gateBlocksDiscoveries(gate: GateDetails) {
  return gate.effectKind === 'block-discoveries'
}

export function gateBlocksReadyTired(gate: GateDetails) {
  return gate.effectKind === 'block-ready-tired'
}

export function gateBlocksMotherIcons(gate: GateDetails) {
  return gate.effectKind === 'block-mother' || gate.effectKind === 'block-mother-icons'
}

export function gateBlocksShipParts(gate: GateDetails) {
  return gate.effectKind === 'block-ship-parts'
}

export function gateAddsBlueprintStress(gate: GateDetails) {
  return gate.effectKind === 'blueprints-add-stress'
}

export function gateHoldsDrift(gate: GateDetails) {
  return gate.effectKind === 'hold-drift'
}

export function getGateRequiredIconOptions(gate: GateDetails): RequirementIconKind[][] {
  if (gate.effectKind !== 'double-chosen-icon') {
    return [gate.need.icons]
  }

  return [...new Set(gate.need.icons)].map((icon) => [...gate.need.icons, icon])
}

export function isGateClearConditionMet(
  gate: GateDetails,
  crewCards: readonly Card[],
  nextStressCount: number,
  spentMotherCount: number,
  tiredCrewCardIds: readonly string[] = [],
) {
  const crewRoles = crewCards.map(getCrewRole)
  const crewRoleCounts = new Map<CrewRoleKind, number>()
  const tiredCrewCardIdSet = new Set(tiredCrewCardIds)

  for (const role of crewRoles) {
    crewRoleCounts.set(role, (crewRoleCounts.get(role) ?? 0) + 1)
  }

  if (gate.clear.kind === 'extra-crew-beyond-minimum') {
    return crewCards.length >= gate.need.crew + (gate.clear.count ?? 1)
  }

  if (gate.clear.kind === 'crew-count-at-least') {
    return crewCards.length >= (gate.clear.count ?? 0)
  }

  if (gate.clear.kind === 'role-count-at-least') {
    const count = gate.clear.count ?? 1
    const role = gate.clear.roles?.[0]

    return role ? (crewRoleCounts.get(role) ?? 0) >= count : false
  }

  if (gate.clear.kind === 'mother-spent-at-least') {
    return spentMotherCount >= (gate.clear.count ?? 0)
  }

  if (gate.clear.kind === 'no-tired-crew') {
    return crewCards.every((card) => !tiredCrewCardIdSet.has(card.id))
  }

  if (gate.clear.kind === 'stress-zero') {
    return nextStressCount === 0
  }

  if (gate.clear.kind === 'different-role-count-at-least') {
    return new Set(crewRoles).size >= (gate.clear.count ?? 0)
  }

  if (gate.clear.kind === 'same-role-count-at-least') {
    const count = gate.clear.count ?? 0

    return Array.from(crewRoleCounts.values()).some((roleCount) => roleCount >= count)
  }

  if (gate.clear.kind === 'roles-committed') {
    return (gate.clear.roles ?? []).every((role) => (crewRoleCounts.get(role) ?? 0) > 0)
  }

  return true
}
