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
    return 'Ready +1 crew after each sector.'
  }

  if (shipPart === 'service-drone-bay') {
    return 'Reduce Sector Gate crew need by 1.'
  }

  return 'Reduce required Gate Fuel by 1.'
}
