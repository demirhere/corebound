# Gates

Each sector ends with a Gate. There are 6 Gate cards (2 per sector pool, one drawn when the sector card is manually revealed). The table sees the Gate before they choose any Stars in that sector, so they know what to save crew for.

Gates are hard pass/fail checks. If the crew and MOTHER cards still available after three Stars cannot cover the Gate's Need, the voyage fails immediately.

## Gate card anatomy

```text
NAME
Gate
Need: icons (one more than a hard Star)
```

The `5+ MOTHER` Gate modifier is a global rule, not card text — it applies to every Gate when the band is Hostile Route.

## Examples

```text
LONG JUMP
Gate
Need: Star + Star + Engine + Signal
```

```text
RADIATION BELT
Gate
Need: Engine + Engine + Life + Signal
```

```text
GRAVITY WELL
Gate
Need: Star + Star + Star + Engine + Engine + Signal
```

## How a Gate is attempted

After three Star visits, the Gate becomes the active card.

1. Highlight only crew still **Ready** (not tapped from this sector).
2. Highlight MOTHER cards if you need wild icons.
3. **Hostile Route bonus:** if 5+ MOTHER cards are in the area, the Gate's Need grows by `+1 any icon`.
4. If highlighted icons cover the Need, click **Attempt Gate** to pass and advance.
5. If the available crew and MOTHER cards cannot cover the Need at all, the game ends in failure. There is no force-fail path.
6. After a passed Gate, all crew refresh. Wounded crew stay wounded.

## Why Gates are the spine of the design

Every sector's strategic question is the same:

> Do we spend our best crew on the attractive Stars now, save them for the Gate, or invest them in a Chamber?

That triple tension replaces Ordeals, Core Pressure, red lines, and Corruption decks from the older design.

The Hostile Route modifier means that the same Gate becomes harder when MOTHER has been used a lot — without changing the printed card text. This rewards bands that the table can already see.

Next: [Arrivals](arrivals.md).
