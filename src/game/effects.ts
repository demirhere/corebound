import { HORIZON_DECK_ID } from './decks'
import type { BoardEffect, Card, Deck, HorizonReward } from './types'

const HORIZON_FUEL_WAIVER_CARD_COUNT = 3

function withoutConsumedEffect(
  effects: readonly BoardEffect[],
  consumedIndex: number,
) {
  return effects.flatMap<BoardEffect>((effect, index) => {
    if (index !== consumedIndex) {
      return [{ ...effect }]
    }

    if (effect.kind !== 'horizon_fuel_waiver') {
      return [{ ...effect }]
    }

    const remainingCards = effect.remainingCards - 1

    return remainingCards > 0 ? [{ ...effect, remainingCards }] : []
  })
}

export function createBoardEffectsForHorizonRewards(rewards: readonly HorizonReward[]) {
  return rewards.flatMap<BoardEffect>((reward) => {
    if (reward.kind === 'next_star_free') {
      return [{ kind: 'horizon_fuel_waiver', remainingCards: HORIZON_FUEL_WAIVER_CARD_COUNT }]
    }

    if (reward.kind === 'scout') {
      return [{
        kind: 'deck_draw_modifier',
        deckId: HORIZON_DECK_ID,
        drawCount: reward.count + 1,
        discardCount: 1,
      }]
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

export function consumeDeckDrawModifiers(deckId: string, effects: readonly BoardEffect[]) {
  return effects.flatMap<BoardEffect>((effect) => {
    if (effect.kind === 'deck_draw_modifier' && effect.deckId === deckId) {
      return []
    }

    return [{ ...effect }]
  })
}

export function applyPendingEffectsToDrawnCard(
  deckId: string,
  card: Card,
  effects: readonly BoardEffect[],
): { card: Card; pendingEffects: BoardEffect[] } {
  if (deckId !== HORIZON_DECK_ID || card.kind !== 'horizon' || !card.horizon) {
    return { card, pendingEffects: effects.map((effect) => ({ ...effect })) }
  }

  const fuelWaiverIndex = effects.findIndex(
    (effect) => effect.kind === 'horizon_fuel_waiver' && effect.remainingCards > 0,
  )

  if (fuelWaiverIndex === -1) {
    return { card, pendingEffects: effects.map((effect) => ({ ...effect })) }
  }

  return {
    card: {
      ...card,
      horizon: {
        ...card.horizon,
        need: {
          ...card.horizon.need,
          fuel: 0,
        },
      },
    },
    pendingEffects: withoutConsumedEffect(effects, fuelWaiverIndex),
  }
}
