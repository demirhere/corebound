import { useEffect, useRef } from 'react'
import { formatConsoleLogEntry, type PlaytestLogEntry } from '../game/playtestLog'

export function usePlaytestLogConsole(playtestLog: readonly PlaytestLogEntry[]) {
  const lastConsoleLogIdRef = useRef(0)

  useEffect(() => {
    const newEntries = playtestLog.filter((entry) => entry.id > lastConsoleLogIdRef.current)

    for (const entry of newEntries) {
      console.info(formatConsoleLogEntry(entry), entry)
    }

    const lastEntry = newEntries.at(-1)

    if (lastEntry) {
      lastConsoleLogIdRef.current = lastEntry.id
    }
  }, [playtestLog])

  return () => {
    lastConsoleLogIdRef.current = 0
  }
}
