import { createMissionCard, shipPartFind, visitRewardFind } from './factories'

export const missionDeck = [
  createMissionCard('Dust Garden', 'planet', 0, ['life', 'star'], shipPartFind(
    'Medbay Rehydrator',
    'medbay-rehydrator',
  )),
  createMissionCard('Life Orchard', 'planet', 0, ['life', 'engine'], visitRewardFind(
    'Biogel Fuel Cache',
    [{ kind: 'resource', resource: 'fuel', count: 2 }],
  )),
  createMissionCard('Cryo Choir', 'deep-space', 0, ['life', 'signal', 'signal'], visitRewardFind(
    'Cryo Fuel Cells',
    [{ kind: 'resource', resource: 'fuel', count: 3 }],
  )),
  createMissionCard('Sleeper Arklet', 'deep-space', 0, ['life', 'life', 'star', 'star'], visitRewardFind(
    'Ark Fuel Vault',
    [{ kind: 'resource', resource: 'fuel', count: 4 }],
  )),
  createMissionCard('Iron Wake', 'asteroid', 0, ['engine', 'engine'], shipPartFind(
    'Service Drone Bay',
    'service-drone-bay',
  )),
  createMissionCard('Red Salvage', 'asteroid', 0, ['engine', 'engine', 'signal'], visitRewardFind(
    'Fuel Cell Cache',
    [{ kind: 'resource', resource: 'fuel', count: 3 }],
  )),
  createMissionCard('Broken Atlas', 'asteroid', 0, ['signal', 'signal'], visitRewardFind(
    'Atlas Fuel Cache',
    [{ kind: 'resource', resource: 'fuel', count: 2 }],
  )),
  createMissionCard('Gravity Sling', 'deep-space', 0, ['star'], visitRewardFind(
    'Slingshot Fuel Reserve',
    [{ kind: 'resource', resource: 'fuel', count: 1 }],
  )),
  createMissionCard('Cryo Ping', 'deep-space', 0, ['signal'], visitRewardFind(
    'Cryo Wake Beacon',
    [{ kind: 'crew', label: 'Wake', count: 1 }],
  )),
  createMissionCard('Frost Lullaby', 'planet', 0, ['life', 'star'], visitRewardFind(
    'Thaw Ration Cache',
    [
      { kind: 'crew', label: 'Wake', count: 1 },
      { kind: 'resource', resource: 'fuel', count: 1 },
    ],
  )),
  createMissionCard('Vault Nursery', 'asteroid', 0, ['engine', 'life', 'signal'], visitRewardFind(
    'Revival Fuel Locker',
    [
      { kind: 'crew', label: 'Wake', count: 1 },
      { kind: 'resource', resource: 'fuel', count: 2 },
    ],
  )),
  createMissionCard('Sleeping Convoy', 'deep-space', 0, ['star', 'star', 'signal'], visitRewardFind(
    'Crew Ark Pods',
    [{ kind: 'crew', label: 'Wake', count: 2 }],
  )),
  createMissionCard('Amber Hibernaculum', 'planet', 0, ['life', 'life', 'engine', 'signal'], visitRewardFind(
    'Biogel Cryo Reserve',
    [
      { kind: 'crew', label: 'Wake', count: 2 },
      { kind: 'resource', resource: 'fuel', count: 1 },
    ],
  )),
  createMissionCard('Last Dormitory', 'asteroid', 0, ['engine', 'engine', 'life', 'star'], visitRewardFind(
    'Deep Sleep Fuel Cache',
    [
      { kind: 'crew', label: 'Wake', count: 2 },
      { kind: 'resource', resource: 'fuel', count: 2 },
    ],
  )),
  createMissionCard('Quiet Relay', 'planet', 0, ['signal', 'star'], shipPartFind(
    'Adaptive Control Console',
    'adaptive-control-console',
  )),
]
