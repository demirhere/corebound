import {
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import { CardStack, type StackView } from './CardStack'
import {
  type CardKeyDownHandler,
  type CardPointerDownHandler,
  type CardView,
} from './BoardCard'
import {
  DeckCard,
  type DeckCardView,
  type DeckKeyDownHandler,
  type DeckPointerDownHandler,
} from './DeckCard'

type BoardView = {
  cards: Record<string, CardView>
  stacks: StackView[]
  decks: DeckCardView[]
  dropTargetStackId: string | null
  dropTargetDeckId: string | null
}

type BoardProps = {
  board: BoardView
  boardRef: Ref<HTMLDivElement>
  activeStackIds: readonly string[]
  activeDeckIds: readonly string[]
  stackOffsetRatio: number
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDeckPointerDown: DeckPointerDownHandler
  onDeckKeyDown: DeckKeyDownHandler
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
}

export function Board({
  board,
  boardRef,
  activeStackIds,
  activeDeckIds,
  stackOffsetRatio,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDeckPointerDown,
  onDeckKeyDown,
  onCardPointerDown,
  onCardKeyDown,
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
    </section>
  )
}
