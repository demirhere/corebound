import { createActiveShipPartBlueprint } from '../../game/blueprints/factories'
import {
  CREW_QUARTERS_UPGRADE_COST,
  createCrewQuartersUpgradeBlueprint,
} from '../../game/crewQuartersCatalog'
import { CREW_QUARTERS_DECK_ID } from '../../game/decks'
import { SHIP_PART_SLOT_CAP } from '../../game/shipPartEffects'
import type { ActiveShipPart, Card, ShipPartBlueprint } from '../../game/types'
import { CardShell } from '../BoardCard'
import { ScrapCost } from './ResearchScrapCost'
import type { BoardView } from './types'

export function ResearchDialog({
  board,
  isGameOver,
  canInteract,
  onPurchaseShipPart,
  onPurchaseCrewQuartersUpgrade,
  onRedrawResearchOffers,
  onCloseResearchDialog,
  onDiscardActiveShipPart,
}: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onPurchaseShipPart: (shipPartId: string) => void
  onPurchaseCrewQuartersUpgrade: () => void
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
    !research
  ) {
    return null
  }

  const slotsFilled = board.activeShipParts.length
  const slotsCap = SHIP_PART_SLOT_CAP
  const slotsRemaining = Math.max(0, slotsCap - slotsFilled)
  const needsSlotsFreed = slotsRemaining === 0
  const offerIds = new Set(research.offers.map((offer) => offer.id))
  const ownedPartIds = new Set(board.activeShipParts.map((part) => part.id))
  // Re-draw mirrors ship-part offer flow (cheapest visible offer). Crew
  // Quarters Upgrade is bought independently and doesn't gate re-draw.
  const shipPartOfferCosts = research.offers.map((offer) => offer.cost)
  const redrawCost = shipPartOfferCosts.length > 0 ? Math.min(...shipPartOfferCosts) : 0
  const hasShipPartRedrawPool = board.shipPartShopPool.some(
    (part) => !offerIds.has(part.id) && !ownedPartIds.has(part.id),
  )
  const canRedraw = canInteract && hasShipPartRedrawPool && board.scraps >= redrawCost && research.offers.length > 0
  const crewQuartersDeck = board.decks.find((deck) => deck.id === CREW_QUARTERS_DECK_ID)
  const crewQuartersStockLeft = crewQuartersDeck?.cards.length ?? 0
  const canBuyCrewQuarters = canInteract &&
    board.scraps >= CREW_QUARTERS_UPGRADE_COST &&
    crewQuartersStockLeft > 0

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
        <section className="research-offer-group" aria-label="Research offers">
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
            <CrewQuartersUpgradeOfferCard
              disabled={!canBuyCrewQuarters}
              status={
                crewQuartersStockLeft === 0
                  ? 'Deck exhausted'
                  : board.scraps < CREW_QUARTERS_UPGRADE_COST
                    ? 'Not enough Scraps'
                    : null
              }
              onPurchase={onPurchaseCrewQuartersUpgrade}
            />
          </div>
        </section>
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
            aria-label={`Re-draw ship part offers for ${redrawCost} scraps`}
            title={hasShipPartRedrawPool ? `Re-draw ship part offers for ${redrawCost} Scraps` : 'No new ship parts available'}
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

// Single "Place Crew Quarters Upgrade" button shown alongside the ship-part
// offers. Costs CREW_QUARTERS_UPGRADE_COST Scraps. Click deals a generic
// Crew Quarters Upgrade card onto the board; the dialog stays open so the
// player can keep clicking as long as they have scraps and deck stock.
function CrewQuartersUpgradeOfferCard({
  disabled,
  status,
  onPurchase,
}: {
  disabled: boolean
  status: string | null
  onPurchase: () => void
}) {
  const previewCard: Card = {
    ...createCrewQuartersUpgradeBlueprint(),
    id: 'preview-crew-quarters-upgrade',
    faceUp: true,
  }
  const ariaLabel = `Crew Quarters Upgrade. Costs ${CREW_QUARTERS_UPGRADE_COST} Scraps. Places a Crew Quarters Upgrade card on the board.${status ? ` ${status}.` : ''}`

  return (
    <article
      className="research-offer-card-wrap research-quarters-pack-wrap"
      title={status ?? `Place a Crew Quarters Upgrade card on the board (${CREW_QUARTERS_UPGRADE_COST} Scraps)`}
    >
      <ScrapCost amount={CREW_QUARTERS_UPGRADE_COST} className="research-offer-price" />
      <div className="research-card-frame">
        <CardShell
          card={previewCard}
          className="research-offer-card"
          canInteract={!disabled}
          ariaLabel={ariaLabel}
          onPointerDown={(event) => {
            if (disabled) return
            event.preventDefault()
            event.stopPropagation()
            onPurchase()
          }}
          onKeyDown={(event) => {
            if (disabled) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              onPurchase()
            }
          }}
        />
      </div>
    </article>
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

