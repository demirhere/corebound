export type CardIconKind =
  | 'rocket'
  | 'sprout'
  | 'sun'
  | 'zap'
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

export type HorizonKind = 'deep-space' | 'planet' | 'asteroid'

export type RequirementIconKind = CrewSpecialization

export type DiscoveryTag = 'crew' | 'mission' | 'gate' | 'anytime'

export type DiscoveryEffectKind =
  | 'crew_nav'
  | 'crew_engine'
  | 'crew_life'
  | 'crew_science'
  | 'mission_fuel_discount'
  | 'gate_clear_stress'
  | 'gate_skip_hazard'
  | 'ration_pack'

export type DiscoveryDetails = {
  tag: DiscoveryTag
  effectKind: DiscoveryEffectKind
  effectText: string
  icon?: RequirementIconKind
  amount?: number
}

export type DriftEffectKind = 'burn' | 'fatigue'

export type DriftDetails = {
  effectKind: DriftEffectKind
  effectText: string
}

export type HazardKind =
  | 'ion-storm'
  | 'dust-veil'
  | 'cold-reach'
  | 'echo-field'
  | 'black-tide'
  | 'fracture'
  | 'silent-watch'
  | 'hard-vacuum'
  | 'resonance'
  | 'ghost-signal'
  | 'the-veil'

export type HazardDetails = {
  kind: HazardKind
  effectText: string
  clearText: string
  damageTitle: string
  damageEffectText: string
  flavorText: string
}

export type CardKind = 'resource' | 'crew' | 'horizon' | 'mother' | 'gate' | 'discovery' | 'drift' | 'hazard'

export type GameLossReason = 'sector-stranded' | 'gate-failed'

export type HandZone = 'crew' | 'tired'

export type ShipPartKind = 'medbay-rehydrator' | 'service-drone-bay' | 'adaptive-control-console'

export type ShipPartStatus = 'available' | 'spent'

export type GamePlayer = {
  id: string
  name: string
}

export type VisitReward =
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

export type DestinationFind =
  | {
      kind: 'ship_part'
      itemName: string
      shipPart: ShipPartKind
    }
  | {
      kind: 'visit_reward'
      itemName: string
      rewards: VisitReward[]
    }

export type HorizonDetails = {
  kind: HorizonKind
  need: {
    fuel: number
    icons: RequirementIconKind[]
  }
  find: DestinationFind
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
  portraitIndex?: number
  horizon?: HorizonDetails
  gate?: GateDetails
  discovery?: DiscoveryDetails
  drift?: DriftDetails
  hazard?: HazardDetails
  specimenIndex?: number
}

export type Card = CardBlueprint & {
  id: string
  faceUp: boolean
  spentMother?: boolean
  damage?: boolean
}

export type Stack = {
  id: string
  cardIds: string[]
  x: number
  y: number
  z: number
  drawChoiceGroupId?: string
}

export type RouteSlotFind =
  | {
      kind: 'ship_part'
      itemName: string
      shipPart: ShipPartKind
    }
  | {
      kind: 'visit_reward'
      itemName: string
    }

export type RouteSlot = {
  cardId: string
  mapSlotIndex: number
  find: RouteSlotFind
}

export type ShipPartSlot = {
  cardId: string
  routeSlotIndex: number
  sector: number
  itemName: string
  shipPart: ShipPartKind
  status: ShipPartStatus
  ownerId: string | null
  spentSector?: number
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
  playerId: string | null
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
  shipPartSlots: ShipPartSlot[]
  archivedRouteCardIds: string[]
  handCardIds: string[]
  tiredCardIds: string[]
  roundStartTiredCardIds: string[]
  completedStarSummaries: CompletedStarSummary[]
  pendingWakeChoice: {
    remaining: number
    choiceCardIds: string[]
    playerId: string | null
  } | null
  pendingScoutChoice: {
    choiceCardIds: string[]
    keptCardId: string | null
    bottomedCardIds: string[]
  } | null
  pendingDrift: {
    cardId: string
    stackId: string
  } | null
  forcedDestinationCardId: string | null
  pendingEffects: BoardEffect[]
  turnNumber: number
  turnPlayerIndex: number
  currentPlayerId: string | null
  sectorDrawnThisTurn: boolean
  traveledThisTurn: boolean
  stressCount: number
  currentSector: number
  totalSectors: number
  hasArrived: boolean
  lossReason: GameLossReason | null
  topZ: number
  nextCardId: number
  dropTargetStackId: string | null
  dropTargetDeckId: string | null
  players: GamePlayer[]
  crewOwnerIds: Record<string, string>
  discoveryOwnerIds: Record<string, string>
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
