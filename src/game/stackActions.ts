import { FUEL_DECK_ID, FUEL_DISCARD_DECK_ID } from './decks'
import { getMissionAnyIconSurcharge } from './damage'
import { getNextGateFuelDiscount, getNextStopFuelDiscount } from './effects'
import { isGateClearConditionMet } from './blueprints/sectorGates'
import {
  getGateStackCompletion,
  getMissionStackCompletion,
  isDiscoveryEffect,
} from './rules'
import type {
  BoardState,
  Card,
  CrewSpecialization,
  ShipPartKind,
  ShipPartSlot,
  Stack,
} from './types'

export type StackActionKind =
  | 'draw-fuel'
  | 'travel'
  | 'pass-gate'
  | 'use-ration'

export type StackAction = {
  id: string
  kind: StackActionKind
  label: string
  stackId: string
}

type WaterPairCrewRole = 'engineer' | 'scientist'

function isBoardActionBlocked(current: BoardState) {
  return Boolean(
      current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice ||
      current.pendingDrift,
  )
}

function countSpentShipParts(
  shipPartSlots: readonly ShipPartSlot[],
  shipPart: ShipPartKind,
  currentSector: number,
) {
  return shipPartSlots.reduce((count, slot) => (
    slot.shipPart === shipPart && slot.status === 'spent' && slot.spentSector === currentSector
      ? count + 1
      : count
  ), 0)
}

function getWaterPairCrewRole(card: Card | undefined): WaterPairCrewRole | null {
  if (card?.kind !== 'crew') {
    return null
  }

  const specializations = card.specializations ?? []

  if (specializations.length > 0 && specializations.every((specialization) => specialization === 'engine')) {
    return 'engineer'
  }

  const specializationSet = new Set<CrewSpecialization>(specializations)

  return specializationSet.has('engine') && specializationSet.has('signal') ? 'scientist' : null
}

function hasFuelDrawWaterPair(stack: Stack, cards: Record<string, Card>) {
  if (stack.cardIds.length !== 2) {
    return false
  }

  const roles = stack.cardIds.map((cardId) => getWaterPairCrewRole(cards[cardId]))

  return roles.includes('engineer') && roles.includes('scientist')
}

function getCrewCards(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    return card?.kind === 'crew' ? [card] : []
  })
}

function getDrawFuelAction(current: BoardState, stack: Stack): StackAction[] {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)
  const fuelDiscard = current.decks.find((deck) => deck.id === FUEL_DISCARD_DECK_ID)

  return fuelDeck && (fuelDeck.cards.length > 0 || (fuelDiscard?.cards.length ?? 0) > 0) && hasFuelDrawWaterPair(stack, current.cards)
    ? [
        {
          id: 'draw-fuel',
          kind: 'draw-fuel',
          label: 'Make fuel',
          stackId: stack.id,
        },
      ]
    : []
}

function getTravelAction(current: BoardState, stack: Stack): StackAction[] {
  const completion = getMissionStackCompletion(
    stack,
    current.cards,
    getNextStopFuelDiscount(current.pendingEffects),
    getMissionAnyIconSurcharge(current.cards, current.routeSlots),
  )

  if (
    completion?.isReady &&
    current.forcedDestinationCardId &&
    current.routeSlots.filter((slot) => slot === null).length <= 1 &&
    completion.missionCardId !== current.forcedDestinationCardId
  ) {
    return []
  }

  return completion?.isReady && current.mapSlots.includes(completion.missionCardId)
    ? [
        {
          id: 'travel',
          kind: 'travel',
          label: 'Complete',
          stackId: stack.id,
        },
      ]
    : []
}

function getPassGateAction(current: BoardState, stack: Stack): StackAction[] {
  const serviceDroneBayCount = countSpentShipParts(
    current.shipPartSlots,
    'service-drone-bay',
    current.currentSector,
  )
  const gateFuelShipPartDiscount = countSpentShipParts(
    current.shipPartSlots,
    'adaptive-control-console',
    current.currentSector,
  )
  const completion = getGateStackCompletion(
    stack,
    current.cards,
    current.stressCount,
    serviceDroneBayCount,
    0,
    0,
    getNextGateFuelDiscount(current.pendingEffects) + gateFuelShipPartDiscount,
  )

  if (!completion?.isReady) {
    return []
  }

  const gateCard = current.cards[completion.gateCardId]
  const clearsCleanly = !gateCard?.gate || isGateClearConditionMet(
    gateCard.gate,
    getCrewCards(stack, current.cards),
    completion.fuelSpentCount + completion.fuelGeneratedCount,
    completion.requiredFuelCount,
    serviceDroneBayCount,
  )

  return [
    {
      id: 'pass-gate',
      kind: 'pass-gate',
      label: clearsCleanly ? 'Complete sector' : 'Complete sector with damage',
      stackId: stack.id,
    },
  ]
}

function getRationPackAction(current: BoardState, stack: Stack): StackAction[] {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)
  const fuelDiscard = current.decks.find((deck) => deck.id === FUEL_DISCARD_DECK_ID)
  const card = stack.cardIds.length === 1 ? current.cards[stack.cardIds[0] ?? ''] : undefined

  return fuelDeck && (fuelDeck.cards.length > 0 || (fuelDiscard?.cards.length ?? 0) > 0) && isDiscoveryEffect(card, 'ration_pack')
    ? [
        {
          id: 'use-ration',
          kind: 'use-ration',
          label: 'Use ration',
          stackId: stack.id,
        },
      ]
    : []
}

export function getStackActions(current: BoardState, stack: Stack): StackAction[] {
  if (isBoardActionBlocked(current)) {
    return []
  }

  return [
    ...getRationPackAction(current, stack),
    ...getDrawFuelAction(current, stack),
    ...getTravelAction(current, stack),
    ...getPassGateAction(current, stack),
  ]
}
