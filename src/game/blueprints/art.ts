import type { CardIconKind, HazardKind, MissionKind, ResourceKind } from '../types'

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
  scrap: {
    icon: 'hex',
    hue: 24,
    accent: '#c89060',
  },
}

export const missionArt: Record<MissionKind, DeckArt> = {
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
  3: {
    icon: 'moon',
    hue: 184,
    accent: '#73ffd6',
  },
  4: {
    icon: 'diamond',
    hue: 147,
    accent: '#77ffbb',
  },
  5: {
    icon: 'flower',
    hue: 96,
    accent: '#bcdd6a',
  },
  6: {
    icon: 'snowflake',
    hue: 42,
    accent: '#ffb72e',
  },
  7: {
    icon: 'hex',
    hue: 20,
    accent: '#ff9f68',
  },
  8: {
    icon: 'satellite',
    hue: 354,
    accent: '#ff4f64',
  },
  9: {
    icon: 'antenna',
    hue: 309,
    accent: '#ff8ce6',
  },
  10: {
    icon: 'gate',
    hue: 282,
    accent: '#d98cff',
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
  'fractured-engine': {
    icon: 'zap',
    hue: 48,
    accent: '#ffd45d',
  },
  'frozen-sector': {
    icon: 'snowflake',
    hue: 197,
    accent: '#9bd8e8',
  },
  'comm-failure': {
    icon: 'antenna',
    hue: 309,
    accent: '#ff8ce6',
  },
  'sensor-loss': {
    icon: 'satellite',
    hue: 162,
    accent: '#7cffd3',
  },
  'hull-crack': {
    icon: 'crescent',
    hue: 232,
    accent: '#8793ff',
  },
  'crew-quarters-damaged': {
    icon: 'person',
    hue: 24,
    accent: '#e0a56b',
  },
  'sealed-cargo': {
    icon: 'diamond',
    hue: 184,
    accent: '#73ffd6',
  },
  'stress-echo': {
    icon: 'hex',
    hue: 128,
    accent: '#70c58c',
  },
  'phantom-course': {
    icon: 'moon',
    hue: 24,
    accent: '#e0a56b',
  },
  'drift-loop': {
    icon: 'star',
    hue: 266,
    accent: '#b99cff',
  },
  'long-reach': {
    icon: 'flower',
    hue: 280,
    accent: '#d98cff',
  },
}
