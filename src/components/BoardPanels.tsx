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
  if (
    !routeSlot ||
    routeSlot.find.kind !== 'ship_part' ||
    routeSlot.find.status !== 'available' ||
    !isGateActive(board)
  ) {
    return false
  }

  return routeSlot.find.shipPart !== 'medbay-rehydrator' || board.tiredCardIds.length > 0
}

export function InstructionsPanel({ totalSectors }: { totalSectors: number }) {
  return (
    <aside className="board-notes" aria-label="Quick play instructions">
      <h2>Instructions</h2>
      <ol>
        <li>Visit 1 Map Destination</li>
        <li>Always send 1+ crew on the trip</li>
        <li>Keep Ship Part Destinations on the route</li>
        <li>Discard the other Map Destinations</li>
        <li>Draw 3 new Destinations side by side</li>
        <li>After 3 Destinations, face the Gate</li>
        <li>Ship Part finds help only at the Gate</li>
        <li>Clear Sector {totalSectors} to win</li>
      </ol>
    </aside>
  )
}

type ShipPartsPanelProps = {
  board: BoardView
  onRouteShipPartUse: (routeSlotIndex: number) => void
}

export function ShipPartsPanel({ board, onRouteShipPartUse }: ShipPartsPanelProps) {
  const shipPartEntries = board.routeSlots.flatMap((routeSlot, index) => {
    const card = routeSlot ? board.cards[routeSlot.cardId] : null
    const shipPartFind = routeSlot?.find.kind === 'ship_part' ? routeSlot.find : null

    return routeSlot && shipPartFind && card
      ? [
          {
            routeSlot,
            routeSlotIndex: index,
            card,
            shipPart: shipPartFind.shipPart,
            shipPartStatus: shipPartFind.status,
            shipPartLabel: getShipPartLabel(shipPartFind.shipPart),
          },
        ]
      : []
  })

  return (
    <section className="ship-parts-area" aria-label="Ship Parts">
      <h2>Ship Parts</h2>
      <div className="ship-part-list">
        {shipPartEntries.map(({ routeSlot, routeSlotIndex, card, shipPart, shipPartStatus, shipPartLabel }) => {
          const canUseShipPart = canUseRouteShipPart(board, routeSlot)

          return (
            <article className={`ship-part-item is-${shipPartStatus}`} key={routeSlot.cardId}>
              <p>
                <span>{shipPartLabel}</span>
                <em>{shipPartStatus}</em>
              </p>
              <strong>{card.title}</strong>
              <small>{getShipPartUseText(shipPart)}</small>
              <button
                type="button"
                disabled={!canUseShipPart}
                aria-label={`Use ${shipPartLabel} from ${card.title}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRouteShipPartUse(routeSlotIndex)}
              >
                {shipPartStatus === 'spent' ? 'Spent' : 'Use Part'}
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
