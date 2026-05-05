import { useEffect, useState } from 'react'

type LobbyInvitePanelProps = {
  roomCode: string
  playerUrl: string
}

export function LobbyInvitePanel({ roomCode, playerUrl }: LobbyInvitePanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (copyState === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => setCopyState('idle'), 1800)

    return () => window.clearTimeout(timeoutId)
  }, [copyState])

  async function copyPlayerLink() {
    try {
      await navigator.clipboard.writeText(playerUrl)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <aside className="lobby-invite-panel" aria-label="Multiplayer invite">
      <span className="lobby-invite-label">Table Code</span>
      <strong className="lobby-invite-code" aria-label={`Table code ${roomCode}`}>
        {roomCode}
      </strong>
      <button type="button" className="lobby-invite-copy" onClick={copyPlayerLink}>
        {copyState === 'copied'
          ? 'Copied'
          : copyState === 'failed'
            ? 'Copy failed'
            : 'Copy link'}
      </button>
    </aside>
  )
}
