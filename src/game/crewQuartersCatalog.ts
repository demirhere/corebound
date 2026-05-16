import type { CardBlueprint } from './types'

// Generic Crew Quarters Upgrade card.
//
// A single card type — the player decides which composition (mission pattern)
// to upgrade by stacking 1-4 crew on the card and triggering the completion
// action. Replaces the legacy per-pattern catalog (Training Bay / Bridge
// Bunks / …) and the 3-card pack flow. Every upgrade grants +1 Fuel on every
// future play of the chosen pattern; cards can be acquired any number of
// times (the same pattern's bonus stacks).
//
// Mirrored in `scripts/simulate.mjs`. Update both in lockstep.
export const CREW_QUARTERS_UPGRADE_COST = 4
export const CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY = 1
// Total CQU "card stock" the run can draw from. The deck sits offscreen and
// only needs to be deep enough to cover the most aggressive spend pattern;
// in practice a winning run takes <15 upgrades, so 40 leaves headroom.
export const CREW_QUARTERS_DECK_SIZE = 40

export function createCrewQuartersUpgradeBlueprint(): CardBlueprint {
  return {
    title: 'Crew Quarters Upgrade',
    icon: 'person',
    // Warm gold accent — distinct from the cool blue ship parts, the teal
    // crew cards, and the open-mission purple. Same "no portrait" silhouette
    // as the Fuel mission card.
    hue: 32,
    accent: '#f5b061',
    kind: 'crew-quarters',
  }
}
