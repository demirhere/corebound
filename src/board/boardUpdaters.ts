import {
  CRYO_DECK_ID,
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
  cardsDiscardedEvent,
  cardsMovedToHandEvent,
  cardsReturnedToDeckEvent,
  cardsStackedEvent,
  deckCreatedFromStacksEvent,
  decksMergedEvent,
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
  scoutUsedEvent,
  sectorRevealedEvent,
  shipPartAvailableEvent,
  shipPartSpentEvent,
  stackActionCompletedEvent,
  stackSplitEvent,
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
  canCompleteGateNeedWithCrewAndMother,
  canStackCards,
  cardsToDeckBlueprints,
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
  canStackForPotentialAction,
  getStackActions,
} from '../game/stackActions'
import { withPlaytestEvents, type BoardUpdater } from '../game/state'
import {
  getDeckCardCount,
  getReadyCrewCardIds,
} from '../game/boardQueries'
import {
  FUEL_SUPPLY_STACK_ID,
  FUEL_SUPPLY_STACK_POSITION,
  MAP_SLOT_COUNT,
  MOTHER_SUPPLY_STACK_ID,
  MOTHER_SUPPLY_STACK_POSITION,
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
  Stack,
} from '../game/types'
import {
  canPutCardIdsInHand,
  canUseManualHandZone,
  getCardHandZone,
  removeCardFromHandZones,
} from './handState'
import { clamp } from '../game/geometry'

type Position = {
  x: number
  y: number
}

function createCardFromBlueprint(blueprint: CardBlueprint, id: string): Card {
  return {
    ...blueprint,
    id,
    faceUp: true,
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

function canCompleteSectorGate(current: BoardState) {
  const gateCard = getSectorGateCard(current)

  if (!gateCard?.gate) {
    return false
  }

  const availableMedbayRehydrators = countShipParts(current.shipPartSlots, 'medbay-rehydrator', ['available'])
  const readyCrewCardIds = getReadyCrewCardIds(current)
  const potentiallyReadiedCrewCardIds = current.tiredCardIds
    .filter((cardId) => current.cards[cardId]?.kind === 'crew')
    .slice(0, availableMedbayRehydrators)
  const usableMotherCardsInPlay = countUsableMotherCardsInPlay(current.stacks, current.cards)
  const availableMotherCardCount = usableMotherCardsInPlay + getDeckCardCount(current, MOTHER_DECK_ID)

  return canCompleteGateNeedWithCrewAndMother(
    [...readyCrewCardIds, ...potentiallyReadiedCrewCardIds],
    current.cards,
    gateCard.gate,
    current.stressCount,
    availableMotherCardCount,
    countPotentialGateShipParts(current.shipPartSlots, 'service-drone-bay', current.currentSector),
    countPotentialGateShipParts(current.shipPartSlots, 'adaptive-control-console', current.currentSector),
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
  if (
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    !isSectorHorizonFinished(current) ||
    !getSectorGateCard(current) ||
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

  if (
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice ||
    isSectorHorizonFinished(current) ||
    visibleHorizonCardIds.length > 0 ||
    getDeckCardCount(current, HORIZON_DECK_ID) > 0
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

function isFuelResourceCard(card: Card | undefined) {
  return card?.kind === 'resource' && card.resource === 'fuel'
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

  return {
    board: {
      ...current,
      mapSlots: createEmptyMapSlots(),
      cards: withoutCards(current.cards, mapCardIds),
      stacks: removeCardIdsFromStacks(current.stacks, mapCardIds),
      decks: current.decks.map((deck) =>
        deck.id === HORIZON_DECK_ID
          ? { ...deck, cards: [] }
          : deck,
      ),
    },
    events: [
      ...(mapCardIdSet.size > 0
        ? [cardsDiscardedEvent(mapCardIds, current.cards, 'unchosen Map Destinations')]
        : []),
      ...thresholdEvents,
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

  if (!sourceStack || current.pendingWakeChoice || current.pendingScoutChoice) {
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
  const rewards = find.kind === 'visit_reward' ? find.rewards : []
  const shipPartFind = find.kind === 'ship_part' ? find : null
  const keepsCompletedCardOnRoute = shipPartFind !== null
  const spentCrewCardIds = getSpentCrewCardIds(sourceStack, current.cards)
  const spentCrewCardIdSet = new Set(spentCrewCardIds)
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
        },
      ]
    : current.shipPartSlots
  const routeFilledAfterCompletion = isRouteFilled(nextRouteSlots)
  const shouldScoutAfterVisit = scoutCount > 0 && !routeFilledAfterCompletion

  if (wakeCount > 0) {
    const wakeDraw = drawWakeChoiceCards(nextDecks, nextCards, nextCardId, wakeCount, nextZ)

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
    dropTargetStackId: null,
    dropTargetDeckId: null,
    mapSlots: current.mapSlots.map((cardId, index) => index === mapSlotIndex ? null : cardId),
    routeSlots: nextRouteSlots,
    shipPartSlots: nextShipPartSlots,
    handCardIds: readyCrewResult.handCardIds,
    tiredCardIds: tiredCardIdsWithSpentCrew,
    completedStarSummaries: [
      ...current.completedStarSummaries,
      {
        sector: current.currentSector,
        cardId: horizonCard.id,
        cardTitle: horizonCard.title,
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

  return {
    board: followUpLoss.board,
    events: [
      ...motherCommittedEvents,
      horizonCompletedEvent(horizonCard, sourceStack, rewardCards, current.cards),
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
    ? createCardFromBlueprint(nextGateBlueprint, `gate-${nextSector}-${current.nextCardId}`)
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
  const nextStressCount = current.stressCount + spentMotherCardIds.length

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
    stressCount: nextStressCount,
    cards: nextCards,
    stacks: [
      ...nextStacks,
      ...(nextGateCard
        ? [
            {
              id: `stack-sector-gate-${nextSector}`,
              cardIds: [nextGateCard.id],
              x: 43,
              y: 40,
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
    stressCountBefore,
    gateCard,
  )
  const requiredCrewSlots = gateCard.gate.need.crew + (
    current.stressCount >= gateCard.gate.motherPenalty.threshold
      ? gateCard.gate.motherPenalty.extraHumanCrew
      : 0
  )
  const missingIconsBeforeCoverage = getMissingNeedIcons(
    spentCrewCardIds,
    current.cards,
    gateCard.gate.need.icons,
    0,
  )

  return {
    board: returnedMother.board,
    events: [
      gateCrewStateBeforeEvent(current.cards, getReadyCrewCardIds(current), current.tiredCardIds),
      ...motherCommittedEvents,
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

function completeShipPartStackAction(
  current: BoardState,
  sourceStack: Stack,
  shipPartSlotIndex: number,
) {
  const shipPartSlot = current.shipPartSlots[shipPartSlotIndex]
  const routeCard = shipPartSlot ? current.cards[shipPartSlot.cardId] : null

  if (
    !shipPartSlot ||
    shipPartSlot.status !== 'available' ||
    !routeCard ||
    !sourceStack.cardIds.includes(shipPartSlot.cardId) ||
    !isSectorHorizonFinished(current)
  ) {
    return current
  }

  if (shipPartSlot.shipPart === 'medbay-rehydrator' && current.tiredCardIds.length === 0) {
    return current
  }

  const nextZ = current.topZ + 1
  const readyResult = shipPartSlot.shipPart === 'medbay-rehydrator'
    ? readyTiredCrew(current.handCardIds, current.tiredCardIds, 1)
    : null
  const routePosition = getRouteStackPosition(shipPartSlot.routeSlotIndex)
  const nextShipPartSlots = current.shipPartSlots.map((slot, index) => (
    index === shipPartSlotIndex
      ? { ...slot, status: 'spent' as const, spentSector: current.currentSector }
      : slot
  ))
  const stacksWithoutShipPart = current.stacks.flatMap((stack) => {
    if (stack.id !== sourceStack.id) {
      return [stack]
    }

    const keptCardIds = stack.cardIds.filter((cardId) => cardId !== shipPartSlot.cardId)

    return keptCardIds.length > 0
      ? [{ ...stack, cardIds: keptCardIds, z: nextZ }]
      : []
  })
  const returnedStackId = getDrawnRouteStackId(
    stacksWithoutShipPart,
    shipPartSlot.routeSlotIndex,
    shipPartSlot.cardId,
  )

  return withPlaytestEvents({
    ...current,
    topZ: nextZ,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    shipPartSlots: nextShipPartSlots,
    handCardIds: readyResult?.handCardIds ?? current.handCardIds,
    tiredCardIds: readyResult?.tiredCardIds ?? current.tiredCardIds,
    stacks: [
      ...stacksWithoutShipPart,
      {
        id: returnedStackId,
        cardIds: [shipPartSlot.cardId],
        x: routePosition.x,
        y: routePosition.y,
        z: nextZ,
      },
    ],
  }, shipPartSpentEvent(routeCard, shipPartSlot.routeSlotIndex, shipPartSlot.shipPart))
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

    if (action.kind === 'travel') {
      return completeReadyHorizonStack(current, stackId, metrics)
    }

    if (action.kind === 'pass-gate') {
      return completeReadyGateStack(current, stackId)
    }

    if (action.kind === 'use-ship-part' && action.shipPartSlotIndex !== undefined) {
      return completeShipPartStackAction(current, sourceStack, action.shipPartSlotIndex)
    }

    return current
  }
}

export function clearBoardDropTargetUpdate(current: BoardState) {
  return current.dropTargetStackId || current.dropTargetDeckId
    ? { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    : current
}

export function endTurnUpdate(current: BoardState) {
  if (
    current.hasArrived ||
    current.lossReason ||
    current.pendingWakeChoice ||
    current.pendingScoutChoice
  ) {
    return current
  }

  const nextTurnNumber = current.turnNumber + 1
  const nextBoard = {
    ...current,
    turnNumber: nextTurnNumber,
    sectorDrawnThisTurn: false,
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }
  const loss = resolveSectorStrandedLossIfNeeded(nextBoard)

  return withPlaytestEvents(loss.board, [
    turnEndedEvent(current.turnNumber, nextTurnNumber),
    ...loss.events,
  ])
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
      !deck ||
      !canManuallyDrawDeck(deck)
    ) {
      return current
    }

    if (deck.id === HORIZON_DECK_ID) {
      if (
        current.sectorDrawnThisTurn ||
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
      pendingWakeChoice: nextPendingWakeChoice,
      cards: nextCards,
      decks: nextDecks,
    }
    const followUpLoss = isSectorHorizonFinished(nextBoard)
      ? resolveGateLossIfNeeded(nextBoard)
      : resolveSectorStrandedLossIfNeeded(nextBoard)

    return withPlaytestEvents(followUpLoss.board, [
      wakeCrewRecruitedEvent(chosenCard, unchosenCardIds, current.cards, wakeReadyResult.readiedCrewCardIds),
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
  const strandedLoss = resolveSectorStrandedLossIfNeeded(scoutBoard)

  return withPlaytestEvents(strandedLoss.board, [
    scoutUsedEvent(
      pendingScoutChoice.choiceCardIds,
      keptCardId,
      bottomedCardIds,
      current.cards,
    ),
    ...strandedLoss.events,
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
      card.kind !== 'crew' ||
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

    if (sourceIsRouteOnly && (
      targetIsRouteOnly ||
      canStackForPotentialAction(current, sourceStack, targetStack)
    )) {
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
