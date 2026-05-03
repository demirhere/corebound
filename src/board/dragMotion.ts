import { clampStackPosition } from './interactionGeometry'
import type { DeckDragState, DragState, HandDragState, StackDragState } from './dragState'

const DRAG_CLICK_TOLERANCE = 5

export function setDragTransform(element: HTMLElement, deltaX: number, deltaY: number) {
  element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`
}

export function clearDragTransform(element: HTMLElement | null) {
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

export function animateHandDragTransformToSlot(
  cardId: string,
  element: HTMLElement | null,
  previousRect: DOMRect | null,
  removeActiveHandCardId: (cardId: string) => void,
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

export function hasDraggedPastTolerance(clientX: number, clientY: number, drag: DragState) {
  return Math.hypot(clientX - drag.startClientX, clientY - drag.startClientY) > DRAG_CLICK_TOLERANCE
}

export function updateStackDragPosition(clientX: number, clientY: number, drag: StackDragState) {
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

export function updateDeckDragPosition(clientX: number, clientY: number, drag: DeckDragState) {
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

export function updateHandDragPosition(clientX: number, clientY: number, drag: HandDragState) {
  drag.currentClientX = clientX
  drag.currentClientY = clientY
  drag.latestDeltaX = clientX - drag.startClientX
  drag.latestDeltaY = clientY - drag.startClientY
}
