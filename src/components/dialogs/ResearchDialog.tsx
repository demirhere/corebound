import { createActiveShipPartBlueprint } from '../../game/blueprints/factories'
import { SHIP_PART_SLOT_CAP } from '../../game/shipPartEffects'
import type { ActiveShipPart, Card, ShipPartBlueprint } from '../../game/types'
import { CardShell } from '../BoardCard'
import { GameIcon } from '../GameIcon'
import type { BoardView } from './types'

export function ResearchDialog({
  board,
  isGameOver,
  canInteract,
  onPurchaseShipPart,
  onRedrawResearchOffers,
  onCloseResearchDialog,
  onDiscardActiveShipPart,
}: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onPurchaseShipPart: (shipPartId: string) => void
  onRedrawResearchOffers: () => void
  onCloseResearchDialog: () => void
  onDiscardActiveShipPart: (instanceId: string) => void
}) {
  const research = board.pendingResearchChoice
  if (
    isGameOver ||
    board.pendingWakeChoice ||
    board.pendingScoutChoice ||
    board.pendingShipPartChoice ||
    !research ||
    research.offers.length === 0
  ) {
    return null
  }

  const slotsFilled = board.activeShipParts.length
  const slotsCap = SHIP_PART_SLOT_CAP
  const slotsRemaining = Math.max(0, slotsCap - slotsFilled)
  const needsSlotsFreed = slotsRemaining === 0
  const offerIds = new Set(research.offers.map((offer) => offer.id))
  const ownedPartIds = new Set(board.activeShipParts.map((part) => part.id))
  const redrawCost = Math.min(...research.offers.map((offer) => offer.cost))
  const hasRedrawPool = board.shipPartShopPool.some(
    (part) => !offerIds.has(part.id) && !ownedPartIds.has(part.id),
  )
  const canRedraw = canInteract && hasRedrawPool && board.scraps >= redrawCost

  return (
    <div className="dialog-overlay research-overlay">
      <section
        className="arrival-panel research-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="research-dialog-title"
      >
        <div className="research-header">
          <div className="research-title-lockup">
            <h2 id="research-dialog-title">Research Opportunity</h2>
            <p>Our ship will go further</p>
          </div>
          <div className="research-status-row" aria-label="Research status">
            <p className="stress-tracker research-status-tracker">
              <span className="stress-label">Scraps</span>
              <span className="stress-history sector-history" aria-label={`${board.scraps} scraps`}>
                <span className="stress-current">{board.scraps}</span>
              </span>
            </p>
            <p className="stress-tracker research-status-tracker">
              <span className="stress-label">Slots</span>
              <span className="stress-history sector-history" aria-label={`${slotsFilled} of ${slotsCap} slots filled`}>
                <span className="stress-current">{slotsFilled}</span>
                <span className="sector-total">/{slotsCap}</span>
              </span>
            </p>
          </div>
        </div>
        <div className="research-offer-cards">
          {research.offers.map((offer) => {
            const owned = board.activeShipParts.some((part) => part.id === offer.id)
            const canAfford = board.scraps >= offer.cost
            const hasSlot = slotsRemaining > 0
            const disabled = !canInteract || owned || !canAfford || !hasSlot
            const status = owned
              ? 'Researched'
              : !hasSlot
                ? 'No slot available'
                : !canAfford
                  ? 'Not enough Scraps'
                  : null
            return (
              <ResearchOfferCard
                key={offer.id}
                offer={offer}
                disabled={disabled}
                isResearched={owned}
                onResearch={() => onPurchaseShipPart(offer.id)}
                status={status}
              />
            )
          })}
        </div>
        {needsSlotsFreed && board.activeShipParts.length > 0 ? (
          <section className="research-active-section" aria-label="Active ship parts">
            <p className="research-active-label">
              Active Ship Parts. Discard one to free a slot:
            </p>
            <div className="research-active-cards">
              {board.activeShipParts.map((part) => (
                <ActiveShipPartCardView
                  key={part.instanceId}
                  shipPart={part}
                  canInteract={canInteract}
                  onDiscard={() => onDiscardActiveShipPart(part.instanceId)}
                />
              ))}
            </div>
          </section>
        ) : null}
        <div className="research-footer">
          <button
            type="button"
            className="research-redraw-button"
            onClick={onRedrawResearchOffers}
            disabled={!canRedraw}
            aria-label={`Re-draw offers for ${redrawCost} scraps`}
            title={hasRedrawPool ? `Re-draw offers for ${redrawCost} Scraps` : 'No new research opportunities available'}
          >
            Re-draw <ScrapCost amount={redrawCost} />
          </button>
          <button
            type="button"
            className="research-skip-button"
            onClick={onCloseResearchDialog}
            disabled={!canInteract}
          >
            Next Sector
          </button>
        </div>
      </section>
    </div>
  )
}

function ResearchOfferCard({
  offer,
  disabled,
  isResearched,
  onResearch,
  status,
}: {
  offer: ShipPartBlueprint
  disabled: boolean
  isResearched: boolean
  onResearch: () => void
  status: string | null
}) {
  const previewCard: Card = {
    ...createActiveShipPartBlueprint({
      ...offer,
      instanceId: `preview-${offer.id}`,
      acquiredSector: 0,
    }),
    id: `preview-${offer.id}`,
    faceUp: true,
  }

  return (
    <article className="research-offer-card-wrap" title={status ?? `Research for ${offer.cost} Scraps`}>
      <ScrapCost amount={offer.cost} className="research-offer-price" />
      <div className="research-card-frame">
        <CardShell
          card={previewCard}
          className={`research-offer-card ${isResearched ? 'is-researched' : ''}`}
          canInteract={!disabled}
          ariaLabel={`${offer.label} Ship Part. Costs ${offer.cost} Scraps.${status ? ` ${status}.` : ' Click to research.'}`}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onResearch()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              onResearch()
            }
          }}
        />
        {isResearched ? <span className="research-offer-state">Researched</span> : null}
      </div>
    </article>
  )
}

function ScrapCost({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`research-scrap-cost ${className}`} aria-label={`${amount} Scraps`}>
      <span aria-hidden="true">{amount}</span>
      <span aria-hidden="true"><GameIcon kind="scrap" /></span>
    </span>
  )
}

function ActiveShipPartCardView({
  shipPart,
  canInteract,
  onDiscard,
}: {
  shipPart: ActiveShipPart
  canInteract: boolean
  onDiscard: () => void
}) {
  const previewCard: Card = {
    ...createActiveShipPartBlueprint(shipPart),
    id: `preview-${shipPart.instanceId}`,
    faceUp: true,
  }

  return (
    <article className="research-active-card-wrap">
      <div className="research-card-frame">
        <CardShell
          card={previewCard}
          className="research-active-card"
          canInteract={false}
          ariaLabel={`${shipPart.label} Ship Part`}
          onPointerDown={() => {}}
          onKeyDown={() => {}}
        />
      </div>
      <button
        type="button"
        className="research-offer-buy"
        onClick={onDiscard}
        disabled={!canInteract}
        title={`Discard for +${shipPart.refund} Scraps`}
      >
        Discard +{shipPart.refund}
      </button>
    </article>
  )
}
