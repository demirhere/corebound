import { createMissionCard, shipPartFind } from './blueprints/factories'
import type { Card, CardBlueprint, MissionKind, RequirementIconKind, ShipPartKind, Stack } from './types'

export const BASE_WATER_PAIR_FUEL_AMOUNT = 1
export const BOOSTED_WATER_PAIR_FUEL_AMOUNT = 2
export const WATER_PAIR_BOOST_SHIP_PART: ShipPartKind = 'fuel-synthesizer'
export const SHIP_PART_RESEARCH_ENGINE_ICON_COST = 2
export const SHIP_PART_RESEARCH_FUEL_COST = 2

type ShipPartCarrier = {
  shipPart: ShipPartKind
}

export type ShipPartResearchPayment = {
  crewCardIds: string[]
  fuelCardIds: string[]
}

function createShipPartBlueprint(
  title: string,
  missionKind: MissionKind,
  itemName: string,
  shipPart: ShipPartKind,
): CardBlueprint {
  return createMissionCard(title, missionKind, 0, [], shipPartFind(itemName, shipPart))
}

export const shipPartDeck = [
  createShipPartBlueprint('Medbay Plans', 'planet', 'Medbay Rehydrator', 'medbay-rehydrator'),
  createShipPartBlueprint('Drone Bay Plans', 'asteroid', 'Service Drone Bay', 'service-drone-bay'),
  createShipPartBlueprint('Console Plans', 'deep-space', 'Adaptive Control Console', 'adaptive-control-console'),
  createShipPartBlueprint('Synthesizer Plans', 'asteroid', 'Fuel Synthesizer', 'fuel-synthesizer'),
]

function countEngineIcons(card: Card) {
  return card.specializations?.filter((specialization) => specialization === 'engine').length ?? 0
}

export function getShipPartResearchPayment(
  stack: Stack,
  cards: Record<string, Card>,
): ShipPartResearchPayment | null {
  const crewCardIds: string[] = []
  const fuelCardIds: string[] = []
  let engineIconCount = 0

  for (const cardId of stack.cardIds) {
    const card = cards[cardId]

    if (card?.kind === 'crew') {
      const cardEngineIconCount = countEngineIcons(card)

      if (cardEngineIconCount === 0) {
        return null
      }

      engineIconCount += cardEngineIconCount
      crewCardIds.push(cardId)
      continue
    }

    if (card?.kind === 'resource' && card.resource === 'fuel') {
      fuelCardIds.push(cardId)
      continue
    }

    return null
  }

  return engineIconCount === SHIP_PART_RESEARCH_ENGINE_ICON_COST &&
    fuelCardIds.length === SHIP_PART_RESEARCH_FUEL_COST
    ? { crewCardIds, fuelCardIds }
    : null
}

export function hasWaterPairFuelBoost(shipPartSlots: readonly ShipPartCarrier[]) {
  return shipPartSlots.some((slot) => slot.shipPart === WATER_PAIR_BOOST_SHIP_PART)
}

export function getWaterPairFuelAmount(shipPartSlots: readonly ShipPartCarrier[]) {
  return hasWaterPairFuelBoost(shipPartSlots)
    ? BOOSTED_WATER_PAIR_FUEL_AMOUNT
    : BASE_WATER_PAIR_FUEL_AMOUNT
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

export function getShipPartLabel(shipPart: ShipPartKind) {
  if (shipPart === 'medbay-rehydrator') {
    return 'Medbay Rehydrator'
  }

  if (shipPart === 'service-drone-bay') {
    return 'Service Drone Bay'
  }

  if (shipPart === 'adaptive-control-console') {
    return 'Adaptive Control Console'
  }

  return 'Fuel Synthesizer'
}

export function getShipPartUseText(shipPart: ShipPartKind) {
  if (shipPart === 'medbay-rehydrator') {
    return 'Ready +1 crew after each sector.'
  }

  if (shipPart === 'service-drone-bay') {
    return 'Reduce Sector Gate crew need by 1.'
  }

  if (shipPart === 'adaptive-control-console') {
    return 'Reduce required Gate Fuel by 1.'
  }

  return 'Scientist + Mechanic makes 2 Fuel.'
}
