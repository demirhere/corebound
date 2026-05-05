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
  endTurnAttentionKey: number
  handRef: Ref<HTMLElement>
  canInteract: boolean
  canEndTurn: boolean
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
  endTurnAttentionKey,
  handRef,
  canInteract,
  canEndTurn,
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
    <section ref={handRef} className="hand" data-hand aria-label="Crew and tired hands">
      <HandZoneArea
        zone="crew"
        label="Crew"
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
          End turn
        </button>
      </div>
    </section>
  )
}
