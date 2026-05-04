import type { CSSProperties } from 'react'
import type { Card, CrewSpecialization } from '../game/types'
import { getRequirementIconLabel } from '../game/shipParts'
import { GameIcon } from './GameIcon'

const PORTRAIT_GRID_SIZE = 4
const PORTRAIT_COUNT = PORTRAIT_GRID_SIZE * PORTRAIT_GRID_SIZE
const PORTRAIT_OVERSCAN = 1.08

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

function renderCrewPortrait(portraitIndex: number) {
  const safeIndex = ((portraitIndex % PORTRAIT_COUNT) + PORTRAIT_COUNT) % PORTRAIT_COUNT
  const col = safeIndex % PORTRAIT_GRID_SIZE
  const row = Math.floor(safeIndex / PORTRAIT_GRID_SIZE)
  const denominator = PORTRAIT_GRID_SIZE * PORTRAIT_OVERSCAN - 1
  const offset = (PORTRAIT_OVERSCAN - 1) / 2
  const style = {
    '--crew-photo-x': `${((col * PORTRAIT_OVERSCAN + offset) / denominator) * 100}%`,
    '--crew-photo-y': `${((row * PORTRAIT_OVERSCAN + offset) / denominator) * 100}%`,
  } as CSSProperties

  return <div className="crew-photo" style={style} role="img" aria-hidden="true" />
}

export function renderCrewCardContent(card: Card) {
  const specializations = card.specializations ?? []
  const portraitIndex = card.portraitIndex ?? 0
  const crewRole = getCrewRole(specializations)
  const waterPairPartner = crewRole === 'Engineer'
    ? 'Scientist'
    : crewRole === 'Scientist'
      ? 'Engineer'
      : null

  return (
    <div className="crew-nametag">
      <div className="crew-photo-panel">
        {renderCrewPortrait(portraitIndex)}
      </div>

      <div className="crew-nameplate">
        <span className="crew-name">{card.title}</span>
        <span className="crew-name-rule" aria-hidden="true" />
        <span className="crew-role">{crewRole}</span>
      </div>

      <div className="crew-specialties" aria-label="Specializations">
        <div className="crew-specialty-icons">
          {specializations.map((icon, index) => (
            <GameIcon key={`${card.id}-crew-${icon}-${index}`} kind={icon} />
          ))}
        </div>
      </div>

      {waterPairPartner && (
        <div className="crew-rule-note">
          <p className="card-rule-text">
            Makes <GameIcon kind="fuel" /> when paired with {waterPairPartner}.
          </p>
        </div>
      )}
    </div>
  )
}
