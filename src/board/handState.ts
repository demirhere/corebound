import { getCrewRole } from '../game/blueprints/sectorGates'
import { getOwnedHandCardOwnerId } from '../game/players'
import type { BoardState, Card, CrewSpecialization, HandZone } from '../game/types'

export type HandCrewSortKind = 'role' | 'specialty'

const SPECIALIZATION_SORT_ORDER: CrewSpecialization[] = ['engine', 'life', 'star', 'signal']

function compareStrings(left: string, right: string) {
  return left.localeCompare(right)
}

function getSpecializationSortValue(specialization: CrewSpecialization | undefined) {
  if (!specialization) {
    return SPECIALIZATION_SORT_ORDER.length
  }

  const index = SPECIALIZATION_SORT_ORDER.indexOf(specialization)

  return index >= 0 ? index : SPECIALIZATION_SORT_ORDER.length
}

function compareCrewSpecializations(left: Card, right: Card) {
  const leftSpecializations = left.specializations ?? []
  const rightSpecializations = right.specializations ?? []
  const maxLength = Math.max(leftSpecializations.length, rightSpecializations.length)

  for (let index = 0; index < maxLength; index += 1) {
    const difference = getSpecializationSortValue(leftSpecializations[index]) -
      getSpecializationSortValue(rightSpecializations[index])

    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

function compareCrewCards(left: Card, right: Card, sortKind: HandCrewSortKind) {
  const roleDifference = compareStrings(getCrewRole(left), getCrewRole(right))
  const specialtyDifference = compareCrewSpecializations(left, right)
  const titleDifference = compareStrings(left.title, right.title)

  return sortKind === 'role'
    ? roleDifference || specialtyDifference || titleDifference
    : specialtyDifference || roleDifference || titleDifference
}

function canSortCrewCard(current: BoardState, cardId: string, playerId: string | null) {
  const card = current.cards[cardId]

  if (card?.kind !== 'crew') {
    return false
  }

  return current.players.length <= 1 || (
    playerId !== null && getOwnedHandCardOwnerId(current, cardId) === playerId
  )
}

export function sortHandCrewCardIds(
  current: BoardState,
  sortKind: HandCrewSortKind,
  playerId: string | null,
) {
  const sortableCardIds = current.handCardIds.filter((cardId) => canSortCrewCard(current, cardId, playerId))

  if (sortableCardIds.length < 2) {
    return current.handCardIds
  }

  const originalIndexByCardId = new Map(sortableCardIds.map((cardId, index) => [cardId, index]))
  const sortedCardIds = [...sortableCardIds].sort((leftCardId, rightCardId) => {
    const left = current.cards[leftCardId]
    const right = current.cards[rightCardId]

    if (!left || !right) {
      return (originalIndexByCardId.get(leftCardId) ?? 0) - (originalIndexByCardId.get(rightCardId) ?? 0)
    }

    return compareCrewCards(left, right, sortKind) ||
      (originalIndexByCardId.get(leftCardId) ?? 0) - (originalIndexByCardId.get(rightCardId) ?? 0)
  })
  let nextSortedIndex = 0

  return current.handCardIds.map((cardId) => {
    if (!originalIndexByCardId.has(cardId)) {
      return cardId
    }

    const sortedCardId = sortedCardIds[nextSortedIndex]
    nextSortedIndex += 1

    return sortedCardId ?? cardId
  })
}

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
    roundStartTiredCardIds: current.roundStartTiredCardIds.filter((candidateId) => candidateId !== cardId),
  }
}

export function canPutCardIdsInHand(cardIds: readonly string[], cards: Record<string, Card>) {
  return cardIds.length > 0 && cardIds.every((cardId) => {
    const card = cards[cardId]

    return card?.kind === 'crew' || card?.kind === 'discovery'
  })
}

export function canUseManualHandZone(zone: HandZone | null) {
  return zone === 'crew'
}
