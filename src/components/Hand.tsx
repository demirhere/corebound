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
  handRef: Ref<HTMLElement>
  onCardPointerDown: HandPointerDownHandler
  onCardKeyDown: HandKeyDownHandler
}

export function Hand({
  crewCardIds,
  tiredCardIds,
  cards,
  activeCardIds,
  insertPreview,
  handRef,
  onCardPointerDown,
  onCardKeyDown,
}: HandProps) {
  const activeCardIdSet = new Set(activeCardIds)

  return (
    <section ref={handRef} className="hand" data-hand aria-label="Crew and tired hands">
      <HandZoneArea
        zone="crew"
        label="Crew"
        cardIds={crewCardIds}
        cards={cards}
        activeCardIds={activeCardIdSet}
        insertPreview={insertPreview}
        onCardPointerDown={onCardPointerDown}
        onCardKeyDown={onCardKeyDown}
      />
      <HandZoneArea
        zone="tired"
        label="Tired"
        subtitle="Gate, Water Tank, or reward"
        cardIds={tiredCardIds}
        cards={cards}
        activeCardIds={activeCardIdSet}
        insertPreview={insertPreview}
        onCardPointerDown={onCardPointerDown}
        onCardKeyDown={onCardKeyDown}
      />
    </section>
  )
}
