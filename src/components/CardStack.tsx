import { type CSSProperties } from 'react'
import type { Stack } from '../game/types'
import {
  BoardCard,
  type CardKeyDownHandler,
  type CardPointerDownHandler,
  type CardView,
} from './BoardCard'

export type StackView = Stack

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
  const firstCard = cards[stack.cardIds[0]]

  return (
    <div
      className={`card-stack ${isDropTarget ? 'is-drop-target' : ''} ${
        isActive ? 'is-active-stack' : ''
      }`}
      data-stack-id={stack.id}
      style={
        {
          left: `${stack.x}%`,
          top: `${stack.y}%`,
          zIndex: isActive ? 1101 : stack.z,
          '--stack-accent': firstCard?.accent ?? '#73ffd6',
          '--stack-height': `${
            100 + Math.max(0, stack.cardIds.length - 1) * stackOffsetRatio * 100
          }%`,
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
