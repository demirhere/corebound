# Stars

A Star is the main journey card. There are 36 Stars: 12 in each sector deck, mixed across distance bands.

Stars are opt-in. They have Fuel cost, icon Need, reward, and optional MOTHER threshold lines.

## Star Card Anatomy

```text
NAME
Need: Fuel 0-3 + icons
Reward: ship reward or Wake reward
3+ ✶ (optional): added cost or modifier
5+ ✶ (optional): larger cost or changed reward
```

Each card is one short read. If a Star has no MOTHER line, it never gets harder regardless of how dirty the route is.

## Examples

```text
DUST GARDEN
Need: Fuel 0 + Life + Star
Reward: Fuel +1

3+ ✶:
Also commit +1 crew.
```

```text
KEPLER NURSERY
Need: Fuel 2 + Life + Life + Engine
Reward: Wake 1 crew

3+ ✶:
Also commit +1 crew.

5+ ✶:
Reward becomes Wake 1 crew only.
```

```text
BLACK RELAY
Need: Fuel 1 + Signal + Signal + Star
Reward: Scout the next 3 Stars; keep 1

3+ ✶:
Scout 2 instead of 3.
```

```text
GRAVITY SLING
Need: Fuel 2 + Star + Engine
Reward: The next Star you complete this sector costs -1 Fuel.
```

## Distance Bands

The label is descriptive; the Fuel cost is what matters.

| Distance | Travel cost |
|---|---:|
| Near | 0 Fuel |
| Far | 1 Fuel |
| Deep | 2 Fuel |
| Abyssal | 3 Fuel |

Because base Fuel is shown on the card, each Horizon scan asks: of the three, which one is worth the Fuel, crew, negotiation, and MOTHER risk?

Temporary effects do not rewrite the Star deck. Fuel discount markers and armed Chamber bonuses stay as active cards or installed Chamber markers on the common board.

## Reward Types

| Reward | Effect |
|---|---|
| Hull +N | Repair the ark. |
| Fuel +N | Refuel. |
| Parts +N | Gain build material for Chambers. |
| Wake N crew | The Implementer recruits loyal crew from Cryo. |
| Heal N crew | Flip Wounded loyal crew back to healthy. |
| Scout | Look at the next 3 Stars in the current deck; keep 1 on top, discard 2. |
| Next Star Fuel -N | The next Star completed this sector costs N less Fuel. |

## Wake Rewards

Wake rewards are personal.

```text
Crew icon: Choose 1 of 2.
That crew joins your crew area Tired.
```

Return unchosen Cryo crew to the bottom of Cryo. If only 1 crew remains in Cryo, reveal and recruit that crew. If Cryo is empty, Wake does nothing.

## Skipping

There is no penalty type. If you do not want to engage a Star, do not stack resources on it. Pick another Horizon Star, repair a Chamber, save crew for the Gate, or Reroute if every Horizon Star is unaffordable.

## Threshold-Line Vocabulary

| Effect | Meaning |
|---|---|
| Also commit +N crew | At least N additional human crew must be committed. MOTHER cannot satisfy this. |
| Travel +N Fuel | Travel cost rises. MOTHER cannot pay Fuel. |
| Add icon X to Need | Need grows by one printed icon. |
| Reward becomes X | Reward changes, often becoming less generous. |
| Scout N instead | Information shrinks. |

## Difficulty By Sector

| Sector | Star icon need | Travel mix |
|---|---:|---|
| Sector 1 | 2-3 | 5 Near, 4 Far, 3 Deep |
| Sector 2 | 3-4 | 3 Near, 5 Far, 3 Deep, 1 Abyssal |
| Sector 3 | 4-5 | 2 Near, 4 Far, 4 Deep, 2 Abyssal |

Next: [Gates](gates.md).
