import { useEffect } from 'react'
import { GameIcon } from './GameIcon'
import {
  getMissionPatternFuel,
  getMissionPatternLabel,
} from '../game/rules'
import type {
  ActiveCrewQuarters,
  ActiveShipPart,
  CrewSpecialization,
  MissionPatternKind,
} from '../game/types'

type CrewGuideDialogProps = {
  isOpen: boolean
  onClose: () => void
  patternUsageCounts: Partial<Record<MissionPatternKind, number>>
  activeShipParts: readonly ActiveShipPart[]
  activeCrewQuarters: readonly ActiveCrewQuarters[]
}

// Sum the fuel a player's owned ship parts AND researched Crew Quarter Upgrades
// will *guaranteed* add to a given pattern when it is played. Includes
// effects whose contribution is fully determined by pattern + crew count
// (so the guide can show a real number), and excludes timing/icon/run-state
// effects that can't be resolved here.
function getPatternFuelBonus(
  pattern: MissionPatternKind,
  crewCount: number,
  parts: readonly ActiveShipPart[],
  quarters: readonly ActiveCrewQuarters[],
): { bonus: number, sources: readonly string[] } {
  let bonus = 0
  const sources: string[] = []
  for (const part of parts) {
    let partBonus = 0
    for (const effect of part.effects) {
      if (effect.kind === 'pattern' && effect.patterns.includes(pattern)) {
        partBonus += effect.fuel
      } else if (effect.kind === 'pattern-tier' && effect.patterns.includes(pattern)) {
        partBonus += effect.fuel
      } else if (effect.kind === 'crew-count-cap' && crewCount <= effect.maxCrew) {
        partBonus += effect.fuel
      } else if (effect.kind === 'per-crew-used') {
        partBonus += Math.min(effect.maxFuel, crewCount * effect.fuelPerCrew)
      }
    }
    if (partBonus > 0) {
      bonus += partBonus
      sources.push(`+${partBonus} ${part.label}`)
    }
  }
  const quartersForPattern = quarters.filter((entry) => entry.pattern === pattern)
  if (quartersForPattern.length > 0) {
    const quartersBonus = quartersForPattern.reduce(
      (sum, entry) => sum + entry.fuelPerPlay,
      0,
    )
    bonus += quartersBonus
    sources.push(
      quartersForPattern.length > 1
        ? `+${quartersBonus} Crew Quarters Upgrade ×${quartersForPattern.length}`
        : `+${quartersBonus} Crew Quarters Upgrade`,
    )
  }
  return { bonus, sources }
}

type CrewIconPair = readonly [CrewSpecialization, CrewSpecialization]

type CrewGuideEntry = {
  pattern: MissionPatternKind
  blurb: string
  crew: readonly CrewIconPair[]
  sharedIcon?: CrewSpecialization
}

// Patterns ordered from max to least Fuel reward. Ties broken so the
// fewer-crew option ranks higher (Department Heads needs 2 crew vs Common
// Cause's 4 for the same Fuel; Specialist needs 1 crew vs Common Ground's 2).
const GUIDE_ENTRIES: readonly CrewGuideEntry[] = [
  { pattern: 'bridge-crew',       blurb: 'One matched specialist of every icon.',              crew: [['life', 'life'], ['star', 'star'], ['engine', 'engine'], ['signal', 'signal']] },
  { pattern: 'department-heads',  blurb: 'Two matched specialists of different icons.',        crew: [['life', 'life'], ['engine', 'engine']] },
  { pattern: 'common-cause',      blurb: 'Four crew all carry the same icon.',                 crew: [['life', 'life'], ['life', 'star'], ['life', 'engine'], ['life', 'signal']], sharedIcon: 'life' },
  { pattern: 'common-knowledge',  blurb: 'Three crew all carry the same icon.',                crew: [['life', 'life'], ['life', 'star'], ['life', 'engine']], sharedIcon: 'life' },
  { pattern: 'specialist',        blurb: 'One crew with two matching icons.',                  crew: [['life', 'life']] },
  { pattern: 'common-ground',     blurb: 'Two crew share any one icon.',                       crew: [['life', 'star'], ['life', 'engine']], sharedIcon: 'life' },
  { pattern: 'cross-trained',     blurb: 'One crew with two different icons.',                 crew: [['life', 'star']] },
]

function CrewChip({ pair, sharedIcon }: { pair: CrewIconPair, sharedIcon?: CrewSpecialization }) {
  return (
    <span className="crew-guide-crew-chip" aria-hidden="true">
      {pair.map((icon, index) => (
        <span
          key={`${icon}-${index}`}
          className={sharedIcon && (icon !== sharedIcon || pair.indexOf(icon) !== index) ? 'crew-guide-muted-icon' : undefined}
        >
          <GameIcon kind={icon} />
        </span>
      ))}
    </span>
  )
}

function CrewIconRow({ crew, sharedIcon }: { crew: readonly CrewIconPair[], sharedIcon?: CrewSpecialization }) {
  return (
    <span className="crew-guide-icon-strip">
      {crew.map((pair, index) => (
        <CrewChip key={`${pair[0]}-${pair[1]}-${index}`} pair={pair} sharedIcon={sharedIcon} />
      ))}
    </span>
  )
}

export function CrewPatternIconRow({ pattern }: { pattern: MissionPatternKind }) {
  const entry = GUIDE_ENTRIES.find((candidate) => candidate.pattern === pattern)
  if (!entry) {
    return null
  }

  return <CrewIconRow crew={entry.crew} sharedIcon={entry.sharedIcon} />
}

export function CrewGuideDialog({ isOpen, onClose, patternUsageCounts, activeShipParts, activeCrewQuarters }: CrewGuideDialogProps) {
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
            const baseFuel = getMissionPatternFuel(entry.pattern)
            const { bonus, sources } = getPatternFuelBonus(entry.pattern, entry.crew.length, activeShipParts, activeCrewQuarters)
            const totalFuel = baseFuel + bonus
            const used = patternUsageCounts[entry.pattern] ?? 0
            const isBoosted = bonus > 0
            return (
              <li key={entry.pattern} className={`crew-guide-row${isBoosted ? ' crew-guide-row-boosted' : ''}`}>
                <span className="crew-guide-name">{getMissionPatternLabel(entry.pattern)}</span>
                <span className="crew-guide-icons"><CrewIconRow crew={entry.crew} sharedIcon={entry.sharedIcon} /></span>
                <span className="crew-guide-reward">
                  <span
                    className={`crew-guide-reward-amount${isBoosted ? ' crew-guide-reward-boosted' : ''}`}
                    aria-label={isBoosted ? `${totalFuel}x (boosted from ${baseFuel}x)` : undefined}
                  >
                    {totalFuel}x
                  </span>
                  <GameIcon kind="fuel" />
                </span>
                <span className="crew-guide-count">#{used}</span>
                <span className="crew-guide-blurb">
                  {entry.blurb}
                  {isBoosted ? (
                    <span className="crew-guide-boost-source"> · {sources.join(', ')}</span>
                  ) : null}
                </span>
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
