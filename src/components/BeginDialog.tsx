import './BeginDialog.css'

type BeginDialogProps = {
  onBegin: () => void
}

export function BeginDialog({ onBegin }: BeginDialogProps) {
  return (
    <section className="board begin-dialog" role="dialog" aria-modal="true" aria-label="Begin game">
      <button
        type="button"
        className="hand-end-turn-button begin-dialog-button"
        autoFocus
        onClick={onBegin}
      >
        <svg className="begin-dialog-rocket" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path d="M19 30c-5 1-8 4-10 9 5-1 8-4 10-9Z" />
          <path d="M18 29c-2-4-2-8 1-12 3-5 9-9 18-11-1 9-5 15-10 18-4 3-7 4-9 5Z" />
          <path d="M29 11c3 2 5 4 7 7" />
          <path d="M14 22l-7 1 5-7 7 1" />
          <path d="M26 34l-1 7 7-5-1-7" />
          <path d="M25 18c2-1 4-1 5 1 1 1 1 3-1 5-2 1-4 1-5-1-1-2-1-4 1-5Z" />
        </svg>
        Launch
      </button>
    </section>
  )
}
