import { type CSSProperties } from 'react'
import { type CardView } from './BoardCard'
import { DeckIcon } from './DeckIcon'

type TiredCrewDeckProps = {
  cardIds: string[]
  cards: Record<string, CardView>
}

function getTiredCards(cardIds: readonly string[], cards: Record<string, CardView>) {
  return cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    return card ? [card] : []
  })
}

export function TiredCrewDeck({ cardIds, cards }: TiredCrewDeckProps) {
  const tiredCards = getTiredCards(cardIds, cards)
  const cardCount = tiredCards.length

  if (cardCount === 0) {
    return null
  }

  return (
    <aside
      className="tired-crew-deck"
      aria-label={`${cardCount} tired crew in a face-down deck`}
    >
      {tiredCards.map((card, index) => {
        const cappedIndex = Math.min(index, 7)
        const isTopCard = index === cardCount - 1

        return (
          <div
            key={card.id}
            className="tired-crew-deck-card"
            data-motion-card-id={card.id}
            style={
              {
                '--tired-card-x': `${cappedIndex * 2}px`,
                '--tired-card-y': `${cappedIndex * -2}px`,
                '--tired-card-rotation': `${(cappedIndex % 3) - 1}deg`,
                zIndex: index + 1,
              } as CSSProperties
            }
          >
            <div
              className={`deck-card tired-crew-deck-cover is-automatic-reward ${isTopCard ? 'is-top-card' : ''}`}
              aria-hidden={!isTopCard}
            >
              {isTopCard && (
                <>
                  <span className="deck-badge" aria-hidden="true">
                    {cardCount}
                  </span>
                  <span className="deck-title-lockup">
                    <DeckIcon kind={card.icon} className="deck-mark-icon" />
                    <span className="deck-title">Tired</span>
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
