import type { CSSProperties } from 'react'
import type { Card, CrewSpecialization } from '../game/types'
import { getRequirementIconLabel } from '../game/shipParts'
import { GameIcon } from './GameIcon'

const PORTRAIT_GRID_SIZE = 4
const PORTRAIT_COUNT = PORTRAIT_GRID_SIZE * PORTRAIT_GRID_SIZE
const PORTRAIT_OVERSCAN = 1.08

function getCrewRole(specializations: readonly CrewSpecialization[]) {
  if (specializations.length === 0) {
    return 'Field Specialist'
  }

  const labels = specializations.map(getRequirementIconLabel)
  const [firstLabel] = labels

  if (firstLabel && labels.every((label) => label === firstLabel)) {
    return `${firstLabel} Specialist`
  }

  return `${labels.join(' / ')} Specialist`
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

  return (
    <div className="crew-nametag">
      <div className="crew-photo-panel">
        {renderCrewPortrait(portraitIndex)}
      </div>

      <div className="crew-nameplate">
        <span className="crew-name">{card.title}</span>
        <span className="crew-name-rule" aria-hidden="true" />
        <span className="crew-role">{getCrewRole(specializations)}</span>
      </div>

      <div className="crew-specialties" aria-label="Specializations">
        <div className="crew-specialty-icons">
          {specializations.map((icon, index) => (
            <GameIcon key={`${card.id}-crew-${icon}-${index}`} kind={icon} />
          ))}
        </div>
      </div>

      <div className="crew-rule-note">
        <p className="card-rule-text">
          Makes <GameIcon kind="fuel" /> when paired with another crew.
        </p>
      </div>
    </div>
  )
}
