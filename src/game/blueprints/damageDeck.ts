import { createDamageCard } from './factories'

export const damageDeck = [
  createDamageCard(
    'Fractured Engine',
    'fractured-engine',
    'Mission Engine costs +1 Fuel.',
    'At each Mission attempt',
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
    'Mission Lead Injured',
    'mission-lead-injured',
    'Mission Lead may not commit a 4th crew per turn.',
    'Each turn',
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
    'Sector Stops reveals 2 Missions instead of 3.',
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
    'All Mission Fuel costs +1.',
    'At each Mission attempt',
  ),
]
