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
    'No current effect while round-end steps are disabled.',
    'No current trigger',
    false,
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
    'No current effect while round-end steps are disabled.',
    'No current trigger',
    false,
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
    'You can draft 2 missions at a time.',
    'Each sector start',
  ),
  createDamageCard(
    'Drift Loop',
    'drift-loop',
    'No current effect while round-end Drift is disabled.',
    'No current trigger',
    false,
  ),
  createDamageCard(
    'Long Reach',
    'long-reach',
    'The 3rd Mission in a sector requires +1 crew icon.',
    'At each Mission attempt',
  ),
]
