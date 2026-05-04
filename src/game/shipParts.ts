import type { RequirementIconKind, ShipPartKind } from './types'

export function getRequirementIconLabel(icon: RequirementIconKind) {
  if (icon === 'star') {
    return 'Nav'
  }

  if (icon === 'life') {
    return 'Life'
  }

  if (icon === 'engine') {
    return 'Engine'
  }

  return 'Science'
}

export function getShipPartLabel(shipPart: ShipPartKind) {
  if (shipPart === 'medbay-rehydrator') {
    return 'Medbay Rehydrator'
  }

  if (shipPart === 'service-drone-bay') {
    return 'Service Drone Bay'
  }

  return 'Adaptive Control Console'
}

export function getShipPartUseText(shipPart: ShipPartKind) {
  if (shipPart === 'medbay-rehydrator') {
    return 'Ready 1 Tired crew before Gate.'
  }

  if (shipPart === 'service-drone-bay') {
    return 'Fill 1 Gate crew slot. No icon.'
  }

  return 'Cover 1 missing Gate icon. No crew slot.'
}
