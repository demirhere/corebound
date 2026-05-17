import type { CardBlueprint } from './types'

// Generic Crew Quarters Upgrade card.
//
// A single card type — the player decides which exact crew-count composition
// to upgrade by stacking 1-4 crew on the card and triggering the completion
// action. Replaces the legacy per-pattern catalog (Training Bay / Bridge
// Bunks / …) and the 3-card pack flow. Every upgrade grants +1 Fuel on every
// future play of the chosen pattern, up to
// CREW_QUARTERS_MAX_UPGRADES_PER_PATTERN stacks per pattern — beyond that
// the exact stack shows a disabled limit action, so the player must pivot to
// another composition (forcing strategic diversification away from auto-fire
// patterns like Common Ground).
//
// Mirrored in `scripts/simulate.mjs`. Update both in lockstep.
export const CREW_QUARTERS_UPGRADE_COST = 4
export const CREW_QUARTERS_UPGRADE_FUEL_PER_PLAY = 1
// Per-pattern cap on stacked upgrades. Sim sweep showed:
//   - cap = ∞ (old design): mono-Common-Ground wins 35% of runs (auto-fires
//     in ~100% of hands, so each +1/play upgrade is unbeatable ROI).
//   - cap = 3 (this value):  mono-Common-Ground wins 13% of runs — still the
//     best single strategy but no longer dominates. Mixed-greedy stays at
//     the 1.5–2.5% target, and Common Knowledge / broad-cheap stay viable.
//   - cap = 2: tighter (mono-CG ~5%) but pushes mixed-greedy below 1%.
// See TUNING NOTES in scripts/simulate.mjs for full sweep data.
export const CREW_QUARTERS_MAX_UPGRADES_PER_PATTERN = 3
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
