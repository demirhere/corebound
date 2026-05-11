import { type CSSProperties } from 'react'
import { CardShell, type CardView } from './BoardCard'
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

function ignoreCardInteraction() {}

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
        const tiredCard = { ...card, faceUp: false }

        return (
          <div
            key={card.id}
            className="tired-crew-deck-card"
            style={
              {
                '--tired-card-x': `${cappedIndex * 2}px`,
                '--tired-card-y': `${cappedIndex * -2}px`,
                '--tired-card-rotation': `${(cappedIndex % 3) - 1}deg`,
                zIndex: index + 1,
              } as CSSProperties
            }
          >
            <CardShell
              card={tiredCard}
              className={`tired-crew-card-shell ${isTopCard ? 'is-top-card' : ''}`}
              style={{ top: 0 } as CSSProperties}
              ariaLabel={`${card.title}. Tired crew card in the face-down tired deck.`}
              motionCardId={card.id}
              canInteract={false}
              backContent={
                isTopCard ? (
                  <>
                    <span className="deck-badge" aria-hidden="true">
                      {cardCount}
                    </span>
                    <span className="deck-title-lockup">
                      <DeckIcon kind={card.icon} className="deck-mark-icon" />
                      <span className="deck-title">Tired</span>
                    </span>
                  </>
                ) : (
                  <span className="tired-crew-deck-blank-back" aria-hidden="true" />
                )
              }
              onPointerDown={ignoreCardInteraction}
              onKeyDown={ignoreCardInteraction}
            />
          </div>
        )
      })}
    </aside>
  )
}
