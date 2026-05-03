import type { BoardState, Card, HandZone } from '../game/types'

export function getHandCardIds(current: BoardState, zone: HandZone) {
  return zone === 'crew' ? current.handCardIds : current.tiredCardIds
}

export function getCardHandZone(current: BoardState, cardId: string): HandZone | null {
  if (current.handCardIds.includes(cardId)) {
    return 'crew'
  }

  return current.tiredCardIds.includes(cardId) ? 'tired' : null
}

export function removeCardFromHandZones(current: BoardState, cardId: string) {
  return {
    handCardIds: current.handCardIds.filter((candidateId) => candidateId !== cardId),
    tiredCardIds: current.tiredCardIds.filter((candidateId) => candidateId !== cardId),
  }
}

export function canPutCardIdsInHand(cardIds: readonly string[], cards: Record<string, Card>) {
  return cardIds.length > 0 && cardIds.every((cardId) => cards[cardId]?.kind === 'crew')
}

export function canUseManualHandZone(zone: HandZone | null) {
  return zone === 'crew'
}
