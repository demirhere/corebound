import type { BoardEffect, Card, Deck, HorizonReward } from './types'

export function createBoardEffectsForHorizonRewards(rewards: readonly HorizonReward[]) {
  return rewards.flatMap<BoardEffect>((reward) => {
    if (reward.kind === 'next_stop_fuel_discount') {
      return [{ kind: 'next_stop_fuel_discount', amount: reward.amount }]
    }

    return []
  })
}

export function getPendingDrawCount(deck: Pick<Deck, 'id' | 'draw'>, effects: readonly BoardEffect[]) {
  const baseDrawCount = Math.max(1, Math.floor(deck.draw.count))
  const modifiedDrawCounts = effects.flatMap((effect) =>
    effect.kind === 'deck_draw_modifier' && effect.deckId === deck.id ? [effect.drawCount] : [],
  )

  return Math.max(baseDrawCount, ...modifiedDrawCounts)
}

export function getNextStopFuelDiscount(effects: readonly BoardEffect[]) {
  return effects.find((effect) => effect.kind === 'next_stop_fuel_discount')?.amount ?? 0
}

export function consumeNextStopFuelDiscount(effects: readonly BoardEffect[]) {
  let hasConsumedDiscount = false

  return effects.flatMap<BoardEffect>((effect) => {
    if (!hasConsumedDiscount && effect.kind === 'next_stop_fuel_discount') {
      hasConsumedDiscount = true
      return []
    }

    return [{ ...effect }]
  })
}

export function consumeDeckDrawModifiers(deckId: string, effects: readonly BoardEffect[]) {
  return effects.flatMap<BoardEffect>((effect) => {
    if (effect.kind === 'deck_draw_modifier' && effect.deckId === deckId) {
      return []
    }

    return [{ ...effect }]
  })
}

export function applyPendingEffectsToDrawnCard(
  _deckId: string,
  card: Card,
  effects: readonly BoardEffect[],
): { card: Card; pendingEffects: BoardEffect[] } {
  return {
    card,
    pendingEffects: effects.map((effect) => ({ ...effect })),
  }
}
