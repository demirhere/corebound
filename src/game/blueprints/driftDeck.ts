import { createDriftCard } from './factories'

export const driftDeck = [
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
