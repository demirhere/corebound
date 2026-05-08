import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import type { HandZone } from '../game/types'
import { CardShell, type CardView } from './BoardCard'
import { StressTracker } from './BoardPanels'

export type HandPointerDownHandler = (
  event: ReactPointerEvent<HTMLDivElement>,
  cardId: string,
  zone: HandZone,
) => void

export type HandKeyDownHandler = (
  event: ReactKeyboardEvent<HTMLDivElement>,
  cardId: string,
  zone: HandZone,
) => void

export type HandInsertPreview = {
  zone: HandZone
  index: number
  cardCount: number
  activeCardId: string | null
}

type HandZoneAreaProps = {
  zone: HandZone
  label: string
  cardIds: string[]
  cards: Record<string, CardView>
  activeCardIds: ReadonlySet<string>
  insertPreview: HandInsertPreview | null
  currentSector?: number
  totalSectors?: number
  missionsCompleted?: number
  turnNumber?: number
  fuel?: number
  scraps?: number
  waterPairFuelAmount: number
  canInteract: boolean
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
  subtitle?: string
  headerControls?: ReactNode
}

function getHandCards(cardIds: readonly string[], cards: Record<string, CardView>) {
  return cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    return card ? [card] : []
  })
}

function getFanStyle(slotIndex: number, totalSlots: number, isActive = false) {
  const fanOffset = slotIndex - (totalSlots - 1) / 2
  const fanSpacing = totalSlots > 6 ? 90 : totalSlots > 4 ? 115 : 140
  const fanXPercent = fanOffset * fanSpacing
  const fanY = Math.abs(fanOffset) * 2
  const fanRotation = fanOffset * 2.25
  const fanZ = 100 + Math.round((totalSlots - Math.abs(fanOffset)) * 10) + slotIndex

  return {
    transform: `translate(calc(-50% + ${fanXPercent}%), calc(-50% + ${fanY}px)) rotate(${fanRotation}deg)`,
    zIndex: isActive ? 1102 : fanZ,
  } as CSSProperties
}

function getCardSlotIndex(
  handCards: CardView[],
  index: number,
  cardId: string,
  previewIndex: number | null,
  previewCardCount: number,
  previewActiveCardId: string | null,
) {
  if (previewIndex === null) {
    return index
  }

  if (cardId === previewActiveCardId) {
    return index
  }

  const baseIndex = handCards
    .slice(0, index)
    .filter((card) => card.id !== previewActiveCardId)
    .length

  return baseIndex + (baseIndex >= previewIndex ? previewCardCount : 0)
}

export function HandZoneArea({
  zone,
  label,
  cardIds,
  cards,
  activeCardIds,
  insertPreview,
  currentSector,
  totalSectors,
  missionsCompleted,
  turnNumber,
  fuel,
  scraps,
  waterPairFuelAmount,
  canInteract,
  onCardPointerDown,
  onCardKeyDown,
  subtitle,
  headerControls,
}: HandZoneAreaProps) {
  const handCards = getHandCards(cardIds, cards)
  const cardCount = handCards.length
  const zonePreview = insertPreview?.zone === zone ? insertPreview : null
  const previewActiveCardId = zonePreview?.activeCardId ?? null
  const previewCardCount = zonePreview?.cardCount ?? 0
  const activePreviewCard = previewActiveCardId
    ? handCards.some((card) => card.id === previewActiveCardId)
    : false
  const previewBaseCardCount = activePreviewCard ? cardCount - 1 : cardCount
  const previewIndex = zonePreview
    ? Math.min(Math.max(zonePreview.index, 0), previewBaseCardCount)
    : null
  const totalSlots = zonePreview
    ? previewBaseCardCount + previewCardCount
    : cardCount

  return (
    <div className={`hand-zone hand-zone-${zone}`} data-hand-zone={zone} aria-label={`${label} area`}>
      {zone === 'tired' &&
      currentSector !== undefined &&
      totalSectors !== undefined &&
      missionsCompleted !== undefined &&
      turnNumber !== undefined &&
      fuel !== undefined &&
      scraps !== undefined ? (
        <StressTracker
          currentSector={currentSector}
          totalSectors={totalSectors}
          missionsCompleted={missionsCompleted}
          turnNumber={turnNumber}
          fuel={fuel}
          scraps={scraps}
        />
      ) : null}
      <span className="hand-zone-label">{label}</span>
      {subtitle && <span className="hand-zone-subtitle">{subtitle}</span>}
      {headerControls}
      <div className="hand-strip">
        {previewIndex !== null &&
          Array.from({ length: previewCardCount }, (_, index) => (
            <div
              key={`${zone}-hand-insert-${index}`}
              className="hand-insert-slot"
              style={getFanStyle(previewIndex + index, totalSlots)}
              aria-hidden="true"
            />
          ))}
        {handCards.map((card, index) => {
          const isActive = activeCardIds.has(card.id)

          return (
            <div
              key={card.id}
              className={`hand-card-slot ${isActive ? 'is-being-dragged' : ''}`}
              style={getFanStyle(
                getCardSlotIndex(
                  handCards,
                  index,
                  card.id,
                  previewIndex,
                  previewCardCount,
                  previewActiveCardId,
                ),
                totalSlots,
                isActive,
              )}
            >
              <div
                className="hand-card-drag"
                data-hand-card-id={card.id}
                data-motion-card-id={card.id}
              >
                <CardShell
                  card={card}
                  className="hand-card-shell"
                  isActive={isActive}
                  canInteract={canInteract && zone === 'crew'}
                  waterPairFuelAmount={waterPairFuelAmount}
                  ariaLabel={
                    zone === 'crew'
                      ? `${card.title}. Click to add to an existing crew stack or drop to the board. Drag to the board.`
                      : `${card.title}. Tired crew readies after a Gate or a Sector ready reward.`
                  }
                  onPointerDown={(event) => onCardPointerDown(event, card.id, zone)}
                  onKeyDown={(event) => onCardKeyDown(event, card.id, zone)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
