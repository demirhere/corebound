export const GAME_ICON_KINDS = [
  'hull',
  'fuel',
  'scrap',
  'parts',
  'engine',
  'star',
  'life',
  'signal',
  'mother',
  'person',
  'tired-person',
  'any',
] as const

export type GameIconKind = (typeof GAME_ICON_KINDS)[number]

export const GAME_ICON_PALETTE: Record<GameIconKind, { color: string, stroke: string }> = {
  hull: { color: '#f4d56a', stroke: '#4a3510' },
  fuel: { color: '#f2c556', stroke: '#3a2108' },
  scrap: { color: '#cf8a46', stroke: '#3f2109' },
  parts: { color: '#ef8051', stroke: '#4a2110' },
  engine: { color: '#ee9f3d', stroke: '#4a2708' },
  star: { color: '#a9a2ff', stroke: '#29245c' },
  life: { color: '#7fcf63', stroke: '#1e431b' },
  signal: { color: '#58cfd0', stroke: '#123f42' },
  mother: { color: '#ff7285', stroke: '#52121d' },
  person: { color: '#73c5f0', stroke: '#15394f' },
  'tired-person': { color: '#b5bdc9', stroke: '#343a46' },
  any: { color: '#c5b9df', stroke: '#2f2948' },
}

const CARD_ART_ICON_KINDS = GAME_ICON_KINDS.filter((kind) => (
  kind !== 'tired-person' && kind !== 'any' && kind !== 'scrap'
))

export const GAME_ICON_LABELS: Record<GameIconKind, string> = {
  hull: 'Hull',
  fuel: 'Fuel',
  scrap: 'Scrap',
  parts: 'Parts',
  engine: 'Engine',
  star: 'Nav',
  life: 'Life',
  signal: 'Science',
  mother: 'MOTHER',
  person: 'Crew',
  'tired-person': 'Tired crew',
  any: 'Any icon',
}

const CARD_NOTE_LINES = [
  ['Specimen stable.', 'Retest at dawn.'],
  ['O2 drift is calm.'],
  ['Dust sample hums.', 'Use shielded vial.'],
  ['Seed trays woke early.'],
  ['Beaker fogs softly.', 'Do not open yet.'],
  ['Hull frost mapped.'],
  ['Water loop sings.', 'Check valve B.'],
  ['Keep coil warm.'],
  ['Root growth leans blue.', 'Dim lab light.'],
  ['Archive odd pulse.'],
  ['Vent spores observed.', 'Mask before entry.'],
  ['Compass needle jitters.'],
] as const

export function hashString(value: string) {
  let hash = 2166136261

  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function pickCardIcons(seed: string) {
  let cursor = hashString(seed)
  const count = 2 + (cursor % 3)
  const pool = [...CARD_ART_ICON_KINDS]
  const icons: GameIconKind[] = []

  for (let index = 0; index < count; index += 1) {
    cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0

    const poolIndex = cursor % pool.length
    const [pickedIcon] = pool.splice(poolIndex, 1)

    if (pickedIcon) {
      icons.push(pickedIcon)
    }
  }

  return icons
}

export function pickCardNote(seed: string) {
  return CARD_NOTE_LINES[hashString(`${seed}:note`) % CARD_NOTE_LINES.length]
}
