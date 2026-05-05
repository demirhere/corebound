import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { HandZone } from '../game/types'
import { CardShell, type CardView } from './BoardCard'

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
  stressCount?: number
  canInteract: boolean
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
  subtitle?: string
}

function getHandCards(cardIds: readonly string[], cards: Record<string, CardView>) {
  return cardIds.flatMap((cardId) => {
    const card = cards[cardId]

    return card ? [card] : []
  })
}

function getFanStyle(slotIndex: number, totalSlots: number, isActive = false) {
  const fanOffset = slotIndex - (totalSlots - 1) / 2
  const fanSpacing = totalSlots > 6 ? 60 : totalSlots > 4 ? 80 : 105
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

function StressTracker({ stressCount }: { stressCount: number }) {
  return (
    <aside className="stress-area hand-zone-stress" aria-label="Stress area">
      <p className="stress-tracker" aria-live="polite">
        <span className="stress-label">Stress</span>
        <span className="stress-history">
          {Array.from({ length: stressCount + 1 }, (_, i) => (
            <span key={i} className={i < stressCount ? 'stress-old' : 'stress-current'}>
              {i}
            </span>
          ))}
        </span>
      </p>
    </aside>
  )
}

export function HandZoneArea({
  zone,
  label,
  cardIds,
  cards,
  activeCardIds,
  insertPreview,
  stressCount,
  canInteract,
  onCardPointerDown,
  onCardKeyDown,
  subtitle,
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
    <div className={`hand-zone hand-zone-${zone}`} data-hand-zone={zone} aria-label={`${label} hand`}>
      {zone === 'tired' && stressCount !== undefined ? <StressTracker stressCount={stressCount} /> : null}
      <span className="hand-zone-label">{label}</span>
      {subtitle && <span className="hand-zone-subtitle">{subtitle}</span>}
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
                  ariaLabel={
                    zone === 'crew'
                      ? `${card.title}. Click to drop to the board or drag within Crew and to the board.`
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
