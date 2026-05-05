import type { GameState } from '../game/state'
import type { GamePlayer } from '../game/types'

export type RealtimeRole = 'host' | 'player' | 'observer'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export type RealtimePlayer = GamePlayer & {
  isConnected: boolean
}

export type SharedDragPreview =
  | {
      kind: 'stack'
      stackId: string
      x: number
      y: number
    }
  | {
      kind: 'deck'
      deckId: string
      x: number
      y: number
    }

export type RealtimeSnapshot = {
  game: GameState
  ui: {
    isHowToPlayOpen: boolean
    isGameStarted: boolean
  }
  updatedAt: string
  hostId?: string
  playerId: string
}

export type ClientRealtimeMessage =
  | {
      type: 'client-hello'
      role: RealtimeRole
    }
  | {
      type: 'host-snapshot'
      snapshot: RealtimeSnapshot
    }
  | {
      type: 'player-snapshot'
      snapshot: RealtimeSnapshot
    }
  | {
      type: 'host-drag'
      drag: SharedDragPreview | null
    }
  | {
      type: 'player-drag'
      drag: SharedDragPreview | null
    }

export type ServerRealtimeMessage =
  | {
      type: 'sync-snapshot'
      snapshot: RealtimeSnapshot | null
    }
  | {
      type: 'snapshot'
      snapshot: RealtimeSnapshot
    }
  | {
      type: 'drag'
      drag: SharedDragPreview | null
    }
  | {
      type: 'presence'
      connections: number
      players: RealtimePlayer[]
    }
