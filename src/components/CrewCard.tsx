import type { CSSProperties } from 'react'
import type { Card, CrewSpecialization } from '../game/types'
import { getRequirementIconLabel } from '../game/shipParts'
import { GameIcon } from './GameIcon'

const PORTRAIT_GRID_SIZE = 4
const PORTRAIT_COUNT = PORTRAIT_GRID_SIZE * PORTRAIT_GRID_SIZE

// Per-portrait vertical nudge (background-position-Y offset, in %) to compensate
// for slight head-alignment drift in the sprite sheet. Positive moves the head UP
// in the visible cell, negative moves it DOWN. Typical range: -3% to +3%.
// Index = row * 4 + col within crew-photos.png.
const PORTRAIT_Y_NUDGE_PCT: Partial<Record<number, number>> = {}

function getCrewRole(specializations: readonly CrewSpecialization[]) {
  if (specializations.length === 0) {
    return 'Crew'
  }

  const labels = specializations.map(getRequirementIconLabel)
  const [firstLabel] = labels

  if (firstLabel && labels.every((label) => label === firstLabel)) {
    if (firstLabel === 'Engine') return 'Engineer'
    if (firstLabel === 'Life') return 'Medic'
    if (firstLabel === 'Nav') return 'Pilot'
    return 'Operator'
  }

  const set = new Set(labels)
  if (set.has('Engine') && set.has('Life')) return 'Mechanic'
  if (set.has('Engine') && set.has('Science')) return 'Scientist'
  if (set.has('Engine') && set.has('Nav')) return 'Helmsman'
  if (set.has('Life') && set.has('Science')) return 'Doctor'
  if (set.has('Life') && set.has('Nav')) return 'Pilot'
  if (set.has('Science') && set.has('Nav')) return 'Recon'

  return labels.join(' / ')
}

function getCrewPortraitStyle(portraitIndex: number) {
  const safeIndex = ((portraitIndex % PORTRAIT_COUNT) + PORTRAIT_COUNT) % PORTRAIT_COUNT
  const col = safeIndex % PORTRAIT_GRID_SIZE
  const row = Math.floor(safeIndex / PORTRAIT_GRID_SIZE)
  const nudgeY = PORTRAIT_Y_NUDGE_PCT[safeIndex] ?? 0

  return {
    '--crew-photo-col': String(col),
    '--crew-photo-row': String(row),
    '--crew-photo-nudge-y': `${nudgeY}%`,
  } as CSSProperties
}

export function renderCrewCardContent(card: Card) {
  const specializations = card.specializations ?? []
  const portraitIndex = card.portraitIndex ?? 0
  const crewRole = getCrewRole(specializations)
  const crewTitle = crewRole.toUpperCase()

  return (
    <div className="crew-nametag" style={getCrewPortraitStyle(portraitIndex)}>
      <div className="crew-nameplate">
        <span className="crew-name">{crewTitle}</span>
      </div>

      <div className="crew-specialties" aria-label="Specializations">
        <div className="crew-specialty-icons">
          {specializations.map((icon, index) => (
            <GameIcon key={`${card.id}-crew-${icon}-${index}`} kind={icon} />
          ))}
        </div>
      </div>
    </div>
  )
}
