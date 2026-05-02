import { createInitialBoardSetup } from './setup'
import type { BoardState } from './types'
import {
  appendPlaytestEvents,
  type PlaytestLogEntry,
  type PlaytestLogEvent,
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
}

export type GameAction =
  | {
      type: 'apply-board-update'
      update: BoardUpdater
      occurredAt: string
    }
  | {
      type: 'reset-game'
    }

export function createInitialGameState(): GameState {
  const setup = createInitialBoardSetup()
  const playtestLog = appendPlaytestEvents([], 1, setup.events, new Date().toISOString())

  return {
    board: setup.board,
    playtestLog: playtestLog.entries,
    nextLogId: playtestLog.nextLogId,
  }
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
    return createInitialGameState()
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
  }
}
