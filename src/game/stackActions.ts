import { FUEL_DECK_ID } from './decks'
import { getNextStopFuelDiscount } from './effects'
import {
  getGateStackCompletion,
  getHorizonStackCompletion,
} from './rules'
import { getShipPartLabel } from './shipParts'
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
  | 'use-ship-part'

export type StackAction = {
  id: string
  kind: StackActionKind
  label: string
  stackId: string
  shipPartSlotIndex?: number
}

type WaterPairCrewRole = 'engineer' | 'scientist'

function isBoardActionBlocked(current: BoardState) {
  return Boolean(
    current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice,
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

function stackHasGate(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.some((cardId) => {
    const card = cards[cardId]

    return card?.kind === 'gate' && Boolean(card.gate)
  })
}

function getAvailableShipPartSlotEntries(current: BoardState, stack: Stack) {
  const stackCardIds = new Set(stack.cardIds)

  return current.shipPartSlots.flatMap((slot, index) => (
    slot.status === 'available' && stackCardIds.has(slot.cardId)
      ? [{ slot, index }]
      : []
  ))
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

function getShipPartActions(current: BoardState, stack: Stack): StackAction[] {
  if (!isSectorHorizonFinished(current) || !stackHasGate(stack, current.cards)) {
    return []
  }

  return getAvailableShipPartSlotEntries(current, stack).flatMap(({ slot, index }) => {
    if (slot.shipPart === 'medbay-rehydrator' && current.tiredCardIds.length === 0) {
      return []
    }

    const label = `Use ${getShipPartLabel(slot.shipPart)}`

    return [
      {
        id: `use-ship-part:${index}:${slot.cardId}`,
        kind: 'use-ship-part' as const,
        label,
        stackId: stack.id,
        shipPartSlotIndex: index,
      },
    ]
  })
}

export function getStackActions(current: BoardState, stack: Stack): StackAction[] {
  if (isBoardActionBlocked(current)) {
    return []
  }

  return [
    ...getDrawFuelAction(current, stack),
    ...getTravelAction(current, stack),
    ...getShipPartActions(current, stack),
    ...getPassGateAction(current, stack),
  ]
}

export function canStackForPotentialAction(
  current: BoardState,
  sourceStack: Stack,
  targetStack: Stack,
) {
  if (
    isBoardActionBlocked(current) ||
    !isSectorHorizonFinished(current) ||
    !stackHasGate(targetStack, current.cards)
  ) {
    return false
  }

  const availableSourceSlots = getAvailableShipPartSlotEntries(current, sourceStack)

  return (
    availableSourceSlots.length > 0 &&
    availableSourceSlots.length === sourceStack.cardIds.length
  )
}
