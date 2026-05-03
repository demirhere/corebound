import {
  clamp,
  getStackHeight,
} from '../game/geometry'
import type { BoardMetrics, Deck, Stack } from '../game/types'

export const STACK_OFFSET_RATIO = 0.26

const DRAW_RADIUS_PERCENT = 18
const DRAW_MIN_RADIUS_PERCENT = 8
const DRAW_ROW_GAP_PX = 12

type Position = {
  x: number
  y: number
}

export function readBoardMetrics(boardElement: HTMLElement | null): BoardMetrics {
  const boardRect = boardElement?.getBoundingClientRect()
  const cardRect = boardElement
    ?.querySelector<HTMLElement>('.card-stack .card-shell, .deck-card')
    ?.getBoundingClientRect()
  const cardWidth = cardRect?.width ?? 112
  const cardHeight = cardRect?.height ?? 158

  return {
    width: boardRect?.width ?? 1000,
    height: boardRect?.height ?? 620,
    cardWidth,
    cardHeight,
    stackOffset: cardHeight * STACK_OFFSET_RATIO,
  }
}

export function clampStackPosition(
  x: number,
  y: number,
  cardCount: number,
  metrics: BoardMetrics,
): Position {
  const stackHeight = getStackHeight(cardCount, metrics)
  const maxX = 100 - (metrics.cardWidth / metrics.width) * 100 - 1
  const maxY = 100 - (stackHeight / metrics.height) * 100 - 1

  return {
    x: clamp(x, 1, Math.max(1, maxX)),
    y: clamp(y, 1, Math.max(1, maxY)),
  }
}

export function getNearbyDrawPosition(deck: Deck, metrics: BoardMetrics): Position {
  const distance =
    DRAW_MIN_RADIUS_PERCENT + Math.random() * (DRAW_RADIUS_PERCENT - DRAW_MIN_RADIUS_PERCENT)
  const angle = Math.random() * Math.PI * 2

  return clampStackPosition(
    deck.x + Math.cos(angle) * distance,
    deck.y + Math.sin(angle) * distance,
    1,
    metrics,
  )
}

export function getDeckDrawPositions(deck: Deck, drawCount: number, metrics: BoardMetrics) {
  if (deck.draw.placement === 'left-row') {
    const cardWidthPercent = (metrics.cardWidth / metrics.width) * 100
    const gapPercent = (DRAW_ROW_GAP_PX / metrics.width) * 100
    const rowWidthPercent =
      drawCount * cardWidthPercent + Math.max(0, drawCount - 1) * gapPercent
    const rowX = clamp(
      deck.x - rowWidthPercent - gapPercent,
      1,
      Math.max(1, 100 - rowWidthPercent - 1),
    )

    return Array.from({ length: drawCount }, (_, index) =>
      clampStackPosition(
        rowX + index * (cardWidthPercent + gapPercent),
        deck.y,
        1,
        metrics,
      ),
    )
  }

  return Array.from({ length: drawCount }, () => getNearbyDrawPosition(deck, metrics))
}

export function getCardOrigin(stack: Stack, cardIndex: number, metrics: BoardMetrics): Position {
  const offsetPercent = ((metrics.stackOffset * cardIndex) / metrics.height) * 100

  return {
    x: stack.x,
    y: stack.y + offsetPercent,
  }
}

export function getBoardDropPosition(
  clientX: number,
  clientY: number,
  boardElement: HTMLElement | null,
  handElement: HTMLElement | null,
  metrics: BoardMetrics,
  placeAboveHand = false,
): Position {
  const boardRect = boardElement?.getBoundingClientRect()
  const handRect = handElement?.getBoundingClientRect()
  const boardLeft = boardRect?.left ?? 0
  const boardTop = boardRect?.top ?? 0
  const targetClientY =
    placeAboveHand && handRect
      ? Math.min(clientY, handRect.top - metrics.cardHeight / 2 - 14)
      : clientY

  return {
    x: ((clientX - boardLeft - metrics.cardWidth / 2) / metrics.width) * 100,
    y: ((targetClientY - boardTop - metrics.cardHeight / 2) / metrics.height) * 100,
  }
}
