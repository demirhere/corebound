import { FUEL_DECK_ID, MOTHER_DECK_ID } from './decks'
import { getNextStarFuelDiscount } from './effects'
import {
  canCompleteHorizonNeedWithFuelOptions,
  countUsableMotherCardsInPlay,
  isUsableMotherCard,
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

export function getAvailableMotherCardCount(current: BoardState) {
  return (
    countUsableMotherCardsInPlay(current.stacks, current.cards) +
    getDeckCardCount(current, MOTHER_DECK_ID)
  )
}

export function getVisibleHorizonCards(current: BoardState) {
  return current.stacks.flatMap((stack) =>
    stack.cardIds.flatMap((cardId) => {
      const card = current.cards[cardId]

      return card?.kind === 'horizon' && card.horizon ? [card] : []
    }),
  )
}

export function canTravelToHorizon(current: BoardState, horizonCard: Card) {
  if (!horizonCard.horizon) {
    return false
  }

  const requiredFuel = Math.max(
    0,
    horizonCard.horizon.need.fuel - getNextStarFuelDiscount(current.pendingEffects),
  )

  return canCompleteHorizonNeedWithFuelOptions(
    getReadyCrewCardIds(current),
    current.cards,
    horizonCard.horizon.need.icons,
    requiredFuel,
    countFuelCardsInPlay(current),
    getAvailableMotherCardCount(current),
  )
}

export function canTravelToAnyHorizon(current: BoardState, horizonCardIds: readonly string[]) {
  return horizonCardIds.some((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'horizon' && canTravelToHorizon(current, card)
  })
}

export function canTravelToAnyVisibleHorizon(current: BoardState) {
  return getVisibleHorizonCards(current).some((card) => canTravelToHorizon(current, card))
}

function hasEngineOrStar(card: Card | undefined) {
  return card?.kind === 'crew' && (
    card.specializations?.includes('engine') ||
    card.specializations?.includes('star')
  )
}

function hasEmergencyRefuelReadyPayment(current: BoardState) {
  const readyCrewCardIds = getReadyCrewCardIds(current)
  const engineOrStarCrewCardIds = readyCrewCardIds.filter((cardId) => hasEngineOrStar(current.cards[cardId]))

  return (
    (readyCrewCardIds.length >= 2 && engineOrStarCrewCardIds.length > 0) ||
    (engineOrStarCrewCardIds.length > 0 && getAvailableMotherCardCount(current) > 0)
  )
}

export function canEmergencyRefuel(current: BoardState) {
  if (
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    getDeckCardCount(current, FUEL_DECK_ID) === 0
  ) {
    return false
  }

  const visibleHorizonCards = getVisibleHorizonCards(current)

  if (visibleHorizonCards.length === 0 || canTravelToAnyVisibleHorizon(current)) {
    return false
  }

  const availableFuelCount = countFuelCardsInPlay(current)
  const fuelDiscount = getNextStarFuelDiscount(current.pendingEffects)
  const allVisibleStarsCostMoreFuelThanShipHas = visibleHorizonCards.every((card) => (
    card.horizon && Math.max(0, card.horizon.need.fuel - fuelDiscount) > availableFuelCount
  ))

  return allVisibleStarsCostMoreFuelThanShipHas && hasEmergencyRefuelReadyPayment(current)
}

export function getEmergencyRefuelStackPayment(current: BoardState, cardIds: readonly string[]) {
  if (!canEmergencyRefuel(current)) {
    return null
  }

  const readyCrewCardIdSet = new Set(getReadyCrewCardIds(current))
  const crewCardIds: string[] = []
  const motherCardIds: string[] = []

  for (const cardId of cardIds) {
    const card = current.cards[cardId]

    if (card?.kind === 'crew' && readyCrewCardIdSet.has(card.id)) {
      crewCardIds.push(card.id)
      continue
    }

    if (isUsableMotherCard(card)) {
      motherCardIds.push(card.id)
      continue
    }

    return null
  }

  if (crewCardIds.length === 2 && motherCardIds.length === 0) {
    return crewCardIds.some((cardId) => hasEngineOrStar(current.cards[cardId]))
      ? { crewCardIds, motherCardIds }
      : null
  }

  if (crewCardIds.length === 1 && motherCardIds.length === 1 && hasEngineOrStar(current.cards[crewCardIds[0]])) {
    return { crewCardIds, motherCardIds }
  }

  return null
}

export function canEmergencyRefuelStack(current: BoardState, cardIds: readonly string[]) {
  return getEmergencyRefuelStackPayment(current, cardIds) !== null
}
