import type { PlayerCrewStats } from '../game/players'

export function InstructionsPanel({ totalSectors }: { totalSectors: number }) {
  return (
    <aside className="board-notes" aria-label="Quick play instructions" style={{ fontSize: 18 }}>
      <h2>Instructions</h2>
      <ol>
        <li>Click Sector Stops once per turn when the Map is empty</li>
        <li>Stack cards to make actions appear</li>
        <li>Engineer + Scientist can Draw fuel</li>
        <li>Pay a Destination, then click Travel</li>
        <li>Used crew move to Tired</li>
        <li>Immediate Benefit resolves now; Ship Part waits for the Gate</li>
        <li>Discard the other Map Destinations, then end turn</li>
        <li>After 3 Destinations, Ship Parts apply automatically, then stack crew and MOTHER on the Gate</li>
        <li>Clear Sector {totalSectors} to win</li>
      </ol>
    </aside>
  )
}

type PlayerCrewPanelProps = {
  players: readonly PlayerCrewStats[]
  currentPlayerId: string | null
  localPlayerId: string | null
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

export function StressTracker({ stressCount }: { stressCount: number }) {
  return (
    <aside className="stress-area" aria-label="Stress area" style={{ fontSize: 18 }}>
      <p className="stress-tracker" aria-live="polite">
        <span className="stress-label">Stress</span>
        <span className="stress-history" style={{ fontSize: 18 }}>
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
