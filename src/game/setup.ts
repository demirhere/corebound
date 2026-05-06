import type {
  BoardState,
  Card,
  CardBlueprint,
  CardIconKind,
  CrewSpecialization,
  DestinationFind,
  DiscoveryDetails,
  DiscoveryEffectKind,
  DiscoveryTag,
  GamePlayer,
  HazardKind,
  HorizonKind,
  RequirementIconKind,
  ResourceKind,
  ShipPartKind,
  VisitReward,
} from './types'
import {
  CRYO_DECK_ID,
  DISCOVERY_DECK_ID,
  DRIFT_DECK_ID,
  FUEL_DECK_ID,
  HAZARD_DECK_ID,
  HORIZON_DECK_ID,
  MOTHER_DECK_ID,
  automaticRewardDeckDraw,
  manualDeckDraw,
} from './decks'
import { cardContent, cardRulesText, hazardSignaledDestinationEvent } from './logEvents'
import type { PlaytestLogEvent } from './playtestLog'

const RESOURCE_DECK_SIZE = 12
const MOTHER_DECK_SIZE = 6
export const TOTAL_SECTORS = 2
export const SOLO_PLAYER_ID = 'solo'
export const SOLO_PLAYER: GamePlayer = {
  id: SOLO_PLAYER_ID,
  name: 'Solo',
}
export const MAP_SLOT_COUNT = 3
export const ROUTE_SLOT_COUNT = 3
export const MAP_SLOT_POSITIONS = [
  { x: 45, y: 8 },
  { x: 58, y: 8 },
  { x: 71, y: 8 },
] as const
export const TRAVELED_STOP_POSITIONS = [
  { x: 56, y: 39 },
  { x: 61, y: 47 },
  { x: 66, y: 55 },
] as const
export const FUEL_SUPPLY_STACK_ID = 'stack-fuel-supply'
export const FUEL_SUPPLY_STACK_POSITION = {
  x: 15,
  y: 40,
}
export const MOTHER_SUPPLY_STACK_ID = 'stack-mother-supply'
export const MOTHER_SUPPLY_STACK_POSITION = {
  x: 15,
  y: 40,
}
export const SECTOR_GATE_STACK_POSITION = {
  x: 85,
  y: 40,
}

type DeckArt = {
  icon: CardIconKind
  hue: number
  accent: string
}

const resourceArt: Record<ResourceKind, DeckArt> = {
  fuel: {
    icon: 'zap',
    hue: 42,
    accent: '#ffb72e',
  },
  hull: {
    icon: 'shield',
    hue: 48,
    accent: '#ffe073',
  },
}

const horizonArt: Record<HorizonKind, DeckArt> = {
  'deep-space': {
    icon: 'star',
    hue: 282,
    accent: '#d98cff',
  },
  planet: {
    icon: 'moon',
    hue: 147,
    accent: '#77ffbb',
  },
  asteroid: {
    icon: 'diamond',
    hue: 20,
    accent: '#ff9f68',
  },
}

const motherArt: DeckArt = {
  icon: 'mother',
  hue: 354,
  accent: '#ff4f64',
}

const gateArt: DeckArt = {
  icon: 'gate',
  hue: 184,
  accent: '#73ffd6',
}

const sectorDeckArt: Record<number, DeckArt> = {
  1: {
    icon: 'star',
    hue: 261,
    accent: '#b99cff',
  },
  2: {
    icon: 'crescent',
    hue: 222,
    accent: '#74a7ff',
  },
}

const crewArt: DeckArt = {
  icon: 'person',
  hue: 198,
  accent: '#82d8ff',
}

const discoveryArt: DeckArt = {
  icon: 'flower',
  hue: 128,
  accent: '#70c58c',
}

const driftArt: DeckArt = {
  icon: 'snowflake',
  hue: 196,
  accent: '#9bd8e8',
}

const hazardArt: Record<HazardKind, DeckArt> = {
  'ion-storm': {
    icon: 'zap',
    hue: 48,
    accent: '#ffd45d',
  },
  'dust-veil': {
    icon: 'moon',
    hue: 24,
    accent: '#e0a56b',
  },
  'cold-reach': {
    icon: 'snowflake',
    hue: 197,
    accent: '#9bd8e8',
  },
  'echo-field': {
    icon: 'antenna',
    hue: 309,
    accent: '#ff8ce6',
  },
  'black-tide': {
    icon: 'crescent',
    hue: 232,
    accent: '#8793ff',
  },
  fracture: {
    icon: 'crosshair',
    hue: 356,
    accent: '#ff6f7d',
  },
  'silent-watch': {
    icon: 'star',
    hue: 266,
    accent: '#b99cff',
  },
  'hard-vacuum': {
    icon: 'diamond',
    hue: 184,
    accent: '#73ffd6',
  },
  resonance: {
    icon: 'hex',
    hue: 128,
    accent: '#70c58c',
  },
  'ghost-signal': {
    icon: 'satellite',
    hue: 162,
    accent: '#7cffd3',
  },
  'the-veil': {
    icon: 'flower',
    hue: 280,
    accent: '#d98cff',
  },
}

function createResourceDeck(resource: ResourceKind, count: number) {
  const art = resourceArt[resource]
  const title = resource === 'fuel' ? 'Fuel Cell' : 'Hull Plate'

  return Array.from({ length: count }, (): CardBlueprint => ({
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'resource',
    resource,
  }))
}

function createMotherDeck(count: number) {
  return Array.from({ length: count }, (): CardBlueprint => ({
    title: 'MOTHER',
    icon: motherArt.icon,
    hue: motherArt.hue,
    accent: motherArt.accent,
    kind: 'mother',
  }))
}

function createCrewCard(
  title: string,
  specializations: [CrewSpecialization, CrewSpecialization],
  portraitIndex: number,
): CardBlueprint {
  return {
    title,
    icon: crewArt.icon,
    hue: crewArt.hue,
    accent: crewArt.accent,
    kind: 'crew',
    specializations,
    portraitIndex,
  }
}

function createDiscoveryCard(
  title: string,
  tag: DiscoveryTag,
  effectKind: DiscoveryEffectKind,
  effectText: string,
  icon: CardIconKind,
  specimenIndex: number,
  options: Pick<DiscoveryDetails, 'icon' | 'amount'> = {},
): CardBlueprint {
  return {
    title,
    icon,
    hue: discoveryArt.hue,
    accent: discoveryArt.accent,
    kind: 'discovery',
    discovery: {
      tag,
      effectKind,
      effectText,
      ...options,
    },
    specimenIndex,
  }
}

function createDriftCard(title: string, effectKind: 'burn' | 'fatigue', effectText: string): CardBlueprint {
  return {
    title,
    icon: driftArt.icon,
    hue: driftArt.hue,
    accent: driftArt.accent,
    kind: 'drift',
    drift: {
      effectKind,
      effectText,
    },
  }
}

function createHazardCard(
  title: string,
  kind: HazardKind,
  effectText: string,
  clearText: string,
  damageTitle: string,
  damageEffectText: string,
  flavorText: string,
): CardBlueprint {
  const art = hazardArt[kind]

  return {
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'hazard',
    hazard: {
      kind,
      effectText,
      clearText,
      damageTitle,
      damageEffectText,
      flavorText,
    },
  }
}

function createHorizonCard(
  title: string,
  horizonKind: HorizonKind,
  fuel: number,
  icons: RequirementIconKind[],
  find: DestinationFind,
): CardBlueprint {
  const art = horizonArt[horizonKind]

  return {
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'horizon',
    horizon: {
      kind: horizonKind,
      need: {
        fuel,
        icons,
      },
      find,
    },
  }
}

function shipPartFind(itemName: string, shipPart: ShipPartKind): DestinationFind {
  return {
    kind: 'ship_part',
    itemName,
    shipPart,
  }
}

function visitRewardFind(itemName: string, rewards: VisitReward[]): DestinationFind {
  return {
    kind: 'visit_reward',
    itemName,
    rewards,
  }
}

function createGateCard(
  title: string,
  label: string,
  icons: RequirementIconKind[],
  crew: number,
  motherPenalty: { threshold: number; extraHumanCrew: number },
): CardBlueprint {
  return {
    title,
    icon: gateArt.icon,
    hue: gateArt.hue,
    accent: gateArt.accent,
    kind: 'gate',
    gate: {
      label,
      need: {
        icons,
        crew,
      },
      motherPenalty,
    },
  }
}

function shuffleCards<T>(cards: readonly T[]) {
  const shuffled = [...cards]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    const swap = shuffled[swapIndex]

    if (current !== undefined && swap !== undefined) {
      shuffled[index] = swap
      shuffled[swapIndex] = current
    }
  }

  return shuffled
}

function createBoardCards(prefix: string, blueprints: readonly CardBlueprint[], faceUp = true) {
  return blueprints.map<Card>((blueprint, index) => ({
    ...blueprint,
    id: `${prefix}-${index + 1}`,
    faceUp,
  }))
}

function setupDeckCreatedEvent(deckId: string, deckTitle: string, cards: readonly CardBlueprint[]): PlaytestLogEvent {
  const cardSummaries = cards.map((card) => `${card.title}${cardRulesText(card) ? ` [${cardRulesText(card)}]` : ''}`)

  return {
    type: 'setup.deck.created',
    message: `${deckTitle} setup with ${cards.length} cards: ${cardSummaries.join('; ')}.`,
    details: {
      deckId,
      deckTitle,
      cardCount: cards.length,
      cardSummaries,
      cardContents: cards.map(cardContent),
    },
  }
}

function setupResourceDrawnEvent(card: Card, deckTitle: string, drawIndex: number): PlaytestLogEvent {
  return {
    type: 'setup.resource.drawn_first_pass',
    message: `${card.title} (${card.id}) drawn from ${deckTitle} during setup first pass.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardContent: cardContent(card),
      deckTitle,
      drawIndex,
    },
  }
}

function setupCrewDealtEvent(card: Card, handIndex: number, owner: GamePlayer | null): PlaytestLogEvent {
  const rulesText = cardRulesText(card)
  const ownerText = owner ? ` to ${owner.name}` : ''

  return {
    type: 'setup.crew.dealt',
    message: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''} dealt${ownerText} as starting crew.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`,
      cardContent: cardContent(card),
      handIndex,
      ownerId: owner?.id ?? null,
      ownerName: owner?.name ?? null,
    },
  }
}

function setupGatePlacedEvent(card: Card, stackId: string): PlaytestLogEvent {
  const gateTitle = `${card.title} Final Gate`

  return {
    type: 'setup.gate.placed_face_down',
    message: `${gateTitle} (${card.id}) placed face down. Click it to reveal or hide it.`,
    details: {
      cardId: card.id,
      cardTitle: gateTitle,
      cardSummary: `${gateTitle} (${card.id}) face down`,
      stackId,
      faceUp: card.faceUp,
    },
  }
}

function setupHazardPlacedEvent(card: Card, stackId: string): PlaytestLogEvent {
  const rulesText = cardRulesText(card)

  return {
    type: 'setup.hazard.placed',
    message: `${card.title} (${card.id}) placed face up on the Gate${rulesText ? ` [${rulesText}]` : ''}.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`,
      cardContent: cardContent(card),
      stackId,
      faceUp: card.faceUp,
    },
  }
}

const startingCrewCards = [
  createCrewCard('Lei Watanabe', ['life', 'star'], 2),
  createCrewCard('Mara Voss', ['engine', 'engine'], 14),
  createCrewCard('Ada Chen', ['engine', 'signal'], 5),
  createCrewCard('Sana Iqbal', ['life', 'life'], 7),
  createCrewCard('Nia Okonkwo', ['signal', 'star'], 10),
]

const cryoCrewDeck = [
  createCrewCard('Juno Pike', ['engine', 'star'], 4),
  createCrewCard('Tomas Hale', ['engine', 'life'], 1),
  createCrewCard('Priya Shah', ['life', 'engine'], 12),
  createCrewCard('Elise Tan', ['life', 'signal'], 8),
  createCrewCard('Ilya Rao', ['star', 'signal'], 6),
  createCrewCard('Oren Vale', ['signal', 'signal'], 13),
  createCrewCard('Malik Ortega', ['star', 'star'], 15),
]

const discoveryDesigns = [
  createDiscoveryCard(
    'Star Chart',
    'crew',
    'crew_nav',
    'This committed crew counts as Nav.',
    'star',
    0,
    { icon: 'star' },
  ),
  createDiscoveryCard(
    'Spare Coil',
    'crew',
    'crew_engine',
    'This committed crew counts as Engine.',
    'hex',
    1,
    { icon: 'engine' },
  ),
  createDiscoveryCard(
    'Bio-sample',
    'crew',
    'crew_life',
    'This committed crew counts as Life.',
    'sprout',
    2,
    { icon: 'life' },
  ),
  createDiscoveryCard(
    'Field Notes',
    'crew',
    'crew_science',
    'This committed crew counts as Science.',
    'antenna',
    3,
    { icon: 'signal' },
  ),
  createDiscoveryCard(
    'Pressure Suit',
    'mission',
    'mission_fuel_discount',
    '-1 Fuel cost on this Mission.',
    'shield',
    4,
    { amount: 1 },
  ),
  createDiscoveryCard(
    'Coolant Pack',
    'gate',
    'gate_clear_stress',
    'Clear 1 Stress before this Gate scores.',
    'snowflake',
    5,
    { amount: 1 },
  ),
  createDiscoveryCard(
    'Local Allies',
    'gate',
    'gate_skip_hazard',
    'Skip 1 Black Tide crew slot. Still must Pass.',
    'person',
    6,
    { amount: 1 },
  ),
  createDiscoveryCard(
    'Ration Pack',
    'anytime',
    'ration_pack',
    '+1 Fuel to supply, then discard.',
    'pentagon',
    7,
    { amount: 1 },
  ),
]

const discoveryDeck = discoveryDesigns.flatMap((card) => Array.from({ length: 3 }, () => card))

const driftDeck = [
  ...Array.from({ length: 7 }, () => createDriftCard(
    'Burn',
    'burn',
    'Discard 1 Fuel from the supply. If none, discard nothing.',
  )),
  ...Array.from({ length: 3 }, () => createDriftCard(
    'Fatigue',
    'fatigue',
    'Move the first Ready crew to Tired. If none, add 1 Stress.',
  )),
]

const hazardDeck = [
  createHazardCard(
    'Ion Storm',
    'ion-storm',
    'Engine icons cost +1 Fuel to commit at this Gate.',
    'Commit 2+ Engine crew.',
    'Fractured Engine',
    'Destinations that require Engine cost +1 Fuel.',
    'Electromagnetic interference',
  ),
  createHazardCard(
    'Dust Veil',
    'dust-veil',
    'The first crew committed contributes no icon at this Gate.',
    'Commit 2+ Science crew.',
    'Blinded Sensors',
    'The first crew committed at each Gate contributes no icon.',
    'Sensors blinded',
  ),
  createHazardCard(
    'Cold Reach',
    'cold-reach',
    'Tired crew cannot be readied during this sector.',
    'Commit 2+ Life crew.',
    'Cold Scarring',
    'Tired crew cannot be readied by rewards, Drift recovery, or Medbay Rehydrator.',
    'The cold creeps in',
  ),
  createHazardCard(
    'Echo Field',
    'echo-field',
    'MOTHER cannot be used at this Gate.',
    'Commit 2+ Nav crew.',
    'Jammed Comms',
    'At each Gate, 1 fewer MOTHER can be used.',
    'Comm channels jammed',
  ),
  createHazardCard(
    'Black Tide',
    'black-tide',
    'If Stress is 3+, add +1 crew slot to the Gate.',
    'Finish the Gate with Stress 2 or less.',
    'Flooded Corridors',
    'If Stress is 3+, future Gates add +1 crew slot.',
    'Existing pressure made visible',
  ),
  createHazardCard(
    'Fracture',
    'fracture',
    'One committed crew icon is ignored at this Gate.',
    'Commit a Mechanic crew.',
    'Crew Injury',
    'One committed crew icon is ignored at each Gate.',
    'A crew member is hurt',
  ),
  createHazardCard(
    'Silent Watch',
    'silent-watch',
    'No Drift card flips this sector; 3 Drift cards trigger when the Gate begins.',
    'Commit 1 extra crew beyond the Gate requirement.',
    'Bottled Entropy',
    '1 Drift card triggers when each future Gate begins.',
    'Bottled-up entropy',
  ),
  createHazardCard(
    'Hard Vacuum',
    'hard-vacuum',
    'Each missed icon at the Gate costs 2 MOTHER instead of 1.',
    'Pass the Gate without spending MOTHER.',
    'Thin Margins',
    'Each missed Gate icon costs +1 extra MOTHER.',
    'Margins are thin',
  ),
  createHazardCard(
    'Resonance',
    'resonance',
    'Each Blueprint trigger at this Gate adds 1 Stress.',
    'Pass the Gate without triggering a Blueprint.',
    'Resonant Hull',
    'Each future Blueprint trigger at a Gate adds 1 Stress.',
    'Stress for power',
  ),
  createHazardCard(
    'Ghost Signal',
    'ghost-signal',
    'Reveal one Destination from Sector Stops; it must be one of your 3 stops.',
    'Travel the revealed Destination before the Gate.',
    'Unanswered Signal',
    'Each future sector begins with a revealed Destination that should be traveled.',
    "A distress call you can't ignore",
  ),
  createHazardCard(
    'The Veil',
    'the-veil',
    'All Destinations in this sector cost +1 Fuel.',
    'Commit 2+ Nav crew.',
    'Veiled Charts',
    'All future Destinations cost +1 Fuel.',
    'The whole region is hard',
  ),
]

const horizonDeck = [
  createHorizonCard('Dust Garden', 'planet', 0, ['life', 'star'], shipPartFind(
    'Medbay Rehydrator',
    'medbay-rehydrator',
  )),
  createHorizonCard('Life Orchard', 'planet', 1, ['life', 'engine'], visitRewardFind(
    'Biogel Cache',
    [{ kind: 'ready', count: 1 }],
  )),
  createHorizonCard('Cryo Choir', 'deep-space', 2, ['life', 'signal'], visitRewardFind(
    'Cryo Access Codes',
    [{ kind: 'crew', label: 'Wake', count: 1 }],
  )),
  createHorizonCard('Sleeper Arklet', 'deep-space', 2, ['life', 'life', 'star'], visitRewardFind(
    'Cryo Access Codes',
    [{ kind: 'crew', label: 'Wake', count: 1 }],
  )),
  createHorizonCard('Iron Wake', 'asteroid', 1, ['engine', 'engine'], shipPartFind(
    'Service Drone Bay',
    'service-drone-bay',
  )),
  createHorizonCard('Red Salvage', 'asteroid', 1, ['engine', 'signal'], visitRewardFind(
    'Fuel Cell Cache',
    [{ kind: 'resource', resource: 'fuel', count: 1 }],
  )),
  createHorizonCard('Broken Atlas', 'asteroid', 0, ['signal', 'signal'], visitRewardFind(
    'Survey Archive',
    [{ kind: 'scout', count: 2 }],
  )),
  createHorizonCard('Gravity Sling', 'deep-space', 2, ['star', 'engine'], visitRewardFind(
    'Slingshot Trajectory',
    [{ kind: 'next_stop_fuel_discount', amount: 1 }],
  )),
  createHorizonCard('Quiet Relay', 'planet', 1, ['signal', 'star'], shipPartFind(
    'Adaptive Control Console',
    'adaptive-control-console',
  )),
]

const sectorGates = [
  createGateCard(
    'Narrow Crossing',
    'SECTOR GATE 1',
    ['engine', 'life', 'star', 'signal'],
    3,
    { threshold: 3, extraHumanCrew: 1 },
  ),
  createGateCard(
    'Dark Threshold',
    'SECTOR GATE 2',
    ['engine', 'life', 'star', 'signal'],
    4,
    { threshold: 3, extraHumanCrew: 1 },
  ),
]

export function createSectorHorizonDeckCards() {
  return shuffleCards(horizonDeck)
}

export function createDriftDeckCards() {
  return shuffleCards(driftDeck)
}

export function createHazardDeckCards() {
  return shuffleCards(hazardDeck)
}

export function getSectorGateBlueprint(sector: number) {
  return sectorGates[sector - 1] ?? null
}

export function getSectorName(sector: number) {
  return getSectorGateBlueprint(sector)?.title ?? `Sector ${sector}`
}

export function getSectorDeckTitle(sector: number) {
  return `${getSectorName(sector)} Missions`
}

export function getSectorDeckArt(sector: number) {
  return sectorDeckArt[sector] ?? sectorDeckArt[1]
}

export type InitialBoardSetup = {
  board: BoardState
  predealBoard: BoardState
  events: PlaytestLogEvent[]
}

function normalizeSetupPlayers(players: readonly GamePlayer[] | undefined) {
  const uniquePlayers: GamePlayer[] = []
  const seenPlayerIds = new Set<string>()

  for (const player of players ?? []) {
    const id = player.id.trim()

    if (!id || seenPlayerIds.has(id)) {
      continue
    }

    seenPlayerIds.add(id)
    uniquePlayers.push({
      id,
      name: player.name.trim() || `Player ${uniquePlayers.length + 1}`,
    })
  }

  return uniquePlayers.length > 0 ? uniquePlayers : [SOLO_PLAYER]
}

function createStartingCrewDeal(players: readonly GamePlayer[], shuffledCryoCrewDeck: readonly CardBlueprint[]) {
  if (players.length <= 1) {
    return {
      startingCrewBlueprints: startingCrewCards,
      cryoDeckCards: [...shuffledCryoCrewDeck],
    }
  }

  const cardsPerPlayer = Math.ceil(startingCrewCards.length / players.length)
  const totalStartingCrewCount = cardsPerPlayer * players.length
  const extraCrewCount = Math.max(0, totalStartingCrewCount - startingCrewCards.length)

  return {
    startingCrewBlueprints: [
      ...startingCrewCards,
      ...shuffledCryoCrewDeck.slice(0, extraCrewCount),
    ],
    cryoDeckCards: shuffledCryoCrewDeck.slice(extraCrewCount),
  }
}

export function createInitialBoardSetup(players?: readonly GamePlayer[]): InitialBoardSetup {
  const setupPlayers = normalizeSetupPlayers(players)
  const fuelDeck = shuffleCards(createResourceDeck('fuel', RESOURCE_DECK_SIZE))
  const motherDeckCards = createMotherDeck(MOTHER_DECK_SIZE)
  const shuffledCryoCrewDeck = shuffleCards(cryoCrewDeck)
  const startingCrewDeal = createStartingCrewDeal(setupPlayers, shuffledCryoCrewDeck)
  const discoveryDeckCards = shuffleCards(discoveryDeck)
  const driftDeckCards = createDriftDeckCards()
  const hazardDeckCards = createHazardDeckCards()
  // const hullDeck = shuffleCards(createResourceDeck('hull', RESOURCE_DECK_SIZE))
  const initialFuelCards = createBoardCards('fuel-start', fuelDeck.slice(0, 2))
  // const initialHullCards = createBoardCards('hull-start', hullDeck.slice(0, 4))
  const handCards = createBoardCards('crew-hand', startingCrewDeal.startingCrewBlueprints)
  const crewOwnerEntries = handCards.map((card, index) => {
    const owner = setupPlayers[index % setupPlayers.length] ?? setupPlayers[0]

    return [card.id, owner?.id ?? SOLO_PLAYER_ID] as const
  })
  const sectorGate = getSectorGateBlueprint(1)
  const [gateCard] = createBoardCards('gate', sectorGate ? [sectorGate] : [], false)
  const [hazardCard] = createBoardCards('hazard-1', hazardDeckCards.slice(0, 1))
  const remainingHazardDeckCards = hazardDeckCards.slice(hazardCard ? 1 : 0)
  const fuelDeckCards = fuelDeck.slice(2)
  // const hullDeckCards = hullDeck.slice(4)
  let horizonDeckCards = createSectorHorizonDeckCards()
  const shouldRevealSignalStop = hazardCard?.hazard?.kind === 'ghost-signal'
  const [forcedDestinationCard] = shouldRevealSignalStop
    ? createBoardCards('signal-1', horizonDeckCards.slice(0, 1))
    : []

  if (forcedDestinationCard) {
    horizonDeckCards = horizonDeckCards.slice(1)
  }

  const initialCards = [
    ...initialFuelCards,
    ...handCards,
    ...(gateCard ? [gateCard] : []),
    ...(hazardCard ? [hazardCard] : []),
    ...(forcedDestinationCard ? [forcedDestinationCard] : []),
  ]
  const cryoDeckCards = startingCrewDeal.cryoDeckCards
  const initialSectorDeckArt = getSectorDeckArt(1)

  const board: BoardState = {
    cards: Object.fromEntries(initialCards.map((card) => [card.id, card])),
    stacks: [
      {
        id: FUEL_SUPPLY_STACK_ID,
        cardIds: initialFuelCards.map((card) => card.id),
        x: FUEL_SUPPLY_STACK_POSITION.x,
        y: FUEL_SUPPLY_STACK_POSITION.y,
        z: 1011,
      },
      ...(gateCard
        ? [
            {
              id: 'stack-sector-gate',
              cardIds: [
                gateCard.id,
                ...(hazardCard ? [hazardCard.id] : []),
              ],
              x: SECTOR_GATE_STACK_POSITION.x,
              y: SECTOR_GATE_STACK_POSITION.y,
              z: 1020,
            },
          ]
        : []),
      ...(forcedDestinationCard
        ? [
            {
              id: 'stack-signal-1',
              cardIds: [forcedDestinationCard.id],
              x: MAP_SLOT_POSITIONS[0].x,
              y: MAP_SLOT_POSITIONS[0].y,
              z: 1021,
            },
          ]
        : []),
    ],
    decks: [
      {
        id: FUEL_DECK_ID,
        title: 'Fuel Deck',
        icon: resourceArt.fuel.icon,
        hue: resourceArt.fuel.hue,
        accent: resourceArt.fuel.accent,
        x: 3,
        y: 40,
        z: 1012,
        draw: automaticRewardDeckDraw,
        cards: fuelDeckCards,
      },
      {
        id: HORIZON_DECK_ID,
        title: getSectorDeckTitle(1),
        icon: initialSectorDeckArt.icon,
        hue: initialSectorDeckArt.hue,
        accent: initialSectorDeckArt.accent,
        x: 85,
        y: 8,
        z: 1014,
        draw: {
          ...manualDeckDraw,
          count: MAP_SLOT_COUNT,
          placement: 'nearby',
        },
        cards: horizonDeckCards,
      },
      {
        id: MOTHER_DECK_ID,
        title: 'MOTHER Deck',
        icon: motherArt.icon,
        hue: motherArt.hue,
        accent: motherArt.accent,
        x: 3,
        y: 8,
        z: 1013,
        draw: manualDeckDraw,
        cards: motherDeckCards,
      },
      {
        id: CRYO_DECK_ID,
        title: 'Cryo Deck',
        icon: crewArt.icon,
        hue: crewArt.hue,
        accent: crewArt.accent,
        x: 39,
        y: 8,
        z: 1016,
        draw: automaticRewardDeckDraw,
        cards: cryoDeckCards,
      },
      {
        id: DISCOVERY_DECK_ID,
        title: 'Discovery Deck',
        icon: discoveryArt.icon,
        hue: discoveryArt.hue,
        accent: discoveryArt.accent,
        x: 15,
        y: 8,
        z: 1015,
        draw: automaticRewardDeckDraw,
        cards: discoveryDeckCards,
      },
      {
        id: DRIFT_DECK_ID,
        title: 'Drift Deck',
        icon: driftArt.icon,
        hue: driftArt.hue,
        accent: driftArt.accent,
        x: 27,
        y: 8,
        z: 1018,
        draw: automaticRewardDeckDraw,
        cards: driftDeckCards,
      },
      {
        id: HAZARD_DECK_ID,
        title: 'Hazard Deck',
        icon: 'crosshair',
        hue: 356,
        accent: '#ff6f7d',
        x: 51,
        y: 8,
        z: 1019,
        draw: automaticRewardDeckDraw,
        cards: remainingHazardDeckCards,
      },
    ],
    mapSlots: Array.from({ length: MAP_SLOT_COUNT }, (_, index) => (
      index === 0 ? forcedDestinationCard?.id ?? null : null
    )),
    routeSlots: Array.from({ length: ROUTE_SLOT_COUNT }, () => null),
    shipPartSlots: [],
    archivedRouteCardIds: [],
    handCardIds: handCards.map((card) => card.id),
    tiredCardIds: [],
    roundStartTiredCardIds: [],
    completedStarSummaries: [],
    pendingWakeChoice: null,
    pendingScoutChoice: null,
    pendingDrift: null,
    forcedDestinationCardId: forcedDestinationCard?.id ?? null,
    pendingEffects: [],
    turnNumber: 1,
    turnPlayerIndex: 0,
    currentPlayerId: setupPlayers[0]?.id ?? null,
    sectorDrawnThisTurn: false,
    traveledThisTurn: false,
    stressCount: 0,
    currentSector: 1,
    totalSectors: TOTAL_SECTORS,
    hasArrived: false,
    lossReason: null,
    topZ: forcedDestinationCard ? 1021 : 1020,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    players: setupPlayers,
    crewOwnerIds: Object.fromEntries(crewOwnerEntries),
    discoveryOwnerIds: {},
  }
  const predealBoard: BoardState = {
    ...board,
    cards: {},
    stacks: [],
    decks: board.decks.map((deck) => {
      if (deck.id === FUEL_DECK_ID) {
        return { ...deck, cards: fuelDeck }
      }

      if (deck.id === HORIZON_DECK_ID) {
        return {
          ...deck,
          cards: [
            ...(sectorGate ? [sectorGate] : []),
            ...(forcedDestinationCard ? [forcedDestinationCard] : []),
            ...horizonDeckCards,
          ],
        }
      }

      if (deck.id === CRYO_DECK_ID) {
        return { ...deck, cards: [...startingCrewDeal.startingCrewBlueprints, ...cryoDeckCards] }
      }

      if (deck.id === HAZARD_DECK_ID) {
        return { ...deck, cards: hazardDeckCards }
      }

      return deck
    }),
    mapSlots: Array.from({ length: MAP_SLOT_COUNT }, () => null),
    handCardIds: [],
    tiredCardIds: [],
    roundStartTiredCardIds: [],
    forcedDestinationCardId: null,
    topZ: board.decks.reduce((topZ, deck) => Math.max(topZ, deck.z), 0),
  }

  return {
    board,
    predealBoard,
    events: [
      setupDeckCreatedEvent(FUEL_DECK_ID, 'Fuel Deck', fuelDeckCards),
      setupDeckCreatedEvent(MOTHER_DECK_ID, 'MOTHER Deck', motherDeckCards),
      // setupDeckCreatedEvent('hull-deck', 'Hull Deck', hullDeckCards),
      setupDeckCreatedEvent(HORIZON_DECK_ID, getSectorDeckTitle(1), horizonDeckCards),
      setupDeckCreatedEvent(CRYO_DECK_ID, 'Cryo Deck', cryoDeckCards),
      setupDeckCreatedEvent(DISCOVERY_DECK_ID, 'Discovery Deck', discoveryDeckCards),
      setupDeckCreatedEvent(DRIFT_DECK_ID, 'Drift Deck', driftDeckCards),
      setupDeckCreatedEvent(HAZARD_DECK_ID, 'Hazard Deck', remainingHazardDeckCards),
      ...(gateCard ? [setupGatePlacedEvent(gateCard, 'stack-sector-gate')] : []),
      ...(hazardCard ? [setupHazardPlacedEvent(hazardCard, 'stack-sector-gate')] : []),
      ...(forcedDestinationCard && hazardCard
        ? [hazardSignaledDestinationEvent(hazardCard, forcedDestinationCard)]
        : []),
      ...initialFuelCards.map((card, index) => setupResourceDrawnEvent(card, 'Fuel Deck', index + 1)),
      // ...initialHullCards.map((card, index) => setupResourceDrawnEvent(card, 'Hull Deck', index + 1)),
      ...handCards.map((card, index) => (
        setupCrewDealtEvent(
          card,
          index + 1,
          setupPlayers.find((player) => player.id === crewOwnerEntries[index]?.[1]) ?? null,
        )
      )),
    ],
  }
}

export function createInitialBoard(): BoardState {
  return createInitialBoardSetup().board
}
