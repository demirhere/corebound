import { HORIZON_DECK_ID, MOTHER_DECK_ID } from './decks'
import { getNextStopFuelDiscount } from './effects'
import { getDestinationFuelSurcharge } from './hazards'
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

export function shouldDrawMissionsBeforeEndTurn(current: BoardState) {
  const visibleHorizonCards = getVisibleHorizonCards(current)
  const onlyForcedDestinationVisible = visibleHorizonCards.length === 1 &&
    visibleHorizonCards[0]?.id === current.forcedDestinationCardId

  return (
    !current.hasArrived &&
    !current.lossReason &&
    !current.pendingWakeChoice &&
    !current.pendingScoutChoice &&
    !current.pendingDrift &&
    !current.sectorDrawnThisTurn &&
    !current.traveledThisTurn &&
    current.routeSlots.some((slot) => slot === null) &&
    countFuelCardsInPlay(current) === 0 &&
    (visibleHorizonCards.length === 0 || onlyForcedDestinationVisible) &&
    current.decks.some((deck) => deck.id === HORIZON_DECK_ID)
  )
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

function hasMissionDiscoverySupportInHand(current: BoardState) {
  return current.handCardIds.some((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'discovery' && (card.discovery?.tag === 'mission' || card.discovery?.tag === 'crew')
  })
}

export function canTravelToHorizon(current: BoardState, horizonCard: Card) {
  if (!horizonCard.horizon) {
    return false
  }

  const requiredFuel = Math.max(
    0,
    horizonCard.horizon.need.fuel +
      getDestinationFuelSurcharge(current.cards, horizonCard.horizon) -
      getNextStopFuelDiscount(current.pendingEffects),
  )

  const readyCrewCardIds = getReadyCrewCardIds(current)
  const canTravelWithoutDiscoveries = canCompleteHorizonNeedWithFuelOptions(
    readyCrewCardIds,
    current.cards,
    horizonCard.horizon.need.icons,
    requiredFuel,
    countFuelCardsInPlay(current),
    getAvailableMotherCardCount(current),
  )

  return canTravelWithoutDiscoveries || (
    readyCrewCardIds.length > 0 &&
    hasMissionDiscoverySupportInHand(current)
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
