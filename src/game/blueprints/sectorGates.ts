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
// shuffle is a no-op — every run sees the same difficulty ramp. Total
// cost 225 Fuel, calibrated for a fully-built winner: 5 Ship Parts (the
// slot cap) plus ~5-7 researched Crew Quarter Upgrades (via the per-gate
// Upgrade Crew Quarters offer — 1 upgrade per gate at a flat 4 Scraps). S3 acts as a
// hard wall — a no-joker, no-quarters greedy run averages ~6-9 Fuel/sector
// and cannot clear the jump from cost 9 (S2) to cost 16 (S3). The back-end
// ramp stays steep enough that even a fully-stacked greedy run wins only
// ~1.5-2.5% — winning requires a strategic spend split between Ship Parts
// (Compounding Drive, Crew Synergy, Veteran's Insignia, Adrenal Implants)
// and Crew Quarter Upgrades (invest deeply in the cheap, common patterns greedy
// plays most often — common-ground, cross-training, common-knowledge).
// Re-run `pnpm sim` after any change here; mirror the numbers in
// `scripts/simulate.mjs`.
export const sectorGates: CardBlueprint[] = [
  fuelGate('Narrow Crossing',  8,  0),
  fuelGate('Old Pass',         9,  1),
  fuelGate('Lost Beacon',     16, 10),
  fuelGate('Dust Reach',      17,  8),
  fuelGate('Cold Mirror',     21,  9),
  fuelGate('Echo Vault',      24,  7),
  fuelGate('Hollow Span',     27, 11),
  fuelGate('Iron Shoal',      31,  2),
  fuelGate('Black Threshold', 34, 12),
  fuelGate('Drowned Comm',    38,  5),
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
