import { createInitialBoardSetup } from './setup'
import type { BoardState } from './types'
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

export type GameState = {
  board: BoardState
  playtestLog: PlaytestLogEntry[]
  nextLogId: number
  previousPlaytestLogSessions: PlaytestLogSession[]
  nextPlaytestLogSessionId: number
  playtestLogSessionStartedAt: string
}

export type GameAction =
  | {
      type: 'apply-board-update'
      update: BoardUpdater
      occurredAt: string
    }
  | {
      type: 'reset-game'
      occurredAt: string
    }

function createGameState(
  startedAt: string,
  previousPlaytestLogSessions: PlaytestLogSession[] = [],
  nextPlaytestLogSessionId = 1,
): GameState {
  const setup = createInitialBoardSetup()
  const playtestLog = appendPlaytestEvents([], 1, setup.events, startedAt)

  return {
    board: setup.board,
    playtestLog: playtestLog.entries,
    nextLogId: playtestLog.nextLogId,
    previousPlaytestLogSessions,
    nextPlaytestLogSessionId,
    playtestLogSessionStartedAt: startedAt,
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

export function gameReducer(state: GameState, action: GameAction): GameState {
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
      previousPlaytestLogSessions,
      state.nextPlaytestLogSessionId + (state.playtestLog.length > 0 ? 1 : 0),
    )
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
  }
}
