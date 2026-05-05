import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import PartySocket from 'partysocket'
import type { GameAction, GameState } from '../game/state'
import type { RealtimeConfig } from './config'
import type {
  ClientRealtimeMessage,
  RealtimeSnapshot,
  RealtimeStatus,
  ServerRealtimeMessage,
  SharedDragPreview,
} from './types'

type UsePartyKitSyncArgs = {
  config: RealtimeConfig
  game: GameState
  isHowToPlayOpen: boolean
  dispatchGame: Dispatch<GameAction>
  setIsHowToPlayOpen: (isOpen: boolean) => void
}

function createClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `client-${Math.random().toString(36).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseServerMessage(data: unknown): ServerRealtimeMessage | null {
  if (typeof data !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(data) as unknown

    return isRecord(parsed) && typeof parsed.type === 'string'
      ? parsed as ServerRealtimeMessage
      : null
  } catch {
    return null
  }
}

function sendMessage(socket: PartySocket, message: ClientRealtimeMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

export function usePartyKitSync({
  config,
  game,
  isHowToPlayOpen,
  dispatchGame,
  setIsHowToPlayOpen,
}: UsePartyKitSyncArgs) {
  const [clientId] = useState(() => createClientId())
  const socketRef = useRef<PartySocket | null>(null)
  const latestGameRef = useRef(game)
  const latestHowToPlayRef = useRef(isHowToPlayOpen)
  const remoteDragClearTimeoutRef = useRef<number | null>(null)
  const [status, setStatus] = useState<RealtimeStatus>(
    config.enabled ? 'connecting' : 'disconnected',
  )
  const [connectionCount, setConnectionCount] = useState(1)
  const [remoteDrag, setRemoteDrag] = useState<SharedDragPreview | null>(null)

  useEffect(() => {
    latestGameRef.current = game
  }, [game])

  useEffect(() => {
    latestHowToPlayRef.current = isHowToPlayOpen
  }, [isHowToPlayOpen])

  const createSnapshot = useCallback((): RealtimeSnapshot => ({
    game: latestGameRef.current,
    ui: {
      isHowToPlayOpen: latestHowToPlayRef.current,
    },
    updatedAt: new Date().toISOString(),
    hostId: clientId,
  }), [clientId])

  const sendSnapshot = useCallback(() => {
    const socket = socketRef.current

    if (!socket || config.role !== 'host') {
      return
    }

    sendMessage(socket, {
      type: 'host-snapshot',
      snapshot: createSnapshot(),
    })
  }, [config.role, createSnapshot])

  const clearRemoteDrag = useCallback(() => {
    if (remoteDragClearTimeoutRef.current !== null) {
      window.clearTimeout(remoteDragClearTimeoutRef.current)
      remoteDragClearTimeoutRef.current = null
    }

    setRemoteDrag(null)
  }, [])

  const scheduleRemoteDragClear = useCallback(() => {
    if (remoteDragClearTimeoutRef.current !== null) {
      window.clearTimeout(remoteDragClearTimeoutRef.current)
    }

    remoteDragClearTimeoutRef.current = window.setTimeout(() => {
      remoteDragClearTimeoutRef.current = null
      setRemoteDrag(null)
    }, 220)
  }, [])

  useEffect(() => {
    if (!config.enabled) {
      return
    }

    const socket = new PartySocket({
      host: config.host,
      room: config.room,
      id: clientId,
      query: {
        role: config.role,
      },
    })

    socketRef.current = socket

    function handleOpen() {
      setStatus('connected')

      if (config.role === 'host') {
        sendSnapshot()
      }
    }

    function handleClose() {
      setStatus('disconnected')
    }

    function handleError() {
      setStatus('error')
    }

    function applySnapshot(snapshot: RealtimeSnapshot) {
      if (config.role !== 'observer') {
        return
      }

      clearRemoteDrag()
      dispatchGame({ type: 'hydrate-game', state: snapshot.game })
      setIsHowToPlayOpen(snapshot.ui.isHowToPlayOpen)
    }

    function handleMessage(event: MessageEvent) {
      const message = parseServerMessage(event.data)

      if (!message) {
        return
      }

      if (message.type === 'presence') {
        setConnectionCount(message.connections)
        return
      }

      if (message.type === 'sync-snapshot') {
        if (message.snapshot) {
          applySnapshot(message.snapshot)
        }
        return
      }

      if (message.type === 'snapshot') {
        applySnapshot(message.snapshot)
        return
      }

      if (message.type === 'drag' && config.role === 'observer') {
        if (message.drag) {
          if (remoteDragClearTimeoutRef.current !== null) {
            window.clearTimeout(remoteDragClearTimeoutRef.current)
            remoteDragClearTimeoutRef.current = null
          }
          setRemoteDrag(message.drag)
        } else {
          scheduleRemoteDragClear()
        }
      }
    }

    socket.addEventListener('open', handleOpen)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('error', handleError)
    socket.addEventListener('message', handleMessage)

    return () => {
      socket.removeEventListener('open', handleOpen)
      socket.removeEventListener('close', handleClose)
      socket.removeEventListener('error', handleError)
      socket.removeEventListener('message', handleMessage)
      socket.close()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [
    clearRemoteDrag,
    clientId,
    config.enabled,
    config.host,
    config.role,
    config.room,
    dispatchGame,
    scheduleRemoteDragClear,
    sendSnapshot,
    setIsHowToPlayOpen,
  ])

  useEffect(() => {
    if (!config.enabled || config.role !== 'host') {
      return
    }

    sendSnapshot()
  }, [config.enabled, config.role, game, isHowToPlayOpen, sendSnapshot])

  useEffect(() => {
    return () => {
      if (remoteDragClearTimeoutRef.current !== null) {
        window.clearTimeout(remoteDragClearTimeoutRef.current)
      }
    }
  }, [])

  const sendSharedDrag = useCallback((drag: SharedDragPreview | null) => {
    const socket = socketRef.current

    if (!socket || !config.enabled || config.role !== 'host') {
      return
    }

    sendMessage(socket, {
      type: 'host-drag',
      drag,
    })
  }, [config.enabled, config.role])

  return {
    status,
    connectionCount,
    remoteDrag,
    sendSharedDrag,
  }
}
