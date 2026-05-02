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

const RESOURCE_DECK_SIZE = 12

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

function createCrewCard(
  title: string,
  specializations: [CrewSpecialization, CrewSpecialization],
  hue: number,
  accent: string,
): CardBlueprint {
  return {
    title,
    icon: 'person',
    hue,
    accent,
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

const startingCrewCards = [
  createCrewCard('Lei Watanabe', ['life', 'star'], 151, '#77ffbb'),
  createCrewCard('Mara Voss', ['engine', 'engine'], 8, '#ff7468'),
]

const cryoCrewDeck = [
  createCrewCard('Sana Iqbal', ['life', 'life'], 118, '#9cff7a'),
  createCrewCard('Juno Pike', ['engine', 'star'], 192, '#64f3ff'),
  createCrewCard('Ilya Rao', ['star', 'signal'], 250, '#b99cff'),
  createCrewCard('Ada Chen', ['engine', 'signal'], 312, '#ff7bd5'),
  createCrewCard('Tomas Hale', ['engine', 'life'], 35, '#ffb25f'),
  createCrewCard('Nia Okonkwo', ['signal', 'star'], 274, '#cf8cff'),
]

const horizonDeck = [
  createHorizonCard('Dust Garden', 'planet', 0, ['life', 'star'], [
    { kind: 'resource', resource: 'fuel', count: 1 },
  ]),
  createHorizonCard('Iron Wake', 'asteroid', 1, ['engine', 'engine'], [
    { kind: 'resource', resource: 'hull', count: 1 },
  ]),
  createHorizonCard('Cryo Choir', 'star', 2, ['life', 'signal'], [
    { kind: 'crew', label: 'Crew', count: 1 },
  ]),
  createHorizonCard('Red Salvage', 'asteroid', 1, ['engine', 'signal'], [
    { kind: 'resource', resource: 'fuel', count: 1 },
  ]),
  createHorizonCard('Hull Orchard', 'planet', 1, ['life', 'engine'], [
    { kind: 'resource', resource: 'hull', count: 1 },
  ]),
  createHorizonCard('Sleeper Arklet', 'star', 2, ['life', 'life', 'star'], [
    { kind: 'crew', label: 'Wake', count: 1 },
  ]),
]

export function createInitialBoard(): BoardState {
  const fuelDeck = shuffleCards(createResourceDeck('fuel', RESOURCE_DECK_SIZE))
  const hullDeck = shuffleCards(createResourceDeck('hull', RESOURCE_DECK_SIZE))
  const initialFuelCards = createBoardCards('fuel-start', fuelDeck.slice(0, 3))
  const initialHullCards = createBoardCards('hull-start', hullDeck.slice(0, 4))
  const handCards = createBoardCards('crew-hand', startingCrewCards)
  const initialCards = [...initialFuelCards, ...initialHullCards, ...handCards]

  return {
    cards: Object.fromEntries(initialCards.map((card) => [card.id, card])),
    stacks: [
      {
        id: 'stack-hull-supply',
        cardIds: initialHullCards.map((card) => card.id),
        x: 19,
        y: 17,
        z: 10,
      },
      {
        id: 'stack-fuel-supply',
        cardIds: initialFuelCards.map((card) => card.id),
        x: 31,
        y: 17,
        z: 11,
      },
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
        cards: fuelDeck.slice(3),
      },
      {
        id: 'hull-deck',
        title: 'Hull Deck',
        icon: resourceArt.hull.icon,
        hue: resourceArt.hull.hue,
        accent: resourceArt.hull.accent,
        x: 6,
        y: 40,
        z: 13,
        cards: hullDeck.slice(4),
      },
      {
        id: 'horizon-deck',
        title: 'Horizon Deck',
        icon: 'star',
        hue: 261,
        accent: '#b99cff',
        x: 81,
        y: 12,
        z: 14,
        cards: shuffleCards(horizonDeck),
      },
      {
        id: 'cryo-deck',
        title: 'Cryo Deck',
        icon: 'person',
        hue: 198,
        accent: '#82d8ff',
        x: 81,
        y: 40,
        z: 15,
        cards: shuffleCards(cryoCrewDeck),
      },
    ],
    handCardIds: handCards.map((card) => card.id),
    topZ: 15,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }
}
