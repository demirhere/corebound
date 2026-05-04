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
import type { BoardMetrics, BoardState, Bounds, Deck, DropTarget, RouteSlot, ShipPartKind } from '../game/types'

const DROP_TARGET_OVERLAP_RATIO = 0.28

function countSpentShipParts(routeSlots: readonly (RouteSlot | null)[], shipPart: ShipPartKind) {
  return routeSlots.reduce((count, slot) => (
    slot?.shipPart === shipPart && slot.status === 'spent' ? count + 1 : count
  ), 0)
}

export function getNearestDropTarget(
  board: BoardState,
  sourceStackId: string,
  metrics: BoardMetrics,
): DropTarget {
  const { stacks, decks, cards } = board
  const fuelDiscount = getNextStopFuelDiscount(board.pendingEffects)
  const spentHullPatches = countSpentShipParts(board.routeSlots, 'hull-patch')
  const spentBeacons = countSpentShipParts(board.routeSlots, 'wayfinder-beacon')
  const sourceStack = stacks.find((stack) => stack.id === sourceStackId)

  if (!sourceStack) {
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

    if (
      !canStackCards(sourceStack, targetStack, cards, fuelDiscount, board.stressCount, spentHullPatches, spentBeacons) &&
      !canCombineAsDeck(sourceStack, targetStack, cards)
    ) {
      continue
    }

    considerTarget('stack', targetStack.id, getStackBounds(targetStack, metrics))
  }

  if (sourceIsFaceDown) {
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
  const spentHullPatches = countSpentShipParts(board.routeSlots, 'hull-patch')
  const spentBeacons = countSpentShipParts(board.routeSlots, 'wayfinder-beacon')
  const sourceStack = stacks.find((stack) => stack.id === sourceStackId)

  if (!sourceStack) {
    return []
  }

  return stacks.flatMap((targetStack) => {
    if (targetStack.id === sourceStackId) {
      return []
    }

    return canStackCards(sourceStack, targetStack, cards, fuelDiscount, board.stressCount, spentHullPatches, spentBeacons) ||
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
