import type { Deck, DeckDrawRules } from './types'

export const MISSION_DECK_ID = 'sector-deck'
export const MOTHER_DECK_ID = 'mother-deck'
export const FUEL_DECK_ID = 'fuel-deck'
export const FUEL_DISCARD_DECK_ID = 'fuel-discard'
export const SCRAP_DECK_ID = 'scrap-deck'
export const SCRAP_DISCARD_DECK_ID = 'scrap-discard'
export const CRYO_DECK_ID = 'cryo-deck'
export const DISCOVERY_DECK_ID = 'discovery-deck'
export const SHIP_PART_DECK_ID = 'ship-part-deck'
export const CREW_QUARTERS_DECK_ID = 'crew-quarters-deck'
export const DRIFT_DECK_ID = 'drift-deck'
export const GATE_DECK_ID = 'gate-deck'
export const DAMAGE_DECK_ID = 'damage-deck'

export const manualDeckDraw = {
  canManuallyDraw: true,
  count: 1,
  placement: 'nearby',
} satisfies DeckDrawRules

export const missionDeckDraw = {
  canManuallyDraw: true,
  count: 1,
  placement: 'right-row',
} satisfies DeckDrawRules

export const automaticRewardDeckDraw = {
  canManuallyDraw: false,
  count: 1,
  placement: 'nearby',
} satisfies DeckDrawRules

export function canManuallyDrawDeck(deck: Pick<Deck, 'draw'>) {
  return deck.draw.canManuallyDraw
}
