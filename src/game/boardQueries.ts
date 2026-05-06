import { FUEL_DECK_ID, FUEL_DISCARD_DECK_ID, MOTHER_DECK_ID } from './decks'
import { getNextStopFuelDiscount } from './effects'
import { getDestinationFuelSurcharge, getMissionAnyIconSurcharge } from './damage'
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
  const supplyStack = current.stacks.find((stack) =>
    stack.cardIds.some((cardId) => {
      const card = current.cards[cardId]

      return card?.kind === 'resource' && card.resource === 'fuel'
    }),
  )

  return supplyStack?.cardIds.filter((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'resource' && card.resource === 'fuel'
  }).length ?? 0
}

export function countFuelCardsInDeckAndDiscard(current: BoardState) {
  return getDeckCardCount(current, FUEL_DECK_ID) + getDeckCardCount(current, FUEL_DISCARD_DECK_ID)
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
