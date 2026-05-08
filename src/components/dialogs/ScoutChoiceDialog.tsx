import { type CSSProperties } from 'react'
import { CardShell } from '../BoardCard'
import type { BoardView } from './types'

function getScoutChoiceCards(board: BoardView) {
  return board.pendingScoutChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]

    return card?.kind === 'mission' ? [card] : []
  }) ?? []
}

function isScoutChoiceComplete(scoutChoice: NonNullable<BoardView['pendingScoutChoice']>) {
  return scoutChoice.keptCardId !== null || scoutChoice.choiceCardIds.length === 1
}

function getScoutInstruction(scoutChoice: NonNullable<BoardView['pendingScoutChoice']>) {
  if (scoutChoice.choiceCardIds.length === 1) {
    return 'Only 1 card is available. Confirm to leave it on top of Missions.'
  }

  if (isScoutChoiceComplete(scoutChoice)) {
    return 'Confirm to keep the selected card on top and send the others to the back.'
  }

  return 'Choose the Destination card you like. The others will be sent to the back.'
}

function getScoutFanStyle(cardIndex: number, cardCount: number) {
  const fanOffset = cardIndex - (cardCount - 1) / 2
  const fanSpacing = cardCount > 4 ? 56 : cardCount > 3 ? 68 : 82
  const fanXPercent = fanOffset * fanSpacing
  const fanY = Math.abs(fanOffset) * 8
  const fanRotation = fanOffset * 6
  const fanZ = 100 + Math.round((cardCount - Math.abs(fanOffset)) * 10) + cardIndex

  return {
    transform: `translate(calc(-50% + ${fanXPercent}%), calc(-50% + ${fanY}px)) rotate(${fanRotation}deg)`,
    zIndex: fanZ,
  } as CSSProperties
}

export function ScoutChoiceDialog({
  board,
  isGameOver,
  canInteract,
  onScoutCardChoice,
  onScoutChoiceConfirm,
}: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onScoutCardChoice: (cardId: string) => void
  onScoutChoiceConfirm: () => void
}) {
  const scoutChoice = board.pendingScoutChoice
  const scoutChoiceCards = getScoutChoiceCards(board)

  if (isGameOver || board.pendingWakeChoice || !scoutChoice || scoutChoiceCards.length === 0) {
    return null
  }

  const scoutChoiceComplete = isScoutChoiceComplete(scoutChoice)

  return (
    <div className="dialog-overlay">
      <section
        className="arrival-panel scout-choice-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scout-choice-title"
      >
        <p className="arrival-kicker">Scout</p>
        <h2 id="scout-choice-title">Set Missions</h2>
        <p>{getScoutInstruction(scoutChoice)}</p>
        <div className="scout-choice-cards">
          {scoutChoiceCards.map((card, index) => {
            const isOnlyChoice = scoutChoice.choiceCardIds.length === 1
            const isSelected = scoutChoice.keptCardId === card.id || isOnlyChoice
            const ariaSelectionLabel = isSelected
              ? 'Selected to stay on top.'
              : scoutChoice.keptCardId
                ? 'Will be sent to the back.'
                : 'Choose to keep this on top.'

            return (
              <div
                key={card.id}
                className="scout-choice-item"
                style={getScoutFanStyle(index, scoutChoiceCards.length)}
              >
                <CardShell
                  card={card}
                  className={`wake-choice-card scout-choice-card ${isSelected ? 'is-scout-selected' : ''}`}
                  motionCardId={card.id}
                  canInteract={canInteract}
                  ariaLabel={`${card.title}. ${ariaSelectionLabel}`}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onScoutCardChoice(card.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                      return
                    }

                    event.preventDefault()
                    event.stopPropagation()
                    onScoutCardChoice(card.id)
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="scout-choice-actions">
          <button
            type="button"
            onClick={onScoutChoiceConfirm}
            disabled={!scoutChoiceComplete || !canInteract}
          >
            Use Scout
          </button>
        </div>
      </section>
    </div>
  )
}
