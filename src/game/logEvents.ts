import type { Card, CardBlueprint, Deck, HorizonReward, Stack } from './types'
import type { PlaytestLogEvent } from './playtestLog'

function roundPosition(value: number) {
  return Math.round(value * 10) / 10
}

function describeRewards(rewards: readonly HorizonReward[]) {
  return rewards
    .map((reward) => {
      if (reward.kind === 'resource') {
        return `${reward.resource} +${reward.count}`
      }
      if (reward.kind === 'crew') {
        return `${reward.label} ${reward.count}`
      }
      if (reward.kind === 'scout') {
        return `Scout ${reward.count}`
      }
      if (reward.kind === 'next_star_free') {
        return 'Next round costs 0 Fuel'
      }
      if (reward.kind === 'ready') {
        return `Ready ${reward.count} Tired crew`
      }
      return ''
    })
    .join(', ')
}

export function cardRulesText(card: Card | CardBlueprint) {
  if (card.kind === 'crew') {
    return `specialties: ${card.specializations?.join(', ') ?? 'none'}`
  }

  if (card.kind === 'horizon' && card.horizon) {
    const need = [
      `fuel ${card.horizon.need.fuel}`,
      card.horizon.need.icons.length > 0 ? card.horizon.need.icons.join(', ') : null,
    ]
      .filter(Boolean)
      .join('; ')
    const rewards = describeRewards(card.horizon.rewards) || 'none'

    return `needs: ${need}; rewards: ${rewards}`
  }

  if (card.kind === 'mother') {
    return 'wild: covers 1 non-Fuel Horizon icon; stays in play after use'
  }

  if (card.kind === 'gate' && card.gate) {
    const need = [
      ...card.gate.need.icons,
      card.gate.need.any > 0 ? `any ${card.gate.need.any}` : null,
    ]
      .filter(Boolean)
      .join(', ')

    return `gate need: ${need}; ${card.gate.motherPenalty.threshold}+ MOTHER cards: need +${card.gate.motherPenalty.extraCrew} crew`
  }

  return ''
}

function describeCard(card: Card | undefined, fallbackId: string) {
  if (!card) {
    return fallbackId
  }

  const rulesText = cardRulesText(card)

  return `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`
}

function describeCards(cardIds: readonly string[], cards: Record<string, Card>) {
  return cardIds.map((cardId) => describeCard(cards[cardId], cardId)).join(', ')
}

function cardTitles(cardIds: readonly string[], cards: Record<string, Card>) {
  return cardIds.map((cardId) => cards[cardId]?.title ?? cardId)
}

function cardSummaries(cardIds: readonly string[], cards: Record<string, Card>) {
  return cardIds.map((cardId) => describeCard(cards[cardId], cardId))
}

export function cardContent(card: Card | CardBlueprint) {
  return JSON.stringify(card)
}

function cardContents(cardIds: readonly string[], cards: Record<string, Card>) {
  return cardIds.map((cardId) => (cards[cardId] ? cardContent(cards[cardId]) : cardId))
}

export function cardFlippedEvent(card: Card, stackId: string): PlaytestLogEvent {
  return {
    type: 'card.flipped',
    message: `${describeCard(card, card.id)} flipped ${card.faceUp ? 'face up' : 'face down'} in ${stackId}.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: describeCard(card, card.id),
      cardContent: cardContent(card),
      stackId,
      faceUp: card.faceUp,
    },
  }
}

export function cardDrawnEvent(card: Card, deck: Deck, stackId: string, x: number, y: number): PlaytestLogEvent {
  return {
    type: 'card.drawn',
    message: `${describeCard(card, card.id)} drawn from ${deck.title} into ${stackId}.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: describeCard(card, card.id),
      cardContent: cardContent(card),
      deckId: deck.id,
      deckTitle: deck.title,
      stackId,
      x: roundPosition(x),
      y: roundPosition(y),
    },
  }
}

export function stackSplitEvent(
  sourceStackId: string,
  movingStackId: string,
  cardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'stack.split',
    message: `${describeCards(cardIds, cards)} split from ${sourceStackId} into ${movingStackId}.`,
    details: {
      sourceStackId,
      movingStackId,
      cardIds,
      cardTitles: cardTitles(cardIds, cards),
      cardSummaries: cardSummaries(cardIds, cards),
      cardContents: cardContents(cardIds, cards),
    },
  }
}

export function cardsMovedToHandEvent(
  stack: Stack,
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'cards.moved_to_hand',
    message: `${describeCards(stack.cardIds, cards)} moved from ${stack.id} to hand.`,
    details: {
      sourceStackId: stack.id,
      cardIds: stack.cardIds,
      cardTitles: cardTitles(stack.cardIds, cards),
      cardSummaries: cardSummaries(stack.cardIds, cards),
      cardContents: cardContents(stack.cardIds, cards),
    },
  }
}

export function handCardDroppedEvent(card: Card, stackId: string, x: number, y: number): PlaytestLogEvent {
  return {
    type: 'card.moved_from_hand',
    message: `${describeCard(card, card.id)} moved from hand to ${stackId}.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: describeCard(card, card.id),
      cardContent: cardContent(card),
      stackId,
      x: roundPosition(x),
      y: roundPosition(y),
    },
  }
}

export function cardsDiscardedEvent(
  cardIds: readonly string[],
  cards: Record<string, Card>,
  source: string,
): PlaytestLogEvent {
  return {
    type: 'cards.discarded',
    message: `${describeCards(cardIds, cards)} discarded from ${source}.`,
    details: {
      source,
      cardIds,
      cardTitles: cardTitles(cardIds, cards),
      cardSummaries: cardSummaries(cardIds, cards),
      cardContents: cardContents(cardIds, cards),
    },
  }
}

export function cardsStackedEvent(
  sourceStack: Stack,
  targetStack: Stack,
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'cards.stacked',
    message: `${describeCards(sourceStack.cardIds, cards)} stacked with ${describeCards(targetStack.cardIds, cards)} in ${targetStack.id}.`,
    details: {
      sourceStackId: sourceStack.id,
      targetStackId: targetStack.id,
      sourceCardIds: sourceStack.cardIds,
      sourceCardTitles: cardTitles(sourceStack.cardIds, cards),
      sourceCardSummaries: cardSummaries(sourceStack.cardIds, cards),
      sourceCardContents: cardContents(sourceStack.cardIds, cards),
      targetCardIds: targetStack.cardIds,
      targetCardTitles: cardTitles(targetStack.cardIds, cards),
      targetCardSummaries: cardSummaries(targetStack.cardIds, cards),
      targetCardContents: cardContents(targetStack.cardIds, cards),
    },
  }
}

export function cardsReturnedToDeckEvent(
  sourceStack: Stack,
  targetDeck: Deck,
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'cards.moved_to_deck',
    message: `${describeCards(sourceStack.cardIds, cards)} moved from ${sourceStack.id} onto ${targetDeck.title}.`,
    details: {
      sourceStackId: sourceStack.id,
      targetDeckId: targetDeck.id,
      targetDeckTitle: targetDeck.title,
      cardIds: sourceStack.cardIds,
      cardTitles: cardTitles(sourceStack.cardIds, cards),
      cardSummaries: cardSummaries(sourceStack.cardIds, cards),
      cardContents: cardContents(sourceStack.cardIds, cards),
    },
  }
}

export function deckCreatedFromStacksEvent(
  deck: Deck,
  sourceStack: Stack,
  targetStack: Stack,
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const cardIds = [...sourceStack.cardIds, ...targetStack.cardIds]

  return {
    type: 'deck.created',
    message: `${deck.title} created by combining ${describeCards(sourceStack.cardIds, cards)} with ${describeCards(targetStack.cardIds, cards)}.`,
    details: {
      deckId: deck.id,
      deckTitle: deck.title,
      sourceStackId: sourceStack.id,
      targetStackId: targetStack.id,
      cardIds,
      cardTitles: cardTitles(cardIds, cards),
      cardSummaries: cardSummaries(cardIds, cards),
      cardContents: cardContents(cardIds, cards),
    },
  }
}

export function decksMergedEvent(sourceDeck: Deck, targetDeck: Deck): PlaytestLogEvent {
  return {
    type: 'decks.merged',
    message: `${sourceDeck.title} stacked onto ${targetDeck.title}.`,
    details: {
      sourceDeckId: sourceDeck.id,
      sourceDeckTitle: sourceDeck.title,
      sourceCardCount: sourceDeck.cards.length,
      sourceCardSummaries: sourceDeck.cards.map((card) => `${card.title}${cardRulesText(card) ? ` [${cardRulesText(card)}]` : ''}`),
      sourceCardContents: sourceDeck.cards.map(cardContent),
      targetDeckId: targetDeck.id,
      targetDeckTitle: targetDeck.title,
      targetCardCount: targetDeck.cards.length,
      targetCardSummaries: targetDeck.cards.map((card) => `${card.title}${cardRulesText(card) ? ` [${cardRulesText(card)}]` : ''}`),
      targetCardContents: targetDeck.cards.map(cardContent),
    },
  }
}

export function horizonCompletedEvent(
  horizonCard: Card,
  sourceStack: Stack,
  rewardCards: readonly Card[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'horizon.completed',
    message: `${describeCard(horizonCard, horizonCard.id)} completed from ${sourceStack.id}; rewards: ${describeRewards(horizonCard.horizon?.rewards ?? []) || 'none'}.`,
    details: {
      horizonCardId: horizonCard.id,
      horizonTitle: horizonCard.title,
      sourceStackId: sourceStack.id,
      spentCardIds: sourceStack.cardIds,
      spentCardTitles: cardTitles(sourceStack.cardIds, cards),
      spentCardSummaries: cardSummaries(sourceStack.cardIds, cards),
      spentCardContents: cardContents(sourceStack.cardIds, cards),
      rewardCardIds: rewardCards.map((card) => card.id),
      rewardCardTitles: rewardCards.map((card) => card.title),
      rewardCardSummaries: rewardCards.map((card) => describeCard(card, card.id)),
      rewardCardContents: rewardCards.map(cardContent),
    },
  }
}

export function gateCompletedEvent(
  gateCard: Card,
  sourceStack: Stack,
  cards: Record<string, Card>,
  motherCardsInPlay: number,
  extraCrewRequired: number,
): PlaytestLogEvent {
  return {
    type: 'gate.completed',
    message: `${describeCard(gateCard, gateCard.id)} completed from ${sourceStack.id}; ship arrived beyond the Gate.`,
    details: {
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      sourceStackId: sourceStack.id,
      committedCardIds: sourceStack.cardIds,
      committedCardTitles: cardTitles(sourceStack.cardIds, cards),
      committedCardSummaries: cardSummaries(sourceStack.cardIds, cards),
      committedCardContents: cardContents(sourceStack.cardIds, cards),
      motherCardsInPlay,
      extraCrewRequired,
    },
  }
}
