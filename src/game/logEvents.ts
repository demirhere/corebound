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
import { getDamageDisplayTitle } from './damage'
import type { PlaytestLogEvent } from './playtestLog'
import { getMissionPatternLabel, type MotherCoveredIcon } from './rules'
import type { MissionPatternKind } from './types'
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
          ? `Recover ${reward.resource}`
          : `Recover ${reward.count} ${reward.resource}`
      }
      if (reward.kind === 'crew') {
        if (reward.label === 'Wake') {
          return reward.count === 1
            ? 'Wake 1 crew into Tired and Ready 1 crew'
            : `Wake ${reward.count} crew into Tired and Ready ${reward.count} crew`
        }

        return `${reward.label} ${reward.count}`
      }
      if (reward.kind === 'scout') {
        return `Peek at top ${reward.count} Missions, keep 1`
      }
      if (reward.kind === 'next_stop_fuel_discount') {
        return `Next Mission -${reward.amount} Fuel`
      }
      if (reward.kind === 'next_gate_fuel_discount') {
        return `Next Gate -${reward.amount} Fuel`
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
    const rewardText = describeVisitRewards(find.rewards ?? [])

    return `${find.itemName}: ${getShipPartUseText(find.shipPart)}${rewardText ? `; ${rewardText}` : ''}`
  }

  return `${find.itemName}: ${describeVisitRewards(find.rewards) || 'no immediate benefit'}`
}

function getDiscoveryTagLabel(tag: string) {
  if (tag === 'anytime') {
    return 'Anytime'
  }

  return `${tag.slice(0, 1).toUpperCase()}${tag.slice(1)}`
}

export function cardRulesText(card: Card | CardBlueprint) {
  if (card.kind === 'crew') {
    const specialties = card.specializations?.map(getRequirementIconLabel).join(', ') ?? 'none'

    return `specialties: ${specialties}; fuel math: Scientist+Mechanic=1 Fuel, or 2 with Fuel Synthesizer; research: 2 Engine + 2 Fuel drafts a Ship Part; MOTHER cannot pay Fuel`
  }

  if (card.kind === 'mission' && card.mission) {
    if (
      card.mission.find.kind === 'ship_part' &&
      card.mission.need.fuel === 0 &&
      card.mission.need.icons.length === 0
    ) {
      return `Ship Part Research: ${describeFind(card.mission.find)}`
    }

    const need = [
      card.mission.need.fuel > 0 ? `fuel ${card.mission.need.fuel}` : null,
      card.mission.pattern ? `pattern ${getMissionPatternLabel(card.mission.pattern)}` : null,
      card.mission.need.icons.length > 0 ? card.mission.need.icons.map(getRequirementIconLabel).join(', ') : null,
    ]
      .filter(Boolean)
      .join('; ')

    return `Destination: ${card.title}; costs: ${need}; find: ${describeFind(card.mission.find)}`
  }

  if (card.kind === 'mother') {
    return 'wild: covers 1 non-Fuel icon only; never fills a crew slot; spent after use adds 1 Stress'
  }

  if (card.kind === 'gate' && card.gate) {
    const need = [
      `fuel ${card.gate.need.fuel}`,
      card.gate.need.crew > 0 ? `crew slots ${card.gate.need.crew}` : null,
      card.gate.need.icons.length > 0 ? `icons ${card.gate.need.icons.map(getRequirementIconLabel).join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('; ')

    return `gate ${need}; resolve: ${card.gate.effectText}; clear: ${card.gate.clearText}`
  }

  if (card.kind === 'discovery' && card.discovery) {
    return `${getDiscoveryTagLabel(card.discovery.tag)} Discovery: ${card.discovery.effectText}`
  }

  if (card.kind === 'drift' && card.drift) {
    return `Drift: ${card.drift.effectText}`
  }

  if (card.kind === 'hazard' && card.hazard) {
    return 'damage' in card && card.damage
      ? `Damage: ${card.hazard.damageEffectText}`
      : `Damage: ${card.hazard.damageEffectText}`
  }

  return ''
}

function describeCard(card: Card | undefined, fallbackId: string) {
  if (!card) {
    return fallbackId
  }

  const rulesText = cardRulesText(card)
  const title = getDamageDisplayTitle(card)

  return `${title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`
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
    message: `Sector ${sector} Map initialized with ${mapCards.length} Destinations: ${cardTitlesText}.`,
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

export function crewReclaimedToHandEvent(
  cardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  return {
    type: 'crew.reclaimed_to_hand',
    message: `${describeCards(cardIds, cards)} returned to hand from the board before refilling from Cryo.`,
    details: {
      cardIds,
      cardTitles: cardTitles(cardIds, cards),
      cardSummaries: cardSummaries(cardIds, cards),
      cardContents: cardContents(cardIds, cards),
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

export function discoveryEarnedEvent(
  discoveryCard: Card,
  deck: Deck,
  playerName: string | null,
  missionCard: Card,
): PlaytestLogEvent {
  const playerText = playerName ? `${playerName} earns` : 'Player earns'

  return {
    type: 'discovery.earned',
    message: `${playerText} ${describeCard(discoveryCard, discoveryCard.id)} from ${deck.title} after ${missionCard.title}.`,
    details: {
      cardId: discoveryCard.id,
      cardTitle: discoveryCard.title,
      cardSummary: describeCard(discoveryCard, discoveryCard.id),
      cardContent: cardContent(discoveryCard),
      deckId: deck.id,
      deckTitle: deck.title,
      missionCardId: missionCard.id,
      missionTitle: missionCard.title,
      playerName,
    },
  }
}

export function discoveryMissedEvent(deck: Deck | null, missionCard: Card): PlaytestLogEvent {
  return {
    type: 'discovery.missed',
    message: `${missionCard.title} completed, but no Discovery card was available to earn.`,
    details: {
      deckId: deck?.id ?? null,
      deckTitle: deck?.title ?? null,
      missionCardId: missionCard.id,
      missionTitle: missionCard.title,
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
    ? 'Scientist+Mechanic pair for Fuel'
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

export function missionCompletedEvent(
  missionCard: Card,
  sourceStack: Stack,
  rewardCards: readonly Card[],
  cards: Record<string, Card>,
  options: { dynamicPattern?: MissionPatternKind, dynamicFuelReward?: number } = {},
): PlaytestLogEvent {
  const find = missionCard.mission?.find
  const patternLabel = options.dynamicPattern ? getMissionPatternLabel(options.dynamicPattern) : null
  const patternSuffix = patternLabel
    ? ` (matched ${patternLabel} for ${options.dynamicFuelReward ?? 0} Fuel)`
    : ''

  return {
    type: 'mission.completed',
    message: `${describeCard(missionCard, missionCard.id)} completed from ${sourceStack.id}${patternSuffix}; found: ${find ? describeFind(find) : 'none'}.`,
    details: {
      missionCardId: missionCard.id,
      missionTitle: missionCard.title,
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
      dynamicPattern: options.dynamicPattern ?? null,
      dynamicPatternLabel: patternLabel,
      dynamicFuelReward: options.dynamicFuelReward ?? null,
    },
  }
}

export function missionMovedToRouteEvent(
  missionCard: Card,
  routeSlotIndex: number,
  find: DestinationFind,
  gateBegins: boolean,
): PlaytestLogEvent {
  const findText = find.kind === 'ship_part'
    ? `${getShipPartLabel(find.shipPart)} available`
    : `${find.itemName} resolved`
  const travelText = find.kind === 'ship_part'
    ? `${missionCard.title} moved to traveled Destination ${routeSlotIndex + 1}`
    : `${missionCard.title} marked traveled Destination ${routeSlotIndex + 1} and cleared`

  return {
    type: 'mission.traveled',
    message: `${travelText}. ${findText}.${gateBegins ? ' Gate begins.' : ''}`,
    details: {
      missionCardId: missionCard.id,
      missionTitle: missionCard.title,
      routeSlot: routeSlotIndex + 1,
      findKind: find.kind,
      foundItemName: find.itemName,
      shipPart: find.kind === 'ship_part' ? find.shipPart : null,
      shipPartLabel: find.kind === 'ship_part' ? getShipPartLabel(find.shipPart) : null,
      gateBegins,
    },
  }
}

export function shipPartAvailableEvent(missionCard: Card, routeSlotIndex: number, shipPart: ShipPartKind): PlaytestLogEvent {
  const shipPartLabel = getShipPartLabel(shipPart)

  return {
    type: 'ship_part.available',
    message: `${shipPartLabel} available from traveled ${missionCard.title}.`,
    details: {
      missionCardId: missionCard.id,
      missionTitle: missionCard.title,
      routeSlot: routeSlotIndex + 1,
      shipPart,
      shipPartLabel,
    },
  }
}

export function shipPartDraftedEvent(
  chosenCard: Card,
  unchosenCardIds: readonly string[],
  cards: Record<string, Card>,
  playerId: string | null,
): PlaytestLogEvent {
  const find = chosenCard.mission?.find
  const shipPart = find?.kind === 'ship_part' ? find.shipPart : null
  const shipPartLabel = shipPart ? getShipPartLabel(shipPart) : chosenCard.title
  const bottomedTitles = cardTitles(unchosenCardIds, cards)
  const bottomedText = bottomedTitles.length > 0
    ? ` ${bottomedTitles.join(', ')} moved to the bottom of Ship Parts.`
    : ''

  return {
    type: 'ship_part.drafted',
    message: `${shipPartLabel} drafted from Ship Parts.${bottomedText}`,
    details: {
      cardId: chosenCard.id,
      cardTitle: chosenCard.title,
      cardSummary: describeCard(chosenCard, chosenCard.id),
      cardContent: cardContent(chosenCard),
      shipPart,
      shipPartLabel,
      playerId,
      bottomedCardIds: unchosenCardIds,
      bottomedCardTitles: bottomedTitles,
      bottomedCardSummaries: cardSummaries(unchosenCardIds, cards),
      bottomedCardContents: cardContents(unchosenCardIds, cards),
    },
  }
}

export function shipPartSpentEvent(missionCard: Card, routeSlotIndex: number | null, shipPart: ShipPartKind): PlaytestLogEvent {
  const shipPartLabel = getShipPartLabel(shipPart)
  const sourceText = routeSlotIndex === null
    ? missionCard.mission?.find.itemName ?? missionCard.title
    : missionCard.title

  return {
    type: 'ship_part.spent',
    message: `${shipPartLabel} spent from ${sourceText}: ${getShipPartUseText(shipPart)}`,
    details: {
      missionCardId: missionCard.id,
      missionTitle: missionCard.title,
      routeSlot: routeSlotIndex === null ? null : routeSlotIndex + 1,
      shipPart,
      shipPartLabel,
      useText: getShipPartUseText(shipPart),
    },
  }
}

export function medbayRehydratorReadiedEvent(
  medbayCards: readonly Card[],
  readiedCrewCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const shipPartLabel = getShipPartLabel('medbay-rehydrator')
  const medbayTitles = cardTitles(medbayCards.map((card) => card.id), cards)
  const readiedCrewTitles = cardTitles(readiedCrewCardIds, cards)
  const readiedCrewText = readiedCrewTitles.length > 0 ? readiedCrewTitles.join(', ') : 'no crew'

  return {
    type: 'ship_part.medbay_readied',
    message: `${shipPartLabel} readied ${readiedCrewText} after sector.`,
    details: {
      shipPart: 'medbay-rehydrator',
      shipPartLabel,
      medbayCardIds: medbayCards.map((card) => card.id),
      medbayTitles,
      readiedCrewCardIds,
      readiedCrewTitles,
      readiedCrewSummaries: cardSummaries(readiedCrewCardIds, cards),
      readiedCrewContents: cardContents(readiedCrewCardIds, cards),
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

export function turnStartCrewDrawnEvent(card: Card, deck: Deck, playerName: string | null): PlaytestLogEvent {
  const playerText = playerName ? ` for ${playerName}` : ''

  return {
    type: 'turn_start.crew_drawn',
    message: `${describeCard(card, card.id)} drawn from ${deck.title}${playerText} and enters Ready.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: describeCard(card, card.id),
      cardContent: cardContent(card),
      deckId: deck.id,
      deckTitle: deck.title,
      playerName,
    },
  }
}

export function readyRewardAppliedEvent(
  missionCard: Card,
  readiedCrewCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const readiedCrewTitles = cardTitles(readiedCrewCardIds, cards)
  const readiedCrewText = readiedCrewTitles.length > 0 ? readiedCrewTitles.join(', ') : 'no crew'

  return {
    type: 'ready.reward.applied',
    message: `${missionCard.title} readied ${readiedCrewText}.`,
    details: {
      sectorCardId: missionCard.id,
      sectorTitle: missionCard.title,
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

export function stressClearedEvent(source: string, from: number, to: number): PlaytestLogEvent {
  return {
    type: 'stress.cleared',
    message: `${source}: Stress reduced from ${from} to ${to}.`,
    details: {
      source,
      from,
      to,
    },
  }
}

export function researchOfferedEvent(offers: readonly { id: string, label: string, cost: number }[]): PlaytestLogEvent {
  return {
    type: 'research.offered',
    message: `Research dialog opened with ${offers.length} offer${offers.length === 1 ? '' : 's'}: ${offers.map((o) => `${o.label} (${o.cost} Scraps)`).join(', ')}.`,
    details: {
      offerCount: offers.length,
      offerIds: offers.map((o) => o.id),
      offerSummary: offers.map((o) => `${o.label}|${o.cost}`),
    },
  }
}

export function researchSkippedEvent(consolation: number, from: number, to: number): PlaytestLogEvent {
  return {
    type: 'research.skipped',
    message: consolation > 0
      ? `Research dialog closed without a buy: +${consolation} Scrap (${from} → ${to}).`
      : `Research dialog closed for next sector: no Scrap gained (${from} → ${to}).`,
    details: { consolation, from, to },
  }
}

export function researchRedrawnEvent(
  cost: number,
  from: number,
  to: number,
  offers: readonly { id: string, label: string, cost: number }[],
): PlaytestLogEvent {
  return {
    type: 'research.redrawn',
    message: `Research offers re-drawn for ${cost} Scrap${cost === 1 ? '' : 's'} (${from} → ${to}): ${offers.map((o) => `${o.label} (${o.cost} Scraps)`).join(', ')}.`,
    details: {
      cost,
      from,
      to,
      offerCount: offers.length,
      offerIds: offers.map((o) => o.id),
      offerSummary: offers.map((o) => `${o.label}|${o.cost}`),
    },
  }
}

export function shipPartBoughtEvent(label: string, cost: number, scrapsBefore: number, scrapsAfter: number): PlaytestLogEvent {
  return {
    type: 'ship-part.bought',
    message: `Ship Part bought: ${label} for ${cost} Scrap${cost === 1 ? '' : 's'} (${scrapsBefore} → ${scrapsAfter}).`,
    details: { label, cost, scrapsBefore, scrapsAfter },
  }
}

export function shipPartDiscardedEvent(label: string, refund: number, scrapsBefore: number, scrapsAfter: number): PlaytestLogEvent {
  return {
    type: 'ship-part.discarded',
    message: `Ship Part discarded: ${label} for +${refund} Scrap${refund === 1 ? '' : 's'} refund (${scrapsBefore} → ${scrapsAfter}).`,
    details: { label, refund, scrapsBefore, scrapsAfter },
  }
}

export function crewQuartersCardPlacedEvent(
  source: 'research-dialog' | 'scrap-stack',
  cost: number,
  scrapsBefore: number,
  scrapsAfter: number,
  cardId: string,
): PlaytestLogEvent {
  return {
    type: 'crew-quarters.card-placed',
    message: `Crew Quarters Upgrade card dealt for ${cost} Scrap${cost === 1 ? '' : 's'} via ${source === 'scrap-stack' ? '4-Scrap stack action' : 'research dialog'} (${scrapsBefore} → ${scrapsAfter}).`,
    details: { source, cost, scrapsBefore, scrapsAfter, cardId },
  }
}

export function crewQuartersUpgradedEvent(
  pattern: string,
  newLevel: number,
  fuelPerPlay: number,
  crewCardIds: readonly string[],
  cards: Record<string, { title: string }>,
): PlaytestLogEvent {
  const crewSummary = crewCardIds.map((id) => cards[id]?.title ?? id).join(', ')
  return {
    type: 'crew-quarters.upgraded',
    message: `Crew Quarters upgraded: ${pattern} Lv ${newLevel} (+${fuelPerPlay} Fuel) — consumed crew: ${crewSummary}.`,
    details: { pattern, newLevel, fuelPerPlay, crewCardIds, crewSummary },
  }
}

export function scrapsEarnedEvent(source: string, amount: number, from: number, to: number): PlaytestLogEvent {
  return {
    type: 'scraps.earned',
    message: `${source}: +${amount} Scrap${amount === 1 ? '' : 's'} (${from} → ${to}).`,
    details: { source, amount, from, to },
  }
}

export function driftDeckReshuffledEvent(deck: Deck): PlaytestLogEvent {
  return {
    type: 'drift.deck.reshuffled',
    message: `${deck.title} was empty and reshuffled before the Drift draw.`,
    details: {
      deckId: deck.id,
      deckTitle: deck.title,
    },
  }
}

export function fuelDeckReshuffledEvent(deck: Deck, discardCount: number): PlaytestLogEvent {
  return {
    type: 'fuel.deck.reshuffled',
    message: `Fuel Deck reshuffled with ${discardCount} spent Fuel Cell${discardCount === 1 ? '' : 's'}.`,
    details: {
      deckId: deck.id,
      deckTitle: deck.title,
      discardCount,
    },
  }
}

export function cryoDeckReshuffledEvent(tiredCount: number): PlaytestLogEvent {
  return {
    type: 'cryo.deck.reshuffled',
    message: `Cryo Deck was empty — ${tiredCount} Tired crew shuffled back into Cryo.`,
    details: { tiredCount },
  }
}

export function driftResolvedEvent(card: Card, result: string): PlaytestLogEvent {
  return {
    type: 'drift.resolved',
    message: `Drift resolved: ${describeCard(card, card.id)}. ${result}`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: describeCard(card, card.id),
      cardContent: cardContent(card),
      effectKind: card.drift?.effectKind ?? null,
      result,
    },
  }
}

export function roundEndCrewReadiedEvent(
  readiedCrewCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const readiedCrewTitles = cardTitles(readiedCrewCardIds, cards)
  const readiedCrewText = readiedCrewTitles.length > 0 ? readiedCrewTitles.join(', ') : 'no crew'

  return {
    type: 'round_end.crew_readied',
    message: `Round end readied ${readiedCrewText} from Tired.`,
    details: {
      readiedCrewCardIds,
      readiedCrewTitles,
      readiedCrewSummaries: cardSummaries(readiedCrewCardIds, cards),
      readiedCrewContents: cardContents(readiedCrewCardIds, cards),
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
  missionCards: readonly CardBlueprint[],
  mapMissionCards: readonly Card[] = [],
): PlaytestLogEvent {
  const missionSummaries = missionCards.map((card) => `${card.title}${cardRulesText(card) ? ` [${cardRulesText(card)}]` : ''}`)
  const gateTitle = `${gateCard.title} Final Gate`
  const mapSummaries = mapMissionCards.map((card) => `${card.title} (${card.id})`)
  const mapSuffix = mapMissionCards.length > 0
    ? ` Map auto-dealt: ${mapSummaries.join(', ')}.`
    : ''

  return {
    type: 'sector.revealed',
    message: `Sector ${sector} prepared: ${gateTitle} placed face up and attemptable anytime; Missions reset with ${missionCards.length} cards.${mapSuffix}`,
    details: {
      sector,
      gateCardId: gateCard.id,
      gateTitle,
      gateSummary: `${gateTitle} (${gateCard.id}) face up`,
      gateFaceUp: gateCard.faceUp,
      missionCardCount: missionCards.length,
      missionSummaries,
      missionContents: missionCards.map(cardContent),
      mapMissionCardIds: mapMissionCards.map((card) => card.id),
      mapMissionTitles: mapMissionCards.map((card) => card.title),
      mapMissionContents: mapMissionCards.map(cardContent),
    },
  }
}

export function sectorResetCrewReadiedEvent(
  sector: number,
  readiedCrewCardIds: readonly string[],
  cards: Record<string, Card>,
): PlaytestLogEvent {
  const readiedCrewTitles = cardTitles(readiedCrewCardIds, cards)
  const readiedCrewText = readiedCrewTitles.length > 0 ? readiedCrewTitles.join(', ') : 'no crew'

  return {
    type: 'sector_reset.crew_readied',
    message: `Sector ${sector} reset: all Tired crew returned to Ready (${readiedCrewText}).`,
    details: {
      sector,
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
      `kept on top of Missions: ${keptOnTopTitle}`,
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
  const filledSlots = crewCommitted

  const message = requiredCrewSlots === 0 && serviceDroneBaysSpent === 0
    ? `${gateCard.title} crew need checked: no Gate crew required.`
    : `${gateCard.title} crew need checked: ${filledSlots}/${requiredCrewSlots} crew committed; Service Drone Bay reduction: ${serviceDroneBaysSpent}.`

  return {
    type: 'gate.crew_slots_checked',
    message,
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
    message: `${describeCard(gateCard, gateCard.id)} completed from ${sourceStack.id}; ${isFinalGate ? 'run complete' : 'next sector begins'}.`,
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

export function gateCleanClearedEvent(gateCard: Card): PlaytestLogEvent {
  return {
    type: 'gate.cleared_cleanly',
    message: `${gateCard.title} cleared cleanly; no Damage drawn.`,
    details: {
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      gateSummary: describeCard(gateCard, gateCard.id),
      gateContent: cardContent(gateCard),
    },
  }
}

export function damageDrawnEvent(gateCard: Card, damageCard: Card): PlaytestLogEvent {
  return {
    type: 'damage.drawn',
    message: `${gateCard.title} was passed but not cleared cleanly; ${describeCard(damageCard, damageCard.id)} stays on the ship.`,
    details: {
      damageTitle: damageCard.hazard?.damageTitle ?? damageCard.title,
      damageSummary: describeCard(damageCard, damageCard.id),
      damageContent: cardContent(damageCard),
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
    },
  }
}

export function gateDriftHeldEvent(gateCard: Card, heldDriftCount: number): PlaytestLogEvent {
  return {
    type: 'gate.drift_held',
    message: `${gateCard.title}: Drift held in reserve (${heldDriftCount} held).`,
    details: {
      gateCardId: gateCard.id,
      gateTitle: gateCard.title,
      gateSummary: describeCard(gateCard, gateCard.id),
      gateContent: cardContent(gateCard),
      heldDriftCount,
    },
  }
}

export function routeArchivedEvent(sector: number, routeCardIds: readonly string[], cards: Record<string, Card>): PlaytestLogEvent {
  const routeTitles = cardTitles(routeCardIds, cards)

  return {
    type: 'traveled_missions.archived',
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
  const message = reason === 'sector-stranded'
    ? 'No reachable Mission or Ship Part Research remains and the Gate cannot be passed with current resources.'
    : reason === 'fuel-depleted'
      ? 'The Fuel Supply was exhausted.'
      : 'The Gate cannot be completed with required Gate Fuel, crew-made Fuel, and available Gate Fuel discounts.'

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
