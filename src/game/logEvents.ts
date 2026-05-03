import type { Card, CardBlueprint, CompletedStarSummary, Deck, GameLossReason, HorizonReward, Stack } from './types'
import type { PlaytestLogEvent } from './playtestLog'
import type { MotherCoveredIcon } from './rules'

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
        if (reward.label === 'Wake') {
          return 'Choose 1 of 2 Cryo crew'
        }

        return `${reward.label} ${reward.count}`
      }
      if (reward.kind === 'scout') {
        return `Scout ${reward.count}`
      }
      if (reward.kind === 'next_star_fuel_discount') {
        return `Next Star costs -${reward.amount} Fuel`
      }
      if (reward.kind === 'ready') {
        return reward.count === 1
          ? 'Ready 1 crew that was already Tired before this proposal'
          : `Ready ${reward.count} crew that were already Tired before this proposal`
      }
      return ''
    })
    .join(', ')
}

export function cardRulesText(card: Card | CardBlueprint) {
  if (card.kind === 'crew') {
    return `specialties: ${card.specializations?.join(', ') ?? 'none'}; fuel math: crew+crew=fuel, crew+MOTHER=fuel`
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
    return 'wild: covers 1 non-Fuel icon or pairs with Crew as Fuel; spent after use'
  }

  if (card.kind === 'gate' && card.gate) {
    const need = [
      ...card.gate.need.icons,
      card.gate.need.any > 0 ? `any ${card.gate.need.any}` : null,
    ]
      .filter(Boolean)
      .join(', ')

    return `gate need: ${need}; ${card.gate.motherPenalty.threshold}+ MOTHER cards: need +${card.gate.motherPenalty.extraAnyIcons} any icon`
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

export function motherCommittedEvent(
  motherCard: Card,
  actionCard: Card,
  coversIcon: MotherCoveredIcon | null,
): PlaytestLogEvent {
  const assignmentMessage = coversIcon === 'fuel'
    ? 'paired with Crew for Fuel'
    : coversIcon ? `covering ${coversIcon}` : 'overcommitted'
  const baseDetails = {
    cardId: motherCard.id,
    cardTitle: motherCard.title,
    actionCard: actionCard.title,
    actionCardId: actionCard.id,
  }

  return {
    type: 'mother.committed',
    message: `${describeCard(motherCard, motherCard.id)} committed to ${actionCard.title}: ${assignmentMessage}.`,
    details: coversIcon
      ? { ...baseDetails, coversIcon }
      : { ...baseDetails, overcommitted: true },
  }
}

export function motherSpentEvent(motherCard: Card, totalMotherUsedAfterSpend: number): PlaytestLogEvent {
  return {
    type: 'mother.spent',
    message: `${describeCard(motherCard, motherCard.id)} spent; total MOTHER spent is now ${totalMotherUsedAfterSpend}.`,
    details: {
      cardId: motherCard.id,
      cardTitle: motherCard.title,
      totalMotherUsedAfterSpend,
    },
  }
}

export function motherReturnedUnusedEvent(motherCard: Card, reason: string): PlaytestLogEvent {
  return {
    type: 'mother.returned_unused',
    message: `${describeCard(motherCard, motherCard.id)} returned unused: ${reason}.`,
    details: {
      cardId: motherCard.id,
      cardTitle: motherCard.title,
      reason,
    },
  }
}

export function motherThresholdCrossedEvent(
  actionCard: Card,
  gateCard: Card,
  from: number,
  to: number,
  extraAnyIconsRequired: number,
): PlaytestLogEvent {
  return {
    type: 'mother.threshold_crossed',
    message: `MOTHER threshold crossed from ${from} to ${to} during ${actionCard.title}; ${gateCard.title} extra any-icon requirement is now active.`,
    details: {
      from,
      to,
      actionCard: actionCard.title,
      actionCardId: actionCard.id,
      gateCard: gateCard.title,
      gateCardId: gateCard.id,
      extraAnyIconsRequired,
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
    type: 'sector.completed',
    message: `${describeCard(horizonCard, horizonCard.id)} completed from ${sourceStack.id}; rewards: ${describeRewards(horizonCard.horizon?.rewards ?? []) || 'none'}.`,
    details: {
      sectorCardId: horizonCard.id,
      sectorTitle: horizonCard.title,
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

export function wakeCrewRecruitedEvent(
  chosenCard: Card,
  unchosenCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'wake.recruited',
    message: `${describeCard(chosenCard, chosenCard.id)} recruited from Wake and enters Tired.`,
    details: {
      chosenCardId: chosenCard.id,
      chosenCardTitle: chosenCard.title,
      chosenCardSummary: describeCard(chosenCard, chosenCard.id),
      chosenCardContent: cardContent(chosenCard),
      unchosenCardIds,
      unchosenCardTitles: cardTitles(unchosenCardIds, cards),
      unchosenCardSummaries: cardSummaries(unchosenCardIds, cards),
      unchosenCardContents: cardContents(unchosenCardIds, cards),
    },
  }
}

export function readyRewardAppliedEvent(
  horizonCard: Card,
  readiedCrewCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const readiedCrewTitles = cardTitles(readiedCrewCardIds, cards)
  const readiedCrewText = readiedCrewTitles.length > 0 ? readiedCrewTitles.join(', ') : 'no crew'

  return {
    type: 'ready.reward.applied',
    message: `${horizonCard.title} readied ${readiedCrewText}.`,
    details: {
      sectorCardId: horizonCard.id,
      sectorTitle: horizonCard.title,
      readiedCrewCardIds,
      readiedCrewTitles,
      readiedCrewSummaries: cardSummaries(readiedCrewCardIds, cards),
      readiedCrewContents: cardContents(readiedCrewCardIds, cards),
    },
  }
}

export function scoutUsedEvent(
  lookedAtCardIds: readonly string[],
  keptOnTopCardId: string,
  bottomedCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const lookedAtTitles = cardTitles(lookedAtCardIds, cards)
  const bottomedTitles = cardTitles(bottomedCardIds, cards)
  const keptOnTopTitle = cards[keptOnTopCardId]?.title ?? keptOnTopCardId
  const keptOnTopSummary = describeCard(cards[keptOnTopCardId], keptOnTopCardId)
  const keptOnTopContent = cards[keptOnTopCardId] ? cardContent(cards[keptOnTopCardId]) : keptOnTopCardId

  return {
    type: 'scout.used',
    message: [
      'scout.used:',
      `looked at: ${lookedAtTitles.join(', ') || 'none'}`,
      `kept_on_top: ${keptOnTopTitle}`,
      `bottomed: ${bottomedTitles.join(', ') || 'none'}`,
    ].join('\n'),
    details: {
      lookedAtCardIds,
      lookedAtCardTitles: lookedAtTitles,
      lookedAtCardSummaries: cardSummaries(lookedAtCardIds, cards),
      lookedAtCardContents: cardContents(lookedAtCardIds, cards),
      keptOnTopCardId,
      keptOnTopCardTitle: keptOnTopTitle,
      keptOnTopCardSummary: keptOnTopSummary,
      keptOnTopCardContent: keptOnTopContent,
      bottomedCardIds,
      bottomedCardTitles: bottomedTitles,
      bottomedCardSummaries: cardSummaries(bottomedCardIds, cards),
      bottomedCardContents: cardContents(bottomedCardIds, cards),
    },
  }
}

export function gateCrewStateBeforeEvent(
  cards: Record<string, Card>,
  readyCrewCardIds: readonly string[],
  tiredCrewCardIds: readonly string[],
): PlaytestLogEvent {
  const readyCrewTitles = cardTitles(readyCrewCardIds, cards)
  const tiredCrewTitles = cardTitles(tiredCrewCardIds, cards)

  return {
    type: 'gate.crew_state.before',
    message: `Before the Gate: Ready crew: ${readyCrewTitles.join(', ') || 'none'}; Tired crew: ${tiredCrewTitles.join(', ') || 'none'}.`,
    details: {
      readyCrewCardIds,
      readyCrewTitles,
      tiredCrewCardIds,
      tiredCrewTitles,
    },
  }
}

export function gateCompletedEvent(
  gateCard: Card,
  sourceStack: Stack,
  cards: Record<string, Card>,
  motherCommittedThisAction: number,
  motherSpentTotal: number,
  extraAnyIconsRequired: number,
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
      motherCommittedThisAction,
      motherSpentTotal,
      extraAnyIconsRequired,
    },
  }
}

export function starsCompletedSummaryEvent(
  completedStars: readonly CompletedStarSummary[],
  cards: Record<string, Card>,
  readyCrewCardIds: readonly string[],
  tiredCrewCardIds: readonly string[],
  motherSpentTotal: number,
): PlaytestLogEvent {
  const readyCrewTitles = cardTitles(readyCrewCardIds, cards)
  const tiredCrewTitles = cardTitles(tiredCrewCardIds, cards)
  const starLines = completedStars.map((star, index) => {
    const crewText = star.crewTitles.join(', ') || 'none'

    return `Star ${index + 1}: ${star.cardTitle}; crew used: ${crewText}; fuel spent: ${star.fuelSpent}; MOTHER spent: ${star.motherSpent}`
  })
  const gateLine = `Gate: ready crew: ${readyCrewTitles.join(', ') || 'none'}; tired crew: ${tiredCrewTitles.join(', ') || 'none'}; MOTHER spent total: ${motherSpentTotal}`

  return {
    type: 'stars_completed_summary',
    message: [...starLines, gateLine].join(' | '),
    details: {
      starCards: completedStars.map((star, index) => `Star ${index + 1}: ${star.cardTitle}`),
      starCrewUsed: completedStars.map((star, index) => `Star ${index + 1}: ${star.crewTitles.join(', ') || 'none'}`),
      starFuelSpent: completedStars.map((star, index) => `Star ${index + 1}: ${star.fuelSpent}`),
      starMotherSpent: completedStars.map((star, index) => `Star ${index + 1}: ${star.motherSpent}`),
      gateReadyCrewTitles: readyCrewTitles,
      gateTiredCrewTitles: tiredCrewTitles,
      gateMotherSpentTotal: motherSpentTotal,
    },
  }
}

export function gameLostEvent(reason: GameLossReason): PlaytestLogEvent {
  const message =
    reason === 'sector-stranded'
      ? 'No drawn Sector can be completed with available Fuel, Ready crew fuel pairs, and unused MOTHER cards.'
      : 'The sector Gate cannot be completed with remaining Ready crew and unused MOTHER cards.'

  return {
    type: 'game.lost',
    message,
    details: { reason },
  }
}
