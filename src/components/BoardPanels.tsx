import type { PlayerCrewStats } from '../game/players'

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
