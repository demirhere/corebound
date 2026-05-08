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

export type ResourceKind = 'fuel' | 'hull' | 'scrap'

export type CrewSpecialization = 'life' | 'star' | 'engine' | 'signal'

export type MissionKind = 'deep-space' | 'planet' | 'asteroid'

export type RequirementIconKind = CrewSpecialization

export type CrewRoleKind =
  | 'engineer'
  | 'medic'
  | 'pilot'
  | 'mechanic'
  | 'scientist'
  | 'helmsman'
  | 'doctor'
  | 'recon'
  | 'operator'
  | 'crew'

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

export type DamageKind =
  | 'fractured-engine'
  | 'frozen-sector'
  | 'comm-failure'
  | 'sensor-loss'
  | 'hull-crack'
  | 'crew-quarters-damaged'
  | 'sealed-cargo'
  | 'stress-echo'
  | 'phantom-course'
  | 'drift-loop'
  | 'long-reach'

export type HazardKind = DamageKind

export type HazardDetails = {
  kind: DamageKind
  effectText: string
  clearText: string
  damageTitle: string
  damageEffectText: string
  flavorText: string
  effectImplemented: boolean
}

export type CardKind = 'resource' | 'crew' | 'mission' | 'mother' | 'gate' | 'discovery' | 'drift' | 'hazard' | 'active-ship-part'

export type GameLossReason = 'sector-stranded' | 'gate-failed' | 'fuel-depleted'

export type HandZone = 'crew' | 'tired'

export type ShipPartKind =
  | 'medbay-rehydrator'
  | 'service-drone-bay'
  | 'adaptive-control-console'
  | 'fuel-synthesizer'

export type ShipPartStatus = 'available' | 'spent'

// === Joker-economy ship parts (Phase 2 of the joker rebalance) =================
// These are passive bonuses bought from the post-gate research dialog. They
// live in `BoardState.activeShipParts` (max 5). Distinct from the legacy
// drafted-from-mission system (`shipPartSlots` / `ShipPartKind` above), which
// is being phased out and currently sits dormant.
export type ShipPartCategory =
  | 'icon'
  | 'pattern'
  | 'first-mission'
  | 'last-mission'
  | 'scrap'
  | 'converter'
  | 'hand'
  | 'wild'
  | 'special'

export type ShipPartIconBoost = {
  kind: 'icon'
  icon: CrewSpecialization
  fuel: number
}

export type ShipPartPatternBoost = {
  kind: 'pattern'
  patterns: readonly MissionPatternKind[]
  fuel: number
}

export type ShipPartFirstMissionBoost = {
  kind: 'first-mission'
  fuel: number
}

export type ShipPartLastMissionBoost = {
  kind: 'last-mission'
  fuel: number
}

export type ShipPartScrapBoost = {
  kind: 'scrap'
  // Per mission action.
  perMission?: number
  // First mission of sector only.
  perFirstMission?: number
  // Last mission of sector only.
  perLastMission?: number
  // Once at end of sector (after the gate clears).
  perSectorEnd?: number
}

export type ShipPartConverter = {
  kind: 'converter'
  trigger: 'sector-end' | 'first-mission'
  scrapsSpent: number
  fuelGained: number
}

export type ShipPartHandBoost = {
  kind: 'hand'
  handSizeDelta: number
}

export type ShipPartWildSlot = {
  kind: 'wild'
}

export type ShipPartSectorEndFuel = {
  kind: 'sector-end-fuel'
  // Sector indices (0-based) when the bonus fires; empty = always.
  sectors: readonly number[]
  fuel: number
}

// Lean Manifest: +fuel when crew used <= maxCrew. Rewards small-stack patterns.
export type ShipPartCrewCountCap = {
  kind: 'crew-count-cap'
  maxCrew: number
  fuel: number
}

// Crew Synergy: +fuelPerCrew × crew used in the mission, capped at maxFuel.
// Rewards big stacks. Cap prevents 4-crew patterns from dominating.
export type ShipPartPerCrewUsed = {
  kind: 'per-crew-used'
  fuelPerCrew: number
  maxFuel: number
}

// Compounding Drive: scales with total missions completed run-wide. Bonus =
// min(maxStacks, floor(completedBefore / interval)) applied to every mission.
export type ShipPartMissionCounter = {
  kind: 'mission-counter'
  interval: number
  fuelPerStack: number
  maxStacks: number
}

// Reserve Capacitor: end-of-sector +fuelPerCrew per Ready (unused) crew at the
// time the gate is faced; capped at maxCrew.
export type ShipPartSectorEndReadyCrew = {
  kind: 'sector-end-ready-crew'
  fuelPerCrew: number
  maxCrew: number
}

// Mission Streak: pattern fuel +fuelPerStreak × (streakLength-1), capped at
// maxBonus. Streak resets when the pattern played changes.
export type ShipPartPatternStreak = {
  kind: 'pattern-streak'
  fuelPerStreak: number
  maxBonus: number
}

// Pattern Ladder: +fuel when the played pattern is one of the listed mid/high
// tiers. Use to bump the patterns that actually get played in greedy hand-of-5
// play, without affecting unused low-tier ones.
export type ShipPartPatternTier = {
  kind: 'pattern-tier'
  patterns: readonly MissionPatternKind[]
  fuel: number
}

export type ShipPartEffect =
  | ShipPartIconBoost
  | ShipPartPatternBoost
  | ShipPartFirstMissionBoost
  | ShipPartLastMissionBoost
  | ShipPartScrapBoost
  | ShipPartConverter
  | ShipPartHandBoost
  | ShipPartWildSlot
  | ShipPartSectorEndFuel
  | ShipPartCrewCountCap
  | ShipPartPerCrewUsed
  | ShipPartMissionCounter
  | ShipPartSectorEndReadyCrew
  | ShipPartPatternStreak
  | ShipPartPatternTier

export type ShipPartId = string

export type ShipPartBlueprint = {
  id: ShipPartId
  label: string
  description: string
  cost: number
  refund: number
  category: ShipPartCategory
  effects: readonly ShipPartEffect[]
}

export type ActiveShipPart = ShipPartBlueprint & {
  // Each owned ship part gets a per-instance id. Unique ids let a future
  // upgrade system reference a specific copy if duplicates are ever allowed.
  instanceId: string
  acquiredSector: number
}

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
      kind: 'next_gate_fuel_discount'
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
      rewards?: VisitReward[]
    }
  | {
      kind: 'visit_reward'
      itemName: string
      rewards: VisitReward[]
    }

export type MissionPatternKind =
  | 'open'
  | 'cross-trained'
  | 'common-ground'
  | 'specialist'
  | 'common-knowledge'
  | 'department-heads'
  | 'common-cause'
  | 'bridge-crew'

export type MissionDetails = {
  kind: MissionKind
  need: {
    fuel: number
    icons: RequirementIconKind[]
  }
  pattern?: MissionPatternKind
  find: DestinationFind
}

export type GateDetails = {
  label: string
  need: {
    fuel: number
    icons: RequirementIconKind[]
    crew: number
  }
  effectKind:
    | 'none'
    | 'block-engine-crew'
    | 'block-life-crew'
    | 'block-science-crew'
    | 'block-nav-crew'
    | 'block-mother'
    | 'block-pilot-crew'
    | 'block-medic-crew'
    | 'block-scientist-crew'
    | 'block-engineer-crew'
    | 'mother-costs-fuel'
    | 'extra-drift'
  effectText: string
  clear: {
    extraFuel: number
    extraCrew: number
  }
  clearText: string
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
      kind: 'next_gate_fuel_discount'
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
  // Crew rank multiplies pattern Fuel rewards. Reserved for future per-crew
  // upgrades; currently every crew is rank 1, so reward = crew_count × mult.
  rank?: number
  portraitIndex?: number
  mission?: MissionDetails
  gate?: GateDetails
  discovery?: DiscoveryDetails
  drift?: DriftDetails
  hazard?: HazardDetails
  // Joker Ship Part owned by the run, presented on the board as a card.
  // Refers to the catalog blueprint plus an instance id.
  shipPart?: ActiveShipPart
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
  routeSlotIndex: number | null
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
  fuelReward?: number
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
  // Joker-economy: active ship parts owned (max 5) and the pool of un-owned
  // blueprints the research dialog can offer. Initialized from the 25-card
  // catalog at setup; an entry is removed from the pool when bought, but
  // never returned (stacking-discard refunds Scraps instead).
  activeShipParts: ActiveShipPart[]
  shipPartShopPool: ShipPartBlueprint[]
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
  pendingShipPartChoice: {
    choiceCardIds: string[]
    playerId: string | null
    x: number
    y: number
  } | null
  // Joker-economy research dialog: opens after each gate clear with up to 2
  // un-owned Ship Part offers. Player may buy affordable offers, pay to
  // re-draw, or continue to the next sector without Scrap consolation.
  pendingResearchChoice: {
    offers: ShipPartBlueprint[]
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
  gateStartedSector: number | null
  heldDriftCount: number
  stressCount: number
  scraps: number
  currentSector: number
  totalSectors: number
  isRunEnding: boolean
  hasArrived: boolean
  lossReason: GameLossReason | null
  topZ: number
  nextCardId: number
  dropTargetStackId: string | null
  dropTargetDeckId: string | null
  players: GamePlayer[]
  crewOwnerIds: Record<string, string>
  discoveryOwnerIds: Record<string, string>
  patternUsageCounts: Partial<Record<MissionPatternKind, number>>
  // Run-wide stats consumed by stateful ship parts (Compounding Drive,
  // Mission Streak). Persisted on the board so reducers / sim can update
  // them deterministically when missions resolve.
  missionsCompletedCount: number
  lastPatternPlayed: MissionPatternKind | null
  patternStreakCount: number
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
