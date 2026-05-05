import type {
  Card,
  CardBlueprint,
  CompletedStarSummary,
  Deck,
  DestinationFind,
  GameLossReason,
  ShipPartKind,
  Stack,
  VisitReward,
} from './types'
import type { PlaytestLogEvent } from './playtestLog'
import type { MotherCoveredIcon } from './rules'
import {
  getRequirementIconLabel,
  getShipPartLabel,
  getShipPartUseText,
} from './shipParts'

function roundPosition(value: number) {
  return Math.round(value * 10) / 10
}

function describeVisitRewards(rewards: readonly VisitReward[]) {
  return rewards
    .map((reward) => {
      if (reward.kind === 'resource') {
        return reward.count === 1
          ? `Collect ${reward.resource}`
          : `Collect ${reward.count} ${reward.resource}`
      }
      if (reward.kind === 'crew') {
        if (reward.label === 'Wake') {
          return 'Wake 1 crew into Tired and Ready 1 crew'
        }

        return `${reward.label} ${reward.count}`
      }
      if (reward.kind === 'scout') {
        return `Peek at top ${reward.count} stops, keep 1`
      }
      if (reward.kind === 'next_stop_fuel_discount') {
        return `Next stop -${reward.amount} Fuel`
      }
      if (reward.kind === 'ready') {
        return reward.count === 1
          ? 'Ready 1 crew'
          : `Ready ${reward.count} crew`
      }
      return ''
    })
    .join(', ')
}

function describeFind(find: DestinationFind) {
  if (find.kind === 'ship_part') {
    return `${find.itemName}: ${getShipPartUseText(find.shipPart)}`
  }

  return `${find.itemName}: ${describeVisitRewards(find.rewards) || 'no immediate benefit'}`
}

export function cardRulesText(card: Card | CardBlueprint) {
  if (card.kind === 'crew') {
    const specialties = card.specializations?.map(getRequirementIconLabel).join(', ') ?? 'none'

    return `specialties: ${specialties}; water math: Engineer+Scientist=water; MOTHER cannot pay Fuel`
  }

  if (card.kind === 'horizon' && card.horizon) {
    const need = [
      `fuel ${card.horizon.need.fuel}`,
      card.horizon.need.icons.length > 0 ? card.horizon.need.icons.map(getRequirementIconLabel).join(', ') : null,
    ]
      .filter(Boolean)
      .join('; ')

    return `Destination: ${card.title}; costs: ${need}; find: ${describeFind(card.horizon.find)}`
  }

  if (card.kind === 'mother') {
    return 'wild: covers 1 non-Fuel icon only; never fills a crew slot; spent after use adds 1 Stress'
  }

  if (card.kind === 'gate' && card.gate) {
    const icons = card.gate.need.icons.map(getRequirementIconLabel).join(', ')

    return `gate crew slots: ${card.gate.need.crew}; icons needed: ${icons}; MOTHER and Adaptive Control Consoles cover icons only; ${card.gate.motherPenalty.threshold}+ Stress adds ${card.gate.motherPenalty.extraHumanCrew} crew slot`
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

export function mapInitializedEvent(sector: number, mapCards: readonly Card[]): PlaytestLogEvent {
  const cardTitlesText = mapCards.map((card) => card.title).join(', ') || 'none'

  return {
    type: 'map.initialized',
    message: `Sector ${sector} Map initialized with 3 Destinations: ${cardTitlesText}.`,
    details: {
      sector,
      cardIds: mapCards.map((card) => card.id),
      cardTitles: mapCards.map((card) => card.title),
      cardSummaries: mapCards.map((card) => describeCard(card, card.id)),
      cardContents: mapCards.map(cardContent),
    },
  }
}

export function mapRefilledEvent(sector: number, mapCards: readonly Card[]): PlaytestLogEvent {
  const cardTitlesText = mapCards.map((card) => card.title).join(', ') || 'none'

  return {
    type: 'map.refilled',
    message: `Sector ${sector} Map refreshed with ${mapCards.length} Destinations: ${cardTitlesText}.`,
    details: {
      sector,
      cardIds: mapCards.map((card) => card.id),
      cardTitles: mapCards.map((card) => card.title),
      cardSummaries: mapCards.map((card) => describeCard(card, card.id)),
      cardContents: mapCards.map(cardContent),
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

export function stackActionCompletedEvent(
  actionLabel: string,
  sourceStack: Stack,
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'stack.action.completed',
    message: `${actionLabel} completed from ${sourceStack.id} with ${describeCards(sourceStack.cardIds, cards)}.`,
    details: {
      actionLabel,
      sourceStackId: sourceStack.id,
      cardIds: sourceStack.cardIds,
      cardTitles: cardTitles(sourceStack.cardIds, cards),
      cardSummaries: cardSummaries(sourceStack.cardIds, cards),
      cardContents: cardContents(sourceStack.cardIds, cards),
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
    ? 'Engineer+Scientist pair for water'
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

export function motherSpentEvent(motherCard: Card, stressAfterSpend: number): PlaytestLogEvent {
  return {
    type: 'mother.spent',
    message: `${describeCard(motherCard, motherCard.id)} spent; Stress is now ${stressAfterSpend}.`,
    details: {
      cardId: motherCard.id,
      cardTitle: motherCard.title,
      stressAfterSpend,
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
  extraHumanCrewRequired: number,
): PlaytestLogEvent {
  return {
    type: 'stress.threshold_crossed',
    message: `Stress threshold crossed from ${from} to ${to} during ${actionCard.title}; ${gateCard.title} will add ${extraHumanCrewRequired} crew slot while Stress is 3+.`,
    details: {
      from,
      to,
      actionCard: actionCard.title,
      actionCardId: actionCard.id,
      gateCard: gateCard.title,
      gateCardId: gateCard.id,
      extraHumanCrewRequired,
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
  const find = horizonCard.horizon?.find

  return {
    type: 'stop.completed',
    message: `${describeCard(horizonCard, horizonCard.id)} completed from ${sourceStack.id}; found: ${find ? describeFind(find) : 'none'}.`,
    details: {
      stopCardId: horizonCard.id,
      stopTitle: horizonCard.title,
      foundItemName: find?.itemName ?? null,
      findKind: find?.kind ?? null,
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

export function stopMovedToRouteEvent(
  stopCard: Card,
  routeSlotIndex: number,
  find: DestinationFind,
  gateBegins: boolean,
): PlaytestLogEvent {
  const findText = find.kind === 'ship_part'
    ? `${getShipPartLabel(find.shipPart)} available`
    : `${find.itemName} resolved`
  const travelText = find.kind === 'ship_part'
    ? `${stopCard.title} moved to traveled Destination ${routeSlotIndex + 1}`
    : `${stopCard.title} marked traveled Destination ${routeSlotIndex + 1} and cleared`

  return {
    type: 'stop.traveled',
    message: `${travelText}. ${findText}.${gateBegins ? ' Gate begins.' : ''}`,
    details: {
      stopCardId: stopCard.id,
      stopTitle: stopCard.title,
      routeSlot: routeSlotIndex + 1,
      findKind: find.kind,
      foundItemName: find.itemName,
      shipPart: find.kind === 'ship_part' ? find.shipPart : null,
      shipPartLabel: find.kind === 'ship_part' ? getShipPartLabel(find.shipPart) : null,
      gateBegins,
    },
  }
}

export function shipPartAvailableEvent(stopCard: Card, routeSlotIndex: number, shipPart: ShipPartKind): PlaytestLogEvent {
  const shipPartLabel = getShipPartLabel(shipPart)

  return {
    type: 'ship_part.available',
    message: `${shipPartLabel} available from traveled ${stopCard.title}.`,
    details: {
      stopCardId: stopCard.id,
      stopTitle: stopCard.title,
      routeSlot: routeSlotIndex + 1,
      shipPart,
      shipPartLabel,
    },
  }
}

export function shipPartSpentEvent(stopCard: Card, routeSlotIndex: number, shipPart: ShipPartKind): PlaytestLogEvent {
  const shipPartLabel = getShipPartLabel(shipPart)

  return {
    type: 'ship_part.spent',
    message: `${shipPartLabel} spent from ${stopCard.title}: ${getShipPartUseText(shipPart)}`,
    details: {
      stopCardId: stopCard.id,
      stopTitle: stopCard.title,
      routeSlot: routeSlotIndex + 1,
      shipPart,
      shipPartLabel,
      useText: getShipPartUseText(shipPart),
    },
  }
}

export function wakeCrewRecruitedEvent(
  chosenCard: Card,
  unchosenCardIds: readonly string[],
  cards: Record<string, Card>,
  readiedCrewCardIds: readonly string[],
): PlaytestLogEvent {
  const readiedCrewTitles = cardTitles(readiedCrewCardIds, cards)
  const readiedCrewText = readiedCrewTitles.length > 0 ? ` Wake readied ${readiedCrewTitles.join(', ')}.` : ''

  return {
    type: 'wake.recruited',
    message: `${describeCard(chosenCard, chosenCard.id)} recruited from Wake and enters Tired.${readiedCrewText}`,
    details: {
      chosenCardId: chosenCard.id,
      chosenCardTitle: chosenCard.title,
      chosenCardSummary: describeCard(chosenCard, chosenCard.id),
      chosenCardContent: cardContent(chosenCard),
      unchosenCardIds,
      unchosenCardTitles: cardTitles(unchosenCardIds, cards),
      unchosenCardSummaries: cardSummaries(unchosenCardIds, cards),
      unchosenCardContents: cardContents(unchosenCardIds, cards),
      readiedCrewCardIds,
      readiedCrewTitles,
      readiedCrewSummaries: cardSummaries(readiedCrewCardIds, cards),
      readiedCrewContents: cardContents(readiedCrewCardIds, cards),
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

export function stressAddedEvent(source: string, from: number, to: number): PlaytestLogEvent {
  return {
    type: 'stress.added',
    message: `${source}: Stress increased from ${from} to ${to}.`,
    details: {
      source,
      from,
      to,
    },
  }
}

export function stressThresholdActiveEvent(gateCard: Card, stressCount: number, extraCrewSlots: number): PlaytestLogEvent {
  return {
    type: 'stress.threshold_active',
    message: `${gateCard.title}: Stress ${stressCount} is 3+, so add ${extraCrewSlots} red crew slot${extraCrewSlots === 1 ? '' : 's'}.`,
    details: {
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      stressCount,
      extraCrewSlots,
    },
  }
}

export function sectorRevealedEvent(
  sector: number,
  gateCard: Card,
  horizonCards: readonly CardBlueprint[],
): PlaytestLogEvent {
  const horizonSummaries = horizonCards.map((card) => `${card.title}${cardRulesText(card) ? ` [${cardRulesText(card)}]` : ''}`)

  return {
    type: 'sector.revealed',
    message: `Sector ${sector} revealed: ${describeCard(gateCard, gateCard.id)}; Sector Deck reset with ${horizonCards.length} Destinations.`,
    details: {
      sector,
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      gateSummary: describeCard(gateCard, gateCard.id),
      gateContent: cardContent(gateCard),
      horizonCardCount: horizonCards.length,
      horizonSummaries,
      horizonContents: horizonCards.map(cardContent),
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
      `kept on top of Sector Deck: ${keptOnTopTitle}`,
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

export function gateCrewSlotsCheckedEvent(
  gateCard: Card,
  requiredCrewSlots: number,
  crewCommitted: number,
  serviceDroneBaysSpent: number,
): PlaytestLogEvent {
  const filledSlots = crewCommitted + serviceDroneBaysSpent

  return {
    type: 'gate.crew_slots_checked',
    message: `${gateCard.title} crew slots checked: ${filledSlots}/${requiredCrewSlots} filled (${crewCommitted} crew, ${serviceDroneBaysSpent} Service Drone Bay).`,
    details: {
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      requiredCrewSlots,
      crewCommitted,
      serviceDroneBaysSpent,
      filledSlots,
    },
  }
}

export function gateIconsCheckedEvent(
  gateCard: Card,
  missingIconsBeforeCoverage: readonly MotherCoveredIcon[],
  controlConsolesSpent: number,
  motherSpent: number,
): PlaytestLogEvent {
  const missingIconText = missingIconsBeforeCoverage.map((icon) => (
    icon === 'any' || icon === 'fuel' ? icon : getRequirementIconLabel(icon)
  ))

  return {
    type: 'gate.icons_checked',
    message: `${gateCard.title} icons checked: ${missingIconText.join(', ') || 'none missing'} before Adaptive Control Console/MOTHER coverage; ${controlConsolesSpent} Adaptive Control Console, ${motherSpent} MOTHER used.`,
    details: {
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      missingIconsBeforeCoverage: missingIconText,
      controlConsolesSpent,
      motherSpent,
    },
  }
}

export function gateCompletedEvent(
  gateCard: Card,
  sourceStack: Stack,
  cards: Record<string, Card>,
  motherCommittedThisAction: number,
  motherSpentTotal: number,
  extraHumanCrewRequired: number,
  isFinalGate: boolean,
): PlaytestLogEvent {
  return {
    type: 'gate.completed',
    message: `${describeCard(gateCard, gateCard.id)} completed from ${sourceStack.id}; ${isFinalGate ? 'ship arrived beyond the final Gate' : 'next sector begins'}.`,
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
      extraHumanCrewRequired,
      isFinalGate,
    },
  }
}

export function routeArchivedEvent(sector: number, routeCardIds: readonly string[], cards: Record<string, Card>): PlaytestLogEvent {
  const routeTitles = cardTitles(routeCardIds, cards)

  return {
    type: 'traveled_stops.archived',
    message: `Sector ${sector} traveled Destinations archived after Gate: ${routeTitles.join(', ') || 'none'}.`,
    details: {
      sector,
      routeCardIds,
      routeTitles,
      routeSummaries: cardSummaries(routeCardIds, cards),
      routeContents: cardContents(routeCardIds, cards),
    },
  }
}

export function starsCompletedSummaryEvent(
  completedStars: readonly CompletedStarSummary[],
  cards: Record<string, Card>,
  readyCrewCardIds: readonly string[],
  tiredCrewCardIds: readonly string[],
  stressCount: number,
): PlaytestLogEvent {
  const readyCrewTitles = cardTitles(readyCrewCardIds, cards)
  const tiredCrewTitles = cardTitles(tiredCrewCardIds, cards)
  const starLabels = completedStars.map((star, index) => {
    const sectorStarNumber = completedStars.slice(0, index + 1).filter((candidate) => candidate.sector === star.sector).length

    return `Sector ${star.sector} Traveled Destination ${sectorStarNumber}`
  })
  const starLines = completedStars.map((star, index) => {
    const crewText = star.crewTitles.join(', ') || 'none'

    return `${starLabels[index]}: ${star.cardTitle}; crew used: ${crewText}; fuel spent: ${star.fuelSpent}; MOTHER spent: ${star.motherSpent}`
  })
  const gateLine = `Gate: ready crew: ${readyCrewTitles.join(', ') || 'none'}; tired crew: ${tiredCrewTitles.join(', ') || 'none'}; Stress: ${stressCount}`

  return {
    type: 'stars_completed_summary',
    message: [...starLines, gateLine].join(' | '),
    details: {
      starCards: completedStars.map((star, index) => `${starLabels[index]}: ${star.cardTitle}`),
      starCrewUsed: completedStars.map((star, index) => `${starLabels[index]}: ${star.crewTitles.join(', ') || 'none'}`),
      starFuelSpent: completedStars.map((star, index) => `${starLabels[index]}: ${star.fuelSpent}`),
      starMotherSpent: completedStars.map((star, index) => `${starLabels[index]}: ${star.motherSpent}`),
      gateReadyCrewTitles: readyCrewTitles,
      gateTiredCrewTitles: tiredCrewTitles,
      gateStressCount: stressCount,
    },
  }
}

export function gameLostEvent(reason: GameLossReason): PlaytestLogEvent {
  const message =
    reason === 'sector-stranded'
      ? 'The sector cannot produce another visible Map Destination before the route is full.'
      : 'The Gate cannot be completed with available Ship Parts, Ready crew, and unused MOTHER cards.'

  return {
    type: 'game.lost',
    message,
    details: { reason },
  }
}

export function turnEndedEvent(turnNumber: number, nextTurnNumber: number): PlaytestLogEvent {
  return {
    type: 'turn.ended',
    message: `Turn ${turnNumber} ended. Turn ${nextTurnNumber} begins.`,
    details: {
      turnNumber,
      nextTurnNumber,
    },
  }
}
