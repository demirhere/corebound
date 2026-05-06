import type { Deck, DeckDrawRules } from './types'

export const HORIZON_DECK_ID = 'sector-deck'
export const MOTHER_DECK_ID = 'mother-deck'
export const FUEL_DECK_ID = 'fuel-deck'
export const CRYO_DECK_ID = 'cryo-deck'
export const DISCOVERY_DECK_ID = 'discovery-deck'
export const DRIFT_DECK_ID = 'drift-deck'

export const manualDeckDraw = {
  canManuallyDraw: true,
  count: 1,
  placement: 'nearby',
} satisfies DeckDrawRules

export const automaticRewardDeckDraw = {
  canManuallyDraw: false,
  count: 1,
  placement: 'nearby',
} satisfies DeckDrawRules

export function canManuallyDrawDeck(deck: Pick<Deck, 'draw'>) {
  return deck.draw.canManuallyDraw
}
