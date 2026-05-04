import type { ReactNode } from 'react'

type SectorCardLayoutProps = {
  cost: ReactNode
  hasFuelDiscount: boolean
  removedFuelCount: number
  visual: ReactNode
  visualClassName?: string
}

export function SectorCardLayout({
  cost,
  hasFuelDiscount,
  removedFuelCount,
  visual,
  visualClassName = '',
}: SectorCardLayoutProps) {
  const visualClass = visualClassName ? ` ${visualClassName}` : ''

  return (
    <>
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
