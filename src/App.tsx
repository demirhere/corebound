import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { Board } from './components/Board'
import './App.css'

type CardBlueprint = {
  title: string
  icon: string
  hue: number
  accent: string
}

type Card = CardBlueprint & {
  id: string
  faceUp: boolean
}

type Stack = {
  id: string
  cardIds: string[]
  x: number
  y: number
  z: number
}

type Deck = {
  id: string
  title: string
  icon: string
  hue: number
  accent: string
  x: number
  y: number
  z: number
  cards: CardBlueprint[]
}

type BoardState = {
  cards: Record<string, Card>
  stacks: Stack[]
  decks: Deck[]
  topZ: number
  nextCardId: number
  dropTargetStackId: string | null
  dropTargetDeckId: string | null
}

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

type DragState = StackDragState | DeckDragState

type DragPreparation = 'idle' | 'active' | 'stale'

type BoardMetrics = {
  width: number
  height: number
  cardWidth: number
  cardHeight: number
  stackOffset: number
}

type Bounds = {
  left: number
  top: number
  right: number
  bottom: number
}

type DropTarget = {
  stackId: string | null
  deckId: string | null
}

const DRAG_CLICK_TOLERANCE = 5
const DRAW_RADIUS_PERCENT = 18
const DRAW_MIN_RADIUS_PERCENT = 8
const STACK_OFFSET_RATIO = 0.38
const DROP_TARGET_OVERLAP_RATIO = 0.28

const startingCards: Card[] = [
  {
    id: 'ark-bridge',
    title: 'Ark Bridge',
    icon: '🚀',
    hue: 193,
    accent: '#64f3ff',
    faceUp: true,
  },
  {
    id: 'cryo-garden',
    title: 'Cryo Garden',
    icon: '🌱',
    hue: 139,
    accent: '#6dff9e',
    faceUp: true,
  },
  {
    id: 'fusion-core',
    title: 'Fusion Core',
    icon: '☀️',
    hue: 35,
    accent: '#ffb25f',
    faceUp: true,
  },
  {
    id: 'water-loop',
    title: 'Water Loop',
    icon: '💧',
    hue: 205,
    accent: '#71c7ff',
    faceUp: false,
  },
  {
    id: 'signal-beacon',
    title: 'Signal Beacon',
    icon: '📡',
    hue: 274,
    accent: '#cf8cff',
    faceUp: true,
  },
  {
    id: 'scout-drone',
    title: 'Scout Drone',
    icon: '🛰️',
    hue: 314,
    accent: '#ff7bd5',
    faceUp: true,
  },
]

const sectorDeck: CardBlueprint[] = [
  {
    title: 'Dust Moon',
    icon: '◐',
    hue: 24,
    accent: '#ff9f68',
  },
  {
    title: 'Nebula Gate',
    icon: '✦',
    hue: 286,
    accent: '#da8cff',
  },
  {
    title: 'Ice Ring',
    icon: '❄',
    hue: 198,
    accent: '#82d8ff',
  },
  {
    title: 'Ember Field',
    icon: '◆',
    hue: 8,
    accent: '#ff7468',
  },
  {
    title: 'Green Echo',
    icon: '⬢',
    hue: 151,
    accent: '#77ffbb',
  },
]

const shipDeck: CardBlueprint[] = [
  {
    title: 'Sleeper Crew',
    icon: '☾',
    hue: 229,
    accent: '#8fa2ff',
  },
  {
    title: 'Seed Vault',
    icon: '✿',
    hue: 95,
    accent: '#baff7a',
  },
  {
    title: 'Hull Patch',
    icon: '⬟',
    hue: 48,
    accent: '#ffe073',
  },
  {
    title: 'Navigator',
    icon: '⌖',
    hue: 176,
    accent: '#69ffe8',
  },
]

function createInitialBoard(): BoardState {
  return {
    cards: Object.fromEntries(startingCards.map((card) => [card.id, card])),
    stacks: [
      { id: 'stack-bridge', cardIds: ['ark-bridge'], x: 27, y: 52, z: 10 },
      { id: 'stack-life', cardIds: ['cryo-garden', 'fusion-core'], x: 43, y: 14, z: 11 },
      { id: 'stack-water', cardIds: ['water-loop'], x: 57, y: 58, z: 12 },
      { id: 'stack-comms', cardIds: ['signal-beacon', 'scout-drone'], x: 70, y: 27, z: 13 },
    ],
    decks: [
      {
        id: 'sector-deck',
        title: 'Sector Deck',
        icon: '✦',
        hue: 261,
        accent: '#b99cff',
        x: 7,
        y: 15,
        z: 14,
        cards: sectorDeck,
      },
      {
        id: 'ship-deck',
        title: 'Ship Deck',
        icon: '⬢',
        hue: 164,
        accent: '#61ffd3',
        x: 77,
        y: 63,
        z: 15,
        cards: shipDeck,
      },
    ],
    topZ: 15,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getStackHeight(cardCount: number, metrics: BoardMetrics) {
  return metrics.cardHeight + Math.max(0, cardCount - 1) * metrics.stackOffset
}

function getStackBounds(stack: Stack, metrics: BoardMetrics): Bounds {
  const left = (stack.x / 100) * metrics.width
  const top = (stack.y / 100) * metrics.height

  return {
    left,
    top,
    right: left + metrics.cardWidth,
    bottom: top + getStackHeight(stack.cardIds.length, metrics),
  }
}

function getDeckBounds(deck: Deck, metrics: BoardMetrics): Bounds {
  const left = (deck.x / 100) * metrics.width
  const top = (deck.y / 100) * metrics.height

  return {
    left,
    top,
    right: left + metrics.cardWidth,
    bottom: top + metrics.cardHeight,
  }
}

function getBoundsCenterDistance(source: Bounds, target: Bounds) {
  const sourceCenterX = (source.left + source.right) / 2
  const sourceCenterY = (source.top + source.bottom) / 2
  const targetCenterX = (target.left + target.right) / 2
  const targetCenterY = (target.top + target.bottom) / 2

  return Math.hypot(sourceCenterX - targetCenterX, sourceCenterY - targetCenterY)
}

function getBoundsOverlapRatio(source: Bounds, target: Bounds) {
  const overlapWidth = Math.max(0, Math.min(source.right, target.right) - Math.max(source.left, target.left))
  const overlapHeight = Math.max(0, Math.min(source.bottom, target.bottom) - Math.max(source.top, target.top))
  const sourceArea = Math.max(0, source.right - source.left) * Math.max(0, source.bottom - source.top)
  const targetArea = Math.max(0, target.right - target.left) * Math.max(0, target.bottom - target.top)
  const smallerArea = Math.min(sourceArea, targetArea)

  return smallerArea === 0 ? 0 : (overlapWidth * overlapHeight) / smallerArea
}

function isFaceDownStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === false)
}

function isFaceUpStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === true)
}

function isSingleFaceDownCard(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length === 1 && cards[stack.cardIds[0]]?.faceUp === false
}

function canStackCards(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  return isFaceUpStack(sourceStack, cards) && isFaceUpStack(targetStack, cards)
}

function canCombineAsDeck(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  return isSingleFaceDownCard(sourceStack, cards) && isSingleFaceDownCard(targetStack, cards)
}

function cardsToDeckBlueprints(cardIds: string[], cards: Record<string, Card>) {
  return cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    if (!card) {
      return []
    }

    return [
      {
        title: card.title,
        icon: card.icon,
        hue: card.hue,
        accent: card.accent,
      },
    ]
  })
}

function withoutCards(cards: Record<string, Card>, cardIds: string[]) {
  const nextCards = { ...cards }

  for (const cardId of cardIds) {
    delete nextCards[cardId]
  }

  return nextCards
}

function App() {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragsRef = useRef<Map<number, DragState>>(new Map())
  const pendingDragIdsRef = useRef<Set<number>>(new Set())
  const dragFrameRef = useRef<number | null>(null)
  const stackDropTargetCountsRef = useRef<Map<string, number>>(new Map())
  const deckDropTargetCountsRef = useRef<Map<string, number>>(new Map())
  const [board, setBoard] = useState(createInitialBoard)
  const boardStateRef = useRef(board)
  const [activeStackIds, setActiveStackIds] = useState<string[]>([])
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>([])

  useLayoutEffect(() => {
    boardStateRef.current = board
  }, [board])

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
  })

  function readBoardMetrics(): BoardMetrics {
    const boardElement = boardRef.current
    const boardRect = boardElement?.getBoundingClientRect()
    const cardRect = boardElement
      ?.querySelector<HTMLElement>('.card-shell, .deck-card')
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
      } else {
        moveDeckDrag(drag.currentClientX, drag.currentClientY, drag)
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
    const deltaX = ((clientX - drag.startClientX) / drag.metrics.width) * 100
    const deltaY = ((clientY - drag.startClientY) / drag.metrics.height) * 100
    const position = clampStackPosition(
      drag.startX + deltaX,
      drag.startY + deltaY,
      drag.movingCardCount,
      drag.metrics,
    )

    drag.latestX = position.x
    drag.latestY = position.y
    drag.latestDeltaX = ((position.x - drag.startX) / 100) * drag.metrics.width
    drag.latestDeltaY = ((position.y - drag.startY) / 100) * drag.metrics.height
  }

  function updateDeckDragPosition(clientX: number, clientY: number, drag: DeckDragState) {
    const deltaX = ((clientX - drag.startClientX) / drag.metrics.width) * 100
    const deltaY = ((clientY - drag.startClientY) / drag.metrics.height) * 100
    const position = clampStackPosition(drag.startX + deltaX, drag.startY + deltaY, 1, drag.metrics)

    drag.latestX = position.x
    drag.latestY = position.y
    drag.latestDeltaX = ((position.x - drag.startX) / 100) * drag.metrics.width
    drag.latestDeltaY = ((position.y - drag.startY) / 100) * drag.metrics.height
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

  function clearStackDragDropTarget(drag: StackDragState) {
    toggleStackDropTarget(drag.dropTargetStackId, false)
    toggleDeckDropTarget(drag.dropTargetDeckId, false)
    drag.dropTargetStackId = null
    drag.dropTargetDeckId = null
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

    flushSync(() => {
      addActiveStackId(activeId)
      setBoard((current) => {
        const sourceStack = current.stacks.find((stack) => stack.id === drag.stackId)

        if (!sourceStack || sourceStack.cardIds[drag.cardIndex] !== drag.cardId) {
          return current
        }

        const nextZ = current.topZ + 1
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
                    cardIds: sourceStack.cardIds.slice(drag.cardIndex),
                    x: drag.startX,
                    y: drag.startY,
                    z: nextZ,
                  },
                ]
              })
            : current.stacks.map((stack) =>
                stack.id === activeId ? { ...stack, z: nextZ } : stack,
              )

        return {
          ...current,
          topZ: nextZ,
          stacks: nextStacks,
          dropTargetStackId: null,
          dropTargetDeckId: null,
        }
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

  function updateStackDropTarget(drag: StackDragState) {
    const activeId = drag.activeStackId

    if (!activeId) {
      return
    }

    const current = boardStateRef.current
    const hasActiveStack = current.stacks.some((stack) => stack.id === activeId)

    if (!hasActiveStack) {
      return
    }

    const previewStacks = current.stacks.map((stack) =>
      stack.id === activeId ? { ...stack, x: drag.latestX, y: drag.latestY } : stack,
    )
    const dropTarget = getNearestDropTarget(
      previewStacks,
      current.decks,
      current.cards,
      activeId,
      drag.metrics,
    )

    if (
      dropTarget.stackId === drag.dropTargetStackId &&
      dropTarget.deckId === drag.dropTargetDeckId
    ) {
      return
    }

    toggleStackDropTarget(drag.dropTargetStackId, false)
    toggleDeckDropTarget(drag.dropTargetDeckId, false)
    drag.dropTargetStackId = dropTarget.stackId
    drag.dropTargetDeckId = dropTarget.deckId
    toggleStackDropTarget(dropTarget.stackId, true)
    toggleDeckDropTarget(dropTarget.deckId, true)
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

  function commitStackDragPosition(drag: StackDragState) {
    const activeId = drag.activeStackId

    if (!activeId) {
      return
    }

    setBoard((current) => {
      let didMove = false
      const nextStacks = current.stacks.map((stack) => {
        if (stack.id !== activeId) {
          return stack
        }

        if (stack.x === drag.latestX && stack.y === drag.latestY) {
          return stack
        }

        didMove = true
        return { ...stack, x: drag.latestX, y: drag.latestY }
      })

      return didMove ? { ...current, stacks: nextStacks } : current
    })
  }

  function commitDeckDragPosition(drag: DeckDragState) {
    setBoard((current) => {
      let didMove = false
      const nextDecks = current.decks.map((deck) => {
        if (deck.id !== drag.deckId) {
          return deck
        }

        if (deck.x === drag.latestX && deck.y === drag.latestY) {
          return deck
        }

        didMove = true
        return { ...deck, x: drag.latestX, y: drag.latestY }
      })

      return didMove ? { ...current, decks: nextDecks } : current
    })
  }

  function flipCard(cardId: string, stackId: string) {
    setBoard((current) => {
      const card = current.cards[cardId]
      const stack = current.stacks.find((candidate) => candidate.id === stackId)

      if (!card || !stack || stack.cardIds.length !== 1 || stack.cardIds[0] !== cardId) {
        return current
      }

      const nextZ = current.topZ + 1

      return {
        ...current,
        topZ: nextZ,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: {
          ...current.cards,
          [cardId]: { ...card, faceUp: !card.faceUp },
        },
        stacks: current.stacks.map((stack) =>
          stack.id === stackId ? { ...stack, z: nextZ } : stack,
        ),
      }
    })
  }

  function drawFromDeck(deckId: string) {
    setBoard((current) => {
      const deck = current.decks.find((candidate) => candidate.id === deckId)
      const drawnCard = deck?.cards[0]

      if (!deck || !drawnCard) {
        return current
      }

      const distance =
        DRAW_MIN_RADIUS_PERCENT +
        Math.random() * (DRAW_RADIUS_PERCENT - DRAW_MIN_RADIUS_PERCENT)
      const angle = Math.random() * Math.PI * 2
      const position = clampStackPosition(
        deck.x + Math.cos(angle) * distance,
        deck.y + Math.sin(angle) * distance,
        1,
      )
      const newCardId = `drawn-${current.nextCardId}`
      const deckZ = current.topZ + 1
      const cardZ = current.topZ + 2

      return {
        ...current,
        topZ: cardZ,
        nextCardId: current.nextCardId + 1,
        dropTargetStackId: null,
        dropTargetDeckId: null,
        cards: {
          ...current.cards,
          [newCardId]: { ...drawnCard, id: newCardId, faceUp: true },
        },
        stacks: [
          ...current.stacks,
          {
            id: `stack-${newCardId}`,
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
      }
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

  function moveStackDrag(clientX: number, clientY: number, drag: StackDragState) {
    const preparation = prepareStackDrag(clientX, clientY, drag)

    if (preparation === 'stale') {
      releaseBoardPointer(drag.pointerId)
      stopTrackingDrag(drag.pointerId)
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
      return
    }

    if (preparation !== 'active') {
      return
    }

    applyDeckDragTransform(drag)
    updateDeckDropTarget(drag)
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

        return {
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
        }
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

        return {
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
            {
              id: `deck-${current.nextCardId}`,
              title: `${deckTopCard.title} Deck`,
              icon: deckTopCard.icon,
              hue: deckTopCard.hue,
              accent: deckTopCard.accent,
              x: targetStack.x,
              y: targetStack.y,
              z: nextZ,
              cards: [...sourceDeckCards, ...targetDeckCards],
            },
          ],
        }
      }

      if (!canStackCards(sourceStack, targetStack, current.cards)) {
        return { ...current, dropTargetStackId: null, dropTargetDeckId: null }
      }

      const nextZ = current.topZ + 1

      return {
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

      return {
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
      }
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
        return
      }

      if (preparation === 'idle') {
        flipCard(drag.cardId, drag.stackId)
        return
      }

      removeActiveStackId(drag.activeStackId)

      if (drag.activeStackId) {
        updateStackDragPosition(event.clientX, event.clientY, drag)
        updateStackDropTarget(drag)
        const dropTarget = {
          stackId: drag.dropTargetStackId,
          deckId: drag.dropTargetDeckId,
        }

        clearStackDragDropTarget(drag)
        commitStackDragPosition(drag)
        clearDragTransform(drag.activeElement)
        stackOnDropTarget(drag.activeStackId, dropTarget)
        return
      }

      clearDropTarget()
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

  function handleCardKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    stackId: string,
    cardId: string,
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    flipCard(cardId, stackId)
  }

  function handleDeckKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, deckId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    drawFromDeck(deckId)
  }

  return (
    <main className="app" aria-label="Corebound board prototype">
      <Board
        board={board}
        boardRef={boardRef}
        activeStackIds={activeStackIds}
        activeDeckIds={activeDeckIds}
        stackOffsetRatio={STACK_OFFSET_RATIO}
        onPointerMove={moveActiveDrag}
        onPointerUp={finishActiveDrag}
        onPointerCancel={cancelActiveDrag}
        onDeckPointerDown={beginDeckDrag}
        onDeckKeyDown={handleDeckKeyDown}
        onCardPointerDown={beginStackDrag}
        onCardKeyDown={handleCardKeyDown}
      />
    </main>
  )
}

export default App
