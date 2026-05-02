import {
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
  return (
    <section ref={handRef} className="hand" data-hand aria-label="Player hand">
      <div className="hand-label" aria-hidden="true">
        Hand
      </div>
      <div className="hand-strip">
        {cardIds.length === 0 ? (
          <p className="hand-empty">Drag board cards here</p>
        ) : (
          cardIds.map((cardId) => {
            const card = cards[cardId]

            if (!card) {
              return null
            }

            return (
              <CardShell
                key={card.id}
                card={card}
                className="hand-card-shell"
                isActive={activeCardIds.includes(card.id)}
                dataHandCardId={card.id}
                ariaLabel={`${card.title}. Click to drop to the board or drag out of your hand.`}
                onPointerDown={(event) => onCardPointerDown(event, card.id)}
                onKeyDown={(event) => onCardKeyDown(event, card.id)}
              />
            )
          })
        )}
      </div>
    </section>
  )
}
