import { FUEL_DECK_ID, FUEL_DISCARD_DECK_ID, SHIP_PART_DECK_ID } from './decks'
import { getMissionAnyIconSurcharge } from './damage'
import { getNextGateFuelDiscount, getNextStopFuelDiscount } from './effects'
import { isGateClearConditionMet } from './blueprints/sectorGates'
import { getShipPartResearchPayment, getWaterPairFuelAmount } from './shipParts'
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
  | 'draft-ship-part'

export type StackAction = {
  id: string
  kind: StackActionKind
  label: string
  attentionKey: string
  stackId: string
}

function createStackAction(action: Omit<StackAction, 'attentionKey'>): StackAction {
  return {
    ...action,
    attentionKey: `${action.id}:${action.label}`,
  }
}

type WaterPairCrewRole = 'mechanic' | 'scientist'

function isBoardActionBlocked(current: BoardState) {
  return Boolean(
      current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice ||
      current.pendingShipPartChoice ||
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

  const specializationSet = new Set<CrewSpecialization>(specializations)

  if (specializationSet.has('engine') && specializationSet.has('life')) {
    return 'mechanic'
  }

  return specializationSet.has('engine') && specializationSet.has('signal') ? 'scientist' : null
}

function hasFuelDrawWaterPair(stack: Stack, cards: Record<string, Card>) {
  if (stack.cardIds.length !== 2) {
    return false
  }

  const roles = stack.cardIds.map((cardId) => getWaterPairCrewRole(cards[cardId]))

  return roles.includes('mechanic') && roles.includes('scientist')
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
  const fuelAmount = getWaterPairFuelAmount(current.shipPartSlots)

  return fuelDeck && (fuelDeck.cards.length > 0 || (fuelDiscard?.cards.length ?? 0) > 0) && hasFuelDrawWaterPair(stack, current.cards)
    ? [
        createStackAction({
          id: 'draw-fuel',
          kind: 'draw-fuel',
          label: `Make ${fuelAmount} fuel`,
          stackId: stack.id,
        }),
      ]
    : []
}

function getTravelAction(current: BoardState, stack: Stack): StackAction[] {
  const completion = getMissionStackCompletion(
    stack,
    current.cards,
    getNextStopFuelDiscount(current.pendingEffects),
    getMissionAnyIconSurcharge(current.cards, current.routeSlots),
    getWaterPairFuelAmount(current.shipPartSlots),
  )

  if (
    completion?.isReady &&
    current.forcedDestinationCardId &&
    current.routeSlots.filter((slot) => slot === null).length <= 1 &&
    completion.missionCardId !== current.forcedDestinationCardId
  ) {
    return []
  }

  if (!completion?.isReady || !current.mapSlots.includes(completion.missionCardId)) {
    return []
  }

  const dynamicFuel = completion.dynamicFuelReward
  const label = dynamicFuel !== undefined && dynamicFuel > 0
    ? `Recover ${dynamicFuel} Fuel`
    : 'Complete'

  return [
    createStackAction({
      id: 'travel',
      kind: 'travel',
      label,
      stackId: stack.id,
    }),
  ]
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
    getWaterPairFuelAmount(current.shipPartSlots),
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
    createStackAction({
      id: 'pass-gate',
      kind: 'pass-gate',
      label: clearsCleanly ? 'Complete sector' : 'Complete sector with damage',
      stackId: stack.id,
    }),
  ]
}

function getRationPackAction(current: BoardState, stack: Stack): StackAction[] {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)
  const fuelDiscard = current.decks.find((deck) => deck.id === FUEL_DISCARD_DECK_ID)
  const card = stack.cardIds.length === 1 ? current.cards[stack.cardIds[0] ?? ''] : undefined

  return fuelDeck && (fuelDeck.cards.length > 0 || (fuelDiscard?.cards.length ?? 0) > 0) && isDiscoveryEffect(card, 'ration_pack')
    ? [
        createStackAction({
          id: 'use-ration',
          kind: 'use-ration',
          label: 'Use ration',
          stackId: stack.id,
        }),
      ]
    : []
}

function getDraftShipPartAction(current: BoardState, stack: Stack): StackAction[] {
  const shipPartDeck = current.decks.find((deck) => deck.id === SHIP_PART_DECK_ID)

  return shipPartDeck && shipPartDeck.cards.length > 0 && getShipPartResearchPayment(stack, current.cards)
    ? [
        createStackAction({
          id: 'draft-ship-part',
          kind: 'draft-ship-part',
          label: 'Draft ship part',
          stackId: stack.id,
        }),
      ]
    : []
}

export function getStackActions(current: BoardState, stack: Stack): StackAction[] {
  if (isBoardActionBlocked(current)) {
    return []
  }

  return [
    ...getRationPackAction(current, stack),
    ...getDraftShipPartAction(current, stack),
    ...getDrawFuelAction(current, stack),
    ...getTravelAction(current, stack),
    ...getPassGateAction(current, stack),
  ]
}
