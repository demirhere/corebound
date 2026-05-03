import { HORIZON_DECK_ID, MOTHER_DECK_ID, canManuallyDrawDeck, manualDeckDraw } from '../game/decks'
import {
  applyPendingEffectsToDrawnCard,
  consumeDeckDrawModifiers,
  consumeNextStarFuelDiscount,
  createBoardEffectsForHorizonRewards,
  getNextStarFuelDiscount,
  getPendingDrawCount,
} from '../game/effects'
import {
  clampStackPosition,
  getDeckDrawPositions,
  getNearbyDrawPosition,
} from './interactionGeometry'
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
  gateCrewStateBeforeEvent,
  handCardDroppedEvent,
  horizonCompletedEvent,
  motherCommittedEvent,
  motherReturnedUnusedEvent,
  motherSpentEvent,
  motherThresholdCrossedEvent,
  readyRewardAppliedEvent,
  scoutUsedEvent,
  stackSplitEvent,
  starsCompletedSummaryEvent,
  wakeCrewRecruitedEvent,
} from '../game/logEvents'
import type { PlaytestLogEvent } from '../game/playtestLog'
import {
  canCombineAsDeck,
  canCompleteHorizonNeedWithFuelOptions,
  canCompleteNeedWithCrewAndMother,
  canStackCards,
  cardsToDeckBlueprints,
  countSpentMotherCardsInPlay,
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
import { withPlaytestEvents, type BoardUpdater } from '../game/state'
import type {
  BoardMetrics,
  BoardState,
  Card,
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

const CRYO_DECK_ID = 'cryo-deck'

type Position = {
  x: number
  y: number
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
  motherSpentTotalBefore: number,
  actionCard: Card,
  gateCard: Card | null,
) {
  const events: PlaytestLogEvent[] = []
  let motherSpentTotal = motherSpentTotalBefore

  for (const cardId of cardIds) {
    const card = cards[cardId]

    if (card?.kind !== 'mother') {
      continue
    }

    motherSpentTotal += 1
    events.push(motherSpentEvent(card, motherSpentTotal))

    if (gateCard?.gate && motherSpentTotal === gateCard.gate.motherPenalty.threshold) {
      events.push(motherThresholdCrossedEvent(
        actionCard,
        gateCard,
        motherSpentTotal - 1,
        motherSpentTotal,
        gateCard.gate.motherPenalty.extraAnyIcons,
      ))
    }
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

function getDeckCardCount(current: BoardState, deckId: string) {
  return current.decks.find((deck) => deck.id === deckId)?.cards.length ?? 0
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

function getReadyCrewCardIds(current: BoardState) {
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

function countFuelCardsInPlay(current: BoardState) {
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

function getAvailableMotherCardCount(current: BoardState) {
  return (
    countUsableMotherCardsInPlay(current.stacks, current.cards) +
    getDeckCardCount(current, MOTHER_DECK_ID)
  )
}

function canTravelToHorizon(current: BoardState, horizonCard: Card) {
  if (!horizonCard.horizon) {
    return false
  }

  const requiredFuel = Math.max(
    0,
    horizonCard.horizon.need.fuel - getNextStarFuelDiscount(current.pendingEffects),
  )

  return (
    canCompleteHorizonNeedWithFuelOptions(
      getReadyCrewCardIds(current),
      current.cards,
      horizonCard.horizon.need.icons,
      requiredFuel,
      countFuelCardsInPlay(current),
      getAvailableMotherCardCount(current),
    )
  )
}

function canTravelToAnyHorizon(current: BoardState, horizonCardIds: readonly string[]) {
  return horizonCardIds.some((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'horizon' && canTravelToHorizon(current, card)
  })
}

function getSectorGateCard(current: BoardState) {
  for (const stack of current.stacks) {
    for (const cardId of stack.cardIds) {
      const card = current.cards[cardId]

      if (card?.kind === 'gate' && card.gate) {
        return card
      }
    }
  }

  return null
}

function canCompleteSectorGate(current: BoardState) {
  const gateCard = getSectorGateCard(current)

  if (!gateCard?.gate) {
    return false
  }

  const readyCrewCardIds = getReadyCrewCardIds(current)
  const motherSpentTotal = countSpentMotherCardsInPlay(current.stacks, current.cards)
  const usableMotherCardsInPlay = countUsableMotherCardsInPlay(current.stacks, current.cards)
  const availableMotherCardCount = usableMotherCardsInPlay + getDeckCardCount(current, MOTHER_DECK_ID)

  for (let motherCardsUsed = 0; motherCardsUsed <= availableMotherCardCount; motherCardsUsed += 1) {
    const motherSpentTotalAfterUse = motherSpentTotal + motherCardsUsed
    const extraAnyIconsRequired =
      motherSpentTotalAfterUse >= gateCard.gate.motherPenalty.threshold
        ? gateCard.gate.motherPenalty.extraAnyIcons
        : 0

    if (
      canCompleteNeedWithCrewAndMother(
        readyCrewCardIds,
        current.cards,
        gateCard.gate.need.icons,
        gateCard.gate.need.any,
        motherCardsUsed,
        extraAnyIconsRequired,
      )
    ) {
      return true
    }
  }

  return false
}

function resolveLoss(current: BoardState, reason: GameLossReason) {
  if (current.hasArrived || current.lossReason) {
    return { board: current, events: [] }
  }

  return {
    board: {
      ...current,
      lossReason: reason,
      dropTargetStackId: null,
      dropTargetDeckId: null,
    },
    events: [gameLostEvent(reason)],
  }
}

function isSectorHorizonFinished(current: BoardState) {
  const horizonDeck = current.decks.find((deck) => deck.id === HORIZON_DECK_ID)
  const hasHorizonCardsInPlay = current.stacks.some((stack) =>
    stack.cardIds.some((cardId) => current.cards[cardId]?.kind === 'horizon'),
  )

  return (horizonDeck?.cards.length ?? 0) === 0 && !hasHorizonCardsInPlay
}

function resolveGateLossIfNeeded(current: BoardState) {
  if (
    current.hasArrived ||
    current.lossReason ||
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

function completeReadyHorizonStack(current: BoardState, stackId: string, metrics: BoardMetrics) {
  const sourceStack = current.stacks.find((stack) => stack.id === stackId)

  if (!sourceStack || current.pendingWakeChoice || current.pendingScoutChoice) {
    return { board: current, events: [] }
  }

  const completion = getHorizonStackCompletion(
    sourceStack,
    current.cards,
    getNextStarFuelDiscount(current.pendingEffects),
  )

  if (!completion?.isReady) {
    return { board: current, events: [] }
  }

  const horizonCard = current.cards[completion.horizonCardId]

  if (!horizonCard?.horizon) {
    return { board: current, events: [] }
  }

  const nextZ = current.topZ + 1
  const rewards = horizonCard.horizon.rewards
  const spentCrewCardIds = getSpentCrewCardIds(sourceStack, current.cards)
  const spentCrewCardIdSet = new Set(spentCrewCardIds)
  const spentFuelCount = sourceStack.cardIds.filter((cardId) => {
    const card = current.cards[cardId]

    return card?.kind === 'resource' && card.resource === 'fuel'
  }).length
  const usableMotherCardIds = getUsableMotherCardIds(sourceStack, current.cards)
  const usableMotherCardIdsInPlay = getUsableMotherCardIdsInPlay(current.stacks, current.cards)
  const motherSpentTotalBefore = countSpentMotherCardsInPlay(current.stacks, current.cards)
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
  const otherChoiceStacks = sourceStack.drawChoiceGroupId
    ? current.stacks.filter(
        (stack) =>
          stack.id !== sourceStack.id &&
          stack.drawChoiceGroupId === sourceStack.drawChoiceGroupId,
      )
    : []
  const otherChoiceCardIds = otherChoiceStacks.flatMap((stack) => stack.cardIds)

  for (const rewardCard of rewardCards) {
    nextCards[rewardCard.id] = rewardCard
  }

  for (const cardId of otherChoiceCardIds) {
    delete nextCards[cardId]
  }

  let pendingWakeChoice: BoardState['pendingWakeChoice'] = current.pendingWakeChoice
  let pendingScoutChoice: BoardState['pendingScoutChoice'] = current.pendingScoutChoice

  if (wakeCount > 0) {
    const wakeDraw = drawWakeChoiceCards(nextDecks, nextCards, nextCardId, wakeCount, nextZ)

    nextCards = wakeDraw.cards
    nextDecks = wakeDraw.decks
    nextCardId = wakeDraw.nextCardId
    pendingWakeChoice = wakeDraw.pendingWakeChoice
  }

  if (scoutCount > 0) {
    const scoutDraw = drawScoutChoiceCards(nextDecks, nextCards, nextCardId, scoutCount, nextZ)

    nextCards = scoutDraw.cards
    nextDecks = scoutDraw.decks
    nextCardId = scoutDraw.nextCardId
    pendingScoutChoice = scoutDraw.pendingScoutChoice
  }

  const resolvedCards = markMotherCardsSpent(nextCards, spentMotherCardIds)

  const rewardPosition =
    rewardCards.length > 0
      ? clampStackPosition(
          sourceStack.x + (sourceStack.x > 66 ? -9 : 9),
          sourceStack.y + (sourceStack.y > 56 ? -5 : 5),
          rewardCards.length,
          metrics,
        )
      : null
  const rewardStackId = `stack-reward-${horizonCard.id}`
  const nextStacksWithoutSource = current.stacks.filter(
    (stack) =>
      stack.id !== sourceStack.id &&
      !otherChoiceStacks.some((choiceStack) => choiceStack.id === stack.id),
  )
  const resolvedStacks = [
    ...nextStacksWithoutSource,
    ...(spentMotherCardIds.length > 0
      ? [
          {
            ...sourceStack,
            cardIds: spentMotherCardIds,
            z: nextZ,
            drawChoiceGroupId: undefined,
          },
        ]
      : []),
    ...(rewardCards.length > 0
      ? [
          {
            id: spentMotherCardIds.length > 0 ? rewardStackId : sourceStack.id,
            cardIds: rewardCards.map((card) => card.id),
            x: rewardPosition?.x ?? sourceStack.x,
            y: rewardPosition?.y ?? sourceStack.y,
            z: nextZ,
          },
        ]
      : []),
  ]

  const nextBoard = {
    ...current,
    topZ: nextZ,
    nextCardId,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    handCardIds: readyCrewResult.handCardIds,
    tiredCardIds: tiredCardIdsWithSpentCrew,
    completedStarSummaries: [
      ...current.completedStarSummaries,
      {
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
    pendingEffects: [
      ...consumeNextStarFuelDiscount(current.pendingEffects),
      ...createBoardEffectsForHorizonRewards(rewards),
    ],
    cards: resolvedCards,
    stacks: resolvedStacks,
    decks: nextDecks,
  }
  const returnedMother = returnMotherCardsToDeck(
    nextBoard,
    returnedMotherCardIds,
    sourceStack.id,
    `unused after ${horizonCard.title} completion`,
  )
  const gateLoss = resolveGateLossIfNeeded(returnedMother.board)
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
    motherSpentTotalBefore,
    horizonCard,
    getSectorGateCard(current),
  )

  return {
    board: gateLoss.board,
    events: [
      ...motherCommittedEvents,
      horizonCompletedEvent(horizonCard, sourceStack, rewardCards, current.cards),
      ...motherSpentEvents,
      ...readyRewardEvents,
      ...returnedMother.events,
      ...otherChoiceStacks.map((stack) => cardsDiscardedEvent(stack.cardIds, current.cards, stack.id)),
      ...gateLoss.events,
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

  const motherSpentTotalBefore = countSpentMotherCardsInPlay(current.stacks, current.cards)
  const completion = getGateStackCompletion(sourceStack, current.cards, motherSpentTotalBefore)

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
  const nextCards = markMotherCardsSpent(current.cards, spentMotherCardIds)
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

  const nextBoard = {
    ...current,
    hasArrived: true,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    handCardIds: readyCrewResult.handCardIds,
    tiredCardIds: readyCrewResult.tiredCardIds,
    cards: nextCards,
    stacks: current.stacks.map((stack) =>
      stack.id === sourceStack.id
        ? {
            ...stack,
            cardIds: stack.cardIds.filter(
              (cardId) => !spentCrewCardIdSet.has(cardId) && !returnedMotherCardIdSet.has(cardId),
            ),
          }
        : stack,
    ),
  }
  const returnedMother = returnMotherCardsToDeck(
    nextBoard,
    returnedMotherCardIds,
    sourceStack.id,
    `unused after ${gateCard.title} completion`,
  )
  const motherCoveredIcons = getMissingNeedIcons(
    spentCrewCardIds,
    current.cards,
    gateCard.gate.need.icons,
    gateCard.gate.need.any + completion.extraAnyIconsRequired,
  )
  const motherCommittedEvents = createMotherCommittedEvents(
    current.cards,
    usableMotherCardIds,
    gateCard,
    motherCoveredIcons,
  )
  const motherSpentEvents = createMotherSpentEvents(
    current.cards,
    spentMotherCardIds,
    motherSpentTotalBefore,
    gateCard,
    gateCard,
  )

  return {
    board: returnedMother.board,
    events: [
      gateCrewStateBeforeEvent(current.cards, getReadyCrewCardIds(current), current.tiredCardIds),
      ...motherCommittedEvents,
      ...motherSpentEvents,
      gateCompletedEvent(
        gateCard,
        sourceStack,
        current.cards,
        usableMotherCardIds.length,
        completion.motherSpentTotal,
        completion.extraAnyIconsRequired,
      ),
      starsCompletedSummaryEvent(
        current.completedStarSummaries,
        current.cards,
        getReadyCrewCardIds(current),
        current.tiredCardIds,
        completion.motherSpentTotal,
      ),
      ...returnedMother.events,
    ],
  }
}

export function clearBoardDropTargetUpdate(current: BoardState) {
  return current.dropTargetStackId || current.dropTargetDeckId
    ? { ...current, dropTargetStackId: null, dropTargetDeckId: null }
    : current
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
      drawEvents.push(cardDrawnEvent(newCard, deck, newStackId, position.x, position.y))
    }

    const drawnHorizonCardIds = drawnStacks.flatMap((stack) => {
      const cardId = stack.cardIds[0]
      const card = cardId ? nextCards[cardId] : undefined

      return card?.kind === 'horizon' ? [card.id] : []
    })
    const nextBoard = {
      ...current,
      topZ: firstCardZ + drawnStacks.length - 1,
      nextCardId,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      pendingEffects,
      cards: nextCards,
      stacks: [
        ...current.stacks,
        ...drawnStacks,
      ],
      decks: current.decks.map((candidate) =>
        candidate.id === deckId
          ? { ...candidate, cards: candidate.cards.slice(drawnBlueprints.length), z: deckZ }
          : candidate,
      ),
    }
    const loss =
      deck.id === HORIZON_DECK_ID &&
      drawnHorizonCardIds.length > 0 &&
      !canTravelToAnyHorizon(nextBoard, drawnHorizonCardIds)
        ? resolveLoss(nextBoard, 'sector-stranded')
        : { board: nextBoard, events: [] }

    return withPlaytestEvents(loss.board, [...drawEvents, ...loss.events])
  }
}

export function chooseWakeCrewUpdate(cardId: string): BoardUpdater {
  return (current) => {
    const pendingWakeChoice = current.pendingWakeChoice

    if (!pendingWakeChoice || !pendingWakeChoice.choiceCardIds.includes(cardId)) {
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

    return withPlaytestEvents({
      ...current,
      topZ: nextTopZ,
      nextCardId,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      handCardIds: current.handCardIds.filter((candidateId) => candidateId !== cardId),
      tiredCardIds: current.tiredCardIds.includes(cardId)
        ? current.tiredCardIds
        : [...current.tiredCardIds, cardId],
      pendingWakeChoice: nextPendingWakeChoice,
      cards: nextCards,
      decks: nextDecks,
    }, wakeCrewRecruitedEvent(chosenCard, unchosenCardIds, current.cards))
  }
}

export function chooseScoutCardUpdate(cardId: string): BoardUpdater {
  return (current) => {
    const pendingScoutChoice = current.pendingScoutChoice

    if (!pendingScoutChoice || !pendingScoutChoice.choiceCardIds.includes(cardId)) {
      return current
    }

    if (!pendingScoutChoice.keptCardId) {
      return {
        ...current,
        pendingScoutChoice: {
          ...pendingScoutChoice,
          keptCardId: cardId,
        },
      }
    }

    if (cardId === pendingScoutChoice.keptCardId || pendingScoutChoice.bottomedCardIds.includes(cardId)) {
      return current
    }

    return {
      ...current,
      pendingScoutChoice: {
        ...pendingScoutChoice,
        bottomedCardIds: [...pendingScoutChoice.bottomedCardIds, cardId],
      },
    }
  }
}

export function resetScoutChoiceUpdate(current: BoardState) {
  const pendingScoutChoice = current.pendingScoutChoice

  if (!pendingScoutChoice) {
    return current
  }

  return {
    ...current,
    pendingScoutChoice: {
      ...pendingScoutChoice,
      keptCardId: null,
      bottomedCardIds: [],
    },
  }
}

export function confirmScoutChoiceUpdate(current: BoardState) {
  const pendingScoutChoice = current.pendingScoutChoice
  const keptCardId = pendingScoutChoice?.keptCardId

  if (!pendingScoutChoice || !keptCardId) {
    return current
  }

  const requiredBottomedCardIds = pendingScoutChoice.choiceCardIds.filter((cardId) => cardId !== keptCardId)
  const bottomedCardIdSet = new Set(pendingScoutChoice.bottomedCardIds)

  if (
    bottomedCardIdSet.size !== requiredBottomedCardIds.length ||
    requiredBottomedCardIds.some((cardId) => !bottomedCardIdSet.has(cardId))
  ) {
    return current
  }

  const keptCard = cardsToDeckBlueprints([keptCardId], current.cards)
  const bottomedCards = cardsToDeckBlueprints(pendingScoutChoice.bottomedCardIds, current.cards)

  if (keptCard.length !== 1 || bottomedCards.length !== requiredBottomedCardIds.length) {
    return current
  }

  return withPlaytestEvents({
    ...current,
    pendingScoutChoice: null,
    cards: withoutCards(current.cards, pendingScoutChoice.choiceCardIds),
    decks: current.decks.map((deck) =>
      deck.id === HORIZON_DECK_ID
        ? { ...deck, cards: [...keptCard, ...deck.cards, ...bottomedCards] }
        : deck,
    ),
  }, scoutUsedEvent(
    pendingScoutChoice.choiceCardIds,
    keptCardId,
    pendingScoutChoice.bottomedCardIds,
    current.cards,
  ))
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
  metrics: BoardMetrics,
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
      getNextStarFuelDiscount(current.pendingEffects),
      countSpentMotherCardsInPlay(current.stacks, current.cards),
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
    const completedStack = completeReadyHorizonStack(stackedBoard, targetStack.id, metrics)
    const completedGateStack = completeReadyGateStack(completedStack.board, targetStack.id)
    const completedEvents = [...completedStack.events, ...completedGateStack.events]

    return withPlaytestEvents(completedGateStack.board, [
      cardsStackedEvent(sourceStack, targetStack, current.cards),
      ...completedEvents,
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
      sourceDeck.id === targetDeck.id
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
