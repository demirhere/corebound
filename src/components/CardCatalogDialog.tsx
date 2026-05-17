import { useEffect } from 'react'
import { createActiveShipPartBlueprint } from '../game/blueprints/factories'
import {
  CREW_QUARTERS_MAX_UPGRADES_PER_PATTERN,
  CREW_QUARTERS_UPGRADE_COST,
  createCrewQuartersUpgradeBlueprint,
} from '../game/crewQuartersCatalog'
import { shipPartCatalog } from '../game/shipPartCatalog'
import type { Card, ShipPartBlueprint } from '../game/types'
import { CardShell } from './BoardCard'
import { ScrapCost } from './dialogs/ResearchScrapCost'

type CardCatalogDialogProps = {
  isOpen: boolean
  onClose: () => void
}

function CatalogShipPartCard({ part }: { part: ShipPartBlueprint }) {
  const previewCard: Card = {
    ...createActiveShipPartBlueprint({
      ...part,
      instanceId: `catalog-${part.id}`,
      acquiredSector: 0,
    }),
    id: `catalog-${part.id}`,
    faceUp: true,
  }

  return (
    <article className="card-catalog-card-wrap">
      <div className="card-catalog-card-meta">
        <ScrapCost amount={part.cost} className="card-catalog-price" />
      </div>
      <div className="card-catalog-card-frame">
        <CardShell
          card={previewCard}
          className="card-catalog-card"
          canInteract={false}
          ariaLabel={`${part.label} Ship Part. Costs ${part.cost} Scraps. ${part.description}`}
          onPointerDown={() => {}}
          onKeyDown={() => {}}
        />
      </div>
    </article>
  )
}

function CatalogCrewQuartersUpgradeCard() {
  const previewCard: Card = {
    ...createCrewQuartersUpgradeBlueprint(),
    id: 'catalog-crew-quarters-upgrade',
    faceUp: true,
  }
  return (
    <article className="card-catalog-card-wrap">
      <div className="card-catalog-card-meta">
        <ScrapCost amount={CREW_QUARTERS_UPGRADE_COST} className="card-catalog-price" />
      </div>
      <div className="card-catalog-card-frame">
        <CardShell
          card={previewCard}
          className="card-catalog-card"
          canInteract={false}
          ariaLabel="Crew Quarters Upgrade. Stack an exact 1-4 crew composition to permanently grant +1 Fuel on its pattern."
          onPointerDown={() => {}}
          onKeyDown={() => {}}
        />
      </div>
    </article>
  )
}

export function CardCatalogDialog({ isOpen, onClose }: CardCatalogDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="dialog-overlay card-catalog-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="arrival-panel card-catalog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-catalog-title"
      >
        <p className="arrival-kicker">Research Catalog</p>
        <h2 id="card-catalog-title">Available Cards</h2>
        <p className="card-catalog-summary">
          Preview every Crew Quarter Upgrade and Ship Part that can appear in research.
        </p>

        <div className="card-catalog-sections">
          <section className="card-catalog-section" aria-labelledby="card-catalog-crew-title">
            <header className="card-catalog-section-header">
              <h3 id="card-catalog-crew-title">Crew Quarters Upgrade</h3>
              <p>Stack an exact 1-4 crew composition on this card to lock in its pattern, permanently +1 Fuel. Each composition caps at {CREW_QUARTERS_MAX_UPGRADES_PER_PATTERN} stacks.</p>
            </header>
            <div className="card-catalog-grid">
              <CatalogCrewQuartersUpgradeCard />
            </div>
          </section>

          <section className="card-catalog-section" aria-labelledby="card-catalog-ship-title">
            <header className="card-catalog-section-header">
              <h3 id="card-catalog-ship-title">Ship Parts</h3>
              <p>Unique joker-style upgrades that fill the 5 Ship Part slots.</p>
            </header>
            <div className="card-catalog-grid">
              {shipPartCatalog.map((part) => (
                <CatalogShipPartCard key={part.id} part={part} />
              ))}
            </div>
          </section>
        </div>

        <button type="button" onClick={onClose}>
          Close Catalog
        </button>
      </section>
    </div>
  )
}
