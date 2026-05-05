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
  canInteract: boolean
  sharedPosition: { x: number; y: number } | null
  stackOffsetRatio: number
  fuelDiscount: number
  stressCount: number
  traveledStopCardIds: ReadonlySet<string>
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
}

export function CardStack({
  stack,
  cards,
  isDropTarget,
  isActive,
  canInteract,
  sharedPosition,
  stackOffsetRatio,
  fuelDiscount,
  stressCount,
  traveledStopCardIds,
  onCardPointerDown,
  onCardKeyDown,
}: CardStackProps) {
  const firstCard = cards[stack.cardIds[0]]
  const isSharedActive = sharedPosition !== null
  const displayX = sharedPosition?.x ?? stack.x
  const displayY = sharedPosition?.y ?? stack.y

  return (
    <div
      className={`card-stack ${isDropTarget ? 'is-drop-target' : ''} ${
        isActive || isSharedActive ? 'is-active-stack' : ''
      }`}
      data-stack-id={stack.id}
      style={
        {
          left: `${displayX}%`,
          top: `${displayY}%`,
          zIndex: isActive || isSharedActive ? 1101 : stack.z,
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
            isStackActive={isActive || isSharedActive}
            canInteract={canInteract}
            stackOffsetRatio={stackOffsetRatio}
            fuelDiscount={fuelDiscount}
            stressCount={stressCount}
            isTraveledStop={traveledStopCardIds.has(card.id)}
            onPointerDown={onCardPointerDown}
            onKeyDown={onCardKeyDown}
          />
        )
      })}
    </div>
  )
}
