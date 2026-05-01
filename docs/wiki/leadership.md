# Leadership And Proposals

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

Each player turn is one temporary proposal. A failed proposal never locks the table; the next player may propose something else.

### 1. Choose A Legal Visible Card

The active player chooses one visible legal card and moves it into the Proposal Area. This does not require committing crew first.

Legal proposal targets:

```text
One visible Horizon Star
One damaged Chamber
The active Gate, if the sector has reached its Gate
```

Hidden cards cannot be proposed.

### 2. Commit Loyal Crew

A proposal may start empty. It cannot resolve until at least one human crew is committed and the full Need is covered.

Committed crew are pledged, not Tired yet.

### 3. Other Players May Contribute

In turn order, each other player may commit any number of Ready loyal crew or pass. Players may negotiate freely.

Example negotiation:

```text
"I'll add Engine if I get the Wake reward."
"I won't help if you spend MOTHER."
"I'll help with the Gate, but not this Wake Star."
```

### 4. Add MOTHER If Needed

Any player who has at least one loyal crew in the proposal may add MOTHER cards.

MOTHER rules remain:

```text
Each MOTHER card supplies 1 wild icon.
MOTHER cannot pay Fuel.
MOTHER cannot pay Parts.
MOTHER cannot count as a human crew.
MOTHER cannot satisfy "also commit +N crew."
MOTHER may only help if at least one human crew is committed.
```

### 5. Check Whether The Proposal Is Ready

A proposal is ready if:

```text
All required icons are covered.
Required Fuel or Parts can be paid.
At least one human crew is committed.
All active MOTHER threshold rules are satisfied.
```

### 6A. If Ready, Resolve

If the proposal is ready:

```text
The player who added the final required human crew becomes the Implementer.
Spend required Fuel or Parts.
Committed crew become Tired.
Used MOTHER cards are spent.
Resolve the card's effect.
```

### 6B. If Not Ready, Dissolve

If the proposal is not ready:

```text
Return the proposed card to its original location.
Return pledged crew Ready to their owners.
Return temporary unspent MOTHER cards to the MOTHER Deck.
Spend nothing.
The active player's turn ends.
```

## Implementer

The Implementer is the player who adds the final required human crew that makes the proposal ready.

Most ship rewards remain shared. Crew recruitment rewards go to the Implementer.

## Rewards

Shared ship rewards:

```text
Fuel +N
Parts +N
Hull +N
Scout
Free Star
Chamber effects
```

Personal rewards:

```text
Wake N crew
```

When a player implements a Wake reward:

```text
Reveal 2 crew from Cryo.
The Implementer chooses 1.
The chosen crew becomes loyal to the Implementer.
The unchosen crew returns to the bottom of Cryo.
The recruited crew enters Tired.
```

If only 1 crew remains in Cryo, reveal and recruit that crew. If Cryo is empty, Wake does nothing.

## Solo Prototype Note

The browser prototype keeps solo play as the current implementation target. It uses one solo player, so the same proposal, Implementer, Wake, Gate Draft, and final count rules can be tested without adding full multiplayer seating UI yet.

Next: [Crew](crew.md).
