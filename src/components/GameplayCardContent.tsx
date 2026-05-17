import type {
  Card,
  CrewSpecialization,
  DiscoveryTag,
  DestinationFind,
  HazardDetails,
  MissionPatternKind,
  RequirementIconKind,
  ResourceKind,
  ShipPartKind,
  VisitReward,
} from '../game/types'
import { getMissionPatternLabel } from '../game/rules'
import { getShipPartUseText } from '../game/shipParts'
import { renderCrewCardContent } from './CrewCard'
import { GameIcon } from './GameIcon'
import { hashString, type GameIconKind } from './gameIcons'
import { SectorCardArt, SectorCardLayout } from './SectorCardLayout'

const BLUEPRINT_ART_GRID_SIZE = 4
const ROUTE_ART_GRID_SIZE = 4
type NeedIconKind = RequirementIconKind | CrewSpecialization | ResourceKind | 'person' | 'any'

const shipPartDescriptionIcons = {
  Fuel: 'fuel',
  Engine: 'engine',
  Life: 'life',
  Nav: 'star',
  Science: 'signal',
  Hull: 'hull',
  Scrap: 'scrap',
  Scraps: 'scrap',
  MOTHER: 'mother',
} as const satisfies Record<string, GameIconKind>

const shipPartDescriptionIconPattern = /(Fuel|Engine|Life|Nav|Science|Hull|Scraps?|MOTHER)/g

function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`
}

function getDiscoveryTagLabel(tag: DiscoveryTag) {
  return tag === 'anytime' ? 'Anytime' : titleCase(tag)
}

function sortNeedIconGroups<T extends { count: number }>(items: readonly T[]) {
  return [
    ...items.filter((item) => item.count === 1),
    ...items.filter((item) => item.count > 1),
  ]
}

function countNeedIcons(icons: readonly NeedIconKind[]) {
  const counts = new Map<NeedIconKind, number>()
  const orderedIcons: NeedIconKind[] = []

  for (const icon of icons) {
    if (!counts.has(icon)) {
      orderedIcons.push(icon)
    }

    counts.set(icon, (counts.get(icon) ?? 0) + 1)
  }

  return sortNeedIconGroups(
    orderedIcons.map((icon) => ({ icon, count: counts.get(icon) ?? 0 })),
  )
}

function renderNeedIcon(icon: NeedIconKind, count: number, key: string, className = '', title?: string) {
  if (count <= 0) {
    return null
  }

  if (count === 1 && !className) {
    return <GameIcon key={key} kind={icon as GameIconKind} />
  }

  const classNames = ['need-icon-count', className].filter(Boolean).join(' ')

  return (
    <span key={key} className={classNames} title={title}>
      {count > 1 ? <span className="need-icon-count-label">{count}x</span> : null}
      <GameIcon kind={icon as GameIconKind} />
    </span>
  )
}

function renderIconPips(icons: readonly NeedIconKind[], keyPrefix: string) {
  return countNeedIcons(icons).map(({ icon, count }) => (
    renderNeedIcon(icon, count, `${keyPrefix}-${icon}`)
  ))
}

// Abstract spec slots for pattern missions. Each number is a "color group" —
// slots sharing a number must be the SAME spec, slots with different numbers
// must be DIFFERENT specs. Specific icon identity (Engine vs Life vs Nav vs
// Science) is intentionally hidden so the visual matches the structural rule
// ("any matched pair", "any 3 sharing one spec") instead of suggesting that
// a particular icon on the card is required.
function getMissionSpecGroups(
  pattern: MissionPatternKind,
): readonly (readonly number[])[] {
  switch (pattern) {
    case 'open':
      // Open missions hide their pattern hint — the reward is computed
      // dynamically from whatever crew the player stacks.
      return []
    case 'cross-trained':
      return [[1, 2]]
    case 'specialist':
      return [[1, 1]]
    case 'common-ground':
      return [[1], [1]]
    case 'common-knowledge':
      return [[1], [1], [1]]
    case 'common-cause':
      return [[1], [1], [1], [1]]
    case 'department-heads':
      return [[1, 1], [2, 2]]
    case 'bridge-crew':
      return [[1, 1], [2, 2], [3, 3], [4, 4]]
  }
}

function missionPatternUsesSeparateCrewBadges(pattern: MissionPatternKind): boolean {
  switch (pattern) {
    case 'common-ground':
    case 'common-knowledge':
    case 'common-cause':
    case 'department-heads':
    case 'bridge-crew':
      return true
    case 'open':
    case 'cross-trained':
    case 'specialist':
      return false
  }
}

function renderMissionSpecSlot(color: number, key: string) {
  return (
    <span
      key={key}
      className="mission-spec-slot"
      data-spec-color={color}
      aria-hidden="true"
    />
  )
}

function renderMissionSpecGroup(
  group: readonly number[],
  keyPrefix: string,
  showCrewBadge: boolean,
) {
  if (group.length <= 1) {
    const [color] = group
    if (color === undefined) return null

    if (showCrewBadge) {
      return (
        <span key={keyPrefix} className="mission-crew-badge" title="One crew with this spec">
          <GameIcon kind="person" />
          {renderMissionSpecSlot(color, `${keyPrefix}-spec`)}
        </span>
      )
    }

    return renderMissionSpecSlot(color, keyPrefix)
  }

  return (
    <span
      key={keyPrefix}
      className={`mission-icon-group${showCrewBadge ? ' mission-crew-badge' : ''}`}
      title={showCrewBadge ? 'One crew with these specs' : undefined}
    >
      {showCrewBadge ? <GameIcon kind="person" /> : null}
      {group.map((color, index) => (
        renderMissionSpecSlot(color, `${keyPrefix}-${index}`)
      ))}
    </span>
  )
}

function renderMissionIcons(
  icons: readonly RequirementIconKind[],
  pattern: MissionPatternKind | undefined,
  keyPrefix: string,
) {
  if (!pattern) {
    return renderIconPips(icons, keyPrefix)
  }

  const groups = getMissionSpecGroups(pattern)
  const showCrewBadge = missionPatternUsesSeparateCrewBadges(pattern)
  return groups.map((group, index) => (
    renderMissionSpecGroup(group, `${keyPrefix}-group-${index}`, showCrewBadge)
  ))
}

function renderRemovedNeedIcon(
  icon: NeedIconKind,
  key: string,
  title: string,
  count = 1,
) {
  return (
    <span key={key} className="removed-need-icon" title={title}>
      {renderNeedIcon(icon, count, `${key}-count`)}
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
    renderNeedIcon('fuel', activePrintedFuelCount, `${keyPrefix}-fuel`),
    renderNeedIcon('fuel', extraFuelCount, `${keyPrefix}-extra-fuel`, 'extra-need-icon', 'Fuel added by Gate or Damage'),
    removedFuelCount > 0
      ? renderRemovedNeedIcon('fuel', `${keyPrefix}-removed-fuel`, 'Fuel removed by discount', removedFuelCount)
      : null,
  ]
}

function renderMissionAnyIconSurcharge(count: number, keyPrefix: string) {
  return renderNeedIcon(
    'any',
    count,
    `${keyPrefix}-long-reach-any`,
    'extra-need-icon',
    'Long Reach adds 1 crew icon to the 3rd Mission in a sector',
  )
}

function renderResourceReward(reward: Extract<VisitReward, { kind: 'resource' }>, index: number) {
  return (
    <span key={`${reward.resource}-${index}`} className="sector-card-resource-reward need-icon-count">
      <span>Recover</span>
      {reward.count > 1 ? <span className="need-icon-count-label">{reward.count}x</span> : null}
      <GameIcon kind={reward.resource as GameIconKind} />
    </span>
  )
}

function renderRewardIconCount(icon: GameIconKind, count: number, key: string) {
  return (
    <span className="need-icon-count" key={key}>
      {count > 1 ? <span className="need-icon-count-label">{count}x</span> : null}
      <GameIcon kind={icon} />
    </span>
  )
}

function renderReward(reward: VisitReward, index: number) {
  if (reward.kind === 'resource') {
    return [renderResourceReward(reward, index)]
  }

  if (reward.kind === 'crew') {
    if (reward.label === 'Wake') {
      const wakeText = 'Wake'
      const readyText = 'Ready'

      return [
        <span key={`wake-${index}`} className="card-crew-reward">
          {wakeText} {renderRewardIconCount('tired-person', reward.count, `wake-${index}-icon`)}
          {' and then '}{readyText} {renderRewardIconCount('person', reward.count, `wake-ready-${index}-icon`)}
        </span>,
      ]
    }

    const iconKind = 'person'

    return [
      <span key={`crew-${index}`} className="card-crew-reward">
        {reward.label}{' '}
        {renderRewardIconCount(iconKind, reward.count, `${iconKind}-${index}`)}
      </span>
    ]
  }

  if (reward.kind === 'scout') {
    return [
      <span key={`scout-${index}`} className="card-rule-text">
        Peek at top {reward.count} Missions, keep 1.
      </span>,
    ]
  }

  if (reward.kind === 'next_stop_fuel_discount') {
    return [
      <span key={`next-stop-discount-${index}`} className="sector-card-detail">
        Next Mission -{reward.amount}{' '}
        <GameIcon kind="fuel" />
      </span>,
    ]
  }

  if (reward.kind === 'next_gate_fuel_discount') {
    return [
      <span key={`next-gate-discount-${index}`} className="sector-card-detail">
        Next Gate -{reward.amount}{' '}
        <GameIcon kind="fuel" />
      </span>,
    ]
  }

  if (reward.kind === 'ready') {
    const readyText = 'Ready'
    const readyTitle = `${readyText} crew`

    return [
      <span
        key={`ready-${index}`}
        className="card-crew-reward"
        role="img"
        aria-label={readyTitle}
        title={readyTitle}
      >
        {readyText}{' '}
        {renderRewardIconCount('person', reward.count, `ready-${index}-icon`)}
      </span>
    ]
  }

  return []
}

function renderVisitReward(find: Extract<DestinationFind, { kind: 'visit_reward' }>) {
  return find.rewards.flatMap(renderReward)
}

function renderShipPartDescriptionText(description: string) {
  return description.split(shipPartDescriptionIconPattern).map((part, index) => {
    const icon = shipPartDescriptionIcons[part as keyof typeof shipPartDescriptionIcons]

    if (!icon) {
      return part
    }

    return <GameIcon key={`${part}-${index}`} kind={icon} />
  })
}

export function renderShipPartDescription(description: string) {
  return (
    <span className="sector-card-detail">
      {renderShipPartDescriptionText(description)}
    </span>
  )
}

function renderShipPartUse(shipPart: ShipPartKind) {
  if (shipPart === 'medbay-rehydrator') {
    return (
      <span className="sector-card-detail">
        Ready +1 <GameIcon kind="tired-person" /> after each sector.
      </span>
    )
  }

  if (shipPart === 'service-drone-bay') {
    return (
      <span className="sector-card-detail">
        Reduce Sector Gate <GameIcon kind="person" /> need by 1.
      </span>
    )
  }

  return renderShipPartDescription(getShipPartUseText(shipPart))
}

export function renderSectorCardHeaderDetail(card: Card) {
  if (card.kind !== 'mission' || !card.mission) {
    return null
  }

  if (card.mission.pattern === 'open') {
    return null
  }

  if (card.mission.find.kind === 'ship_part') {
    const rewards = card.mission.find.rewards ?? []

    return (
      <>
        {renderShipPartUse(card.mission.find.shipPart)}
        {rewards.length > 0 ? <> {' + '}{rewards.flatMap(renderReward)}</> : null}
      </>
    )
  }

  return renderVisitReward(card.mission.find)
}

function renderShipPartSector(
  card: Card,
  currentFuelCost: number,
  hasFuelDiscount: boolean,
  removedFuelCount: number,
  missionAnyIconSurcharge: number,
  showCost: boolean,
) {
  const need = card.mission?.need

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
          {renderMissionAnyIconSurcharge(missionAnyIconSurcharge, card.id)}
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
      showCost={showCost}
    />
  )
}

function renderVisitRewardSector(
  card: Card,
  currentFuelCost: number,
  hasFuelDiscount: boolean,
  removedFuelCount: number,
  missionAnyIconSurcharge: number,
) {
  const need = card.mission?.need
  const pattern = card.mission?.pattern

  if (!need) {
    return null
  }

  return (
    <SectorCardLayout
      cost={(
        <>
          {renderFuelNeed(need.fuel, currentFuelCost, `${card.id}-fuel-need`)}
          {renderMissionIcons(need.icons, pattern, `${card.id}-icon-need`)}
          {renderMissionAnyIconSurcharge(missionAnyIconSurcharge, card.id)}
        </>
      )}
      hasFuelDiscount={hasFuelDiscount}
      removedFuelCount={removedFuelCount}
      visual={null}
      visualClassName="sector-card-visit-mark"
      costLabel={pattern ? `Crew: ${getMissionPatternLabel(pattern)}` : 'Crew'}
    />
  )
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

function renderScrapTokenContent(card: Card) {
  return (
    <>
      <div className="scrap-token-eyebrow">
        <span>Salvage Token</span>
        <span>1 UNIT</span>
      </div>
      <div className="scrap-token-stamp" aria-hidden="true">
        <span className="scrap-token-stamp-numeral">1</span>
        <span className="scrap-token-stamp-label">SCR</span>
      </div>
      <p className="scrap-token-rule">Spend at Research to buy Ship Parts.</p>
      <div className="scrap-token-serial">
        <span>{`SLVG-${card.id.toUpperCase()}`}</span>
      </div>
    </>
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
          <span>{card.hazard.effectImplemented ? getHazardShortKind(card.hazard) : 'To be implemented'}</span>
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
        <span>Damage</span>
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
        <span>Permanent effect</span>
        <p>{card.hazard.damageTitle}</p>
      </section>
    </div>
  )
}

function renderActiveShipPartContent(card: Card) {
  const part = card.shipPart
  if (!part) return null

  return <></>
}

export function renderGameplayCardContent(
  card: Card,
  fuelDiscount: number,
  fuelSurcharge: number,
  missionAnyIconSurcharge: number,
  _stressCount: number,
  _gateExtraCrewCount: number,
  _gateCrewSlotDiscount: number,
  _gateIconDiscount: number,
  gateFuelDiscount = 0,
  isAcquiredShipPart = false,
  _waterPairFuelAmount = 1,
) {
  void _waterPairFuelAmount

  if (card.kind === 'resource' && card.resource) {
    if (card.resource === 'fuel') {
      return renderFuelCellContent(card)
    }

    if (card.resource === 'scrap') {
      return renderScrapTokenContent(card)
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

  if (card.kind === 'active-ship-part' && card.shipPart) {
    return renderActiveShipPartContent(card)
  }

  if (card.kind === 'mission' && card.mission) {
    if (card.mission.pattern === 'open') {
      return null
    }

    const currentFuelCost = Math.max(0, card.mission.need.fuel + fuelSurcharge - fuelDiscount)
    const hasFuelDiscount = currentFuelCost < card.mission.need.fuel
    const removedFuelCount = card.mission.need.fuel - currentFuelCost
    const find = card.mission.find

    if (find.kind === 'ship_part') {
      return renderShipPartSector(
        card,
        currentFuelCost,
        hasFuelDiscount,
        removedFuelCount,
        missionAnyIconSurcharge,
        !isAcquiredShipPart,
      )
    }

    return renderVisitRewardSector(card, currentFuelCost, hasFuelDiscount, removedFuelCount, missionAnyIconSurcharge)
  }

  if (card.kind === 'gate' && card.gate) {
    const currentGateFuelCost = Math.max(0, card.gate.need.fuel - gateFuelDiscount)

    return (
      <div className="gate-fuel-summary" title={`Cost: ${currentGateFuelCost} Fuel. Spent from Fuel Supply when the Gate is passed.`}>
        <GameIcon kind="fuel" />
        <span>{`x${currentGateFuelCost}`}</span>
      </div>
    )
  }

  return null
}
