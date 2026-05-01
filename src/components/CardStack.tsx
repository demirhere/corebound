import { type CSSProperties } from 'react'
import {
  BoardCard,
  type CardKeyDownHandler,
  type CardPointerDownHandler,
  type CardView,
} from './BoardCard'

export type StackView = {
  id: string
  cardIds: string[]
  x: number
  y: number
  z: number
}

type CardStackProps = {
  stack: StackView
  cards: Record<string, CardView>
  isDropTarget: boolean
  isActive: boolean
  stackOffsetRatio: number
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
}

export function CardStack({
  stack,
  cards,
  isDropTarget,
  isActive,
  stackOffsetRatio,
  onCardPointerDown,
  onCardKeyDown,
}: CardStackProps) {
  return (
    <div
      className={`card-stack ${isDropTarget ? 'is-drop-target' : ''} ${
        isActive ? 'is-active-stack' : ''
      }`}
      style={
        {
          left: `${stack.x}%`,
          top: `${stack.y}%`,
          zIndex: stack.z,
        } as CSSProperties
      }
    >
      {stack.cardIds.map((cardId, index) => {
        const card = cards[cardId]

        if (!card) {
          return null
        }

        return (
          <BoardCard
            key={card.id}
            card={card}
            stackId={stack.id}
            cardIndex={index}
            isStackActive={isActive}
            stackOffsetRatio={stackOffsetRatio}
            onPointerDown={onCardPointerDown}
            onKeyDown={onCardKeyDown}
          />
        )
      })}
    </div>
  )
}
