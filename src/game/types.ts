export type CardIconKind =
  | 'rocket'
  | 'sprout'
  | 'sun'
  | 'drop'
  | 'antenna'
  | 'satellite'
  | 'moon'
  | 'star'
  | 'snowflake'
  | 'diamond'
  | 'hex'
  | 'crescent'
  | 'flower'
  | 'pentagon'
  | 'crosshair'

export type CardBlueprint = {
  title: string
  icon: CardIconKind
  hue: number
  accent: string
}

export type Card = CardBlueprint & {
  id: string
  faceUp: boolean
}

export type Stack = {
  id: string
  cardIds: string[]
  x: number
  y: number
  z: number
}

export type Deck = {
  id: string
  title: string
  icon: CardIconKind
  hue: number
  accent: string
  x: number
  y: number
  z: number
  cards: CardBlueprint[]
}

export type BoardState = {
  cards: Record<string, Card>
  stacks: Stack[]
  decks: Deck[]
  handCardIds: string[]
  topZ: number
  nextCardId: number
  dropTargetStackId: string | null
  dropTargetDeckId: string | null
}

export type BoardMetrics = {
  width: number
  height: number
  cardWidth: number
  cardHeight: number
  stackOffset: number
}

export type Bounds = {
  left: number
  top: number
  right: number
  bottom: number
}

export type DropTarget = {
  stackId: string | null
  deckId: string | null
}
