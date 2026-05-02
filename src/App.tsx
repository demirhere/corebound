import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { Board } from './components/Board'
import { PlaytestLog } from './components/PlaytestLog'
import { canManuallyDrawDeck } from './game/decks'
import {
  getBoundsCenterDistance,
  getBoundsOverlapRatio,
  getDeckBounds,
  getStackBounds,
  getStackHeight,
  clamp,
} from './game/geometry'
import {
  cardDrawnEvent,
  cardsMovedToHandEvent,
  cardsDiscardedEvent,
  cardsReturnedToDeckEvent,
  cardsStackedEvent,
  deckCreatedFromStacksEvent,
  decksMergedEvent,
  handCardDroppedEvent,
  horizonCompletedEvent,
  stackSplitEvent,
} from './game/logEvents'
import { formatConsoleLogEntry } from './game/playtestLog'
import {
  canCombineAsDeck,
  canStackCards,
  cardsToDeckBlueprints,
  getHorizonStackCompletion,
  isFaceDownStack,
  withoutCards,
} from './game/rules'
import {
  createInitialGameState,
  gameReducer,
  withPlaytestEvents,
  type BoardUpdater,
} from './game/state'
import type {
  BoardMetrics,
  BoardState,
  Bounds,
  Card,
  Deck,
  DropTarget,
  HandZone,
  Stack,
} from './game/types'
import './App.css'

type StackDragState = {
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

type DeckDragState = {
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

type HandDragState = {
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

type DragState = StackDragState | DeckDragState | HandDragState

type DragPreparation = 'idle' | 'active' | 'stale'

type HandInsertPreview = {
  zone: HandZone
  index: number
  cardCount: number
  activeCardId: string | null
}

const DRAG_CLICK_TOLERANCE = 5
const DRAW_RADIUS_PERCENT = 18
const DRAW_MIN_RADIUS_PERCENT = 8
const STACK_OFFSET_RATIO = 0.26
const DROP_TARGET_OVERLAP_RATIO = 0.28

function App() {
  const boardRef = useRef<HTMLDivElement>(null)
  const handRef = useRef<HTMLElement>(null)
  const dragsRef = useRef<Map<number, DragState>>(new Map())
  const pendingDragIdsRef = useRef<Set<number>>(new Set())
  const dragFrameRef = useRef<number | null>(null)
  const stackDropTargetCountsRef = useRef<Map<string, number>>(new Map())
  const deckDropTargetCountsRef = useRef<Map<string, number>>(new Map())
  const handDropTargetCountsRef = useRef<Record<HandZone, number>>({ crew: 0, tired: 0 })
  const discardDropTargetCountRef = useRef(0)
  const lastConsoleLogIdRef = useRef(0)
  const [game, dispatchGame] = useReducer(gameReducer, undefined, createInitialGameState)
  const { board, playtestLog } = game
  const boardStateRef = useRef<BoardState>(board)
  const [activeStackIds, setActiveStackIds] = useState<string[]>([])
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>([])
  const [activeHandCardIds, setActiveHandCardIds] = useState<string[]>([])
  const [handInsertPreview, setHandInsertPreview] = useState<HandInsertPreview | null>(null)

  function setBoard(update: BoardUpdater) {
    dispatchGame({
      type: 'apply-board-update',
      update,
      occurredAt: new Date().toISOString(),
    })
  }

  function resetGame() {
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
    }

    for (const drag of dragsRef.current.values()) {
      releaseBoardPointer(drag.pointerId)

      if (drag.kind === 'stack') {
        clearStackDragDropTarget(drag)
        clearDragTransform(drag.activeElement)
      } else if (drag.kind === 'deck') {
        clearDeckDragDropTarget(drag)
        clearDragTransform(drag.element)
      } else {
        clearHandDragDropTarget(drag)
        clearDragTransform(drag.element)
      }
    }

    dragsRef.current.clear()
    pendingDragIdsRef.current.clear()
    stackDropTargetCountsRef.current.clear()
    deckDropTargetCountsRef.current.clear()
    handDropTargetCountsRef.current = { crew: 0, tired: 0 }
    discardDropTargetCountRef.current = 0
    boardRef.current
      ?.querySelectorAll<HTMLElement>('.is-drop-target')
      .forEach((element) => element.classList.remove('is-drop-target'))
    boardRef.current
      ?.querySelectorAll<HTMLElement>('.is-discard-preview')
      .forEach((element) => element.classList.remove('is-discard-preview'))
    getHandElement()
      ?.querySelectorAll<HTMLElement>('[data-hand-zone]')
      .forEach((element) => element.classList.remove('is-drop-target'))
    getDiscardElement()?.classList.remove('is-drop-target')
    setActiveStackIds([])
    setActiveDeckIds([])
    setActiveHandCardIds([])
    setHandInsertPreview(null)
    lastConsoleLogIdRef.current = 0
    dispatchGame({ type: 'reset-game' })
  }

  useLayoutEffect(() => {
    boardStateRef.current = board
  }, [board])

  useEffect(() => {
    const newEntries = playtestLog.filter((entry) => entry.id > lastConsoleLogIdRef.current)

    for (const entry of newEntries) {
      console.info(formatConsoleLogEntry(entry), entry)
    }

    const lastEntry = newEntries.at(-1)

    if (lastEntry) {
      lastConsoleLogIdRef.current = lastEntry.id
    }
  }, [playtestLog])

  useLayoutEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    for (const stackId of stackDropTargetCountsRef.current.keys()) {
      getStackElement(stackId)?.classList.add('is-drop-target')
    }

    for (const deckId of deckDropTargetCountsRef.current.keys()) {
      getDeckElement(deckId)?.classList.add('is-drop-target')
    }

    for (const handZone of ['crew', 'tired'] as const) {
      if (handDropTargetCountsRef.current[handZone] > 0) {
        getHandZoneElement(handZone)?.classList.add('is-drop-target')
      }
    }

    if (discardDropTargetCountRef.current > 0) {
      getDiscardElement()?.classList.add('is-drop-target')
    }
  })

  function readBoardMetrics(): BoardMetrics {
    const boardElement = boardRef.current
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

  function clampStackPosition(
    x: number,
    y: number,
    cardCount: number,
    metrics = readBoardMetrics(),
  ) {
    const stackHeight = getStackHeight(cardCount, metrics)
    const maxX = 100 - (metrics.cardWidth / metrics.width) * 100 - 1
    const maxY = 100 - (stackHeight / metrics.height) * 100 - 1

    return {
      x: clamp(x, 1, Math.max(1, maxX)),
      y: clamp(y, 1, Math.max(1, maxY)),
    }
  }

  function getCardOrigin(stack: Stack, cardIndex: number, metrics = readBoardMetrics()) {
    const offsetPercent = ((metrics.stackOffset * cardIndex) / metrics.height) * 100

    return {
      x: stack.x,
      y: stack.y + offsetPercent,
    }
  }

  function getStackElement(stackId: string) {
    return boardRef.current?.querySelector<HTMLElement>(`[data-stack-id="${stackId}"]`) ?? null
  }

  function getDeckElement(deckId: string) {
    return boardRef.current?.querySelector<HTMLElement>(`[data-deck-id="${deckId}"]`) ?? null
  }

  function getHandElement() {
    return handRef.current
  }

  function getHandZoneElement(zone: HandZone) {
    return handRef.current?.querySelector<HTMLElement>(`[data-hand-zone="${zone}"]`) ?? null
  }

  function getHandCardIds(current: BoardState, zone: HandZone) {
    return zone === 'crew' ? current.handCardIds : current.tiredCardIds
  }

  function getCardHandZone(current: BoardState, cardId: string): HandZone | null {
    if (current.handCardIds.includes(cardId)) {
      return 'crew'
    }

    return current.tiredCardIds.includes(cardId) ? 'tired' : null
  }

  function isCardInAnyHand(current: BoardState, cardId: string) {
    return getCardHandZone(current, cardId) !== null
  }

  function removeCardFromHandZones(current: BoardState, cardId: string) {
    return {
      handCardIds: current.handCardIds.filter((candidateId) => candidateId !== cardId),
      tiredCardIds: current.tiredCardIds.filter((candidateId) => candidateId !== cardId),
    }
  }

  function canPutCardIdsInHand(cardIds: readonly string[], cards: Record<string, Card>) {
    return cardIds.length > 0 && cardIds.every((cardId) => cards[cardId]?.kind === 'crew')
  }

  function getDiscardElement() {
    return boardRef.current?.querySelector<HTMLElement>('[data-discard-zone]') ?? null
  }

  function getHandCardElement(cardId: string) {
    return handRef.current?.querySelector<HTMLElement>(`[data-hand-card-id="${cardId}"]`) ?? null
  }

  function isPointInDiscard(clientX: number, clientY: number) {
    const discardRect = getDiscardElement()?.getBoundingClientRect()

    return Boolean(
      discardRect &&
        clientX >= discardRect.left &&
        clientX <= discardRect.right &&
        clientY >= discardRect.top &&
        clientY <= discardRect.bottom,
    )
  }

  function isPointInHand(clientX: number, clientY: number) {
    const handRect = getHandElement()?.getBoundingClientRect()

    return Boolean(
      handRect &&
        clientX >= handRect.left &&
        clientX <= handRect.right &&
        clientY >= handRect.top &&
        clientY <= handRect.bottom,
    )
  }

  function getHandZoneAtPoint(clientX: number, clientY: number): HandZone | null {
    for (const handZone of ['crew', 'tired'] as const) {
      const zoneRect = getHandZoneElement(handZone)?.getBoundingClientRect()

      if (
        zoneRect &&
        clientX >= zoneRect.left &&
        clientX <= zoneRect.right &&
        clientY >= zoneRect.top &&
        clientY <= zoneRect.bottom
      ) {
        return handZone
      }
    }

    return null
  }

  function getHandInsertionIndex(
    zone: HandZone,
    clientX: number,
    excludeCardId: string | null = null,
  ) {
    const handCardIds = getHandCardIds(boardStateRef.current, zone).filter(
      (cardId) => cardId !== excludeCardId,
    )

    if (handCardIds.length === 0) {
      return 0
    }

    let insertionIndex = 0

    for (const cardId of handCardIds) {
      const cardRect = getHandCardElement(cardId)?.getBoundingClientRect()

      if (!cardRect) {
        continue
      }

      if (clientX > cardRect.left + cardRect.width / 2) {
        insertionIndex += 1
      }
    }

    return clamp(insertionIndex, 0, handCardIds.length)
  }

  function updateHandInsertPreview(nextPreview: HandInsertPreview | null) {
    setHandInsertPreview((currentPreview) => {
      if (
        currentPreview?.zone === nextPreview?.zone &&
        currentPreview?.index === nextPreview?.index &&
        currentPreview?.cardCount === nextPreview?.cardCount &&
        currentPreview?.activeCardId === nextPreview?.activeCardId
      ) {
        return currentPreview
      }

      return nextPreview
    })
  }

  function clearHandInsertPreview() {
    updateHandInsertPreview(null)
  }

  function setDragTransform(element: HTMLElement, deltaX: number, deltaY: number) {
    element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`
  }

  function clearDragTransform(element: HTMLElement | null) {
    if (!element) {
      return
    }

    element.style.transition = 'none'
    element.style.removeProperty('transform')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.removeProperty('transition')
      })
    })
  }

  function animateHandDragTransformToSlot(
    cardId: string,
    element: HTMLElement | null,
    previousRect: DOMRect | null,
  ) {
    if (!element || !previousRect) {
      removeActiveHandCardId(cardId)
      clearDragTransform(element)
      return
    }

    element.style.transition = 'none'
    element.style.removeProperty('transform')

    const nextRect = element.getBoundingClientRect()

    setDragTransform(element, previousRect.left - nextRect.left, previousRect.top - nextRect.top)

    requestAnimationFrame(() => {
      let didFinish = false
      const finish = () => {
        if (didFinish) {
          return
        }

        didFinish = true
        element.style.removeProperty('transition')
        element.style.removeProperty('transform')
        removeActiveHandCardId(cardId)
      }

      element.style.transition = 'transform 180ms ease'
      setDragTransform(element, 0, 0)
      element.addEventListener('transitionend', finish, { once: true })
      window.setTimeout(finish, 220)
    })
  }

  function addActiveStackId(stackId: string) {
    setActiveStackIds((current) => (current.includes(stackId) ? current : [...current, stackId]))
  }

  function removeActiveStackId(stackId: string | null) {
    if (!stackId) {
      return
    }

    setActiveStackIds((current) => current.filter((activeId) => activeId !== stackId))
  }

  function addActiveDeckId(deckId: string) {
    setActiveDeckIds((current) => (current.includes(deckId) ? current : [...current, deckId]))
  }

  function removeActiveDeckId(deckId: string | null) {
    if (!deckId) {
      return
    }

    setActiveDeckIds((current) => current.filter((activeId) => activeId !== deckId))
  }

  function addActiveHandCardId(cardId: string) {
    setActiveHandCardIds((current) => (current.includes(cardId) ? current : [...current, cardId]))
  }

  function removeActiveHandCardId(cardId: string | null) {
    if (!cardId) {
      return
    }

    setActiveHandCardIds((current) => current.filter((activeId) => activeId !== cardId))
  }

  function hasDraggedPastTolerance(clientX: number, clientY: number, drag: DragState) {
    return Math.hypot(clientX - drag.startClientX, clientY - drag.startClientY) > DRAG_CLICK_TOLERANCE
  }

  function stopTrackingDrag(pointerId: number) {
    dragsRef.current.delete(pointerId)
    pendingDragIdsRef.current.delete(pointerId)

    if (dragsRef.current.size === 0 && dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
      pendingDragIdsRef.current.clear()
    }
  }

  function flushPendingDragMoves() {
    dragFrameRef.current = null

    const pointerIds = Array.from(pendingDragIdsRef.current)
    pendingDragIdsRef.current.clear()

    for (const pointerId of pointerIds) {
      const drag = dragsRef.current.get(pointerId)

      if (!drag) {
        continue
      }

      if (drag.kind === 'stack') {
        moveStackDrag(drag.currentClientX, drag.currentClientY, drag)
      } else if (drag.kind === 'deck') {
        moveDeckDrag(drag.currentClientX, drag.currentClientY, drag)
      } else {
        moveHandDrag(drag.currentClientX, drag.currentClientY, drag)
      }
    }

    if (pendingDragIdsRef.current.size > 0) {
      dragFrameRef.current = requestAnimationFrame(flushPendingDragMoves)
    }
  }

  function queueDragMove(drag: DragState, clientX: number, clientY: number) {
    drag.currentClientX = clientX
    drag.currentClientY = clientY
    pendingDragIdsRef.current.add(drag.pointerId)

    if (dragFrameRef.current === null) {
      dragFrameRef.current = requestAnimationFrame(flushPendingDragMoves)
    }
  }

  function updateStackDragPosition(clientX: number, clientY: number, drag: StackDragState) {
    drag.currentClientX = clientX
    drag.currentClientY = clientY

    const deltaX = ((clientX - drag.startClientX) / drag.metrics.width) * 100
    const deltaY = ((clientY - drag.startClientY) / drag.metrics.height) * 100
    const position = {
      x: drag.startX + deltaX,
      y: drag.startY + deltaY,
    }

    drag.latestX = position.x
    drag.latestY = position.y
    drag.latestDeltaX = ((position.x - drag.startX) / 100) * drag.metrics.width
    drag.latestDeltaY = ((position.y - drag.startY) / 100) * drag.metrics.height
  }

  function updateDeckDragPosition(clientX: number, clientY: number, drag: DeckDragState) {
    drag.currentClientX = clientX
    drag.currentClientY = clientY

    const deltaX = ((clientX - drag.startClientX) / drag.metrics.width) * 100
    const deltaY = ((clientY - drag.startClientY) / drag.metrics.height) * 100
    const position = clampStackPosition(drag.startX + deltaX, drag.startY + deltaY, 1, drag.metrics)

    drag.latestX = position.x
    drag.latestY = position.y
    drag.latestDeltaX = ((position.x - drag.startX) / 100) * drag.metrics.width
    drag.latestDeltaY = ((position.y - drag.startY) / 100) * drag.metrics.height
  }

  function updateHandDragPosition(clientX: number, clientY: number, drag: HandDragState) {
    drag.currentClientX = clientX
    drag.currentClientY = clientY
    drag.latestDeltaX = clientX - drag.startClientX
    drag.latestDeltaY = clientY - drag.startClientY
  }

  function applyStackDragTransform(drag: StackDragState) {
    const activeId = drag.activeStackId

    if (!activeId) {
      return
    }

    const element = drag.activeElement ?? getStackElement(activeId)

    if (!element) {
      return
    }

    drag.activeElement = element
    setDragTransform(element, drag.latestDeltaX, drag.latestDeltaY)
  }

  function applyDeckDragTransform(drag: DeckDragState) {
    const element = drag.element ?? getDeckElement(drag.deckId)

    if (!element) {
      return
    }

    drag.element = element
    setDragTransform(element, drag.latestDeltaX, drag.latestDeltaY)
  }

  function applyHandDragTransform(drag: HandDragState) {
    const element = drag.element ?? getHandCardElement(drag.cardId)

    if (!element) {
      return
    }

    drag.element = element
    setDragTransform(element, drag.latestDeltaX, drag.latestDeltaY)
  }

  function toggleStackDropTarget(stackId: string | null, enabled: boolean) {
    if (!stackId) {
      return
    }

    const counts = stackDropTargetCountsRef.current
    const currentCount = counts.get(stackId) ?? 0
    const nextCount = enabled ? currentCount + 1 : Math.max(0, currentCount - 1)

    if (nextCount === currentCount) {
      return
    }

    if (nextCount === 0) {
      counts.delete(stackId)
      getStackElement(stackId)?.classList.remove('is-drop-target')
      return
    }

    counts.set(stackId, nextCount)

    if (currentCount === 0) {
      getStackElement(stackId)?.classList.add('is-drop-target')
    }
  }

  function toggleDeckDropTarget(deckId: string | null, enabled: boolean) {
    if (!deckId) {
      return
    }

    const counts = deckDropTargetCountsRef.current
    const currentCount = counts.get(deckId) ?? 0
    const nextCount = enabled ? currentCount + 1 : Math.max(0, currentCount - 1)

    if (nextCount === currentCount) {
      return
    }

    if (nextCount === 0) {
      counts.delete(deckId)
      getDeckElement(deckId)?.classList.remove('is-drop-target')
      return
    }

    counts.set(deckId, nextCount)

    if (currentCount === 0) {
      getDeckElement(deckId)?.classList.add('is-drop-target')
    }
  }

  function toggleHandDropTarget(zone: HandZone | null, enabled: boolean) {
    if (!zone) {
      return
    }

    const currentCount = handDropTargetCountsRef.current[zone]
    const nextCount = enabled ? currentCount + 1 : Math.max(0, currentCount - 1)

    if (nextCount === currentCount) {
      return
    }

    handDropTargetCountsRef.current[zone] = nextCount

    if (nextCount === 0) {
      getHandZoneElement(zone)?.classList.remove('is-drop-target')
      return
    }

    if (currentCount === 0) {
      getHandZoneElement(zone)?.classList.add('is-drop-target')
    }
  }

  function toggleDiscardDropTarget(enabled: boolean) {
    const currentCount = discardDropTargetCountRef.current
    const nextCount = enabled ? currentCount + 1 : Math.max(0, currentCount - 1)

    if (nextCount === currentCount) {
      return
    }

    discardDropTargetCountRef.current = nextCount

    if (nextCount === 0) {
      getDiscardElement()?.classList.remove('is-drop-target')
      return
    }

    if (currentCount === 0) {
      getDiscardElement()?.classList.add('is-drop-target')
    }
  }

  function toggleDiscardPreview(drag: StackDragState, enabled: boolean) {
    const activeElement = drag.activeElement ?? (drag.activeStackId ? getStackElement(drag.activeStackId) : null)

    if (!activeElement) {
      return
    }

    drag.activeElement = activeElement
    activeElement.classList.toggle('is-discard-preview', enabled)
  }

  function clearStackDragDropTarget(drag: StackDragState) {
    toggleStackDropTarget(drag.dropTargetStackId, false)
    toggleDeckDropTarget(drag.dropTargetDeckId, false)
    if (drag.dropTargetHandZone) {
      toggleHandDropTarget(drag.dropTargetHandZone, false)
    }
    if (drag.dropTargetDiscard) {
      toggleDiscardDropTarget(false)
      toggleDiscardPreview(drag, false)
    }
    drag.dropTargetStackId = null
    drag.dropTargetDeckId = null
    drag.dropTargetHandZone = null
    drag.dropTargetDiscard = false
    drag.handInsertIndex = null
    clearHandInsertPreview()
  }

  function clearHandDragDropTarget(drag: HandDragState) {
    if (drag.dropTargetHandZone) {
      toggleHandDropTarget(drag.dropTargetHandZone, false)
    }

    if (drag.dropTargetDiscard) {
      toggleDiscardDropTarget(false)
    }

    drag.dropTargetHandZone = null
    drag.dropTargetDiscard = false
    drag.handInsertIndex = null
    clearHandInsertPreview()
  }

  function clearDeckDragDropTarget(drag: DeckDragState) {
    toggleDeckDropTarget(drag.dropTargetDeckId, false)
    drag.dropTargetDeckId = null
  }

  function getNearestDropTarget(
    stacks: Stack[],
    decks: Deck[],
    cards: Record<string, Card>,
    sourceStackId: string,
    metrics: BoardMetrics,
  ): DropTarget {
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
        !canStackCards(sourceStack, targetStack, cards) &&
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

  function getNearestDeckDropTarget(
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
      if (targetDeck.id === sourceDeckId || targetDeck.cards.length === 0) {
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

  function captureBoardPointer(pointerId: number) {
    boardRef.current?.setPointerCapture(pointerId)
  }

  function releaseBoardPointer(pointerId: number) {
    const boardElement = boardRef.current

    if (boardElement?.hasPointerCapture(pointerId)) {
      boardElement.releasePointerCapture(pointerId)
    }
  }

  function clearDropTarget() {
    setBoard((current) =>
      current.dropTargetStackId || current.dropTargetDeckId
        ? { ...current, dropTargetStackId: null, dropTargetDeckId: null }
        : current,
    )
  }

  function activateStackDrag(drag: StackDragState) {
    const currentSourceStack = boardStateRef.current.stacks.find((stack) => stack.id === drag.stackId)

    if (!currentSourceStack || currentSourceStack.cardIds[drag.cardIndex] !== drag.cardId) {
      return false
    }

    const activeId = drag.cardIndex === 0 ? drag.stackId : drag.movingStackId

    drag.hasMoved = true
    drag.activeStackId = activeId
    drag.dropTargetStackId = null
    drag.dropTargetDeckId = null
    drag.dropTargetHandZone = null
    drag.dropTargetDiscard = false
    drag.handInsertIndex = null

    flushSync(() => {
      addActiveStackId(activeId)
      setBoard((current) => {
        const sourceStack = current.stacks.find((stack) => stack.id === drag.stackId)

        if (!sourceStack || sourceStack.cardIds[drag.cardIndex] !== drag.cardId) {
          return current
        }

        const nextZ = current.topZ + 1
        const movingCardIds = sourceStack.cardIds.slice(drag.cardIndex)
        const nextStacks =
          drag.cardIndex > 0
            ? current.stacks.flatMap((stack) => {
                if (stack.id !== sourceStack.id) {
                  return [stack]
                }

                return [
                  { ...stack, cardIds: sourceStack.cardIds.slice(0, drag.cardIndex) },
                  {
                    id: activeId,
                    cardIds: movingCardIds,
                    x: drag.startX,
                    y: drag.startY,
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

        return drag.cardIndex > 0
          ? withPlaytestEvents(
              nextBoard,
              stackSplitEvent(sourceStack.id, activeId, movingCardIds, current.cards),
            )
          : nextBoard
      })
    })

    drag.activeElement = getStackElement(activeId) ?? (activeId === drag.stackId ? drag.sourceElement : null)
    return true
  }

  function activateDeckDrag(drag: DeckDragState) {
    if (!boardStateRef.current.decks.some((deck) => deck.id === drag.deckId)) {
      return false
    }

    drag.hasMoved = true
    drag.dropTargetDeckId = null

    flushSync(() => {
      addActiveDeckId(drag.deckId)
      setBoard((current) => {
        const nextZ = current.topZ + 1

        return {
          ...current,
          topZ: nextZ,
          dropTargetStackId: null,
          dropTargetDeckId: null,
          decks: current.decks.map((deck) =>
            deck.id === drag.deckId ? { ...deck, z: nextZ } : deck,
          ),
        }
      })
    })

    drag.element = getDeckElement(drag.deckId) ?? drag.element
    return true
  }

  function activateHandDrag(drag: HandDragState) {
    if (!isCardInAnyHand(boardStateRef.current, drag.cardId)) {
      return false
    }

    drag.hasMoved = true

    flushSync(() => {
      addActiveHandCardId(drag.cardId)
    })

    drag.element = getHandCardElement(drag.cardId) ?? drag.element
    return true
  }

  function updateStackDropTarget(drag: StackDragState) {
    const activeId = drag.activeStackId

    if (!activeId) {
      return
    }

    const current = boardStateRef.current
    const activeStack = current.stacks.find((stack) => stack.id === activeId)

    if (!activeStack) {
      return
    }

    const dropTargetDiscard = isPointInDiscard(drag.currentClientX, drag.currentClientY)
    const targetHandZone = !dropTargetDiscard
      ? getHandZoneAtPoint(drag.currentClientX, drag.currentClientY)
      : null
    const dropTargetHandZone = targetHandZone && canPutCardIdsInHand(activeStack.cardIds, current.cards)
      ? targetHandZone
      : null
    const handInsertIndex = dropTargetHandZone
      ? getHandInsertionIndex(dropTargetHandZone, drag.currentClientX)
      : null
    const previewStacks = current.stacks.map((stack) =>
      stack.id === activeId ? { ...stack, x: drag.latestX, y: drag.latestY } : stack,
    )
    const dropTarget = dropTargetDiscard || dropTargetHandZone
      ? { stackId: null, deckId: null }
      : getNearestDropTarget(
          previewStacks,
          current.decks,
          current.cards,
          activeId,
          drag.metrics,
        )

    if (
      dropTarget.stackId === drag.dropTargetStackId &&
      dropTarget.deckId === drag.dropTargetDeckId &&
      dropTargetHandZone === drag.dropTargetHandZone &&
      dropTargetDiscard === drag.dropTargetDiscard &&
      handInsertIndex === drag.handInsertIndex
    ) {
      return
    }

    toggleStackDropTarget(drag.dropTargetStackId, false)
    toggleDeckDropTarget(drag.dropTargetDeckId, false)
    if (drag.dropTargetHandZone) {
      toggleHandDropTarget(drag.dropTargetHandZone, false)
    }
    if (drag.dropTargetDiscard) {
      toggleDiscardDropTarget(false)
    }
    drag.dropTargetStackId = dropTarget.stackId
    drag.dropTargetDeckId = dropTarget.deckId
    drag.dropTargetHandZone = dropTargetHandZone
    drag.dropTargetDiscard = dropTargetDiscard
    drag.handInsertIndex = handInsertIndex
    toggleStackDropTarget(dropTarget.stackId, true)
    toggleDeckDropTarget(dropTarget.deckId, true)
    toggleDiscardPreview(drag, dropTargetDiscard)
    if (dropTargetDiscard) {
      toggleDiscardDropTarget(true)
      clearHandInsertPreview()
      return
    }
    if (dropTargetHandZone) {
      toggleHandDropTarget(dropTargetHandZone, true)
      updateHandInsertPreview({
        zone: dropTargetHandZone,
        index: handInsertIndex ?? getHandCardIds(current, dropTargetHandZone).length,
        cardCount: drag.movingCardCount,
        activeCardId: null,
      })
    } else {
      clearHandInsertPreview()
    }
  }

  function updateDeckDropTarget(drag: DeckDragState) {
    const current = boardStateRef.current
    const hasActiveDeck = current.decks.some((deck) => deck.id === drag.deckId)

    if (!hasActiveDeck) {
      return
    }

    const previewDecks = current.decks.map((deck) =>
      deck.id === drag.deckId ? { ...deck, x: drag.latestX, y: drag.latestY } : deck,
    )
    const dropTargetDeckId = getNearestDeckDropTarget(previewDecks, drag.deckId, drag.metrics)

    if (dropTargetDeckId === drag.dropTargetDeckId) {
      return
    }

    toggleDeckDropTarget(drag.dropTargetDeckId, false)
    drag.dropTargetDeckId = dropTargetDeckId
    toggleDeckDropTarget(dropTargetDeckId, true)
  }

  function updateHandDragDropTarget(drag: HandDragState) {
    const dropTargetDiscard = isPointInDiscard(drag.currentClientX, drag.currentClientY)
    const dropTargetHandZone = !dropTargetDiscard
      ? getHandZoneAtPoint(drag.currentClientX, drag.currentClientY)
      : null
    const handInsertIndex = dropTargetHandZone
      ? getHandInsertionIndex(dropTargetHandZone, drag.currentClientX, drag.cardId)
      : null

    if (
      handInsertIndex === drag.handInsertIndex &&
      dropTargetHandZone === drag.dropTargetHandZone &&
      dropTargetDiscard === drag.dropTargetDiscard
    ) {
      return
    }

    if (drag.dropTargetHandZone) {
      toggleHandDropTarget(drag.dropTargetHandZone, false)
    }

    if (drag.dropTargetDiscard) {
      toggleDiscardDropTarget(false)
    }

    drag.dropTargetHandZone = dropTargetHandZone
    drag.handInsertIndex = handInsertIndex
    drag.dropTargetDiscard = dropTargetDiscard

    if (dropTargetDiscard) {
      toggleDiscardDropTarget(true)
      clearHandInsertPreview()
      return
    }

    if (!dropTargetHandZone || handInsertIndex === null) {
      clearHandInsertPreview()
      return
    }

    toggleHandDropTarget(dropTargetHandZone, true)

    updateHandInsertPreview({
      zone: dropTargetHandZone,
      index: handInsertIndex,
      cardCount: 1,
      activeCardId: drag.cardId,
    })
  }

  function commitStackDragPosition(drag: StackDragState) {
    const activeId = drag.activeStackId

    if (!activeId) {
      return
    }

    setBoard((current) => {
      const movingStack = current.stacks.find((stack) => stack.id === activeId)

      if (!movingStack || (movingStack.x === drag.latestX && movingStack.y === drag.latestY)) {
        return current
      }

      return {
        ...current,
        stacks: current.stacks.map((stack) => {
          if (stack.id !== activeId) {
            return stack
          }

          return { ...stack, x: drag.latestX, y: drag.latestY }
        }),
      }
    })
  }

  function commitDeckDragPosition(drag: DeckDragState) {
    setBoard((current) => {
      const movingDeck = current.decks.find((deck) => deck.id === drag.deckId)

      if (!movingDeck || (movingDeck.x === drag.latestX && movingDeck.y === drag.latestY)) {
        return current
      }

      return {
        ...current,
        decks: current.decks.map((deck) => {
          if (deck.id !== drag.deckId) {
            return deck
          }

          return { ...deck, x: drag.latestX, y: drag.latestY }
        }),
      }
    })
  }

  function drawFromDeck(deckId: string) {
    if (!canManuallyDrawDeck(deckId)) {
      return
    }

    const metrics = readBoardMetrics()
    const distance =
      DRAW_MIN_RADIUS_PERCENT + Math.random() * (DRAW_RADIUS_PERCENT - DRAW_MIN_RADIUS_PERCENT)
    const angle = Math.random() * Math.PI * 2

    setBoard((current) => {
      const deck = current.decks.find((candidate) => candidate.id === deckId)
      const drawnCard = deck?.cards[0]

      if (!deck || !drawnCard) {
        return current
      }

      const position = clampStackPosition(
        deck.x + Math.cos(angle) * distance,
        deck.y + Math.sin(angle) * distance,
        1,
        metrics,
      )
      const newCardId = `drawn-${current.nextCardId}`
      const newStackId = `stack-${newCardId}`
      const newCard = { ...drawnCard, id: newCardId, faceUp: true }
      const deckZ = current.topZ + 1
      const cardZ = current.topZ + 2

      return withPlaytestEvents({
        ...current,
        topZ: cardZ,
        nextCardId: current.nextCardId + 1,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: {
          ...current.cards,
          [newCardId]: newCard,
        },
        stacks: [
          ...current.stacks,
          {
            id: newStackId,
            cardIds: [newCardId],
            x: position.x,
            y: position.y,
            z: cardZ,
          },
        ],
        decks: current.decks.map((candidate) =>
          candidate.id === deckId
            ? { ...candidate, cards: candidate.cards.slice(1), z: deckZ }
            : candidate,
        ),
      }, cardDrawnEvent(newCard, deck, newStackId, position.x, position.y))
    })
  }

  function completeReadyHorizonStack(current: BoardState, stackId: string, metrics: BoardMetrics) {
    const sourceStack = current.stacks.find((stack) => stack.id === stackId)

    if (!sourceStack) {
      return { board: current, events: [] }
    }

    const completion = getHorizonStackCompletion(sourceStack, current.cards)

    if (!completion?.isReady) {
      return { board: current, events: [] }
    }

    const horizonCard = current.cards[completion.horizonCardId]

    if (!horizonCard?.horizon) {
      return { board: current, events: [] }
    }

    const nextZ = current.topZ + 1
    const rewards = horizonCard.horizon.rewards
    const rewardCards: Card[] = []
    let nextCardId = current.nextCardId
    const nextDecks = current.decks.map((deck) => {
      const drawCount = rewards.reduce((count, reward) => {
        if (reward.kind === 'resource') {
          return deck.id === `${reward.resource}-deck` ? count + reward.count : count
        }

        return deck.id === 'cryo-deck' ? count + reward.count : count
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
    const nextCards = withoutCards(current.cards, sourceStack.cardIds)

    for (const rewardCard of rewardCards) {
      nextCards[rewardCard.id] = rewardCard
    }

    const rewardPosition =
      rewardCards.length > 0
        ? clampStackPosition(
            sourceStack.x + (sourceStack.x > 66 ? -9 : 9),
            sourceStack.y + (sourceStack.y > 56 ? -5 : 5),
            rewardCards.length,
            metrics,
          )
        : null

    return {
      board: {
        ...current,
        topZ: nextZ,
        nextCardId,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: nextCards,
        stacks:
          rewardCards.length > 0
            ? current.stacks.map((stack) =>
                stack.id === sourceStack.id
                  ? {
                    ...stack,
                    cardIds: rewardCards.map((card) => card.id),
                    x: rewardPosition?.x ?? stack.x,
                    y: rewardPosition?.y ?? stack.y,
                    z: nextZ,
                  }
                  : stack,
              )
            : current.stacks.filter((stack) => stack.id !== sourceStack.id),
        decks: nextDecks,
      },
      events: [horizonCompletedEvent(horizonCard, sourceStack, rewardCards, current.cards)],
    }
  }

  function getBoardDropPosition(clientX: number, clientY: number, placeAboveHand = false) {
    const metrics = readBoardMetrics()
    const boardRect = boardRef.current?.getBoundingClientRect()
    const handRect = getHandElement()?.getBoundingClientRect()
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

  function dropHandCardToBoard(cardId: string, position: { x: number; y: number }) {
    setBoard((current) => {
      const card = current.cards[cardId]
      const sourceHandZone = getCardHandZone(current, cardId)

      if (!card || !sourceHandZone) {
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
    })
  }

  function discardStack(stackId: string) {
    setBoard((current) => {
      const stack = current.stacks.find((candidate) => candidate.id === stackId)

      if (!stack) {
        return current
      }

      return withPlaytestEvents({
        ...current,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: withoutCards(current.cards, stack.cardIds),
        stacks: current.stacks.filter((candidate) => candidate.id !== stack.id),
      }, cardsDiscardedEvent(stack.cardIds, current.cards, stack.id))
    })
  }

  function discardHandCard(cardId: string) {
    setBoard((current) => {
      const card = current.cards[cardId]
      const sourceHandZone = getCardHandZone(current, cardId)

      if (!card || !sourceHandZone) {
        return current
      }

      const nextHands = removeCardFromHandZones(current, cardId)

      return withPlaytestEvents({
        ...current,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: withoutCards(current.cards, [cardId]),
        ...nextHands,
      }, cardsDiscardedEvent([cardId], current.cards, sourceHandZone))
    })
  }

  function promoteHandDragToStack(clientX: number, clientY: number, drag: HandDragState) {
    const current = boardStateRef.current
    const card = current.cards[drag.cardId]

    if (!card || !isCardInAnyHand(current, drag.cardId)) {
      return null
    }

    const metrics = readBoardMetrics()
    const position = getBoardDropPosition(clientX, clientY)
    const stackId = `stack-hand-${drag.cardId}-${current.nextCardId}`
    const nextZ = current.topZ + 1

    clearHandDragDropTarget(drag)
    clearDragTransform(drag.element)

    flushSync(() => {
      removeActiveHandCardId(drag.cardId)
      clearHandInsertPreview()
      addActiveStackId(stackId)
      setBoard((latest) => {
        if (!isCardInAnyHand(latest, drag.cardId)) {
          return latest
        }

        const nextHands = removeCardFromHandZones(latest, drag.cardId)

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
              cardIds: [drag.cardId],
              x: position.x,
              y: position.y,
              z: nextZ,
            },
          ],
        }
      })
    })

    const stackDrag: StackDragState = {
      kind: 'stack',
      pointerId: drag.pointerId,
      stackId,
      cardId: drag.cardId,
      cardIndex: 0,
      movingStackId: `moving-${drag.cardId}`,
      activeStackId: stackId,
      metrics,
      movingCardCount: 1,
      sourceElement: null,
      activeElement: getStackElement(stackId),
      startClientX: clientX,
      startClientY: clientY,
      currentClientX: clientX,
      currentClientY: clientY,
      startX: position.x,
      startY: position.y,
      latestX: position.x,
      latestY: position.y,
      latestDeltaX: 0,
      latestDeltaY: 0,
      dropTargetStackId: null,
      dropTargetDeckId: null,
      dropTargetHandZone: null,
      dropTargetDiscard: false,
      handInsertIndex: null,
      hasMoved: true,
    }

    dragsRef.current.set(drag.pointerId, stackDrag)
    return stackDrag
  }

  function reorderHandCard(cardId: string, zone: HandZone, insertIndex: number) {
    setBoard((current) => {
      const card = current.cards[cardId]

      if (!card || card.kind !== 'crew' || !isCardInAnyHand(current, cardId)) {
        return current
      }

      const handCardIdsWithoutCard = current.handCardIds.filter((candidateId) => candidateId !== cardId)
      const tiredCardIdsWithoutCard = current.tiredCardIds.filter((candidateId) => candidateId !== cardId)
      const targetCardIds = zone === 'crew' ? handCardIdsWithoutCard : tiredCardIdsWithoutCard
      const nextIndex = clamp(insertIndex, 0, targetCardIds.length)
      const nextTargetCardIds = [
        ...targetCardIds.slice(0, nextIndex),
        cardId,
        ...targetCardIds.slice(nextIndex),
      ]
      const nextHandCardIds = zone === 'crew' ? nextTargetCardIds : handCardIdsWithoutCard
      const nextTiredCardIds = zone === 'tired' ? nextTargetCardIds : tiredCardIdsWithoutCard

      if (
        nextHandCardIds.length === current.handCardIds.length &&
        nextTiredCardIds.length === current.tiredCardIds.length &&
        nextHandCardIds.every((candidateId, index) => candidateId === current.handCardIds[index]) &&
        nextTiredCardIds.every((candidateId, index) => candidateId === current.tiredCardIds[index])
      ) {
        return current
      }

      return {
        ...current,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        handCardIds: nextHandCardIds,
        tiredCardIds: nextTiredCardIds,
      }
    })
  }

  function addStackToHand(sourceStackId: string, zone: HandZone, insertIndex: number | null) {
    setBoard((current) => {
      const sourceStack = current.stacks.find((stack) => stack.id === sourceStackId)

      if (!sourceStack || !canPutCardIdsInHand(sourceStack.cardIds, current.cards)) {
        return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
      }

      const targetCardIds = getHandCardIds(current, zone)
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
        handCardIds: zone === 'crew' ? nextTargetCardIds : current.handCardIds,
        tiredCardIds: zone === 'tired' ? nextTargetCardIds : current.tiredCardIds,
        stacks: current.stacks.filter((stack) => stack.id !== sourceStack.id),
      }, cardsMovedToHandEvent(sourceStack, current.cards))
    })
  }

  function beginStackDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    stackId: string,
    cardId: string,
    cardIndex: number,
  ) {
    if (event.button !== 0 || dragsRef.current.has(event.pointerId)) {
      return
    }

    for (const activeDrag of dragsRef.current.values()) {
      if (
        activeDrag.kind === 'stack' &&
        (activeDrag.cardId === cardId ||
          activeDrag.activeStackId === stackId ||
          (!activeDrag.hasMoved && activeDrag.stackId === stackId))
      ) {
        return
      }
    }

    const stack = board.stacks.find((candidate) => candidate.id === stackId)

    if (!stack || stack.cardIds[cardIndex] !== cardId) {
      return
    }

    const metrics = readBoardMetrics()
    const origin = getCardOrigin(stack, cardIndex, metrics)
    const movingCardCount = Math.max(1, stack.cardIds.length - cardIndex)

    event.preventDefault()
    captureBoardPointer(event.pointerId)
    dragsRef.current.set(event.pointerId, {
      kind: 'stack',
      pointerId: event.pointerId,
      stackId,
      cardId,
      cardIndex,
      movingStackId: `moving-${cardId}`,
      activeStackId: null,
      metrics,
      movingCardCount,
      sourceElement: event.currentTarget.closest('.card-stack') as HTMLElement | null,
      activeElement: null,
      startClientX: event.clientX,
      startClientY: event.clientY,
      currentClientX: event.clientX,
      currentClientY: event.clientY,
      startX: origin.x,
      startY: origin.y,
      latestX: origin.x,
      latestY: origin.y,
      latestDeltaX: 0,
      latestDeltaY: 0,
      dropTargetStackId: board.dropTargetStackId,
      dropTargetDeckId: board.dropTargetDeckId,
      dropTargetHandZone: null,
      dropTargetDiscard: false,
      handInsertIndex: null,
      hasMoved: false,
    })
  }

  function beginDeckDrag(event: ReactPointerEvent<HTMLButtonElement>, deckId: string) {
    if (event.button !== 0 || dragsRef.current.has(event.pointerId)) {
      return
    }

    for (const activeDrag of dragsRef.current.values()) {
      if (activeDrag.kind === 'deck' && activeDrag.deckId === deckId) {
        return
      }
    }

    const deck = board.decks.find((candidate) => candidate.id === deckId)

    if (!deck) {
      return
    }

    const metrics = readBoardMetrics()

    event.preventDefault()
    captureBoardPointer(event.pointerId)
    dragsRef.current.set(event.pointerId, {
      kind: 'deck',
      pointerId: event.pointerId,
      deckId,
      metrics,
      element: event.currentTarget,
      startClientX: event.clientX,
      startClientY: event.clientY,
      currentClientX: event.clientX,
      currentClientY: event.clientY,
      startX: deck.x,
      startY: deck.y,
      latestX: deck.x,
      latestY: deck.y,
      latestDeltaX: 0,
      latestDeltaY: 0,
      dropTargetDeckId: board.dropTargetDeckId,
      hasMoved: false,
    })
  }

  function beginHandDrag(event: ReactPointerEvent<HTMLDivElement>, cardId: string, zone: HandZone) {
    if (event.button !== 0 || dragsRef.current.has(event.pointerId)) {
      return
    }

    for (const activeDrag of dragsRef.current.values()) {
      if (activeDrag.kind === 'hand' && activeDrag.cardId === cardId) {
        return
      }
    }

    const card = board.cards[cardId]
    const sourceHandZone = getCardHandZone(board, cardId)

    if (!card || card.kind !== 'crew' || sourceHandZone !== zone) {
      return
    }

    event.preventDefault()
    captureBoardPointer(event.pointerId)
    dragsRef.current.set(event.pointerId, {
      kind: 'hand',
      pointerId: event.pointerId,
      cardId,
      sourceHandZone: zone,
      element:
        (event.currentTarget.closest('[data-hand-card-id]') as HTMLElement | null) ??
        event.currentTarget,
      dropTargetHandZone: null,
      handInsertIndex: null,
      dropTargetDiscard: false,
      startClientX: event.clientX,
      startClientY: event.clientY,
      currentClientX: event.clientX,
      currentClientY: event.clientY,
      latestDeltaX: 0,
      latestDeltaY: 0,
      hasMoved: false,
    })
  }

  function prepareStackDrag(clientX: number, clientY: number, drag: StackDragState): DragPreparation {
    if (!drag.hasMoved && !hasDraggedPastTolerance(clientX, clientY, drag)) {
      return 'idle'
    }

    updateStackDragPosition(clientX, clientY, drag)

    if (!drag.hasMoved && !activateStackDrag(drag)) {
      return 'stale'
    }

    return drag.activeStackId ? 'active' : 'stale'
  }

  function prepareDeckDrag(clientX: number, clientY: number, drag: DeckDragState): DragPreparation {
    if (!drag.hasMoved && !hasDraggedPastTolerance(clientX, clientY, drag)) {
      return 'idle'
    }

    updateDeckDragPosition(clientX, clientY, drag)

    if (!drag.hasMoved && !activateDeckDrag(drag)) {
      return 'stale'
    }

    return drag.hasMoved ? 'active' : 'stale'
  }

  function prepareHandDrag(clientX: number, clientY: number, drag: HandDragState): DragPreparation {
    if (!drag.hasMoved && !hasDraggedPastTolerance(clientX, clientY, drag)) {
      return 'idle'
    }

    updateHandDragPosition(clientX, clientY, drag)

    if (!drag.hasMoved && !activateHandDrag(drag)) {
      return 'stale'
    }

    return drag.hasMoved ? 'active' : 'stale'
  }

  function moveStackDrag(clientX: number, clientY: number, drag: StackDragState) {
    const preparation = prepareStackDrag(clientX, clientY, drag)

    if (preparation === 'stale') {
      releaseBoardPointer(drag.pointerId)
      stopTrackingDrag(drag.pointerId)
      clearStackDragDropTarget(drag)
      return
    }

    if (preparation !== 'active') {
      return
    }

    applyStackDragTransform(drag)
    updateStackDropTarget(drag)
  }

  function moveDeckDrag(clientX: number, clientY: number, drag: DeckDragState) {
    const preparation = prepareDeckDrag(clientX, clientY, drag)

    if (preparation === 'stale') {
      releaseBoardPointer(drag.pointerId)
      stopTrackingDrag(drag.pointerId)
      clearHandInsertPreview()
      return
    }

    if (preparation !== 'active') {
      return
    }

    applyDeckDragTransform(drag)
    updateDeckDropTarget(drag)
  }

  function moveHandDrag(clientX: number, clientY: number, drag: HandDragState) {
    const preparation = prepareHandDrag(clientX, clientY, drag)

    if (preparation === 'stale') {
      releaseBoardPointer(drag.pointerId)
      stopTrackingDrag(drag.pointerId)
      clearHandDragDropTarget(drag)
      return
    }

    if (preparation !== 'active') {
      return
    }

    if (!isPointInHand(clientX, clientY)) {
      const stackDrag = promoteHandDragToStack(clientX, clientY, drag)

      if (stackDrag) {
        updateStackDropTarget(stackDrag)
      }

      return
    }

    applyHandDragTransform(drag)
    updateHandDragDropTarget(drag)
  }

  function moveActiveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragsRef.current.get(event.pointerId)

    if (!drag) {
      return
    }

    event.preventDefault()
    queueDragMove(drag, event.clientX, event.clientY)
  }

  function stackOnDropTarget(sourceStackId: string, dropTarget: DropTarget) {
    const metrics = readBoardMetrics()

    setBoard((current) => {
      const sourceStack = current.stacks.find((stack) => stack.id === sourceStackId)
      const targetStackId = dropTarget.stackId
      const targetDeckId = dropTarget.deckId

      if (!sourceStack) {
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

      if (!canStackCards(sourceStack, targetStack, current.cards)) {
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
                }
              : stack,
          ),
      }
      const completedStack = completeReadyHorizonStack(stackedBoard, targetStack.id, metrics)

      return withPlaytestEvents(completedStack.board, [
        cardsStackedEvent(sourceStack, targetStack, current.cards),
        ...completedStack.events,
      ])
    })
  }

  function deckOnDropTarget(sourceDeckId: string, targetDeckId: string) {
    setBoard((current) => {
      const sourceDeck = current.decks.find((deck) => deck.id === sourceDeckId)
      const targetDeck = current.decks.find((deck) => deck.id === targetDeckId)

      if (!sourceDeck || !targetDeck || sourceDeck.id === targetDeck.id) {
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
    })
  }

  function finishActiveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragsRef.current.get(event.pointerId)

    if (!drag) {
      return
    }

    event.preventDefault()

    releaseBoardPointer(event.pointerId)
    stopTrackingDrag(event.pointerId)

    if (drag.kind === 'stack') {
      const preparation = prepareStackDrag(event.clientX, event.clientY, drag)

      if (preparation === 'stale') {
        clearDropTarget()
        clearHandInsertPreview()
        return
      }

      if (preparation === 'idle') {
        return
      }

      removeActiveStackId(drag.activeStackId)

      if (drag.activeStackId) {
        updateStackDragPosition(event.clientX, event.clientY, drag)
        updateStackDropTarget(drag)
        const dropTarget = {
          stackId: drag.dropTargetStackId,
          deckId: drag.dropTargetDeckId,
          handZone: drag.dropTargetHandZone,
          discard: drag.dropTargetDiscard,
          handInsertIndex: drag.handInsertIndex,
        }

        clearStackDragDropTarget(drag)
        if (dropTarget.discard) {
          clearDragTransform(drag.activeElement)
          discardStack(drag.activeStackId)
          return
        }

        if (dropTarget.handZone) {
          clearDragTransform(drag.activeElement)
          addStackToHand(drag.activeStackId, dropTarget.handZone, dropTarget.handInsertIndex)
          return
        }

        commitStackDragPosition(drag)
        clearDragTransform(drag.activeElement)
        stackOnDropTarget(drag.activeStackId, dropTarget)
        return
      }

      clearDropTarget()
      clearHandInsertPreview()
      return
    }

    if (drag.kind === 'hand') {
      const preparation = prepareHandDrag(event.clientX, event.clientY, drag)

      if (preparation === 'stale') {
        removeActiveHandCardId(drag.cardId)
        clearDragTransform(drag.element)
        clearHandDragDropTarget(drag)
        return
      }

      if (preparation === 'idle') {
        clearHandInsertPreview()
        dropHandCardToBoard(drag.cardId, getBoardDropPosition(event.clientX, event.clientY, true))
        return
      }

      updateHandDragPosition(event.clientX, event.clientY, drag)
      updateHandDragDropTarget(drag)

      if (drag.dropTargetDiscard) {
        clearHandDragDropTarget(drag)
        removeActiveHandCardId(drag.cardId)
        clearDragTransform(drag.element)
        discardHandCard(drag.cardId)
        return
      }

      if (drag.dropTargetHandZone) {
        const targetHandZone = drag.dropTargetHandZone
        const insertIndex = drag.handInsertIndex ?? getHandInsertionIndex(
          targetHandZone,
          event.clientX,
          drag.cardId,
        )
        const previousRect = drag.element?.getBoundingClientRect() ?? null

        flushSync(() => {
          clearHandDragDropTarget(drag)
          reorderHandCard(drag.cardId, targetHandZone, insertIndex)
        })
        animateHandDragTransformToSlot(drag.cardId, drag.element, previousRect)
      } else if (isPointInHand(event.clientX, event.clientY)) {
        const previousRect = drag.element?.getBoundingClientRect() ?? null

        flushSync(() => {
          clearHandDragDropTarget(drag)
        })
        animateHandDragTransformToSlot(drag.cardId, drag.element, previousRect)
      } else {
        removeActiveHandCardId(drag.cardId)
        clearDragTransform(drag.element)
        dropHandCardToBoard(drag.cardId, getBoardDropPosition(event.clientX, event.clientY, true))
        clearHandInsertPreview()
      }

      return
    }

    const preparation = prepareDeckDrag(event.clientX, event.clientY, drag)

    if (preparation === 'stale') {
      clearDropTarget()
      return
    }

    if (preparation === 'idle') {
      drawFromDeck(drag.deckId)
      return
    }

    updateDeckDragPosition(event.clientX, event.clientY, drag)
    updateDeckDropTarget(drag)
    const dropTargetDeckId = drag.dropTargetDeckId
    clearDeckDragDropTarget(drag)

    flushSync(() => {
      removeActiveDeckId(drag.deckId)

      if (dropTargetDeckId) {
        deckOnDropTarget(drag.deckId, dropTargetDeckId)
      } else {
        commitDeckDragPosition(drag)
        clearDropTarget()
      }
    })
    clearDragTransform(drag.element)
  }

  function cancelActiveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragsRef.current.get(event.pointerId)

    if (!drag) {
      return
    }

    event.preventDefault()

    releaseBoardPointer(event.pointerId)
    stopTrackingDrag(event.pointerId)

    if (drag.kind === 'stack') {
      if (drag.hasMoved && drag.activeStackId) {
        clearStackDragDropTarget(drag)
        removeActiveStackId(drag.activeStackId)
        commitStackDragPosition(drag)
        clearDragTransform(drag.activeElement)
      }
    } else if (drag.kind === 'hand') {
      if (drag.hasMoved) {
        clearHandDragDropTarget(drag)
        removeActiveHandCardId(drag.cardId)
        clearDragTransform(drag.element)
      }
    } else if (drag.hasMoved) {
      clearDeckDragDropTarget(drag)
      flushSync(() => {
        removeActiveDeckId(drag.deckId)
        commitDeckDragPosition(drag)
        clearDropTarget()
      })
      clearDragTransform(drag.element)
    }

    clearDropTarget()
  }

  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === ' ') {
      event.preventDefault()
    }
  }

  function handleDeckKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, deckId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    drawFromDeck(deckId)
  }

  function handleHandKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, cardId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    const cardRect = event.currentTarget.getBoundingClientRect()

    event.preventDefault()
    dropHandCardToBoard(
      cardId,
      getBoardDropPosition(
        cardRect.left + cardRect.width / 2,
        cardRect.top + cardRect.height / 2,
        true,
      ),
    )
  }

  return (
    <main className="app" aria-label="Corebound board prototype">
      <Board
        board={board}
        boardRef={boardRef}
        handRef={handRef}
        activeStackIds={activeStackIds}
        activeDeckIds={activeDeckIds}
        activeHandCardIds={activeHandCardIds}
        handInsertPreview={handInsertPreview}
        stackOffsetRatio={STACK_OFFSET_RATIO}
        onPointerMove={moveActiveDrag}
        onPointerUp={finishActiveDrag}
        onPointerCancel={cancelActiveDrag}
        onDeckPointerDown={beginDeckDrag}
        onDeckKeyDown={handleDeckKeyDown}
        onCardPointerDown={beginStackDrag}
        onCardKeyDown={handleCardKeyDown}
        onHandCardPointerDown={beginHandDrag}
        onHandCardKeyDown={handleHandKeyDown}
      />
      <PlaytestLog entries={playtestLog} onResetGame={resetGame} />
    </main>
  )
}

export default App
