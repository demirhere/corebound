import { useState } from 'react'
import {
  formatPlaytestLog,
  type PlaytestLogEntry,
} from '../game/playtestLog'

type PlaytestLogProps = {
  entries: readonly PlaytestLogEntry[]
  onResetGame: () => void
}

export function PlaytestLog({ entries, onResetGame }: PlaytestLogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedEntryCount, setCopiedEntryCount] = useState<number | null>(null)
  const [copyFailed, setCopyFailed] = useState(false)
  const visibleEntries = [...entries].reverse()
  const copyState = copyFailed ? 'failed' : copiedEntryCount === entries.length ? 'copied' : 'idle'

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(formatPlaytestLog(entries))
      setCopiedEntryCount(entries.length)
      setCopyFailed(false)
    } catch {
      setCopyFailed(true)
    }
  }

  function resetGame() {
    setCopiedEntryCount(null)
    setCopyFailed(false)
    onResetGame()
  }

  return (
    <aside className="playtest-log" aria-label="Playtest log controls">
      <div className="playtest-log-controls">
        <button
          type="button"
          className="playtest-log-reset"
          aria-label="Reset board and clear log"
          title="Reset board and clear log"
          onClick={resetGame}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 12a8 8 0 1 0 2.34-5.66" />
            <path d="M4 4v6h6" />
          </svg>
        </button>
        <button
          type="button"
          className="playtest-log-toggle"
          aria-expanded={isOpen}
          aria-controls="playtest-log-panel"
          onClick={() => setIsOpen((current) => !current)}
        >
          Log
        </button>
      </div>

      {isOpen ? (
        <section id="playtest-log-panel" className="playtest-log-panel" aria-label="Logged playtest events">
          <header className="playtest-log-actions">
            <button
              type="button"
              className="playtest-log-copy"
              aria-label={copyState === 'copied' ? 'Log copied' : 'Copy log'}
              title={copyState === 'copied' ? 'Copied' : 'Copy log'}
              onClick={copyLog}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M8 8h10v12H8z" />
                <path d="M5 16V4h11" />
              </svg>
            </button>
          </header>

          {copyState === 'failed' ? (
            <p className="playtest-log-status" role="status">
              Copy failed. Browser clipboard access is unavailable.
            </p>
          ) : null}

          {visibleEntries.length === 0 ? (
            <p className="playtest-log-empty">No events yet. Draw, move, flip, stack, or hand cards to log actions.</p>
          ) : (
            <ol className="playtest-log-list">
              {visibleEntries.map((entry) => (
                <li key={entry.id} className="playtest-log-entry">
                  <span className="playtest-log-entry-time">#{entry.id}</span>
                  <span className="playtest-log-entry-type">{entry.type}</span>
                  <p>{entry.message}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    </aside>
  )
}
