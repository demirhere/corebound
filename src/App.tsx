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
const DROP_TARGET_PADDING_RATIO = 0.14

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

function getBoundsDistance(source: Bounds, target: Bounds) {
  const horizontalGap = Math.max(0, target.left - source.right, source.left - target.right)
  const verticalGap = Math.max(0, target.top - source.bottom, source.top - target.bottom)

  return Math.hypot(horizontalGap, verticalGap)
}

function getBoundsCenterDistance(source: Bounds, target: Bounds) {
  const sourceCenterX = (source.left + source.right) / 2
  const sourceCenterY = (source.top + source.bottom) / 2
  const targetCenterX = (target.left + target.right) / 2
  const targetCenterY = (target.top + target.bottom) / 2

  return Math.hypot(sourceCenterX - targetCenterX, sourceCenterY - targetCenterY)
}

function isFaceDownStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === false)
}

function isSingleFaceDownCard(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length === 1 && cards[stack.cardIds[0]]?.faceUp === false
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
  const dragRef = useRef<DragState | null>(null)
  const [board, setBoard] = useState(createInitialBoard)
  const boardStateRef = useRef(board)
  const [activeStackId, setActiveStackId] = useState<string | null>(null)
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)

  useLayoutEffect(() => {
    boardStateRef.current = board
  }, [board])

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

    getStackElement(stackId)?.classList.toggle('is-drop-target', enabled)
  }

  function toggleDeckDropTarget(deckId: string | null, enabled: boolean) {
    if (!deckId) {
      return
    }

    getDeckElement(deckId)?.classList.toggle('is-drop-target', enabled)
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
    const dropDistance = Math.max(metrics.cardWidth, metrics.cardHeight) * DROP_TARGET_PADDING_RATIO
    const sourceIsFaceDown = isFaceDownStack(sourceStack, cards)
    let nearestKind: 'stack' | 'deck' | null = null
    let nearestId: string | null = null
    let nearestDistance = Number.POSITIVE_INFINITY
    let nearestCenterDistance = Number.POSITIVE_INFINITY

    function considerTarget(kind: 'stack' | 'deck', id: string, targetBounds: Bounds) {
      const distance = getBoundsDistance(sourceBounds, targetBounds)
      const centerDistance = getBoundsCenterDistance(sourceBounds, targetBounds)

      if (
        distance <= dropDistance &&
        (distance < nearestDistance ||
          (distance === nearestDistance && centerDistance < nearestCenterDistance))
      ) {
        nearestKind = kind
        nearestId = id
        nearestDistance = distance
        nearestCenterDistance = centerDistance
      }
    }

    for (const targetStack of stacks) {
      if (targetStack.id === sourceStackId) {
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
    const dropDistance = Math.max(metrics.cardWidth, metrics.cardHeight) * DROP_TARGET_PADDING_RATIO
    let nearestId: string | null = null
    let nearestDistance = Number.POSITIVE_INFINITY
    let nearestCenterDistance = Number.POSITIVE_INFINITY

    for (const targetDeck of decks) {
      if (targetDeck.id === sourceDeckId || targetDeck.cards.length === 0) {
        continue
      }

      const targetBounds = getDeckBounds(targetDeck, metrics)
      const distance = getBoundsDistance(sourceBounds, targetBounds)
      const centerDistance = getBoundsCenterDistance(sourceBounds, targetBounds)

      if (
        distance <= dropDistance &&
        (distance < nearestDistance ||
          (distance === nearestDistance && centerDistance < nearestCenterDistance))
      ) {
        nearestId = targetDeck.id
        nearestDistance = distance
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
    if (!boardStateRef.current.stacks.some((stack) => stack.id === drag.stackId)) {
      return
    }

    const activeId = drag.cardIndex === 0 ? drag.stackId : drag.movingStackId

    drag.hasMoved = true
    drag.activeStackId = activeId
    drag.dropTargetStackId = null
    drag.dropTargetDeckId = null

    flushSync(() => {
      setActiveStackId(activeId)
      setBoard((current) => {
        const sourceStack = current.stacks.find((stack) => stack.id === drag.stackId)

        if (!sourceStack) {
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
  }

  function activateDeckDrag(drag: DeckDragState) {
    if (!boardStateRef.current.decks.some((deck) => deck.id === drag.deckId)) {
      return
    }

    drag.hasMoved = true
    drag.dropTargetDeckId = null

    flushSync(() => {
      setActiveDeckId(drag.deckId)
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

      if (!card) {
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
    if (event.button !== 0) {
      return
    }

    const stack = board.stacks.find((candidate) => candidate.id === stackId)

    if (!stack) {
      return
    }

    const metrics = readBoardMetrics()
    const origin = getCardOrigin(stack, cardIndex, metrics)
    const movingCardCount = Math.max(1, stack.cardIds.length - cardIndex)

    event.preventDefault()
    captureBoardPointer(event.pointerId)
    dragRef.current = {
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
      startX: origin.x,
      startY: origin.y,
      latestX: origin.x,
      latestY: origin.y,
      latestDeltaX: 0,
      latestDeltaY: 0,
      dropTargetStackId: board.dropTargetStackId,
      dropTargetDeckId: board.dropTargetDeckId,
      hasMoved: false,
    }
  }

  function beginDeckDrag(event: ReactPointerEvent<HTMLButtonElement>, deckId: string) {
    if (event.button !== 0) {
      return
    }

    const deck = board.decks.find((candidate) => candidate.id === deckId)

    if (!deck) {
      return
    }

    const metrics = readBoardMetrics()

    event.preventDefault()
    captureBoardPointer(event.pointerId)
    dragRef.current = {
      kind: 'deck',
      pointerId: event.pointerId,
      deckId,
      metrics,
      element: event.currentTarget,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: deck.x,
      startY: deck.y,
      latestX: deck.x,
      latestY: deck.y,
      latestDeltaX: 0,
      latestDeltaY: 0,
      dropTargetDeckId: board.dropTargetDeckId,
      hasMoved: false,
    }
  }

  function moveStackDrag(event: ReactPointerEvent<HTMLDivElement>, drag: StackDragState) {
    const movedDistance = Math.hypot(
      event.clientX - drag.startClientX,
      event.clientY - drag.startClientY,
    )

    if (!drag.hasMoved && movedDistance <= DRAG_CLICK_TOLERANCE) {
      return
    }

    updateStackDragPosition(event.clientX, event.clientY, drag)

    if (!drag.hasMoved) {
      activateStackDrag(drag)
    }

    if (!drag.activeStackId) {
      return
    }

    applyStackDragTransform(drag)
    updateStackDropTarget(drag)
  }

  function moveDeckDrag(event: ReactPointerEvent<HTMLDivElement>, drag: DeckDragState) {
    const movedDistance = Math.hypot(
      event.clientX - drag.startClientX,
      event.clientY - drag.startClientY,
    )

    if (!drag.hasMoved && movedDistance <= DRAG_CLICK_TOLERANCE) {
      return
    }

    updateDeckDragPosition(event.clientX, event.clientY, drag)

    if (!drag.hasMoved) {
      activateDeckDrag(drag)
    }

    if (!drag.hasMoved) {
      return
    }

    applyDeckDragTransform(drag)
    updateDeckDropTarget(drag)
  }

  function moveActiveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    if (drag.kind === 'stack') {
      moveStackDrag(event, drag)
      return
    }

    moveDeckDrag(event, drag)
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

      if (isSingleFaceDownCard(sourceStack, current.cards) && isSingleFaceDownCard(targetStack, current.cards)) {
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
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    releaseBoardPointer(event.pointerId)
    dragRef.current = null

    if (drag.kind === 'stack') {
      setActiveStackId(null)

      if (!drag.hasMoved) {
        flipCard(drag.cardId, drag.stackId)
        return
      }

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

    if (!drag.hasMoved) {
      drawFromDeck(drag.deckId)
      return
    }

    updateDeckDragPosition(event.clientX, event.clientY, drag)
    updateDeckDropTarget(drag)
    const dropTargetDeckId = drag.dropTargetDeckId
    clearDeckDragDropTarget(drag)

    flushSync(() => {
      setActiveDeckId(null)

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
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    releaseBoardPointer(event.pointerId)
    dragRef.current = null

    if (drag.kind === 'stack') {
      if (drag.hasMoved && drag.activeStackId) {
        clearStackDragDropTarget(drag)
        commitStackDragPosition(drag)
        clearDragTransform(drag.activeElement)
      }
    } else if (drag.hasMoved) {
      clearDeckDragDropTarget(drag)
      flushSync(() => {
        setActiveDeckId(null)
        commitDeckDragPosition(drag)
        clearDropTarget()
      })
      clearDragTransform(drag.element)
    }

    setActiveStackId(null)
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
        activeStackId={activeStackId}
        activeDeckId={activeDeckId}
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
