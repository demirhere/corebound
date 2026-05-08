import {
  type Ref,
} from 'react'
import type { HandCrewSortKind } from '../board/handState'
import { StressTracker } from './BoardPanels'
import { type CardView } from './BoardCard'
import {
  HandZoneArea,
  type HandInsertPreview,
  type HandKeyDownHandler,
  type HandPointerDownHandler,
} from './HandZoneArea'

export type { HandCrewSortKind } from '../board/handState'
export type {
  HandInsertPreview,
  HandKeyDownHandler,
  HandPointerDownHandler,
} from './HandZoneArea'

type HandProps = {
  crewCardIds: string[]
  cards: Record<string, CardView>
  activeCardIds: readonly string[]
  insertPreview: HandInsertPreview | null
  currentSector: number
  totalSectors: number
  missionsCompleted: number
  turnNumber: number
  fuel: number
  scraps: number
  waterPairFuelAmount: number
  endTurnAttentionKey: number
  handRef: Ref<HTMLElement>
  canInteract: boolean
  canEndTurn: boolean
  endTurnLabel: string
  endTurnSublabel: string | null
  onEndTurn: () => void
  onShowCrewGuide: () => void
  onSortCrew: (sortKind: HandCrewSortKind) => void
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
}

export function Hand({
  crewCardIds,
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
  endTurnAttentionKey,
  handRef,
  canInteract,
  canEndTurn,
  endTurnLabel,
  endTurnSublabel,
  onEndTurn,
  onShowCrewGuide,
  onSortCrew,
  onCardPointerDown,
  onCardKeyDown,
}: HandProps) {
  const activeCardIdSet = new Set(activeCardIds)
  const sortableCrewCount = crewCardIds.filter((cardId) => cards[cardId]?.kind === 'crew').length
  const canSortCrew = canInteract && activeCardIdSet.size === 0 && sortableCrewCount > 1
  let attentionClass = ''

  if (endTurnAttentionKey > 0) {
    attentionClass = endTurnAttentionKey % 2 === 0
      ? ' is-draw-attention-even'
      : ' is-draw-attention-odd'
  }

  const showEndTurnButton = endTurnLabel !== 'End turn'

  return (
    <section
      ref={handRef}
      className={`hand${activeCardIdSet.size > 0 ? ' is-dragging-card' : ''}`}
      data-hand
      aria-label="Player hand and turn controls"
    >
      <StressTracker
        currentSector={currentSector}
        totalSectors={totalSectors}
        missionsCompleted={missionsCompleted}
        turnNumber={turnNumber}
        fuel={fuel}
        scraps={scraps}
      />
      <HandZoneArea
        zone="crew"
        label=""
        cardIds={crewCardIds}
        cards={cards}
        activeCardIds={activeCardIdSet}
        insertPreview={insertPreview}
        canInteract={canInteract}
        waterPairFuelAmount={waterPairFuelAmount}
        headerControls={(
          <div className="hand-sort-controls" aria-label="Sort crew hand">
            <button
              type="button"
              className="hand-sort-button"
              disabled={!canSortCrew}
              aria-label="Sort crew by role"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onSortCrew('role')}
            >
              Sort Role
            </button>
            <button
              type="button"
              className="hand-sort-button"
              disabled={!canSortCrew}
              aria-label="Sort crew by specialty"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onSortCrew('specialty')}
            >
              Sort Specialty
            </button>
          </div>
        )}
        onCardPointerDown={onCardPointerDown}
        onCardKeyDown={onCardKeyDown}
      />
      <div className="hand-end-turn-slot" aria-label="Turn controls">
        {showEndTurnButton && (
          <button
            type="button"
            className={`hand-end-turn-button${attentionClass}`}
            disabled={!canEndTurn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onEndTurn}
          >
            <span className="hand-end-turn-copy">
              <span>{endTurnLabel}</span>
              {endTurnSublabel ? <span className="hand-end-turn-sublabel">{endTurnSublabel}</span> : null}
            </span>
          </button>
        )}
        <button
          type="button"
          className="hand-crew-guide-button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onShowCrewGuide}
        >
          <span className="hand-crew-guide-copy">Crew guide</span>
        </button>
      </div>
    </section>
  )
}
