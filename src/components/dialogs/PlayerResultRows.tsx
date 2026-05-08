import type { PlayerCrewStats, PlayerStanding } from '../../game/players'

export function PlayerStatsRows({ stats }: { stats: readonly PlayerCrewStats[] }) {
  return (
    <div className="player-result-list" aria-label="Player stats">
      {stats.map((stat) => (
        <article className="player-result-item" key={stat.player.id}>
          <h3>{stat.player.name}</h3>
          <dl>
            <div>
              <dt>Crew</dt>
              <dd>{stat.crew}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{stat.ready}</dd>
            </div>
            <div>
              <dt>Tired</dt>
              <dd>{stat.tired}</dd>
            </div>
            <div>
              <dt>Blueprints</dt>
              <dd>{stat.blueprints}</dd>
            </div>
            <div>
              <dt>Led</dt>
              <dd>{stat.destinationsLed}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}

export function PlayerStandingsRows({ standings }: { standings: readonly PlayerStanding[] }) {
  return (
    <div className="player-result-list" aria-label="Player standings">
      {standings.map((standing) => (
        <article
          className={`player-result-item ${standing.isWinner ? 'is-winner' : ''}`}
          key={standing.player.id}
        >
          <h3>
            <span>{standing.rank}. {standing.player.name}</span>
            {standing.isWinner ? <em>Winner</em> : null}
          </h3>
          <dl>
            <div>
              <dt>Crew</dt>
              <dd>{standing.crew}</dd>
            </div>
            <div>
              <dt>Blueprints</dt>
              <dd>{standing.blueprints}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{standing.ready}</dd>
            </div>
            <div>
              <dt>Tired</dt>
              <dd>{standing.tired}</dd>
            </div>
            <div>
              <dt>Led</dt>
              <dd>{standing.destinationsLed}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}
