import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Card } from '../game/types'
import { DeckIcon } from './DeckIcon'
import { GameIcon } from './GameIcon'
import { renderGameplayCardContent, renderSectorCardHeaderDetail } from './GameplayCardContent'
import { pickCardIcons, pickCardNote } from './gameIcons'

export type CardView = Card

export type CardPointerDownHandler = (
  event: ReactPointerEvent<HTMLDivElement>,
  stackId: string,
  cardId: string,
  cardIndex: number,
) => void

export type CardKeyDownHandler = (
  event: ReactKeyboardEvent<HTMLDivElement>,
  stackId: string,
  cardId: string,
) => void

type BoardCardProps = {
  card: CardView
  stackId: string
  cardIndex: number
  isStackActive: boolean
  stackOffsetRatio: number
  fuelDiscount: number
  stressCount: number
  isTraveledStop?: boolean
  onPointerDown: CardPointerDownHandler
  onKeyDown: CardKeyDownHandler
}

type CardShellProps = {
  card: CardView
  className?: string
  style?: CSSProperties
  isActive?: boolean
  fuelDiscount?: number
  stressCount?: number
  isTraveledStop?: boolean
  ariaLabel: string
  motionCardId?: string
  dataHandCardId?: string
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
}

export function CardShell({
  card,
  className = '',
  style,
  isActive = false,
  fuelDiscount = 0,
  stressCount = 0,
  isTraveledStop = false,
  ariaLabel,
  motionCardId,
  dataHandCardId,
  onPointerDown,
  onKeyDown,
}: CardShellProps) {
  const isCrewCard = card.kind === 'crew'
  const sampledIcons = pickCardIcons(`${card.id}:${card.title}`)
  const noteLines = pickCardNote(`${card.id}:${card.title}`)
  const gameplayContent = renderGameplayCardContent(card, fuelDiscount, stressCount)
  const resourceClass = card.kind === 'resource' && card.resource ? `card-resource-${card.resource}` : ''
  const horizonDetails = card.kind === 'horizon' ? card.horizon : undefined
  const horizonFindClass = horizonDetails
    ? horizonDetails.find.kind === 'ship_part' ? 'card-find-ship-part' : 'card-find-visit-reward'
    : ''
  const horizonBadge = horizonDetails?.find.kind === 'ship_part' ? 'Ship Part' : 'Resources'
  const headerTitle = horizonDetails ? horizonDetails.find.itemName : card.title
  const horizonHeaderDetail = horizonDetails ? renderSectorCardHeaderDetail(card) : null

  return (
    <div
      className={`card-shell ${card.faceUp ? 'is-face-up' : 'is-face-down'} ${
        isActive ? 'is-being-dragged' : ''
      } card-kind-${card.kind} ${resourceClass} ${horizonFindClass} ${card.spentMother ? 'is-spent-mother' : ''} ${isTraveledStop ? 'is-traveled-stop' : ''} ${className}`}
      data-hand-card-id={dataHandCardId}
      data-motion-card-id={motionCardId}
      style={
        {
          '--card-hue': String(card.hue),
          '--card-accent': card.accent,
          ...style,
        } as CSSProperties
      }
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <div className="card-inner">
        <article className="card-face card-front">
          {!isCrewCard && (
            <header className="card-header">
              {horizonDetails ? (
                <>
                  <span className="card-destination-title">{horizonBadge}</span>
                  <span className="card-title">{horizonDetails.find.itemName}</span>
                  {horizonHeaderDetail && (
                    <span className="card-rule-text sector-card-header-detail">{horizonHeaderDetail}</span>
                  )}
                </>
              ) : (
                <span className="card-title">{headerTitle}</span>
              )}
            </header>
          )}
          <div className={`card-art ${gameplayContent ? 'card-art-gameplay' : ''} ${isCrewCard ? 'crew-card-art' : ''}`} aria-hidden="true">
            {gameplayContent ?? (
              <>
                <div className="card-icon-row">
                  {sampledIcons.map((icon) => (
                    <GameIcon key={icon} kind={icon} />
                  ))}
                </div>
                <p className="card-note">
                  {noteLines.map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                  ))}
                </p>
              </>
            )}
          </div>
        </article>

        <article className="card-face card-back" aria-hidden="true">
          <DeckIcon kind={card.icon} className="back-mark" />
        </article>
      </div>
    </div>
  )
}

export function BoardCard({
  card,
  stackId,
  cardIndex,
  isStackActive,
  stackOffsetRatio,
  fuelDiscount,
  stressCount,
  isTraveledStop = false,
  onPointerDown,
  onKeyDown,
}: BoardCardProps) {
  const cardLabel = card.kind === 'horizon' && card.horizon
    ? `${card.horizon.find.itemName} at ${card.title}`
    : card.title
  const ariaLabel = isTraveledStop
    ? `${cardLabel}. Traveled destination in the route area. Drag to organize traveled destinations.`
    : `${cardLabel}. Drag to move this part of the stack.`

  return (
    <CardShell
      card={card}
      isActive={isStackActive}
      fuelDiscount={fuelDiscount}
      stressCount={stressCount}
      isTraveledStop={isTraveledStop}
      motionCardId={card.id}
      style={
        {
          top: `${cardIndex * stackOffsetRatio * 100}%`,
          zIndex: cardIndex + 1,
        } as CSSProperties
      }
      ariaLabel={ariaLabel}
      onPointerDown={(event) => onPointerDown(event, stackId, card.id, cardIndex)}
      onKeyDown={(event) => onKeyDown(event, stackId, card.id)}
    />
  )
}
