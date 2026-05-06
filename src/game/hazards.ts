import type { BoardState, Card, HazardKind, HorizonDetails } from './types'

export function isHazardCard(card: Card | undefined) {
  return card?.kind === 'hazard' && Boolean(card.hazard)
}

export function isActiveHazardCard(card: Card | undefined) {
  return isHazardCard(card) && card?.damage !== true
}

export function isDamageCard(card: Card | undefined) {
  return isHazardCard(card) && card?.damage === true
}

export function getActiveHazard(cards: Record<string, Card>) {
  return Object.values(cards).find(isActiveHazardCard) ?? null
}

export function getDamageCards(cards: Record<string, Card>) {
  return Object.values(cards).filter(isDamageCard)
}

export function hasActiveHazardKind(cards: Record<string, Card>, kind: HazardKind) {
  return getActiveHazard(cards)?.hazard?.kind === kind
}

export function countDamageKind(cards: Record<string, Card>, kind: HazardKind) {
  return getDamageCards(cards).reduce((count, card) => (
    card.hazard?.kind === kind ? count + 1 : count
  ), 0)
}

export function hasHazardPressure(cards: Record<string, Card>, kind: HazardKind) {
  return hasActiveHazardKind(cards, kind) || countDamageKind(cards, kind) > 0
}

export function getHazardDisplayTitle(card: Card) {
  return card.damage && card.hazard ? card.hazard.damageTitle : card.title
}

export function getDestinationFuelSurcharge(cards: Record<string, Card>, horizon: HorizonDetails | undefined) {
  if (!horizon) {
    return 0
  }

  let surcharge = 0

  if (hasActiveHazardKind(cards, 'the-veil') || countDamageKind(cards, 'the-veil') > 0) {
    surcharge += 1
  }

  if (horizon.need.icons.includes('engine') && countDamageKind(cards, 'ion-storm') > 0) {
    surcharge += 1
  }

  return surcharge
}

export function getBlackTideExtraCrew(
  board: Pick<BoardState, 'cards' | 'stressCount'>,
  threshold: number,
  extraHumanCrew: number,
  hazardSkipCount = 0,
) {
  if (!hasHazardPressure(board.cards, 'black-tide') || board.stressCount < threshold) {
    return 0
  }

  return Math.max(0, extraHumanCrew - hazardSkipCount)
}

export function blocksTiredCrewReadying(board: Pick<BoardState, 'cards'>) {
  return hasActiveHazardKind(board.cards, 'cold-reach') || countDamageKind(board.cards, 'cold-reach') > 0
}

export function shouldSkipRoundDrift(board: Pick<BoardState, 'cards'>) {
  return hasActiveHazardKind(board.cards, 'silent-watch')
}

export function getGateImmediateDriftCount(board: Pick<BoardState, 'cards'>) {
  return (hasActiveHazardKind(board.cards, 'silent-watch') ? 3 : 0) + countDamageKind(board.cards, 'silent-watch')
}

export function shouldSignalDestination(board: Pick<BoardState, 'cards'>) {
  return hasActiveHazardKind(board.cards, 'ghost-signal') || countDamageKind(board.cards, 'ghost-signal') > 0
}
