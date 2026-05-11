import { useId } from 'react'
import { GAME_ICON_LABELS, type GameIconKind } from './gameIcons'

type GameIconProps = {
  kind: GameIconKind
  variant?: 'badge' | 'glyph'
}

export function GameIcon({ kind, variant = 'badge' }: GameIconProps) {
  const iconId = useId().replace(/:/g, '')
  const usesFuelGlyph = kind === 'fuel' && variant === 'glyph'
  const fuelGradientId = `${iconId}-fuel-glyph-gradient`

  return (
    <span className={`game-icon game-icon-${variant}`} data-kind={kind} title={GAME_ICON_LABELS[kind]}>
      <svg viewBox={usesFuelGlyph ? '6 3 20 26' : '0 0 32 32'} focusable="false" aria-hidden="true">
        {usesFuelGlyph && (
          <defs>
            <linearGradient id={fuelGradientId} x1="7" x2="25" y1="4" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f0a742" />
              <stop offset="0.46" stopColor="#E49221" />
              <stop offset="0.72" stopColor="#c7771b" />
              <stop offset="1" stopColor="#9f5513" />
            </linearGradient>
          </defs>
        )}
        {renderGameIcon(kind, usesFuelGlyph ? fuelGradientId : undefined)}
      </svg>
    </span>
  )
}

function renderGameIcon(kind: GameIconKind, fuelGradientId?: string) {
  switch (kind) {
    case 'hull':
      return (
        <>
          <path className="icon-fill" d="M16 4.2 25 7.6v7.5c0 5.8-3.3 10.1-9 12.7-5.7-2.6-9-6.9-9-12.7V7.6Z" />
          <path className="icon-line" d="M16 7.3v17.3M10.6 12.2h10.8M10.9 18.1h10.2" />
        </>
      )
    case 'fuel':
      return (
        <path
          className="icon-line"
          d="M18.7 4.3 8.2 17.9h7.2l-1.3 9.8 9.9-14.3h-7Z"
          style={fuelGradientId ? { fill: `url(#${fuelGradientId})`, stroke: `url(#${fuelGradientId})` } : undefined}
        />
      )
    case 'scrap':
      return (
        <circle className="icon-line" cx="16" cy="16" r="7.2" strokeDasharray="1.7 2.5" />
      )
    case 'parts':
      return (
        <>
          <path className="icon-fill" d="M16 4.6 25.7 10v12L16 27.4 6.3 22V10Z" />
          <circle className="icon-cutout" cx="16" cy="16" r="5.2" />
          <path className="icon-line" d="M16 4.6v4.1M16 23.3v4.1M6.3 10l3.5 2M22.2 20l3.5 2" />
        </>
      )
    case 'engine':
      return (
        <>
          <path className="icon-fill" d="M16 4.4 24.8 8v7.5c0 5.4-3.2 9.4-8.8 12.1-5.6-2.7-8.8-6.7-8.8-12.1V8Z" />
          <path className="icon-cutout" d="M16 8.6c3.1 2.8 4.6 5.6 4.6 8.5 0 2.8-1.5 5.1-4.6 7-3.1-1.9-4.6-4.2-4.6-7 0-2.9 1.5-5.7 4.6-8.5Z" />
          <path className="icon-line" d="M16 12.3v8.7M12.2 16.6h7.6M11.2 22.7h9.6" />
        </>
      )
    case 'star':
      return (
        <>
          <path className="icon-fill" d="M16 3.9 19.4 12.4 28.1 16 19.4 19.6 16 28.1 12.6 19.6 3.9 16 12.6 12.4Z" />
          <path className="icon-line" d="M16 8.6v14.8M8.6 16h14.8" />
        </>
      )
    case 'life':
      return (
        <>
          <path className="icon-fill" d="M15.2 15.3C10 15.1 6.9 12.1 6.5 7.3c5.1.1 8.2 3.1 8.7 8ZM16.8 16.7c.4-5 3.8-8.4 8.9-8.6-.2 5.1-3.7 8.5-8.9 8.6Z" />
          <path className="icon-line" d="M16 27V14.2M13.8 16.4 8.7 10.8M18.2 17.2l5.2-5.7" />
        </>
      )
    case 'signal':
      return (
        <>
          <path className="icon-fill" d="M12.2 4.8h7.6v7.3l5.4 9.4c1.9 3.3-.5 6.1-4.2 6.1H11c-3.7 0-6.1-2.8-4.2-6.1l5.4-9.4Z" />
          <path className="icon-cutout" d="M10.1 21.2h11.8l1.1 1.9c.8 1.4-.2 2.5-2 2.5H11c-1.8 0-2.8-1.1-2-2.5Z" />
          <path className="icon-line" d="M11.4 4.8h9.2M13.9 4.8v7.9l-5.4 9.4M18.1 4.8v7.9l5.4 9.4M10.4 20.8h11.2M12.3 24h7.4" />
        </>
      )
    case 'mother':
      return (
        <>
          <path className="icon-fill" d="M16 4.7 25 9.9v12.2l-9 5.2-9-5.2V9.9Z" />
          <path className="icon-cutout" d="M8.8 16s2.7-4.8 7.2-4.8 7.2 4.8 7.2 4.8-2.7 4.8-7.2 4.8S8.8 16 8.8 16Z" />
          <circle className="icon-dot" cx="16" cy="16" r="2.4" />
          <path className="icon-line" d="M16 2.8v3.4M16 25.8v3.4M6.8 8.4l2.4 2.4M25.2 8.4l-2.4 2.4" />
        </>
      )
    case 'person':
      return (
        <>
          <circle className="icon-fill" cx="16" cy="10.6" r="5" />
          <path className="icon-fill" d="M7.6 27.2c.8-6.3 3.5-9.4 8.4-9.4s7.6 3.1 8.4 9.4Z" />
          <path className="icon-line" d="M12.4 10.6c1.8 1.1 5.4 1.1 7.2 0M11.4 22.7c2.7 1 6.5 1 9.2 0" />
        </>
      )
    case 'tired-person':
      return (
        <>
          <path className="icon-fill" d="M7.6 27.2c.8-5.9 3.5-8.9 8.4-8.9s7.6 3 8.4 8.9Z" />
          <circle className="icon-fill" cx="13.7" cy="11.4" r="4.6" />
          <path className="icon-line" d="M10.8 11.4h5.6M11.6 22.8c2.6 1 6.2 1 8.8 0M20.2 5.7h4.5l-4.5 4.6h4.9M22 13.4h3.4L22 16.9h3.8" />
        </>
      )
    case 'any':
      return (
        <>
          <path className="icon-line" d="M10.3 11.5c.5-3.3 2.7-5.1 6-5.1 3.6 0 5.9 2.1 5.9 5.1 0 2.4-1.3 3.8-3.5 5-1.8 1-2.7 2-2.7 4.4v.7" />
          <circle className="icon-dot" cx="16" cy="26" r="1.55" />
        </>
      )
  }
}
