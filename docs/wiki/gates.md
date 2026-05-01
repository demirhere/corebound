# Gates

Each sector ends with a Gate. There are 6 Gate cards: 2 per sector pool, one drawn when the sector card is revealed. The table sees the Gate before choosing Stars in that sector, so players know what to save crew for.

Gates are hard pass/fail checks. If the available crew and MOTHER cards cannot cover the Gate's Need after three Stars, all players lose.

Sector 3's Gate is the Final Gate. Passing it ends the game and triggers the loyal crew count.

## Gate Card Anatomy

```text
NAME
Gate
Need: icons
```

The `5+ ✶` Gate modifier is a global rule, not card text. It applies to every Gate when 5 or more MOTHER cards have been spent.

## Recommended Difficulty

| Gate | Icon need |
|---|---:|
| Gate 1 | 4 |
| Gate 2 | 5 |
| Final Gate | 7 |

At 5+ spent MOTHER cards, every Gate needs +1 icon.

## Examples

```text
LONG JUMP
Gate 1
Need: Star + Star + Engine + Signal
```

```text
KUIPER STORM
Gate 2
Need: Engine + Engine + Star + Star + Signal
```

```text
GRAVITY WELL
Final Gate
Need: Star + Star + Star + Engine + Engine + Signal + Life
```

## How A Gate Is Attempted

After three Star visits, the Gate becomes the active card.

1. The active player stacks at least one Ready loyal crew on the Gate.
2. Other players may stack Ready loyal crew or pass.
3. MOTHER cards may fill missing icons only if at least one human crew is stacked.
4. If 5 or more MOTHER cards have been spent, the Gate's Need grows by +1 icon.
5. If the stack is ready, resolve it and pass the Gate.
6. If the Gate cannot be covered at all, the ship fails.
7. After a passed Gate, all Tired crew refresh. Wounded crew stay Wounded.

## Gate Drafts

After Gate 1 and Gate 2, run a Gate Draft. Do not run a Gate Draft after the Final Gate.

```text
Reveal one crew per player from Cryo.
Players draft one crew each.
Draft order starts with the player who has the fewest loyal crew.
Ties go clockwise from the Gate Implementer's left.
Drafted crew enter Ready for the next sector.
```

Gate Drafts keep trailing players relevant, make Gates important, and prevent Wake rewards from being the only way to gain crew.

## Why Gates Are The Spine

Every sector's strategic question is the same:

> Do we spend our best crew on attractive Stars now, save them for the Gate, or invest them in a Chamber?

Next: [MOTHER](mother.md).
