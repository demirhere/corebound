import { getPlayerCrewStats, isMultiplayerBoard } from '../../game/players'
import { findBestPatternForCrew, getMissionPatternFuel, getMissionPatternLabel } from '../../game/rules'
import type { MissionPatternKind } from '../../game/types'
import { GameIcon } from '../GameIcon'
import { PlayerStatsRows } from './PlayerResultRows'
import type { BoardView } from './types'

type LossStat = {
  label: string
  value: string
  iconKind?: 'fuel' | 'hull'
  iconLabel?: string
  isWide?: boolean
}

type CompletedMissionSummary = BoardView['completedStarSummaries'][number]

function getSummaryFuelReward(summary: CompletedMissionSummary, board: BoardView) {
  const recordedFuelReward = summary.fuelReward

  if (typeof recordedFuelReward === 'number') {
    return recordedFuelReward
  }

  return findBestPatternForCrew(summary.crewCardIds, board.cards)?.fuel ?? 0
}

function getBestMissionFuel(board: BoardView) {
  return board.completedStarSummaries.reduce(
    (best, summary) => Math.max(best, getSummaryFuelReward(summary, board)),
    0,
  )
}

function getMostUsedCrewComposition(board: BoardView) {
  const patternCounts = Object.entries(board.patternUsageCounts) as [MissionPatternKind, number | undefined][]
  const mostUsedPattern = patternCounts.reduce<{
    pattern: MissionPatternKind
    count: number
  } | null>((best, [pattern, count]) => {
    const safeCount = count ?? 0

    if (safeCount <= 0) {
      return best
    }

    if (!best) {
      return { pattern, count: safeCount }
    }

    if (safeCount > best.count) {
      return { pattern, count: safeCount }
    }

    return safeCount === best.count && getMissionPatternFuel(pattern) > getMissionPatternFuel(best.pattern)
      ? { pattern, count: safeCount }
      : best
  }, null)

  return mostUsedPattern
    ? `${getMissionPatternLabel(mostUsedPattern.pattern)} x${mostUsedPattern.count}`
    : 'None'
}

function getCurrentSectorMissionCount(board: BoardView) {
  return board.completedStarSummaries.filter(
    (summary) => summary.sector === board.currentSector,
  ).length
}

function getAssignedCrewCount(board: BoardView) {
  return board.completedStarSummaries.reduce(
    (count, summary) => count + summary.crewCardIds.length,
    0,
  )
}

function getLossStats(board: BoardView): LossStat[] {
  const bestMissionFuel = getBestMissionFuel(board)

  return [
    {
      label: 'Most used crew',
      value: getMostUsedCrewComposition(board),
      isWide: true,
    },
    {
      label: 'Sector',
      value: String(board.currentSector),
    },
    {
      label: 'Missions',
      value: String(getCurrentSectorMissionCount(board)),
    },
    {
      label: 'Turns',
      value: String(board.turnNumber),
    },
    {
      label: 'Crews Assigned',
      value: String(getAssignedCrewCount(board)),
    },
    {
      label: 'Ship Parts',
      value: String(board.activeShipParts.length),
    },
    {
      label: 'Best Mission',
      value: String(bestMissionFuel),
      iconKind: 'fuel',
      iconLabel: `${bestMissionFuel} Fuel`,
    },
  ]
}

export function LossDialog({ board, onResetGame, onReturnToMainMenu, canReset }: {
  board: BoardView
  onResetGame: () => void
  onReturnToMainMenu: () => void
  canReset: boolean
}) {
  if (!board.lossReason) {
    return null
  }

  const isMultiplayer = isMultiplayerBoard(board)

  return (
    <div className="dialog-overlay failure-overlay">
      <section
        className="arrival-panel loss-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loss-title"
      >
        <p className="arrival-kicker">Game Over</p>
        <h2 id="loss-title">Stranded</h2>
        <dl className="loss-stats" aria-label="Failed run stats">
          {getLossStats(board).map((stat) => (
            <div className={`loss-stat${stat.isWide ? ' is-wide' : ''}`} key={stat.label}>
              <dt>{stat.label}</dt>
              <dd aria-label={stat.iconLabel ?? stat.value}>
                {stat.iconKind && <GameIcon kind={stat.iconKind} />}
                <span>{stat.value}</span>
              </dd>
            </div>
          ))}
        </dl>
        {isMultiplayer ? <PlayerStatsRows stats={getPlayerCrewStats(board)} /> : null}
        <div className="loss-actions">
          <button type="button" onClick={onResetGame} disabled={!canReset}>
            Launch Again
          </button>
          <button
            className="loss-menu-button"
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
