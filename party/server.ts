import type * as Party from 'partykit/server'
import type {
  ClientRealtimeMessage,
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

  onClose() {
    this.broadcastPresence()
  }

  onError() {
    this.broadcastPresence()
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    const parsed = parseClientMessage(message)

    if (!parsed) {
      return
    }

    if (parsed.type === 'host-snapshot') {
      this.latestSnapshot = parsed.snapshot
      this.room.broadcast(serialize({
        type: 'snapshot',
        snapshot: parsed.snapshot,
      }), [sender.id])
      return
    }

    if (parsed.type === 'host-drag') {
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
    }), {
      headers: {
        'content-type': 'application/json;charset=utf-8',
      },
    })
  }

  private getConnectionCount() {
    return Array.from(this.room.getConnections()).length
  }

  private broadcastPresence() {
    this.room.broadcast(serialize({
      type: 'presence',
      connections: this.getConnectionCount(),
    }))
  }
}
