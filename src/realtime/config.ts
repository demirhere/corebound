import type { RealtimeRole } from './types'

const DEFAULT_ROOM = 'corebound-table'
const HOST_ROOM_CODE_STORAGE_KEY = 'corebound:host-room-code'
const ROOM_CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOCAL_PARTYKIT_PORT = 1999
const PRODUCTION_PARTYKIT_HOST = 'corebound.demirhere.partykit.dev'

export type RealtimeConfig = {
  enabled: boolean
  host: string
  room: string
  role: RealtimeRole
  playerUrl: string
  observerUrl: string
}

function trimProtocol(host: string) {
  return host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '')
}

function readRole(params: URLSearchParams): RealtimeRole {
  const role = params.get('role')

  if (role === 'observer') {
    return 'observer'
  }

  if (role === 'player') {
    return 'player'
  }

  return 'host'
}

function createRoomCode() {
  return Array.from({ length: 4 }, () => (
    ROOM_CODE_LETTERS[Math.floor(Math.random() * ROOM_CODE_LETTERS.length)] ?? 'A'
  )).join('')
}

function readStoredRoomCode() {
  const storedRoomCode = window.sessionStorage.getItem(HOST_ROOM_CODE_STORAGE_KEY)

  return storedRoomCode && /^[A-Z]{4}$/.test(storedRoomCode)
    ? storedRoomCode
    : null
}

function getOrCreateRoomCode() {
  const storedRoomCode = readStoredRoomCode()

  if (storedRoomCode) {
    return storedRoomCode
  }

  const roomCode = createRoomCode()

  window.sessionStorage.setItem(HOST_ROOM_CODE_STORAGE_KEY, roomCode)
  return roomCode
}

function readRoom(params: URLSearchParams) {
  const room = params.get('room')?.trim()

  return room || getOrCreateRoomCode() || DEFAULT_ROOM
}

function getDefaultHost() {
  const { hostname } = window.location
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)

  return isLocalHost
    ? `${hostname || 'localhost'}:${LOCAL_PARTYKIT_PORT}`
    : PRODUCTION_PARTYKIT_HOST
}

function readHost(params: URLSearchParams) {
  const queryHost = params.get('partyHost')
  const envHost = import.meta.env.VITE_PARTYKIT_HOST as string | undefined

  return trimProtocol(queryHost ?? envHost ?? getDefaultHost())
}

function buildRealtimeUrl(room: string, partyHost: string, role: RealtimeRole) {
  const url = new URL(window.location.href)

  url.searchParams.set('room', room)
  url.searchParams.set('role', role)
  url.searchParams.set('partyHost', partyHost)

  return url.toString()
}

function syncGeneratedHostRoomUrl(params: URLSearchParams, room: string, role: RealtimeRole) {
  if (role !== 'host' || params.has('room') || params.get('realtime') === 'off') {
    return
  }

  const url = new URL(window.location.href)

  url.searchParams.set('room', room)
  window.history.replaceState(null, '', url)
}

export function readRealtimeConfig(): RealtimeConfig {
  const params = new URLSearchParams(window.location.search)
  const room = readRoom(params)
  const host = readHost(params)
  const role = readRole(params)

  syncGeneratedHostRoomUrl(params, room, role)

  return {
    enabled: params.get('realtime') !== 'off',
    host,
    room,
    role,
    playerUrl: buildRealtimeUrl(room, host, 'player'),
    observerUrl: buildRealtimeUrl(room, host, 'observer'),
  }
}
