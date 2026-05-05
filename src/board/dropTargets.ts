import {
  getBoundsCenterDistance,
  getBoundsOverlapRatio,
  getDeckBounds,
  getStackBounds,
} from '../game/geometry'
import {
  canCombineAsDeck,
  canMergeDecks,
  canStackCards,
  isFaceDownStack,
} from '../game/rules'
import { getNextStopFuelDiscount } from '../game/effects'
import {
  countSpentShipParts,
  getProtectedRouteCardIds,
} from './routeState'
import type { BoardMetrics, BoardState, Bounds, Deck, DropTarget } from '../game/types'

const DROP_TARGET_OVERLAP_RATIO = 0.28

function stackContainsRouteCard(stackCardIds: readonly string[], routeCardIds: ReadonlySet<string>) {
  return stackCardIds.some((cardId) => routeCardIds.has(cardId))
}

function stackContainsOnlyRouteCards(stackCardIds: readonly string[], routeCardIds: ReadonlySet<string>) {
  return stackCardIds.length > 0 && stackCardIds.every((cardId) => routeCardIds.has(cardId))
}

export function getNearestDropTarget(
  board: BoardState,
  sourceStackId: string,
  metrics: BoardMetrics,
): DropTarget {
  const { stacks, decks, cards } = board
  const fuelDiscount = getNextStopFuelDiscount(board.pendingEffects)
  const spentServiceDroneBays = countSpentShipParts(board.shipPartSlots, 'service-drone-bay', board.currentSector)
  const spentControlConsoles = countSpentShipParts(board.shipPartSlots, 'adaptive-control-console', board.currentSector)
  const routeCardIds = new Set(getProtectedRouteCardIds(board.routeSlots, board.shipPartSlots))
  const sourceStack = stacks.find((stack) => stack.id === sourceStackId)
  const sourceHasRouteCard = sourceStack ? stackContainsRouteCard(sourceStack.cardIds, routeCardIds) : false
  const sourceIsRouteOnly = sourceStack ? stackContainsOnlyRouteCards(sourceStack.cardIds, routeCardIds) : false

  if (!sourceStack || (sourceHasRouteCard && !sourceIsRouteOnly)) {
    return { stackId: null, deckId: null }
  }

  const sourceBounds = getStackBounds(sourceStack, metrics)
  const sourceIsFaceDown = isFaceDownStack(sourceStack, cards)
  let nearestKind: 'stack' | 'deck' | null = null
  let nearestId: string | null = null
  let nearestOverlapRatio = 0
  let nearestCenterDistance = Number.POSITIVE_INFINITY

  function considerTarget(kind: 'stack' | 'deck', id: string, targetBounds: Bounds) {
    const overlapRatio = getBoundsOverlapRatio(sourceBounds, targetBounds)
    const centerDistance = getBoundsCenterDistance(sourceBounds, targetBounds)

    if (
      overlapRatio >= DROP_TARGET_OVERLAP_RATIO &&
      (overlapRatio > nearestOverlapRatio ||
        (overlapRatio === nearestOverlapRatio && centerDistance < nearestCenterDistance))
    ) {
      nearestKind = kind
      nearestId = id
      nearestOverlapRatio = overlapRatio
      nearestCenterDistance = centerDistance
    }
  }

  for (const targetStack of stacks) {
    if (targetStack.id === sourceStackId) {
      continue
    }

    const targetHasRouteCard = stackContainsRouteCard(targetStack.cardIds, routeCardIds)
    const targetIsRouteOnly = stackContainsOnlyRouteCards(targetStack.cardIds, routeCardIds)

    if (sourceIsRouteOnly) {
      if (!targetIsRouteOnly) {
        continue
      }

      considerTarget('stack', targetStack.id, getStackBounds(targetStack, metrics))
      continue
    }

    if (targetHasRouteCard) {
      continue
    }

    if (
      !canStackCards(sourceStack, targetStack, cards, fuelDiscount, board.stressCount, spentServiceDroneBays, spentControlConsoles) &&
      !canCombineAsDeck(sourceStack, targetStack, cards)
    ) {
      continue
    }

    considerTarget('stack', targetStack.id, getStackBounds(targetStack, metrics))
  }

  if (sourceIsFaceDown && !sourceIsRouteOnly) {
    for (const targetDeck of decks) {
      if (targetDeck.cards.length === 0) {
        continue
      }

      considerTarget('deck', targetDeck.id, getDeckBounds(targetDeck, metrics))
    }
  }

  return {
    stackId: nearestKind === 'stack' ? nearestId : null,
    deckId: nearestKind === 'deck' ? nearestId : null,
  }
}

export function getStackDropTargetIds(
  board: BoardState,
  sourceStackId: string,
) {
  const { stacks, cards } = board
  const fuelDiscount = getNextStopFuelDiscount(board.pendingEffects)
  const spentServiceDroneBays = countSpentShipParts(board.shipPartSlots, 'service-drone-bay', board.currentSector)
  const spentControlConsoles = countSpentShipParts(board.shipPartSlots, 'adaptive-control-console', board.currentSector)
  const routeCardIds = new Set(getProtectedRouteCardIds(board.routeSlots, board.shipPartSlots))
  const sourceStack = stacks.find((stack) => stack.id === sourceStackId)
  const sourceHasRouteCard = sourceStack ? stackContainsRouteCard(sourceStack.cardIds, routeCardIds) : false
  const sourceIsRouteOnly = sourceStack ? stackContainsOnlyRouteCards(sourceStack.cardIds, routeCardIds) : false

  if (!sourceStack || (sourceHasRouteCard && !sourceIsRouteOnly)) {
    return []
  }

  return stacks.flatMap((targetStack) => {
    if (targetStack.id === sourceStackId) {
      return []
    }

    const targetHasRouteCard = stackContainsRouteCard(targetStack.cardIds, routeCardIds)
    const targetIsRouteOnly = stackContainsOnlyRouteCards(targetStack.cardIds, routeCardIds)

    if (sourceIsRouteOnly) {
      return targetIsRouteOnly ? [targetStack.id] : []
    }

    if (targetHasRouteCard) {
      return []
    }

    return canStackCards(sourceStack, targetStack, cards, fuelDiscount, board.stressCount, spentServiceDroneBays, spentControlConsoles) ||
      canCombineAsDeck(sourceStack, targetStack, cards)
      ? [targetStack.id]
      : []
  })
}

export function getNearestDeckDropTarget(
  decks: Deck[],
  sourceDeckId: string,
  metrics: BoardMetrics,
) {
  const sourceDeck = decks.find((deck) => deck.id === sourceDeckId)

  if (!sourceDeck) {
    return null
  }

  const sourceBounds = getDeckBounds(sourceDeck, metrics)
  let nearestId: string | null = null
  let nearestOverlapRatio = 0
  let nearestCenterDistance = Number.POSITIVE_INFINITY

  for (const targetDeck of decks) {
    if (!canMergeDecks(sourceDeck, targetDeck)) {
      continue
    }

    const targetBounds = getDeckBounds(targetDeck, metrics)
    const overlapRatio = getBoundsOverlapRatio(sourceBounds, targetBounds)
    const centerDistance = getBoundsCenterDistance(sourceBounds, targetBounds)

    if (
      overlapRatio >= DROP_TARGET_OVERLAP_RATIO &&
      (overlapRatio > nearestOverlapRatio ||
        (overlapRatio === nearestOverlapRatio && centerDistance < nearestCenterDistance))
    ) {
      nearestId = targetDeck.id
      nearestOverlapRatio = overlapRatio
      nearestCenterDistance = centerDistance
    }
  }

  return nearestId
}
