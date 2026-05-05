import type { CSSProperties, ReactNode } from 'react'

type SectorCardLayoutProps = {
  cost: ReactNode
  hasFuelDiscount: boolean
  removedFuelCount: number
  visual: ReactNode
  visualClassName?: string
  art?: ReactNode
}

export function SectorCardLayout({
  cost,
  hasFuelDiscount,
  removedFuelCount,
  visual,
  visualClassName = '',
  art,
}: SectorCardLayoutProps) {
  const visualClass = visualClassName ? ` ${visualClassName}` : ''

  return (
    <>
      {art}
      <div className={`sector-card-visual${visualClass}`}>
        {visual}
      </div>
      <div className="sector-card-cost-row">
        <span>Req</span>
        <div className="card-rule-icons">{cost}</div>
      </div>
      {hasFuelDiscount && (
        <p className="card-rule-text sector-card-discount">
          Next Destination discount: {removedFuelCount} Fuel scribbled out.
        </p>
      )}
    </>
  )
}

type SectorCardArtVariant = 'blueprint' | 'route'

type SectorCardArtProps = {
  variant: SectorCardArtVariant
  index: number
  gridSize?: number
}

export function SectorCardArt({ variant, index, gridSize = 4 }: SectorCardArtProps) {
  const cellCount = gridSize * gridSize
  const safeIndex = ((index % cellCount) + cellCount) % cellCount
  const col = safeIndex % gridSize
  const row = Math.floor(safeIndex / gridSize)
  const denominator = gridSize - 1
  const xPercent = denominator <= 0 ? 0 : (col / denominator) * 100
  const yPercent = denominator <= 0 ? 0 : (row / denominator) * 100
  const sizePercent = gridSize * 100

  const style = {
    '--sector-card-art-x': `${xPercent}%`,
    '--sector-card-art-y': `${yPercent}%`,
    '--sector-card-art-size': `${sizePercent}%`,
  } as CSSProperties

  return (
    <div
      className={`sector-card-art-layer is-${variant}`}
      style={style}
      aria-hidden="true"
    />
  )
}
