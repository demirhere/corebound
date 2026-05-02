import {
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import type { BoardState, GameLossReason } from '../game/types'
import { CardStack } from './CardStack'
import {
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
  onResetGame: () => void
}

function lossContent(reason: GameLossReason) {
  if (reason === 'horizon-stranded') {
    return {
      title: 'Stranded in the Reach.',
      body: 'No drawn Horizon can be completed with your available Fuel, Ready crew, and unused MOTHER cards.',
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
  onResetGame,
}: BoardProps) {
  const loss = board.lossReason ? lossContent(board.lossReason) : null

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
          <li>Draw 3 horizon cards, choose 1</li>
          <li>Finish it and discard the others</li>
          <li>Don't run out of fuel</li>
          <li>Use MOTHER wisely</li>
          <li>Plan for the Gate</li>
          <li>After all Horizons, attempt the Gate</li>
        </ol>
      </aside>

      <aside className="discard-zone" data-discard-zone aria-label="Discard area">
        <span className="discard-label">Discard</span>
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
    </section>
  )
}
