import { useEffect } from 'react'
import { crewDeckBlueprints, startingCrewCards } from '../game/blueprints/crewDecks'
import { CREW_DECK_ID } from '../game/decks'
import { getRequirementIconLabel } from '../game/shipParts'
import type { BoardState, Card, CardBlueprint } from '../game/types'
import { CardShell } from './BoardCard'

type CrewDeckDialogProps = {
  isOpen: boolean
  board: BoardState
  onClose: () => void
}

const fullCrewDeck: readonly CardBlueprint[] = [...startingCrewCards, ...crewDeckBlueprints]

function formatCrewSpecializations(card: CardBlueprint) {
  return card.specializations?.map(getRequirementIconLabel).join(' / ') ?? 'No specializations'
}

function getCrewSignature(card: Pick<CardBlueprint, 'title' | 'specializations'>) {
  return `${card.title}:${card.specializations?.join(',') ?? ''}`
}

function countAvailableCrew(board: BoardState) {
  const counts = new Map<string, number>()
  const crewDeck = board.decks.find((deck) => deck.id === CREW_DECK_ID)

  function addCrew(card: CardBlueprint | undefined) {
    if (card?.kind !== 'crew') {
      return
    }

    const signature = getCrewSignature(card)
    counts.set(signature, (counts.get(signature) ?? 0) + 1)
  }

  crewDeck?.cards.forEach(addCrew)

  return counts
}

function createPreviewCrewCard(card: CardBlueprint, index: number): Card {
  return {
    ...card,
    id: `crew-deck-${index}`,
    faceUp: true,
  }
}

function CatalogCrewCard({ card, index, total, isUnavailable }: {
  card: CardBlueprint
  index: number
  total: number
  isUnavailable: boolean
}) {
  const previewCard = createPreviewCrewCard(card, index)
  const specializations = formatCrewSpecializations(card)

  return (
    <article className="card-catalog-card-wrap crew-deck-card-wrap">
      <div className="card-catalog-card-frame">
        <CardShell
          card={previewCard}
          className={`card-catalog-card crew-deck-card ${isUnavailable ? 'is-used' : ''}`}
          canInteract={false}
          ariaLabel={`${card.title}. Crew card ${index + 1} of ${total}. Specializations: ${specializations}.`}
          onPointerDown={() => {}}
          onKeyDown={() => {}}
        />
      </div>
    </article>
  )
}

export function CrewDeckDialog({ isOpen, board, onClose }: CrewDeckDialogProps) {
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

  const availableCrewCounts = countAvailableCrew(board)
  const renderedCrewCounts = new Map<string, number>()

  function isCrewUnavailable(card: CardBlueprint) {
    const signature = getCrewSignature(card)
    const renderedCount = renderedCrewCounts.get(signature) ?? 0
    renderedCrewCounts.set(signature, renderedCount + 1)

    return renderedCount >= (availableCrewCounts.get(signature) ?? 0)
  }

  return (
    <div
      className="dialog-overlay card-catalog-overlay crew-deck-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="arrival-panel card-catalog-panel crew-deck-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crew-deck-title"
      >
        <p className="arrival-kicker">Crew Manifest</p>
        <h2 id="crew-deck-title">Full Crew Deck</h2>

        <div className="card-catalog-sections crew-deck-sections">
          <section className="card-catalog-section crew-deck-section" aria-label={`${fullCrewDeck.length}-card crew deck`}>
            <div className="card-catalog-grid crew-deck-grid">
              {fullCrewDeck.map((card, index) => (
                <CatalogCrewCard
                  key={`crew-${card.title}-${index}`}
                  card={card}
                  index={index}
                  total={fullCrewDeck.length}
                  isUnavailable={isCrewUnavailable(card)}
                />
              ))}
            </div>
          </section>
        </div>

        <button type="button" onClick={onClose}>
          Close Crew Deck
        </button>
      </section>
    </div>
  )
}
