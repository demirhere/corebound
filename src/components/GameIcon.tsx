import { GAME_ICON_LABELS, type GameIconKind } from './gameIcons'

type GameIconProps = {
  kind: GameIconKind
}

export function GameIcon({ kind }: GameIconProps) {
  return (
    <span className="game-icon" data-kind={kind} title={GAME_ICON_LABELS[kind]}>
      <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        {renderGameIcon(kind)}
      </svg>
    </span>
  )
}

function renderGameIcon(kind: GameIconKind) {
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
        <>
          <path className="icon-fill" d="M16 3.9C11.8 9.2 9 13.1 9 18.1a7 7 0 0 0 14 0c0-5-2.8-8.9-7-14.2Z" />
          <path className="icon-line" d="M12.1 19.5c1.9 1.2 5.9 1.2 7.8 0M14 14.7h4" />
        </>
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
          <circle className="icon-fill" cx="16" cy="16" r="10.4" />
          <path className="icon-cutout" d="M16 8.7c2.6 3.1 2.5 5.8 0 7.3-3.9.2-6.2-1.4-7-4.8A9 9 0 0 1 16 8.7ZM22.8 19.4c-4 .7-6.3-.6-6.8-3.4 1.8-3.5 4.3-4.6 7.6-3.5a9 9 0 0 1-.8 6.9ZM9.2 19.4c1.4-3.8 3.7-5.1 6.8-3.4 2.1 3.3 1.9 6-.7 8.3a9 9 0 0 1-6.1-4.9Z" />
          <circle className="icon-dot" cx="16" cy="16" r="2.2" />
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
          <path className="icon-fill" d="M6.3 19.8a8.4 8.4 0 0 0 11.9 0l-5.9-5.9Z" />
          <path className="icon-line" d="M12.2 23.1 9.3 28M12.2 23.1l5.9 4.9M18.9 13a5.5 5.5 0 0 1 0 6.1M22.1 9.7a10 10 0 0 1 0 12.6M25.4 6.5a14.3 14.3 0 0 1 0 19" />
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
  }
}
