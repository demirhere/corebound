import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import {
  STACK_OFFSET_RATIO,
  getBoardDropPosition as getRelativeBoardDropPosition,
  getCardOrigin,
  readBoardMetrics as readBoardMetricsForElement,
} from '../board/interactionGeometry'
import {
  activateDeckDragUpdate,
  activateStackDragUpdate,
  addStackToHandUpdate,
  chooseScoutCardUpdate,
  chooseWakeCrewUpdate,
  clearBoardDropTargetUpdate,
  commitDeckDragPositionUpdate,
  commitStackDragPositionUpdate,
  confirmScoutChoiceUpdate,
  deckOnDropTargetUpdate,
  discardHandCardUpdate,
  discardStackUpdate,
  drawFromDeckUpdate,
  dropHandCardToBoardUpdate,
  promoteHandCardToStackUpdate,
  reorderHandCardUpdate,
  stackOnDropTargetUpdate,
} from '../board/boardUpdaters'
import {
  animateHandDragTransformToSlot,
  clearDragTransform,
  hasDraggedPastTolerance,
  setDragTransform,
  updateDeckDragPosition,
  updateHandDragPosition,
  updateStackDragPosition,
} from '../board/dragMotion'
import type {
  DeckDragState,
  DragPreparation,
  DragState,
  HandDragState,
  HandInsertPreview,
  StackDragState,
} from '../board/dragState'
import {
  getNearestDeckDropTarget,
  getNearestDropTarget,
  getStackDropTargetIds,
} from '../board/dropTargets'
import {
  canPutCardIdsInHand,
  canUseManualHandZone,
  getCardHandZone,
  getHandCardIds,
} from '../board/handState'
import {
  clamp,
} from '../game/geometry'
import type { BoardUpdater } from '../game/state'
import type {
  BoardMetrics,
  BoardState,
  DropTarget,
  HandZone,
} from '../game/types'

type UseBoardInteractionsArgs = {
  board: BoardState
  setBoard: (update: BoardUpdater) => void
}

export function useBoardInteractions({ board, setBoard }: UseBoardInteractionsArgs) {
  const boardRef = useRef<HTMLDivElement>(null)
  const handRef = useRef<HTMLElement>(null)
  const dragsRef = useRef<Map<number, DragState>>(new Map())
  const pendingDragIdsRef = useRef<Set<number>>(new Set())
  const dragFrameRef = useRef<number | null>(null)
  const stackDropTargetCountsRef = useRef<Map<string, number>>(new Map())
  const stackableTargetCountsRef = useRef<Map<string, number>>(new Map())
  const deckDropTargetCountsRef = useRef<Map<string, number>>(new Map())
  const handDropTargetCountsRef = useRef<Record<HandZone, number>>({ crew: 0, tired: 0 })
  const discardDropTargetCountRef = useRef(0)
  const boardStateRef = useRef<BoardState>(board)
  const [activeStackIds, setActiveStackIds] = useState<string[]>([])
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>([])
  const [activeHandCardIds, setActiveHandCardIds] = useState<string[]>([])
  const [handInsertPreview, setHandInsertPreview] = useState<HandInsertPreview | null>(null)

  function resetInteractions() {
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
    stackableTargetCountsRef.current.clear()
    deckDropTargetCountsRef.current.clear()
    handDropTargetCountsRef.current = { crew: 0, tired: 0 }
    discardDropTargetCountRef.current = 0
    boardRef.current
      ?.querySelectorAll<HTMLElement>('.is-drop-target, .is-stackable-target')
      .forEach((element) => element.classList.remove('is-drop-target', 'is-stackable-target'))
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
  }

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

    for (const stackId of stackableTargetCountsRef.current.keys()) {
      getStackElement(stackId)?.classList.add('is-stackable-target')
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
    return readBoardMetricsForElement(boardRef.current)
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

  function toggleStackableTarget(stackId: string | null, enabled: boolean) {
    if (!stackId) {
      return
    }

    const counts = stackableTargetCountsRef.current
    const currentCount = counts.get(stackId) ?? 0
    const nextCount = enabled ? currentCount + 1 : Math.max(0, currentCount - 1)

    if (nextCount === currentCount) {
      return
    }

    if (nextCount === 0) {
      counts.delete(stackId)
      getStackElement(stackId)?.classList.remove('is-stackable-target')
      return
    }

    counts.set(stackId, nextCount)

    if (currentCount === 0) {
      getStackElement(stackId)?.classList.add('is-stackable-target')
    }
  }

  function setStackableTargets(drag: StackDragState, stackIds: readonly string[]) {
    const currentIds = new Set(drag.stackableTargetStackIds)
    const nextIds = new Set(stackIds)

    for (const stackId of currentIds) {
      if (!nextIds.has(stackId)) {
        toggleStackableTarget(stackId, false)
      }
    }

    for (const stackId of nextIds) {
      if (!currentIds.has(stackId)) {
        toggleStackableTarget(stackId, true)
      }
    }

    drag.stackableTargetStackIds = Array.from(nextIds)
  }

  function clearStackableTargets(drag: StackDragState) {
    setStackableTargets(drag, [])
  }

  function refreshStackableTargets(drag: StackDragState) {
    const activeId = drag.activeStackId

    if (!activeId) {
      clearStackableTargets(drag)
      return
    }

    const current = boardStateRef.current

    setStackableTargets(
      drag,
      getStackDropTargetIds(
        current,
        activeId,
      ),
    )
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
    clearStackableTargets(drag)
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
    setBoard(clearBoardDropTargetUpdate)
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
      setBoard(activateStackDragUpdate({
        stackId: drag.stackId,
        cardId: drag.cardId,
        cardIndex: drag.cardIndex,
        activeId,
        startX: drag.startX,
        startY: drag.startY,
      }))
    })

    drag.activeElement = getStackElement(activeId) ?? (activeId === drag.stackId ? drag.sourceElement : null)
    refreshStackableTargets(drag)
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
      setBoard(activateDeckDragUpdate(drag.deckId))
    })

    drag.element = getDeckElement(drag.deckId) ?? drag.element
    return true
  }

  function activateHandDrag(drag: HandDragState) {
    const sourceHandZone = getCardHandZone(boardStateRef.current, drag.cardId)

    if (!sourceHandZone || !canUseManualHandZone(sourceHandZone)) {
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
    const dropTargetHandZone = targetHandZone &&
      canUseManualHandZone(targetHandZone) &&
      canPutCardIdsInHand(activeStack.cardIds, current.cards)
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
          { ...current, stacks: previewStacks },
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
    const targetHandZone = !dropTargetDiscard
      ? getHandZoneAtPoint(drag.currentClientX, drag.currentClientY)
      : null
    const dropTargetHandZone = targetHandZone && canUseManualHandZone(targetHandZone)
      ? targetHandZone
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

    setBoard(commitStackDragPositionUpdate(activeId, drag.latestX, drag.latestY))
  }

  function commitDeckDragPosition(drag: DeckDragState) {
    setBoard(commitDeckDragPositionUpdate(drag.deckId, drag.latestX, drag.latestY))
  }

  function drawFromDeck(deckId: string) {
    setBoard(drawFromDeckUpdate(deckId, readBoardMetrics()))
  }

  function chooseWakeCrew(cardId: string) {
    setBoard(chooseWakeCrewUpdate(cardId))
  }

  function chooseScoutCard(cardId: string) {
    setBoard(chooseScoutCardUpdate(cardId))
  }

  function confirmScoutChoice() {
    setBoard(confirmScoutChoiceUpdate)
  }

  function getBoardDropPosition(clientX: number, clientY: number, placeAboveHand = false) {
    const metrics = readBoardMetrics()

    return getRelativeBoardDropPosition(
      clientX,
      clientY,
      boardRef.current,
      getHandElement(),
      metrics,
      placeAboveHand,
    )
  }

  function dropHandCardToBoard(cardId: string, position: { x: number; y: number }) {
    setBoard(dropHandCardToBoardUpdate(cardId, position))
  }

  function discardStack(stackId: string) {
    setBoard(discardStackUpdate(stackId))
  }

  function discardHandCard(cardId: string) {
    setBoard(discardHandCardUpdate(cardId))
  }

  function promoteHandDragToStack(clientX: number, clientY: number, drag: HandDragState) {
    const current = boardStateRef.current
    const card = current.cards[drag.cardId]

    const sourceHandZone = getCardHandZone(current, drag.cardId)

    if (
      current.hasArrived ||
      current.lossReason ||
      !card ||
      !sourceHandZone ||
      !canUseManualHandZone(sourceHandZone)
    ) {
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
      setBoard(promoteHandCardToStackUpdate(drag.cardId, stackId, nextZ, position))
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
      stackableTargetStackIds: [],
      handInsertIndex: null,
      hasMoved: true,
    }

    dragsRef.current.set(drag.pointerId, stackDrag)
    refreshStackableTargets(stackDrag)
    return stackDrag
  }

  function reorderHandCard(cardId: string, zone: HandZone, insertIndex: number) {
    setBoard(reorderHandCardUpdate(cardId, zone, insertIndex))
  }

  function addStackToHand(sourceStackId: string, zone: HandZone, insertIndex: number | null) {
    setBoard(addStackToHandUpdate(sourceStackId, zone, insertIndex))
  }

  function beginStackDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    stackId: string,
    cardId: string,
    cardIndex: number,
  ) {
    if (
      board.hasArrived ||
      board.lossReason ||
      board.pendingWakeChoice ||
      board.pendingScoutChoice ||
      event.button !== 0 ||
      dragsRef.current.has(event.pointerId)
    ) {
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
      stackableTargetStackIds: [],
      handInsertIndex: null,
      hasMoved: false,
    })
  }

  function beginDeckDrag(event: ReactPointerEvent<HTMLButtonElement>, deckId: string) {
    if (
      board.hasArrived ||
      board.lossReason ||
      board.pendingWakeChoice ||
      board.pendingScoutChoice ||
      event.button !== 0 ||
      dragsRef.current.has(event.pointerId)
    ) {
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
    if (
      board.hasArrived ||
      board.lossReason ||
      board.pendingWakeChoice ||
      board.pendingScoutChoice ||
      event.button !== 0 ||
      dragsRef.current.has(event.pointerId)
    ) {
      return
    }

    for (const activeDrag of dragsRef.current.values()) {
      if (activeDrag.kind === 'hand' && activeDrag.cardId === cardId) {
        return
      }
    }

    const card = board.cards[cardId]
    const sourceHandZone = getCardHandZone(board, cardId)

    if (
      !card ||
      card.kind !== 'crew' ||
      sourceHandZone !== zone ||
      !canUseManualHandZone(sourceHandZone)
    ) {
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
    setBoard(stackOnDropTargetUpdate(sourceStackId, dropTarget, readBoardMetrics()))
  }

  function deckOnDropTarget(sourceDeckId: string, targetDeckId: string) {
    setBoard(deckOnDropTargetUpdate(sourceDeckId, targetDeckId))
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

        clearDragTransform(drag.activeElement)
        flushSync(() => {
          commitStackDragPosition(drag)
        })
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
        animateHandDragTransformToSlot(drag.cardId, drag.element, previousRect, removeActiveHandCardId)
      } else if (isPointInHand(event.clientX, event.clientY)) {
        const previousRect = drag.element?.getBoundingClientRect() ?? null

        flushSync(() => {
          clearHandDragDropTarget(drag)
        })
        animateHandDragTransformToSlot(drag.cardId, drag.element, previousRect, removeActiveHandCardId)
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
    clearDragTransform(drag.element)

    flushSync(() => {
      removeActiveDeckId(drag.deckId)

      if (dropTargetDeckId) {
        deckOnDropTarget(drag.deckId, dropTargetDeckId)
      } else {
        commitDeckDragPosition(drag)
        clearDropTarget()
      }
    })
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
      clearDragTransform(drag.element)
      flushSync(() => {
        removeActiveDeckId(drag.deckId)
        commitDeckDragPosition(drag)
        clearDropTarget()
      })
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

    if (boardStateRef.current.pendingWakeChoice || boardStateRef.current.pendingScoutChoice) {
      return
    }

    drawFromDeck(deckId)
  }

  function handleHandKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, cardId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()

    if (boardStateRef.current.pendingWakeChoice || boardStateRef.current.pendingScoutChoice) {
      return
    }

    const sourceHandZone = getCardHandZone(boardStateRef.current, cardId)

    if (!sourceHandZone || !canUseManualHandZone(sourceHandZone)) {
      return
    }

    const cardRect = event.currentTarget.getBoundingClientRect()

    dropHandCardToBoard(
      cardId,
      getBoardDropPosition(
        cardRect.left + cardRect.width / 2,
        cardRect.top + cardRect.height / 2,
        true,
      ),
    )
  }

  return {
    boardRef,
    handRef,
    activeStackIds,
    activeDeckIds,
    activeHandCardIds,
    handInsertPreview,
    stackOffsetRatio: STACK_OFFSET_RATIO,
    onPointerMove: moveActiveDrag,
    onPointerUp: finishActiveDrag,
    onPointerCancel: cancelActiveDrag,
    onDeckPointerDown: beginDeckDrag,
    onDeckKeyDown: handleDeckKeyDown,
    onCardPointerDown: beginStackDrag,
    onCardKeyDown: handleCardKeyDown,
    onHandCardPointerDown: beginHandDrag,
    onHandCardKeyDown: handleHandKeyDown,
    onWakeCrewChoice: chooseWakeCrew,
    onScoutCardChoice: chooseScoutCard,
    onScoutChoiceConfirm: confirmScoutChoice,
    resetInteractions,
  }
}
