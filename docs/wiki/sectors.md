# Sectors and Cycle

A full game is three sectors, then the Final Approach. Each sector is **3 Stars then a Gate.**

```text
Sector 1   ->  3 Stars  ->  Gate 1
Sector 2   ->  3 Stars  ->  Gate 2
Sector 3   ->  3 Stars  ->  Gate 3
                        ->  Final Approach (draw 3 Arrivals)
```

Each sector has **one shuffled Star deck**. All travel distances (Near, Far, Deep, Abyssal) are mixed inside that one deck.

## Setup per sector

```text
[ Sector Deck ]   [ MOTHER Deck ]   [ Cryo Deck ]
[ Horizon Deck ]  [ Sector Card / Gate ]  [ Sector Discard ]

[ Horizon Slot 1 ]   [ Horizon Slot 2 ]   [ Horizon Slot 3 ]
```

The three Horizon slots begin empty. Click the Sector Deck to reveal the next sector card/Gate; that sector's Horizon Deck then becomes available. The Cryo Deck is visible as a deck/count, but `Wake` rewards draw from it automatically.

## Each turn, in order

### 1. Reveal the Horizon

Click the Horizon Deck to draw three Stars from the current sector deck. Each card shows its Fuel cost inside its Need.

```text
HORIZON

[ Star A ]   [ Star B ]   [ Star C ]
 Fuel 0       Fuel 1       Fuel 2
```

### 2. Highlight crew (and MOTHER cards)

Click crew tiles to highlight the icons you intend to commit. Click the MOTHER Deck to draw a temporary wild card into your crew hand. Click that MOTHER card again to return it before acting.

If a `3+ MOTHER` line on a Star says *also commit +N crew*, you must highlight at least N **additional** human crew. MOTHER cannot satisfy this.

### 3. Click an action button

Each Horizon Star carries its own **Travel here** button. Each Chamber in the market carries its own **Install** button. The button is enabled iff:

- Resources are sufficient (Fuel for Travel, Parts for Install).
- Highlighted crew + MOTHER icons cover the Need.
- At least one human is highlighted (if MOTHER is being used).
- All threshold rules are satisfied.

Click an enabled button. The action resolves immediately. Visited Stars record their Legacy stamp internally; Chambers install permanently. Crew become Tired. Highlighted MOTHER cards are spent. After a Star, the Horizon is empty until the Horizon Deck is clicked again.

### 4. Reroute (only if stuck)

If all three Stars cost more Fuel than you have AND nothing else helps, you may **Reroute**: discard all three, use 1 MOTHER card, and reveal three new Stars. With no MOTHER cards left, the run is **Stranded in the Reach**.

## The Gate, in order

After three Stars, the Gate becomes the active card. Only crew still Ready can be highlighted.

If MOTHER is at 5+ used cards (Hostile Route), the Gate's Need grows by `+1 any icon`.

If highlighted icons cover the Need, click **Attempt Gate**. If the available crew and MOTHER cards cannot cover the Gate at all, the voyage fails immediately.

After the Gate, all crew refresh; wounded crew stay wounded.

## Why each crew can only work once per sector

This is the only timing pressure in the game. Spend a high-icon crew on a Star and they are not there for the Gate. Pour them into a Chamber and they are not there for either. That is the strategy.

Next: [Endings](endings.md).
