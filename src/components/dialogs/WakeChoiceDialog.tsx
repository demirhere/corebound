import { getWaterPairFuelAmount } from '../../game/shipParts'
import { CardShell } from '../BoardCard'
import type { BoardView } from './types'

function getWakeChoiceCards(board: BoardView) {
  return board.pendingWakeChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]

    return card?.kind === 'crew' ? [card] : []
  }) ?? []
}

export function WakeChoiceDialog({ board, isGameOver, canInteract, onWakeCrewChoice }: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onWakeCrewChoice: (cardId: string) => void
}) {
  const wakeChoiceCards = getWakeChoiceCards(board)
  const waterPairFuelAmount = getWaterPairFuelAmount(board.shipPartSlots)
  const remainingText = board.pendingWakeChoice?.remaining === 1
    ? '1 crew'
    : `${board.pendingWakeChoice?.remaining ?? 0} crew, one at a time`

  if (isGameOver || !board.pendingWakeChoice || wakeChoiceCards.length === 0) {
    return null
  }

  return (
    <div className="dialog-overlay">
      <section
        className="arrival-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wake-choice-title"
      >
        <h2 id="wake-choice-title">Choose Cryo Crew</h2>
        <p>Choose {remainingText}. Each joins Tired, then readies 1 crew that was already Tired.</p>
        <div className="wake-choice-cards">
          {wakeChoiceCards.map((card) => (
            <CardShell
              key={card.id}
              card={card}
              className="wake-choice-card"
              motionCardId={card.id}
              canInteract={canInteract}
              waterPairFuelAmount={waterPairFuelAmount}
              ariaLabel={`Choose ${card.title}`}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onWakeCrewChoice(card.id)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                  return
                }

                event.preventDefault()
                event.stopPropagation()
                onWakeCrewChoice(card.id)
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
