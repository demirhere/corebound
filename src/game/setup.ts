import type {
  BoardState,
  Card,
  CardBlueprint,
  CardIconKind,
  CrewSpecialization,
  DestinationFind,
  HorizonKind,
  RequirementIconKind,
  ResourceKind,
  ShipPartKind,
  VisitReward,
} from './types'
import {
  CRYO_DECK_ID,
  FUEL_DECK_ID,
  HORIZON_DECK_ID,
  MOTHER_DECK_ID,
  automaticRewardDeckDraw,
  manualDeckDraw,
} from './decks'
import { cardContent, cardRulesText, mapInitializedEvent } from './logEvents'
import type { PlaytestLogEvent } from './playtestLog'

const RESOURCE_DECK_SIZE = 12
const MOTHER_DECK_SIZE = 6
export const TOTAL_SECTORS = 2
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
  y: 8,
}
export const MOTHER_SUPPLY_STACK_ID = 'stack-mother-supply'
export const MOTHER_SUPPLY_STACK_POSITION = {
  x: 15,
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

function createBoardCards(prefix: string, blueprints: readonly CardBlueprint[]) {
  return blueprints.map<Card>((blueprint, index) => ({
    ...blueprint,
    id: `${prefix}-${index + 1}`,
    faceUp: true,
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

function setupCrewDealtEvent(card: Card, handIndex: number): PlaytestLogEvent {
  const rulesText = cardRulesText(card)

  return {
    type: 'setup.crew.dealt',
    message: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''} dealt to starting crew.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`,
      cardContent: cardContent(card),
      handIndex,
    },
  }
}

function setupGateRevealedEvent(card: Card, stackId: string): PlaytestLogEvent {
  const rulesText = cardRulesText(card)

  return {
    type: 'setup.gate.revealed',
    message: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''} revealed as this sector's Gate.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`,
      cardContent: cardContent(card),
      stackId,
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

export function getSectorGateBlueprint(sector: number) {
  return sectorGates[sector - 1] ?? null
}

export function getSectorDeckTitle(sector: number) {
  return `Sector ${sector} Deck`
}

export function getSectorDeckArt(sector: number) {
  return sectorDeckArt[sector] ?? sectorDeckArt[1]
}

export type InitialBoardSetup = {
  board: BoardState
  predealBoard: BoardState
  events: PlaytestLogEvent[]
}

export function createInitialBoardSetup(): InitialBoardSetup {
  const fuelDeck = shuffleCards(createResourceDeck('fuel', RESOURCE_DECK_SIZE))
  const motherDeckCards = createMotherDeck(MOTHER_DECK_SIZE)
  // const hullDeck = shuffleCards(createResourceDeck('hull', RESOURCE_DECK_SIZE))
  const initialFuelCards = createBoardCards('fuel-start', fuelDeck.slice(0, 2))
  // const initialHullCards = createBoardCards('hull-start', hullDeck.slice(0, 4))
  const handCards = createBoardCards('crew-hand', startingCrewCards)
  const sectorGate = getSectorGateBlueprint(1)
  const [gateCard] = createBoardCards('gate', sectorGate ? [sectorGate] : [])
  const fuelDeckCards = fuelDeck.slice(2)
  // const hullDeckCards = hullDeck.slice(4)
  const horizonDeckCards = createSectorHorizonDeckCards()
  const mapStopCards = createBoardCards('map-1', horizonDeckCards.slice(0, MAP_SLOT_COUNT))
  const remainingHorizonDeckCards = horizonDeckCards.slice(MAP_SLOT_COUNT)
  const initialCards = [
    ...initialFuelCards,
    ...handCards,
    ...(gateCard ? [gateCard] : []),
    ...mapStopCards,
  ]
  const cryoDeckCards = shuffleCards(cryoCrewDeck)
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
              cardIds: [gateCard.id],
              x: 43,
              y: 40,
              z: 1016,
            },
          ]
        : []),
      ...mapStopCards.map((card, index) => {
        const position = MAP_SLOT_POSITIONS[index] ?? MAP_SLOT_POSITIONS[0]

        return {
          id: `stack-map-${index + 1}`,
          cardIds: [card.id],
          x: position.x,
          y: position.y,
          z: 1017 + index,
        }
      }),
    ],
    decks: [
      {
        id: FUEL_DECK_ID,
        title: 'Fuel Deck',
        icon: resourceArt.fuel.icon,
        hue: resourceArt.fuel.hue,
        accent: resourceArt.fuel.accent,
        x: 3,
        y: 8,
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
          ...automaticRewardDeckDraw,
          placement: 'nearby',
        },
        cards: remainingHorizonDeckCards,
      },
      {
        id: MOTHER_DECK_ID,
        title: 'MOTHER Deck',
        icon: motherArt.icon,
        hue: motherArt.hue,
        accent: motherArt.accent,
        x: 3,
        y: 40,
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
        x: 3,
        y: 72,
        z: 1015,
        draw: automaticRewardDeckDraw,
        cards: cryoDeckCards,
      },
    ],
    mapSlots: mapStopCards.map((card) => card.id),
    routeSlots: Array.from({ length: ROUTE_SLOT_COUNT }, () => null),
    shipPartSlots: [],
    archivedRouteCardIds: [],
    handCardIds: handCards.map((card) => card.id),
    tiredCardIds: [],
    completedStarSummaries: [],
    pendingWakeChoice: null,
    pendingScoutChoice: null,
    pendingEffects: [],
    pendingMapRefreshAfterScout: false,
    stressCount: 0,
    currentSector: 1,
    totalSectors: TOTAL_SECTORS,
    hasArrived: false,
    lossReason: null,
    topZ: 1016 + mapStopCards.length,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
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
        return { ...deck, cards: [...(sectorGate ? [sectorGate] : []), ...horizonDeckCards] }
      }

      if (deck.id === CRYO_DECK_ID) {
        return { ...deck, cards: [...startingCrewCards, ...cryoDeckCards] }
      }

      return deck
    }),
    handCardIds: [],
    tiredCardIds: [],
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
      ...(gateCard ? [setupGateRevealedEvent(gateCard, 'stack-sector-gate')] : []),
      mapInitializedEvent(1, mapStopCards),
      ...initialFuelCards.map((card, index) => setupResourceDrawnEvent(card, 'Fuel Deck', index + 1)),
      // ...initialHullCards.map((card, index) => setupResourceDrawnEvent(card, 'Hull Deck', index + 1)),
      ...handCards.map((card, index) => setupCrewDealtEvent(card, index + 1)),
    ],
  }
}

export function createInitialBoard(): BoardState {
  return createInitialBoardSetup().board
}
