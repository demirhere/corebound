import { createGateCard } from './factories'
import type { Card, CrewRoleKind, GateDetails, RequirementIconKind } from '../types'

const gateClear = (extraFuel: number): GateDetails['clear'] => ({
  extraFuel,
  extraCrew: 0,
})

const noGateEffect: GateDetails['effectKind'] = 'none'
const noGateEffectText = 'No special effect.'

export const sectorGates = [
  createGateCard(
    'Narrow Crossing',
    'SECTOR GATE',
    3,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(0),
    'No extra cost.',
  ),
  createGateCard(
    'Quiet Drift',
    'SECTOR GATE',
    3,
    [],
    0,
    'extra-drift',
    'Resolve 1 extra Drift before passing.',
    gateClear(1),
    'Pay +1 Fuel.',
  ),
  createGateCard(
    'Old Pass',
    'SECTOR GATE',
    4,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(1),
    'Pay +1 Fuel.',
  ),
  createGateCard(
    'Lost Beacon',
    'SECTOR GATE',
    3,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Dust Reach',
    'SECTOR GATE',
    4,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Cold Mirror',
    'SECTOR GATE',
    5,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(1),
    'Pay +1 Fuel.',
  ),
  createGateCard(
    'Echo Vault',
    'SECTOR GATE',
    4,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Ash Belt',
    'SECTOR GATE',
    5,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Black Threshold',
    'SECTOR GATE',
    4,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Hollow Span',
    'SECTOR GATE',
    5,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Iron Shoal',
    'SECTOR GATE',
    5,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(2),
    'Pay +2 Fuel.',
  ),
  createGateCard(
    'Last Verge',
    'SECTOR GATE',
    6,
    [],
    0,
    'extra-drift',
    'Resolve 1 extra Drift before passing.',
    gateClear(3),
    'Pay +3 Fuel.',
  ),
  createGateCard(
    'Drowned Comm',
    'SECTOR GATE',
    5,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(3),
    'Pay +3 Fuel.',
  ),
  createGateCard(
    'The Reach',
    'SECTOR GATE',
    6,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    gateClear(4),
    'Pay +4 Fuel.',
  ),
]

const blockedIconByEffect: Partial<Record<GateDetails['effectKind'], RequirementIconKind>> = {
  'block-engine-crew': 'engine',
  'block-life-crew': 'life',
  'block-science-crew': 'signal',
  'block-nav-crew': 'star',
}

const blockedRoleByEffect: Partial<Record<GateDetails['effectKind'], CrewRoleKind>> = {
  'block-engineer-crew': 'engineer',
  'block-medic-crew': 'medic',
  'block-pilot-crew': 'pilot',
  'block-scientist-crew': 'scientist',
}

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
  _gate: GateDetails,
  _stressCount: number,
  _skippedSlots = 0,
) {
  void _skippedSlots

  return 0
}

export function gateBlocksCrewCard(gate: GateDetails, card: Card | undefined) {
  if (card?.kind !== 'crew') {
    return false
  }

  const blockedIcon = blockedIconByEffect[gate.effectKind]

  if (blockedIcon && card.specializations?.includes(blockedIcon)) {
    return true
  }

  const blockedRole = blockedRoleByEffect[gate.effectKind]

  return blockedRole ? getCrewRole(card) === blockedRole : false
}

export function gateBlocksDiscoveries(_gate: GateDetails) {
  void _gate

  return false
}

export function gateBlocksReadyTired(_gate: GateDetails) {
  void _gate

  return false
}

export function gateBlocksMotherIcons(gate: GateDetails) {
  return gate.effectKind === 'block-mother'
}

export function gateBlocksShipParts(_gate: GateDetails) {
  void _gate

  return false
}

export function gateAddsBlueprintStress(_gate: GateDetails) {
  void _gate

  return false
}

export function gateHoldsDrift(_gate: GateDetails) {
  void _gate

  return false
}

export function getGateExtraDriftCount(gate: GateDetails) {
  return gate.effectKind === 'extra-drift' ? 1 : 0
}

export function getGateMotherFuelCost(gate: GateDetails) {
  return gate.effectKind === 'mother-costs-fuel' ? 1 : 0
}

export function getGateRequiredIconOptions(gate: GateDetails): RequirementIconKind[][] {
  return [gate.need.icons]
}

export function isGateClearConditionMet(
  gate: GateDetails,
  crewCards: readonly Card[],
  paidFuelCount: number,
  requiredFuelCount: number,
  crewNeedReduction = 0,
) {
  return crewCards.length >= Math.max(0, gate.need.crew - crewNeedReduction) + gate.clear.extraCrew &&
    paidFuelCount >= requiredFuelCount + gate.clear.extraFuel
}
