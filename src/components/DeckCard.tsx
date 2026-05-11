import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Deck } from '../game/types'
import { CRYO_DECK_ID, canManuallyDrawDeck } from '../game/decks'
import { DeckIcon } from './DeckIcon'

export type DeckCardView = Deck

type DeckCardProps = {
  deck: DeckCardView
  isActive: boolean
  isDropTarget: boolean
  canInteract: boolean
  sharedPosition: { x: number; y: number } | null
  onPointerDown: DeckPointerDownHandler
  onKeyDown: DeckKeyDownHandler
}

type DeckCardStyle = CSSProperties & {
  '--card-hue': string
  '--card-accent': string
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
  canInteract,
  sharedPosition,
  onPointerDown,
  onKeyDown,
}: DeckCardProps) {
  const canDraw = canManuallyDrawDeck(deck)
  const isSharedActive = sharedPosition !== null
  const displayX = sharedPosition?.x ?? deck.x
  const displayY = sharedPosition?.y ?? deck.y
  const displayTitle = getDeckDisplayTitle(deck.title)
  const usesAnchoredPosition = deck.id === CRYO_DECK_ID
  const positionStyle: CSSProperties = usesAnchoredPosition
    ? {}
    : {
        left: `${displayX}%`,
        top: `${displayY}%`,
      }
  const style: DeckCardStyle = {
    '--card-hue': String(deck.hue),
    '--card-accent': deck.accent,
    ...positionStyle,
    zIndex: isActive || isSharedActive ? 'var(--drag-z-index)' : deck.z,
  }
  const actionLabel = canDraw
    ? 'Click to draw or drag to move.'
    : 'Reward-only draw; drag to move.'

  return (
    <button
      type="button"
      className={`deck-card ${canDraw ? 'is-manual-draw' : 'is-automatic-reward'} ${
        isActive || isSharedActive ? 'is-being-dragged' : ''
      } ${
        isDropTarget ? 'is-drop-target' : ''
      }`}
      data-deck-id={deck.id}
      style={style}
      tabIndex={canInteract ? 0 : -1}
      aria-disabled={!canInteract}
      onPointerDown={(event) => {
        if (canInteract) {
          onPointerDown(event, deck.id)
        }
      }}
      onKeyDown={(event) => {
        if (canInteract) {
          onKeyDown(event, deck.id)
        }
      }}
      aria-label={`${displayTitle}. ${deck.cards.length} cards left. ${actionLabel}`}
    >
      <span className="deck-badge" aria-hidden="true">
        {deck.cards.length}
      </span>
      <span className="deck-title-lockup">
        <DeckIcon kind={deck.icon} className="deck-mark-icon" />
        <span className="deck-title">{displayTitle}</span>
      </span>
    </button>
  )
}

function getDeckDisplayTitle(title: string) {
  return title.replace(/\s+Deck$/i, '')
}
