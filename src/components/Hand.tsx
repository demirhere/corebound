import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import { CardShell, type CardView } from './BoardCard'

export type HandPointerDownHandler = (
  event: ReactPointerEvent<HTMLDivElement>,
  cardId: string,
) => void

export type HandKeyDownHandler = (
  event: ReactKeyboardEvent<HTMLDivElement>,
  cardId: string,
) => void

export type HandInsertPreview = {
  index: number
  cardCount: number
  activeCardId: string | null
}

type HandProps = {
  cardIds: string[]
  cards: Record<string, CardView>
  activeCardIds: readonly string[]
  insertPreview: HandInsertPreview | null
  handRef: Ref<HTMLElement>
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
}

export function Hand({
  cardIds,
  cards,
  activeCardIds,
  insertPreview,
  handRef,
  onCardPointerDown,
  onCardKeyDown,
}: HandProps) {
  const handCards = cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    return card ? [card] : []
  })
  const cardCount = handCards.length
  const previewActiveCardId = insertPreview?.activeCardId ?? null
  const previewCardCount = insertPreview?.cardCount ?? 0
  const activePreviewCard = previewActiveCardId
    ? handCards.some((card) => card.id === previewActiveCardId)
    : false
  const previewBaseCardCount = activePreviewCard ? cardCount - 1 : cardCount
  const previewIndex = insertPreview
    ? Math.min(Math.max(insertPreview.index, 0), previewBaseCardCount)
    : null
  const totalSlots = insertPreview
    ? previewBaseCardCount + previewCardCount
    : cardCount

  function getFanStyle(slotIndex: number, isActive = false) {
    const fanOffset = slotIndex - (totalSlots - 1) / 2
    const fanXPercent = fanOffset * 85
    const fanY = Math.abs(fanOffset) * 2
    const fanRotation = fanOffset * 2.25
    const fanZ = 100 + Math.round((totalSlots - Math.abs(fanOffset)) * 10) + slotIndex

    return {
      transform: `translate(calc(-50% + ${fanXPercent}%), calc(-50% + ${fanY}px)) rotate(${fanRotation}deg)`,
      zIndex: isActive ? 1102 : fanZ,
    } as CSSProperties
  }

  function getCardSlotIndex(index: number, cardId: string) {
    if (previewIndex === null) {
      return index
    }

    if (cardId === previewActiveCardId) {
      return index
    }

    const baseIndex = handCards
      .slice(0, index)
      .filter((card) => card.id !== previewActiveCardId)
      .length

    return baseIndex + (baseIndex >= previewIndex ? previewCardCount : 0)
  }

  return (
    <section ref={handRef} className="hand" data-hand aria-label="Player hand">
      <div className="hand-strip">
        {previewIndex !== null &&
          Array.from({ length: previewCardCount }, (_, index) => (
            <div
              key={`hand-insert-${index}`}
              className="hand-insert-slot"
              style={getFanStyle(previewIndex + index)}
              aria-hidden="true"
            />
          ))}
        {handCards.map((card, index) => {
          const isActive = activeCardIds.includes(card.id)

          return (
            <div
              key={card.id}
              className={`hand-card-slot ${isActive ? 'is-being-dragged' : ''}`}
              style={getFanStyle(getCardSlotIndex(index, card.id), isActive)}
            >
              <div className="hand-card-drag" data-hand-card-id={card.id}>
                <CardShell
                  card={card}
                  className="hand-card-shell"
                  isActive={isActive}
                  ariaLabel={`${card.title}. Click to drop to the board or drag out of your hand.`}
                  onPointerDown={(event) => onCardPointerDown(event, card.id)}
                  onKeyDown={(event) => onCardKeyDown(event, card.id)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
