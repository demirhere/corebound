import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import { getNextStarFuelDiscount } from '../game/effects'
import type { BoardState, GameLossReason } from '../game/types'
import { CardStack } from './CardStack'
import {
  CardShell,
  type CardKeyDownHandler,
  type CardPointerDownHandler,
} from './BoardCard'
import {
  DeckCard,
  type DeckKeyDownHandler,
  type DeckPointerDownHandler,
} from './DeckCard'
import {
  Hand,
  type HandInsertPreview,
  type HandKeyDownHandler,
  type HandPointerDownHandler,
} from './Hand'

type BoardView = Pick<
  BoardState,
  | 'cards'
  | 'stacks'
  | 'decks'
  | 'handCardIds'
  | 'tiredCardIds'
  | 'pendingWakeChoice'
  | 'pendingScoutChoice'
  | 'pendingEffects'
  | 'currentSector'
  | 'totalSectors'
  | 'dropTargetStackId'
  | 'dropTargetDeckId'
  | 'hasArrived'
  | 'lossReason'
>

type BoardProps = {
  board: BoardView
  boardRef: Ref<HTMLDivElement>
  handRef: Ref<HTMLElement>
  activeStackIds: readonly string[]
  activeDeckIds: readonly string[]
  activeHandCardIds: readonly string[]
  handInsertPreview: HandInsertPreview | null
  stackOffsetRatio: number
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDeckPointerDown: DeckPointerDownHandler
  onDeckKeyDown: DeckKeyDownHandler
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
  onHandCardPointerDown: HandPointerDownHandler
  onHandCardKeyDown: HandKeyDownHandler
  onWakeCrewChoice: (cardId: string) => void
  onScoutCardChoice: (cardId: string) => void
  onScoutChoiceConfirm: () => void
  onResetGame: () => void
}

function lossContent(reason: GameLossReason) {
  if (reason === 'sector-stranded') {
    return {
      title: 'Stranded in the Reach.',
      body: 'No visible Sector can be completed, and Emergency Refuel is not available.',
    }
  }

  return {
    title: 'The Gate cannot be passed.',
    body: 'The sector Gate cannot be completed with the remaining Ready crew and unused MOTHER cards.',
  }
}

export function Board({
  board,
  boardRef,
  handRef,
  activeStackIds,
  activeDeckIds,
  activeHandCardIds,
  handInsertPreview,
  stackOffsetRatio,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDeckPointerDown,
  onDeckKeyDown,
  onCardPointerDown,
  onCardKeyDown,
  onHandCardPointerDown,
  onHandCardKeyDown,
  onWakeCrewChoice,
  onScoutCardChoice,
  onScoutChoiceConfirm,
  onResetGame,
}: BoardProps) {
  const loss = board.lossReason ? lossContent(board.lossReason) : null
  const fuelDiscount = getNextStarFuelDiscount(board.pendingEffects)
  const scoutChoice = board.pendingScoutChoice
  const wakeChoiceCards = board.pendingWakeChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]

    return card?.kind === 'crew' ? [card] : []
  }) ?? []
  const scoutChoiceCards = scoutChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]

    return card?.kind === 'horizon' ? [card] : []
  }) ?? []
  const scoutChoiceComplete = Boolean(
    scoutChoice && scoutChoice.choiceCardIds.length - scoutChoice.bottomedCardIds.length === 1,
  )
  const scoutInstruction = !scoutChoice
    ? ''
    : scoutChoiceComplete
      ? 'Confirm to keep the unselected card on top and send selected cards to the back.'
      : scoutChoice.choiceCardIds.length === 1
        ? 'Only 1 card remains. Confirm to leave it on top of the Sector deck.'
        : 'Select the cards you do not like to send to the back. Leave 1 card unselected for the top.'

  function scoutCardChoiceClass(cardId: string) {
    if (!scoutChoice) {
      return ''
    }

    return scoutChoice.bottomedCardIds.includes(cardId) ? 'is-scout-selected' : ''
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

  return (
    <section
      ref={boardRef}
      className="board"
      aria-label="Galaxy card board"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <aside className="board-notes" aria-label="Quick play instructions">
        <h2>Instructions</h2>
        <p>Sector {board.currentSector} of {board.totalSectors}</p>
        <ol>
          <li>Draw 3 sector cards, choose 1</li>
          <li>Always send 1+ crew on the trip</li>
          <li>Finish it and discard the others</li>
          <li>Emergency Refuel only if none are reachable</li>
          <li>MOTHER cannot pay Fuel normally</li>
          <li>Pass the Gate after 3 Stars</li>
          <li>Clear Sector {board.totalSectors} to win</li>
        </ol>
      </aside>

      {board.decks
        .filter((deck) => deck.cards.length > 0)
        .map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            isActive={activeDeckIds.includes(deck.id)}
            isDropTarget={board.dropTargetDeckId === deck.id}
            onPointerDown={onDeckPointerDown}
            onKeyDown={onDeckKeyDown}
          />
        ))}

      {board.stacks.map((stack) => (
        <CardStack
          key={stack.id}
          stack={stack}
          cards={board.cards}
          isDropTarget={board.dropTargetStackId === stack.id}
          isActive={activeStackIds.includes(stack.id)}
          stackOffsetRatio={stackOffsetRatio}
          fuelDiscount={fuelDiscount}
          onCardPointerDown={onCardPointerDown}
          onCardKeyDown={onCardKeyDown}
        />
      ))}

      <Hand
        handRef={handRef}
        crewCardIds={board.handCardIds}
        tiredCardIds={board.tiredCardIds}
        cards={board.cards}
        activeCardIds={activeHandCardIds}
        insertPreview={handInsertPreview}
        onCardPointerDown={onHandCardPointerDown}
        onCardKeyDown={onHandCardKeyDown}
      />

      {board.hasArrived && (
        <section className="arrival-panel" role="status" aria-live="polite">
          <p className="arrival-kicker">Gate cleared</p>
          <h2>You arrived beyond the Dark Threshold.</h2>
          <p>Two-sector prototype complete. Restart to reshuffle both sectors and run it again.</p>
          <button type="button" onClick={onResetGame}>
            Restart and reshuffle
          </button>
        </section>
      )}

      {loss && (
        <section
          className="arrival-panel loss-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loss-title"
        >
          <p className="arrival-kicker">Ship failed</p>
          <h2 id="loss-title">{loss.title}</h2>
          <p>{loss.body}</p>
          <button type="button" onClick={onResetGame}>
            Restart and reshuffle
          </button>
        </section>
      )}

      {board.pendingWakeChoice && wakeChoiceCards.length > 0 && (
        <section
          className="arrival-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wake-choice-title"
        >
          <h2 id="wake-choice-title">Choose Cryo Crew</h2>
          <p>That crew joins Tired and readies after the next Gate.</p>
          <div className="wake-choice-cards">
            {wakeChoiceCards.map((card) => (
              <CardShell
                key={card.id}
                card={card}
                className="wake-choice-card"
                motionCardId={card.id}
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
      )}

      {!board.pendingWakeChoice && scoutChoice && scoutChoiceCards.length > 0 && (
        <section
          className="arrival-panel scout-choice-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scout-choice-title"
        >
          <p className="arrival-kicker">Scout</p>
          <h2 id="scout-choice-title">Set the Sector deck</h2>
          <p>{scoutInstruction}</p>
          <div className="scout-choice-cards">
            {scoutChoiceCards.map((card, index) => {
              const choiceClass = scoutCardChoiceClass(card.id)
              const isSelected = scoutChoice.bottomedCardIds.includes(card.id)

              return (
                <div
                  key={card.id}
                  className="scout-choice-item"
                  style={getScoutFanStyle(index, scoutChoiceCards.length)}
                >
                  <CardShell
                    card={card}
                    className={`wake-choice-card scout-choice-card ${choiceClass}`}
                    motionCardId={card.id}
                    ariaLabel={`${card.title}. ${isSelected ? 'Selected to send to the back.' : 'Unselected, currently eligible to stay on top.'}`}
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
            <button type="button" onClick={onScoutChoiceConfirm} disabled={!scoutChoiceComplete}>
              Use Scout
            </button>
          </div>
        </section>
      )}
    </section>
  )
}
