export type PlaytestLogDetailValue = string | number | boolean | null | readonly string[]

export type PlaytestLogEvent = {
  type: string
  message: string
  details?: Record<string, PlaytestLogDetailValue>
}

export type PlaytestLogEntry = PlaytestLogEvent & {
  id: number
  timestamp: string
}

export type AppendedPlaytestLog = {
  entries: PlaytestLogEntry[]
  nextLogId: number
}

function formatDetailValue(value: PlaytestLogDetailValue) {
  return Array.isArray(value) ? value.join(',') : String(value)
}

function formatDetails(details: PlaytestLogEntry['details']) {
  if (!details) {
    return ''
  }

  const detailText = Object.entries(details)
    .map(([key, value]) => `${key}=${formatDetailValue(value)}`)
    .join(' ')

  return detailText ? ` (${detailText})` : ''
}

export function appendPlaytestEvents(
  entries: PlaytestLogEntry[],
  nextLogId: number,
  events: readonly PlaytestLogEvent[],
  timestamp: string,
): AppendedPlaytestLog {
  if (events.length === 0) {
    return { entries, nextLogId }
  }

  let currentLogId = nextLogId
  const nextEntries = events.map((event) => ({
    ...event,
    id: currentLogId++,
    timestamp,
  }))

  return {
    entries: [...entries, ...nextEntries],
    nextLogId: currentLogId,
  }
}

export function formatPlaytestLogEntry(entry: PlaytestLogEntry) {
  return `${entry.id}. [${entry.timestamp}] ${entry.type}: ${entry.message}${formatDetails(entry.details)}`
}

export function formatPlaytestLog(entries: readonly PlaytestLogEntry[]) {
  if (entries.length === 0) {
    return 'No playtest events recorded.'
  }

  return entries.map(formatPlaytestLogEntry).join('\n')
}

export function formatConsoleLogEntry(entry: PlaytestLogEntry) {
  return `[Corebound Playtest #${entry.id}] ${entry.message}`
}
