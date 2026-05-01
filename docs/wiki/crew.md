# Crew

Crew are named people with two skill icons. They have no passive powers and no paragraph text. They matter because they cover icons, become Tired, can be Wounded, and create each player's claim to leadership.

Each crew card belongs to one player and is called that player's loyal crew. Cryo crew are unowned until recruited.

## Skill Icons

Only four skill icons exist.

| Icon | Meaning |
|---|---|
| Engine | Repair, structure, reactors. |
| Star | Navigation, piloting, routes. |
| Life | Medicine, food, biology, cryo. |
| Signal | Science, memory, strange phenomena. |

## Crew States

| State | Description |
|---|---|
| Ready | Available to commit. Healthy Ready crew contribute 2 icons. |
| Tired | Already worked this sector. Cannot be committed again until after the Gate. |
| Wounded | Contributes only the first icon. Stays Wounded until healed. |
| Cryo | Unowned sleeper in the Cryo deck. |

Wounded crew can still become Tired after committing. Tired clears after each passed Gate. Wounded does not clear unless healed.

## Setup Draft

Recommended first implementation target: 3 players.

### 2 Players

```text
Reveal 6 crew.
Players snake draft until each has 3 loyal crew.
Remaining crew go to Cryo.
```

### 3 Players

```text
Reveal 6 crew.
Players snake draft until each has 2 loyal crew.
Remaining crew go to Cryo.
```

### 4 Players

The current 12-card crew roster is not recommended for 4 players. Either add at least 4 more crew cards or restrict the first multiplayer implementation to 2-3 players.

The solo prototype assigns the six starting awake crew to one solo player and puts the other six crew in Cryo.

## Specialisation

Specialisation is icon-based, not text-based. Every crew has exactly two healthy icons and one wounded icon.

| Type | Pattern | Example |
|---|---|---|
| Specialist | Two matching icons | Mara Voss - Engine + Engine |
| Generalist | Two different icons | Tomas Hale - Engine + Life |
| Rare hybrid | Unusual two-icon mix | Nia Okonkwo - Signal + Star |

When a crew is Wounded, they keep only the first listed icon.

```text
MARA VOSS
Healthy: Engine + Engine
Wounded: Engine
```

## Roster

The base 12 crew.

```text
MARA VOSS - Engine + Engine
ILYA RAO - Star + Signal
SANA IQBAL - Life + Life
NIA OKONKWO - Signal + Star
TOMAS HALE - Engine + Life
ELISE TAN - Life + Signal
JUNO PIKE - Engine + Star
OREN VALE - Signal + Signal
ADA CHEN - Engine + Signal
MALIK ORTEGA - Star + Star
PRIYA SHAH - Life + Engine
LEI WATANABE - Life + Star
```

## Why The Design Is Built Around Them

Crew are the action economy and the win condition. Spending a crew on a Star means that crew is unavailable for the Gate. Waking or drafting crew from Cryo grows one player's loyal base, which can create rivalry even when the ship needs cooperation.

MOTHER thresholds explicitly attack this economy: at 3+ used MOTHER cards, many cards say *also commit +1 crew*. MOTHER cannot satisfy that.

Next: [Ship Board](ship-board.md).
