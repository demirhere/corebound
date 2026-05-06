import type { CardIconKind, HazardKind, HorizonKind, ResourceKind } from '../types'

export type DeckArt = {
  icon: CardIconKind
  hue: number
  accent: string
}

export const resourceArt: Record<ResourceKind, DeckArt> = {
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

export const horizonArt: Record<HorizonKind, DeckArt> = {
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

export const motherArt: DeckArt = {
  icon: 'mother',
  hue: 354,
  accent: '#ff4f64',
}

export const gateArt: DeckArt = {
  icon: 'gate',
  hue: 184,
  accent: '#73ffd6',
}

export const sectorDeckArt: Record<number, DeckArt> = {
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

export const crewArt: DeckArt = {
  icon: 'person',
  hue: 198,
  accent: '#82d8ff',
}

export const discoveryArt: DeckArt = {
  icon: 'flower',
  hue: 128,
  accent: '#70c58c',
}

export const driftArt: DeckArt = {
  icon: 'snowflake',
  hue: 196,
  accent: '#9bd8e8',
}

export const hazardArt: Record<HazardKind, DeckArt> = {
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
