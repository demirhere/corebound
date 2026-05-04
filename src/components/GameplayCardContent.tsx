import type {
  Card,
  CrewSpecialization,
  DestinationFind,
  GateDetails,
  RequirementIconKind,
  ResourceKind,
  ShipPartKind,
  VisitReward,
} from '../game/types'
import {
  getShipPartLabel,
  getShipPartUseText,
} from '../game/shipParts'
import { renderCrewCardContent } from './CrewCard'
import { GameIcon } from './GameIcon'

function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
}

function renderIconPips(
  icons: readonly (RequirementIconKind | CrewSpecialization | ResourceKind)[],
  keyPrefix: string,
) {
  return icons.map((icon, index) => <GameIcon key={`${keyPrefix}-${icon}-${index}`} kind={icon} />)
}

function renderFuelNeed(printedFuel: number, currentFuelCost: number, keyPrefix: string) {
  const removedFuelCount = printedFuel - currentFuelCost

  return [
    ...Array.from({ length: currentFuelCost }, (_, index) => (
      <GameIcon key={`${keyPrefix}-fuel-${index}`} kind="fuel" />
    )),
    ...Array.from({ length: removedFuelCount }, (_, index) => (
      <span key={`${keyPrefix}-removed-fuel-${index}`} className="removed-need-icon" title="Fuel removed by Destination effect">
        <GameIcon kind="fuel" />
        <svg className="removed-need-scribble" viewBox="0 0 44 30" focusable="false" aria-hidden="true">
          <path d="M3.8 17c5.2-4.4 9.8 3.7 15.3-.3 5.5-4.1 10.4 3.3 16.1-.6 2.7-1.9 4.7-2.1 6.5-.7" />
        </svg>
      </span>
    )),
  ]
}

function renderReward(reward: VisitReward, index: number) {
  if (reward.kind === 'resource') {
    return [
      <span key={`${reward.resource}-${index}`} className="card-reward-chip">
        <GameIcon kind={reward.resource} />
        <span>+{reward.count} {titleCase(reward.resource)}</span>
      </span>,
    ]
  }

  if (reward.kind === 'crew') {
    if (reward.label === 'Wake') {
      return [
        <span key={`wake-${index}`} className="card-wake-reward">
          <span>Wake 1: choose 1 of 2, then Ready 1</span>
          <GameIcon kind="tired-person" />
        </span>,
      ]
    }

    const iconKind = 'person'

    return Array.from({ length: reward.count }, (_, rewardIndex) =>
      <GameIcon key={`${iconKind}-${index}-${rewardIndex}`} kind={iconKind} />,
    )
  }

  if (reward.kind === 'scout') {
    return [
      <span key={`scout-${index}`} className="card-rule-text">
        Look at the top {reward.count} Sector Deck cards. Keep 1 on top; bottom the rest.
      </span>,
    ]
  }

  if (reward.kind === 'next_stop_fuel_discount') {
    return [
      <span key={`next-stop-discount-${index}`} className="card-rule-text">
        The next Destination you complete this sector costs -{reward.amount} Fuel.
      </span>,
    ]
  }

  if (reward.kind === 'ready') {
    const readyTitle = reward.count === 1 ? 'Ready 1 Tired crew' : `Ready ${reward.count} Tired crew`

    return Array.from({ length: reward.count }, (_, rewardIndex) => (
      <span
        key={`ready-${index}-${rewardIndex}`}
        className="card-wake-reward card-ready-transition"
        role="img"
        aria-label={readyTitle}
        title={readyTitle}
      >
        <GameIcon kind="tired-person" />
        <span className="card-ready-transition-arrow" aria-hidden="true" />
        <GameIcon kind="person" />
        <span>{readyTitle}</span>
      </span>
    ))
  }

  return []
}

function renderShipPartReward(shipPart: ShipPartKind) {
  return (
    <span
      key={`ship-part-${shipPart}`}
      className="card-reward-chip card-ship-part-reward"
      title={`${getShipPartLabel(shipPart)}: ${getShipPartUseText(shipPart)}`}
    >
      <GameIcon kind="parts" />
      <span>{getShipPartUseText(shipPart)}</span>
    </span>
  )
}

function renderFindReward(find: DestinationFind) {
  if (find.kind === 'ship_part') {
    return renderShipPartReward(find.shipPart)
  }

  return find.rewards.map(renderReward)
}

function renderShipPartBlueprint(
  card: Card,
  find: Extract<DestinationFind, { kind: 'ship_part' }>,
  currentFuelCost: number,
  hasFuelDiscount: boolean,
  removedFuelCount: number,
) {
  return (
    <>
      <div className="blueprint-part-mark" aria-hidden="true">
        <GameIcon kind="parts" />
      </div>
      <div className="blueprint-cost-row">
        <span>Req:</span>
        <div className="card-rule-icons">
          {renderFuelNeed(card.horizon?.need.fuel ?? 0, currentFuelCost, `${card.id}-fuel-need`)}
          {renderIconPips(card.horizon?.need.icons ?? [], `${card.id}-icon-need`)}
        </div>
      </div>
      {hasFuelDiscount && (
        <p className="card-rule-text blueprint-discount">
          Next Destination discount: {removedFuelCount} Fuel scribbled out.
        </p>
      )}
      <p className="card-rule-text blueprint-reward-text">{getShipPartUseText(find.shipPart)}</p>
    </>
  )
}

function renderCrewNeed(count: number, keyPrefix: string, className = '') {
  return Array.from({ length: count }, (_, index) => (
    <span key={`${keyPrefix}-crew-${index}`} className={className}>
      <GameIcon kind="person" />
    </span>
  ))
}

function renderFuelCellContent(card: Card) {
  return (
    <>
      <div className="fuel-tag-eyebrow">
        <span>Fuel Insert</span>
        <span>HSS Pioneer</span>
      </div>
      <div className="fuel-tag-icon">
        <GameIcon kind="fuel" />
      </div>
      <p className="fuel-tag-rule">Stack on Route when required.</p>
      <div className="fuel-tag-barcode">
        <span>{`FCL-${card.id.toUpperCase()}`}</span>
      </div>
    </>
  )
}

function renderGatePenalty(gate: GateDetails, stressCount: number) {
  if (gate.motherPenalty.extraHumanCrew <= 0) {
    return null
  }

  const isActive = stressCount >= gate.motherPenalty.threshold

  return (
    <div className={`card-gate-penalty ${isActive ? 'is-active' : ''}`}>
      <span className="card-gate-penalty-divider" aria-hidden="true" />
      <p className="card-wake-reward card-gate-penalty-line">
        <span className="card-gate-penalty-pair">
          <span>+{gate.motherPenalty.extraHumanCrew}</span>
          <GameIcon kind="person" />
        </span>
        <span>at</span>
        <span className="card-gate-penalty-pair">
          <span>+{gate.motherPenalty.threshold}</span>
          <span>Stress</span>
        </span>
      </p>
    </div>
  )
}

export function renderGameplayCardContent(card: Card, fuelDiscount: number, stressCount: number) {
  if (card.kind === 'resource' && card.resource) {
    if (card.resource === 'fuel') {
      return renderFuelCellContent(card)
    }

    return (
      <>
        <p className="card-kicker">Ship Resource</p>
        <div className="card-primary-icons">
          <GameIcon kind={card.resource} />
        </div>
        <p className="card-rule-text">Stack this on a Destination when it asks for {titleCase(card.resource)}.</p>
      </>
    )
  }

  if (card.kind === 'crew') {
    return renderCrewCardContent(card)
  }

  if (card.kind === 'mother') {
    return (
      <>
        <p className="card-kicker">{card.spentMother ? 'Spent Ship AI' : 'Ship AI'}</p>
        <div className="card-primary-icons">
          <GameIcon kind="mother" />
        </div>
        <p className="card-rule-text">
          {card.spentMother
            ? 'Spent. Adds 1 Stress and cannot be reused.'
            : 'Covers 1 non-Fuel icon only. Never fills a crew slot. Spent after use.'}
        </p>
      </>
    )
  }

  if (card.kind === 'horizon' && card.horizon) {
    const currentFuelCost = Math.max(0, card.horizon.need.fuel - fuelDiscount)
    const hasFuelDiscount = currentFuelCost < card.horizon.need.fuel
    const removedFuelCount = card.horizon.need.fuel - currentFuelCost
    const find = card.horizon.find

    if (find.kind === 'ship_part') {
      return renderShipPartBlueprint(card, find, currentFuelCost, hasFuelDiscount, removedFuelCount)
    }

    return (
      <>
        <p className="card-kicker">{card.title}</p>
        <div className="card-find-panel is-visit-reward">
          <span className="card-find-label">Immediate Benefit</span>
          <div className="card-rule-icons card-find-reward">
            {renderFindReward(find)}
          </div>
        </div>
        <div className="card-rule-row">
          <span>Cost</span>
          <div className="card-rule-icons">
            {renderFuelNeed(card.horizon.need.fuel, currentFuelCost, `${card.id}-fuel-need`)}
            {renderIconPips(card.horizon.need.icons, `${card.id}-icon-need`)}
          </div>
        </div>
        {hasFuelDiscount && (
          <p className="card-rule-text">
            Next Destination discount: {removedFuelCount} Fuel scribbled out.
          </p>
        )}
      </>
    )
  }

  if (card.kind === 'gate' && card.gate) {
    return (
      <>
        <p className="card-kicker">{card.gate.label}</p>
        <div className="card-rule-row card-gate-section">
          <span>Crew slots</span>
          <div className="card-rule-icons">
            {renderCrewNeed(card.gate.need.crew, `${card.id}-gate-crew-need`)}
            {stressCount >= card.gate.motherPenalty.threshold && renderCrewNeed(
              card.gate.motherPenalty.extraHumanCrew,
              `${card.id}-gate-stress-crew-need`,
              'gate-extra-crew-icon',
            )}
          </div>
        </div>
        <div className="card-rule-row card-gate-section">
          <span>Icons needed</span>
          <div className="card-rule-icons">
            {renderIconPips(card.gate.need.icons, `${card.id}-gate-icon-need`)}
          </div>
        </div>
        {renderGatePenalty(card.gate, stressCount)}
        <p className="card-rule-text">Finish after 3 traveled Destinations. MOTHER and Adaptive Control Consoles cover icons only.</p>
      </>
    )
  }

  return null
}
