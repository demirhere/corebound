import { GameIcon } from './GameIcon'

const FUEL_MISSION_CARD_TITLE = 'FUEL MISSION'

export function FuelMissionCard() {
  return (
    <div className="fuel-mission-card">
      <div className="crew-nameplate">
        <span className="crew-name" data-title={FUEL_MISSION_CARD_TITLE}>{FUEL_MISSION_CARD_TITLE}</span>
      </div>

      <div className="fuel-mission-crew-count" aria-label="Use 1 to 4 crew">
        <GameIcon kind="person" />
        <span className="fuel-mission-crew-count-label" data-label="x1-4">x1-4</span>
      </div>
    </div>
  )
}
