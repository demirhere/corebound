import { FUEL_DECK_ID, FUEL_DISCARD_DECK_ID, MOTHER_DECK_ID, SHIP_PART_DECK_ID } from './decks'
import { getNextStopFuelDiscount } from './effects'
import { getDestinationFuelSurcharge, getMissionAnyIconSurcharge } from './damage'
import {
  SHIP_PART_RESEARCH_ENGINE_ICON_COST,
  SHIP_PART_RESEARCH_FUEL_COST,
  getWaterPairFuelAmount,
} from './shipParts'
import {
  canCompleteMissionNeedWithFuelOptions,
  countUsableMotherCardsInPlay,
} from './rules'
import type { BoardState, Card } from './types'

export function getDeckCardCount(current: BoardState, deckId: string) {
  return current.decks.find((deck) => deck.id === deckId)?.cards.length ?? 0
}

export function getReadyCrewCardIds(current: BoardState) {
  const tiredCardIdSet = new Set(current.tiredCardIds)
  const pendingWakeChoiceCardIds = new Set(current.pendingWakeChoice?.choiceCardIds ?? [])

  return Object.values(current.cards).flatMap((card) =>
    card.kind === 'crew' &&
      !tiredCardIdSet.has(card.id) &&
      !pendingWakeChoiceCardIds.has(card.id)
      ? [card.id]
      : [],
  )
}

export function countFuelCardsInPlay(current: BoardState) {
  const fuelCardIds = new Set<string>()

  for (const stack of current.stacks) {
    for (const cardId of stack.cardIds) {
      const card = current.cards[cardId]

      if (card?.kind === 'resource' && card.resource === 'fuel') {
        fuelCardIds.add(cardId)
      }
    }
  }

  return fuelCardIds.size
}

export function countFuelCardsInSupply(current: BoardState) {
  // Sum across all fuel-only stacks. Auto-placement caps stacks at 9 cards
  // and overflows into a sibling stack, so a single supply can be split.
  // (See AUTO_FUEL_SUPPLY_STACK_LIMIT in board/boardUpdaters.ts.)
  let total = 0

  for (const stack of current.stacks) {
    if (stack.cardIds.length === 0) continue

    let allFuel = true
    let fuelCount = 0

    for (const cardId of stack.cardIds) {
      const card = current.cards[cardId]
      const isFuel = card?.kind === 'resource' && card.resource === 'fuel'

      if (!isFuel) {
        allFuel = false
        break
      }

      fuelCount += 1
    }

    if (allFuel) {
      total += fuelCount
    }
  }

  return total
}

export function countFuelCardsInDeckAndDiscard(current: BoardState) {
  return getDeckCardCount(current, FUEL_DECK_ID) + getDeckCardCount(current, FUEL_DISCARD_DECK_ID)
}

function countReadyEngineIcons(current: BoardState) {
  return getReadyCrewCardIds(current).reduce((count, cardId) => {
    const card = current.cards[cardId]

    return count + (card?.specializations?.filter((specialization) => specialization === 'engine').length ?? 0)
  }, 0)
}

export function canResearchShipPart(current: BoardState) {
  return getDeckCardCount(current, SHIP_PART_DECK_ID) > 0 &&
    countFuelCardsInPlay(current) >= SHIP_PART_RESEARCH_FUEL_COST &&
    countReadyEngineIcons(current) >= SHIP_PART_RESEARCH_ENGINE_ICON_COST
}

export function getAvailableMotherCardCount(current: BoardState) {
  return (
    countUsableMotherCardsInPlay(current.stacks, current.cards) +
    getDeckCardCount(current, MOTHER_DECK_ID)
  )
}

export function getVisibleMissionCards(current: BoardState) {
  return current.mapSlots.flatMap((cardId) => {
    const card = cardId ? current.cards[cardId] : null

    return card?.kind === 'mission' && card.mission ? [card] : []
  })
}

function hasMissionDiscoverySupportInHand(current: BoardState) {
  return current.handCardIds.some((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'discovery' && (card.discovery?.tag === 'mission' || card.discovery?.tag === 'crew')
  })
}

export function canTravelToMission(current: BoardState, missionCard: Card) {
  if (!missionCard.mission) {
    return false
  }

  const requiredFuel = Math.max(
    0,
    missionCard.mission.need.fuel +
      getDestinationFuelSurcharge(current.cards, missionCard.mission) -
      getNextStopFuelDiscount(current.pendingEffects),
  )
  const missionAnyIconSurcharge = getMissionAnyIconSurcharge(current.cards, current.routeSlots)

  const readyCrewCardIds = getReadyCrewCardIds(current)
  const canTravelWithoutDiscoveries = canCompleteMissionNeedWithFuelOptions(
    readyCrewCardIds,
    current.cards,
    missionCard.mission.need.icons,
    requiredFuel,
    Math.min(countFuelCardsInPlay(current), requiredFuel),
    getAvailableMotherCardCount(current),
    [],
    missionAnyIconSurcharge,
    getWaterPairFuelAmount(current.shipPartSlots),
  )

  return canTravelWithoutDiscoveries || (
    readyCrewCardIds.length > 0 &&
    hasMissionDiscoverySupportInHand(current)
  )
}

export function canTravelToAnyMission(current: BoardState, missionCardIds: readonly string[]) {
  return missionCardIds.some((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'mission' && canTravelToMission(current, card)
  })
}

export function canTravelToAnyVisibleMission(current: BoardState) {
  return getVisibleMissionCards(current).some((card) => canTravelToMission(current, card))
}
