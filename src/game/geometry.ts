import type { BoardMetrics, Bounds, Deck, Stack } from './types'

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getStackHeight(cardCount: number, metrics: BoardMetrics) {
  return metrics.cardHeight + Math.max(0, cardCount - 1) * metrics.stackOffset
}

export function getStackBounds(stack: Stack, metrics: BoardMetrics): Bounds {
  const left = (stack.x / 100) * metrics.width
  const top = (stack.y / 100) * metrics.height

  return {
    left,
    top,
    right: left + metrics.cardWidth,
    bottom: top + getStackHeight(stack.cardIds.length, metrics),
  }
}

export function getDeckBounds(deck: Deck, metrics: BoardMetrics): Bounds {
  const left = (deck.x / 100) * metrics.width
  const top = (deck.y / 100) * metrics.height

  return {
    left,
    top,
    right: left + metrics.cardWidth,
    bottom: top + metrics.cardHeight,
  }
}

export function getBoundsCenterDistance(source: Bounds, target: Bounds) {
  const sourceCenterX = (source.left + source.right) / 2
  const sourceCenterY = (source.top + source.bottom) / 2
  const targetCenterX = (target.left + target.right) / 2
  const targetCenterY = (target.top + target.bottom) / 2

  return Math.hypot(sourceCenterX - targetCenterX, sourceCenterY - targetCenterY)
}

export function getBoundsOverlapRatio(source: Bounds, target: Bounds) {
  const overlapWidth = Math.max(0, Math.min(source.right, target.right) - Math.max(source.left, target.left))
  const overlapHeight = Math.max(0, Math.min(source.bottom, target.bottom) - Math.max(source.top, target.top))
  const sourceArea = Math.max(0, source.right - source.left) * Math.max(0, source.bottom - source.top)
  const targetArea = Math.max(0, target.right - target.left) * Math.max(0, target.bottom - target.top)
  const smallerArea = Math.min(sourceArea, targetArea)

  return smallerArea === 0 ? 0 : (overlapWidth * overlapHeight) / smallerArea
}
