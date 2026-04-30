# Crew

Crew are named people with two skill icons. They have no passive powers and no paragraph text. They are valuable because of what they can do this sector and because they can be wounded or lost.

## Skill icons

Only four icons exist.

| Icon | Meaning |
|---|---|
| Engine | Repair, structure, reactors. |
| Star | Navigation, piloting, routes. |
| Life | Medicine, food, biology, cryo. |
| Signal | Science, memory, strange phenomena. |

## Crew states

| State | Description |
|---|---|
| Ready | Available to commit. |
| Tired | Already spent this sector. Refreshes after the Gate. |
| Wounded | Flipped to wounded side. Contributes 1 icon instead of 2. Heals only with a Star or Chamber reward. |
| Cryo | In the cryo deck. A `Wake` reward brings one into the awake pool. |

A crew is in exactly one state at a time. There is no ongoing assignment between Stars.

## Specialisation

Specialisation is icon-based, not text-based. Every crew has exactly two icons and a wounded-side single icon — nothing else.

| Type | Pattern | Example |
|---|---|---|
| Specialist | Two matching icons | Mara Voss — Engine + Engine |
| Generalist | Two different icons | Tomas Hale — Engine + Life |
| Rare hybrid | Unusual two-icon mix | Nia Okonkwo — Star + Signal |

A specialist is explosive on cards that demand a lot of one icon, but narrow. A generalist solves more two-icon Stars alone but contributes less to icon-heavy cards. A rare hybrid is the only way to bridge an awkward Need.

When a crew is wounded, they flip to a single-icon side. The first listed icon is the one they keep.

```text
MARA VOSS
Healthy: Engine + Engine
Wounded: Engine
```

## Roster

The base 12 crew. Six start awake; six start in cryo.

```text
MARA VOSS — Engine + Engine
ILYA RAO — Star + Signal
SANA IQBAL — Life + Life
NIA OKONKWO — Signal + Star
TOMAS HALE — Engine + Life
ELISE TAN — Life + Signal
JUNO PIKE — Engine + Star
OREN VALE — Signal + Signal
ADA CHEN — Engine + Signal
MALIK ORTEGA — Star + Star
PRIYA SHAH — Life + Engine
LEI WATANABE — Life + Star
```

## Why the design is built around them

Crew are the action economy. The whole game is "stack crew on a card to cover its icons". Spending one is a small irreversible decision; losing one is a real one. Pressure comes from running out of icons, not from a column on a spreadsheet.

The MOTHER bands explicitly attack this economy: at 3+ used MOTHER cards, many cards say *also commit +1 crew*. MOTHER cannot satisfy that. The more MOTHER has done, the more your humans are demanded.

Next: [Ship Board](ship-board.md).
