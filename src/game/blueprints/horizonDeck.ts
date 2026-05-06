import { createHorizonCard, shipPartFind, visitRewardFind } from './factories'

export const horizonDeck = [
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
