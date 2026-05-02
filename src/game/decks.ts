const automaticRewardDeckIds = new Set(['fuel-deck', 'cryo-deck'])

export function canManuallyDrawDeck(deckId: string) {
  return !automaticRewardDeckIds.has(deckId)
}
