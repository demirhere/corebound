export const GAME_ICON_KINDS = [
  'hull',
  'fuel',
  'parts',
  'engine',
  'star',
  'life',
  'signal',
  'mother',
  'person',
] as const

export type GameIconKind = (typeof GAME_ICON_KINDS)[number]

export const GAME_ICON_LABELS: Record<GameIconKind, string> = {
  hull: 'Hull',
  fuel: 'Fuel',
  parts: 'Parts',
  engine: 'Engine',
  star: 'Star',
  life: 'Life',
  signal: 'Signal',
  mother: 'MOTHER',
  person: 'Person',
}

const CARD_NOTE_LINES = [
  ['Specimen stable.', 'Retest at dawn.'],
  ['O2 drift is calm.'],
  ['Dust sample hums.', 'Use shielded vial.'],
  ['Seed trays woke early.'],
  ['Signal repeats softly.', 'Do not answer yet.'],
  ['Hull frost mapped.'],
  ['Water loop sings.', 'Check valve B.'],
  ['Keep coil warm.'],
  ['Root growth leans blue.', 'Dim lab light.'],
  ['Archive odd pulse.'],
  ['Vent spores observed.', 'Mask before entry.'],
  ['Compass needle jitters.'],
] as const

function hashString(value: string) {
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
  const pool = [...GAME_ICON_KINDS]
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
