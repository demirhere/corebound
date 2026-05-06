import { createGateCard } from './factories'

export const sectorGates = [
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
