import type { HorizonKind, RequirementIconKind, ShipPartKind } from './types'

export function getStopTypeLabel(kind: HorizonKind) {
  if (kind === 'star') {
    return 'Deep Space'
  }

  return kind === 'planet' ? 'Planet' : 'Asteroid'
}

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

export function getShipPartForStopKind(kind: HorizonKind): ShipPartKind {
  if (kind === 'planet') {
    return 'water-tank'
  }

  if (kind === 'asteroid') {
    return 'hull-patch'
  }

  return 'wayfinder-beacon'
}

export function getShipPartLabel(shipPart: ShipPartKind) {
  if (shipPart === 'water-tank') {
    return 'Water Tank'
  }

  if (shipPart === 'hull-patch') {
    return 'Hull Patch'
  }

  return 'Wayfinder Beacon'
}

export function getShipPartUseText(shipPart: ShipPartKind) {
  if (shipPart === 'water-tank') {
    return 'Ready 1 Tired crew before Gate payment.'
  }

  if (shipPart === 'hull-patch') {
    return 'Fill 1 Gate crew slot. No icon.'
  }

  return 'Cover 1 missing Gate icon. No crew slot.'
}
