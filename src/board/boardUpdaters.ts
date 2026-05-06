import {
  CRYO_DECK_ID,
  DISCOVERY_DECK_ID,
  DRIFT_DECK_ID,
  FUEL_DECK_ID,
  HORIZON_DECK_ID,
  MOTHER_DECK_ID,
  canManuallyDrawDeck,
  manualDeckDraw,
} from '../game/decks'
import {
  applyPendingEffectsToDrawnCard,
  consumeDeckDrawModifiers,
  consumeNextStopFuelDiscount,
  createBoardEffectsForVisitRewards,
  getNextStopFuelDiscount,
  getPendingDrawCount,
} from '../game/effects'
import {
  clampStackPosition,
  getDeckDrawPositions,
  getNearbyDrawPosition,
} from './interactionGeometry'
import {
  countPotentialGateShipParts,
  countShipParts,
  countSpentShipParts,
  createEmptyMapSlots,
  createEmptyRouteSlots,
  getMapStackId,
  getMapStackPosition,
  getRouteCardIds,
  getRouteStackId,
  getRouteStackPosition,
  isRouteFilled,
  stackContainsRouteCard,
  stackContainsOnlyRouteCards,
} from './routeState'
import {
  cardDrawnEvent,
  cardFlippedEvent,
  cardsDiscardedEvent,
  cardsMovedToHandEvent,
  cardsReturnedToDeckEvent,
  cardsStackedEvent,
  deckCreatedFromStacksEvent,
  decksMergedEvent,
  discoveryEarnedEvent,
  discoveryMissedEvent,
  driftDeckReshuffledEvent,
  driftResolvedEvent,
  gameLostEvent,
  gateCompletedEvent,
  gateCrewSlotsCheckedEvent,
  gateCrewStateBeforeEvent,
  gateIconsCheckedEvent,
  handCardDroppedEvent,
  horizonCompletedEvent,
  mapInitializedEvent,
  motherCommittedEvent,
  motherReturnedUnusedEvent,
  motherSpentEvent,
  mapRefilledEvent,
  readyRewardAppliedEvent,
  routeArchivedEvent,
  roundEndCrewReadiedEvent,
  scoutUsedEvent,
  sectorRevealedEvent,
  shipPartAvailableEvent,
  shipPartSpentEvent,
  stackActionCompletedEvent,
  stackSplitEvent,
  stressClearedEvent,
  starsCompletedSummaryEvent,
  stopMovedToRouteEvent,
  stressAddedEvent,
  stressThresholdActiveEvent,
  turnEndedEvent,
  wakeCrewRecruitedEvent,
} from '../game/logEvents'
import type { PlaytestLogEvent } from '../game/playtestLog'
import {
  canCombineAsDeck,
  canMergeDecks,
  canStackCards,
  cardsToDeckBlueprints,
  countGateHazardSkipDiscoveries,
  countGateStressClearDiscoveries,
  countUsableMotherCardsInPlay,
  getGateStackCompletion,
  getHorizonStackCompletion,
  getMissingNeedIcons,
  getUsableMotherCardIdsInPlay,
  isFaceDownStack,
  isUsableMotherCard,
  withoutCards,
  type MotherCoveredIcon,
} from '../game/rules'
import {
  getStackActions,
} from '../game/stackActions'
import { withPlaytestEvents, type BoardUpdater } from '../game/state'
import {
  canTravelToAnyVisibleHorizon,
  getDeckCardCount,
  getReadyCrewCardIds,
  shouldDrawMissionsBeforeEndTurn,
} from '../game/boardQueries'
import {
  FUEL_SUPPLY_STACK_ID,
  FUEL_SUPPLY_STACK_POSITION,
  MAP_SLOT_COUNT,
  MOTHER_SUPPLY_STACK_ID,
  MOTHER_SUPPLY_STACK_POSITION,
  SECTOR_GATE_STACK_POSITION,
  createDriftDeckCards,
  createSectorHorizonDeckCards,
  getSectorDeckArt,
  getSectorDeckTitle,
  getSectorGateBlueprint,
} from '../game/setup'
import type {
  BoardMetrics,
  BoardState,
  Card,
  CardBlueprint,
  Deck,
  DropTarget,
  GameLossReason,
  HandZone,
  RequirementIconKind,
  ShipPartKind,
  Stack,
} from '../game/types'
import {
  canPutCardIdsInHand,
  canUseManualHandZone,
  getCardHandZone,
  removeCardFromHandZones,
} from './handState'
import { clamp } from '../game/geometry'
import { getOwnedHandCardOwnerId } from '../game/players'

type Position = {
  x: number
  y: number
}

function createCardFromBlueprint(blueprint: CardBlueprint, id: string, faceUp = true): Card {
  return {
    ...blueprint,
    id,
    faceUp,
  }
}

type ActivateStackDragUpdateArgs = {
  stackId: string
  cardId: string
  cardIndex: number
  activeId: string
  startX: number
  startY: number
}

function getSpentCrewCardIds(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.filter((cardId) => cards[cardId]?.kind === 'crew')
}

function getUsableMotherCardIds(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.filter((cardId) => isUsableMotherCard(cards[cardId]))
}

function getSpentMotherCardIds(stack: Stack, cards: Record<string, Card>, count: number) {
  return getUsableMotherCardIds(stack, cards).slice(0, count)
}

function createMotherCommittedEvents(
  cards: Record<string, Card>,
  cardIds: readonly string[],
  actionCard: Card,
  coveredIcons: readonly MotherCoveredIcon[],
) {
  return cardIds.flatMap((cardId, index) => {
    const card = cards[cardId]

    return card?.kind === 'mother'
      ? [motherCommittedEvent(card, actionCard, coveredIcons[index] ?? null)]
      : []
  })
}

function createMotherSpentEvents(
  cards: Record<string, Card>,
  cardIds: readonly string[],
  stressCountBefore: number,
  actionCard: Card,
) {
  const events: PlaytestLogEvent[] = []
  let stressCount = stressCountBefore

  for (const cardId of cardIds) {
    const card = cards[cardId]

    if (card?.kind !== 'mother') {
      continue
    }

    const previousStress = stressCount
    stressCount += 1
    events.push(motherSpentEvent(card, stressCount))
    events.push(stressAddedEvent(`${actionCard.title}: MOTHER spent`, previousStress, stressCount))

  }

  return events
}

function getDiscoveryCardIds(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.filter((cardId) => cards[cardId]?.kind === 'discovery')
}

function getMissionDiscoveryRecipientId(
  current: BoardState,
  spentCrewCardIds: readonly string[],
  missionLeadId: string | null,
) {
  const crewCountsByPlayer = new Map<string, number>()

  for (const cardId of spentCrewCardIds) {
    const ownerId = current.crewOwnerIds[cardId]

    if (ownerId) {
      crewCountsByPlayer.set(ownerId, (crewCountsByPlayer.get(ownerId) ?? 0) + 1)
    }
  }

  const fallbackPlayerId = missionLeadId ?? current.players[0]?.id ?? null
  const highestCrewCount = Math.max(0, ...crewCountsByPlayer.values())

  if (highestCrewCount === 0) {
    return fallbackPlayerId
  }

  const leaders = current.players.filter((player) => (
    (crewCountsByPlayer.get(player.id) ?? 0) === highestCrewCount
  ))

  return leaders.length === 1 ? leaders[0]?.id ?? fallbackPlayerId : fallbackPlayerId
}

function drawDiscoveryForPlayer(
  decks: Deck[],
  cards: Record<string, Card>,
  nextCardId: number,
  deckZ: number,
  ownerId: string | null,
) {
  const discoveryDeck = decks.find((deck) => deck.id === DISCOVERY_DECK_ID) ?? null
  const discoveryBlueprint = discoveryDeck?.cards[0]

  if (!discoveryDeck || !discoveryBlueprint || !ownerId) {
    return {
      cards,
      decks,
      nextCardId,
      discoveryCard: null,
      discoveryDeck,
    }
  }

  const discoveryCard = createCardFromBlueprint(discoveryBlueprint, `discovery-${nextCardId}`)

  return {
    cards: {
      ...cards,
      [discoveryCard.id]: discoveryCard,
    },
    decks: decks.map((deck) =>
      deck.id === DISCOVERY_DECK_ID
        ? { ...deck, cards: deck.cards.slice(1), z: deckZ }
        : deck,
    ),
    nextCardId: nextCardId + 1,
    discoveryCard,
    discoveryDeck,
  }
}

function returnMotherCardsToDeck(
  current: BoardState,
  cardIds: readonly string[],
  sourceStackId: string,
  reason: string,
): { board: BoardState; events: PlaytestLogEvent[] } {
  const motherDeck = current.decks.find((deck) => deck.id === MOTHER_DECK_ID)
  const returnCardIds = Array.from(new Set(cardIds)).filter((cardId) =>
    isUsableMotherCard(current.cards[cardId]),
  )

  if (!motherDeck || returnCardIds.length === 0) {
    return { board: current, events: [] }
  }

  const returnedCards = cardsToDeckBlueprints(returnCardIds, current.cards)

  if (returnedCards.length !== returnCardIds.length) {
    return { board: current, events: [] }
  }

  const returnCardIdSet = new Set(returnCardIds)
  const sourceStack = current.stacks.find((stack) => stack.id === sourceStackId)
  const eventStack = {
    id: sourceStack?.id ?? sourceStackId,
    cardIds: returnCardIds,
    x: sourceStack?.x ?? motherDeck.x,
    y: sourceStack?.y ?? motherDeck.y,
    z: sourceStack?.z ?? motherDeck.z,
  }

  return {
    board: {
      ...current,
      cards: withoutCards(current.cards, returnCardIds),
      stacks: current.stacks.flatMap((stack) => {
        const nextCardIds = stack.cardIds.filter((cardId) => !returnCardIdSet.has(cardId))

        return nextCardIds.length > 0 ? [{ ...stack, cardIds: nextCardIds }] : []
      }),
      decks: current.decks.map((deck) =>
        deck.id === MOTHER_DECK_ID
          ? { ...deck, cards: [...returnedCards, ...deck.cards] }
          : deck,
      ),
    },
    events: [
      ...returnCardIds.flatMap((cardId) => {
        const card = current.cards[cardId]

        return card?.kind === 'mother'
          ? [motherReturnedUnusedEvent(card, reason)]
          : []
      }),
      cardsReturnedToDeckEvent(eventStack, motherDeck, current.cards),
    ],
  }
}

function markMotherCardsSpent(cards: Record<string, Card>, cardIds: readonly string[]) {
  const nextCards = { ...cards }

  for (const cardId of cardIds) {
    const card = nextCards[cardId]

    if (card?.kind === 'mother') {
      nextCards[cardId] = { ...card, spentMother: true }
    }
  }

  return nextCards
}

function drawWakeChoiceCards(
  decks: Deck[],
  cards: Record<string, Card>,
  nextCardId: number,
  remaining: number,
  deckZ: number,
  playerId: string | null,
) {
  const cryoDeck = decks.find((deck) => deck.id === CRYO_DECK_ID)
  const choiceBlueprints = cryoDeck?.cards.slice(0, Math.min(2, cryoDeck.cards.length)) ?? []

  if (remaining <= 0 || choiceBlueprints.length === 0) {
    return {
      cards,
      decks,
      nextCardId,
      pendingWakeChoice: null,
    }
  }

  const nextCards = { ...cards }
  const choiceCardIds: string[] = []
  let updatedNextCardId = nextCardId

  for (const blueprint of choiceBlueprints) {
    const card = {
      ...blueprint,
      id: `wake-${updatedNextCardId}`,
      faceUp: true,
    }

    updatedNextCardId += 1
    nextCards[card.id] = card
    choiceCardIds.push(card.id)
  }

  return {
    cards: nextCards,
    decks: decks.map((deck) =>
      deck.id === CRYO_DECK_ID
        ? { ...deck, cards: deck.cards.slice(choiceBlueprints.length), z: deckZ }
        : deck,
    ),
    nextCardId: updatedNextCardId,
    pendingWakeChoice: {
      remaining,
      choiceCardIds,
      playerId,
    },
  }
}

function drawScoutChoiceCards(
  decks: Deck[],
  cards: Record<string, Card>,
  nextCardId: number,
  count: number,
  deckZ: number,
) {
  const horizonDeck = decks.find((deck) => deck.id === HORIZON_DECK_ID)
  const choiceBlueprints = horizonDeck?.cards.slice(0, Math.min(count, horizonDeck.cards.length)) ?? []

  if (count <= 0 || choiceBlueprints.length === 0) {
    return {
      cards,
      decks,
      nextCardId,
      pendingScoutChoice: null,
    }
  }

  const nextCards = { ...cards }
  const choiceCardIds: string[] = []
  let updatedNextCardId = nextCardId

  for (const blueprint of choiceBlueprints) {
    const card = {
      ...blueprint,
      id: `scout-${updatedNextCardId}`,
      faceUp: true,
    }

    updatedNextCardId += 1
    nextCards[card.id] = card
    choiceCardIds.push(card.id)
  }

  return {
    cards: nextCards,
    decks: decks.map((deck) =>
      deck.id === HORIZON_DECK_ID
        ? { ...deck, cards: deck.cards.slice(choiceBlueprints.length), z: deckZ }
        : deck,
    ),
    nextCardId: updatedNextCardId,
    pendingScoutChoice: {
      choiceCardIds,
      keptCardId: null,
      bottomedCardIds: [],
    },
  }
}

function getSectorGateStack(current: BoardState) {
  for (const stack of current.stacks) {
    for (const cardId of stack.cardIds) {
      const card = current.cards[cardId]

      if (card?.kind === 'gate' && card.gate) {
        return { stack, gateCard: card }
      }
    }
  }

  return null
}

function getSectorGateCard(current: BoardState) {
  return getSectorGateStack(current)?.gateCard ?? null
}

const gateRequirementIconKinds = ['life', 'star', 'engine', 'signal'] as const

function createGateRequirementIconCounts() {
  return {
    life: 0,
    star: 0,
    engine: 0,
    signal: 0,
  } satisfies Record<RequirementIconKind, number>
}

function getPotentialCrewDiscoveryIcon(card: Card | undefined): RequirementIconKind | null {
  if (card?.kind !== 'discovery' || card.discovery?.tag !== 'crew') {
    return null
  }

  return card.discovery.icon ?? null
}

function countAvailableDiscoveryEffect(current: BoardState, effectKind: string) {
  return Object.values(current.cards).reduce((count, card) => (
    card.kind === 'discovery' && card.discovery?.effectKind === effectKind
      ? count + 1
      : count
  ), 0)
}

function getPotentialGateCrewCardIds(current: BoardState) {
  const availableMedbayRehydrators = countShipParts(current.shipPartSlots, 'medbay-rehydrator', ['available'])
  const readyCrewCardIds = getReadyCrewCardIds(current)
  const potentiallyReadiedCrewCardIds = current.tiredCardIds
    .filter((cardId) => current.cards[cardId]?.kind === 'crew')
    .slice(0, availableMedbayRehydrators)

  return [...readyCrewCardIds, ...potentiallyReadiedCrewCardIds]
}

function canCoverGateIconsWithPotentialSupport(
  current: BoardState,
  crewCardIds: readonly string[],
  requiredIcons: readonly RequirementIconKind[],
  availableControlConsoleCount: number,
  availableMotherCardCount: number,
) {
  const availableIconCounts = createGateRequirementIconCounts()
  const requiredIconCounts = createGateRequirementIconCounts()

  for (const cardId of crewCardIds) {
    const card = current.cards[cardId]

    if (card?.kind !== 'crew') {
      continue
    }

    for (const specialization of card.specializations ?? []) {
      availableIconCounts[specialization] += 1
    }
  }

  if (crewCardIds.length > 0) {
    for (const card of Object.values(current.cards)) {
      const icon = getPotentialCrewDiscoveryIcon(card)

      if (icon) {
        availableIconCounts[icon] += 1
      }
    }
  }

  for (const icon of requiredIcons) {
    requiredIconCounts[icon] += 1
  }

  const missingIconCount = gateRequirementIconKinds.reduce((count, icon) => (
    count + Math.max(0, requiredIconCounts[icon] - availableIconCounts[icon])
  ), 0)
  const motherIconCoverage = crewCardIds.length > 0 ? availableMotherCardCount : 0

  return missingIconCount <= availableControlConsoleCount + motherIconCoverage
}

function canCompleteSectorGate(current: BoardState) {
  const gateCard = getSectorGateCard(current)

  if (!gateCard?.gate || !gateCard.faceUp) {
    return false
  }

  const potentialCrewCardIds = getPotentialGateCrewCardIds(current)
  const usableMotherCardsInPlay = countUsableMotherCardsInPlay(current.stacks, current.cards)
  const availableMotherCardCount = usableMotherCardsInPlay + getDeckCardCount(current, MOTHER_DECK_ID)
  const availableServiceDroneBayCount = countPotentialGateShipParts(
    current.shipPartSlots,
    'service-drone-bay',
    current.currentSector,
  )
  const availableControlConsoleCount = countPotentialGateShipParts(
    current.shipPartSlots,
    'adaptive-control-console',
    current.currentSector,
  )
  const stressClearCount = countAvailableDiscoveryEffect(current, 'gate_clear_stress')
  const hazardSkipCount = countAvailableDiscoveryEffect(current, 'gate_skip_hazard')
  const effectiveStressCount = Math.max(0, current.stressCount - stressClearCount)
  const extraHumanCrewRequired = effectiveStressCount >= gateCard.gate.motherPenalty.threshold
    ? Math.max(0, gateCard.gate.motherPenalty.extraHumanCrew - hazardSkipCount)
    : 0
  const requiredCrewSlots = Math.max(
    0,
    gateCard.gate.need.crew + extraHumanCrewRequired - availableServiceDroneBayCount,
  )

  return (
    potentialCrewCardIds.length >= requiredCrewSlots &&
    canCoverGateIconsWithPotentialSupport(
      current,
      potentialCrewCardIds,
      gateCard.gate.need.icons,
      availableControlConsoleCount,
      availableMotherCardCount,
    )
  )
}

function resolveLoss(current: BoardState, reason: GameLossReason) {
  if (current.hasArrived || current.lossReason) {
    return { board: current, events: [] }
  }

  return {
    board: {
      ...current,
      lossReason: reason,
      pendingWakeChoice: null,
      pendingScoutChoice: null,
      pendingDrift: null,
      dropTargetStackId: null,
      dropTargetDeckId: null,
    },
    events: [gameLostEvent(reason)],
  }
}

function isSectorHorizonFinished(current: BoardState) {
  return isRouteFilled(current.routeSlots)
}

function resolveGateLossIfNeeded(current: BoardState) {
  const gateCard = getSectorGateCard(current)

  if (
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    current.pendingDrift ||
    !isSectorHorizonFinished(current) ||
    !gateCard ||
    !gateCard.faceUp ||
    canCompleteSectorGate(current)
  ) {
    return { board: current, events: [] }
  }

  const loss = resolveLoss(current, 'gate-failed')

  return {
    board: loss.board,
    events: [
      gateCrewStateBeforeEvent(current.cards, getReadyCrewCardIds(current), current.tiredCardIds),
      ...loss.events,
    ],
  }
}

function getVisibleHorizonCardIds(current: BoardState) {
  return current.mapSlots.flatMap((cardId) => {
    const card = cardId ? current.cards[cardId] : null

    return card?.kind === 'horizon' ? [card.id] : []
  })
}

function resolveSectorStrandedLossIfNeeded(current: BoardState) {
  const visibleHorizonCardIds = getVisibleHorizonCardIds(current)
  const hasVisibleHorizon = visibleHorizonCardIds.length > 0
  const canProduceOrVisitHorizon = hasVisibleHorizon
    ? canTravelToAnyVisibleHorizon(current)
    : getDeckCardCount(current, HORIZON_DECK_ID) > 0

  if (
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    current.pendingDrift ||
    isSectorHorizonFinished(current) ||
    canProduceOrVisitHorizon
  ) {
    return { board: current, events: [] }
  }

  return resolveLoss(current, 'sector-stranded')
}

function readyTiredCrew(
  handCardIds: readonly string[],
  tiredCardIds: readonly string[],
  count: number,
) {
  const readiedCrewCardIds = tiredCardIds.slice(0, count)

  return {
    handCardIds: [...handCardIds, ...readiedCrewCardIds],
    tiredCardIds: tiredCardIds.slice(readiedCrewCardIds.length),
    readiedCrewCardIds,
  }
}

function removeRoundStartTiredCardIds(current: BoardState, cardIds: readonly string[]) {
  if (cardIds.length === 0) {
    return current.roundStartTiredCardIds
  }

  const cardIdSet = new Set(cardIds)

  return current.roundStartTiredCardIds.filter((cardId) => !cardIdSet.has(cardId))
}

function getAvailableShipPartSlotIndices(current: BoardState, shipPart: ShipPartKind) {
  return current.shipPartSlots.flatMap((slot, index) => (
    slot.shipPart === shipPart && slot.status === 'available'
      ? [index]
      : []
  ))
}

function applyAutomaticGateShipParts(current: BoardState) {
  const gateCard = getSectorGateCard(current)

  if (
    !gateCard?.gate ||
    !isSectorHorizonFinished(current) ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    current.pendingDrift
  ) {
    return { board: current, events: [] as PlaytestLogEvent[] }
  }

  const requiredCrewSlots = gateCard.gate.need.crew + (
    current.stressCount >= gateCard.gate.motherPenalty.threshold
      ? gateCard.gate.motherPenalty.extraHumanCrew
      : 0
  )
  const medbaySlotIndices = getAvailableShipPartSlotIndices(current, 'medbay-rehydrator')
    .slice(0, current.tiredCardIds.length)
  const serviceDroneSlotIndices = getAvailableShipPartSlotIndices(current, 'service-drone-bay')
    .slice(0, Math.max(
      0,
      requiredCrewSlots - countSpentShipParts(
        current.shipPartSlots,
        'service-drone-bay',
        current.currentSector,
      ),
    ))
  const controlConsoleSlotIndices = getAvailableShipPartSlotIndices(current, 'adaptive-control-console')
    .slice(0, Math.max(
      0,
      gateCard.gate.need.icons.length - countSpentShipParts(
        current.shipPartSlots,
        'adaptive-control-console',
        current.currentSector,
      ),
    ))
  const spentSlotIndexSet = new Set([
    ...medbaySlotIndices,
    ...serviceDroneSlotIndices,
    ...controlConsoleSlotIndices,
  ])

  if (spentSlotIndexSet.size === 0) {
    return { board: current, events: [] as PlaytestLogEvent[] }
  }

  const readyResult = medbaySlotIndices.length > 0
    ? readyTiredCrew(current.handCardIds, current.tiredCardIds, medbaySlotIndices.length)
    : null

  return {
    board: {
      ...current,
      shipPartSlots: current.shipPartSlots.map((slot, index) => (
        spentSlotIndexSet.has(index)
          ? { ...slot, status: 'spent' as const, spentSector: current.currentSector }
          : slot
      )),
      handCardIds: readyResult?.handCardIds ?? current.handCardIds,
      tiredCardIds: readyResult?.tiredCardIds ?? current.tiredCardIds,
      roundStartTiredCardIds: readyResult
        ? removeRoundStartTiredCardIds(current, readyResult.readiedCrewCardIds)
        : current.roundStartTiredCardIds,
    },
    events: Array.from(spentSlotIndexSet).flatMap((index) => {
      const shipPartSlot = current.shipPartSlots[index]
      const routeCard = shipPartSlot ? current.cards[shipPartSlot.cardId] : null

      return shipPartSlot && routeCard
        ? [shipPartSpentEvent(routeCard, shipPartSlot.routeSlotIndex, shipPartSlot.shipPart)]
        : []
    }),
  }
}

function isFuelResourceCard(card: Card | undefined) {
  return card?.kind === 'resource' && card.resource === 'fuel'
}

function canManuallyFlipCard(card: Card | undefined) {
  return card?.kind === 'gate' && Boolean(card.gate)
}

function findFuelSupplyStack(stacks: readonly Stack[], cards: Record<string, Card>) {
  return stacks.find(
    (stack) => stack.cardIds.length > 0 && stack.cardIds.every((cardId) => isFuelResourceCard(cards[cardId])),
  )
}

function placeFuelCardsInSupplyStack(
  stacks: readonly Stack[],
  cards: Record<string, Card>,
  fuelCards: readonly Card[],
  z: number,
  metrics: BoardMetrics,
) {
  const [firstFuelCard] = fuelCards

  if (!firstFuelCard) {
    return [...stacks]
  }

  const fuelStack = findFuelSupplyStack(stacks, cards)

  if (fuelStack) {
    const fuelCardIds = fuelCards.map((card) => card.id)

    return stacks.map((stack) =>
      stack.id === fuelStack.id
        ? { ...stack, cardIds: [...stack.cardIds, ...fuelCardIds], z }
        : stack,
    )
  }

  const position = clampStackPosition(
    FUEL_SUPPLY_STACK_POSITION.x,
    FUEL_SUPPLY_STACK_POSITION.y,
    fuelCards.length,
    metrics,
  )

  return [
    ...stacks,
    {
      id: stacks.some((stack) => stack.id === FUEL_SUPPLY_STACK_ID)
        ? `stack-${firstFuelCard.id}`
        : FUEL_SUPPLY_STACK_ID,
      cardIds: fuelCards.map((card) => card.id),
      x: position.x,
      y: position.y,
      z,
    },
  ]
}

function findMotherSupplyStack(stacks: readonly Stack[], cards: Record<string, Card>) {
  return stacks.find(
    (stack) => stack.cardIds.length > 0 && stack.cardIds.every((cardId) => isUsableMotherCard(cards[cardId])),
  )
}

function placeMotherCardsInSupplyStack(
  stacks: readonly Stack[],
  cards: Record<string, Card>,
  motherCards: readonly Card[],
  z: number,
  metrics: BoardMetrics,
) {
  const [firstMotherCard] = motherCards

  if (!firstMotherCard) {
    return { stacks: [...stacks], targetStack: null }
  }

  const motherStack = findMotherSupplyStack(stacks, cards)

  if (motherStack) {
    const motherCardIds = motherCards.map((card) => card.id)
    const targetStack = {
      ...motherStack,
      cardIds: [...motherStack.cardIds, ...motherCardIds],
      z,
    }

    return {
      stacks: stacks.map((stack) => stack.id === motherStack.id ? targetStack : stack),
      targetStack,
    }
  }

  const position = clampStackPosition(
    MOTHER_SUPPLY_STACK_POSITION.x,
    MOTHER_SUPPLY_STACK_POSITION.y,
    motherCards.length,
    metrics,
  )
  const targetStack = {
    id: stacks.some((stack) => stack.id === MOTHER_SUPPLY_STACK_ID)
      ? `stack-${firstMotherCard.id}`
      : MOTHER_SUPPLY_STACK_ID,
    cardIds: motherCards.map((card) => card.id),
    x: position.x,
    y: position.y,
    z,
  }

  return {
    stacks: [...stacks, targetStack],
    targetStack,
  }
}

function removeCardIdsFromStacks(stacks: readonly Stack[], cardIds: readonly string[]) {
  const removedCardIds = new Set(cardIds)

  if (removedCardIds.size === 0) {
    return [...stacks]
  }

  return stacks.flatMap((stack) => {
    const keptCardIds = stack.cardIds.filter((cardId) => !removedCardIds.has(cardId))

    return keptCardIds.length > 0
      ? [{ ...stack, cardIds: keptCardIds }]
      : []
  })
}

function getNextTurnPlayerIndex(current: BoardState) {
  const playerCount = current.players.length

  return playerCount > 0
    ? (current.turnPlayerIndex + 1) % playerCount
    : 0
}

function isFinalTurnOfRound(current: BoardState) {
  return current.players.length <= 1 || current.turnPlayerIndex >= current.players.length - 1
}

function advanceTurn(current: BoardState) {
  const nextTurnPlayerIndex = getNextTurnPlayerIndex(current)

  return {
    ...current,
    turnNumber: current.turnNumber + 1,
    turnPlayerIndex: nextTurnPlayerIndex,
    currentPlayerId: current.players[nextTurnPlayerIndex]?.id ?? null,
    sectorDrawnThisTurn: false,
    traveledThisTurn: false,
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }
}

function advanceTurnAndCheckLoss(current: BoardState) {
  const advancedBoard = advanceTurn(current)
  const loss = resolveSectorStrandedLossIfNeeded(advancedBoard)

  return {
    board: loss.board,
    events: [
      turnEndedEvent(current.turnNumber, advancedBoard.turnNumber),
      ...loss.events,
    ],
  }
}

function getDrawnMapStackId(stacks: readonly Stack[], slotIndex: number, cardId: string) {
  const preferredStackId = getMapStackId(slotIndex)

  return stacks.some((stack) => stack.id === preferredStackId)
    ? `${preferredStackId}-${cardId}`
    : preferredStackId
}

function getDrawnRouteStackId(stacks: readonly Stack[], slotIndex: number, cardId: string) {
  const preferredStackId = getRouteStackId(slotIndex)

  return stacks.some((stack) => stack.id === preferredStackId)
    ? `${preferredStackId}-${cardId}`
    : preferredStackId
}

function drawNextMapChoices(current: BoardState) {
  const horizonDeck = current.decks.find((deck) => deck.id === HORIZON_DECK_ID)
  const blueprints = horizonDeck?.cards.slice(0, MAP_SLOT_COUNT) ?? []
  const discardedMapCardIds = getVisibleHorizonCardIds(current)
  const isInitialMapOffer = discardedMapCardIds.length === 0 && current.routeSlots.every((slot) => slot === null)
  const baseStacks = removeCardIdsFromStacks(current.stacks, discardedMapCardIds)
  const drawnMapCards: Card[] = []
  let nextCardId = current.nextCardId

  for (const [index, blueprint] of blueprints.entries()) {
    drawnMapCards.push(createCardFromBlueprint(
      blueprint,
      `map-${current.currentSector}-${index + 1}-${nextCardId}`,
    ))
    nextCardId += 1
  }

  const drawnCardEntries = Object.fromEntries(drawnMapCards.map((card) => [card.id, card]))
  const nextTopZ = current.topZ + drawnMapCards.length
  const nextBoard = {
    ...current,
    topZ: nextTopZ,
    nextCardId,
    mapSlots: Array.from({ length: MAP_SLOT_COUNT }, (_, index) => drawnMapCards[index]?.id ?? null),
    cards: {
      ...withoutCards(current.cards, discardedMapCardIds),
      ...drawnCardEntries,
    },
    stacks: [
      ...baseStacks,
      ...drawnMapCards.map((card, index) => {
        const position = getMapStackPosition(index)

        return {
          id: getDrawnMapStackId(baseStacks, index, card.id),
          cardIds: [card.id],
          x: position.x,
          y: position.y,
          z: current.topZ + index + 1,
        }
      }),
    ],
    decks: current.decks.map((deck) =>
      deck.id === HORIZON_DECK_ID
        ? { ...deck, cards: deck.cards.slice(drawnMapCards.length), z: drawnMapCards.length > 0 ? nextTopZ : deck.z }
        : deck,
    ),
  }

  return {
    board: nextBoard,
    events: [
      ...(discardedMapCardIds.length > 0
        ? [cardsDiscardedEvent(discardedMapCardIds, current.cards, 'unchosen Map Destinations')]
        : []),
      isInitialMapOffer
        ? mapInitializedEvent(current.currentSector, drawnMapCards)
        : mapRefilledEvent(current.currentSector, drawnMapCards),
    ],
  }
}

function clearRemainingStopsForGate(current: BoardState) {
  const mapCardIds = getVisibleHorizonCardIds(current)
  const mapCardIdSet = new Set(mapCardIds)
  const gateCard = getSectorGateCard(current)
  const thresholdEvents = gateCard?.gate && current.stressCount >= gateCard.gate.motherPenalty.threshold
    ? [stressThresholdActiveEvent(gateCard, current.stressCount, gateCard.gate.motherPenalty.extraHumanCrew)]
    : []
  const clearedBoard = {
    ...current,
    mapSlots: createEmptyMapSlots(),
    cards: withoutCards(current.cards, mapCardIds),
    stacks: removeCardIdsFromStacks(current.stacks, mapCardIds),
    decks: current.decks.map((deck) =>
      deck.id === HORIZON_DECK_ID
        ? { ...deck, cards: [] }
        : deck,
    ),
  }
  const automaticShipParts = applyAutomaticGateShipParts(clearedBoard)

  return {
    board: automaticShipParts.board,
    events: [
      ...(mapCardIdSet.size > 0
        ? [cardsDiscardedEvent(mapCardIds, current.cards, 'unchosen Map Destinations')]
        : []),
      ...thresholdEvents,
      ...automaticShipParts.events,
    ],
  }
}

function clearVisibleMapChoices(current: BoardState) {
  const mapCardIds = getVisibleHorizonCardIds(current)

  return {
    board: {
      ...current,
      mapSlots: createEmptyMapSlots(),
      cards: withoutCards(current.cards, mapCardIds),
      stacks: removeCardIdsFromStacks(current.stacks, mapCardIds),
    },
    events: mapCardIds.length > 0
      ? [cardsDiscardedEvent(mapCardIds, current.cards, 'unchosen Map Destinations')]
      : [],
  }
}

function completeReadyHorizonStack(current: BoardState, stackId: string, metrics: BoardMetrics) {
  const sourceStack = current.stacks.find((stack) => stack.id === stackId)

  if (
    !sourceStack ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    current.pendingDrift ||
    current.traveledThisTurn
  ) {
    return { board: current, events: [] }
  }

  const completion = getHorizonStackCompletion(
    sourceStack,
    current.cards,
    getNextStopFuelDiscount(current.pendingEffects),
  )

  if (!completion?.isReady) {
    return { board: current, events: [] }
  }

  const horizonCard = current.cards[completion.horizonCardId]

  const mapSlotIndex = current.mapSlots.findIndex((cardId) => cardId === horizonCard?.id)
  const routeSlotIndex = current.routeSlots.findIndex((slot) => slot === null)

  if (!horizonCard?.horizon || mapSlotIndex === -1 || routeSlotIndex === -1) {
    return { board: current, events: [] }
  }

  const nextZ = current.topZ + 1
  const find = horizonCard.horizon.find
  const missionLeadId = current.currentPlayerId
  const rewards = find.kind === 'visit_reward' ? find.rewards : []
  const shipPartFind = find.kind === 'ship_part' ? find : null
  const keepsCompletedCardOnRoute = shipPartFind !== null
  const spentCrewCardIds = getSpentCrewCardIds(sourceStack, current.cards)
  const spentCrewCardIdSet = new Set(spentCrewCardIds)
  const discoveryRecipientId = getMissionDiscoveryRecipientId(current, spentCrewCardIds, missionLeadId)
  const spentFuelCount = sourceStack.cardIds.filter((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'resource' && card.resource === 'fuel'
  }).length
  const usableMotherCardIds = getUsableMotherCardIds(sourceStack, current.cards)
  const usableMotherCardIdsInPlay = getUsableMotherCardIdsInPlay(current.stacks, current.cards)
  const stressCountBefore = current.stressCount
  const spentMotherCardIds = getSpentMotherCardIds(
    sourceStack,
    current.cards,
    completion.requiredMotherCount,
  )
  const spentMotherCardIdSet = new Set(spentMotherCardIds)
  const returnedMotherCardIds = usableMotherCardIdsInPlay.filter(
    (cardId) => !spentMotherCardIdSet.has(cardId),
  )
  const returnedMotherCardIdSet = new Set(usableMotherCardIds.filter(
    (cardId) => !spentMotherCardIdSet.has(cardId),
  ))
  const readyCrewCount = rewards.reduce(
    (count, reward) => reward.kind === 'ready' ? count + reward.count : count,
    0,
  )
  const wakeCount = rewards.reduce(
    (count, reward) => reward.kind === 'crew' && reward.label === 'Wake' ? count + reward.count : count,
    0,
  )
  const scoutCount = rewards.reduce(
    (count, reward) => reward.kind === 'scout' ? count + reward.count : count,
    0,
  )
  const rewardCards: Card[] = []
  let nextCardId = current.nextCardId
  let nextDecks = current.decks.map((deck) => {
    const drawCount = rewards.reduce((count, reward) => {
      if (reward.kind === 'resource') {
        return deck.id === `${reward.resource}-deck` ? count + reward.count : count
      }
      if (reward.kind === 'crew' && reward.label !== 'Wake') {
        return deck.id === CRYO_DECK_ID ? count + reward.count : count
      }
      return count
    }, 0)

    if (drawCount === 0) {
      return deck
    }

    const drawnBlueprints = deck.cards.slice(0, drawCount)

    for (const blueprint of drawnBlueprints) {
      const rewardCard = {
        ...blueprint,
        id: `reward-${nextCardId}`,
        faceUp: true,
      }

      nextCardId += 1
      rewardCards.push(rewardCard)
    }

    return drawnBlueprints.length > 0
      ? { ...deck, cards: deck.cards.slice(drawnBlueprints.length), z: nextZ }
      : deck
  })
  let nextCards = withoutCards(
    current.cards,
    sourceStack.cardIds.filter(
      (cardId) =>
        cardId !== horizonCard.id &&
        !spentCrewCardIdSet.has(cardId) &&
        !spentMotherCardIdSet.has(cardId) &&
        !returnedMotherCardIdSet.has(cardId),
    ),
  )
  const handCardIdsWithoutSpentCrew = current.handCardIds.filter(
    (cardId) => !spentCrewCardIdSet.has(cardId),
  )
  const readyCrewResult = readyTiredCrew(
    handCardIdsWithoutSpentCrew,
    current.tiredCardIds,
    readyCrewCount,
  )
  const tiredCardIdsWithSpentCrew = [
    ...readyCrewResult.tiredCardIds,
    ...spentCrewCardIds,
  ]
  for (const rewardCard of rewardCards) {
    nextCards[rewardCard.id] = rewardCard
  }

  const discoveryDraw = drawDiscoveryForPlayer(
    nextDecks,
    nextCards,
    nextCardId,
    nextZ,
    discoveryRecipientId,
  )
  const earnedDiscoveryCard = discoveryDraw.discoveryCard
  const earnedDiscoveryDeck = discoveryDraw.discoveryDeck

  nextCards = discoveryDraw.cards
  nextDecks = discoveryDraw.decks
  nextCardId = discoveryDraw.nextCardId

  let pendingWakeChoice: BoardState['pendingWakeChoice'] = current.pendingWakeChoice
  let pendingScoutChoice: BoardState['pendingScoutChoice'] = current.pendingScoutChoice
  const nextRouteSlots = current.routeSlots.map((slot, index) => (
    index === routeSlotIndex
      ? {
          cardId: horizonCard.id,
          mapSlotIndex,
          find: shipPartFind
            ? {
                kind: 'ship_part' as const,
                itemName: shipPartFind.itemName,
                shipPart: shipPartFind.shipPart,
              }
            : {
                kind: 'visit_reward' as const,
                itemName: find.itemName,
              },
        }
      : slot
  ))
  const nextShipPartSlots = shipPartFind
    ? [
        ...current.shipPartSlots,
        {
          cardId: horizonCard.id,
          routeSlotIndex,
          sector: current.currentSector,
          itemName: shipPartFind.itemName,
          shipPart: shipPartFind.shipPart,
          status: 'available' as const,
          ownerId: missionLeadId,
        },
      ]
    : current.shipPartSlots
  const routeFilledAfterCompletion = isRouteFilled(nextRouteSlots)
  const shouldScoutAfterVisit = scoutCount > 0 && !routeFilledAfterCompletion

  if (wakeCount > 0) {
    const wakeDraw = drawWakeChoiceCards(nextDecks, nextCards, nextCardId, wakeCount, nextZ, missionLeadId)

    nextCards = wakeDraw.cards
    nextDecks = wakeDraw.decks
    nextCardId = wakeDraw.nextCardId
    pendingWakeChoice = wakeDraw.pendingWakeChoice
  }

  if (shouldScoutAfterVisit) {
    const scoutDraw = drawScoutChoiceCards(nextDecks, nextCards, nextCardId, scoutCount, nextZ)

    nextCards = scoutDraw.cards
    nextDecks = scoutDraw.decks
    nextCardId = scoutDraw.nextCardId
    pendingScoutChoice = scoutDraw.pendingScoutChoice
  }

  const resolvedCards = markMotherCardsSpent(nextCards, spentMotherCardIds)
  const fuelRewardCards = rewardCards.filter((card) => isFuelResourceCard(card))
  const otherRewardCards = rewardCards.filter((card) => !isFuelResourceCard(card))
  const routeStackPosition = getRouteStackPosition(routeSlotIndex)

  const rewardPosition =
    otherRewardCards.length > 0
      ? clampStackPosition(
          sourceStack.x + (sourceStack.x > 66 ? -9 : 9),
          sourceStack.y + (sourceStack.y > 56 ? -5 : 5),
          otherRewardCards.length,
          metrics,
        )
      : null
  const rewardStackId = `stack-reward-${horizonCard.id}`
  const spentMotherStackId = `stack-spent-mother-${horizonCard.id}`
  const nextStacksWithoutSource = current.stacks.filter(
    (stack) => stack.id !== sourceStack.id,
  )
  const resolvedStacks = placeFuelCardsInSupplyStack(
    [
      ...nextStacksWithoutSource,
      ...(keepsCompletedCardOnRoute
        ? [
            {
              ...sourceStack,
              id: getDrawnRouteStackId(nextStacksWithoutSource, routeSlotIndex, horizonCard.id),
              cardIds: [horizonCard.id],
              x: routeStackPosition.x,
              y: routeStackPosition.y,
              z: nextZ,
              drawChoiceGroupId: undefined,
            },
          ]
        : []),
      ...(spentMotherCardIds.length > 0
        ? [
            {
              id: spentMotherStackId,
              cardIds: spentMotherCardIds,
              x: sourceStack.x + (sourceStack.x > 66 ? -4 : 4),
              y: sourceStack.y + 4,
              z: nextZ,
            },
          ]
        : []),
      ...(otherRewardCards.length > 0
        ? [
            {
              id: rewardStackId,
              cardIds: otherRewardCards.map((card) => card.id),
              x: rewardPosition?.x ?? sourceStack.x,
              y: rewardPosition?.y ?? sourceStack.y,
              z: nextZ,
            },
          ]
        : []),
    ],
    resolvedCards,
    fuelRewardCards,
    nextZ,
    metrics,
  )

  const nextBoard = {
    ...current,
    topZ: nextZ,
    nextCardId,
    traveledThisTurn: true,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    mapSlots: current.mapSlots.map((cardId, index) => index === mapSlotIndex ? null : cardId),
    routeSlots: nextRouteSlots,
    shipPartSlots: nextShipPartSlots,
    handCardIds: earnedDiscoveryCard
      ? [...readyCrewResult.handCardIds, earnedDiscoveryCard.id]
      : readyCrewResult.handCardIds,
    tiredCardIds: tiredCardIdsWithSpentCrew,
    roundStartTiredCardIds: removeRoundStartTiredCardIds(
      current,
      [...readyCrewResult.readiedCrewCardIds, ...spentCrewCardIds],
    ),
    completedStarSummaries: [
      ...current.completedStarSummaries,
      {
        sector: current.currentSector,
        cardId: horizonCard.id,
        cardTitle: horizonCard.title,
        playerId: missionLeadId,
        crewCardIds: spentCrewCardIds,
        crewTitles: spentCrewCardIds.map((cardId) => current.cards[cardId]?.title ?? cardId),
        fuelSpent: spentFuelCount,
        motherSpent: spentMotherCardIds.length,
      },
    ],
    pendingWakeChoice,
    pendingScoutChoice,
    stressCount: current.stressCount + spentMotherCardIds.length,
    pendingEffects: [
      ...consumeNextStopFuelDiscount(current.pendingEffects),
      ...createBoardEffectsForVisitRewards(rewards),
    ],
    cards: resolvedCards,
    crewOwnerIds: {
      ...current.crewOwnerIds,
      ...Object.fromEntries(
        rewardCards
          .filter((card) => card.kind === 'crew' && missionLeadId)
          .map((card) => [card.id, missionLeadId as string]),
      ),
    },
    discoveryOwnerIds: earnedDiscoveryCard && discoveryRecipientId
      ? {
          ...current.discoveryOwnerIds,
          [earnedDiscoveryCard.id]: discoveryRecipientId,
        }
      : current.discoveryOwnerIds,
    stacks: resolvedStacks,
    decks: nextDecks,
  }
  const routeEvents = [
    stopMovedToRouteEvent(horizonCard, routeSlotIndex, find, routeFilledAfterCompletion),
    ...(shipPartFind
      ? [shipPartAvailableEvent(horizonCard, routeSlotIndex, shipPartFind.shipPart)]
      : []),
  ]
  const progressed = routeFilledAfterCompletion
    ? clearRemainingStopsForGate(nextBoard)
    : clearVisibleMapChoices(nextBoard)
  const returnedMother = returnMotherCardsToDeck(
    progressed.board,
    returnedMotherCardIds,
    sourceStack.id,
    `unused after ${horizonCard.title} completion`,
  )
  const followUpLoss = routeFilledAfterCompletion
    ? resolveGateLossIfNeeded(returnedMother.board)
    : { board: returnedMother.board, events: [] as PlaytestLogEvent[] }
  const readyRewardEvents = readyCrewResult.readiedCrewCardIds.length > 0
    ? [readyRewardAppliedEvent(horizonCard, readyCrewResult.readiedCrewCardIds, current.cards)]
    : []
  const motherCommittedEvents = createMotherCommittedEvents(
    current.cards,
    usableMotherCardIds,
    horizonCard,
    completion.motherCoveredIcons,
  )
  const motherSpentEvents = createMotherSpentEvents(
    current.cards,
    spentMotherCardIds,
    stressCountBefore,
    horizonCard,
  )
  const discoveryEvents = earnedDiscoveryCard && earnedDiscoveryDeck
    ? [
        discoveryEarnedEvent(
          earnedDiscoveryCard,
          earnedDiscoveryDeck,
          current.players.find((player) => player.id === discoveryRecipientId)?.name ?? null,
          horizonCard,
        ),
      ]
    : [discoveryMissedEvent(earnedDiscoveryDeck, horizonCard)]

  return {
    board: followUpLoss.board,
    events: [
      ...motherCommittedEvents,
      horizonCompletedEvent(horizonCard, sourceStack, rewardCards, current.cards),
      ...discoveryEvents,
      ...motherSpentEvents,
      ...readyRewardEvents,
      ...routeEvents,
      ...progressed.events,
      ...returnedMother.events,
      ...followUpLoss.events,
    ],
  }
}

function completeReadyGateStack(current: BoardState, stackId: string) {
  const sourceStack = current.stacks.find((stack) => stack.id === stackId)

  if (
    !sourceStack ||
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    current.pendingDrift ||
    !isSectorHorizonFinished(current)
  ) {
    return { board: current, events: [] }
  }

  const spentServiceDroneBayCount = countSpentShipParts(
    current.shipPartSlots,
    'service-drone-bay',
    current.currentSector,
  )
  const spentControlConsoleCount = countSpentShipParts(
    current.shipPartSlots,
    'adaptive-control-console',
    current.currentSector,
  )
  const stressCountBefore = current.stressCount
  const completion = getGateStackCompletion(
    sourceStack,
    current.cards,
    stressCountBefore,
    spentServiceDroneBayCount,
    spentControlConsoleCount,
  )

  if (!completion?.isReady) {
    return { board: current, events: [] }
  }

  const gateCard = current.cards[completion.gateCardId]

  if (!gateCard?.gate) {
    return { board: current, events: [] }
  }

  const spentCrewCardIds = getSpentCrewCardIds(sourceStack, current.cards)
  const spentCrewCardIdSet = new Set(spentCrewCardIds)
  const spentDiscoveryCardIds = getDiscoveryCardIds(sourceStack, current.cards)
  const spentDiscoveryCardIdSet = new Set(spentDiscoveryCardIds)
  const usableMotherCardIds = getUsableMotherCardIds(sourceStack, current.cards)
  const usableMotherCardIdsInPlay = getUsableMotherCardIdsInPlay(current.stacks, current.cards)
  const spentMotherCardIds = getSpentMotherCardIds(
    sourceStack,
    current.cards,
    completion.requiredMotherCount,
  )
  const spentMotherCardIdSet = new Set(spentMotherCardIds)
  const returnedMotherCardIds = usableMotherCardIdsInPlay.filter(
    (cardId) => !spentMotherCardIdSet.has(cardId),
  )
  const returnedMotherCardIdSet = new Set(usableMotherCardIds.filter(
    (cardId) => !spentMotherCardIdSet.has(cardId),
  ))
  const isFinalGate = current.currentSector >= current.totalSectors
  const nextSector = current.currentSector + 1
  const nextGateBlueprint = isFinalGate ? null : getSectorGateBlueprint(nextSector)
  const nextGateCard = nextGateBlueprint
    ? createCardFromBlueprint(nextGateBlueprint, `gate-${nextSector}-${current.nextCardId}`, false)
    : null
  const nextSectorHorizonCards = nextGateCard ? createSectorHorizonDeckCards() : []
  const nextStopDeckCards = nextSectorHorizonCards
  const nextSectorDeckArt = getSectorDeckArt(nextSector)
  const nextZ = current.topZ + 1
  const cardsWithSpentMother = markMotherCardsSpent(current.cards, spentMotherCardIds)
  const nextCards = { ...cardsWithSpentMother }
  const routeCardIds = getRouteCardIds(current.routeSlots)
  const shipPartCardIdSet = new Set(current.shipPartSlots.map((slot) => slot.cardId))
  const archivedRouteCardIds = routeCardIds.filter((cardId) => !shipPartCardIdSet.has(cardId))
  const archivedRouteCardIdSet = new Set(archivedRouteCardIds)
  const stressClearedByDiscovery = Math.min(
    current.stressCount,
    countGateStressClearDiscoveries(sourceStack.cardIds, current.cards),
  )
  const gateHazardSkipCount = countGateHazardSkipDiscoveries(sourceStack.cardIds, current.cards)
  const stressCountAfterDiscovery = Math.max(0, current.stressCount - stressClearedByDiscovery)
  const nextStressCount = stressCountAfterDiscovery + spentMotherCardIds.length

  for (const discoveryCardId of spentDiscoveryCardIds) {
    delete nextCards[discoveryCardId]
  }

  if (nextGateCard) {
    delete nextCards[gateCard.id]

    for (const routeCardId of archivedRouteCardIds) {
      delete nextCards[routeCardId]
    }

    nextCards[nextGateCard.id] = nextGateCard
  }

  const handCardIdsWithoutSpentCrew = current.handCardIds.filter(
    (cardId) => !spentCrewCardIdSet.has(cardId),
  )
  const tiredCardIdsWithSpentCrew = [
    ...current.tiredCardIds.filter((cardId) => !spentCrewCardIdSet.has(cardId)),
    ...spentCrewCardIds,
  ]
  const readyCrewResult = readyTiredCrew(
    handCardIdsWithoutSpentCrew,
    tiredCardIdsWithSpentCrew,
    tiredCardIdsWithSpentCrew.length,
  )

  const nextStacks = current.stacks.flatMap((stack) => {
    if (nextGateCard && stack.cardIds.some((cardId) => archivedRouteCardIdSet.has(cardId))) {
      const keptCardIds = stack.cardIds.filter((cardId) => !archivedRouteCardIdSet.has(cardId))

      return keptCardIds.length > 0 ? [{ ...stack, cardIds: keptCardIds }] : []
    }

    if (stack.id !== sourceStack.id) {
      return [stack]
    }

    const keptCardIds = stack.cardIds.filter(
      (cardId) =>
        !spentCrewCardIdSet.has(cardId) &&
        !spentDiscoveryCardIdSet.has(cardId) &&
        !returnedMotherCardIdSet.has(cardId) &&
        (isFinalGate || cardId !== gateCard.id),
    )

    return keptCardIds.length > 0
      ? [
          {
            ...stack,
            cardIds: keptCardIds,
            x: isFinalGate ? stack.x : Math.max(6, stack.x - 10),
            y: isFinalGate ? stack.y : Math.min(72, stack.y + 6),
            z: nextZ,
          },
        ]
      : []
  })
  const nextBoard = {
    ...current,
    topZ: nextZ,
    nextCardId: nextGateCard ? current.nextCardId + 1 : current.nextCardId,
    currentSector: isFinalGate ? current.currentSector : nextSector,
    hasArrived: isFinalGate,
    traveledThisTurn: true,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    mapSlots: nextGateCard ? createEmptyMapSlots() : current.mapSlots,
    routeSlots: isFinalGate ? current.routeSlots : createEmptyRouteSlots(),
    shipPartSlots: current.shipPartSlots,
    archivedRouteCardIds: isFinalGate
      ? current.archivedRouteCardIds
      : [...current.archivedRouteCardIds, ...routeCardIds],
    handCardIds: readyCrewResult.handCardIds,
    tiredCardIds: readyCrewResult.tiredCardIds,
    roundStartTiredCardIds: removeRoundStartTiredCardIds(current, readyCrewResult.readiedCrewCardIds),
    stressCount: nextStressCount,
    cards: nextCards,
    stacks: [
      ...nextStacks,
      ...(nextGateCard
        ? [
            {
              id: `stack-sector-gate-${nextSector}`,
              cardIds: [nextGateCard.id],
              x: SECTOR_GATE_STACK_POSITION.x,
              y: SECTOR_GATE_STACK_POSITION.y,
              z: nextZ,
            },
          ]
        : []),
    ],
    decks: current.decks.map((deck) =>
      nextGateCard && deck.id === HORIZON_DECK_ID
        ? {
            ...deck,
            title: getSectorDeckTitle(nextSector),
            icon: nextSectorDeckArt.icon,
            hue: nextSectorDeckArt.hue,
            accent: nextSectorDeckArt.accent,
            z: nextZ,
            draw: {
              ...manualDeckDraw,
              count: MAP_SLOT_COUNT,
              placement: 'nearby' as const,
            },
            cards: nextStopDeckCards,
          }
        : deck,
    ),
    pendingEffects: nextGateCard ? [] : current.pendingEffects,
  }
  const returnedMother = returnMotherCardsToDeck(
    nextBoard,
    returnedMotherCardIds,
    sourceStack.id,
    `unused after ${gateCard.title} completion`,
  )
  const motherCommittedEvents = createMotherCommittedEvents(
    current.cards,
    usableMotherCardIds,
    gateCard,
    completion.motherCoveredIcons,
  )
  const motherSpentEvents = createMotherSpentEvents(
    current.cards,
    spentMotherCardIds,
    stressCountAfterDiscovery,
    gateCard,
  )
  const requiredCrewSlots = gateCard.gate.need.crew + (
    stressCountAfterDiscovery >= gateCard.gate.motherPenalty.threshold
      ? Math.max(0, gateCard.gate.motherPenalty.extraHumanCrew - gateHazardSkipCount)
      : 0
  )
  const missingIconsBeforeCoverage = getMissingNeedIcons(
    spentCrewCardIds,
    current.cards,
    gateCard.gate.need.icons,
    0,
    sourceStack.cardIds,
  )
  const stressClearedEvents = stressClearedByDiscovery > 0
    ? [stressClearedEvent(`${gateCard.title}: Coolant Pack`, stressCountBefore, stressCountAfterDiscovery)]
    : []
  const discoveryDiscardEvents = spentDiscoveryCardIds.length > 0
    ? [cardsDiscardedEvent(spentDiscoveryCardIds, current.cards, 'Gate Discoveries')]
    : []

  return {
    board: returnedMother.board,
    events: [
      gateCrewStateBeforeEvent(current.cards, getReadyCrewCardIds(current), current.tiredCardIds),
      ...motherCommittedEvents,
      ...stressClearedEvents,
      ...motherSpentEvents,
      gateCrewSlotsCheckedEvent(gateCard, requiredCrewSlots, spentCrewCardIds.length, spentServiceDroneBayCount),
      gateIconsCheckedEvent(gateCard, missingIconsBeforeCoverage, spentControlConsoleCount, completion.requiredMotherCount),
      gateCompletedEvent(
        gateCard,
        sourceStack,
        current.cards,
        usableMotherCardIds.length,
        completion.motherSpentTotal,
        completion.extraHumanCrewRequired,
        isFinalGate,
      ),
      ...discoveryDiscardEvents,
      routeArchivedEvent(current.currentSector, routeCardIds, current.cards),
      starsCompletedSummaryEvent(
        current.completedStarSummaries,
        current.cards,
        getReadyCrewCardIds(current),
        current.tiredCardIds,
        completion.motherSpentTotal,
      ),
      ...(nextGateCard
        ? [
            sectorRevealedEvent(nextSector, nextGateCard, nextSectorHorizonCards),
          ]
        : []),
      ...returnedMother.events,
    ],
  }
}

function completeDrawFuelStackAction(
  current: BoardState,
  sourceStack: Stack,
  metrics: BoardMetrics,
  actionLabel: string,
) {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)
  const fuelBlueprint = fuelDeck?.cards[0]

  if (!fuelDeck || !fuelBlueprint) {
    return current
  }

  const spentCrewCardIds = getSpentCrewCardIds(sourceStack, current.cards)

  if (spentCrewCardIds.length !== sourceStack.cardIds.length || spentCrewCardIds.length === 0) {
    return current
  }

  const nextZ = current.topZ + 1
  const fuelCard = createCardFromBlueprint(fuelBlueprint, `fuel-action-${current.nextCardId}`)
  const nextCards = {
    ...current.cards,
    [fuelCard.id]: fuelCard,
  }
  const stacksWithFuel = placeFuelCardsInSupplyStack(
    current.stacks.filter((stack) => stack.id !== sourceStack.id),
    nextCards,
    [fuelCard],
    nextZ,
    metrics,
  )
  const fuelTargetStack = stacksWithFuel.find((stack) => stack.cardIds.includes(fuelCard.id))

  return withPlaytestEvents({
    ...current,
    topZ: nextZ,
    nextCardId: current.nextCardId + 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    handCardIds: current.handCardIds.filter((cardId) => !spentCrewCardIds.includes(cardId)),
    tiredCardIds: [
      ...current.tiredCardIds.filter((cardId) => !spentCrewCardIds.includes(cardId)),
      ...spentCrewCardIds,
    ],
    roundStartTiredCardIds: removeRoundStartTiredCardIds(current, spentCrewCardIds),
    cards: nextCards,
    stacks: stacksWithFuel,
    decks: current.decks.map((deck) =>
      deck.id === fuelDeck.id
        ? { ...deck, cards: deck.cards.slice(1), z: nextZ }
        : deck,
    ),
  }, [
    stackActionCompletedEvent(actionLabel, sourceStack, current.cards),
    cardDrawnEvent(
      fuelCard,
      fuelDeck,
      fuelTargetStack?.id ?? FUEL_SUPPLY_STACK_ID,
      fuelTargetStack?.x ?? FUEL_SUPPLY_STACK_POSITION.x,
      fuelTargetStack?.y ?? FUEL_SUPPLY_STACK_POSITION.y,
    ),
  ])
}

function completeUseRationStackAction(
  current: BoardState,
  sourceStack: Stack,
  metrics: BoardMetrics,
  actionLabel: string,
) {
  const fuelDeck = current.decks.find((deck) => deck.id === FUEL_DECK_ID)
  const fuelBlueprint = fuelDeck?.cards[0]
  const rationCardId = sourceStack.cardIds[0]
  const rationCard = rationCardId ? current.cards[rationCardId] : undefined

  if (
    !fuelDeck ||
    !fuelBlueprint ||
    sourceStack.cardIds.length !== 1 ||
    rationCard?.kind !== 'discovery' ||
    rationCard.discovery?.effectKind !== 'ration_pack'
  ) {
    return current
  }

  const nextZ = current.topZ + 1
  const fuelCard = createCardFromBlueprint(fuelBlueprint, `fuel-ration-${current.nextCardId}`)
  const nextCards = {
    ...withoutCards(current.cards, [rationCard.id]),
    [fuelCard.id]: fuelCard,
  }
  const stacksWithFuel = placeFuelCardsInSupplyStack(
    current.stacks.filter((stack) => stack.id !== sourceStack.id),
    nextCards,
    [fuelCard],
    nextZ,
    metrics,
  )
  const fuelTargetStack = stacksWithFuel.find((stack) => stack.cardIds.includes(fuelCard.id))

  return withPlaytestEvents({
    ...current,
    topZ: nextZ,
    nextCardId: current.nextCardId + 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    cards: nextCards,
    stacks: stacksWithFuel,
    decks: current.decks.map((deck) =>
      deck.id === fuelDeck.id
        ? { ...deck, cards: deck.cards.slice(1), z: nextZ }
        : deck,
    ),
  }, [
    stackActionCompletedEvent(actionLabel, sourceStack, current.cards),
    cardsDiscardedEvent([rationCard.id], current.cards, 'Ration Pack'),
    cardDrawnEvent(
      fuelCard,
      fuelDeck,
      fuelTargetStack?.id ?? FUEL_SUPPLY_STACK_ID,
      fuelTargetStack?.x ?? FUEL_SUPPLY_STACK_POSITION.x,
      fuelTargetStack?.y ?? FUEL_SUPPLY_STACK_POSITION.y,
    ),
  ])
}

export function completeStackActionUpdate(
  stackId: string,
  actionId: string,
  metrics: BoardMetrics,
): BoardUpdater {
  return (current) => {
    const sourceStack = current.stacks.find((stack) => stack.id === stackId)

    if (!sourceStack) {
      return current
    }

    const action = getStackActions(current, sourceStack).find((candidate) => candidate.id === actionId)

    if (!action) {
      return current
    }

    if (action.kind === 'draw-fuel') {
      return completeDrawFuelStackAction(current, sourceStack, metrics, action.label)
    }

    if (action.kind === 'use-ration') {
      return completeUseRationStackAction(current, sourceStack, metrics, action.label)
    }

    if (action.kind === 'travel') {
      return completeReadyHorizonStack(current, stackId, metrics)
    }

    if (action.kind === 'pass-gate') {
      return completeReadyGateStack(current, stackId)
    }

    return current
  }
}

export function clearBoardDropTargetUpdate(current: BoardState) {
  return current.dropTargetStackId || current.dropTargetDeckId
    ? { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    : current
}

function beginRoundDrift(current: BoardState, metrics: BoardMetrics) {
  const driftDeck = current.decks.find((deck) => deck.id === DRIFT_DECK_ID)

  if (!driftDeck) {
    return advanceTurnAndCheckLoss(current)
  }

  const wasEmpty = driftDeck.cards.length === 0
  const driftDeckCards = wasEmpty ? createDriftDeckCards() : driftDeck.cards
  const driftBlueprint = driftDeckCards[0]

  if (!driftBlueprint) {
    return advanceTurnAndCheckLoss(current)
  }

  const deckZ = current.topZ + 1
  const cardZ = current.topZ + 2
  const driftCard = createCardFromBlueprint(driftBlueprint, `drift-${current.nextCardId}`)
  const driftStackId = `stack-${driftCard.id}`
  const position = getNearbyDrawPosition({ ...driftDeck, cards: driftDeckCards }, metrics)
  const nextBoard = {
    ...current,
    topZ: cardZ,
    nextCardId: current.nextCardId + 1,
    pendingDrift: {
      cardId: driftCard.id,
      stackId: driftStackId,
    },
    dropTargetStackId: null,
    dropTargetDeckId: null,
    cards: {
      ...current.cards,
      [driftCard.id]: driftCard,
    },
    stacks: [
      ...current.stacks,
      {
        id: driftStackId,
        cardIds: [driftCard.id],
        x: position.x,
        y: position.y,
        z: cardZ,
      },
    ],
    decks: current.decks.map((deck) =>
      deck.id === DRIFT_DECK_ID
        ? { ...deck, cards: driftDeckCards.slice(1), z: deckZ }
        : deck,
    ),
  }

  return {
    board: nextBoard,
    events: [
      ...(wasEmpty ? [driftDeckReshuffledEvent(driftDeck)] : []),
      cardDrawnEvent(driftCard, { ...driftDeck, cards: driftDeckCards }, driftStackId, position.x, position.y),
    ],
  }
}

function getFuelCardIdForDriftBurn(current: BoardState) {
  const fuelSupplyStack = current.stacks.find((stack) =>
    stack.id === FUEL_SUPPLY_STACK_ID &&
      stack.cardIds.some((cardId) => isFuelResourceCard(current.cards[cardId])),
  ) ?? findFuelSupplyStack(current.stacks, current.cards)

  return fuelSupplyStack?.cardIds.find((cardId) => isFuelResourceCard(current.cards[cardId])) ?? null
}

function applyDriftBurn(current: BoardState) {
  const fuelCardId = getFuelCardIdForDriftBurn(current)

  if (!fuelCardId) {
    return {
      board: current,
      result: 'No Fuel was available, so nothing was discarded.',
      events: [] as PlaytestLogEvent[],
    }
  }

  const fuelCard = current.cards[fuelCardId]
  const fuelTitle = fuelCard?.title ?? fuelCardId

  return {
    board: {
      ...current,
      cards: withoutCards(current.cards, [fuelCardId]),
      stacks: removeCardIdsFromStacks(current.stacks, [fuelCardId]),
    },
    result: `${fuelTitle} was discarded from the Fuel Supply.`,
    events: [cardsDiscardedEvent([fuelCardId], current.cards, 'Drift Burn')],
  }
}

function applyDriftFatigue(current: BoardState) {
  const crewCardId = current.handCardIds.find((cardId) => current.cards[cardId]?.kind === 'crew')

  if (!crewCardId) {
    const nextStressCount = current.stressCount + 1

    return {
      board: {
        ...current,
        stressCount: nextStressCount,
      },
      result: 'No Ready crew was available, so Stress increased by 1.',
      events: [stressAddedEvent('Drift Fatigue: no Ready crew', current.stressCount, nextStressCount)],
    }
  }

  const crewCard = current.cards[crewCardId]
  const crewTitle = crewCard?.title ?? crewCardId

  return {
    board: {
      ...current,
      handCardIds: current.handCardIds.filter((cardId) => cardId !== crewCardId),
      tiredCardIds: current.tiredCardIds.includes(crewCardId)
        ? current.tiredCardIds
        : [...current.tiredCardIds, crewCardId],
      roundStartTiredCardIds: removeRoundStartTiredCardIds(current, [crewCardId]),
    },
    result: `${crewTitle} moved from Ready to Tired.`,
    events: [] as PlaytestLogEvent[],
  }
}

function readyLongestTiredCrewForEachPlayer(current: BoardState) {
  const readiedCrewCardIdSet = new Set<string>()
  const eligibleCrewCardIds = new Set(current.roundStartTiredCardIds)

  for (const player of current.players) {
    const readiedCrewCardId = current.tiredCardIds.find((cardId) => (
      !readiedCrewCardIdSet.has(cardId) &&
      eligibleCrewCardIds.has(cardId) &&
      current.cards[cardId]?.kind === 'crew' &&
      current.crewOwnerIds[cardId] === player.id
    ))

    if (readiedCrewCardId) {
      readiedCrewCardIdSet.add(readiedCrewCardId)
    }
  }

  if (readiedCrewCardIdSet.size === 0) {
    return {
      board: current,
      readiedCrewCardIds: [] as string[],
    }
  }

  const readiedCrewCardIds = current.tiredCardIds.filter((cardId) => readiedCrewCardIdSet.has(cardId))

  return {
    board: {
      ...current,
      handCardIds: [...current.handCardIds, ...readiedCrewCardIds],
      tiredCardIds: current.tiredCardIds.filter((cardId) => !readiedCrewCardIdSet.has(cardId)),
      roundStartTiredCardIds: removeRoundStartTiredCardIds(current, readiedCrewCardIds),
    },
    readiedCrewCardIds,
  }
}

export function resolvePendingDriftUpdate(current: BoardState) {
  const pendingDrift = current.pendingDrift

  if (!pendingDrift) {
    return current
  }

  const driftCard = current.cards[pendingDrift.cardId]
  const boardWithoutDriftCard = {
    ...current,
    pendingDrift: null,
    cards: withoutCards(current.cards, [pendingDrift.cardId]),
    stacks: removeCardIdsFromStacks(current.stacks, [pendingDrift.cardId]),
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }

  if (driftCard?.kind !== 'drift' || !driftCard.drift) {
    const advanced = advanceTurnAndCheckLoss(boardWithoutDriftCard)

    return withPlaytestEvents(advanced.board, [
      ...(driftCard ? [cardsDiscardedEvent([driftCard.id], current.cards, 'Drift')] : []),
      ...advanced.events,
    ])
  }

  const driftEffect = driftCard.drift.effectKind === 'burn'
    ? applyDriftBurn(boardWithoutDriftCard)
    : applyDriftFatigue(boardWithoutDriftCard)
  const roundEndReady = readyLongestTiredCrewForEachPlayer(driftEffect.board)
  const nextRoundBoard = {
    ...roundEndReady.board,
    roundStartTiredCardIds: roundEndReady.board.tiredCardIds,
  }
  const advanced = advanceTurnAndCheckLoss(nextRoundBoard)
  const roundEndReadyEvents = roundEndReady.readiedCrewCardIds.length > 0
    ? [roundEndCrewReadiedEvent(roundEndReady.readiedCrewCardIds, roundEndReady.board.cards)]
    : []

  return withPlaytestEvents(advanced.board, [
    cardsDiscardedEvent([driftCard.id], current.cards, 'Drift'),
    driftResolvedEvent(driftCard, driftEffect.result),
    ...driftEffect.events,
    ...roundEndReadyEvents,
    ...advanced.events,
  ])
}

export function endTurnUpdate(metrics: BoardMetrics): BoardUpdater {
  return (current) => {
    if (
      current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice ||
      current.pendingDrift
    ) {
      return current
    }

    const currentLoss = resolveSectorStrandedLossIfNeeded(current)

    if (currentLoss.board !== current || currentLoss.events.length > 0) {
      return withPlaytestEvents(currentLoss.board, currentLoss.events)
    }

    if (shouldDrawMissionsBeforeEndTurn(current)) {
      const mapDraw = drawNextMapChoices({ ...current, sectorDrawnThisTurn: true })
      const loss = resolveSectorStrandedLossIfNeeded(mapDraw.board)

      return withPlaytestEvents(loss.board, [...mapDraw.events, ...loss.events])
    }

    const result = isFinalTurnOfRound(current)
      ? beginRoundDrift(current, metrics)
      : advanceTurnAndCheckLoss(current)

    return withPlaytestEvents(result.board, result.events)
  }
}

export function activateStackDragUpdate({
  stackId,
  cardId,
  cardIndex,
  activeId,
  startX,
  startY,
}: ActivateStackDragUpdateArgs): BoardUpdater {
  return (current) => {
      const sourceStack = current.stacks.find((stack) => stack.id === stackId)

      if (!sourceStack || sourceStack.cardIds[cardIndex] !== cardId) {
        return current
      }

      const nextZ = current.topZ + 1
      const movingCardIds = sourceStack.cardIds.slice(cardIndex)

    const nextStacks =
      cardIndex > 0
        ? current.stacks.flatMap((stack) => {
            if (stack.id !== sourceStack.id) {
              return [stack]
            }

            return [
              { ...stack, cardIds: sourceStack.cardIds.slice(0, cardIndex) },
              {
                id: activeId,
                cardIds: movingCardIds,
                x: startX,
                y: startY,
                z: nextZ,
              },
            ]
          })
        : current.stacks.map((stack) =>
            stack.id === activeId ? { ...stack, z: nextZ } : stack,
          )

    const nextBoard = {
      ...current,
      topZ: nextZ,
      stacks: nextStacks,
      dropTargetStackId: null,
      dropTargetDeckId: null,
    }

    if (cardIndex === 0) {
      return nextBoard
    }

    return withPlaytestEvents(
      nextBoard,
      stackSplitEvent(sourceStack.id, activeId, movingCardIds, current.cards),
    )
  }
}

export function toggleCardFaceUpdate(stackId: string, cardId: string): BoardUpdater {
  return (current) => {
    if (
      current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice ||
      current.pendingDrift
    ) {
      return current
    }

    const stack = current.stacks.find((candidate) => candidate.id === stackId)
    const card = current.cards[cardId]

    if (!stack || !stack.cardIds.includes(cardId) || !canManuallyFlipCard(card)) {
      return current
    }

    const nextCard = { ...card, faceUp: !card.faceUp }

    const nextBoard = {
      ...current,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      cards: {
        ...current.cards,
        [cardId]: nextCard,
      },
    }
    const loss = nextCard.faceUp
      ? resolveGateLossIfNeeded(nextBoard)
      : { board: nextBoard, events: [] }

    return withPlaytestEvents(loss.board, [cardFlippedEvent(nextCard, stack.id), ...loss.events])
  }
}

export function activateDeckDragUpdate(deckId: string): BoardUpdater {
  return (current) => {
    const nextZ = current.topZ + 1

    return {
      ...current,
      topZ: nextZ,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      decks: current.decks.map((deck) =>
        deck.id === deckId ? { ...deck, z: nextZ } : deck,
      ),
    }
  }
}

export function commitStackDragPositionUpdate(activeId: string, x: number, y: number): BoardUpdater {
  return (current) => {
    const movingStack = current.stacks.find((stack) => stack.id === activeId)

    if (!movingStack || (movingStack.x === x && movingStack.y === y)) {
      return current
    }

    return {
      ...current,
      stacks: current.stacks.map((stack) => {
        if (stack.id !== activeId) {
          return stack
        }

        return { ...stack, x, y }
      }),
    }
  }
}

export function commitDeckDragPositionUpdate(deckId: string, x: number, y: number): BoardUpdater {
  return (current) => {
    const movingDeck = current.decks.find((deck) => deck.id === deckId)

    if (!movingDeck || (movingDeck.x === x && movingDeck.y === y)) {
      return current
    }

    return {
      ...current,
      decks: current.decks.map((deck) => {
        if (deck.id !== deckId) {
          return deck
        }

        return { ...deck, x, y }
      }),
    }
  }
}

export function drawFromDeckUpdate(deckId: string, metrics: BoardMetrics): BoardUpdater {
  return (current) => {
    const deck = current.decks.find((candidate) => candidate.id === deckId)

    if (
      current.hasArrived ||
      current.lossReason ||
      current.pendingWakeChoice ||
      current.pendingScoutChoice ||
      current.pendingDrift ||
      !deck ||
      !canManuallyDrawDeck(deck)
    ) {
      return current
    }

    if (deck.id === HORIZON_DECK_ID) {
      if (
        current.sectorDrawnThisTurn ||
        current.traveledThisTurn ||
        getVisibleHorizonCardIds(current).length > 0 ||
        isSectorHorizonFinished(current)
      ) {
        return current
      }

      const mapDraw = drawNextMapChoices({ ...current, sectorDrawnThisTurn: true })
      const loss = resolveSectorStrandedLossIfNeeded(mapDraw.board)

      return withPlaytestEvents(loss.board, [...mapDraw.events, ...loss.events])
    }

    const drawCount = getPendingDrawCount(deck, current.pendingEffects)
    const drawnBlueprints = deck.cards.slice(0, drawCount)

    if (drawnBlueprints.length === 0) {
      return current
    }

    const deckZ = current.topZ + 1
    const firstCardZ = current.topZ + 2
    const positions = getDeckDrawPositions(deck, drawnBlueprints.length, metrics)
    const nextCards = { ...current.cards }
    const drawnStacks: Stack[] = []
    const drawEvents: ReturnType<typeof cardDrawnEvent>[] = []
    const drawChoiceGroupId = drawnBlueprints.length > 1 ? `${deck.id}-draw-${current.nextCardId}` : undefined
    let nextCardId = current.nextCardId
    let pendingEffects = consumeDeckDrawModifiers(deck.id, current.pendingEffects)

    for (const [index, blueprint] of drawnBlueprints.entries()) {
      const newCardId = `drawn-${nextCardId}`
      const newStackId = `stack-${newCardId}`
      const drawEffectResult = applyPendingEffectsToDrawnCard(
        deck.id,
        { ...blueprint, id: newCardId, faceUp: true },
        pendingEffects,
      )
      const newCard = drawEffectResult.card
      const position = positions[index] ?? getNearbyDrawPosition(deck, metrics)

      nextCardId += 1
      pendingEffects = drawEffectResult.pendingEffects
      nextCards[newCardId] = newCard
      drawnStacks.push({
        id: newStackId,
        cardIds: [newCardId],
        x: position.x,
        y: position.y,
        z: firstCardZ + index,
        drawChoiceGroupId,
      })
      if (deck.id !== MOTHER_DECK_ID) {
        drawEvents.push(cardDrawnEvent(newCard, deck, newStackId, position.x, position.y))
      }
    }

    const drawnHorizonCardIds = drawnStacks.flatMap((stack) => {
      const cardId = stack.cardIds[0]
      const card = cardId ? nextCards[cardId] : undefined

      return card?.kind === 'horizon' ? [card.id] : []
    })
    const motherPlacement = deck.id === MOTHER_DECK_ID
      ? placeMotherCardsInSupplyStack(
          current.stacks,
          nextCards,
          drawnStacks.flatMap((stack) => {
            const cardId = stack.cardIds[0]
            const card = cardId ? nextCards[cardId] : undefined

            return card ? [card] : []
          }),
          firstCardZ + drawnStacks.length - 1,
          metrics,
        )
      : null
    const nextStacks = motherPlacement
      ? motherPlacement.stacks
      : [
          ...current.stacks,
          ...drawnStacks,
        ]
    const nextDrawEvents = motherPlacement?.targetStack
      ? drawnStacks.flatMap((stack) => {
          const cardId = stack.cardIds[0]
          const card = cardId ? nextCards[cardId] : undefined

          return card
            ? [cardDrawnEvent(card, deck, motherPlacement.targetStack.id, motherPlacement.targetStack.x, motherPlacement.targetStack.y)]
            : []
        })
      : drawEvents
    const nextBoard = {
      ...current,
      topZ: firstCardZ + drawnStacks.length - 1,
      nextCardId,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      pendingEffects,
      cards: nextCards,
      stacks: nextStacks,
      decks: current.decks.map((candidate) =>
        candidate.id === deckId
          ? { ...candidate, cards: candidate.cards.slice(drawnBlueprints.length), z: deckZ }
          : candidate,
      ),
    }
    const loss =
      deck.id === HORIZON_DECK_ID && drawnHorizonCardIds.length > 0
        ? resolveSectorStrandedLossIfNeeded(nextBoard)
        : { board: nextBoard, events: [] }

    return withPlaytestEvents(loss.board, [...nextDrawEvents, ...loss.events])
  }
}

export function chooseWakeCrewUpdate(cardId: string): BoardUpdater {
  return (current) => {
    const pendingWakeChoice = current.pendingWakeChoice

    if (
      current.hasArrived ||
      current.lossReason ||
      !pendingWakeChoice ||
      !pendingWakeChoice.choiceCardIds.includes(cardId)
    ) {
      return current
    }

    const chosenCard = current.cards[cardId]

    if (!chosenCard || chosenCard.kind !== 'crew') {
      return current
    }

    const unchosenCardIds = pendingWakeChoice.choiceCardIds.filter((choiceCardId) => choiceCardId !== cardId)
    const returnedCryoCards = cardsToDeckBlueprints(unchosenCardIds, current.cards)
    let nextCards = { ...current.cards }
    let nextDecks = current.decks.map((deck) =>
      deck.id === CRYO_DECK_ID
        ? { ...deck, cards: [...deck.cards, ...returnedCryoCards] }
        : deck,
    )
    let nextCardId = current.nextCardId
    let nextPendingWakeChoice: BoardState['pendingWakeChoice'] = null
    let nextTopZ = current.topZ

    for (const unchosenCardId of unchosenCardIds) {
      delete nextCards[unchosenCardId]
    }

    if (pendingWakeChoice.remaining > 1) {
      const wakeDraw = drawWakeChoiceCards(
        nextDecks,
        nextCards,
        nextCardId,
        pendingWakeChoice.remaining - 1,
        current.topZ + 1,
        pendingWakeChoice.playerId,
      )

      nextCards = wakeDraw.cards
      nextDecks = wakeDraw.decks
      nextCardId = wakeDraw.nextCardId
      nextPendingWakeChoice = wakeDraw.pendingWakeChoice
      nextTopZ = wakeDraw.pendingWakeChoice ? current.topZ + 1 : current.topZ
    }

    const tiredCardIdsWithChosen = current.tiredCardIds.includes(cardId)
      ? current.tiredCardIds
      : [...current.tiredCardIds, cardId]
    const wakeReadyResult = readyTiredCrew(
      current.handCardIds.filter((candidateId) => candidateId !== cardId),
      tiredCardIdsWithChosen,
      1,
    )

    const nextBoard = {
      ...current,
      topZ: nextTopZ,
      nextCardId,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      handCardIds: wakeReadyResult.handCardIds,
      tiredCardIds: wakeReadyResult.tiredCardIds,
      roundStartTiredCardIds: removeRoundStartTiredCardIds(current, wakeReadyResult.readiedCrewCardIds),
      pendingWakeChoice: nextPendingWakeChoice,
      cards: nextCards,
      crewOwnerIds: pendingWakeChoice.playerId
        ? {
            ...current.crewOwnerIds,
            [cardId]: pendingWakeChoice.playerId,
          }
        : current.crewOwnerIds,
      decks: nextDecks,
    }
    const automaticShipParts = isSectorHorizonFinished(nextBoard)
      ? applyAutomaticGateShipParts(nextBoard)
      : { board: nextBoard, events: [] as PlaytestLogEvent[] }
    const followUpLoss = isSectorHorizonFinished(automaticShipParts.board)
      ? resolveGateLossIfNeeded(automaticShipParts.board)
      : resolveSectorStrandedLossIfNeeded(automaticShipParts.board)

    return withPlaytestEvents(followUpLoss.board, [
      wakeCrewRecruitedEvent(chosenCard, unchosenCardIds, current.cards, wakeReadyResult.readiedCrewCardIds),
      ...automaticShipParts.events,
      ...followUpLoss.events,
    ])
  }
}

export function chooseScoutCardUpdate(cardId: string): BoardUpdater {
  return (current) => {
    const pendingScoutChoice = current.pendingScoutChoice

    if (
      current.hasArrived ||
      current.lossReason ||
      !pendingScoutChoice ||
      !pendingScoutChoice.choiceCardIds.includes(cardId)
    ) {
      return current
    }

    const bottomedCardIds = pendingScoutChoice.choiceCardIds.filter((choiceCardId) => (
      choiceCardId !== cardId
    ))

    return {
      ...current,
      pendingScoutChoice: {
        ...pendingScoutChoice,
        keptCardId: cardId,
        bottomedCardIds,
      },
    }
  }
}

export function confirmScoutChoiceUpdate(current: BoardState) {
  const pendingScoutChoice = current.pendingScoutChoice

  if (current.hasArrived || current.lossReason || !pendingScoutChoice) {
    return current
  }

  const keptCardId = pendingScoutChoice.keptCardId
    ?? (pendingScoutChoice.choiceCardIds.length === 1 ? pendingScoutChoice.choiceCardIds[0] : null)

  if (!keptCardId || !pendingScoutChoice.choiceCardIds.includes(keptCardId)) {
    return current
  }

  const requiredBottomedCardIds = pendingScoutChoice.choiceCardIds.filter((cardId) => cardId !== keptCardId)
  const keptCard = cardsToDeckBlueprints([keptCardId], current.cards)
  const bottomedCardIds = pendingScoutChoice.choiceCardIds.filter((cardId) => (
    cardId !== keptCardId
  ))
  const bottomedCards = cardsToDeckBlueprints(bottomedCardIds, current.cards)

  if (keptCard.length !== 1 || bottomedCards.length !== requiredBottomedCardIds.length) {
    return current
  }

  const scoutBoard = {
    ...current,
    pendingScoutChoice: null,
    cards: withoutCards(current.cards, pendingScoutChoice.choiceCardIds),
    decks: current.decks.map((deck) =>
      deck.id === HORIZON_DECK_ID
        ? { ...deck, cards: [...keptCard, ...deck.cards, ...bottomedCards] }
        : deck,
    ),
  }
  const automaticShipParts = isSectorHorizonFinished(scoutBoard)
    ? applyAutomaticGateShipParts(scoutBoard)
    : { board: scoutBoard, events: [] as PlaytestLogEvent[] }
  const followUpLoss = isSectorHorizonFinished(automaticShipParts.board)
    ? resolveGateLossIfNeeded(automaticShipParts.board)
    : resolveSectorStrandedLossIfNeeded(automaticShipParts.board)

  return withPlaytestEvents(followUpLoss.board, [
    scoutUsedEvent(
      pendingScoutChoice.choiceCardIds,
      keptCardId,
      bottomedCardIds,
      current.cards,
    ),
    ...automaticShipParts.events,
    ...followUpLoss.events,
  ])
}

export function dropHandCardToBoardUpdate(cardId: string, position: Position): BoardUpdater {
  return (current) => {
    const card = current.cards[cardId]
    const sourceHandZone = getCardHandZone(current, cardId)

    if (
      current.hasArrived ||
      current.lossReason ||
      !card ||
      !sourceHandZone ||
      !canUseManualHandZone(sourceHandZone)
    ) {
      return current
    }

    const nextZ = current.topZ + 1
    const newStackId = `stack-hand-${cardId}-${current.nextCardId}`
    const nextHands = removeCardFromHandZones(current, cardId)

    return withPlaytestEvents({
      ...current,
      topZ: nextZ,
      nextCardId: current.nextCardId + 1,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      ...nextHands,
      stacks: [
        ...current.stacks,
        {
          id: newStackId,
          cardIds: [cardId],
          x: position.x,
          y: position.y,
          z: nextZ,
        },
      ],
    }, handCardDroppedEvent(card, newStackId, position.x, position.y))
  }
}

export function discardStackUpdate(stackId: string): BoardUpdater {
  return (current) => {
    const stack = current.stacks.find((candidate) => candidate.id === stackId)

    if (current.hasArrived || current.lossReason || !stack) {
      return current
    }

    if (stack.cardIds.some((cardId) => current.cards[cardId]?.kind === 'gate')) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    if (stack.cardIds.some((cardId) => current.mapSlots.includes(cardId))) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    if (stackContainsRouteCard(stack, current.routeSlots, current.shipPartSlots)) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const returnedMotherCardIds = getUsableMotherCardIds(stack, current.cards)
    const returnedMotherCardIdSet = new Set(returnedMotherCardIds)
    const discardedCardIds = stack.cardIds.filter((cardId) => !returnedMotherCardIdSet.has(cardId))
    const nextBoard = {
      ...current,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      cards: withoutCards(current.cards, discardedCardIds),
      stacks: current.stacks.filter((candidate) => candidate.id !== stack.id),
    }
    const returnedMother = returnMotherCardsToDeck(nextBoard, returnedMotherCardIds, stack.id, 'stack discarded')
    const gateLoss = resolveGateLossIfNeeded(returnedMother.board)

    return withPlaytestEvents(gateLoss.board, [
      ...(discardedCardIds.length > 0
        ? [cardsDiscardedEvent(discardedCardIds, current.cards, stack.id)]
        : []),
      ...returnedMother.events,
      ...gateLoss.events,
    ])
  }
}

export function discardHandCardUpdate(cardId: string): BoardUpdater {
  return (current) => {
    const card = current.cards[cardId]
    const sourceHandZone = getCardHandZone(current, cardId)

    if (
      current.hasArrived ||
      current.lossReason ||
      !card ||
      !sourceHandZone ||
      !canUseManualHandZone(sourceHandZone)
    ) {
      return current
    }

    const nextHands = removeCardFromHandZones(current, cardId)

    const nextBoard = {
      ...current,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      cards: withoutCards(current.cards, [cardId]),
      ...nextHands,
    }
    const gateLoss = resolveGateLossIfNeeded(nextBoard)

    return withPlaytestEvents(gateLoss.board, [
      cardsDiscardedEvent([cardId], current.cards, sourceHandZone),
      ...gateLoss.events,
    ])
  }
}

export function returnOwnedCrewCardToHandUpdate(
  stackId: string,
  cardId: string,
  playerId: string | null,
): BoardUpdater {
  return (current) => {
    const stack = current.stacks.find((candidate) => candidate.id === stackId)
    const card = current.cards[cardId]

    if (
      current.hasArrived ||
      current.lossReason ||
      !playerId ||
      !stack ||
      !stack.cardIds.includes(cardId) ||
      !card ||
      getOwnedHandCardOwnerId(current, cardId) !== playerId
    ) {
      return current
    }

    const nextStackCardIds = stack.cardIds.filter((candidateId) => candidateId !== cardId)
    const returnedStack = { ...stack, cardIds: [cardId] }
    const nextBoard = {
      ...current,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      handCardIds: current.handCardIds.includes(cardId)
        ? current.handCardIds
        : [...current.handCardIds, cardId],
      tiredCardIds: current.tiredCardIds.filter((candidateId) => candidateId !== cardId),
      roundStartTiredCardIds: removeRoundStartTiredCardIds(current, [cardId]),
      stacks: current.stacks.flatMap((candidate) => {
        if (candidate.id !== stack.id) {
          return [candidate]
        }

        return nextStackCardIds.length > 0
          ? [{ ...candidate, cardIds: nextStackCardIds }]
          : []
      }),
    }
    const gateLoss = resolveGateLossIfNeeded(nextBoard)

    return withPlaytestEvents(gateLoss.board, [
      cardsMovedToHandEvent(returnedStack, current.cards),
      ...gateLoss.events,
    ])
  }
}

export function promoteHandCardToStackUpdate(
  cardId: string,
  stackId: string,
  nextZ: number,
  position: Position,
): BoardUpdater {
  return (latest) => {
    const latestSourceHandZone = getCardHandZone(latest, cardId)

    if (
      latest.hasArrived ||
      latest.lossReason ||
      !latestSourceHandZone ||
      !canUseManualHandZone(latestSourceHandZone)
    ) {
      return latest
    }

    const nextHands = removeCardFromHandZones(latest, cardId)

    return {
      ...latest,
      topZ: nextZ,
      nextCardId: latest.nextCardId + 1,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      ...nextHands,
      stacks: [
        ...latest.stacks,
        {
          id: stackId,
          cardIds: [cardId],
          x: position.x,
          y: position.y,
          z: nextZ,
        },
      ],
    }
  }
}

export function reorderHandCardUpdate(cardId: string, zone: HandZone, insertIndex: number): BoardUpdater {
  return (current) => {
    const card = current.cards[cardId]
    const sourceHandZone = getCardHandZone(current, cardId)

    if (
      !card ||
      (card.kind !== 'crew' && card.kind !== 'discovery') ||
      !sourceHandZone ||
      !canUseManualHandZone(sourceHandZone) ||
      !canUseManualHandZone(zone)
    ) {
      return current
    }

    const targetCardIds = current.handCardIds.filter((candidateId) => candidateId !== cardId)
    const nextIndex = clamp(insertIndex, 0, targetCardIds.length)
    const nextHandCardIds = [
      ...targetCardIds.slice(0, nextIndex),
      cardId,
      ...targetCardIds.slice(nextIndex),
    ]

    if (
      nextHandCardIds.length === current.handCardIds.length &&
      nextHandCardIds.every((candidateId, index) => candidateId === current.handCardIds[index])
    ) {
      return current
    }

    return {
      ...current,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      handCardIds: nextHandCardIds,
    }
  }
}

export function addStackToHandUpdate(
  sourceStackId: string,
  zone: HandZone,
  insertIndex: number | null,
): BoardUpdater {
  return (current) => {
    const sourceStack = current.stacks.find((stack) => stack.id === sourceStackId)

    if (
      !sourceStack ||
      !canUseManualHandZone(zone) ||
      !canPutCardIdsInHand(sourceStack.cardIds, current.cards)
    ) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const targetCardIds = current.handCardIds
    const nextIndex = clamp(insertIndex ?? targetCardIds.length, 0, targetCardIds.length)
    const nextTargetCardIds = [
      ...targetCardIds.slice(0, nextIndex),
      ...sourceStack.cardIds,
      ...targetCardIds.slice(nextIndex),
    ]

    return withPlaytestEvents({
      ...current,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      handCardIds: nextTargetCardIds,
      roundStartTiredCardIds: removeRoundStartTiredCardIds(current, sourceStack.cardIds),
      stacks: current.stacks.filter((stack) => stack.id !== sourceStack.id),
    }, cardsMovedToHandEvent(sourceStack, current.cards))
  }
}

export function stackOnDropTargetUpdate(
  sourceStackId: string,
  dropTarget: DropTarget,
): BoardUpdater {
  return (current) => {
    const sourceStack = current.stacks.find((stack) => stack.id === sourceStackId)
    const targetStackId = dropTarget.stackId
    const targetDeckId = dropTarget.deckId

    if (current.hasArrived || current.lossReason || !sourceStack) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const sourceIsFaceDown = isFaceDownStack(sourceStack, current.cards)

    if (targetDeckId) {
      const targetDeck = current.decks.find((deck) => deck.id === targetDeckId)

      if (!targetDeck || !sourceIsFaceDown) {
        return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
      }

      const sourceDeckCards = cardsToDeckBlueprints(sourceStack.cardIds, current.cards)

      if (sourceDeckCards.length !== sourceStack.cardIds.length) {
        return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
      }

      const nextZ = current.topZ + 1

      return withPlaytestEvents({
        ...current,
        topZ: nextZ,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: withoutCards(current.cards, sourceStack.cardIds),
        stacks: current.stacks.filter((stack) => stack.id !== sourceStackId),
        decks: current.decks.map((deck) =>
          deck.id === targetDeck.id
            ? {
                ...deck,
                cards: [...sourceDeckCards, ...deck.cards],
                z: nextZ,
              }
            : deck,
        ),
      }, cardsReturnedToDeckEvent(sourceStack, targetDeck, current.cards))
    }

    if (!targetStackId || targetStackId === sourceStackId) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const targetStack = current.stacks.find((stack) => stack.id === targetStackId)

    if (!targetStack) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const sourceHasRouteCard = stackContainsRouteCard(sourceStack, current.routeSlots, current.shipPartSlots)
    const targetHasRouteCard = stackContainsRouteCard(targetStack, current.routeSlots, current.shipPartSlots)
    const sourceIsRouteOnly = stackContainsOnlyRouteCards(sourceStack, current.routeSlots, current.shipPartSlots)
    const targetIsRouteOnly = stackContainsOnlyRouteCards(targetStack, current.routeSlots, current.shipPartSlots)

    if (sourceIsRouteOnly && targetIsRouteOnly) {
      const nextZ = current.topZ + 1

      return withPlaytestEvents({
        ...current,
        topZ: nextZ,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        stacks: current.stacks
          .filter((stack) => stack.id !== sourceStackId)
          .map((stack) =>
            stack.id === targetStack.id
              ? {
                  ...stack,
                  cardIds: [...stack.cardIds, ...sourceStack.cardIds],
                  z: nextZ,
                }
              : stack,
          ),
      }, cardsStackedEvent(sourceStack, targetStack, current.cards))
    }

    if (sourceHasRouteCard || targetHasRouteCard) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    if (canCombineAsDeck(sourceStack, targetStack, current.cards)) {
      const sourceDeckCards = cardsToDeckBlueprints(sourceStack.cardIds, current.cards)
      const targetDeckCards = cardsToDeckBlueprints(targetStack.cardIds, current.cards)
      const deckCardIds = [...sourceStack.cardIds, ...targetStack.cardIds]
      const deckTopCard = current.cards[sourceStack.cardIds[0]] ?? current.cards[targetStack.cardIds[0]]

      if (
        !deckTopCard ||
        sourceDeckCards.length !== sourceStack.cardIds.length ||
        targetDeckCards.length !== targetStack.cardIds.length
      ) {
        return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
      }

      const nextZ = current.topZ + 1
      const newDeck = {
        id: `deck-${current.nextCardId}`,
        title: `${deckTopCard.title} Deck`,
        icon: deckTopCard.icon,
        hue: deckTopCard.hue,
        accent: deckTopCard.accent,
        x: targetStack.x,
        y: targetStack.y,
        z: nextZ,
        draw: manualDeckDraw,
        cards: [...sourceDeckCards, ...targetDeckCards],
      }

      return withPlaytestEvents({
        ...current,
        topZ: nextZ,
        nextCardId: current.nextCardId + 1,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: withoutCards(current.cards, deckCardIds),
        stacks: current.stacks.filter(
          (stack) => stack.id !== sourceStackId && stack.id !== targetStack.id,
        ),
        decks: [
          ...current.decks,
          newDeck,
        ],
      }, deckCreatedFromStacksEvent(newDeck, sourceStack, targetStack, current.cards))
    }

    if (!canStackCards(
      sourceStack,
      targetStack,
      current.cards,
      getNextStopFuelDiscount(current.pendingEffects),
      current.stressCount,
      countSpentShipParts(current.shipPartSlots, 'service-drone-bay', current.currentSector),
      countSpentShipParts(current.shipPartSlots, 'adaptive-control-console', current.currentSector),
    )) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const nextZ = current.topZ + 1

    const stackedBoard = {
      ...current,
      topZ: nextZ,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      stacks: current.stacks
        .filter((stack) => stack.id !== sourceStackId)
        .map((stack) =>
          stack.id === targetStack.id
            ? {
                ...stack,
                cardIds: [...stack.cardIds, ...sourceStack.cardIds],
                z: nextZ,
                drawChoiceGroupId: stack.drawChoiceGroupId ?? sourceStack.drawChoiceGroupId,
              }
            : stack,
        ),
    }
    return withPlaytestEvents(stackedBoard, [
      cardsStackedEvent(sourceStack, targetStack, current.cards),
    ])
  }
}

export function deckOnDropTargetUpdate(sourceDeckId: string, targetDeckId: string): BoardUpdater {
  return (current) => {
    const sourceDeck = current.decks.find((deck) => deck.id === sourceDeckId)
    const targetDeck = current.decks.find((deck) => deck.id === targetDeckId)

    if (
      current.hasArrived ||
      current.lossReason ||
      !sourceDeck ||
      !targetDeck ||
      !canMergeDecks(sourceDeck, targetDeck)
    ) {
      return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    }

    const nextZ = current.topZ + 1

    return withPlaytestEvents({
      ...current,
      topZ: nextZ,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      decks: current.decks
        .filter((deck) => deck.id !== sourceDeck.id)
        .map((deck) =>
          deck.id === targetDeck.id
            ? {
                ...deck,
                cards: [...sourceDeck.cards, ...deck.cards],
                z: nextZ,
              }
            : deck,
        ),
    }, decksMergedEvent(sourceDeck, targetDeck))
  }
}
