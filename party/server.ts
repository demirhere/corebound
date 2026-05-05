import type * as Party from 'partykit/server'
import type {
  ClientRealtimeMessage,
  RealtimePlayer,
  RealtimeRole,
  RealtimeSnapshot,
  ServerRealtimeMessage,
} from '../src/realtime/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseClientMessage(message: string | ArrayBuffer | ArrayBufferView) {
  if (typeof message !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(message) as unknown

    return isRecord(parsed) && typeof parsed.type === 'string'
      ? parsed as ClientRealtimeMessage
      : null
  } catch {
    return null
  }
}

function serialize(message: ServerRealtimeMessage) {
  return JSON.stringify(message)
}

export default class CoreboundRoom implements Party.Server {
  readonly options = {
    hibernate: false,
  }

  private latestSnapshot: RealtimeSnapshot | null = null
  private readonly playerIds: string[] = []
  private readonly playerNames = new Map<string, string>()
  private readonly connectedPlayerIds = new Set<string>()
  private readonly room: Party.Room

  constructor(room: Party.Room) {
    this.room = room
  }

  onConnect(connection: Party.Connection) {
    connection.send(serialize({
      type: 'sync-snapshot',
      snapshot: this.latestSnapshot,
    }))
    this.broadcastPresence()
  }

  onClose(connection: Party.Connection) {
    this.connectedPlayerIds.delete(connection.id)

    if (!this.isRosterLocked()) {
      this.removePlayer(connection.id)
    }

    this.broadcastPresence()
  }

  onError(connection: Party.Connection) {
    this.connectedPlayerIds.delete(connection.id)

    if (!this.isRosterLocked()) {
      this.removePlayer(connection.id)
    }

    this.broadcastPresence()
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    const parsed = parseClientMessage(message)

    if (!parsed) {
      return
    }

    if (parsed.type === 'client-hello') {
      this.updatePlayerRoster(sender.id, parsed.role)
      this.broadcastPresence()
      return
    }

    if (parsed.type === 'host-snapshot' || parsed.type === 'player-snapshot') {
      this.latestSnapshot = parsed.snapshot
      this.room.broadcast(serialize({
        type: 'snapshot',
        snapshot: parsed.snapshot,
      }), [sender.id])
      return
    }

    if (parsed.type === 'host-drag' || parsed.type === 'player-drag') {
      this.room.broadcast(serialize({
        type: 'drag',
        drag: parsed.drag,
      }), [sender.id])
    }
  }

  onRequest() {
    return new Response(JSON.stringify({
      room: this.room.id,
      connections: this.getConnectionCount(),
      hasSnapshot: this.latestSnapshot !== null,
      updatedAt: this.latestSnapshot?.updatedAt ?? null,
      players: this.getPlayers(),
    }), {
      headers: {
        'content-type': 'application/json;charset=utf-8',
      },
    })
  }

  private getConnectionCount() {
    return Array.from(this.room.getConnections()).length
  }

  private isRosterLocked() {
    return this.latestSnapshot?.ui.isGameStarted === true
  }

  private updatePlayerRoster(connectionId: string, role: RealtimeRole) {
    if (role === 'observer') {
      this.connectedPlayerIds.delete(connectionId)
      return
    }

    const existingPlayer = this.playerIds.includes(connectionId)

    if (!existingPlayer && this.isRosterLocked()) {
      return
    }

    if (!existingPlayer) {
      this.playerIds.push(connectionId)
      this.playerNames.set(connectionId, `Player ${this.playerIds.length}`)
    }

    this.connectedPlayerIds.add(connectionId)
  }

  private removePlayer(connectionId: string) {
    const playerIndex = this.playerIds.indexOf(connectionId)

    if (playerIndex === -1) {
      return
    }

    this.playerIds.splice(playerIndex, 1)
    this.playerNames.delete(connectionId)
  }

  private getPlayers(): RealtimePlayer[] {
    return this.playerIds.map((id, index) => ({
      id,
      name: this.playerNames.get(id) ?? `Player ${index + 1}`,
      isConnected: this.connectedPlayerIds.has(id),
    }))
  }

  private broadcastPresence() {
    this.room.broadcast(serialize({
      type: 'presence',
      connections: this.getConnectionCount(),
      players: this.getPlayers(),
    }))
  }
}
