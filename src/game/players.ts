import type { BoardState, GamePlayer } from './types'

export type PlayerCrewStats = {
  player: GamePlayer
  crew: number
  ready: number
  tired: number
  blueprints: number
  destinationsLed: number
}

export type PlayerStanding = PlayerCrewStats & {
  rank: number
  isWinner: boolean
}

export function getCurrentPlayer(board: BoardState) {
  return board.players.find((player) => player.id === board.currentPlayerId) ?? null
}

export function isMultiplayerBoard(board: BoardState) {
  return board.players.length > 1
}

export function getOwnedHandCardOwnerId(board: BoardState, cardId: string) {
  const card = board.cards[cardId]

  if (card?.kind === 'crew') {
    return board.crewOwnerIds[cardId] ?? null
  }

  if (card?.kind === 'discovery') {
    return board.discoveryOwnerIds[cardId] ?? null
  }

  return null
}

export function getPlayerReadyCrewCardIds(board: BoardState, playerId: string | null) {
  if (!playerId) {
    return board.handCardIds
  }

  const tiredCardIds = new Set(board.tiredCardIds)

  return Object.entries(board.crewOwnerIds).flatMap(([cardId, ownerId]) => {
    const card = board.cards[cardId]

    return ownerId === playerId && card?.kind === 'crew' && !tiredCardIds.has(cardId)
      ? [cardId]
      : []
  })
}

export function getPlayerTiredCrewCardIds(board: BoardState, playerId: string | null) {
  if (!playerId) {
    return board.tiredCardIds
  }

  return board.tiredCardIds.filter((cardId) => (
    board.cards[cardId]?.kind === 'crew' &&
      board.crewOwnerIds[cardId] === playerId
  ))
}

export function getVisibleHandCardIds(board: BoardState, playerId: string | null) {
  if (!isMultiplayerBoard(board)) {
    return board.handCardIds
  }

  if (!playerId) {
    return []
  }

  return board.handCardIds.filter((cardId) => getOwnedHandCardOwnerId(board, cardId) === playerId)
}

export function getVisibleTiredCardIds(board: BoardState, playerId: string | null) {
  if (!isMultiplayerBoard(board)) {
    return board.tiredCardIds
  }

  if (!playerId) {
    return []
  }

  return getPlayerTiredCrewCardIds(board, playerId)
}

export function getPlayerCrewStats(board: BoardState): PlayerCrewStats[] {
  return board.players.map((player) => {
    const ready = getPlayerReadyCrewCardIds(board, player.id).length
    const tired = getPlayerTiredCrewCardIds(board, player.id).length
    const blueprints = board.shipPartSlots.filter((slot) => slot.ownerId === player.id).length
    const destinationsLed = board.completedStarSummaries.filter(
      (summary) => summary.playerId === player.id,
    ).length

    return {
      player,
      crew: ready + tired,
      ready,
      tired,
      blueprints,
      destinationsLed,
    }
  })
}

function compareStats(left: PlayerCrewStats, right: PlayerCrewStats) {
  return (
    right.crew - left.crew ||
    right.blueprints - left.blueprints ||
    right.ready - left.ready
  )
}

export function getPlayerStandings(board: BoardState): PlayerStanding[] {
  const stats = getPlayerCrewStats(board)
  const sortedStats = [...stats].sort(compareStats)
  const topStats = sortedStats[0]

  if (!topStats) {
    return []
  }

  const winners = stats.filter((statsEntry) => compareStats(statsEntry, topStats) === 0)

  return sortedStats.map((statsEntry, index) => ({
    ...statsEntry,
    rank: index + 1,
    isWinner: winners.some((winner) => winner.player.id === statsEntry.player.id),
  }))
}
