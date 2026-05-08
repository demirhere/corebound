import { FUEL_DECK_ID, FUEL_DISCARD_DECK_ID, SHIP_PART_DECK_ID } from './decks'
import { getMissionAnyIconSurcharge } from './damage'
import { getMissionScrapReward } from './economyTuning'
import { getNextGateFuelDiscount, getNextStopFuelDiscount } from './effects'
import { applyShipPartMissionEffects, hasShipPartWildSlot } from './shipPartEffects'
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
  ResourceKind,
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

export type StackActionResourceReward = {
  resource: Extract<ResourceKind, 'fuel' | 'scrap'>
  count: number
}

export type StackAction = {
  id: string
  kind: StackActionKind
  label: string
  resourceRewards?: StackActionResourceReward[]
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
      current.pendingResearchChoice ||
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

function getShipPartWildCardId(current: BoardState, stack: Stack) {
  return hasShipPartWildSlot(current.activeShipParts)
    ? stack.cardIds.find((cardId) => current.cards[cardId]?.kind === 'crew') ?? null
    : null
}

function getResourceRewardLabel(resource: StackActionResourceReward['resource']) {
  return resource === 'fuel' ? 'Fuel' : 'Scrap'
}

function getRewardActionLabel(resourceRewards: readonly StackActionResourceReward[]) {
  return resourceRewards.length > 0
    ? `Recover ${resourceRewards.map((reward) => (
        `${reward.count} ${getResourceRewardLabel(reward.resource)}`
      )).join(' + ')}`
    : 'Complete'
}

function getMissionResourceRewards(
  current: BoardState,
  stack: Stack,
  completion: NonNullable<ReturnType<typeof getMissionStackCompletion>>,
) {
  const missionCard = current.cards[completion.missionCardId]
  const find = missionCard?.mission?.find

  if (!missionCard?.mission || !find) {
    return []
  }

  const baseRewards = find.kind === 'visit_reward' ? find.rewards : find.rewards ?? []
  const rewards = missionCard.mission.pattern === 'open' &&
    completion.dynamicFuelReward !== undefined &&
    completion.dynamicFuelReward > 0
    ? [{ kind: 'resource' as const, resource: 'fuel' as const, count: completion.dynamicFuelReward }]
    : baseRewards
  const baseFuelRewardCount = rewards.reduce((count, reward) => (
    reward.kind === 'resource' && reward.resource === 'fuel'
      ? count + reward.count
      : count
  ), 0)
  const missionsCompletedInSector = current.completedStarSummaries.filter(
    (summary) => summary.sector === current.currentSector,
  ).length
  const missionPatternForEffects = missionCard.mission.pattern === 'open'
    ? completion.dynamicPattern ?? null
    : missionCard.mission.pattern ?? null
  const shipPartMissionEffects = applyShipPartMissionEffects(current.activeShipParts, {
    usedCrewCards: getCrewCards(stack, current.cards),
    missionIndexInSector: missionsCompletedInSector,
    isLastMissionInSector: missionsCompletedInSector >= current.mapSlots.length - 1,
    sectorIndex: current.currentSector - 1,
    pattern: missionPatternForEffects,
    scrapsAvailable: current.scraps,
    missionsCompletedBefore: current.missionsCompletedCount,
    lastPatternPlayed: current.lastPatternPlayed,
    patternStreakBefore: current.patternStreakCount,
  })
  const fuelRewardCount = Math.max(0, baseFuelRewardCount + shipPartMissionEffects.fuelDelta)
  const baseMissionScrapReward = getMissionScrapReward(fuelRewardCount)
  const totalMissionScrapDelta = baseMissionScrapReward + shipPartMissionEffects.scrapDelta
  const scrapsAfterMission = Math.max(0, current.scraps + totalMissionScrapDelta)
  const scrapRewardCount = Math.max(0, scrapsAfterMission - current.scraps)
  const resourceRewards: StackActionResourceReward[] = []

  if (fuelRewardCount > 0) {
    resourceRewards.push({ resource: 'fuel', count: fuelRewardCount })
  }

  if (scrapRewardCount > 0) {
    resourceRewards.push({ resource: 'scrap', count: scrapRewardCount })
  }

  return resourceRewards
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
    getShipPartWildCardId(current, stack),
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

  const resourceRewards = getMissionResourceRewards(current, stack, completion)
  const label = getRewardActionLabel(resourceRewards)

  return [
    createStackAction({
      id: 'travel',
      kind: 'travel',
      label,
      resourceRewards,
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
