import type { GameState } from '../game/state'

export type RealtimeRole = 'host' | 'observer'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

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
  }
  updatedAt: string
  hostId: string
}

export type ClientRealtimeMessage =
  | {
      type: 'host-snapshot'
      snapshot: RealtimeSnapshot
    }
  | {
      type: 'host-drag'
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
    }
