import { GameIcon } from './GameIcon'

const FUEL_MISSION_CARD_TITLE = 'FUEL MISSION'

type CrewCountCardLayoutProps = {
  title: string
  className?: string
  crewCountAriaLabel?: string
}

export function CrewCountCardLayout({
  title,
  className = '',
  crewCountAriaLabel = 'Use 1 to 4 crew',
}: CrewCountCardLayoutProps) {
  const displayTitle = title.toUpperCase()

  return (
    <div className={`fuel-mission-card ${className}`.trim()}>
      <div className="crew-nameplate">
        <span className="crew-name" data-title={displayTitle}>{displayTitle}</span>
      </div>

      <div className="fuel-mission-crew-count" aria-label={crewCountAriaLabel}>
        <GameIcon kind="person" />
        <span className="fuel-mission-crew-count-label" data-label="x1-4">x1-4</span>
      </div>
    </div>
  )
}

export function FuelMissionCard() {
  return <CrewCountCardLayout title={FUEL_MISSION_CARD_TITLE} />
}
