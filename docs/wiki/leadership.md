# Leadership And Stacked Actions

COREBOUND is now a semi-cooperative survival race. The ship must survive together, but only one player wins.

The core question is:

> Will I help you save the ship if helping you gives you more loyal crew and makes you more likely to rule after the voyage?

## Win And Loss

All players lose if:

```text
Hull reaches 0.
A 7th MOTHER card would be needed.
The ship becomes stranded with no reachable Star and no available MOTHER reroute.
A Gate cannot be passed.
```

If the ship passes the Final Gate, the player with the most living loyal crew wins.

Tie-breakers:

```text
1. Most living loyal crew.
2. Most healthy loyal crew.
3. Most loyal crew committed to the Final Gate.
4. Player who implemented the Final Gate.
5. Shared victory among tied players only if still tied.
```

## Turn Structure

Each player turn is one temporary stacked action. A failed or unfinished stack never locks the table; cards can be moved away and the next player may try something else.

### 1. Choose A Legal Visible Card

The active player chooses one visible legal card by stacking resources and crew onto it in the common board space.

Legal action targets:

```text
One visible Horizon Star
One damaged Chamber
The active Gate, if the sector has reached its Gate
```

Hidden cards cannot be targeted.

### 2. Commit Loyal Crew

A stack may start incomplete. It cannot resolve until at least one human crew is stacked and the full Need is covered.

Stacked crew are pledged, not Tired yet.

### 3. Other Players May Contribute

In turn order, each other player may stack any number of Ready loyal crew or pass. Players may negotiate freely.

Example negotiation:

```text
"I'll add Engine if I get the Wake reward."
"I won't help if you spend MOTHER."
"I'll help with the Gate, but not this Wake Star."
```

### 4. Add MOTHER If Needed

Any player who has at least one loyal crew in the stack may add MOTHER cards.

MOTHER rules remain:

```text
Each MOTHER card supplies 1 wild icon.
MOTHER cannot pay Fuel.
MOTHER cannot pay Parts.
MOTHER cannot count as a human crew.
MOTHER cannot satisfy "also commit +N crew."
MOTHER may only help if at least one human crew is stacked.
```

### 5. Check Whether The Stack Is Ready

A stack is ready if:

```text
All required icons are covered.
Required Fuel or Parts can be paid.
At least one human crew is stacked.
All active MOTHER threshold rules are satisfied.
```

### 6A. If Ready, Resolve

If the stack is ready:

```text
The player who added the final required human crew becomes the Implementer.
Spend required Fuel or Parts.
Stacked crew become Tired.
Used MOTHER cards are spent.
Resolve the card's effect.
```

### 6B. If Not Ready, Unstack

If the stack is not ready:

```text
Move cards away from the target.
Return pledged crew Ready to their owners if they leave the board.
Return temporary unspent MOTHER cards to the MOTHER Deck.
Spend nothing.
The active player's turn ends.
```

## Implementer

The Implementer is the player who adds the final required human crew that makes the stack ready.

Most ship rewards remain shared. Crew recruitment rewards go to the Implementer.

## Rewards

Shared ship rewards:

```text
Fuel +N
Parts +N
Hull +N
Scout
Next Star Fuel discounts
Chamber effects
```

Personal rewards:

```text
Wake N crew
```

When a player implements a Wake reward:

```text
Crew icon: Choose 1 of 2.
That crew joins your crew area Tired.
```

Return unchosen Cryo crew to the bottom of Cryo. If only 1 crew remains in Cryo, reveal and recruit that crew. If Cryo is empty, Wake does nothing.

## Solo Prototype Note

The browser prototype keeps solo play as the current implementation target. It uses one solo player, so the same stacked action, Implementer, Wake, Gate Draft, and final count rules can be tested without adding full multiplayer seating UI yet.

Next: [Crew](crew.md).
