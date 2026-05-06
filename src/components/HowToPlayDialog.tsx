import { useEffect } from 'react'
import { GameIcon } from './GameIcon'
import { GAME_ICON_LABELS, type GameIconKind } from './gameIcons'

type HowToPlayDialogProps = {
  isOpen: boolean
  onClose: () => void
  canClose: boolean
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

export function HowToPlayDialog({ isOpen, onClose, canClose }: HowToPlayDialogProps) {
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
          Pass each sector Gate. Draw optional Map Destinations when you want extra preparation.
        </p>

        <div className="how-to-play-flow" aria-label="Sector route summary">
          <HowToPlayMiniCard
            kicker="Draw"
            title="Map Offer"
            icons={['star', 'life', 'engine']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Travel"
            title="Destination"
            icons={['person', 'mother', 'life']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Find"
            title="Benefit or Part"
            icons={['fuel', 'parts']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Then pass"
            title="Gate"
            icons={['fuel', 'person']}
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
              <li>Read the face-up Gate, then click Missions to reveal Map Destinations.</li>
              <li>Travel to only 1 Destination per turn. Stack its crew-icon payment, then click Travel.</li>
              <li>Used crew move to Tired. Rewards recover Fuel, ready Tired crew, wake Cryo crew for the Mission Lead, or reveal Ship Parts.</li>
              <li>Each Gate costs 3-6 Fuel to pass, with extra Fuel to clear cleanly.</li>
              <li>After a non-final Gate succeeds, the next sector starts with an empty Map.</li>
              <li>Each new turn starts by drawing 1 Cryo crew into Ready, if Cryo remains.</li>
              <li>Unchosen Map Destinations clear. End turn before drawing again unless that was the 3rd Destination.</li>
            </ol>
          </section>

          <section>
            <h3>Paying Costs</h3>
            <div className="how-to-play-equations">
              <p><HowToPlayChip icon="fuel" label="Fuel Cell" /> pays Gate Fuel.</p>
              <p><HowToPlayChip icon="person" label="Ready crew" /> pays matching Destination icons.</p>
              <p><HowToPlayIconStrip icons={['engine', 'signal']} /> Engineer + Scientist can make 1 <GameIcon kind="fuel" /> when Fuel is short.</p>
              <p><HowToPlayChip icon="mother" label="MOTHER" /> covers missing non-Fuel icons only, and only with at least 1 human crew committed.</p>
            </div>
          </section>

          <section>
            <h3>Finds</h3>
            <ul>
              <li>Resource Missions recover 1-4 Fuel for the shared supply.</li>
              <li>Ready Missions ready Tired crew.</li>
              <li>Wake Missions recruit 1-2 Cryo crew for the Mission Lead; new crew joins Tired.</li>
              <li>Ship Part Missions make one Ship Part available.</li>
            </ul>
          </section>

          <section>
            <h3>Ship Parts</h3>
            <div className="how-to-play-find-types">
              <p><strong>Medbay Rehydrator</strong> readies +1 Tired crew after each sector.</p>
              <p><strong>Adaptive Control Console</strong> reduces required Gate Fuel by 1.</p>
              <p>The app applies Medbay at sector end and available Gate Fuel discounts automatically at Gates. Unspent parts carry forward.</p>
            </div>
          </section>

          <section>
            <h3>Gates And Stress</h3>
            <p>
              Each sector draws one Gate from the shuffled Gate deck. Pay its 3-6 Fuel to survive,
              then pay its extra clean-clear Fuel to avoid drawing Damage.
            </p>
          </section>

          <section>
            <h3>Damage</h3>
            <p>
              If a Gate is passed but not cleared cleanly, draw the top Damage card. Damage stays
              on the ship board and affects future rounds.
            </p>
          </section>

          <section>
            <h3>MOTHER Limits</h3>
            <p>
              MOTHER never pays <GameIcon kind="fuel" />, covers Destination icons only,
              and adds 1 Stress when spent. Unused MOTHER returns to the MOTHER Deck after completion.
            </p>
          </section>

          <section>
            <h3>Multiplayer</h3>
            <p>
              The Mission Lead takes the turn. Other players may add or remove only their own crew.
              Blueprints and woken Cryo crew go to the Mission Lead, but Fuel rewards and Ship Parts help everyone.
            </p>
          </section>

          <section className="how-to-play-wide-section how-to-play-warning-section">
            <h3>Win And Loss</h3>
            <p>
              Solo wins after passing the final Gate (10th sector) and pressing End run. Multiplayer scores after End run:
              most crew wins, then Blueprints, then Ready crew. Any ship loss means everyone loses.
              You lose if no reachable Mission remains and the Gate cannot be passed, or if the Gate cannot be passed
              with required Gate Fuel, crew-made Fuel, and available Gate Fuel discounts.
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
