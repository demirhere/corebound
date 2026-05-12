import { getPlayerStandings, isMultiplayerBoard, type PlayerStanding } from '../../game/players'
import { RunStatsRows } from './LossDialog'
import { PlayerStandingsRows } from './PlayerResultRows'
import type { BoardView } from './types'

function getArrivalTitle(standings: readonly PlayerStanding[]) {
  const winners = standings.filter((standing) => standing.isWinner)

  if (winners.length === 0) {
    return 'You arrived beyond the final Gate.'
  }

  if (winners.length > 1) {
    return `${winners.map((winner) => winner.player.name).join(' and ')} share the new world.`
  }

  return `${winners[0]?.player.name} leads the new world.`
}

export function ArrivalDialog({ hasArrived, board, onResetGame, onReturnToMainMenu, canReset }: {
  hasArrived: boolean
  board: BoardView
  onResetGame: () => void
  onReturnToMainMenu: () => void
  canReset: boolean
}) {
  if (!hasArrived) {
    return null
  }

  const isMultiplayer = isMultiplayerBoard(board)
  const standings = getPlayerStandings(board)

  return (
    <div className="dialog-overlay victory-overlay">
      <section
        className="arrival-panel victory-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="arrival-title"
      >
        <p className="arrival-kicker">Run Complete</p>
        <h2 id="arrival-title">
          {isMultiplayer ? getArrivalTitle(standings) : 'You arrived beyond the final Gate.'}
        </h2>
        <p>
          {isMultiplayer
            ? `Gate ${board.totalSectors} passed. Crew count scores first, then Blueprints built, then Ready crew. If still tied, victory is shared.`
            : `${board.totalSectors}-sector prototype complete. The full run summary is ready.`}
        </p>
        <RunStatsRows board={board} ariaLabel="Successful run stats" missionCountScope="run" />
        {isMultiplayer ? <PlayerStandingsRows standings={standings} /> : null}
        <div className="result-actions victory-actions">
          <button type="button" onClick={onResetGame} disabled={!canReset}>
            Launch Again
          </button>
          <button
            className="result-menu-button"
            type="button"
            onClick={onReturnToMainMenu}
            disabled={!canReset}
          >
            Main Menu
          </button>
        </div>
      </section>
    </div>
  )
}
