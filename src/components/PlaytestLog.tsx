import { useState } from 'react'
import {
  formatPlaytestLog,
  type PlaytestLogEntry,
  type PlaytestLogSession,
} from '../game/playtestLog'

const CURRENT_LOG_KEY = 'current'

type PlaytestLogProps = {
  entries: readonly PlaytestLogEntry[]
  previousSessions: readonly PlaytestLogSession[]
  onResetGame: () => void
}

function formatSessionTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatEventCount(count: number) {
  return `${count} ${count === 1 ? 'event' : 'events'}`
}

export function PlaytestLog({ entries, previousSessions, onResetGame }: PlaytestLogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLogKey, setSelectedLogKey] = useState(CURRENT_LOG_KEY)
  const [copiedLog, setCopiedLog] = useState<{ key: string; entryCount: number } | null>(null)
  const [copyFailed, setCopyFailed] = useState(false)
  const selectedPreviousSession = selectedLogKey === CURRENT_LOG_KEY
    ? null
    : previousSessions.find((session) => String(session.id) === selectedLogKey) ?? null
  const activeLogKey = selectedPreviousSession ? String(selectedPreviousSession.id) : CURRENT_LOG_KEY
  const activeEntries = selectedPreviousSession ? selectedPreviousSession.entries : entries
  const visibleEntries = [...activeEntries].reverse()
  const copyState = copyFailed
    ? 'failed'
    : copiedLog?.key === activeLogKey && copiedLog.entryCount === activeEntries.length
      ? 'copied'
      : 'idle'

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(formatPlaytestLog(activeEntries))
      setCopiedLog({ key: activeLogKey, entryCount: activeEntries.length })
      setCopyFailed(false)
    } catch {
      setCopyFailed(true)
    }
  }

  function selectLog(key: string) {
    setSelectedLogKey(key)
    setCopyFailed(false)
  }

  function resetGame() {
    setSelectedLogKey(CURRENT_LOG_KEY)
    setCopiedLog(null)
    setCopyFailed(false)
    onResetGame()
  }

  return (
    <aside className="playtest-log" aria-label="Playtest log controls">
      <div className="playtest-log-controls">
        <button
          type="button"
          className="playtest-log-reset"
          aria-label="Reset board and archive log"
          title="Reset board and archive log"
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
            {previousSessions.length > 0 ? (
              <label className="playtest-log-session-picker">
                <span>Session</span>
                <select value={activeLogKey} onChange={(event) => selectLog(event.currentTarget.value)}>
                  <option value={CURRENT_LOG_KEY}>Current - {formatEventCount(entries.length)}</option>
                  {previousSessions.map((session) => (
                    <option key={session.id} value={String(session.id)}>
                      Previous {session.id} - {formatEventCount(session.entries.length)} - reset{' '}
                      {formatSessionTime(session.endedAt)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="playtest-log-session-label">Current session</p>
            )}
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
          ) : selectedPreviousSession ? (
            <p className="playtest-log-status playtest-log-archive-status" role="status">
              Viewing archived log reset at {formatSessionTime(selectedPreviousSession.endedAt)}.
            </p>
          ) : null}

          {visibleEntries.length === 0 ? (
            <p className="playtest-log-empty">No events yet. Draw, move, flip, stack, or hand cards to log actions.</p>
          ) : (
            <ol className="playtest-log-list">
              {visibleEntries.map((entry) => (
                <li key={`${activeLogKey}-${entry.id}`} className="playtest-log-entry">
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
