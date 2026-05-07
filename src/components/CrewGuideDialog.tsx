import { useEffect } from 'react'
import { GameIcon } from './GameIcon'
import {
  getMissionPatternFuel,
  getMissionPatternLabel,
} from '../game/rules'
import type { CrewSpecialization, MissionPatternKind } from '../game/types'

type CrewGuideDialogProps = {
  isOpen: boolean
  onClose: () => void
  patternUsageCounts: Partial<Record<MissionPatternKind, number>>
}

type CrewIconPair = readonly [CrewSpecialization, CrewSpecialization]

type GuideEntry = {
  pattern: MissionPatternKind
  blurb: string
  crew: readonly CrewIconPair[]
}

// Patterns ordered from least to max Fuel reward. Ties broken so the cheaper
// crew requirement comes first (Cross-Trained needs 1 crew, Common Ground 2).
const GUIDE_ENTRIES: readonly GuideEntry[] = [
  { pattern: 'common-ground',     blurb: 'Two crew share any one icon.',                       crew: [['life', 'star'], ['life', 'engine']] },
  { pattern: 'cross-trained',     blurb: 'One crew with two different icons.',                 crew: [['life', 'star']] },
  { pattern: 'specialist',        blurb: 'One crew with two matching icons.',                  crew: [['life', 'life']] },
  { pattern: 'common-knowledge',  blurb: 'Three crew all carry the same icon.',                crew: [['life', 'life'], ['life', 'star'], ['life', 'engine']] },
  { pattern: 'department-heads',  blurb: 'Two matched specialists of different icons.',        crew: [['life', 'life'], ['engine', 'engine']] },
  { pattern: 'common-cause',      blurb: 'Four crew all carry the same icon.',                 crew: [['life', 'life'], ['life', 'star'], ['life', 'engine'], ['life', 'signal']] },
  { pattern: 'bridge-crew',       blurb: 'One matched specialist of every icon.',              crew: [['life', 'life'], ['star', 'star'], ['engine', 'engine'], ['signal', 'signal']] },
]

function CrewChip({ pair }: { pair: CrewIconPair }) {
  return (
    <span className="crew-guide-crew-chip" aria-hidden="true">
      <GameIcon kind={pair[0]} />
      <GameIcon kind={pair[1]} />
    </span>
  )
}

function CrewIconRow({ crew }: { crew: readonly CrewIconPair[] }) {
  return (
    <span className="crew-guide-icon-strip">
      {crew.map((pair, index) => (
        <CrewChip key={`${pair[0]}-${pair[1]}-${index}`} pair={pair} />
      ))}
    </span>
  )
}

export function CrewGuideDialog({ isOpen, onClose, patternUsageCounts }: CrewGuideDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="dialog-overlay crew-guide-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="arrival-panel crew-guide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crew-guide-title"
      >
        <p className="arrival-kicker">Crew Compositions</p>
        <h2 id="crew-guide-title">Crew Guide</h2>
        <p className="crew-guide-summary">
          Stack crew on a Mission to earn Fuel. Best matching pattern wins.
        </p>

        <ol className="crew-guide-table" aria-label="Crew patterns by reward">
          {GUIDE_ENTRIES.map((entry) => {
            const fuel = getMissionPatternFuel(entry.pattern)
            const used = patternUsageCounts[entry.pattern] ?? 0
            return (
              <li key={entry.pattern} className="crew-guide-row">
                <span className="crew-guide-name">{getMissionPatternLabel(entry.pattern)}</span>
                <span className="crew-guide-icons"><CrewIconRow crew={entry.crew} /></span>
                <span className="crew-guide-reward">
                  <span className="crew-guide-reward-amount">{fuel}x</span>
                  <GameIcon kind="fuel" />
                </span>
                <span className="crew-guide-count">#{used}</span>
                <span className="crew-guide-blurb">{entry.blurb}</span>
              </li>
            )
          })}
        </ol>

        <button type="button" autoFocus onClick={onClose}>
          Close Guide
        </button>
      </section>
    </div>
  )
}
