import { type CSSProperties, useState } from 'react'
import type { Stack } from '../game/types'
import type { StackAction } from '../game/stackActions'
import { GameIcon } from './GameIcon'
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
  getFuelSurcharge: (card: CardView) => number
  getMissionAnyIconSurcharge: (card: CardView) => number
  stressCount: number
  gateExtraCrewCount: number
  gateCrewSlotDiscount: number
  gateIconDiscount: number
  gateFuelDiscount: number
  waterPairFuelAmount: number
  traveledStopCardIds: ReadonlySet<string>
  acquiredShipPartCardIds: ReadonlySet<string>
  actions: readonly StackAction[]
  onStackAction: (stackId: string, actionId: string) => void
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
}

function renderStackActionContent(action: StackAction) {
  if (action.resourceBonus) {
    return (
      <>
        <span>{action.label}</span>
        <span className="stack-action-resource-group">
          <span className="stack-action-resource-plus">+</span>
          <span className="stack-action-resource-count">{action.resourceBonus.count}</span>
          <GameIcon kind={action.resourceBonus.resource} />
        </span>
      </>
    )
  }

  if (!action.resourceRewards?.length) {
    return action.label
  }

  return (
    <>
      <span>{action.actionVerb ?? 'Recover'}</span>
      {action.resourceRewards.map((reward, index) => (
        <span key={reward.resource} className="stack-action-resource-group">
          {index > 0 ? <span className="stack-action-resource-plus">+</span> : null}
          <span className="stack-action-resource-count">{reward.count}</span>
          <GameIcon kind={reward.resource} />
        </span>
      ))}
    </>
  )
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
  getFuelSurcharge,
  getMissionAnyIconSurcharge,
  stressCount,
  gateExtraCrewCount,
  gateCrewSlotDiscount,
  gateIconDiscount,
  gateFuelDiscount,
  waterPairFuelAmount,
  traveledStopCardIds,
  acquiredShipPartCardIds,
  actions,
  onStackAction,
  onCardPointerDown,
  onCardKeyDown,
}: CardStackProps) {
  const firstCard = cards[stack.cardIds[0]]
  const isSharedActive = sharedPosition !== null
  const displayX = sharedPosition?.x ?? stack.x
  const displayY = sharedPosition?.y ?? stack.y
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const totalCardCount = stack.cardIds.length
  const showHoverCount =
    !isActive &&
    !isSharedActive &&
    hoveredIndex !== null &&
    totalCardCount > 1
  const movingCardCount = hoveredIndex !== null ? totalCardCount - hoveredIndex : 0

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
          zIndex: isActive || isSharedActive ? 'var(--drag-z-index)' : stack.z,
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
              key={action.attentionKey}
              type="button"
              className="stack-action-button"
              aria-label={action.label}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onStackAction(stack.id, action.id)}
            >
              {renderStackActionContent(action)}
            </button>
          ))}
        </div>
      )}
      {showHoverCount && (
        <div
          className="stack-hover-count"
          aria-label={`${movingCardCount} of ${totalCardCount} cards would move`}
        >
          {movingCardCount}/{totalCardCount}
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
            fuelSurcharge={getFuelSurcharge(card)}
            missionAnyIconSurcharge={getMissionAnyIconSurcharge(card)}
            stressCount={stressCount}
            gateExtraCrewCount={gateExtraCrewCount}
            gateCrewSlotDiscount={gateCrewSlotDiscount}
            gateIconDiscount={gateIconDiscount}
            gateFuelDiscount={gateFuelDiscount}
            waterPairFuelAmount={waterPairFuelAmount}
            isTraveledStop={traveledStopCardIds.has(card.id)}
            isAcquiredShipPart={acquiredShipPartCardIds.has(card.id)}
            onPointerDown={onCardPointerDown}
            onKeyDown={onCardKeyDown}
            onPointerEnter={() => setHoveredIndex(index)}
            onPointerLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
          />
        )
      })}
    </div>
  )
}
