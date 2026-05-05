import type { RealtimeRole } from './types'

const DEFAULT_ROOM = 'corebound-table'
const LOCAL_PARTYKIT_PORT = 1999
const PRODUCTION_PARTYKIT_HOST = 'corebound.demirhere.partykit.dev'

export type RealtimeConfig = {
  enabled: boolean
  host: string
  room: string
  role: RealtimeRole
  observerUrl: string
}

function trimProtocol(host: string) {
  return host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '')
}

function readRole(params: URLSearchParams): RealtimeRole {
  return params.get('role') === 'observer' ? 'observer' : 'host'
}

function readRoom(params: URLSearchParams) {
  return (params.get('room') ?? DEFAULT_ROOM).trim() || DEFAULT_ROOM
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

function buildObserverUrl(room: string, partyHost: string) {
  const url = new URL(window.location.href)

  url.searchParams.set('room', room)
  url.searchParams.set('role', 'observer')
  url.searchParams.set('partyHost', partyHost)

  return url.toString()
}

export function readRealtimeConfig(): RealtimeConfig {
  const params = new URLSearchParams(window.location.search)
  const room = readRoom(params)
  const host = readHost(params)

  return {
    enabled: params.get('realtime') !== 'off',
    host,
    room,
    role: readRole(params),
    observerUrl: buildObserverUrl(room, host),
  }
}
