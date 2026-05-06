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
            icons={['fuel', 'person', 'mother']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Find"
            title="Benefit or Part"
            icons={['fuel', 'tired-person', 'parts']}
            tone="destination"
          />
          <HowToPlayMiniCard
            kicker="Then pass"
            title="Gate"
            icons={['person', 'engine', 'life', 'star', 'signal']}
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
              <li>Travel to only 1 Destination per turn. Stack its payment, then click Travel.</li>
              <li>Used crew move to Tired. Immediate Benefits resolve now; Ship Parts stay visible for a Gate.</li>
              <li>If Fuel is empty and no Map is visible, draw Missions before ending the turn.</li>
              <li>Unchosen Map Destinations clear. End turn before drawing again unless that was the 3rd Destination.</li>
            </ol>
          </section>

          <section>
            <h3>Paying Costs</h3>
            <div className="how-to-play-equations">
              <p><HowToPlayChip icon="fuel" label="Fuel Cell" /> pays Fuel.</p>
              <p><HowToPlayChip icon="person" label="Ready crew" /> pays matching Life, Nav, Engine, or Science icons.</p>
              <p><HowToPlayIconStrip icons={['engine', 'signal']} /> Engineer + Scientist can make 1 <GameIcon kind="fuel" /> instead of paying icons.</p>
              <p><HowToPlayChip icon="mother" label="MOTHER" /> covers missing non-Fuel icons only, and only with at least 1 human crew committed.</p>
            </div>
          </section>

          <section>
            <h3>Immediate Benefits</h3>
            <ul>
              <li>Collect adds Fuel to the shared supply.</li>
              <li>Ready moves the front Tired crew back to Crew.</li>
              <li>Wake reveals up to 2 Cryo crew, recruits 1 into Tired, then readies the front Tired crew.</li>
              <li>Scout keeps 1 top Sector Stop and sends the rest to the back. It is skipped on the 3rd Destination.</li>
              <li>Next stop -1 Fuel discounts the next Destination in this sector.</li>
            </ul>
          </section>

          <section>
            <h3>Ship Parts</h3>
            <div className="how-to-play-find-types">
              <p><strong>Medbay Rehydrator</strong> readies 1 Tired crew before a Gate.</p>
              <p><strong>Service Drone Bay</strong> fills 1 Gate crew slot and gives no icon.</p>
              <p><strong>Adaptive Control Console</strong> covers 1 Gate icon and fills no crew slot.</p>
              <p>The app applies available Ship Parts automatically at Gates. Unspent parts carry forward.</p>
            </div>
          </section>

          <section>
            <h3>Gates And Stress</h3>
            <p>
              Each sector draws one Gate from the shuffled Gate deck. Pass its crew slots and icons
              to survive, then meet its clear line to avoid drawing Damage.
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
              MOTHER never pays <GameIcon kind="fuel" />, never fills <GameIcon kind="person" /> slots,
              and adds 1 Stress only when spent. Unused MOTHER returns to the MOTHER Deck after completion.
            </p>
          </section>

          <section>
            <h3>Multiplayer</h3>
            <p>
              The Mission Lead takes the turn. Other players may add or remove only their own crew.
              Wake crew and Blueprints score for the Mission Lead, but rewards and Ship Parts help everyone.
            </p>
          </section>

          <section className="how-to-play-wide-section how-to-play-warning-section">
            <h3>Win And Loss</h3>
            <p>
              Solo wins by passing the final Gate (10th sector). Multiplayer scores only after that success:
              most crew wins, then Blueprints, then Ready crew. Any ship loss means everyone loses.
              You lose if no reachable Mission remains and the Gate cannot be passed, or if the Gate
              cannot be passed with available Ship Parts, Ready crew, required Gate Fuel, and unused MOTHER.
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
