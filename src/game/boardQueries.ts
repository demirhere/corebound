import { FUEL_DECK_ID, HORIZON_DECK_ID, MOTHER_DECK_ID } from './decks'
import { getNextStopFuelDiscount } from './effects'
import {
  canCompleteHorizonNeedWithFuelOptions,
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

export function getAvailableMotherCardCount(current: BoardState) {
  return (
    countUsableMotherCardsInPlay(current.stacks, current.cards) +
    getDeckCardCount(current, MOTHER_DECK_ID)
  )
}

export function getVisibleHorizonCards(current: BoardState) {
  return current.mapSlots.flatMap((cardId) => {
    const card = cardId ? current.cards[cardId] : null

    return card?.kind === 'horizon' && card.horizon ? [card] : []
  })
}

export function canTravelToHorizon(current: BoardState, horizonCard: Card) {
  if (!horizonCard.horizon) {
    return false
  }

  const requiredFuel = Math.max(
    0,
    horizonCard.horizon.need.fuel - getNextStopFuelDiscount(current.pendingEffects),
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

export function getDistressCallOptions(current: BoardState) {
  const isBlocked = Boolean(
    current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice ||
      current.routeSlots.every(Boolean),
  )

  if (isBlocked || getVisibleHorizonCards(current).length === 0 || canTravelToAnyVisibleHorizon(current)) {
    return {
      canUse: false,
      canGainFuel: false,
      canReplaceMapStop: false,
    }
  }

  const canGainFuel = getDeckCardCount(current, FUEL_DECK_ID) > 0
  const canReplaceMapStop =
    getDeckCardCount(current, HORIZON_DECK_ID) > 0 &&
    current.mapSlots.some((cardId) => {
      const card = cardId ? current.cards[cardId] : null

      return card?.kind === 'horizon'
    })

  return {
    canUse: canGainFuel || canReplaceMapStop,
    canGainFuel,
    canReplaceMapStop,
  }
}

export function canDistressCall(current: BoardState) {
  return getDistressCallOptions(current).canUse
}

export function canDistressReplaceMapSlot(current: BoardState, slotIndex: number) {
  const options = getDistressCallOptions(current)

  if (
    !options.canReplaceMapStop ||
    slotIndex < 0 ||
    slotIndex >= current.mapSlots.length
  ) {
    return false
  }

  const cardId = current.mapSlots[slotIndex]
  const card = cardId ? current.cards[cardId] : null

  return card?.kind === 'horizon'
}
