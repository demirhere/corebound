import type { BoardState, Card, DamageKind, HorizonDetails } from './types'

export function isDamageSourceCard(card: Card | undefined) {
  return card?.kind === 'hazard' && Boolean(card.hazard)
}

export function isActiveHazardCard(card: Card | undefined) {
  return isDamageSourceCard(card) && card?.damage !== true
}

export function isDamageCard(card: Card | undefined) {
  return isDamageSourceCard(card) && card?.damage === true
}

export function getDamageCards(cards: Record<string, Card>) {
  return Object.values(cards).filter(isDamageCard)
}

export function countDamageKind(cards: Record<string, Card>, kind: DamageKind) {
  return getDamageCards(cards).reduce((count, card) => (
    card.hazard?.kind === kind ? count + 1 : count
  ), 0)
}

export function hasDamageKind(cards: Record<string, Card>, kind: DamageKind) {
  return countDamageKind(cards, kind) > 0
}

export function getDamageDisplayTitle(card: Card) {
  return card.damage && card.hazard ? card.hazard.damageTitle : card.title
}

export function getDestinationFuelSurcharge(cards: Record<string, Card>, horizon: HorizonDetails | undefined) {
  if (!horizon) {
    return 0
  }

  let surcharge = 0

  if (horizon.need.icons.includes('engine') && hasDamageKind(cards, 'fractured-engine')) {
    surcharge += 1
  }

  if (hasDamageKind(cards, 'long-reach')) {
    surcharge += 1
  }

  return surcharge
}

export function blocksRoundEndTiredCrewReadying(board: Pick<BoardState, 'cards'>) {
  return hasDamageKind(board.cards, 'frozen-sector')
}

export function blocksPeeking(board: Pick<BoardState, 'cards'>) {
  return hasDamageKind(board.cards, 'sensor-loss')
}

export function blocksFirstMissionDiscovery(board: Pick<BoardState, 'cards'>) {
  return hasDamageKind(board.cards, 'sealed-cargo')
}

export function getMotherFuelCost(cards: Record<string, Card>) {
  return countDamageKind(cards, 'comm-failure')
}

export function getMotherStressEcho(cards: Record<string, Card>) {
  return countDamageKind(cards, 'stress-echo')
}

export function getRoundEndStressDamage(cards: Record<string, Card>) {
  return countDamageKind(cards, 'hull-crack')
}

export function getRoundEndDriftFlipCount(cards: Record<string, Card>) {
  return hasDamageKind(cards, 'drift-loop') ? 2 : 1
}

export function getMissionMapDrawCount(cards: Record<string, Card>, baseCount: number) {
  return hasDamageKind(cards, 'phantom-course') ? Math.min(2, baseCount) : baseCount
}
