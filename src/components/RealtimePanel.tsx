import { useEffect, useState } from 'react'
import type { RealtimeConfig } from '../realtime/config'
import type { RealtimePlayer, RealtimeStatus } from '../realtime/types'

type RealtimePanelProps = {
  config: RealtimeConfig
  status: RealtimeStatus
  connectionCount: number
  players: readonly RealtimePlayer[]
}

function getStatusLabel(status: RealtimeStatus) {
  if (status === 'connected') {
    return 'Live'
  }

  if (status === 'connecting') {
    return 'Connecting'
  }

  if (status === 'error') {
    return 'Error'
  }

  return 'Offline'
}

function getRoleLabel(config: RealtimeConfig) {
  if (config.role === 'observer') {
    return 'Observer'
  }

  if (config.role === 'host') {
    return 'Host'
  }

  return 'Player'
}

export function RealtimePanel({ config, status, connectionCount, players }: RealtimePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const canSharePlayerLink = config.role !== 'observer'

  useEffect(() => {
    if (copyState === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => setCopyState('idle'), 1800)

    return () => window.clearTimeout(timeoutId)
  }, [copyState])

  async function copyPlayerUrl() {
    try {
      await navigator.clipboard.writeText(config.playerUrl)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="realtime-control">
      <button
        type="button"
        className="playtest-log-toggle realtime-toggle"
        aria-expanded={isOpen}
        aria-controls="realtime-panel"
        onClick={() => setIsOpen((current) => !current)}
      >
        Network
      </button>
      {isOpen ? (
        <aside id="realtime-panel" className="realtime-panel" aria-label="Realtime room status">
          <div className="realtime-status-row">
            <span className="realtime-role">{getRoleLabel(config)}</span>
            <span className={`realtime-status realtime-status-${status}`}>
              {getStatusLabel(status)}
            </span>
          </div>
          <div className="realtime-room-row">
            <span>{config.room}</span>
            <span>{connectionCount}</span>
          </div>
          {players.length > 0 ? (
            <div className="realtime-players" aria-label="Players in room">
              {players.map((player) => (
                <span className={player.isConnected ? 'is-connected' : 'is-disconnected'} key={player.id}>
                  {player.name}
                </span>
              ))}
            </div>
          ) : null}
          {canSharePlayerLink ? (
            <button
              type="button"
              className="realtime-share"
              onClick={copyPlayerUrl}
              aria-label="Copy player link"
            >
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy player link'}
            </button>
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}
