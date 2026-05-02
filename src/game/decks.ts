const automaticRewardDeckIds = new Set(['fuel-deck', 'hull-deck'])

export function canManuallyDrawDeck(deckId: string) {
  return !automaticRewardDeckIds.has(deckId)
}
