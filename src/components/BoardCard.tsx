import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type {
  Card,
  CrewSpecialization,
  GateDetails,
  HorizonReward,
  RequirementIconKind,
  ResourceKind,
} from '../game/types'
import { DeckIcon } from './DeckIcon'
import { GameIcon } from './GameIcon'
import { pickCardIcons, pickCardNote } from './gameIcons'

export type CardView = Card

export type CardPointerDownHandler = (
  event: ReactPointerEvent<HTMLDivElement>,
  stackId: string,
  cardId: string,
  cardIndex: number,
) => void

export type CardKeyDownHandler = (
  event: ReactKeyboardEvent<HTMLDivElement>,
  stackId: string,
  cardId: string,
) => void

type BoardCardProps = {
  card: CardView
  stackId: string
  cardIndex: number
  isStackActive: boolean
  stackOffsetRatio: number
  fuelDiscount: number
  onPointerDown: CardPointerDownHandler
  onKeyDown: CardKeyDownHandler
}

type CardShellProps = {
  card: CardView
  className?: string
  style?: CSSProperties
  isActive?: boolean
  fuelDiscount?: number
  ariaLabel: string
  dataHandCardId?: string
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
}

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
      <span key={`${keyPrefix}-removed-fuel-${index}`} className="removed-need-icon" title="Fuel removed by Star effect">
        <GameIcon kind="fuel" />
        <span className="removed-need-person" aria-hidden="true">
          <GameIcon kind="person" />
        </span>
      </span>
    )),
  ]
}

function renderReward(reward: HorizonReward, index: number) {
  if (reward.kind === 'resource') {
    const iconKind = reward.resource
    return Array.from({ length: reward.count }, (_, rewardIndex) =>
      <GameIcon key={`${iconKind}-${index}-${rewardIndex}`} kind={iconKind} />,
    )
  }
  if (reward.kind === 'crew') {
    if (reward.label === 'Wake') {
      return [
        <span key={`wake-${index}`} className="card-wake-reward">
          <GameIcon kind="person" />
          <span>Choose 1 of 2. Will join tired.</span>
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
        Next round peek at {reward.count} Horizon cards and discard 1.
      </span>,
    ]
  }
  if (reward.kind === 'next_star_fuel_discount') {
    return [
      <span key={`next-star-discount-${index}`} className="card-rule-text">
        The next Star you complete this sector costs -{reward.amount} Fuel.
      </span>,
    ]
  }
  if (reward.kind === 'ready') {
    return [
      <span key={`ready-${index}`} className="card-wake-reward">
        {Array.from({ length: reward.count }, (_, rewardIndex) =>
          <GameIcon key={`ready-${index}-${rewardIndex}`} kind="person" />,
        )}
        <span>Will join tired.</span>
      </span>,
    ]
  }
  return []
}

function renderAnyNeed(count: number, keyPrefix: string) {
  return Array.from({ length: count }, (_, index) => (
    <GameIcon key={`${keyPrefix}-any-${index}`} kind="person" />
  ))
}

function renderGatePenalty(gate: GateDetails) {
  if (gate.motherPenalty.extraCrew <= 0) {
    return null
  }

  return (
    <p className="card-rule-text">
      {gate.motherPenalty.threshold}+ MOTHER cards: need +{gate.motherPenalty.extraCrew} crew.
    </p>
  )
}

function renderGameplayCardContent(card: CardView, fuelDiscount: number) {
  if (card.kind === 'resource' && card.resource) {
    return (
      <>
        <p className="card-kicker">Ship Resource</p>
        <div className="card-primary-icons">
          <GameIcon kind={card.resource} />
        </div>
        <p className="card-rule-text">Stack this on a Horizon card when it asks for {titleCase(card.resource)}.</p>
      </>
    )
  }

  if (card.kind === 'crew') {
    const specializations = card.specializations ?? []

    return (
      <>
        <p className="card-kicker">Crew</p>
        <div className="card-primary-icons">
          {renderIconPips(specializations, `${card.id}-crew`)}
        </div>
        <p className="card-rule-text">Covers both shown specializations when committed.</p>
      </>
    )
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
            ? 'Spent. Counts against MOTHER pressure and cannot be reused.'
            : 'Covers 1 non-Fuel icon on a Horizon or Gate. Spent after use.'}
        </p>
      </>
    )
  }

  if (card.kind === 'horizon' && card.horizon) {
    const currentFuelCost = Math.max(0, card.horizon.need.fuel - fuelDiscount)
    const hasFuelDiscount = currentFuelCost < card.horizon.need.fuel
    const removedFuelCount = card.horizon.need.fuel - currentFuelCost

    return (
      <>
        <p className="card-kicker">{titleCase(card.horizon.kind)}</p>
        <div className="card-rule-row">
          <span>Need</span>
          <div className="card-rule-icons">
            {renderFuelNeed(card.horizon.need.fuel, currentFuelCost, `${card.id}-fuel-need`)}
            {renderIconPips(card.horizon.need.icons, `${card.id}-icon-need`)}
          </div>
        </div>
        {hasFuelDiscount && (
          <p className="card-rule-text">
            Next Star discount: {removedFuelCount} Fuel scribbled out.
          </p>
        )}
        <div className="card-rule-row">
          <span className="card-reward-equals">=</span>
          <div className="card-rule-icons">
            {card.horizon.rewards.map(renderReward)}
          </div>
        </div>
      </>
    )
  }

  if (card.kind === 'gate' && card.gate) {
    return (
      <>
        <p className="card-kicker">{card.gate.label}</p>
        <div className="card-rule-row">
          <span>Need</span>
          <div className="card-rule-icons">
            {renderIconPips(card.gate.need.icons, `${card.id}-gate-icon-need`)}
            {renderAnyNeed(card.gate.need.any, `${card.id}-gate`)}
          </div>
        </div>
        {renderGatePenalty(card.gate)}
        <p className="card-rule-text">Finish after traveling through all Horizons.</p>
      </>
    )
  }

  return null
}

export function CardShell({
  card,
  className = '',
  style,
  isActive = false,
  fuelDiscount = 0,
  ariaLabel,
  dataHandCardId,
  onPointerDown,
  onKeyDown,
}: CardShellProps) {
  const sampledIcons = pickCardIcons(`${card.id}:${card.title}`)
  const noteLines = pickCardNote(`${card.id}:${card.title}`)
  const gameplayContent = renderGameplayCardContent(card, fuelDiscount)

  return (
    <div
      className={`card-shell ${card.faceUp ? 'is-face-up' : 'is-face-down'} ${
        isActive ? 'is-being-dragged' : ''
      } card-kind-${card.kind} ${card.spentMother ? 'is-spent-mother' : ''} ${className}`}
      data-hand-card-id={dataHandCardId}
      style={
        {
          '--card-hue': String(card.hue),
          '--card-accent': card.accent,
          ...style,
        } as CSSProperties
      }
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <div className="card-inner">
        <article className="card-face card-front">
          <header className="card-header">
            <span className="card-title">{card.title}</span>
          </header>
          <div className={`card-art ${gameplayContent ? 'card-art-gameplay' : ''}`} aria-hidden="true">
            {gameplayContent ?? (
              <>
                <div className="card-icon-row">
                  {sampledIcons.map((icon) => (
                    <GameIcon key={icon} kind={icon} />
                  ))}
                </div>
                <p className="card-note">
                  {noteLines.map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                  ))}
                </p>
              </>
            )}
          </div>
        </article>

        <article className="card-face card-back" aria-hidden="true">
          <DeckIcon kind={card.icon} className="back-mark" />
        </article>
      </div>
    </div>
  )
}

export function BoardCard({
  card,
  stackId,
  cardIndex,
  isStackActive,
  stackOffsetRatio,
  fuelDiscount,
  onPointerDown,
  onKeyDown,
}: BoardCardProps) {
  return (
    <CardShell
      card={card}
      isActive={isStackActive}
      fuelDiscount={fuelDiscount}
      style={
        {
          top: `${cardIndex * stackOffsetRatio * 100}%`,
          zIndex: cardIndex + 1,
        } as CSSProperties
      }
      ariaLabel={`${card.title}. Drag to move this part of the stack.`}
      onPointerDown={(event) => onPointerDown(event, stackId, card.id, cardIndex)}
      onKeyDown={(event) => onKeyDown(event, stackId, card.id)}
    />
  )
}
