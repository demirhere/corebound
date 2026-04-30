# MOTHER

MOTHER is the ark's navigation AI. She does not have her own card text and she is never a separate phase. She is **six MOTHER cards** in a deck. Spent cards are tracked by the MOTHER band.

## What MOTHER does

When you commit crew to a Star, a Gate, a Chamber Build, or an Arrival and you are short on icons, you may click the MOTHER Deck to draw one or more temporary MOTHER cards into your crew hand. Each highlighted MOTHER card supplies one wild icon.

> **When the action resolves, every highlighted MOTHER card is spent and increases the MOTHER used count.** Before resolving, you may click a temporary MOTHER card in your hand to return it to the deck. Used MOTHER cards never return (except via MOTHER Liaison Core).

## What MOTHER can and cannot do

```text
A highlighted MOTHER card adds 1 wild icon. MOTHER can:
- supply missing skill icons on a Star, Gate, Arrival, or Chamber Build
- complete a card after at least one human has been highlighted

MOTHER cannot:
- count as a crew card (any "+N crew" rule is human only)
- pay Fuel
- pay Parts
- prevent wounds (unless a Chamber explicitly says so)
- satisfy "also commit +N crew" threshold lines
- create a Human Command ending (which only exists at 0–2 used cards)
```

The single rule that gives MOTHER teeth:

> MOTHER may only help if at least one human crew was highlighted.

This preserves the design soul: humans must begin the work; MOTHER finishes it. MOTHER cannot solve a card on her own. She also cannot create work — she only fills gaps.

## The three bands

The band is determined by spent MOTHER cards.

```text
MOTHER Deck   →   spent 0-2: Clear Route
                 spent 3-4: Bent Route
                 spent 5-6: Hostile Route
                 need 7th: MOTHER Takes the Wheel — loss
```

Each band is a global state. The same cards in the deck behave differently depending on which band you sit in. The band is determined by **how many MOTHER cards have been spent**:

| Used cards | Band | Band effect |
|---:|---|---|
| 0–2 | Clear Route | none |
| 3–4 | Bent Route | `3+ MOTHER` lines on cards activate |
| 5–6 | Hostile Route | `3+` and `5+ MOTHER` lines active; **Gates need +1 icon** |
| 7th needed | MOTHER Takes the Wheel | loss |

## Why threshold lines work

Threshold lines on cards make MOTHER's earlier shortcuts produce future *human* pressure, instead of an abstract corruption modifier. The vocabulary is small:

| Threshold | Meaning |
|---|---|
| Also commit +N crew | A purely human cost. MOTHER cannot pay this. |
| Travel +N Fuel | A real route cost. MOTHER cannot pay this. |
| Add icon X | Need grows by one printed icon — solvable, but tighter. |
| Reward becomes X | Reward is redirected, often more Machine-leaning. |
| Scout N instead | Information shrinks. |

The thesis:

> The more MOTHER performs miracles, the more human presence is required to keep the journey legitimate.

## Cost levels

| Used cards | Ending tone |
|---:|---|
| 0–2 | Human Command |
| 3–4 | Shared Future |
| 5–6 | MOTHER Ascendant |
| 7 | Loss: MOTHER Takes the Wheel |

That is the entire MOTHER track. There is no Autonomy number, no Corruption deck, no override card type.

## Strategic shape

MOTHER is tempting because she always works (until she doesn't). The cost is two-fold: the card stays in the area forever, *and* the band may shift, waking up extra demands on later cards.

The game's defining choice becomes:

- Early game: "Use MOTHER? It only adds one card to the area."
- Mid game: "If we use MOTHER, we hit 3 cards and all the 3+ lines wake up."
- Late game: "If we use MOTHER, Gates get harder and the ending may no longer be human."

Next: [Chambers](chambers.md).
