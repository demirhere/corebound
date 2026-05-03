import {
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
  onScoutChoiceReset: () => void
  onScoutChoiceConfirm: () => void
  onResetGame: () => void
}

function lossContent(reason: GameLossReason) {
  if (reason === 'sector-stranded') {
    return {
      title: 'Stranded in the Reach.',
      body: 'No drawn Sector can be completed with your available Fuel, Ready crew, and unused MOTHER cards.',
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
  onScoutChoiceReset,
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
    scoutChoice?.keptCardId &&
    scoutChoice.bottomedCardIds.length === scoutChoice.choiceCardIds.length - 1,
  )
  const scoutInstruction = !scoutChoice
    ? ''
    : !scoutChoice.keptCardId
      ? 'Choose 1 card to place on top of the Sector deck.'
      : scoutChoiceComplete
        ? 'Confirm to place the chosen card on top and bottom the rest in the selected order.'
        : `Choose bottom card ${scoutChoice.bottomedCardIds.length + 1} of ${scoutChoice.choiceCardIds.length - 1}.`

  function scoutCardChoiceLabel(cardId: string) {
    if (!scoutChoice) {
      return ''
    }

    if (scoutChoice.keptCardId === cardId) {
      return 'Top'
    }

    const bottomIndex = scoutChoice.bottomedCardIds.indexOf(cardId)

    if (bottomIndex >= 0) {
      return `Bottom ${bottomIndex + 1}`
    }

    return scoutChoice.keptCardId ? `Pick bottom ${scoutChoice.bottomedCardIds.length + 1}` : 'Pick top'
  }

  function scoutCardChoiceClass(cardId: string) {
    if (!scoutChoice) {
      return ''
    }

    if (scoutChoice.keptCardId === cardId) {
      return 'is-scout-kept'
    }

    return scoutChoice.bottomedCardIds.includes(cardId) ? 'is-scout-bottomed' : ''
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
        <ol>
          <li>Draw 3 sector cards, choose 1</li>
          <li>Always send 1+ crew on the trip</li>
          <li>Finish it and discard the others</li>
          <li>Don't run out of fuel</li>
          <li>Use MOTHER wisely</li>
          <li>Plan for the Gate</li>
          <li>After all Sectors, attempt the Gate</li>
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
          <h2>You arrived beyond the Narrow Crossing.</h2>
          <p>Prototype sector complete. Restart to reshuffle the sector and run it again.</p>
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
          <p>That crew joins your crew area Tired.</p>
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
            {scoutChoiceCards.map((card) => {
              const choiceClass = scoutCardChoiceClass(card.id)
              const choiceLabel = scoutCardChoiceLabel(card.id)

              return (
                <div key={card.id} className="scout-choice-item">
                  <CardShell
                    card={card}
                    className={`wake-choice-card scout-choice-card ${choiceClass}`}
                    motionCardId={card.id}
                    ariaLabel={`${card.title}. ${choiceLabel}.`}
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
                  <span className="scout-choice-badge">{choiceLabel}</span>
                </div>
              )
            })}
          </div>
          <div className="scout-choice-actions">
            <button type="button" onClick={onScoutChoiceReset} disabled={!scoutChoice.keptCardId}>
              Reset order
            </button>
            <button type="button" onClick={onScoutChoiceConfirm} disabled={!scoutChoiceComplete}>
              Use Scout
            </button>
          </div>
        </section>
      )}
    </section>
  )
}
