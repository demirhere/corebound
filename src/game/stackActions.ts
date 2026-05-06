import { FUEL_DECK_ID } from './decks'
import { getNextStopFuelDiscount } from './effects'
import {
  getGateStackCompletion,
  getHorizonStackCompletion,
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

function isSectorHorizonFinished(current: BoardState) {
  return current.routeSlots.every(Boolean)
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

function getDrawFuelAction(current: BoardState, stack: Stack): StackAction[] {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)

  return fuelDeck && fuelDeck.cards.length > 0 && hasFuelDrawWaterPair(stack, current.cards)
    ? [
        {
          id: 'draw-fuel',
          kind: 'draw-fuel',
          label: 'Draw fuel',
          stackId: stack.id,
        },
      ]
    : []
}

function getTravelAction(current: BoardState, stack: Stack): StackAction[] {
  const completion = getHorizonStackCompletion(
    stack,
    current.cards,
    getNextStopFuelDiscount(current.pendingEffects),
  )

  return completion?.isReady && current.mapSlots.includes(completion.horizonCardId)
    ? [
        {
          id: 'travel',
          kind: 'travel',
          label: 'Travel',
          stackId: stack.id,
        },
      ]
    : []
}

function getPassGateAction(current: BoardState, stack: Stack): StackAction[] {
  if (!isSectorHorizonFinished(current)) {
    return []
  }

  const completion = getGateStackCompletion(
    stack,
    current.cards,
    current.stressCount,
    countSpentShipParts(current.shipPartSlots, 'service-drone-bay', current.currentSector),
    countSpentShipParts(current.shipPartSlots, 'adaptive-control-console', current.currentSector),
  )

  return completion?.isReady
    ? [
        {
          id: 'pass-gate',
          kind: 'pass-gate',
          label: 'Pass gate',
          stackId: stack.id,
        },
      ]
    : []
}

function getRationPackAction(current: BoardState, stack: Stack): StackAction[] {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)
  const card = stack.cardIds.length === 1 ? current.cards[stack.cardIds[0] ?? ''] : undefined

  return fuelDeck && fuelDeck.cards.length > 0 && isDiscoveryEffect(card, 'ration_pack')
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
