import type { BoardState } from '../game/types'
import {
  getShipPartLabel,
  getShipPartUseText,
} from '../game/shipParts'

type BoardView = BoardState

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

type ShipPartsPanelProps = {
  board: BoardView
}

export function ShipPartsPanel({ board }: ShipPartsPanelProps) {
  const shipPartEntries = board.shipPartSlots.flatMap((shipPartSlot) => {
    const card = board.cards[shipPartSlot.cardId]

    return card
      ? [
          {
            shipPartSlot,
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
        {shipPartEntries.map(({ shipPartSlot, card, shipPart, shipPartStatus, shipPartLabel }) => (
          <article className={`ship-part-item is-${shipPartStatus}`} key={shipPartSlot.cardId}>
            <p>
              <span>{shipPartLabel}</span>
              <em style={{ fontSize: 18 }}>{shipPartStatus}</em>
            </p>
            <strong style={{ fontSize: 18 }}>{card.title}</strong>
            <small style={{ fontSize: 18 }}>{getShipPartUseText(shipPart)}</small>
          </article>
        ))}
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
