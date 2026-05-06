import { useLayoutEffect, useRef, type RefObject } from 'react'
import { CRYO_DECK_ID, DRIFT_DECK_ID, HAZARD_DECK_ID, HORIZON_DECK_ID } from '../game/decks'
import type { BoardState, Card, CardBlueprint, Deck, HandZone } from '../game/types'

const CARD_MOVE_DURATION_MS = 170
export const CARD_DRAW_DURATION_MS = 600
const CARD_DRAW_STAGGER_MS = 28
const MIN_MOVEMENT_PX = 2

type MotionElement = {
  element: HTMLElement
  rect: DOMRect
}

type MotionSnapshot = {
  board: BoardState
  cardRects: Map<string, DOMRect>
  deckRects: Map<string, DOMRect>
}

type ActiveCardAnimation = {
  element: HTMLElement
  innerElement: HTMLElement | null
  timeoutId: number
}

type DrawOrigin = {
  deckId: string
  drawIndex: number
}

type CardLocation =
  | {
      kind: 'stack'
      stackId: string
      index: number
    }
  | {
      kind: 'hand'
      zone: HandZone
      index: number
    }
  | {
      kind: 'choice'
      choice: 'wake' | 'scout'
      index: number
    }

type UseCardMovementAnimationsArgs = {
  board: BoardState
  boardRef: RefObject<HTMLDivElement | null>
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getBlueprintSignature(card: Card | CardBlueprint) {
  return JSON.stringify({
    title: card.title,
    icon: card.icon,
    hue: card.hue,
    accent: card.accent,
    kind: card.kind,
    resource: card.resource ?? null,
    specializations: card.specializations ?? null,
    horizon: card.horizon ?? null,
    gate: card.gate ?? null,
    hazard: card.hazard ?? null,
  })
}

function sameBlueprint(left: Card | CardBlueprint, right: Card | CardBlueprint) {
  return getBlueprintSignature(left) === getBlueprintSignature(right)
}

function startsWithBlueprints(cards: readonly CardBlueprint[], prefix: readonly CardBlueprint[]) {
  if (prefix.length > cards.length) {
    return false
  }

  return prefix.every((card, index) => sameBlueprint(card, cards[index]))
}

function getRemovedTopCards(previousDeck: Deck, currentDeck: Deck | undefined) {
  if (!currentDeck) {
    return previousDeck.cards
  }

  for (let removedCount = 0; removedCount <= previousDeck.cards.length; removedCount += 1) {
    const remainingCards = previousDeck.cards.slice(removedCount)

    if (startsWithBlueprints(currentDeck.cards, remainingCards)) {
      return previousDeck.cards.slice(0, removedCount)
    }
  }

  const netRemovedCount = Math.max(0, previousDeck.cards.length - currentDeck.cards.length)

  return previousDeck.cards.slice(0, netRemovedCount)
}

function getRemovedTopCardsByDeck(previousBoard: BoardState, currentBoard: BoardState) {
  const currentDecks = new Map(currentBoard.decks.map((deck) => [deck.id, deck]))
  const removedCardsByDeck = new Map<string, CardBlueprint[]>()

  for (const previousDeck of previousBoard.decks) {
    const removedCards = getRemovedTopCards(previousDeck, currentDecks.get(previousDeck.id))

    if (removedCards.length > 0) {
      removedCardsByDeck.set(previousDeck.id, removedCards)
    }
  }

  return removedCardsByDeck
}

function getKnownSourceDeckId(card: Card) {
  if (card.id.startsWith('wake-')) {
    return CRYO_DECK_ID
  }

  if (card.id.startsWith('scout-')) {
    return HORIZON_DECK_ID
  }

  if (card.id.startsWith('drift-')) {
    return DRIFT_DECK_ID
  }

  if (card.id.startsWith('hazard-')) {
    return HAZARD_DECK_ID
  }

  if (card.id.startsWith('reward-')) {
    if (card.kind === 'resource' && card.resource) {
      return `${card.resource}-deck`
    }

    if (card.kind === 'crew') {
      return CRYO_DECK_ID
    }
  }

  return null
}

function getStackDrawSourceDeckId(board: BoardState, cardId: string) {
  const stack = board.stacks.find((candidate) => candidate.cardIds.includes(cardId))
  const drawChoiceGroupId = stack?.drawChoiceGroupId

  if (!drawChoiceGroupId) {
    return null
  }

  return board.decks.find((deck) => drawChoiceGroupId.startsWith(`${deck.id}-draw-`))?.id ?? null
}

function advanceDrawIndex(drawIndexes: Map<string, number>, deckId: string, drawIndex: number) {
  drawIndexes.set(deckId, Math.max(drawIndexes.get(deckId) ?? 0, drawIndex + 1))
}

function claimMatchingRemovedCard(
  deckId: string,
  card: Card,
  removedCardsByDeck: Map<string, CardBlueprint[]>,
  usedRemovedIndexes: Map<string, Set<number>>,
) {
  const removedCards = removedCardsByDeck.get(deckId)

  if (!removedCards) {
    return null
  }

  const usedIndexes = usedRemovedIndexes.get(deckId) ?? new Set<number>()
  const matchIndex = removedCards.findIndex(
    (removedCard, index) => !usedIndexes.has(index) && sameBlueprint(removedCard, card),
  )

  if (matchIndex < 0) {
    return null
  }

  usedIndexes.add(matchIndex)
  usedRemovedIndexes.set(deckId, usedIndexes)

  return matchIndex
}

function findMatchingDrawOrigin(
  card: Card,
  removedCardsByDeck: Map<string, CardBlueprint[]>,
  usedRemovedIndexes: Map<string, Set<number>>,
) {
  for (const deckId of removedCardsByDeck.keys()) {
    const drawIndex = claimMatchingRemovedCard(deckId, card, removedCardsByDeck, usedRemovedIndexes)

    if (drawIndex !== null) {
      return { deckId, drawIndex }
    }
  }

  return null
}

function getFallbackDrawIndex(drawIndexes: Map<string, number>, deckId: string) {
  const drawIndex = drawIndexes.get(deckId) ?? 0

  drawIndexes.set(deckId, drawIndex + 1)

  return drawIndex
}

function getDeckDrawOrigins(previousBoard: BoardState, currentBoard: BoardState) {
  const previousCardIds = new Set(Object.keys(previousBoard.cards))
  const removedCardsByDeck = getRemovedTopCardsByDeck(previousBoard, currentBoard)
  const usedRemovedIndexes = new Map<string, Set<number>>()
  const drawIndexes = new Map<string, number>()
  const origins = new Map<string, DrawOrigin>()

  for (const card of Object.values(currentBoard.cards)) {
    if (previousCardIds.has(card.id)) {
      continue
    }

    const knownSourceDeckId = getKnownSourceDeckId(card) ?? getStackDrawSourceDeckId(currentBoard, card.id)

    if (knownSourceDeckId) {
      const matchedDrawIndex = claimMatchingRemovedCard(
        knownSourceDeckId,
        card,
        removedCardsByDeck,
        usedRemovedIndexes,
      )
      const drawIndex = matchedDrawIndex ?? getFallbackDrawIndex(drawIndexes, knownSourceDeckId)

      advanceDrawIndex(drawIndexes, knownSourceDeckId, drawIndex)
      origins.set(card.id, { deckId: knownSourceDeckId, drawIndex })
      continue
    }

    const matchedOrigin = findMatchingDrawOrigin(card, removedCardsByDeck, usedRemovedIndexes)

    if (!matchedOrigin) {
      continue
    }

    advanceDrawIndex(drawIndexes, matchedOrigin.deckId, matchedOrigin.drawIndex)
    origins.set(card.id, matchedOrigin)
  }

  return origins
}

function setCardLocation(locations: Map<string, CardLocation>, cardId: string, location: CardLocation) {
  if (!locations.has(cardId)) {
    locations.set(cardId, location)
  }
}

function getCardLocations(board: BoardState) {
  const locations = new Map<string, CardLocation>()

  for (const stack of board.stacks) {
    stack.cardIds.forEach((cardId, index) => {
      setCardLocation(locations, cardId, { kind: 'stack', stackId: stack.id, index })
    })
  }

  board.handCardIds.forEach((cardId, index) => {
    setCardLocation(locations, cardId, { kind: 'hand', zone: 'crew', index })
  })

  board.tiredCardIds.forEach((cardId, index) => {
    setCardLocation(locations, cardId, { kind: 'hand', zone: 'tired', index })
  })

  board.pendingWakeChoice?.choiceCardIds.forEach((cardId, index) => {
    setCardLocation(locations, cardId, { kind: 'choice', choice: 'wake', index })
  })

  board.pendingScoutChoice?.choiceCardIds.forEach((cardId, index) => {
    setCardLocation(locations, cardId, { kind: 'choice', choice: 'scout', index })
  })

  return locations
}

function sameLocation(previousLocation: CardLocation, currentLocation: CardLocation) {
  if (previousLocation.kind !== currentLocation.kind) {
    return false
  }

  if (previousLocation.kind === 'stack' && currentLocation.kind === 'stack') {
    return previousLocation.stackId === currentLocation.stackId && previousLocation.index === currentLocation.index
  }

  if (previousLocation.kind === 'hand' && currentLocation.kind === 'hand') {
    return previousLocation.zone === currentLocation.zone && previousLocation.index === currentLocation.index
  }

  if (previousLocation.kind === 'choice' && currentLocation.kind === 'choice') {
    return previousLocation.choice === currentLocation.choice && previousLocation.index === currentLocation.index
  }

  return false
}

function shouldAnimateExistingMove(
  previousLocation: CardLocation | undefined,
  currentLocation: CardLocation | undefined,
) {
  if (!previousLocation || !currentLocation || sameLocation(previousLocation, currentLocation)) {
    return false
  }

  if (
    previousLocation.kind === 'hand' &&
    currentLocation.kind === 'hand' &&
    previousLocation.zone === currentLocation.zone
  ) {
    return false
  }

  if (currentLocation.kind === 'hand' && currentLocation.zone === 'tired') {
    return true
  }

  if (
    previousLocation.kind === 'hand' &&
    previousLocation.zone === 'tired' &&
    currentLocation.kind === 'hand' &&
    currentLocation.zone === 'crew'
  ) {
    return true
  }

  if (
    previousLocation.kind === 'stack' &&
    currentLocation.kind === 'stack' &&
    currentLocation.stackId.startsWith('stack-route-')
  ) {
    return true
  }

  return previousLocation.kind === 'choice' || currentLocation.kind === 'choice'
}

function getExistingMoveDuration(
  previousLocation: CardLocation | undefined,
  currentLocation: CardLocation | undefined,
) {
  if (
    currentLocation?.kind === 'hand' &&
    currentLocation.zone === 'tired'
  ) {
    return CARD_DRAW_DURATION_MS
  }

  if (
    previousLocation?.kind === 'hand' &&
    previousLocation.zone === 'tired' &&
    currentLocation?.kind === 'hand' &&
    currentLocation.zone === 'crew'
  ) {
    return CARD_DRAW_DURATION_MS
  }

  return CARD_MOVE_DURATION_MS
}

function readMotionElements(boardElement: HTMLElement) {
  const elements = new Map<string, MotionElement>()

  boardElement.querySelectorAll<HTMLElement>('[data-motion-card-id]').forEach((element) => {
    const cardId = element.dataset.motionCardId

    if (!cardId || elements.has(cardId)) {
      return
    }

    const rect = element.getBoundingClientRect()

    if (rect.width > 0 && rect.height > 0) {
      elements.set(cardId, { element, rect })
    }
  })

  return elements
}

function readDeckRects(boardElement: HTMLElement) {
  const rects = new Map<string, DOMRect>()

  boardElement.querySelectorAll<HTMLElement>('[data-deck-id]').forEach((element) => {
    const deckId = element.dataset.deckId

    if (!deckId || rects.has(deckId)) {
      return
    }

    const rect = element.getBoundingClientRect()

    if (rect.width > 0 && rect.height > 0) {
      rects.set(deckId, rect)
    }
  })

  return rects
}

function getCardRects(elements: Map<string, MotionElement>) {
  return new Map(Array.from(elements, ([cardId, { rect }]) => [cardId, rect]))
}

function cancelCardAnimation(cardId: string, activeAnimations: Map<string, ActiveCardAnimation>) {
  const activeAnimation = activeAnimations.get(cardId)

  if (!activeAnimation) {
    return
  }

  window.clearTimeout(activeAnimation.timeoutId)
  activeAnimation.element.style.removeProperty('transition')
  activeAnimation.element.style.removeProperty('transform')
  activeAnimation.element.style.removeProperty('transform-origin')
  activeAnimation.element.style.removeProperty('will-change')

  if (activeAnimation.innerElement) {
    activeAnimation.innerElement.style.removeProperty('transition')
    activeAnimation.innerElement.style.removeProperty('transform')
    activeAnimation.innerElement.style.removeProperty('will-change')
  }

  activeAnimations.delete(cardId)
}

function cancelAllAnimations(activeAnimations: Map<string, ActiveCardAnimation>) {
  for (const cardId of Array.from(activeAnimations.keys())) {
    cancelCardAnimation(cardId, activeAnimations)
  }
}

function startCardAnimation(
  cardId: string,
  target: MotionElement,
  fromRect: DOMRect,
  options: {
    kind: 'draw' | 'move'
    delay?: number
    duration?: number
    flip?: boolean
  },
  activeAnimations: Map<string, ActiveCardAnimation>,
) {
  cancelCardAnimation(cardId, activeAnimations)

  const deltaX = fromRect.left - target.rect.left
  const deltaY = fromRect.top - target.rect.top
  const scaleX = target.rect.width > 0 ? fromRect.width / target.rect.width : 1
  const scaleY = target.rect.height > 0 ? fromRect.height / target.rect.height : 1
  const movedFarEnough =
    Math.hypot(deltaX, deltaY) > MIN_MOVEMENT_PX ||
    Math.abs(scaleX - 1) > 0.02 ||
    Math.abs(scaleY - 1) > 0.02

  if (!movedFarEnough && !options.flip) {
    return
  }

  const duration = options.duration ?? (
    options.kind === 'draw' ? CARD_DRAW_DURATION_MS : CARD_MOVE_DURATION_MS
  )
  const delay = options.delay ?? 0
  const easing = options.kind === 'draw'
    ? 'cubic-bezier(0.14, 0.92, 0.22, 1)'
    : 'cubic-bezier(0.2, 0.86, 0.24, 1)'
  const rotation = options.kind === 'draw'
    ? clampNumber(deltaX / -90, -6, 6)
    : clampNumber(deltaX / -160, -3, 3)
  const moveDuration = duration
  const moveDelay = delay
  const flipDuration = Math.max(150, duration - 35)
  const flipDelay = delay + 24
  const innerElement = options.flip
    ? target.element.querySelector<HTMLElement>('.card-inner')
    : null
  const endAfter = Math.max(
    movedFarEnough ? moveDelay + moveDuration : 0,
    innerElement ? flipDelay + flipDuration : 0,
  )

  target.element.style.transition = 'none'
  target.element.style.transformOrigin = 'top left'
  target.element.style.willChange = 'transform'

  if (movedFarEnough) {
    target.element.style.transform =
      `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`
  }

  if (innerElement) {
    innerElement.style.transition = 'none'
    innerElement.style.transform = 'rotateY(180deg)'
    innerElement.style.willChange = 'transform'
  }

  void target.element.getBoundingClientRect()

  if (movedFarEnough) {
    target.element.style.transition = `transform ${moveDuration}ms ${easing} ${moveDelay}ms`
    target.element.style.transform = 'translate3d(0, 0, 0) scale(1, 1) rotate(0deg)'
  }

  if (innerElement) {
    innerElement.style.transition =
      `transform ${flipDuration}ms cubic-bezier(0.2, 0.75, 0.2, 1) ${flipDelay}ms`
    innerElement.style.transform = 'rotateY(0deg)'
  }

  const activeAnimation = {
    element: target.element,
    innerElement,
    timeoutId: window.setTimeout(() => {
      if (activeAnimations.get(cardId) !== activeAnimation) {
        return
      }

      target.element.style.removeProperty('transition')
      target.element.style.removeProperty('transform')
      target.element.style.removeProperty('transform-origin')
      target.element.style.removeProperty('will-change')

      if (innerElement) {
        innerElement.style.removeProperty('transition')
        innerElement.style.removeProperty('transform')
        innerElement.style.removeProperty('will-change')
      }

      activeAnimations.delete(cardId)
    }, endAfter + 80),
  }

  activeAnimations.set(cardId, activeAnimation)
}

function shouldSkipAnimations(previousBoard: BoardState, currentBoard: BoardState) {
  return currentBoard.nextCardId < previousBoard.nextCardId || currentBoard.topZ < previousBoard.topZ
}

export function useCardMovementAnimations({ board, boardRef }: UseCardMovementAnimationsArgs) {
  const previousSnapshotRef = useRef<MotionSnapshot | null>(null)
  const activeAnimationsRef = useRef<Map<string, ActiveCardAnimation>>(new Map())

  useLayoutEffect(() => {
    const activeAnimations = activeAnimationsRef.current

    return () => cancelAllAnimations(activeAnimations)
  }, [])

  useLayoutEffect(() => {
    const boardElement = boardRef.current

    if (!boardElement) {
      return
    }

    const currentCardElements = readMotionElements(boardElement)
    const currentDeckRects = readDeckRects(boardElement)
    const previousSnapshot = previousSnapshotRef.current

    if (previousSnapshot && !shouldSkipAnimations(previousSnapshot.board, board)) {
      const currentLocations = getCardLocations(board)
      const previousLocations = getCardLocations(previousSnapshot.board)
      const deckDrawOrigins = getDeckDrawOrigins(previousSnapshot.board, board)

      for (const [cardId, origin] of deckDrawOrigins) {
        const target = currentCardElements.get(cardId)
        const originRect = currentDeckRects.get(origin.deckId) ?? previousSnapshot.deckRects.get(origin.deckId)
        const card = board.cards[cardId]

        if (!target || !originRect || !card) {
          continue
        }

        startCardAnimation(
          cardId,
          target,
          originRect,
          {
            kind: 'draw',
            delay: origin.drawIndex * CARD_DRAW_STAGGER_MS,
            flip: card.faceUp,
          },
          activeAnimationsRef.current,
        )
      }

      for (const [cardId, target] of currentCardElements) {
        if (deckDrawOrigins.has(cardId)) {
          continue
        }

        const previousLocation = previousLocations.get(cardId)
        const currentLocation = currentLocations.get(cardId)

        if (!shouldAnimateExistingMove(previousLocation, currentLocation)) {
          continue
        }

        const previousRect = previousSnapshot.cardRects.get(cardId)

        if (!previousRect) {
          continue
        }

        startCardAnimation(
          cardId,
          target,
          previousRect,
          {
            kind: 'move',
            duration: getExistingMoveDuration(previousLocation, currentLocation),
          },
          activeAnimationsRef.current,
        )
      }
    }

    previousSnapshotRef.current = {
      board,
      cardRects: getCardRects(currentCardElements),
      deckRects: currentDeckRects,
    }
  }, [board, boardRef])
}
