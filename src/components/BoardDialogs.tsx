import { useEffect, type CSSProperties } from 'react'
import type { BoardState, GameLossReason } from '../game/types'
import { CardShell } from './BoardCard'
import { GameIcon } from './GameIcon'
import { GAME_ICON_LABELS, type GameIconKind } from './gameIcons'

type BoardView = BoardState

type LossStat = {
  label: string
  value: string
  iconKind?: 'fuel' | 'hull'
  iconLabel?: string
}

function lossContent(reason: GameLossReason) {
  if (reason === 'sector-stranded') {
    return {
      title: 'Stranded in the Reach.',
      body: 'The sector cannot produce another visible Map Destination before the route is full.',
    }
  }

  return {
    title: 'The Gate cannot be passed.',
    body: 'The Gate cannot be completed with available Ship Parts, Ready crew, and unused MOTHER cards.',
  }
}

function getLossStats(board: BoardView): LossStat[] {
  const fuelSpent = board.completedStarSummaries.reduce(
    (total, summary) => total + summary.fuelSpent,
    0,
  )
  const sectorsCompleted = Math.max(0, Math.min(board.totalSectors, board.currentSector - 1))

  return [
    {
      label: 'Destinations visited',
      value: String(board.completedStarSummaries.length),
    },
    {
      label: 'Sectors completed',
      value: String(sectorsCompleted),
    },
    {
      label: 'Most used resource',
      value: fuelSpent > 0 ? 'Fuel' : 'None',
      iconKind: fuelSpent > 0 ? 'fuel' : undefined,
      iconLabel: fuelSpent > 0 ? 'Fuel' : undefined,
    },
    {
      label: 'Stress',
      value: String(board.stressCount),
    },
  ]
}

function FailureFlameIcon() {
  return (
    <figure className="crashed-ship-art" aria-hidden="true">
      <svg viewBox="0 0 420 330" focusable="false">
        <path className="flame-icon-fill" d="M214 38c-60 66-93 116-93 170 0 58 40 98 89 98 52 0 91-39 91-96 0-47-25-87-67-126 3 37-9 67-35 91 5-48-3-91 15-137Z" />
        <path className="flame-icon-cutout" d="M206 154c-29 34-45 59-45 88 0 28 20 48 47 48 29 0 49-21 49-50 0-24-13-45-36-69 1 23-6 40-22 54 3-28-3-52 7-71Z" />
        <path className="flame-icon-line" d="M179 91c-24 35-36 70-36 106M270 164c8 19 11 38 8 58M191 279c17 6 37 6 55 0M137 238c9 23 27 41 52 53" />
        <path className="flame-icon-spark" d="M95 144l28 5M315 116l21-18M322 229l28 12M108 231l-24 18" />
        <circle className="flame-icon-dot" cx="303" cy="78" r="6" />
        <circle className="flame-icon-dot" cx="101" cy="91" r="4.8" />
      </svg>
    </figure>
  )
}

type HowToPlayMiniCardTone = 'destination' | 'gate'

function iconListLabel(icons: readonly GameIconKind[]) {
  return icons.map((icon) => GAME_ICON_LABELS[icon]).join(', ')
}

function HowToPlayIconStrip({ icons }: { icons: readonly GameIconKind[] }) {
  return (
    <span className="how-to-play-icon-strip" aria-label={iconListLabel(icons)}>
      {icons.map((icon, index) => (
        <GameIcon key={`${icon}-${index}`} kind={icon} />
      ))}
    </span>
  )
}

function HowToPlayMiniCard({ kicker, title, icons, tone }: {
  kicker: string
  title: string
  icons: readonly GameIconKind[]
  tone: HowToPlayMiniCardTone
}) {
  return (
    <article
      className="how-to-play-mini-card"
      data-tone={tone}
      aria-label={`${kicker}: ${title}. ${iconListLabel(icons)}`}
    >
      <span className="how-to-play-card-kicker">{kicker}</span>
      <strong>{title}</strong>
      <HowToPlayIconStrip icons={icons} />
    </article>
  )
}

function HowToPlayChip({ icon, label }: { icon: GameIconKind; label: string }) {
  return (
    <span className="how-to-play-chip">
      <GameIcon kind={icon} />
      <span>{label}</span>
    </span>
  )
}

export function HowToPlayDialog({ isOpen, onClose, canClose }: {
  isOpen: boolean
  onClose: () => void
  canClose: boolean
}) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (canClose && event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canClose, isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="dialog-overlay how-to-play-overlay"
      onPointerDown={(event) => {
        if (canClose && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="arrival-panel how-to-play-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
      >
        <p className="arrival-kicker">Corebound Rulebook</p>
        <h2 id="how-to-play-title">How To Play</h2>
        <p className="how-to-play-summary">
          Win by clearing 2 sectors. Each sector is 3 Destinations, then 1 Gate.
        </p>

        <div className="how-to-play-flow" aria-label="Sector route summary">
          <HowToPlayMiniCard
            kicker="Choose"
            title="Destination"
            icons={['fuel', 'life', 'star']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Complete"
            title="Destination"
            icons={['fuel', 'engine', 'signal']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Complete"
            title="Destination"
            icons={['fuel', 'life', 'engine']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Then pass"
            title="Gate"
            icons={['person', 'person', 'person', 'engine', 'life', 'star', 'signal']}
            tone="gate"
          />
        </div>

        <div className="how-to-play-icon-key" aria-label="Important icon key">
          <HowToPlayChip icon="fuel" label="Fuel" />
          <HowToPlayChip icon="person" label="Ready crew" />
          <HowToPlayChip icon="tired-person" label="Tired crew" />
          <HowToPlayChip icon="mother" label="MOTHER" />
          <HowToPlayChip icon="parts" label="Ship Part" />
        </div>

        <div className="how-to-play-rulebook">
          <section className="how-to-play-wide-section">
            <h3>Core Loop</h3>
            <ol>
              <li>Click Sector Stops once per turn to reveal 3 Map Destinations.</li>
              <li>Pick 1 Destination and drag payment onto it.</li>
              <li>Match all printed <GameIcon kind="fuel" /> and crew-icon requirements.</li>
              <li>Click the stack action button. Used crew become <GameIcon kind="tired-person" />.</li>
              <li>Resolve the find, clear the other Map cards, then end turn before drawing again.</li>
            </ol>
          </section>

          <section>
            <h3>Paying Costs</h3>
            <div className="how-to-play-equations">
              <p><HowToPlayChip icon="fuel" label="Fuel Cell" /> pays Fuel.</p>
              <p><HowToPlayChip icon="person" label="Ready crew" /> pays matching icons.</p>
              <p><HowToPlayIconStrip icons={['engine', 'signal']} /> Engineer + Scientist can make 1 <GameIcon kind="fuel" />.</p>
              <p><HowToPlayChip icon="mother" label="MOTHER" /> covers 1 missing non-Fuel icon and adds Stress.</p>
            </div>
          </section>

          <section>
            <h3>Finds</h3>
            <div className="how-to-play-find-types">
              <p><strong>Immediate Benefit</strong> resolves now.</p>
              <p><strong>Ship Part</strong> stays for a Gate. Parts automatically ready crew, fill a crew slot, or cover an icon.</p>
            </div>
          </section>

          <section>
            <h3>Gates</h3>
            <p>
              After 3 Destinations, fill every <GameIcon kind="person" /> slot and cover every icon:
              {' '}<HowToPlayIconStrip icons={['engine', 'life', 'star', 'signal']} />. At 3+ Stress,
              add 1 extra crew slot.
            </p>
          </section>

          <section className="how-to-play-wide-section how-to-play-warning-section">
            <h3>Critical Reminders</h3>
            <p>
              MOTHER never pays <GameIcon kind="fuel" /> and never fills <GameIcon kind="person" /> slots.
              You lose if the sector cannot produce another visible Map Destination, or if the Gate cannot be passed
              with Ready crew, Ship Parts, and unused MOTHER.
            </p>
          </section>
        </div>

        <button type="button" autoFocus onClick={onClose} disabled={!canClose}>
          Close Manual
        </button>
      </section>
    </div>
  )
}

export function ArrivalDialog({ hasArrived, onResetGame, canReset }: {
  hasArrived: boolean
  onResetGame: () => void
  canReset: boolean
}) {
  if (!hasArrived) {
    return null
  }

  return (
    <div className="dialog-overlay">
      <section className="arrival-panel" role="status" aria-live="polite">
        <p className="arrival-kicker">Gate cleared</p>
        <h2>You arrived beyond the Dark Threshold.</h2>
        <p>Two-sector prototype complete. Restart to reshuffle both sectors and run it again.</p>
        <button type="button" onClick={onResetGame} disabled={!canReset}>
          Restart and reshuffle
        </button>
      </section>
    </div>
  )
}

export function LossDialog({ board, onResetGame, canReset }: {
  board: BoardView
  onResetGame: () => void
  canReset: boolean
}) {
  const loss = board.lossReason ? lossContent(board.lossReason) : null

  if (!loss) {
    return null
  }

  return (
    <div className="dialog-overlay failure-overlay">
      <FailureFlameIcon />
      <section
        className="arrival-panel loss-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loss-title"
      >
        <p className="arrival-kicker">Ship failed</p>
        <h2 id="loss-title">{loss.title}</h2>
        <p>{loss.body}</p>
        <dl className="loss-stats" aria-label="Failed run stats">
          {getLossStats(board).map((stat) => (
            <div className="loss-stat" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd aria-label={stat.iconLabel ?? stat.value}>
                {stat.iconKind && <GameIcon kind={stat.iconKind} />}
                <span>{stat.value}</span>
              </dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={onResetGame} disabled={!canReset}>
          New Run
        </button>
      </section>
    </div>
  )
}

function getWakeChoiceCards(board: BoardView) {
  return board.pendingWakeChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]

    return card?.kind === 'crew' ? [card] : []
  }) ?? []
}

export function WakeChoiceDialog({ board, isGameOver, canInteract, onWakeCrewChoice }: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onWakeCrewChoice: (cardId: string) => void
}) {
  const wakeChoiceCards = getWakeChoiceCards(board)

  if (isGameOver || !board.pendingWakeChoice || wakeChoiceCards.length === 0) {
    return null
  }

  return (
    <div className="dialog-overlay">
      <section
        className="arrival-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wake-choice-title"
      >
        <h2 id="wake-choice-title">Choose Cryo Crew</h2>
        <p>That crew joins Tired. Then Ready 1 crew that was already Tired.</p>
        <div className="wake-choice-cards">
          {wakeChoiceCards.map((card) => (
            <CardShell
              key={card.id}
              card={card}
              className="wake-choice-card"
              motionCardId={card.id}
              canInteract={canInteract}
              ariaLabel={`Choose ${card.title}`}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onWakeCrewChoice(card.id)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                  return
                }

                event.preventDefault()
                event.stopPropagation()
                onWakeCrewChoice(card.id)
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function getScoutChoiceCards(board: BoardView) {
  return board.pendingScoutChoice?.choiceCardIds.flatMap((cardId) => {
    const card = board.cards[cardId]

    return card?.kind === 'horizon' ? [card] : []
  }) ?? []
}

function isScoutChoiceComplete(scoutChoice: NonNullable<BoardView['pendingScoutChoice']>) {
  return scoutChoice.keptCardId !== null || scoutChoice.choiceCardIds.length === 1
}

function getScoutInstruction(scoutChoice: NonNullable<BoardView['pendingScoutChoice']>) {
  if (scoutChoice.choiceCardIds.length === 1) {
    return 'Only 1 card is available. Confirm to leave it on top of Sector Stops.'
  }

  if (isScoutChoiceComplete(scoutChoice)) {
    return 'Confirm to keep the selected card on top and send the others to the back.'
  }

  return 'Choose the Destination card you like. The others will be sent to the back.'
}

function getScoutFanStyle(cardIndex: number, cardCount: number) {
  const fanOffset = cardIndex - (cardCount - 1) / 2
  const fanSpacing = cardCount > 4 ? 56 : cardCount > 3 ? 68 : 82
  const fanXPercent = fanOffset * fanSpacing
  const fanY = Math.abs(fanOffset) * 8
  const fanRotation = fanOffset * 6
  const fanZ = 100 + Math.round((cardCount - Math.abs(fanOffset)) * 10) + cardIndex

  return {
    transform: `translate(calc(-50% + ${fanXPercent}%), calc(-50% + ${fanY}px)) rotate(${fanRotation}deg)`,
    zIndex: fanZ,
  } as CSSProperties
}

export function ScoutChoiceDialog({
  board,
  isGameOver,
  canInteract,
  onScoutCardChoice,
  onScoutChoiceConfirm,
}: {
  board: BoardView
  isGameOver: boolean
  canInteract: boolean
  onScoutCardChoice: (cardId: string) => void
  onScoutChoiceConfirm: () => void
}) {
  const scoutChoice = board.pendingScoutChoice
  const scoutChoiceCards = getScoutChoiceCards(board)

  if (isGameOver || board.pendingWakeChoice || !scoutChoice || scoutChoiceCards.length === 0) {
    return null
  }

  const scoutChoiceComplete = isScoutChoiceComplete(scoutChoice)

  return (
    <div className="dialog-overlay">
      <section
        className="arrival-panel scout-choice-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scout-choice-title"
      >
        <p className="arrival-kicker">Scout</p>
        <h2 id="scout-choice-title">Set Sector Stops</h2>
        <p>{getScoutInstruction(scoutChoice)}</p>
        <div className="scout-choice-cards">
          {scoutChoiceCards.map((card, index) => {
            const isOnlyChoice = scoutChoice.choiceCardIds.length === 1
            const isSelected = scoutChoice.keptCardId === card.id || isOnlyChoice
            const ariaSelectionLabel = isSelected
              ? 'Selected to stay on top.'
              : scoutChoice.keptCardId
                ? 'Will be sent to the back.'
                : 'Choose to keep this on top.'

            return (
              <div
                key={card.id}
                className="scout-choice-item"
                style={getScoutFanStyle(index, scoutChoiceCards.length)}
              >
                <CardShell
                  card={card}
                  className={`wake-choice-card scout-choice-card ${isSelected ? 'is-scout-selected' : ''}`}
                  motionCardId={card.id}
                  canInteract={canInteract}
                  ariaLabel={`${card.title}. ${ariaSelectionLabel}`}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onScoutCardChoice(card.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                      return
                    }

                    event.preventDefault()
                    event.stopPropagation()
                    onScoutCardChoice(card.id)
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="scout-choice-actions">
          <button
            type="button"
            onClick={onScoutChoiceConfirm}
            disabled={!scoutChoiceComplete || !canInteract}
          >
            Use Scout
          </button>
        </div>
      </section>
    </div>
  )
}
