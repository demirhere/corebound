import type { CardIconKind } from '../game/types'

type DeckIconProps = {
  kind: CardIconKind
  className?: string
}

export function DeckIcon({ kind, className = '' }: DeckIconProps) {
  return (
    <span className={`deck-icon ${className}`} data-kind={kind} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
        {renderDeckIcon(kind)}
      </svg>
    </span>
  )
}

function renderDeckIcon(kind: CardIconKind) {
  switch (kind) {
    case 'rocket':
      return (
        <>
          <path className="deck-icon-fill" d="M25 5.8c7.2 3.8 11.7 10.8 13.5 21.1l-8.1-3-6.7 6.7-3-8.1-8.1-3C16.2 12.8 20.3 8.3 25 5.8Z" />
          <circle className="deck-icon-cutout" cx="28.7" cy="15.1" r="3.5" />
          <path className="deck-icon-line" d="M19.4 28.6 11 37l2.8-7.9M31.2 22.5 25 28.7M17.2 19.8l-6.1-2.2 4.2-4.8M31.3 33.9l4.8-4.2-2.2-6.1" />
        </>
      )
    case 'sprout':
      return (
        <>
          <path className="deck-icon-fill" d="M22.8 23.2C14.5 23 9.6 18.2 9 10.5c8.2.2 13 5 13.8 12.7ZM25.2 25.3c.6-8.1 6.1-13.4 14.2-13.7-.3 8.1-5.7 13.6-14.2 13.7Z" />
          <path className="deck-icon-line" d="M24 41V21.5M20.7 25.2l-8.2-8.9M27.2 25.9l8.2-8.9" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle className="deck-icon-fill" cx="24" cy="24" r="9.4" />
          <path className="deck-icon-line" d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.3 4.3M33.1 33.1l4.3 4.3M37.4 10.6l-4.3 4.3M14.9 33.1l-4.3 4.3" />
        </>
      )
    case 'drop':
      return (
        <>
          <path className="deck-icon-fill" d="M24 5.8C17.7 13.8 13.5 19.7 13.5 27.1a10.5 10.5 0 0 0 21 0C34.5 19.7 30.3 13.8 24 5.8Z" />
          <path className="deck-icon-line" d="M18.2 29.2c2.9 1.8 8.8 1.8 11.6 0M21 22.3h6" />
        </>
      )
    case 'antenna':
      return (
        <>
          <path className="deck-icon-fill" d="M10.8 30.1a12.7 12.7 0 0 0 18 0l-9-9Z" />
          <path className="deck-icon-line" d="M19.8 35.1 15.5 43M19.8 35.1l8.9 7.2M30 19.8a8.2 8.2 0 0 1 0 9.1M34.7 15.1a14.5 14.5 0 0 1 0 18.7M39.1 10.8a20.6 20.6 0 0 1 0 27.1" />
        </>
      )
    case 'satellite':
      return (
        <>
          <path className="deck-icon-fill" d="m20.4 18.4 9.2 5.3-5 8.7-9.2-5.3Z" />
          <path className="deck-icon-line" d="m27.1 17.1 5.4-9.4 5.7 3.3-5.4 9.4M15.2 30.9l-5.4 9.4-5.7-3.3 5.4-9.4M29.6 23.7l8.5 4.9M15.4 27.1l-8.5-4.9M31.6 10.7l4 2.3M8.4 35l4 2.3" />
          <circle className="deck-icon-dot" cx="22.5" cy="25.4" r="2.1" />
        </>
      )
    case 'moon':
      return (
        <>
          <circle className="deck-icon-fill" cx="24" cy="24" r="14.4" />
          <path className="deck-icon-cutout" d="M24 9.6a14.4 14.4 0 0 1 0 28.8Z" />
          <path className="deck-icon-line" d="M12.7 18.4h22.6M12.7 29.6h22.6" />
        </>
      )
    case 'star':
      return (
        <>
          <path className="deck-icon-fill" d="M24 5.8 29.2 18.8 42.2 24 29.2 29.2 24 42.2 18.8 29.2 5.8 24 18.8 18.8Z" />
          <path className="deck-icon-line" d="M24 12.8v22.4M12.8 24h22.4" />
        </>
      )
    case 'snowflake':
      return (
        <>
          <circle className="deck-icon-fill" cx="24" cy="24" r="5" />
          <path className="deck-icon-line" d="M24 7v34M9.3 15.5l29.4 17M9.3 32.5l29.4-17M18.8 10.7 24 15.9l5.2-5.2M18.8 37.3 24 32.1l5.2 5.2M10.7 24h7.1M30.2 24h7.1" />
        </>
      )
    case 'diamond':
      return (
        <>
          <path className="deck-icon-fill" d="M24 6.2 39.5 24 24 41.8 8.5 24Z" />
          <path className="deck-icon-line" d="M24 6.2V41.8M13.5 24h21M18.9 12.1 29.1 35.9M29.1 12.1 18.9 35.9" />
        </>
      )
    case 'hex':
      return (
        <>
          <path className="deck-icon-fill" d="M24 6.3 39.4 15.2v17.6L24 41.7 8.6 32.8V15.2Z" />
          <path className="deck-icon-line" d="M24 6.3v7.2M24 34.5v7.2M8.6 15.2l6.1 3.5M33.3 29.3l6.1 3.5M14.7 29.3 8.6 32.8M39.4 15.2l-6.1 3.5" />
        </>
      )
    case 'crescent':
      return (
        <>
          <circle className="deck-icon-fill" cx="23.4" cy="24" r="14.6" />
          <circle className="deck-icon-cutout" cx="30.2" cy="18.4" r="13.8" />
          <path className="deck-icon-line" d="M14.2 34.5c4.4 3.4 10.7 4.1 15.8 1.4" />
        </>
      )
    case 'flower':
      return (
        <>
          <path className="deck-icon-fill" d="M24 7.4c4 4.3 4 8.3 0 11.6-4-3.3-4-7.3 0-11.6ZM24 29c4 3.3 4 7.3 0 11.6-4-4.3-4-8.3 0-11.6ZM7.4 24c4.3-4 8.3-4 11.6 0-3.3 4-7.3 4-11.6 0ZM29 24c3.3-4 7.3-4 11.6 0-4.3 4-8.3 4-11.6 0Z" />
          <circle className="deck-icon-cutout" cx="24" cy="24" r="4.3" />
          <path className="deck-icon-line" d="M24 19v10M19 24h10" />
        </>
      )
    case 'pentagon':
      return (
        <>
          <path className="deck-icon-fill" d="M24 6.4 39.2 17.6 33.4 40H14.6L8.8 17.6Z" />
          <path className="deck-icon-line" d="M24 6.4v14M12.2 18.5h23.6M17.8 29.5h12.4" />
        </>
      )
    case 'shield':
      return (
        <>
          <path className="deck-icon-fill" d="M24 5.8 37.2 10.8v11c0 8.5-4.8 14.8-13.2 18.6-8.4-3.8-13.2-10.1-13.2-18.6v-11Z" />
          <path className="deck-icon-line" d="M24 10.5v25.3M16.1 17.7h15.8M16.5 26.3h15" />
        </>
      )
    case 'crosshair':
      return (
        <>
          <circle className="deck-icon-fill" cx="24" cy="24" r="13.5" />
          <circle className="deck-icon-cutout" cx="24" cy="24" r="5.2" />
          <path className="deck-icon-line" d="M24 5v9M24 34v9M5 24h9M34 24h9M16.5 16.5l15 15M31.5 16.5l-15 15" />
        </>
      )
    case 'person':
      return (
        <>
          <circle className="deck-icon-fill" cx="24" cy="15" r="7.4" />
          <path className="deck-icon-fill" d="M11.2 40.1c1.1-9.2 5.3-13.8 12.8-13.8s11.7 4.6 12.8 13.8Z" />
          <path className="deck-icon-line" d="M18.8 15c2.4 1.5 8 1.5 10.4 0M17.1 32.6c3.8 1.5 10 1.5 13.8 0" />
        </>
      )
  }
}
