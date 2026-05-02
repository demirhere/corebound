import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Deck } from '../game/types'
import { canManuallyDrawDeck } from '../game/decks'
import { DeckIcon } from './DeckIcon'

export type DeckCardView = Deck

type DeckCardProps = {
  deck: DeckCardView
  isActive: boolean
  isDropTarget: boolean
  onPointerDown: DeckPointerDownHandler
  onKeyDown: DeckKeyDownHandler
}

export type DeckPointerDownHandler = (
  event: ReactPointerEvent<HTMLButtonElement>,
  deckId: string,
) => void

export type DeckKeyDownHandler = (
  event: ReactKeyboardEvent<HTMLButtonElement>,
  deckId: string,
) => void

export function DeckCard({
  deck,
  isActive,
  isDropTarget,
  onPointerDown,
  onKeyDown,
}: DeckCardProps) {
  const canDraw = canManuallyDrawDeck(deck)
  const actionLabel = canDraw
    ? 'Click to draw or drag to move.'
    : 'Automatic rewards only; drag to move.'

  return (
    <button
      type="button"
      className={`deck-card ${canDraw ? 'is-manual-draw' : 'is-automatic-reward'} ${
        isActive ? 'is-being-dragged' : ''
      } ${
        isDropTarget ? 'is-drop-target' : ''
      }`}
      data-deck-id={deck.id}
      style={
        {
          '--card-hue': String(deck.hue),
          '--card-accent': deck.accent,
          left: `${deck.x}%`,
          top: `${deck.y}%`,
          zIndex: isActive ? 1101 : deck.z,
        } as CSSProperties
      }
      onPointerDown={(event) => onPointerDown(event, deck.id)}
      onKeyDown={(event) => onKeyDown(event, deck.id)}
      aria-label={`${deck.title}. ${deck.cards.length} cards left. ${actionLabel}`}
    >
      <span className="deck-badge" aria-hidden="true">
        {deck.cards.length}
      </span>
      <DeckIcon kind={deck.icon} />
      <span className="deck-title">{deck.title}</span>
    </button>
  )
}
