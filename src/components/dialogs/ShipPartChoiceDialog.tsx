import { getShipPartLabel } from '../../game/shipParts'
import { CardShell } from '../BoardCard'
import type { BoardView } from './types'

function getShipPartChoiceCards(board: BoardView) {
  return board.pendingShipPartChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]
    const find = card?.kind === 'mission' ? card.mission?.find : null

    return card?.kind === 'mission' && find?.kind === 'ship_part' ? [card] : []
  }) ?? []
}

export function ShipPartChoiceDialog({ board, isGameOver, canInteract, onShipPartChoice }: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onShipPartChoice: (cardId: string) => void
}) {
  const shipPartChoiceCards = getShipPartChoiceCards(board)

  if (
    isGameOver ||
    board.pendingWakeChoice ||
    board.pendingScoutChoice ||
    !board.pendingShipPartChoice ||
    shipPartChoiceCards.length === 0
  ) {
    return null
  }

  const instruction = shipPartChoiceCards.length === 1
    ? 'Only 1 Ship Part remains. Choose it for no additional cost.'
    : 'Choose 1 Ship Part. The other option goes to the bottom of Ship Parts.'

  return (
    <div className="dialog-overlay">
      <section
        className="arrival-panel ship-part-choice-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ship-part-choice-title"
      >
        <p className="arrival-kicker">Research</p>
        <h2 id="ship-part-choice-title">Draft Ship Part</h2>
        <p>{instruction}</p>
        <div className="wake-choice-cards">
          {shipPartChoiceCards.map((card) => {
            const find = card.mission?.find
            const shipPart = find?.kind === 'ship_part' ? find.shipPart : null
            const shipPartLabel = shipPart ? getShipPartLabel(shipPart) : card.title

            return (
              <CardShell
                key={card.id}
                card={card}
                className="wake-choice-card ship-part-choice-card"
                motionCardId={card.id}
                canInteract={canInteract}
                isAcquiredShipPart
                ariaLabel={`Choose ${shipPartLabel}`}
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onShipPartChoice(card.id)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return
                  }

                  event.preventDefault()
                  event.stopPropagation()
                  onShipPartChoice(card.id)
                }}
              />
            )
          })}
        </div>
      </section>
    </div>
  )
}
