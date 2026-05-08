import { getPlayerStandings, isMultiplayerBoard, type PlayerStanding } from '../../game/players'
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

export function ArrivalDialog({ hasArrived, board, onResetGame, canReset }: {
  hasArrived: boolean
  board: BoardView
  onResetGame: () => void
  canReset: boolean
}) {
  if (!hasArrived) {
    return null
  }

  const isMultiplayer = isMultiplayerBoard(board)
  const standings = getPlayerStandings(board)

  return (
    <div className="dialog-overlay">
      <section className="arrival-panel" role="status" aria-live="polite">
        <p className="arrival-kicker">Gate cleared</p>
        <h2>{isMultiplayer ? getArrivalTitle(standings) : 'You arrived beyond the final Gate.'}</h2>
        <p>
          {isMultiplayer
            ? `Gate ${board.totalSectors} passed. Crew count scores first, then Blueprints built, then Ready crew. If still tied, victory is shared.`
            : `${board.totalSectors}-sector prototype complete. Restart to reshuffle the whole run and try it again.`}
        </p>
        {isMultiplayer ? <PlayerStandingsRows standings={standings} /> : null}
        <button type="button" onClick={onResetGame} disabled={!canReset}>
          Restart and reshuffle
        </button>
      </section>
    </div>
  )
}
