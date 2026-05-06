import { createDamageCard } from './factories'

export const damageDeck = [
  createDamageCard(
    'Fractured Engine',
    'fractured-engine',
    'Engine Missions require +1 Engine icon.',
    'At each Mission attempt',
    false,
  ),
  createDamageCard(
    'Frozen Sector',
    'frozen-sector',
    'No Tired-to-Ready trickle at round end.',
    'Each round end',
  ),
  createDamageCard(
    'Comm Failure',
    'comm-failure',
    'Each MOTHER use costs +1 Fuel.',
    'When MOTHER is spent',
  ),
  createDamageCard(
    'Sensor Loss',
    'sensor-loss',
    'Cannot peek anything.',
    'Always',
  ),
  createDamageCard(
    'Hull Crack',
    'hull-crack',
    '+1 Stress at each round end.',
    'Each round end',
  ),
  createDamageCard(
    'Crew Quarters Damaged',
    'crew-quarters-damaged',
    'Discovery hand limit -1.',
    'Always',
    false,
  ),
  createDamageCard(
    'Sealed Cargo',
    'sealed-cargo',
    'First Mission per sector gives no Discovery.',
    'Each sector',
  ),
  createDamageCard(
    'Stress Echo',
    'stress-echo',
    'Each MOTHER spend adds 1 extra Stress.',
    'When MOTHER is spent',
  ),
  createDamageCard(
    'Phantom Course',
    'phantom-course',
    'Missions reveal 2 cards instead of 3.',
    'Each sector start',
  ),
  createDamageCard(
    'Drift Loop',
    'drift-loop',
    'Drift flips happen 2x per round end.',
    'Each round end',
  ),
  createDamageCard(
    'Long Reach',
    'long-reach',
    'The 3rd Mission in a sector requires +1 crew icon.',
    'At each Mission attempt',
  ),
]
