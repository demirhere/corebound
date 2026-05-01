# Sectors And Cycle

A full game is three sectors. Each sector is 3 Stars, then a Gate. The third Gate is the Final Gate.

```text
Sector 1 -> 3 Stars -> Gate 1 -> Gate Draft
Sector 2 -> 3 Stars -> Gate 2 -> Gate Draft
Sector 3 -> 3 Stars -> Final Gate
Game ends -> count loyal crew
```

Each sector has one shuffled Star deck. All travel distances are mixed inside that one deck.

## Setup Per Sector

```text
[ Sector Deck ]   [ MOTHER Deck ]   [ Cryo Deck ]
[ Horizon Deck ]  [ Sector Card / Gate ]  [ Sector Discard ]

[ Horizon Slot 1 ]   [ Horizon Slot 2 ]   [ Horizon Slot 3 ]
```

The three Horizon slots begin empty. Click the Sector Deck to reveal the next sector card and Gate; that sector's Horizon Deck then becomes available. The Cryo Deck is visible as a deck/count.

## Each Sector Turn

### 1. Reveal The Horizon

Click the Horizon Deck to draw three Stars from the current sector deck. Each card shows its Fuel cost inside its Need.

Star cards always show printed Fuel. If a reward or Chamber changes payment, put a token or ready/used marker in an Active Effects area beside the board instead of changing the card.

```text
HORIZON

[ Star A ]   [ Star B ]   [ Star C ]
 Fuel 0       Fuel 1       Fuel 2
```

### 2. Make A Proposal

On the active player's turn, choose one visible legal card:

```text
One Horizon Star
One damaged Chamber
The active Gate, if three Stars have been completed
```

The active player may propose the card before any crew are committed. Players may then contribute Ready loyal crew or pass. MOTHER may be added only if at least one human crew is committed.

### 3. Resolve Or Dissolve

A proposal resolves if:

```text
Resources are sufficient: Fuel for Stars, Parts for Chambers.
Committed crew plus used MOTHER cover all required icons.
At least one human crew is committed.
All active threshold rules are satisfied.
```

If the proposal resolves, committed crew become Tired, used MOTHER cards are spent, and the card effect happens. If the proposal does not resolve, it dissolves and nothing is spent.

### 4. Reroute Only If Stuck

If all three Horizon Stars cost more Fuel than the ship has and nothing else helps, the active player may Reroute: discard all three, use 1 MOTHER card, and reveal three new Stars. With no MOTHER card left, the ship is Stranded in the Reach.

## Gates

After three Stars, the Gate becomes the active card. Only Ready crew can be committed.

If MOTHER is at 5+ used cards, the Gate's Need grows by +1 icon.

If the Gate proposal resolves, the ship passes the Gate. If the available crew and MOTHER cards cannot cover the Gate at all, the ship fails.

After Gate 1 and Gate 2, all Tired crew refresh, Wounded crew stay Wounded, and a Gate Draft recruits from Cryo. After the Final Gate, count loyal crew and determine the winner.

## Why Each Crew Can Only Work Once Per Sector

This is the main timing pressure. Spend a high-icon crew on a Star and they are not there for the Gate. Pour them into a Chamber and they are not there for either. That is the strategy.

Next: [Prototype Components](prototype.md).
