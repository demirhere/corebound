import type { PlayerCrewStats } from '../game/players'

type PlayerCrewPanelProps = {
  players: readonly PlayerCrewStats[]
  currentPlayerId: string | null
  localPlayerId: string | null
}

type StressTrackerProps = {
  stressCount: number
  currentSector: number
  totalSectors: number
  missionsCompleted: number
  turnNumber: number
}

export function StressTracker({
  stressCount,
  currentSector,
  totalSectors,
  missionsCompleted,
  turnNumber,
}: StressTrackerProps) {
  return (
    <aside className="stress-area hand-zone-stress" aria-label="Sector and stress area" aria-live="polite">
      <p className="stress-tracker">
        <span className="stress-label">Sector</span>
        <span className="stress-history sector-history" aria-label={`Sector ${currentSector} of ${totalSectors}`}>
          <span className="stress-current">{currentSector}/{totalSectors}</span>
        </span>
      </p>
      <p className="stress-tracker">
        <span className="stress-label">Missions</span>
        <span className="stress-history sector-history" aria-label={`${missionsCompleted} missions completed`}>
          <span className="stress-current">{missionsCompleted}</span>
        </span>
      </p>
      <p className="stress-tracker">
        <span className="stress-label">Turns</span>
        <span className="stress-history sector-history" aria-label={`Turn ${turnNumber}`}>
          <span className="stress-current">{turnNumber}</span>
        </span>
      </p>
      <p className="stress-tracker">
        <span className="stress-label">Stress</span>
        <span className="stress-history">
          {Array.from({ length: stressCount + 1 }, (_, i) => (
            <span key={i} className={i < stressCount ? 'stress-old' : 'stress-current'}>
              {i}
            </span>
          ))}
        </span>
      </p>
    </aside>
  )
}

export function PlayerCrewPanel({ players, currentPlayerId, localPlayerId }: PlayerCrewPanelProps) {
  return (
    <aside className="player-crew-area" aria-label="Player crew counts" style={{ fontSize: 18 }}>
      <h2>Players</h2>
      <div className="player-crew-list">
        {players.map(({ player, crew, ready, tired }) => {
          const isCurrent = player.id === currentPlayerId
          const isLocal = player.id === localPlayerId

          return (
            <article
              className={`player-crew-item ${isCurrent ? 'is-current' : ''} ${isLocal ? 'is-local' : ''}`}
              key={player.id}
            >
              <p>
                <strong>{isLocal ? `${player.name} (You)` : player.name}</strong>
                {isCurrent ? <em>Mission Lead</em> : null}
              </p>
              <dl>
                <div>
                  <dt>Crew</dt>
                  <dd>{crew}</dd>
                </div>
                <div>
                  <dt>Ready</dt>
                  <dd>{ready}</dd>
                </div>
                <div>
                  <dt>Tired</dt>
                  <dd>{tired}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
