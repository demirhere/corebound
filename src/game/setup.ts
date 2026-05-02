import type { BoardState, Card, CardBlueprint } from './types'

const startingCards: Card[] = [
  {
    id: 'ark-bridge',
    title: 'Ark Bridge',
    icon: 'rocket',
    hue: 193,
    accent: '#64f3ff',
    faceUp: true,
  },
  {
    id: 'cryo-garden',
    title: 'Cryo Garden',
    icon: 'sprout',
    hue: 139,
    accent: '#6dff9e',
    faceUp: true,
  },
  {
    id: 'fusion-core',
    title: 'Fusion Core',
    icon: 'sun',
    hue: 35,
    accent: '#ffb25f',
    faceUp: true,
  },
  {
    id: 'water-loop',
    title: 'Water Loop',
    icon: 'drop',
    hue: 205,
    accent: '#71c7ff',
    faceUp: false,
  },
  {
    id: 'signal-beacon',
    title: 'Signal Beacon',
    icon: 'antenna',
    hue: 274,
    accent: '#cf8cff',
    faceUp: true,
  },
  {
    id: 'scout-drone',
    title: 'Scout Drone',
    icon: 'satellite',
    hue: 314,
    accent: '#ff7bd5',
    faceUp: true,
  },
]

const sectorDeck: CardBlueprint[] = [
  {
    title: 'Dust Moon',
    icon: 'moon',
    hue: 24,
    accent: '#ff9f68',
  },
  {
    title: 'Nebula Gate',
    icon: 'star',
    hue: 286,
    accent: '#da8cff',
  },
  {
    title: 'Ice Ring',
    icon: 'snowflake',
    hue: 198,
    accent: '#82d8ff',
  },
  {
    title: 'Ember Field',
    icon: 'diamond',
    hue: 8,
    accent: '#ff7468',
  },
  {
    title: 'Green Echo',
    icon: 'hex',
    hue: 151,
    accent: '#77ffbb',
  },
]

const shipDeck: CardBlueprint[] = [
  {
    title: 'Sleeper Crew',
    icon: 'crescent',
    hue: 229,
    accent: '#8fa2ff',
  },
  {
    title: 'Seed Vault',
    icon: 'flower',
    hue: 95,
    accent: '#baff7a',
  },
  {
    title: 'Hull Patch',
    icon: 'pentagon',
    hue: 48,
    accent: '#ffe073',
  },
  {
    title: 'Navigator',
    icon: 'crosshair',
    hue: 176,
    accent: '#69ffe8',
  },
]

export function createInitialBoard(): BoardState {
  return {
    cards: Object.fromEntries(startingCards.map((card) => [card.id, card])),
    stacks: [
      { id: 'stack-bridge', cardIds: ['ark-bridge'], x: 27, y: 52, z: 10 },
      { id: 'stack-life', cardIds: ['cryo-garden', 'fusion-core'], x: 43, y: 14, z: 11 },
      { id: 'stack-water', cardIds: ['water-loop'], x: 57, y: 58, z: 12 },
      { id: 'stack-comms', cardIds: ['signal-beacon', 'scout-drone'], x: 70, y: 27, z: 13 },
    ],
    decks: [
      {
        id: 'sector-deck',
        title: 'Sector Deck',
        icon: 'star',
        hue: 261,
        accent: '#b99cff',
        x: 7,
        y: 15,
        z: 14,
        cards: sectorDeck,
      },
      {
        id: 'ship-deck',
        title: 'Ship Deck',
        icon: 'hex',
        hue: 164,
        accent: '#61ffd3',
        x: 77,
        y: 63,
        z: 15,
        cards: shipDeck,
      },
    ],
    handCardIds: [],
    topZ: 15,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
  }
}
