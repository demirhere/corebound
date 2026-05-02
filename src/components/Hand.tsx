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

type HandProps = {
  cardIds: string[]
  cards: Record<string, CardView>
  activeCardIds: readonly string[]
  handRef: Ref<HTMLElement>
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
}

export function Hand({
  cardIds,
  cards,
  activeCardIds,
  handRef,
  onCardPointerDown,
  onCardKeyDown,
}: HandProps) {
  const handCards = cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    return card ? [card] : []
  })
  const cardCount = handCards.length

  return (
    <section ref={handRef} className="hand" data-hand aria-label="Player hand">
      <div className="hand-strip">
        {handCards.map((card, index) => {
          const fanOffset = index - (cardCount - 1) / 2
          const fanXPercent = fanOffset * 85
          const fanY = Math.abs(fanOffset) * 2
          const fanRotation = fanOffset * 2.25
          const fanZ = 100 + Math.round((cardCount - Math.abs(fanOffset)) * 10) + index
          const isActive = activeCardIds.includes(card.id)

          return (
            <div
              key={card.id}
              className={`hand-card-slot ${isActive ? 'is-being-dragged' : ''}`}
              style={
                {
                  transform: `translate(calc(-50% + ${fanXPercent}%), calc(-50% + ${fanY}px)) rotate(${fanRotation}deg)`,
                  zIndex: isActive ? 1102 : fanZ,
                } as CSSProperties
              }
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
