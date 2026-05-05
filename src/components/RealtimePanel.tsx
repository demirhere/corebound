import { useEffect, useState } from 'react'
import type { RealtimeConfig } from '../realtime/config'
import type { RealtimeStatus } from '../realtime/types'

type RealtimePanelProps = {
  config: RealtimeConfig
  status: RealtimeStatus
  connectionCount: number
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

export function RealtimePanel({ config, status, connectionCount }: RealtimePanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const isHost = config.role === 'host'

  useEffect(() => {
    if (copyState === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => setCopyState('idle'), 1800)

    return () => window.clearTimeout(timeoutId)
  }, [copyState])

  async function copyObserverUrl() {
    try {
      await navigator.clipboard.writeText(config.observerUrl)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <aside className="realtime-panel" aria-label="Realtime room status">
      <div className="realtime-status-row">
        <span className="realtime-role">{isHost ? 'Host' : 'Observer'}</span>
        <span className={`realtime-status realtime-status-${status}`}>
          {getStatusLabel(status)}
        </span>
      </div>
      <div className="realtime-room-row">
        <span>{config.room}</span>
        <span>{connectionCount}</span>
      </div>
      {isHost ? (
        <button
          type="button"
          className="realtime-share"
          onClick={copyObserverUrl}
          aria-label="Copy observer link"
        >
          {copyState === 'copied'
            ? 'Copied'
            : copyState === 'failed'
              ? 'Copy failed'
              : 'Copy observer link'}
        </button>
      ) : null}
    </aside>
  )
}
