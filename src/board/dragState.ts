import type { BoardMetrics, HandZone } from '../game/types'

export type StackDragState = {
  kind: 'stack'
  pointerId: number
  stackId: string
  cardId: string
  cardIndex: number
  movingStackId: string
  activeStackId: string | null
  metrics: BoardMetrics
  movingCardCount: number
  sourceElement: HTMLElement | null
  activeElement: HTMLElement | null
  startClientX: number
  startClientY: number
  currentClientX: number
  currentClientY: number
  startX: number
  startY: number
  latestX: number
  latestY: number
  latestDeltaX: number
  latestDeltaY: number
  dropTargetStackId: string | null
  dropTargetDeckId: string | null
  dropTargetHandZone: HandZone | null
  dropTargetDiscard: boolean
  handInsertIndex: number | null
  hasMoved: boolean
}

export type DeckDragState = {
  kind: 'deck'
  pointerId: number
  deckId: string
  metrics: BoardMetrics
  element: HTMLElement | null
  startClientX: number
  startClientY: number
  currentClientX: number
  currentClientY: number
  startX: number
  startY: number
  latestX: number
  latestY: number
  latestDeltaX: number
  latestDeltaY: number
  dropTargetDeckId: string | null
  hasMoved: boolean
}

export type HandDragState = {
  kind: 'hand'
  pointerId: number
  cardId: string
  sourceHandZone: HandZone
  element: HTMLElement | null
  dropTargetHandZone: HandZone | null
  handInsertIndex: number | null
  dropTargetDiscard: boolean
  startClientX: number
  startClientY: number
  currentClientX: number
  currentClientY: number
  latestDeltaX: number
  latestDeltaY: number
  hasMoved: boolean
}

export type DragState = StackDragState | DeckDragState | HandDragState

export type DragPreparation = 'idle' | 'active' | 'stale'

export type HandInsertPreview = {
  zone: HandZone
  index: number
  cardCount: number
  activeCardId: string | null
}
