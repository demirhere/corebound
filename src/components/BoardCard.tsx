import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { getHazardDisplayTitle } from '../game/hazards'
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
  canInteract: boolean
  stackOffsetRatio: number
  fuelDiscount: number
  fuelSurcharge: number
  stressCount: number
  gateExtraCrewCount: number
  gateCrewSlotDiscount: number
  gateIconDiscount: number
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
  fuelSurcharge?: number
  stressCount?: number
  gateExtraCrewCount?: number
  gateCrewSlotDiscount?: number
  gateIconDiscount?: number
  isTraveledStop?: boolean
  ariaLabel: string
  motionCardId?: string
  dataHandCardId?: string
  canInteract?: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
}

export function CardShell({
  card,
  className = '',
  style,
  isActive = false,
  fuelDiscount = 0,
  fuelSurcharge = 0,
  stressCount = 0,
  gateExtraCrewCount = 0,
  gateCrewSlotDiscount = 0,
  gateIconDiscount = 0,
  isTraveledStop = false,
  ariaLabel,
  motionCardId,
  dataHandCardId,
  canInteract = true,
  onPointerDown,
  onKeyDown,
}: CardShellProps) {
  const isCrewCard = card.kind === 'crew'
  const usesIntegratedHeader = isCrewCard || card.kind === 'drift' || card.kind === 'hazard'
  const sampledIcons = pickCardIcons(`${card.id}:${card.title}`)
  const noteLines = pickCardNote(`${card.id}:${card.title}`)
  const gameplayContent = renderGameplayCardContent(
    card,
    fuelDiscount,
    fuelSurcharge,
    stressCount,
    gateExtraCrewCount,
    gateCrewSlotDiscount,
    gateIconDiscount,
  )
  const resourceClass = card.kind === 'resource' && card.resource ? `card-resource-${card.resource}` : ''
  const horizonDetails = card.kind === 'horizon' ? card.horizon : undefined
  const horizonFindClass = horizonDetails
    ? horizonDetails.find.kind === 'ship_part' ? 'card-find-ship-part' : 'card-find-visit-reward'
    : ''
  const horizonBadge = horizonDetails?.find.kind === 'ship_part' ? 'Ship Part' : 'Resources'
  const headerTitle = horizonDetails ? horizonDetails.find.itemName : getHazardDisplayTitle(card)
  const horizonHeaderDetail = horizonDetails ? renderSectorCardHeaderDetail(card) : null
  const isGateCard = card.kind === 'gate'
  const gateBackTitle = isGateCard ? `${card.title} Final Gate` : null

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
      tabIndex={canInteract ? 0 : -1}
      aria-label={ariaLabel}
      aria-disabled={!canInteract}
      onPointerDown={(event) => {
        if (canInteract) {
          onPointerDown(event)
        }
      }}
      onKeyDown={(event) => {
        if (canInteract) {
          onKeyDown(event)
        }
      }}
    >
      <div className="card-inner">
        <article className="card-face card-front">
          {!usesIntegratedHeader && (
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
          <div className={`card-art ${gameplayContent ? 'card-art-gameplay' : ''} ${isCrewCard ? 'crew-card-art' : ''} ${card.kind === 'drift' ? 'drift-card-art' : ''}`} aria-hidden="true">
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
          {isGateCard ? (
            <span className="deck-title-lockup sector-gate-back-lockup">
              <DeckIcon kind={card.icon} className="deck-mark-icon" />
              <span className="deck-title">{gateBackTitle}</span>
            </span>
          ) : (
            <DeckIcon kind={card.icon} className="back-mark" />
          )}
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
  canInteract,
  stackOffsetRatio,
  fuelDiscount,
  fuelSurcharge,
  stressCount,
  gateExtraCrewCount,
  gateCrewSlotDiscount,
  gateIconDiscount,
  isTraveledStop = false,
  onPointerDown,
  onKeyDown,
}: BoardCardProps) {
  const cardLabel = card.kind === 'horizon' && card.horizon
    ? `${card.horizon.find.itemName} at ${card.title}`
    : card.kind === 'gate' && !card.faceUp
      ? `${card.title} Final Gate`
      : getHazardDisplayTitle(card)
  const ariaLabel = isTraveledStop
    ? `${cardLabel}. Traveled destination in the route area. Drag to organize traveled destinations.`
    : card.kind === 'gate' && !card.faceUp
      ? `${cardLabel}. Click to reveal, or drag to move this part of the stack.`
      : card.kind === 'gate'
        ? `${cardLabel}. Sector Gate. Drag to move this part of the stack.`
      : `${cardLabel}. Drag to move this part of the stack.`

  return (
    <CardShell
      card={card}
      isActive={isStackActive}
      canInteract={canInteract}
      fuelDiscount={fuelDiscount}
      fuelSurcharge={fuelSurcharge}
      stressCount={stressCount}
      gateExtraCrewCount={gateExtraCrewCount}
      gateCrewSlotDiscount={gateCrewSlotDiscount}
      gateIconDiscount={gateIconDiscount}
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
