import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { getDamageDisplayTitle } from '../game/damage'
import type { Card } from '../game/types'
import { DeckIcon } from './DeckIcon'
import { FuelMissionCard } from './FuelMissionCard'
import { GameIcon } from './GameIcon'
import { renderGameplayCardContent, renderSectorCardHeaderDetail, renderShipPartDescription } from './GameplayCardContent'
import { pickCardIcons, pickCardNote } from './gameIcons'

const GATE_BACKGROUND_GRID_SIZE = 4

function getGateBackgroundStyle(index: number): CSSProperties {
  const cellCount = GATE_BACKGROUND_GRID_SIZE * GATE_BACKGROUND_GRID_SIZE
  const safeIndex = ((index % cellCount) + cellCount) % cellCount
  const col = safeIndex % GATE_BACKGROUND_GRID_SIZE
  const row = Math.floor(safeIndex / GATE_BACKGROUND_GRID_SIZE)
  const denominator = GATE_BACKGROUND_GRID_SIZE - 1
  const xPercent = denominator <= 0 ? 0 : (col / denominator) * 100
  const yPercent = denominator <= 0 ? 0 : (row / denominator) * 100

  return {
    '--gate-background-x': `${xPercent}%`,
    '--gate-background-y': `${yPercent}%`,
    '--gate-background-size': `${GATE_BACKGROUND_GRID_SIZE * 100}%`,
  } as CSSProperties
}

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
  missionAnyIconSurcharge: number
  stressCount: number
  gateExtraCrewCount: number
  gateCrewSlotDiscount: number
  gateIconDiscount: number
  gateFuelDiscount: number
  waterPairFuelAmount: number
  isTraveledStop?: boolean
  isAcquiredShipPart?: boolean
  onPointerDown: CardPointerDownHandler
  onKeyDown: CardKeyDownHandler
  onPointerEnter?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerLeave?: (event: ReactPointerEvent<HTMLDivElement>) => void
}

type CardShellProps = {
  card: CardView
  className?: string
  style?: CSSProperties
  isActive?: boolean
  fuelDiscount?: number
  fuelSurcharge?: number
  missionAnyIconSurcharge?: number
  stressCount?: number
  gateExtraCrewCount?: number
  gateCrewSlotDiscount?: number
  gateIconDiscount?: number
  gateFuelDiscount?: number
  waterPairFuelAmount?: number
  isTraveledStop?: boolean
  isAcquiredShipPart?: boolean
  ariaLabel: string
  motionCardId?: string
  dataHandCardId?: string
  backContent?: ReactNode
  canInteract?: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
  onPointerEnter?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerLeave?: (event: ReactPointerEvent<HTMLDivElement>) => void
}

export function CardShell({
  card,
  className = '',
  style,
  isActive = false,
  fuelDiscount = 0,
  fuelSurcharge = 0,
  missionAnyIconSurcharge = 0,
  stressCount = 0,
  gateExtraCrewCount = 0,
  gateCrewSlotDiscount = 0,
  gateIconDiscount = 0,
  gateFuelDiscount = 0,
  waterPairFuelAmount = 1,
  isTraveledStop = false,
  isAcquiredShipPart = false,
  ariaLabel,
  motionCardId,
  dataHandCardId,
  backContent,
  canInteract = true,
  onPointerDown,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
}: CardShellProps) {
  const isCrewCard = card.kind === 'crew'
  const isGateCard = card.kind === 'gate'
  const isFuelMission = card.kind === 'mission' && card.mission?.pattern === 'open'
  const usesIntegratedHeader = isCrewCard || card.kind === 'drift' || card.kind === 'hazard'
  const gateBackgroundStyle = isGateCard ? getGateBackgroundStyle(card.gate?.backgroundIndex ?? 0) : undefined
  const sampledIcons = pickCardIcons(`${card.id}:${card.title}`)
  const noteLines = pickCardNote(`${card.id}:${card.title}`)
  const gameplayContent = isFuelMission
    ? null
    : renderGameplayCardContent(
        card,
        fuelDiscount,
        fuelSurcharge,
        missionAnyIconSurcharge,
        stressCount,
        gateExtraCrewCount,
        gateCrewSlotDiscount,
        gateIconDiscount,
        gateFuelDiscount,
        isAcquiredShipPart,
        waterPairFuelAmount,
      )
  const resourceClass = card.kind === 'resource' && card.resource ? `card-resource-${card.resource}` : ''
  const missionDetails = card.kind === 'mission' ? card.mission : undefined
  const isActiveShipPartCard = card.kind === 'active-ship-part'
  const isCrewQuartersCard = card.kind === 'crew-quarters'
  const activeShipPart = isActiveShipPartCard ? card.shipPart : null
  const crewQuarters = isCrewQuartersCard ? card.crewQuarters : null
  const isShipPartMission = missionDetails?.find.kind === 'ship_part'
  const missionFindClass = missionDetails
    ? isShipPartMission
      ? 'card-find-ship-part'
      : isFuelMission
        ? 'card-find-open-mission'
        : 'card-find-visit-reward'
    : isActiveShipPartCard
      ? 'card-find-ship-part'
      : isCrewQuartersCard
        ? 'card-find-crew-quarters'
        : ''
  const missionBadge = isShipPartMission
    ? 'Ship Part'
    : isActiveShipPartCard
      ? 'Ship Part'
      : isCrewQuartersCard
        ? 'Crew Quarters'
        : 'Mission'
  const missionHeaderTitle = missionDetails?.find.itemName ?? ''
  const headerTitle = missionDetails
    ? missionHeaderTitle
    : isActiveShipPartCard
      ? activeShipPart?.label ?? card.title
      : isCrewQuartersCard
        ? crewQuarters?.label ?? card.title
        : getDamageDisplayTitle(card)
  const sectorHeaderDetail = missionDetails
    ? isFuelMission ? null : renderSectorCardHeaderDetail(card)
    : isActiveShipPartCard
      ? activeShipPart ? renderShipPartDescription(activeShipPart.description) : null
      : isCrewQuartersCard
        ? crewQuarters ? renderShipPartDescription(crewQuarters.description) : null
        : null
  const showSectorHeader = Boolean(missionDetails) || isActiveShipPartCard || isCrewQuartersCard
  const showSectorBadge = showSectorHeader && !isFuelMission && !isShipPartMission && !isActiveShipPartCard && !isCrewQuartersCard
  const gateBackTitle = isGateCard ? `${card.title} Final Gate` : null
  const defaultBackContent = isGateCard ? (
    <span className="deck-title-lockup sector-gate-back-lockup">
      <DeckIcon kind={card.icon} className="deck-mark-icon" />
      <span className="deck-title">{gateBackTitle}</span>
    </span>
  ) : (
    <DeckIcon kind={card.icon} className="back-mark" />
  )

  return (
    <div
      className={`card-shell ${card.faceUp ? 'is-face-up' : 'is-face-down'} ${
        isActive ? 'is-being-dragged' : ''
      } card-kind-${card.kind} ${resourceClass} ${missionFindClass} ${card.spentMother ? 'is-spent-mother' : ''} ${isTraveledStop ? 'is-traveled-stop' : ''} ${className}`}
      data-hand-card-id={dataHandCardId}
      data-motion-card-id={motionCardId}
      style={
        {
          '--card-hue': String(card.hue),
          '--card-accent': card.accent,
          ...gateBackgroundStyle,
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
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="card-inner">
        <article className="card-face card-front">
          {isFuelMission ? (
            <FuelMissionCard />
          ) : (
            <>
              {!usesIntegratedHeader && (
                <header className="card-header">
                  {showSectorHeader ? (
                    <>
                      {showSectorBadge && (
                        <span className="card-destination-title">{missionBadge}</span>
                      )}
                      <span className="card-title" data-title={typeof headerTitle === 'string' ? headerTitle : undefined}>{headerTitle}</span>
                      {sectorHeaderDetail && (
                        <span className="card-rule-text sector-card-header-detail">{sectorHeaderDetail}</span>
                      )}
                    </>
                  ) : (
                    <span className="card-title" data-title={typeof headerTitle === 'string' ? headerTitle : undefined}>{headerTitle}</span>
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
            </>
          )}
        </article>

        <article className="card-face card-back" aria-hidden="true">
          {backContent ?? defaultBackContent}
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
  missionAnyIconSurcharge,
  stressCount,
  gateExtraCrewCount,
  gateCrewSlotDiscount,
  gateIconDiscount,
  gateFuelDiscount,
  waterPairFuelAmount,
  isTraveledStop = false,
  isAcquiredShipPart = false,
  onPointerDown,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
}: BoardCardProps) {
  const cardLabel = card.kind === 'mission' && card.mission
    ? `${card.mission.find.itemName} at ${card.title}`
    : card.kind === 'gate' && !card.faceUp
      ? `${card.title} Final Gate`
      : getDamageDisplayTitle(card)
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
      missionAnyIconSurcharge={missionAnyIconSurcharge}
      stressCount={stressCount}
      gateExtraCrewCount={gateExtraCrewCount}
      gateCrewSlotDiscount={gateCrewSlotDiscount}
      gateIconDiscount={gateIconDiscount}
      gateFuelDiscount={gateFuelDiscount}
      waterPairFuelAmount={waterPairFuelAmount}
      isTraveledStop={isTraveledStop}
      isAcquiredShipPart={isAcquiredShipPart}
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
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    />
  )
}
