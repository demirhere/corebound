# Chambers

Chambers are public ship upgrades. They do not score. Players repair Chambers because the ship needs them, not because Chambers grant points.

There is no chamber grid, power-online management, or upkeep. A Chamber is repaired once with Parts plus matching crew icons, then it works until the run ends.

## How A Chamber Is Repaired

Three damaged Chambers are visible at all times, drawn from a shuffled Chamber deck.

```text
The active player stacks Parts and crew on a damaged Chamber.
Spend the Chamber's Parts cost if the stack resolves.
Stacked crew cover the Build icons.
Stacked crew become Tired.
Used MOTHER cards are spent.
The Chamber stays online for the rest of the game.
A replacement damaged Chamber appears.
```

You may repair at most 3 Chambers total.

MOTHER may fill missing Build icons under the standard rule. MOTHER cannot pay the Parts cost.

## Card Anatomy

```text
CHAMBER NAME
Build: Parts N + icons
Effect: one permanent rule

3+ ✶ (optional): reduced effect
5+ ✶ (optional): severe restriction
```

## The Base Set

### Drive Cathedral

```text
DRIVE CATHEDRAL
Build: Parts 3 + Engine + Star
Effect: Once per sector, reduce a Star's Travel cost by 1.

3+ ✶:
Only works on Near or Far Stars (Travel 0-1).

5+ ✶:
After using it, exhaust 1 committed crew or use 1 MOTHER card.
```

### Gravity Sails

```text
GRAVITY SAILS
Build: Parts 2 + Star + Signal
Effect: The first Deep+ Star you visit each sector costs -1 Fuel.

3+ ✶:
Only if you commit at least 2 crew to that Star.
```

### Commons Ring

```text
COMMONS RING
Build: Parts 3 + Life + Life
Effect: After completing the first Star each sector, ready 1 Tired crew.

3+ ✶:
Only if no MOTHER cards were used on that Star.
```

### Medical Bay

```text
MEDICAL BAY
Build: Parts 2 + Life + Signal
Effect: Once per sector, prevent 1 wound at a Gate.

3+ ✶:
Prevent the wound, then exhaust that crew.

5+ ✶:
Disabled at 5+ spent MOTHER cards.
```

### Observation Dome

```text
OBSERVATION DOME
Build: Parts 2 + Star + Signal
Effect: Reveal 4 Stars at the Horizon and discard 1; choose from the remaining 3.

3+ ✶:
MOTHER chooses which Star is discarded: lowest Travel.

5+ ✶:
Use 1 MOTHER card to enable this Chamber each sector.
```

### Archive Node

```text
ARCHIVE NODE
Build: Parts 2 + Signal + Signal
Effect: Once per sector, look at the top 2 cards of the current Star deck and reorder them.

3+ ✶:
Look at only 1 card.
```

### Bulkhead Garden

```text
BULKHEAD GARDEN
Build: Parts 2 + Engine + Life
Effect: The first Hull loss each sector is reduced by 1.

3+ ✶:
Only works if you have at least 1 Fuel.
```

### Seed Vault

```text
SEED VAULT
Build: Parts 3 + Life + Signal

Effect:
During each Gate Draft, reveal +1 extra crew from Cryo before drafting.

3+ ✶:
The extra revealed crew enters the draft Wounded if chosen.

5+ ✶:
Seed Vault does not affect Gate Drafts.
```

### MOTHER Liaison Core

```text
MOTHER LIAISON CORE
Build: Parts 2 + Signal + Engine

Effect:
The first 1-icon MOTHER use each sector returns the card to the MOTHER Deck instead of spending it.

3+ ✶:
Instead, the first MOTHER use each sector reduces spent MOTHER by 1.

5+ ✶:
Disabled during Gates.
```

## Why This Works

Chambers add a long-term strategy axis without bloating the resource model. Players have three competing uses for crew:

```text
1. Complete Stars.
2. Save crew for Gates.
3. Spend crew to repair Chambers.
```

And three competing uses for resources:

```text
1. Spend Fuel to reach better Stars.
2. Gain Parts to repair Chambers.
3. Use MOTHER cards to bridge what crew cannot cover.
```

A normal game should let players repair:

| Run shape | Chambers expected |
|---|---:|
| Conservative | 1 |
| Most successful runs | 2 |
| Heavy ship-investment runs | 3 |

Next: [Sectors and Cycle](sectors.md).
