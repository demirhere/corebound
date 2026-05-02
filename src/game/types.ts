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
  | 'shield'
  | 'crosshair'
  | 'person'

export type ResourceKind = 'fuel' | 'hull'

export type CrewSpecialization = 'life' | 'star' | 'engine' | 'signal'

export type HorizonKind = 'star' | 'planet' | 'asteroid'

export type RequirementIconKind = CrewSpecialization

export type CardKind = 'resource' | 'crew' | 'horizon'

export type HandZone = 'crew' | 'tired'

export type HorizonReward =
  | {
      kind: 'resource'
      resource: ResourceKind
      count: number
    }
  | {
      kind: 'crew'
      label: 'Crew' | 'Wake'
      count: number
    }
  | {
      kind: 'scout'
      count: number
    }
  | {
      kind: 'next_star_free'
    }
  | {
      kind: 'ready'
      count: number
    }

export type HorizonDetails = {
  kind: HorizonKind
  need: {
    fuel: number
    icons: RequirementIconKind[]
  }
  rewards: HorizonReward[]
}

export type BoardEffect =
  | {
      kind: 'horizon_fuel_waiver'
      remainingCards: number
    }

export type CardBlueprint = {
  title: string
  icon: CardIconKind
  hue: number
  accent: string
  kind: CardKind
  resource?: ResourceKind
  specializations?: CrewSpecialization[]
  horizon?: HorizonDetails
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
  tiredCardIds: string[]
  pendingEffects: BoardEffect[]
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
