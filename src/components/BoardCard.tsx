import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

export type CardView = {
  id: string
  title: string
  icon: string
  hue: number
  accent: string
  faceUp: boolean
}

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
  onPointerDown: CardPointerDownHandler
  onKeyDown: CardKeyDownHandler
}

export function BoardCard({
  card,
  stackId,
  cardIndex,
  isStackActive,
  stackOffsetRatio,
  onPointerDown,
  onKeyDown,
}: BoardCardProps) {
  return (
    <div
      className={`card-shell ${card.faceUp ? 'is-face-up' : 'is-face-down'} ${
        isStackActive ? 'is-being-dragged' : ''
      }`}
      style={
        {
          '--card-hue': String(card.hue),
          '--card-accent': card.accent,
          top: `${cardIndex * stackOffsetRatio * 100}%`,
          zIndex: cardIndex + 1,
        } as CSSProperties
      }
      role="button"
      tabIndex={0}
      aria-label={`${card.title}. Click to flip or drag to move this part of the stack.`}
      onPointerDown={(event) => onPointerDown(event, stackId, card.id, cardIndex)}
      onKeyDown={(event) => onKeyDown(event, stackId, card.id)}
    >
      <div className="card-inner">
        <article className="card-face card-front">
          <header className="card-header">
            <span className="card-title">{card.title}</span>
          </header>
          <div className="card-art" aria-hidden="true">
            <span className="card-glyph">{card.icon}</span>
          </div>
        </article>

        <article className="card-face card-back" aria-hidden="true">
          <span className="back-mark">✦</span>
          <strong>Corebound</strong>
        </article>
      </div>
    </div>
  )
}
