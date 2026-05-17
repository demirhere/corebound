import {
  CREW_QUARTERS_DECK_ID,
  FUEL_DECK_ID,
  FUEL_DISCARD_DECK_ID,
  SHIP_PART_DECK_ID,
} from './decks'
import { getMissionAnyIconSurcharge } from './damage'
import { CREW_QUARTERS_UPGRADE_COST } from './crewQuartersCatalog'
import { getMissionScrapReward } from './economyTuning'
import { getNextGateFuelDiscount, getNextStopFuelDiscount } from './effects'
import {
  hasShipPartWildSlot,
} from './shipPartEffects'
import {
  findBestOpenMissionPatternReward,
  getCrewQuartersUpgradePreview,
  isCrewQuartersUpgradeAtLimit,
} from './patternRewards'
import { isGateClearConditionMet } from './blueprints/sectorGates'
import { getMissionPatternLabel } from './rules'
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
  | 'research-crew-quarters'
  | 'upgrade-crew-quarters'
  | 'cancel-mission'

export type StackActionResourceReward = {
  resource: Extract<ResourceKind, 'fuel' | 'scrap'>
  count: number
}

export type StackAction = {
  id: string
  kind: StackActionKind
  label: string
  resourceRewards?: StackActionResourceReward[]
  resourceBonus?: StackActionResourceReward
  actionVerb?: string
  disabled?: boolean
  variant?: 'crew-limit'
  attentionKey: string
  stackId: string
}

export const CANCEL_MISSION_SCRAP_REWARD = 3

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

  const missionsCompletedInSector = current.completedStarSummaries.filter(
    (summary) => summary.sector === current.currentSector,
  ).length
  const usedCrewCards = getCrewCards(stack, current.cards)
  const bestOpenPatternReward = missionCard.mission.pattern === 'open'
    ? findBestOpenMissionPatternReward({
      crewCardIds: usedCrewCards.map((card) => card.id),
      cards: current.cards,
      wildCardId: getShipPartWildCardId(current, stack),
      activeShipParts: current.activeShipParts,
      activeCrewQuarters: current.activeCrewQuarters,
      usedCrewCards,
      missionIndexInSector: missionsCompletedInSector,
      isLastMissionInSector: missionsCompletedInSector >= current.mapSlots.length - 1,
      sectorIndex: current.currentSector - 1,
      scrapsAvailable: current.scraps,
      missionsCompletedBefore: current.missionsCompletedCount,
      lastPatternPlayed: current.lastPatternPlayed,
      patternStreakBefore: current.patternStreakCount,
    })
    : null
  const baseRewards = find.kind === 'visit_reward' ? find.rewards : find.rewards ?? []
  const rewards = missionCard.mission.pattern === 'open' && bestOpenPatternReward
    ? [{ kind: 'resource' as const, resource: 'fuel' as const, count: bestOpenPatternReward.baseFuel }]
    : baseRewards
  const baseFuelRewardCount = rewards.reduce((count, reward) => (
    reward.kind === 'resource' && reward.resource === 'fuel'
      ? count + reward.count
      : count
  ), 0)
  const fuelRewardCount = bestOpenPatternReward?.fuelReward ?? baseFuelRewardCount
  const shipPartMissionEffects = bestOpenPatternReward?.shipPartMissionEffects ?? { fuelDelta: 0, scrapDelta: 0 }
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
      label: clearsCleanly ? 'Complete sector & reshuffle crew' : 'Complete sector with damage',
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

// Stack of exactly CREW_QUARTERS_UPGRADE_COST (=4) Scrap cards — pressing the
// action discards them and deals a Crew Quarters Upgrade card from the
// offscreen deck onto the board. Hidden at 5+ scraps so manual drag-stacked
// piles can't auto-trigger; auto-stacking normally caps piles at 4.
function getResearchCrewQuartersAction(current: BoardState, stack: Stack): StackAction[] {
  if (stack.cardIds.length !== CREW_QUARTERS_UPGRADE_COST) return []
  const allScrap = stack.cardIds.every((cardId) => {
    const card = current.cards[cardId]
    return card?.kind === 'resource' && card.resource === 'scrap'
  })
  if (!allScrap) return []
  const cquDeck = current.decks.find((deck) => deck.id === CREW_QUARTERS_DECK_ID)
  if (!cquDeck || cquDeck.cards.length === 0) return []
  return [
    createStackAction({
      id: 'research-crew-quarters',
      kind: 'research-crew-quarters',
      label: 'Upgrade Crew Quarters',
      stackId: stack.id,
    }),
  ]
}

// Stack of a single Crew Quarters Upgrade card + 1-4 crew that satisfy an
// exact-count mission pattern. The action label previews the upgrade target.
function getUpgradeCrewQuartersAction(current: BoardState, stack: Stack): StackAction[] {
  if (stack.cardIds.length < 2 || stack.cardIds.length > 5) return []
  let cquCardId: string | null = null
  const crewCardIds: string[] = []
  for (const cardId of stack.cardIds) {
    const card = current.cards[cardId]
    if (!card) return []
    if (card.kind === 'crew-quarters') {
      if (cquCardId) return []
      cquCardId = card.id
    } else if (card.kind === 'crew') {
      crewCardIds.push(card.id)
    } else {
      return []
    }
  }
  if (!cquCardId || crewCardIds.length === 0 || crewCardIds.length > 4) return []
  const preview = getCrewQuartersUpgradePreview({
    crewCardIds,
    cards: current.cards,
    activeShipParts: current.activeShipParts,
    activeCrewQuarters: current.activeCrewQuarters,
  })
  if (!preview) {
    if (!isCrewQuartersUpgradeAtLimit({
      crewCardIds,
      cards: current.cards,
      activeShipParts: current.activeShipParts,
      activeCrewQuarters: current.activeCrewQuarters,
    })) {
      return []
    }

    return [
      createStackAction({
        id: 'upgrade-crew-quarters-limit',
        kind: 'upgrade-crew-quarters',
        label: 'This crew at limit',
        disabled: true,
        variant: 'crew-limit',
        stackId: stack.id,
      }),
    ]
  }

  return [
    createStackAction({
      id: 'upgrade-crew-quarters',
      kind: 'upgrade-crew-quarters',
      label: `Upgrade ${getMissionPatternLabel(preview.pattern)}`,
      resourceBonus: { resource: 'fuel', count: 1 },
      stackId: stack.id,
    }),
  ]
}


// Solo fuel-mission card on the map can be salvaged for 3 Scraps. Useful
// when the player drew a mission the current hand can't reasonably clear.
// Hidden once any crew is stacked onto it — that stack is a travel attempt.
// The forced-destination mission cannot be cancelled.
function getCancelMissionAction(current: BoardState, stack: Stack): StackAction[] {
  if (stack.cardIds.length !== 1) return []
  const cardId = stack.cardIds[0]
  if (!cardId) return []
  const card = current.cards[cardId]
  if (card?.kind !== 'mission' || card.mission?.pattern !== 'open') return []
  if (!current.mapSlots.includes(card.id)) return []
  if (current.forcedDestinationCardId === card.id) return []
  return [
    createStackAction({
      id: 'cancel-mission',
      kind: 'cancel-mission',
      label: `Cancel ${CANCEL_MISSION_SCRAP_REWARD} Scrap`,
      actionVerb: 'Cancel',
      resourceRewards: [{ resource: 'scrap', count: CANCEL_MISSION_SCRAP_REWARD }],
      stackId: stack.id,
    }),
  ]
}

export function getStackActions(current: BoardState, stack: Stack): StackAction[] {
  if (isBoardActionBlocked(current)) {
    return []
  }

  return [
    ...getRationPackAction(current, stack),
    ...getDraftShipPartAction(current, stack),
    ...getResearchCrewQuartersAction(current, stack),
    ...getUpgradeCrewQuartersAction(current, stack),
    ...getCancelMissionAction(current, stack),
    ...getDrawFuelAction(current, stack),
    ...getTravelAction(current, stack),
    ...getPassGateAction(current, stack),
  ]
}
