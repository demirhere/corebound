import { GameIcon } from '../GameIcon'

export function ScrapCost({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`research-scrap-cost ${className}`} aria-label={`${amount} Scraps`}>
      <span aria-hidden="true">{amount}</span>
      <span aria-hidden="true"><GameIcon kind="scrap" /></span>
    </span>
  )
}
