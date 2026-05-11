import { createCrewCard } from './factories'

export const startingCrewCards = [
  createCrewCard('Lei Watanabe', ['life', 'star'], 2),
  createCrewCard('Mara Voss', ['engine', 'engine'], 14),
  createCrewCard('Ada Chen', ['engine', 'signal'], 5),
  createCrewCard('Sana Iqbal', ['life', 'life'], 7),
  createCrewCard('Nia Okonkwo', ['signal', 'star'], 10),
]

// Cryo deck — 40 cards across 10 unique blueprints with per-template
// copy counts chosen so the entire 45-card roster (5 starters + 40 cryo)
// is exactly icon-balanced at 16 each (E=16, L=16, N/star=16, S/signal=16).
//
// Most templates ship 4 copies; Juno/Priya are bumped to 5× and
// Oren/Malik dropped to 3× to neutralize the starter's E/L bias against
// the matched-specialist N/S over-weighting from a uniform 4× cryo.
//
// Singles still outnumber doubles in cryo (26 vs 14). Singles cannot
// satisfy Specialist / Cross-Trained / Department Heads / Bridge Crew
// (those patterns require length-2 specializations) — they only
// contribute to shared-icon patterns (Common Ground / Knowledge /
// Cause). The 4 matched specialists (Mara, Sana from starters + Oren,
// Malik from cryo) keep Bridge Crew reachable.
const cryoCrewTemplateCopies: { blueprint: ReturnType<typeof createCrewCard>, copies: number }[] = [
  { blueprint: createCrewCard('Juno Pike',     ['engine'],          4), copies: 5 },
  { blueprint: createCrewCard('Priya Shah',    ['life'],           12), copies: 5 },
  { blueprint: createCrewCard('Ilya Rao',      ['star'],            6), copies: 4 },
  { blueprint: createCrewCard('Kade Solis',    ['star'],            0), copies: 4 },
  { blueprint: createCrewCard('Beni Akpan',    ['signal'],          3), copies: 4 },
  { blueprint: createCrewCard('Vera Kross',    ['signal'],          9), copies: 4 },
  { blueprint: createCrewCard('Calla Reyes',   ['engine', 'life'], 14), copies: 4 },
  { blueprint: createCrewCard('Davin Mori',    ['engine', 'life'],  5), copies: 4 },
  { blueprint: createCrewCard('Oren Vale',     ['signal', 'signal'], 13), copies: 3 },
  { blueprint: createCrewCard('Malik Ortega',  ['star', 'star'],   15), copies: 3 },
]

export const cryoCrewDeck = cryoCrewTemplateCopies.flatMap(
  ({ blueprint, copies }) => Array.from({ length: copies }, () => blueprint),
)
