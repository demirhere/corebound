# Stars

A Star is the only kind of card that fills the journey. There are 36 of them — 12 in each sector deck, mixed across distance bands.

## Star card anatomy

Each Star is self-contained. Fuel cost is shown in the card's Need with the skill icons. Stars have **no penalty** in v2 — engaging a Star is purely opt-in.

```text
NAME
Need: Fuel 0–3 + icons
Reward: icons / tokens
Legacy: ending icon
3+ MOTHER (optional): added cost or modifier
5+ MOTHER (optional): larger cost or changed reward
```

Each card is one short read. If a Star has no `MOTHER` line, it never gets harder regardless of how dirty the run is. That makes the cards that *do* have threshold lines feel pointed.

## Examples

```text
DUST GARDEN
Need: Fuel 0 + Life + Star
Reward: Fuel +1
Legacy: Life

3+ MOTHER:
Also commit +1 crew.
```

```text
KEPLER NURSERY
Need: Fuel 2 + Life + Life + Engine
Reward: Wake 1 crew
Legacy: People

3+ MOTHER:
Also commit +1 crew.

5+ MOTHER:
Reward becomes Wake 1 crew (no Heal echo).
```

```text
BLACK RELAY
Need: Fuel 1 + Signal + Signal + Star
Reward: Scout the next 3 stars; keep 1
Legacy: Memory

3+ MOTHER:
Scout 2 instead of 3.
```

## Distance bands

The label is descriptive; the cost is what matters.

| Distance | Travel cost |
|---|---:|
| Near | 0 Fuel |
| Far | 1 Fuel |
| Deep | 2 Fuel |
| Abyssal | 3 Fuel |

Because Fuel is shown on the card, a powerful Star can show up cheap (a tempting freebie) and a weak Star can show up expensive (skip it). Each Horizon scan asks the same question: *of the three, which one is worth the fuel, the crew, and the MOTHER risk?*

## Reward types

| Reward | Effect |
|---|---|
| Hull +N | Repair the ark. |
| Fuel +N | Refuel. |
| Parts +N | Gain build material for Chambers. |
| Wake N crew | Move one crew from Cryo into the awake pool, ready next sector. |
| Heal 1 crew | Flip one wounded crew back to healthy. |
| Scout | Look at the next 3 Stars in the current deck; keep 1 on top, discard 2. |
| Free Star | The next Star this sector costs 0 Fuel regardless of its Fuel cost. |

## Skipping

There is no penalty type. If you don't want to engage a Star, simply don't click its **Travel here** button. Pick another Horizon Star, install a Chamber, or Reroute. The Horizon will move on once you've travelled to a Star (or rerouted past it).

## Threshold-line vocabulary

| Effect | Meaning |
|---|---|
| Also commit +N crew | At least N additional human crew must be highlighted (MOTHER cannot satisfy this). |
| Travel +N Fuel | Travel cost rises. |
| Scout N instead | Scout reveals fewer stars. |
| Add icon X to Need | Need grows by one printed icon. |
| Reward becomes X | Reward changes (often less generous, more Machine-leaning). |

## Difficulty by sector

| Sector | Star icon need | Travel mix |
|---|---:|---|
| Sector 1 | 2–3 | 5 Near, 4 Far, 3 Deep |
| Sector 2 | 3–4 | 3 Near, 5 Far, 3 Deep, 1 Abyssal |
| Sector 3 | 4–5 | 2 Near, 4 Far, 4 Deep, 2 Abyssal |

## Legacy stamps

Every Star carries one of: **Life, People, Memory, Machine, Wild.** Visited Stars record Legacy stamps internally; those stamps determine your ending and the Arrival reductions.

Next: [Gates](gates.md).
