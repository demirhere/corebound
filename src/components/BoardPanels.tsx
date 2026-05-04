import type { BoardState, RouteSlot } from '../game/types'
import {
  getShipPartLabel,
  getShipPartUseText,
} from '../game/shipParts'

type BoardView = BoardState

function isGateActive(board: BoardView) {
  return board.routeSlots.every(Boolean) && !board.pendingWakeChoice && !board.pendingScoutChoice
}

function canUseRouteShipPart(board: BoardView, routeSlot: RouteSlot | null) {
  if (!routeSlot || routeSlot.status !== 'available' || !isGateActive(board)) {
    return false
  }

  return routeSlot.shipPart !== 'water-tank' || board.tiredCardIds.length > 0
}

export function InstructionsPanel({ totalSectors }: { totalSectors: number }) {
  return (
    <aside className="board-notes" aria-label="Quick play instructions">
      <h2>Instructions</h2>
      <ol>
        <li>Visit 1 Map Stop</li>
        <li>Always send 1+ crew on the trip</li>
        <li>Leave traveled Stops on the board</li>
        <li>Refill only that Map lane</li>
        <li>After 3 Stops, face the Gate</li>
        <li>Printed Ship Parts help only at the Gate</li>
        <li>Clear Sector {totalSectors} to win</li>
      </ol>
    </aside>
  )
}

type ShipPartsPanelProps = {
  board: BoardView
  isGameOver: boolean
  onRouteShipPartUse: (routeSlotIndex: number) => void
}

export function ShipPartsPanel({ board, isGameOver, onRouteShipPartUse }: ShipPartsPanelProps) {
  const shipPartEntries = board.routeSlots.flatMap((routeSlot, index) => {
    const card = routeSlot ? board.cards[routeSlot.cardId] : null

    return routeSlot && card
      ? [
          {
            routeSlot,
            routeSlotIndex: index,
            card,
            shipPartLabel: getShipPartLabel(routeSlot.shipPart),
          },
        ]
      : []
  })

  if (isGameOver || shipPartEntries.length === 0) {
    return null
  }

  return (
    <section className="ship-parts-area" aria-label="Ship Parts">
      <h2>Ship Parts</h2>
      <div className="ship-part-list">
        {shipPartEntries.map(({ routeSlot, routeSlotIndex, card, shipPartLabel }) => {
          const canUseShipPart = canUseRouteShipPart(board, routeSlot)

          return (
            <article className={`ship-part-item is-${routeSlot.status}`} key={routeSlot.cardId}>
              <p>
                <span>{shipPartLabel}</span>
                <em>{routeSlot.status}</em>
              </p>
              <strong>{card.title}</strong>
              <small>{getShipPartUseText(routeSlot.shipPart)}</small>
              <button
                type="button"
                disabled={!canUseShipPart}
                aria-label={`Use ${shipPartLabel} from ${card.title}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRouteShipPartUse(routeSlotIndex)}
              >
                {routeSlot.status === 'spent' ? 'Spent' : 'Use Part'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function StressTracker({ stressCount }: { stressCount: number }) {
  return (
    <aside className="stress-area" aria-label="Stress area">
      <p className="stress-tracker" aria-live="polite">
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

export function HistoryPanel({ archivedRouteCardCount }: { archivedRouteCardCount: number }) {
  if (archivedRouteCardCount === 0) {
    return null
  }

  return (
    <aside className="history-area" aria-label="Archived traveled Stops">
      <h2>History</h2>
      <p>
        {archivedRouteCardCount} archived traveled Stop{archivedRouteCardCount === 1 ? '' : 's'}
      </p>
    </aside>
  )
}
