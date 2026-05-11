import { createGateCard } from './factories'
import type { Card, CardBlueprint, CrewRoleKind, GateDetails, RequirementIconKind } from '../types'

const noGateEffect: GateDetails['effectKind'] = 'none'
const noGateEffectText = 'No special effect.'
const zeroClear: GateDetails['clear'] = { extraFuel: 0, extraCrew: 0 }
const zeroClearText = 'No extra cost.'

function fuelGate(title: string, fuel: number, backgroundIndex: number): CardBlueprint {
  return createGateCard(
    title,
    'SECTOR GATE',
    fuel,
    [],
    0,
    noGateEffect,
    noGateEffectText,
    zeroClear,
    zeroClearText,
    backgroundIndex,
  )
}

// Fixed 10-gate sequence with monotonically increasing Fuel cost. The deck
// is shuffled + sorted at setup, but with 10 cards (one per sector) the
// shuffle is a no-op — every run sees the same difficulty ramp. Total cost
// 171 Fuel, recalibrated for the 45-card crew roster (5 starters + 40
// cryo = 4 copies of 10 unique cryo blueprints). The bigger cryo means
// fewer tired→cryo reshuffles per run; Mara/Sana (the only E/L
// specialists) are now 1 of 45 cards, so high-tier specialist patterns
// appear less often than before. ~5% win rate with greedy joker buys,
// 0% without. Re-run `pnpm sim` after any change here; mirror the
// numbers in `scripts/simulate.mjs`.
export const sectorGates: CardBlueprint[] = [
  fuelGate('Narrow Crossing',  8,  0),
  fuelGate('Old Pass',         8,  1),
  fuelGate('Lost Beacon',      9, 10),
  fuelGate('Dust Reach',      10,  8),
  fuelGate('Cold Mirror',     12,  9),
  fuelGate('Echo Vault',      17,  7),
  fuelGate('Hollow Span',     21, 11),
  fuelGate('Iron Shoal',      25,  2),
  fuelGate('Black Threshold', 29, 12),
  fuelGate('Drowned Comm',    32,  5),
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
