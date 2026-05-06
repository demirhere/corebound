import {
  type Ref,
} from 'react'
import { type CardView } from './BoardCard'
import {
  HandZoneArea,
  type HandInsertPreview,
  type HandKeyDownHandler,
  type HandPointerDownHandler,
} from './HandZoneArea'

export type {
  HandInsertPreview,
  HandKeyDownHandler,
  HandPointerDownHandler,
} from './HandZoneArea'

type HandProps = {
  crewCardIds: string[]
  tiredCardIds: string[]
  cards: Record<string, CardView>
  activeCardIds: readonly string[]
  insertPreview: HandInsertPreview | null
  stressCount: number
  currentSector: number
  totalSectors: number
  missionsCompleted: number
  turnNumber: number
  endTurnAttentionKey: number
  handRef: Ref<HTMLElement>
  canInteract: boolean
  canEndTurn: boolean
  endTurnLabel: string
  endTurnSublabel: string | null
  onEndTurn: () => void
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
}

export function Hand({
  crewCardIds,
  tiredCardIds,
  cards,
  activeCardIds,
  insertPreview,
  stressCount,
  currentSector,
  totalSectors,
  missionsCompleted,
  turnNumber,
  endTurnAttentionKey,
  handRef,
  canInteract,
  canEndTurn,
  endTurnLabel,
  endTurnSublabel,
  onEndTurn,
  onCardPointerDown,
  onCardKeyDown,
}: HandProps) {
  const activeCardIdSet = new Set(activeCardIds)
  let attentionClass = ''

  if (endTurnAttentionKey > 0) {
    attentionClass = endTurnAttentionKey % 2 === 0
      ? ' is-draw-attention-even'
      : ' is-draw-attention-odd'
  }

  return (
    <section
      ref={handRef}
      className={`hand${activeCardIdSet.size > 0 ? ' is-dragging-card' : ''}`}
      data-hand
      aria-label="Player hand and tired crew"
    >
      <HandZoneArea
        zone="crew"
        label="Hand"
        cardIds={crewCardIds}
        cards={cards}
        activeCardIds={activeCardIdSet}
        insertPreview={insertPreview}
        canInteract={canInteract}
        onCardPointerDown={onCardPointerDown}
        onCardKeyDown={onCardKeyDown}
      />
      <HandZoneArea
        zone="tired"
        label="Tired"
        subtitle="Gate, Medbay Rehydrator, or reward"
        cardIds={tiredCardIds}
        cards={cards}
        activeCardIds={activeCardIdSet}
        insertPreview={insertPreview}
        stressCount={stressCount}
        currentSector={currentSector}
        totalSectors={totalSectors}
        missionsCompleted={missionsCompleted}
        turnNumber={turnNumber}
        canInteract={canInteract}
        onCardPointerDown={onCardPointerDown}
        onCardKeyDown={onCardKeyDown}
      />
      <div className="hand-end-turn-slot" aria-label="Turn controls">
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
      </div>
    </section>
  )
}
