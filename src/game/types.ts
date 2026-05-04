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
  | 'mother'
  | 'gate'

export type ResourceKind = 'fuel' | 'hull'

export type CrewSpecialization = 'life' | 'star' | 'engine' | 'signal'

export type HorizonKind = 'star' | 'planet' | 'asteroid'

export type RequirementIconKind = CrewSpecialization

export type CardKind = 'resource' | 'crew' | 'horizon' | 'mother' | 'gate'

export type GameLossReason = 'sector-stranded' | 'gate-failed'

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
      kind: 'next_stop_fuel_discount'
      amount: number
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

export type GateDetails = {
  label: string
  need: {
    icons: RequirementIconKind[]
    crew: number
  }
  motherPenalty: {
    threshold: number
    extraHumanCrew: number
  }
}

export type BoardEffect =
  | {
      kind: 'next_stop_fuel_discount'
      amount: number
    }
  | {
      kind: 'deck_draw_modifier'
      deckId: string
      drawCount: number
      discardCount: number
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
  gate?: GateDetails
}

export type Card = CardBlueprint & {
  id: string
  faceUp: boolean
  spentMother?: boolean
}

export type Stack = {
  id: string
  cardIds: string[]
  x: number
  y: number
  z: number
  drawChoiceGroupId?: string
}

export type ShipPartKind = 'water-tank' | 'hull-patch' | 'wayfinder-beacon'

export type ShipPartStatus = 'available' | 'spent' | 'expired'

export type RouteSlot = {
  cardId: string
  shipPart: ShipPartKind
  status: ShipPartStatus
}

export type SetAsideStopSummary = {
  cardTitle: string
  stopKind: HorizonKind
  source: 'map' | 'deck'
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
  draw: DeckDrawRules
  cards: CardBlueprint[]
}

export type DeckDrawRules = {
  canManuallyDraw: boolean
  count: number
  placement: 'nearby' | 'left-row'
}

export type CompletedStarSummary = {
  sector: number
  cardId: string
  cardTitle: string
  crewCardIds: string[]
  crewTitles: string[]
  fuelSpent: number
  motherSpent: number
}

export type BoardState = {
  cards: Record<string, Card>
  stacks: Stack[]
  decks: Deck[]
  mapSlots: (string | null)[]
  routeSlots: (RouteSlot | null)[]
  archivedRouteCardIds: string[]
  setAsideStops: SetAsideStopSummary[]
  handCardIds: string[]
  tiredCardIds: string[]
  completedStarSummaries: CompletedStarSummary[]
  pendingWakeChoice: {
    remaining: number
    choiceCardIds: string[]
  } | null
  pendingScoutChoice: {
    choiceCardIds: string[]
    keptCardId: string | null
    bottomedCardIds: string[]
  } | null
  pendingEffects: BoardEffect[]
  pendingMapRefillSlotIndex: number | null
  stressCount: number
  currentSector: number
  totalSectors: number
  hasArrived: boolean
  lossReason: GameLossReason | null
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
