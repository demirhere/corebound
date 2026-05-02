import {
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import type { BoardState } from '../game/types'
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
  'cards' | 'stacks' | 'decks' | 'handCardIds' | 'dropTargetStackId' | 'dropTargetDeckId'
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
}: BoardProps) {
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
          <li>Stack matching resources</li>
          <li>Collect rewards</li>
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
        cardIds={board.handCardIds}
        cards={board.cards}
        activeCardIds={activeHandCardIds}
        insertPreview={handInsertPreview}
        onCardPointerDown={onHandCardPointerDown}
        onCardKeyDown={onHandCardKeyDown}
      />
    </section>
  )
}
