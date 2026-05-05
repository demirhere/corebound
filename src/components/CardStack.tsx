import { type CSSProperties } from 'react'
import type { Stack } from '../game/types'
import type { StackAction } from '../game/stackActions'
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
  canInteractWithCard: (cardId: string) => boolean
  sharedPosition: { x: number; y: number } | null
  stackOffsetRatio: number
  fuelDiscount: number
  stressCount: number
  gateCrewSlotDiscount: number
  gateIconDiscount: number
  traveledStopCardIds: ReadonlySet<string>
  actions: readonly StackAction[]
  onStackAction: (stackId: string, actionId: string) => void
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
}

export function CardStack({
  stack,
  cards,
  isDropTarget,
  isActive,
  canInteractWithCard,
  sharedPosition,
  stackOffsetRatio,
  fuelDiscount,
  stressCount,
  gateCrewSlotDiscount,
  gateIconDiscount,
  traveledStopCardIds,
  actions,
  onStackAction,
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
      {actions.length > 0 && (
        <div className="stack-action-bar" aria-label="Available stack actions">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="stack-action-button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onStackAction(stack.id, action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
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
            canInteract={canInteractWithCard(card.id)}
            stackOffsetRatio={stackOffsetRatio}
            fuelDiscount={fuelDiscount}
            stressCount={stressCount}
            gateCrewSlotDiscount={gateCrewSlotDiscount}
            gateIconDiscount={gateIconDiscount}
            isTraveledStop={traveledStopCardIds.has(card.id)}
            onPointerDown={onCardPointerDown}
            onKeyDown={onCardKeyDown}
          />
        )
      })}
    </div>
  )
}
