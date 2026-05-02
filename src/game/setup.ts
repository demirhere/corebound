import type {
  BoardState,
  Card,
  CardBlueprint,
  CardIconKind,
  CrewSpecialization,
  HorizonKind,
  HorizonReward,
  RequirementIconKind,
  ResourceKind,
} from './types'
import { HORIZON_DECK_ID, MOTHER_DECK_ID, automaticRewardDeckDraw, manualDeckDraw } from './decks'
import { cardContent, cardRulesText } from './logEvents'
import type { PlaytestLogEvent } from './playtestLog'

const RESOURCE_DECK_SIZE = 12
const MOTHER_DECK_SIZE = 6

type DeckArt = {
  icon: CardIconKind
  hue: number
  accent: string
}

const resourceArt: Record<ResourceKind, DeckArt> = {
  fuel: {
    icon: 'drop',
    hue: 207,
    accent: '#5bbdff',
  },
  hull: {
    icon: 'shield',
    hue: 48,
    accent: '#ffe073',
  },
}

const horizonArt: Record<HorizonKind, DeckArt> = {
  star: {
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
): CardBlueprint {
  return {
    title,
    icon: crewArt.icon,
    hue: crewArt.hue,
    accent: crewArt.accent,
    kind: 'crew',
    specializations,
  }
}

function createHorizonCard(
  title: string,
  horizonKind: HorizonKind,
  fuel: number,
  icons: RequirementIconKind[],
  rewards: HorizonReward[],
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
      rewards,
    },
  }
}

function createGateCard(
  title: string,
  label: string,
  icons: RequirementIconKind[],
  any: number,
  motherPenalty: { threshold: number; extraCrew: number },
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
        any,
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
  createCrewCard('Lei Watanabe', ['life', 'star']),
  createCrewCard('Mara Voss', ['engine', 'engine']),
  createCrewCard('Ada Chen', ['engine', 'signal']),
  createCrewCard('Sana Iqbal', ['life', 'life']),
  createCrewCard('Juno Pike', ['engine', 'star']),
  createCrewCard('Nia Okonkwo', ['signal', 'star']),
]

const cryoCrewDeck = [
  createCrewCard('Ilya Rao', ['star', 'signal']),
  createCrewCard('Tomas Hale', ['engine', 'life']),
  createCrewCard('Elise Tan', ['life', 'signal']),
  createCrewCard('Oren Vale', ['signal', 'signal']),
  createCrewCard('Malik Ortega', ['star', 'star']),
  createCrewCard('Priya Shah', ['life', 'engine']),
]

const horizonDeck = [
  createHorizonCard('Dust Garden', 'planet', 0, ['life', 'star'], [
    { kind: 'resource', resource: 'fuel', count: 1 },
  ]),
  createHorizonCard('Life Orchard', 'planet', 1, ['life', 'engine'], [
    { kind: 'ready', count: 1 },
  ]),
  createHorizonCard('Cryo Choir', 'star', 2, ['life', 'signal'], [
    { kind: 'crew', label: 'Wake', count: 1 },
  ]),
  createHorizonCard('Sleeper Arklet', 'star', 2, ['life', 'life', 'star'], [
    { kind: 'crew', label: 'Wake', count: 1 },
  ]),
  createHorizonCard('Iron Wake', 'asteroid', 1, ['engine', 'engine'], [
    { kind: 'resource', resource: 'fuel', count: 1 },
  ]),
  createHorizonCard('Red Salvage', 'asteroid', 1, ['engine', 'signal'], [
    { kind: 'resource', resource: 'fuel', count: 1 },
  ]),
  createHorizonCard('Broken Atlas', 'asteroid', 0, ['signal', 'signal'], [
    { kind: 'scout', count: 2 },
  ]),
  createHorizonCard('Gravity Sling', 'star', 2, ['star', 'engine'], [
    { kind: 'next_star_fuel_discount', amount: 1 },
  ]),
  createHorizonCard('Quiet Relay', 'planet', 1, ['signal', 'star'], [
    { kind: 'scout', count: 3 },
  ]),
]

const sectorGate = createGateCard(
  'Narrow Crossing',
  'SECTOR GATE',
  ['engine', 'life', 'star', 'signal'],
  1,
  { threshold: 3, extraCrew: 1 },
)

export function createInitialBoardSetup(): { board: BoardState; events: PlaytestLogEvent[] } {
  const fuelDeck = shuffleCards(createResourceDeck('fuel', RESOURCE_DECK_SIZE))
  const motherDeckCards = createMotherDeck(MOTHER_DECK_SIZE)
  // const hullDeck = shuffleCards(createResourceDeck('hull', RESOURCE_DECK_SIZE))
  const initialFuelCards = createBoardCards('fuel-start', fuelDeck.slice(0, 3))
  // const initialHullCards = createBoardCards('hull-start', hullDeck.slice(0, 4))
  const handCards = createBoardCards('crew-hand', startingCrewCards)
  const [gateCard] = createBoardCards('gate', [sectorGate])
  const initialCards = [...initialFuelCards, ...handCards, ...(gateCard ? [gateCard] : [])]
  const fuelDeckCards = fuelDeck.slice(3)
  // const hullDeckCards = hullDeck.slice(4)
  const horizonDeckCards = shuffleCards(horizonDeck)
  const cryoDeckCards = shuffleCards(cryoCrewDeck)

  const board: BoardState = {
    cards: Object.fromEntries(initialCards.map((card) => [card.id, card])),
    stacks: [
      {
        id: 'stack-fuel-supply',
        cardIds: initialFuelCards.map((card) => card.id),
        x: 18,
        y: 12,
        z: 11,
      },
      ...(gateCard
        ? [
            {
              id: 'stack-sector-gate',
              cardIds: [gateCard.id],
              x: 43,
              y: 40,
              z: 16,
            },
          ]
        : []),
    ],
    decks: [
      {
        id: 'fuel-deck',
        title: 'Fuel Deck',
        icon: resourceArt.fuel.icon,
        hue: resourceArt.fuel.hue,
        accent: resourceArt.fuel.accent,
        x: 6,
        y: 12,
        z: 12,
        draw: automaticRewardDeckDraw,
        cards: fuelDeckCards,
      },
      {
        id: HORIZON_DECK_ID,
        title: 'Horizon Deck',
        icon: 'star',
        hue: 261,
        accent: '#b99cff',
        x: 81,
        y: 12,
        z: 14,
        draw: {
          ...manualDeckDraw,
          count: 3,
          placement: 'left-row',
        },
        cards: horizonDeckCards,
      },
      {
        id: MOTHER_DECK_ID,
        title: 'MOTHER Deck',
        icon: motherArt.icon,
        hue: motherArt.hue,
        accent: motherArt.accent,
        x: 6,
        y: 40,
        z: 13,
        draw: manualDeckDraw,
        cards: motherDeckCards,
      },
      {
        id: 'cryo-deck',
        title: 'Cryo Deck',
        icon: crewArt.icon,
        hue: crewArt.hue,
        accent: crewArt.accent,
        x: 81,
        y: 40,
        z: 15,
        draw: automaticRewardDeckDraw,
        cards: cryoDeckCards,
      },
    ],
    handCardIds: handCards.map((card) => card.id),
    tiredCardIds: [],
    pendingWakeChoice: null,
    pendingEffects: [],
    hasArrived: false,
    lossReason: null,
    topZ: 16,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }

  return {
    board,
    events: [
      setupDeckCreatedEvent('fuel-deck', 'Fuel Deck', fuelDeckCards),
      setupDeckCreatedEvent(MOTHER_DECK_ID, 'MOTHER Deck', motherDeckCards),
      // setupDeckCreatedEvent('hull-deck', 'Hull Deck', hullDeckCards),
      setupDeckCreatedEvent('horizon-deck', 'Horizon Deck', horizonDeckCards),
      setupDeckCreatedEvent('cryo-deck', 'Cryo Deck', cryoDeckCards),
      ...(gateCard ? [setupGateRevealedEvent(gateCard, 'stack-sector-gate')] : []),
      ...initialFuelCards.map((card, index) => setupResourceDrawnEvent(card, 'Fuel Deck', index + 1)),
      // ...initialHullCards.map((card, index) => setupResourceDrawnEvent(card, 'Hull Deck', index + 1)),
      ...handCards.map((card, index) => setupCrewDealtEvent(card, index + 1)),
    ],
  }
}

export function createInitialBoard(): BoardState {
  return createInitialBoardSetup().board
}
