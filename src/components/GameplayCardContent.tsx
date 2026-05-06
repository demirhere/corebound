import type {
  Card,
  CrewSpecialization,
  DiscoveryTag,
  DestinationFind,
  GateDetails,
  HazardDetails,
  RequirementIconKind,
  ResourceKind,
  ShipPartKind,
  VisitReward,
} from '../game/types'
import { getShipPartUseText } from '../game/shipParts'
import { renderCrewCardContent } from './CrewCard'
import { GameIcon } from './GameIcon'
import { hashString, type GameIconKind } from './gameIcons'
import { SectorCardArt, SectorCardLayout } from './SectorCardLayout'

const BLUEPRINT_ART_GRID_SIZE = 4
const ROUTE_ART_GRID_SIZE = 4

function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
}

function getDiscoveryTagLabel(tag: DiscoveryTag) {
  return tag === 'anytime' ? 'Anytime' : titleCase(tag)
}

function renderIconPips(
  icons: readonly (RequirementIconKind | CrewSpecialization | ResourceKind)[],
  keyPrefix: string,
) {
  return icons.map((icon, index) => <GameIcon key={`${keyPrefix}-${icon}-${index}`} kind={icon} />)
}

function renderRemovedNeedIcon(
  icon: RequirementIconKind | ResourceKind | 'person',
  key: string,
  title: string,
) {
  return (
    <span key={key} className="removed-need-icon" title={title}>
      <GameIcon kind={icon} />
      <svg className="removed-need-scribble" viewBox="0 0 44 30" focusable="false" aria-hidden="true">
        <path d="M3.8 17c5.2-4.4 9.8 3.7 15.3-.3 5.5-4.1 10.4 3.3 16.1-.6 2.7-1.9 4.7-2.1 6.5-.7" />
      </svg>
    </span>
  )
}

function renderFuelNeed(printedFuel: number, currentFuelCost: number, keyPrefix: string) {
  const activePrintedFuelCount = Math.min(printedFuel, currentFuelCost)
  const removedFuelCount = Math.max(0, printedFuel - currentFuelCost)
  const extraFuelCount = Math.max(0, currentFuelCost - printedFuel)

  return [
    ...Array.from({ length: activePrintedFuelCount }, (_, index) => (
      <GameIcon key={`${keyPrefix}-fuel-${index}`} kind="fuel" />
    )),
    ...Array.from({ length: extraFuelCount }, (_, index) => (
      <span key={`${keyPrefix}-extra-fuel-${index}`} className="extra-need-icon" title="Fuel added by Hazard or Damage">
        <GameIcon kind="fuel" />
      </span>
    )),
    ...Array.from({ length: removedFuelCount }, (_, index) => (
      renderRemovedNeedIcon('fuel', `${keyPrefix}-removed-fuel-${index}`, 'Fuel removed by Destination effect')
    )),
  ]
}

function renderReward(reward: VisitReward, index: number) {
  if (reward.kind === 'resource') {
    return [
      <span key={`${reward.resource}-${index}`} className="sector-card-detail">
        Collect{' '}
        {Array.from({ length: reward.count }, (_, rewardIndex) => (
          <GameIcon key={`${reward.resource}-${index}-${rewardIndex}`} kind={reward.resource} />
        ))}
      </span>,
    ]
  }

  if (reward.kind === 'crew') {
    if (reward.label === 'Wake') {
      return [
        <span key={`wake-${index}`} className="sector-card-detail">
          Wake 1 <GameIcon kind="tired-person" /> and then Ready 1{' '}
          <GameIcon kind="person" />
        </span>,
      ]
    }

    const iconKind = 'person'

    return [
      <span key={`crew-${index}`} className="sector-card-detail">
        {reward.label} {reward.count}{' '}
        {Array.from({ length: reward.count }, (_, rewardIndex) => (
          <GameIcon key={`${iconKind}-${index}-${rewardIndex}`} kind={iconKind} />
        ))}
      </span>
    ]
  }

  if (reward.kind === 'scout') {
    return [
      <span key={`scout-${index}`} className="card-rule-text">
        Peek at top {reward.count} stops, keep 1.
      </span>,
    ]
  }

  if (reward.kind === 'next_stop_fuel_discount') {
    return [
      <span key={`next-stop-discount-${index}`} className="sector-card-detail">
        Next stop -{reward.amount}{' '}
        <GameIcon kind="fuel" />
      </span>,
    ]
  }

  if (reward.kind === 'ready') {
    const readyText = reward.count === 1 ? 'Ready 1' : `Ready ${reward.count}`
    const readyTitle = `${readyText} crew`

    return [
      <span
        key={`ready-${index}`}
        className="sector-card-detail"
        role="img"
        aria-label={readyTitle}
        title={readyTitle}
      >
        {readyText}{' '}
        {Array.from({ length: reward.count }, (_, rewardIndex) => (
          <GameIcon key={`ready-${index}-${rewardIndex}`} kind="person" />
        ))}
      </span>
    ]
  }

  return []
}

function renderVisitReward(find: Extract<DestinationFind, { kind: 'visit_reward' }>) {
  return find.rewards.flatMap(renderReward)
}

function renderShipPartUse(shipPart: ShipPartKind) {
  if (shipPart === 'medbay-rehydrator') {
    return (
      <span className="sector-card-detail">
        Ready 1 <GameIcon kind="tired-person" /> before Gate.
      </span>
    )
  }

  return getShipPartUseText(shipPart)
}

export function renderSectorCardHeaderDetail(card: Card) {
  if (card.kind !== 'horizon' || !card.horizon) {
    return null
  }

  if (card.horizon.find.kind === 'ship_part') {
    return renderShipPartUse(card.horizon.find.shipPart)
  }

  return renderVisitReward(card.horizon.find)
}

function renderShipPartSector(
  card: Card,
  currentFuelCost: number,
  hasFuelDiscount: boolean,
  removedFuelCount: number,
) {
  const need = card.horizon?.need

  if (!need) {
    return null
  }

  const blueprintIndex = hashString(`${card.id}:blueprint`) % (BLUEPRINT_ART_GRID_SIZE * BLUEPRINT_ART_GRID_SIZE)
  const routeIndex = hashString(`${card.id}:route`) % (ROUTE_ART_GRID_SIZE * ROUTE_ART_GRID_SIZE)

  return (
    <SectorCardLayout
      cost={(
        <>
          {renderFuelNeed(need.fuel, currentFuelCost, `${card.id}-fuel-need`)}
          {renderIconPips(need.icons, `${card.id}-icon-need`)}
        </>
      )}
      hasFuelDiscount={hasFuelDiscount}
      removedFuelCount={removedFuelCount}
      visual={null}
      visualClassName="sector-card-part-mark"
      art={(
        <>
          <SectorCardArt variant="blueprint" index={blueprintIndex} gridSize={BLUEPRINT_ART_GRID_SIZE} />
          <SectorCardArt variant="route" index={routeIndex} gridSize={ROUTE_ART_GRID_SIZE} />
        </>
      )}
    />
  )
}

function renderVisitRewardSector(
  card: Card,
  currentFuelCost: number,
  hasFuelDiscount: boolean,
  removedFuelCount: number,
) {
  const need = card.horizon?.need

  if (!need) {
    return null
  }

  return (
    <SectorCardLayout
      cost={(
        <>
          {renderFuelNeed(need.fuel, currentFuelCost, `${card.id}-fuel-need`)}
          {renderIconPips(need.icons, `${card.id}-icon-need`)}
        </>
      )}
      hasFuelDiscount={hasFuelDiscount}
      removedFuelCount={removedFuelCount}
      visual={null}
      visualClassName="sector-card-visit-mark"
    />
  )
}

function renderCrewNeed(count: number, keyPrefix: string, className = '') {
  return Array.from({ length: count }, (_, index) => (
    <span key={`${keyPrefix}-crew-${index}`} className={className}>
      <GameIcon kind="person" />
    </span>
  ))
}

function renderGateCrewNeed(
  baseCrewCount: number,
  stressCrewCount: number,
  coveredCrewSlots: number,
  keyPrefix: string,
) {
  const totalCrewCount = baseCrewCount + stressCrewCount
  const removedCrewCount = Math.min(Math.max(0, coveredCrewSlots), totalCrewCount)
  const activeCrewCount = totalCrewCount - removedCrewCount
  const activeBaseCrewCount = Math.min(baseCrewCount, activeCrewCount)
  const activeStressCrewCount = Math.max(0, activeCrewCount - activeBaseCrewCount)

  return [
    ...renderCrewNeed(activeBaseCrewCount, `${keyPrefix}-base`),
    ...renderCrewNeed(activeStressCrewCount, `${keyPrefix}-stress`, 'gate-extra-crew-icon'),
    ...Array.from({ length: removedCrewCount }, (_, index) => (
      renderRemovedNeedIcon('person', `${keyPrefix}-removed-${index}`, 'Crew slot filled by Service Drone Bay')
    )),
  ]
}

function renderGateIconNeed(
  icons: readonly RequirementIconKind[],
  coveredIconCount: number,
  keyPrefix: string,
) {
  const removedIconCount = Math.min(Math.max(0, coveredIconCount), icons.length)
  const activeIcons = icons.slice(0, icons.length - removedIconCount)
  const removedIcons = icons.slice(activeIcons.length)

  return [
    ...renderIconPips(activeIcons, `${keyPrefix}-active`),
    ...removedIcons.map((icon, index) => (
      renderRemovedNeedIcon(icon, `${keyPrefix}-removed-${icon}-${index}`, 'Icon covered by Adaptive Control Console')
    )),
  ]
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

function getDiscoveryDisplayIcon(card: Card): GameIconKind {
  if (card.discovery?.icon) {
    return card.discovery.icon
  }

  if (card.discovery?.effectKind === 'mission_fuel_discount' || card.discovery?.effectKind === 'ration_pack') {
    return 'fuel'
  }

  if (card.discovery?.effectKind === 'gate_clear_stress') {
    return 'mother'
  }

  if (card.discovery?.effectKind === 'gate_skip_hazard') {
    return 'person'
  }

  return 'any'
}

function renderDiscoveryContent(card: Card) {
  if (!card.discovery) {
    return null
  }

  const specimenNumber = ((card.specimenIndex ?? hashString(card.id)) % 8) + 1
  const tagLabel = getDiscoveryTagLabel(card.discovery.tag)

  return (
    <div className="discovery-specimen">
      <div className="discovery-taxonomy">
        <span>{tagLabel} Discovery</span>
        <span>{`DSP-${String(specimenNumber).padStart(2, '0')}`}</span>
      </div>
      <div className="discovery-sample-area">
        <div className="discovery-route-trace" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="discovery-vial">
          <GameIcon kind={getDiscoveryDisplayIcon(card)} />
          <span className="discovery-vial-bubbles" aria-hidden="true" />
        </div>
      </div>
      <p className="discovery-effect">{card.discovery.effectText}</p>
      <div className="discovery-barcode" aria-hidden="true">
        <span>{card.id.toUpperCase()}</span>
      </div>
    </div>
  )
}

function renderDriftContent(card: Card) {
  if (!card.drift) {
    return null
  }

  const isBurn = card.drift.effectKind === 'burn'

  return (
    <div className="drift-receipt">
      <div className="drift-receipt-heading">
        <span>Drift Wake-Up</span>
        <span>{isBurn ? 'Fuel Burn' : 'Crew Fatigue'}</span>
      </div>
      <div className="drift-receipt-title">{card.title}</div>
      <div className="drift-receipt-code">
        <span>Round End</span>
        <span>{card.id.toUpperCase()}</span>
      </div>
      <div className="drift-receipt-checks" aria-hidden="true">
        <span className={isBurn ? 'is-checked' : ''}>Burn</span>
        <span className={!isBurn ? 'is-checked' : ''}>Fatigue</span>
      </div>
      <p className="drift-receipt-effect">{card.drift.effectText}</p>
      <div className="drift-receipt-footer" aria-hidden="true">
        <span>Resolve</span>
        <span>Discard</span>
      </div>
    </div>
  )
}

function getHazardShortKind(hazard: HazardDetails) {
  return hazard.kind
    .split('-')
    .map(titleCase)
    .join(' ')
}

function renderHazardContent(card: Card) {
  if (!card.hazard) {
    return null
  }

  if (card.damage) {
    return (
      <div className="hazard-card-content hazard-card-damage">
        <div className="hazard-card-eyebrow">
          <span>Ship Damage</span>
          <span>{getHazardShortKind(card.hazard)}</span>
        </div>
        <div className="hazard-card-title">{card.hazard.damageTitle}</div>
        <p className="hazard-card-effect">{card.hazard.damageEffectText}</p>
        <div className="hazard-card-footer">
          <span>Permanent</span>
          <span>{card.id.toUpperCase()}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="hazard-card-content">
      <div className="hazard-card-eyebrow">
        <span>Gate Hazard</span>
        <span>{card.hazard.flavorText}</span>
      </div>
      <div className="hazard-card-title">{card.title}</div>
      <section className="hazard-card-panel">
        <span>Effect at this Gate</span>
        <p>{card.hazard.effectText}</p>
      </section>
      <section className="hazard-card-panel">
        <span>Clear</span>
        <p>{card.hazard.clearText}</p>
      </section>
      <section className="hazard-card-panel">
        <span>Damage if not cleared</span>
        <p>{card.hazard.damageTitle}</p>
      </section>
    </div>
  )
}

export function renderGameplayCardContent(
  card: Card,
  fuelDiscount: number,
  fuelSurcharge: number,
  stressCount: number,
  gateExtraCrewCount = 0,
  gateCrewSlotDiscount = 0,
  gateIconDiscount = 0,
) {
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

  if (card.kind === 'discovery') {
    return renderDiscoveryContent(card)
  }

  if (card.kind === 'drift') {
    return renderDriftContent(card)
  }

  if (card.kind === 'hazard') {
    return renderHazardContent(card)
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
    const currentFuelCost = Math.max(0, card.horizon.need.fuel + fuelSurcharge - fuelDiscount)
    const hasFuelDiscount = currentFuelCost < card.horizon.need.fuel
    const removedFuelCount = card.horizon.need.fuel - currentFuelCost
    const find = card.horizon.find

    if (find.kind === 'ship_part') {
      return renderShipPartSector(card, currentFuelCost, hasFuelDiscount, removedFuelCount)
    }

    return renderVisitRewardSector(card, currentFuelCost, hasFuelDiscount, removedFuelCount)
  }

  if (card.kind === 'gate' && card.gate) {
    const stressCrewCount = gateExtraCrewCount
    const hasShipPartDiscount = gateCrewSlotDiscount > 0 || gateIconDiscount > 0

    return (
      <>
        <p className="card-kicker">{card.gate.label}</p>
        <div className="card-rule-row card-gate-section">
          <span>Crew slots</span>
          <div className="card-rule-icons">
            {renderGateCrewNeed(
              card.gate.need.crew,
              stressCrewCount,
              gateCrewSlotDiscount,
              `${card.id}-gate-crew-need`,
            )}
          </div>
        </div>
        <div className="card-rule-row card-gate-section">
          <span>Icons needed</span>
          <div className="card-rule-icons">
            {renderGateIconNeed(card.gate.need.icons, gateIconDiscount, `${card.id}-gate-icon-need`)}
          </div>
        </div>
        {stressCrewCount > 0 ? renderGatePenalty(card.gate, stressCount) : null}
        {hasShipPartDiscount && (
          <p className="card-rule-text sector-card-discount">Ship Parts auto-scribble Gate needs.</p>
        )}
        <p className="card-rule-text">Finish after 3 traveled Destinations. MOTHER and Adaptive Control Consoles cover icons only.</p>
      </>
    )
  }

  return null
}
