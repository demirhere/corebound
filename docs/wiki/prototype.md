# Prototype Components

| Component | Count |
|---|---:|
| Crew cards | 12 |
| Star cards | 36 (12 per sector deck) |
| Gate cards | 6 (2 per sector pool) |
| Chamber cards | 9 (3 damaged Chambers visible, refilled when one is repaired) |
| MOTHER cards | 6 (each is a wild icon) |
| Ship board | 1 |
| MOTHER deck | 1 |
| Fuel tokens | 10 |
| Parts tokens | 8 |
| Hull marker | 1 |

## Sector Difficulty

| Sector | Star icon need | Travel mix | Gate icon need |
|---|---:|---|---:|
| Sector 1 | 2-3 | 5 Near, 4 Far, 3 Deep | 4 |
| Sector 2 | 3-4 | 3 Near, 5 Far, 3 Deep, 1 Abyssal | 5 |
| Sector 3 | 4-5 | 2 Near, 4 Far, 4 Deep, 2 Abyssal | 7 |

At 5+ spent MOTHER cards, every Gate's Need grows by +1 icon.

## Target Play Time

A first playtest game should run 30-45 minutes, including teach.

## Solo Digital Prototype

The browser app at [`index.html`](../../index.html) is still a solo prototype. It uses one solo player so the proposal loop can be tested before full multiplayer UX is added.

Implemented flow:

```text
3 sectors x (3 Stars + 1 Gate)
Gate 3 is the Final Gate
Final Gate success -> count loyal crew
```

Prototype behavior:

- The board starts with an unrevealed Sector Deck. Click it to reveal the sector card and Gate.
- The Horizon starts empty. Click the visible Horizon Deck to draw 3 Stars from the current sector's shuffled Star deck into the center slots.
- Click a visible Star, damaged Chamber, or Gate to propose it. No crew commitment is required to select the proposal.
- The proposed card appears in the Proposal Area with committed crew and MOTHER cards plus resolve/dissolve controls.
- Proposed Horizon and Chamber cards leave dashed placeholders in their original slots until they resolve or dissolve.
- When the sector reaches its Gate, the board stays in place: the Gate moves into the Proposal Area and leaves a dashed placeholder in the Gate slot.
- Committed crew leave dashed placeholders in the crew row and can be returned by clicking their card in the Proposal Area.
- Star cards always show their printed Fuel icons. Temporary discounts, Free Star rewards, and armed Chamber bonuses are shown in Active Effects beside the board, like physical tokens or ready/used markers.
- The MOTHER Deck sits with the other decks. Click it to draw a temporary wild card into the crew row; click that temporary card again to return it before resolving.
- Resolving a proposal spends required Fuel or Parts, makes committed crew Tired, spends used MOTHER cards, and applies the reward.
- Dissolving a proposal returns pledged crew and temporary MOTHER cards without spending anything.
- Wake rewards reveal up to 2 Cryo crew; the Implementer recruits 1 loyal crew, and the recruit enters Tired.
- After Gate 1 and Gate 2, a Gate Draft reveals Cryo crew and recruits for the next sector. In the solo prototype this is a one-player draft.
- If all three Horizon Stars are unaffordable, Reroute discards them, uses 1 MOTHER card, and redraws. With no MOTHER card left, the ship is Stranded in the Reach.
- MOTHER threshold lines on Stars activate by spent-card count: `3+ ✶` at 3+ spent cards, `5+ ✶` at 5+ spent cards.
- At 5 or more spent MOTHER cards, Gates need +1 icon.
- Gates must be passed. If the available crew and MOTHER cards cannot cover the Gate after three Stars, the run fails immediately.
- Wounded crew contribute 1 icon; Heal rewards restore them.
- The Crew row shows awake loyal crew. The Cryo Deck is visible as a deck/count.
- The final screen shows whether the ship survived, loyal crew counts, healthy crew counts, Final Gate contribution, and the winner.

State persists in `localStorage`. `R` resets, `M` toggles the manual.

Next: [Playtest Checklist](playtest-checklist.md).
