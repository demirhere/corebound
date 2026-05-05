import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import PartySocket from 'partysocket'
import type { GameAction, GameState } from '../game/state'
import type { RealtimeConfig } from './config'
import type {
  ClientRealtimeMessage,
  RealtimeSnapshot,
  RealtimePlayer,
  RealtimeStatus,
  ServerRealtimeMessage,
  SharedDragPreview,
} from './types'

type UsePartyKitSyncArgs = {
  config: RealtimeConfig
  game: GameState
  isHowToPlayOpen: boolean
  isGameStarted: boolean
  dispatchGame: Dispatch<GameAction>
  setIsHowToPlayOpen: (isOpen: boolean) => void
  setIsGameStarted: (isStarted: boolean) => void
}

function createClientId(room: string) {
  const storageKey = `corebound:client-id:${room}`
  const storedClientId = window.sessionStorage.getItem(storageKey)

  if (storedClientId) {
    return storedClientId
  }

  const clientId = globalThis.crypto?.randomUUID?.() ?? `client-${Math.random().toString(36).slice(2)}`

  window.sessionStorage.setItem(storageKey, clientId)
  return clientId
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
  isGameStarted,
  dispatchGame,
  setIsHowToPlayOpen,
  setIsGameStarted,
}: UsePartyKitSyncArgs) {
  const [clientId] = useState(() => createClientId(config.room))
  const socketRef = useRef<PartySocket | null>(null)
  const latestGameRef = useRef(game)
  const latestHowToPlayRef = useRef(isHowToPlayOpen)
  const latestIsGameStartedRef = useRef(isGameStarted)
  const isApplyingRemoteSnapshotRef = useRef(false)
  const remoteDragClearTimeoutRef = useRef<number | null>(null)
  const [status, setStatus] = useState<RealtimeStatus>(
    config.enabled ? 'connecting' : 'disconnected',
  )
  const [connectionCount, setConnectionCount] = useState(1)
  const [players, setPlayers] = useState<RealtimePlayer[]>([])
  const [remoteDrag, setRemoteDrag] = useState<SharedDragPreview | null>(null)

  useEffect(() => {
    latestGameRef.current = game
  }, [game])

  useEffect(() => {
    latestHowToPlayRef.current = isHowToPlayOpen
  }, [isHowToPlayOpen])

  useEffect(() => {
    latestIsGameStartedRef.current = isGameStarted
  }, [isGameStarted])

  const createSnapshot = useCallback((): RealtimeSnapshot => ({
    game: latestGameRef.current,
    ui: {
      isHowToPlayOpen: latestHowToPlayRef.current,
      isGameStarted: latestIsGameStartedRef.current,
    },
    updatedAt: new Date().toISOString(),
    hostId: clientId,
    playerId: clientId,
  }), [clientId])

  const sendSnapshot = useCallback(() => {
    const socket = socketRef.current

    if (!socket || config.role === 'observer') {
      return
    }

    sendMessage(socket, {
      type: config.role === 'host' ? 'host-snapshot' : 'player-snapshot',
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

      sendMessage(socket, {
        type: 'client-hello',
        role: config.role,
      })

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
      clearRemoteDrag()
      isApplyingRemoteSnapshotRef.current = true
      dispatchGame({ type: 'hydrate-game', state: snapshot.game })
      setIsHowToPlayOpen(snapshot.ui.isHowToPlayOpen === true)
      setIsGameStarted(snapshot.ui.isGameStarted === true)
    }

    function handleMessage(event: MessageEvent) {
      const message = parseServerMessage(event.data)

      if (!message) {
        return
      }

      if (message.type === 'presence') {
        setConnectionCount(message.connections)
        setPlayers(Array.isArray(message.players) ? message.players : [])
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

      if (message.type === 'drag') {
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
    setIsGameStarted,
  ])

  useEffect(() => {
    if (!config.enabled || config.role === 'observer') {
      return
    }

    if (isApplyingRemoteSnapshotRef.current) {
      isApplyingRemoteSnapshotRef.current = false
      return
    }

    sendSnapshot()
  }, [config.enabled, config.role, game, isGameStarted, isHowToPlayOpen, sendSnapshot])

  useEffect(() => {
    return () => {
      if (remoteDragClearTimeoutRef.current !== null) {
        window.clearTimeout(remoteDragClearTimeoutRef.current)
      }
    }
  }, [])

  const sendSharedDrag = useCallback((drag: SharedDragPreview | null) => {
    const socket = socketRef.current

    if (!socket || !config.enabled || config.role === 'observer') {
      return
    }

    sendMessage(socket, {
      type: config.role === 'host' ? 'host-drag' : 'player-drag',
      drag,
    })
  }, [config.enabled, config.role])

  return {
    status,
    connectionCount,
    clientId,
    players,
    remoteDrag,
    sendSharedDrag,
  }
}
