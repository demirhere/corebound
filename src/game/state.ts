import { SOLO_PLAYER, createInitialBoardSetup } from './setup'
import type { BoardState, GamePlayer } from './types'
import {
  appendPlaytestEvents,
  type PlaytestLogEntry,
  type PlaytestLogEvent,
  type PlaytestLogSession,
} from './playtestLog'

export type BoardUpdateResult =
  | BoardState
  | {
      board: BoardState
      events?: readonly PlaytestLogEvent[]
    }

export type BoardUpdater = (current: BoardState) => BoardUpdateResult

type PendingSetupDeal = {
  key: string
  board: BoardState
  events: readonly PlaytestLogEvent[]
}

export type GameState = {
  board: BoardState
  playtestLog: PlaytestLogEntry[]
  nextLogId: number
  previousPlaytestLogSessions: PlaytestLogSession[]
  nextPlaytestLogSessionId: number
  playtestLogSessionStartedAt: string
  pendingSetupDeal: PendingSetupDeal | null
}

export type GameAction =
  | {
      type: 'hydrate-game'
      state: GameState
    }
  | {
      type: 'apply-board-update'
      update: BoardUpdater
      occurredAt: string
    }
  | {
      type: 'reset-game'
      occurredAt: string
    }
  | {
      type: 'start-game'
      players: readonly GamePlayer[]
      occurredAt: string
    }
  | {
      type: 'complete-setup-deal'
      setupKey: string
      occurredAt: string
    }

function createGameState(
  startedAt: string,
  players?: readonly GamePlayer[],
  previousPlaytestLogSessions: PlaytestLogSession[] = [],
  nextPlaytestLogSessionId = 1,
): GameState {
  const setup = createInitialBoardSetup(players)

  return {
    board: setup.predealBoard,
    playtestLog: [],
    nextLogId: 1,
    previousPlaytestLogSessions,
    nextPlaytestLogSessionId,
    playtestLogSessionStartedAt: startedAt,
    pendingSetupDeal: {
      key: startedAt,
      board: setup.board,
      events: setup.events,
    },
  }
}

export function createInitialGameState(): GameState {
  return createGameState(new Date().toISOString())
}

export function withPlaytestEvents(
  board: BoardState,
  events: PlaytestLogEvent | readonly PlaytestLogEvent[],
): BoardUpdateResult {
  return {
    board,
    events: Array.isArray(events) ? events : [events],
  }
}

function resolveBoardUpdate(result: BoardUpdateResult) {
  return 'board' in result
    ? { board: result.board, events: result.events ?? [] }
    : { board: result, events: [] }
}

function migrateBoardState(board: BoardState): BoardState {
  const legacyBoard = board as BoardState & Partial<BoardState>
  const players = Array.isArray(legacyBoard.players) && legacyBoard.players.length > 0
    ? legacyBoard.players
    : [SOLO_PLAYER]
  const currentPlayerId = legacyBoard.currentPlayerId ?? players[legacyBoard.turnPlayerIndex ?? 0]?.id ?? players[0]?.id ?? null
  const crewOwnerIds = legacyBoard.crewOwnerIds ?? Object.fromEntries(
    Object.values(legacyBoard.cards ?? {}).flatMap((card) => (
      card.kind === 'crew' ? [[card.id, players[0]?.id ?? SOLO_PLAYER.id]] : []
    )),
  )
  const discoveryOwnerIds = legacyBoard.discoveryOwnerIds ?? Object.fromEntries(
    Object.values(legacyBoard.cards ?? {}).flatMap((card) => (
      card.kind === 'discovery' ? [[card.id, players[0]?.id ?? SOLO_PLAYER.id]] : []
    )),
  )

  return {
    ...board,
    players,
    crewOwnerIds,
    discoveryOwnerIds,
    turnPlayerIndex: legacyBoard.turnPlayerIndex ?? Math.max(
      0,
      players.findIndex((player) => player.id === currentPlayerId),
    ),
    currentPlayerId,
    sectorDrawnThisTurn: legacyBoard.sectorDrawnThisTurn ?? false,
    traveledThisTurn: legacyBoard.traveledThisTurn ?? false,
    gateStartedSector: legacyBoard.gateStartedSector ?? null,
    roundStartTiredCardIds: legacyBoard.roundStartTiredCardIds ?? legacyBoard.tiredCardIds ?? [],
    shipPartSlots: (legacyBoard.shipPartSlots ?? []).map((slot) => ({
      ...slot,
      ownerId: slot.ownerId ?? null,
    })),
    completedStarSummaries: (legacyBoard.completedStarSummaries ?? []).map((summary) => ({
      ...summary,
      playerId: summary.playerId ?? null,
    })),
    forcedDestinationCardId: legacyBoard.forcedDestinationCardId ?? null,
    pendingWakeChoice: legacyBoard.pendingWakeChoice
      ? {
          ...legacyBoard.pendingWakeChoice,
          playerId: legacyBoard.pendingWakeChoice.playerId ?? currentPlayerId,
        }
      : null,
    pendingDrift: legacyBoard.pendingDrift ?? null,
    heldDriftCount: legacyBoard.heldDriftCount ?? 0,
  }
}

function migrateGameState(state: GameState): GameState {
  return {
    ...state,
    board: migrateBoardState(state.board),
    playtestLog: state.playtestLog ?? [],
    previousPlaytestLogSessions: state.previousPlaytestLogSessions ?? [],
    pendingSetupDeal: state.pendingSetupDeal
      ? {
          ...state.pendingSetupDeal,
          board: migrateBoardState(state.pendingSetupDeal.board),
        }
      : null,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'hydrate-game') {
    return migrateGameState(action.state)
  }

  if (action.type === 'reset-game') {
    const previousPlaytestLogSessions = state.playtestLog.length > 0
      ? [
          {
            id: state.nextPlaytestLogSessionId,
            startedAt: state.playtestLogSessionStartedAt,
            endedAt: action.occurredAt,
            entries: state.playtestLog,
          },
          ...state.previousPlaytestLogSessions,
        ]
      : state.previousPlaytestLogSessions

    return createGameState(
      action.occurredAt,
      state.board.players,
      previousPlaytestLogSessions,
      state.nextPlaytestLogSessionId + (state.playtestLog.length > 0 ? 1 : 0),
    )
  }

  if (action.type === 'start-game') {
    return createGameState(action.occurredAt, action.players)
  }

  if (action.type === 'complete-setup-deal') {
    const pendingSetupDeal = state.pendingSetupDeal

    if (!pendingSetupDeal || pendingSetupDeal.key !== action.setupKey) {
      return state
    }

    const playtestLog = appendPlaytestEvents(
      state.playtestLog,
      state.nextLogId,
      pendingSetupDeal.events,
      action.occurredAt,
    )

    return {
      ...state,
      board: pendingSetupDeal.board,
      playtestLog: playtestLog.entries,
      nextLogId: playtestLog.nextLogId,
      pendingSetupDeal: null,
    }
  }

  const update = resolveBoardUpdate(action.update(state.board))

  if (update.board === state.board && update.events.length === 0) {
    return state
  }

  const playtestLog = appendPlaytestEvents(
    state.playtestLog,
    state.nextLogId,
    update.events,
    action.occurredAt,
  )

  return {
    board: update.board,
    playtestLog: playtestLog.entries,
    nextLogId: playtestLog.nextLogId,
    previousPlaytestLogSessions: state.previousPlaytestLogSessions,
    nextPlaytestLogSessionId: state.nextPlaytestLogSessionId,
    playtestLogSessionStartedAt: state.playtestLogSessionStartedAt,
    pendingSetupDeal: state.pendingSetupDeal,
  }
}
