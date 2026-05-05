import type { BoardState, ShipPartSlot } from '../game/types'
import {
  getShipPartLabel,
  getShipPartUseText,
} from '../game/shipParts'

type BoardView = BoardState

function isGateActive(board: BoardView) {
  return board.routeSlots.every(Boolean) && !board.pendingWakeChoice && !board.pendingScoutChoice
}

function canUseRouteShipPart(board: BoardView, shipPartSlot: ShipPartSlot | null) {
  if (
    !shipPartSlot ||
    shipPartSlot.status !== 'available' ||
    board.hasArrived ||
    board.lossReason ||
    !isGateActive(board)
  ) {
    return false
  }

  return shipPartSlot.shipPart !== 'medbay-rehydrator' || board.tiredCardIds.length > 0
}

export function InstructionsPanel({ totalSectors }: { totalSectors: number }) {
  return (
    <aside className="board-notes" aria-label="Quick play instructions" style={{ fontSize: 18 }}>
      <h2>Instructions</h2>
      <ol>
        <li>Click the Sector Deck to draw 3 Map Destinations</li>
        <li>Pick 1 of 3 Map Destinations</li>
        <li>Pay its Fuel and icons with Ready crew</li>
        <li>Use MOTHER to cover missing icons; each use adds Stress and makes the Gate harder</li>
        <li>Used crew move to Tired</li>
        <li>Immediate Benefit resolves now; Ship Part waits for the Gate</li>
        <li>Discard the other Map Destinations, then draw 3 new</li>
        <li>After 3 Destinations, pass the Gate with crew, Ship Parts, and MOTHER</li>
        <li>Clear Sector {totalSectors} to win</li>
      </ol>
    </aside>
  )
}

type ShipPartsPanelProps = {
  board: BoardView
  onRouteShipPartUse: (shipPartSlotIndex: number) => void
}

export function ShipPartsPanel({ board, onRouteShipPartUse }: ShipPartsPanelProps) {
  const shipPartEntries = board.shipPartSlots.flatMap((shipPartSlot, index) => {
    const card = board.cards[shipPartSlot.cardId]

    return card
      ? [
          {
            shipPartSlot,
            shipPartSlotIndex: index,
            card,
            shipPart: shipPartSlot.shipPart,
            shipPartStatus: shipPartSlot.status,
            shipPartLabel: getShipPartLabel(shipPartSlot.shipPart),
          },
        ]
      : []
  })

  return (
    <section className="ship-parts-area" aria-label="Ship Parts" style={{ fontSize: 18 }}>
      <h2>Ship Parts</h2>
      <div className="ship-part-list">
        {shipPartEntries.map(({ shipPartSlot, shipPartSlotIndex, card, shipPart, shipPartStatus, shipPartLabel }) => {
          const canUseShipPart = canUseRouteShipPart(board, shipPartSlot)

          return (
            <article className={`ship-part-item is-${shipPartStatus}`} key={shipPartSlot.cardId}>
              <p>
                <span>{shipPartLabel}</span>
                <em style={{ fontSize: 18 }}>{shipPartStatus}</em>
              </p>
              <strong style={{ fontSize: 18 }}>{card.title}</strong>
              <small style={{ fontSize: 18 }}>{getShipPartUseText(shipPart)}</small>
              <button
                type="button"
                disabled={!canUseShipPart}
                aria-label={`Use ${shipPartLabel} from ${card.title}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRouteShipPartUse(shipPartSlotIndex)}
                style={{ fontSize: 18 }}
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
