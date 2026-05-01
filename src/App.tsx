import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
}

type StackDragState = {
  kind: 'stack'
  pointerId: number
  stackId: string
  cardId: string
  cardIndex: number
  movingStackId: string
  activeStackId: string | null
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  hasMoved: boolean
}

type DeckDragState = {
  kind: 'deck'
  pointerId: number
  deckId: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
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

const DRAG_CLICK_TOLERANCE = 5
const DRAW_RADIUS_PERCENT = 18
const DRAW_MIN_RADIUS_PERCENT = 8
const STACK_OFFSET_RATIO = 0.38

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
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function App() {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [board, setBoard] = useState(createInitialBoard)
  const [activeStackId, setActiveStackId] = useState<string | null>(null)
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)

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

  function clampStackPosition(x: number, y: number, cardCount: number) {
    const metrics = readBoardMetrics()
    const stackHeight =
      metrics.cardHeight + Math.max(0, cardCount - 1) * metrics.stackOffset
    const maxX = 100 - (metrics.cardWidth / metrics.width) * 100 - 1
    const maxY = 100 - (stackHeight / metrics.height) * 100 - 1

    return {
      x: clamp(x, 1, Math.max(1, maxX)),
      y: clamp(y, 1, Math.max(1, maxY)),
    }
  }

  function getStackCenter(stack: Stack, metrics: BoardMetrics) {
    const stackHeight =
      metrics.cardHeight + Math.max(0, stack.cardIds.length - 1) * metrics.stackOffset

    return {
      x: (stack.x / 100) * metrics.width + metrics.cardWidth / 2,
      y: (stack.y / 100) * metrics.height + stackHeight / 2,
    }
  }

  function getCardOrigin(stack: Stack, cardIndex: number) {
    const metrics = readBoardMetrics()
    const offsetPercent = ((metrics.stackOffset * cardIndex) / metrics.height) * 100

    return {
      x: stack.x,
      y: stack.y + offsetPercent,
    }
  }

  function getNearestStackId(
    stacks: Stack[],
    sourceStackId: string,
    metrics: BoardMetrics,
  ) {
    const sourceStack = stacks.find((stack) => stack.id === sourceStackId)

    if (!sourceStack) {
      return null
    }

    const sourceCenter = getStackCenter(sourceStack, metrics)
    const dropDistance = Math.max(metrics.cardWidth, metrics.cardHeight) * 0.9
    let nearestStackId: string | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const targetStack of stacks) {
      if (targetStack.id === sourceStackId) {
        continue
      }

      const targetCenter = getStackCenter(targetStack, metrics)
      const distance = Math.hypot(
        sourceCenter.x - targetCenter.x,
        sourceCenter.y - targetCenter.y,
      )

      if (distance < dropDistance && distance < nearestDistance) {
        nearestStackId = targetStack.id
        nearestDistance = distance
      }
    }

    return nearestStackId
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
      current.dropTargetStackId ? { ...current, dropTargetStackId: null } : current,
    )
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

    const origin = getCardOrigin(stack, cardIndex)

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
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: origin.x,
      startY: origin.y,
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

    event.preventDefault()
    captureBoardPointer(event.pointerId)
    setActiveDeckId(deckId)
    dragRef.current = {
      kind: 'deck',
      pointerId: event.pointerId,
      deckId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: deck.x,
      startY: deck.y,
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

    const metrics = readBoardMetrics()
    const deltaX = ((event.clientX - drag.startClientX) / metrics.width) * 100
    const deltaY = ((event.clientY - drag.startClientY) / metrics.height) * 100
    const isActivating = !drag.hasMoved

    if (isActivating) {
      drag.hasMoved = true
      drag.activeStackId = drag.cardIndex === 0 ? drag.stackId : drag.movingStackId
      setActiveStackId(drag.activeStackId)
    }

    const activeId = drag.activeStackId

    if (!activeId) {
      return
    }

    setBoard((current) => {
      const movingStack = current.stacks.find((stack) => stack.id === activeId)
      const sourceStack = current.stacks.find((stack) => stack.id === drag.stackId)
      const movingCardCount =
        movingStack?.cardIds.length ??
        Math.max(1, (sourceStack?.cardIds.length ?? drag.cardIndex + 1) - drag.cardIndex)
      const position = clampStackPosition(
        drag.startX + deltaX,
        drag.startY + deltaY,
        movingCardCount,
      )
      const nextZ = isActivating ? current.topZ + 1 : current.topZ
      let nextStacks: Stack[]

      if (isActivating && drag.cardIndex > 0 && sourceStack) {
        const remainingCardIds = sourceStack.cardIds.slice(0, drag.cardIndex)
        const movingCardIds = sourceStack.cardIds.slice(drag.cardIndex)

        nextStacks = current.stacks.flatMap((stack) => {
          if (stack.id !== sourceStack.id) {
            return [stack]
          }

          return [
            { ...stack, cardIds: remainingCardIds },
            {
              id: activeId,
              cardIds: movingCardIds,
              x: position.x,
              y: position.y,
              z: nextZ,
            },
          ]
        })
      } else {
        nextStacks = current.stacks.map((stack) =>
          stack.id === activeId
            ? {
                ...stack,
                x: position.x,
                y: position.y,
                z: isActivating ? nextZ : stack.z,
              }
            : stack,
        )
      }

      return {
        ...current,
        topZ: nextZ,
        stacks: nextStacks,
        dropTargetStackId: getNearestStackId(nextStacks, activeId, metrics),
      }
    })
  }

  function moveDeckDrag(event: ReactPointerEvent<HTMLDivElement>, drag: DeckDragState) {
    const movedDistance = Math.hypot(
      event.clientX - drag.startClientX,
      event.clientY - drag.startClientY,
    )

    if (!drag.hasMoved && movedDistance <= DRAG_CLICK_TOLERANCE) {
      return
    }

    const metrics = readBoardMetrics()
    const deltaX = ((event.clientX - drag.startClientX) / metrics.width) * 100
    const deltaY = ((event.clientY - drag.startClientY) / metrics.height) * 100
    const isActivating = !drag.hasMoved
    const position = clampStackPosition(drag.startX + deltaX, drag.startY + deltaY, 1)

    if (isActivating) {
      drag.hasMoved = true
    }

    setBoard((current) => {
      const nextZ = isActivating ? current.topZ + 1 : current.topZ

      return {
        ...current,
        topZ: nextZ,
        dropTargetStackId: null,
        decks: current.decks.map((deck) =>
          deck.id === drag.deckId
            ? {
                ...deck,
                x: position.x,
                y: position.y,
                z: isActivating ? nextZ : deck.z,
              }
            : deck,
        ),
      }
    })
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

  function stackOnDropTarget(sourceStackId: string) {
    setBoard((current) => {
      const sourceStack = current.stacks.find((stack) => stack.id === sourceStackId)
      const targetStackId = current.dropTargetStackId

      if (!sourceStack || !targetStackId || targetStackId === sourceStackId) {
        return { ...current, dropTargetStackId: null }
      }

      const targetStack = current.stacks.find((stack) => stack.id === targetStackId)

      if (!targetStack) {
        return { ...current, dropTargetStackId: null }
      }

      const nextZ = current.topZ + 1

      return {
        ...current,
        topZ: nextZ,
        dropTargetStackId: null,
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
        stackOnDropTarget(drag.activeStackId)
        return
      }

      clearDropTarget()
      return
    }

    setActiveDeckId(null)

    if (!drag.hasMoved) {
      drawFromDeck(drag.deckId)
      return
    }

    clearDropTarget()
  }

  function cancelActiveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    releaseBoardPointer(event.pointerId)
    dragRef.current = null
    setActiveStackId(null)
    setActiveDeckId(null)
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
