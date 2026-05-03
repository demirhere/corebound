# Route Investment Loop Update Spec

## Status

Draft for review.

## Source Context

This spec builds on the current rules in `docs/PROTOTYPE_USER_MANUAL.md` and the design goals in `docs/game-design-principles.md`.

## Problem

The current core loop is operational but not yet strategic enough.

Current loop:

```text
Draw 3 Destinations -> choose 1 -> complete it -> discard the other 2 -> repeat
```

This creates a recurring solvability check:

```text
Which visible Destination can I attempt right now?
```

That is especially noticeable after the first round, when crew and fuel are already constrained. The player often has limited agency because the immediate board state decides the move. Destination choice rarely compounds into a playstyle, and rewards mostly restore access rather than changing future strategy.

The result conflicts with the target design principle:

```text
Reveal / draw -> choose -> commit -> resolve -> gain/change state -> face new pressure
```

The current game does reveal, choose, commit, and resolve, but the state change is too shallow. Chosen Destinations do not remain meaningful enough, so the player does not feel like they are building a route, engine, or identity.

## Design Goal

Make each visited Destination become a visible investment that changes future decisions.

The player should feel like:

```text
I am charting a route through space, and every place I visit leaves me with one concrete advantage I can spend later.
```

The mechanic should be as implicit and tactile as Stacklands' core grammar:

```text
Stack cards to make things happen.
```

For Corebound, the proposed grammar is:

```text
Stack crew and resources on an unvisited Destination to visit it.
Stack on a visited Destination to exploit what you found there.
```

## Non-Goals

Do not add a large new system, tech tree, market, score track, or character progression layer yet.

Do not make players track whether a once-per-sector benefit was already used. Availability must be visible directly on the board.

Do not make Route benefits equivalent to delayed resources. For example, `Flip: pay 2 Fuel` is too close to immediately gaining 2 Fuel. Benefits should change timing, requirements, risk, routing, or preservation.

Do not require memory of prior effects. If a benefit is available, the card is face up. If it has been used, the card is face down.

## Proposed Core Loop

Replace the temporary 3-card proposal with a persistent 3-card Destination map.

```text
1. Reveal Destinations until 3 are visible.
2. Choose and complete 1 visible Destination.
3. Place the completed Destination face up in the Route area.
4. Refill only the emptied visible Destination slot.
5. Use face-up Route benefits at tactically useful moments.
6. When a Route benefit is used, flip that Destination face down.
7. After 3 Destinations have been visited in the current sector, attempt the Gate.
```

This preserves random draw while changing the choice structure.

Old feeling:

```text
What can I afford right now?
```

New feeling:

```text
What route am I building, and which future problem am I preparing to solve?
```

## Destination Map Rule

There are always up to 3 visible Destination cards while a sector is active.

When the player completes a visible Destination, only that slot is refilled from the Sector deck.

The other visible Destinations remain on the board. They are not discarded just because they were not chosen.

This creates visible medium-term planning. A player can see an expensive Star Destination, visit an Asteroid first to improve fuel timing, then return to the Star later.

## Route Area Rule

Each sector has 3 Route slots.

When a Destination is completed, it moves to the next Route slot face up.

Face-up Route cards have an available Route benefit.

When a Route benefit is used, flip that Route card face down.

The face-down side should still show the Destination name and type shape so the player can see the route they traveled.

After 3 Route slots are filled, the player attempts the sector Gate.

## Card Sides

### Front Side

The front side of a Destination should show:

```text
Name
Type
Visit requirement
Visit reward
Route benefit
Trigger or stack instruction for using the Route benefit
```

### Back Side

The back side of a used Route card should show:

```text
Name
Type shape/icon
Visited
```

The back side is not a hidden-information card back. It is a spent marker that preserves route memory without requiring tracking.

## Visit Reward Versus Route Benefit

Each Destination can have two outputs.

Visit reward:

```text
Immediate reward for completing the Destination.
```

Route benefit:

```text
Single-use tactical benefit from that visited Destination, available later while face up in the Route.
```

Visit rewards should remain simple and satisfying.

Route benefits should create strategy through timing, type identity, or future board control.

A good Route benefit asks:

```text
When should I change the rules?
```

A weak Route benefit asks only:

```text
How many resources did I bank?
```

## Destination Type Identities

The three Destination types should become recognizable playstyle signals.

| Type | Route Identity | Strategic Question | Player Fantasy |
| --- | --- | --- | --- |
| Planet | Crew preservation and recovery | Can I keep my best people Ready? | I am building a survivable path. |
| Asteroid | Fuel efficiency and salvage infrastructure | Can I turn scarcity into momentum? | I am making the ship rugged and efficient. |
| Star | Navigation, foresight, and rule bending | Can I shape the unknown before it traps me? | I am navigating by dangerous anomalies. |

The first implementation should use one default Route benefit per type. This keeps the mechanic learnable and makes type identity immediately legible.

## First Prototype Benefits

Use the same Route benefit for all Destinations of the same type.

| Type | Default Route Benefit | Why It Works |
| --- | --- | --- |
| Planet | Flip when completing a Destination: 1 committed crew does not become Tired. | Preserves crew tempo and lets the player protect key specialists. |
| Asteroid | Flip when completing a Destination where Fuel was spent: recover 1 spent Fuel after resolution. | Rewards fuel-heavy lines but requires timing and prior spend. |
| Star | Flip before choosing a visible Destination: replace 1 visible Destination with the top card of the Sector deck, then put the replaced card on the bottom. | Gives map control and lets Star routes manage randomness. |

These benefits are intentionally broad. They should be tested before assigning unique benefits to individual Destination cards.

## Why These Benefits Are Strategic

### Planet

Planet does not simply grant crew. It lets the player preserve the right crew at the right time.

Strategic uses:

```text
Keep an Engine specialist Ready for the next Asteroid.
Keep a Life specialist Ready for the Gate.
Protect a double-icon crew from exhaustion.
```

### Asteroid

Asteroid does not simply grant Fuel. It improves the efficiency of a completion that already required Fuel.

Strategic uses:

```text
Take a fuel-expensive Destination now because part of the Fuel will return.
Chain into another fuel-cost Destination.
Reduce the punishment of spending Fuel before a Gate.
```

### Star

Star does not simply Scout. It gives the player control over the persistent visible map.

Strategic uses:

```text
Remove a Destination that blocks progress.
Fish for a Destination type that matches the route being built.
Avoid being trapped by three expensive visible options.
```

## Updated Example Turn

Initial visible Destinations:

```text
Dust Garden      Planet    Need: Life, Star
Iron Wake        Asteroid  Need: Fuel 1, Engine, Engine
Cryo Choir       Star      Need: Fuel 2, Life, Signal
```

The player cannot afford `Cryo Choir` comfortably yet, but wants its Star identity later.

They complete `Dust Garden` first.

Resolution:

```text
Dust Garden moves to Route slot 1 face up.
Dust Garden gives its visit reward.
The emptied visible slot is refilled from the Sector deck.
Iron Wake and Cryo Choir remain visible.
```

Later, while completing `Iron Wake`, the player flips `Dust Garden` to keep an Engine crew Ready.

Now the player can still attempt `Cryo Choir` with better crew tempo.

The decision was not just `Dust Garden gives reward`. It was `Dust Garden lets me preserve the crew needed to pivot into the Star route`.

## Gate Interaction

Keep Gate interaction minimal for the first implementation.

Face-up Route benefits may be used during Gate completion if their trigger allows it.

Do not add route-set bonuses yet, such as `2 Planets reduce Gate crew need`. Those are visible, but they add another scoring-like rule and may distract from testing the core mechanic.

The Gate should remain the pressure test. The Route should be the player's preparation for that test.

## Sector Transition

After Gate 1 is completed:

```text
Archive the Sector 1 Route cards as visited history.
Clear Route slots for Sector 2.
All Tired crew become Ready, as in the current rules.
Fuel carries forward, as in the current rules.
Spent MOTHER pressure carries forward, as in the current rules.
Reveal the Sector 2 Destination map.
```

Open implementation decision:

```text
Should unused face-up Route benefits from Sector 1 expire at Gate 1, or may they be used during Gate 1 only and then archive?
```

Recommended answer:

```text
They may be used during Gate 1 if relevant, then expire when the sector archives.
```

This keeps each sector self-contained and avoids cross-sector memory.

## Impact On Existing Cards

The first implementation can keep current visit rewards unchanged and add type-based Route benefits.

| Destination | Type | Current Visit Reward | First Prototype Route Benefit |
| --- | --- | --- | --- |
| Dust Garden | Planet | Fuel +1 | Planet benefit |
| Life Orchard | Planet | Ready 1 Tired crew | Planet benefit |
| Cryo Choir | Star | Wake 1 crew, then Ready 1 Tired crew | Star benefit |
| Sleeper Arklet | Star | Wake 1 crew, then Ready 1 Tired crew | Star benefit |
| Iron Wake | Asteroid | Fuel +1 | Asteroid benefit |
| Red Salvage | Asteroid | Fuel +1 | Asteroid benefit |
| Broken Atlas | Asteroid | Scout 2 | Asteroid benefit |
| Gravity Sling | Star | Next Star costs -1 Fuel | Star benefit |
| Quiet Relay | Planet | Scout 3 | Planet benefit |

This is deliberately conservative. If a type benefit makes a specific card too strong, tune the card cost or visit reward after playtesting.

## Future Individual Benefits

Only after the type-based prototype works, individual Destinations can get specific Route benefits.

Potential Planet variants:

```text
Shelter: Flip when completing a Destination. 1 committed crew does not become Tired.
Rest Garden: Flip before completion. Ready 1 Tired crew, then that crew must be committed if able.
Habitat: Flip when completing a Destination that uses 3 or more crew. 1 committed crew does not become Tired.
```

Potential Asteroid variants:

```text
Refinery: Flip when completing a Destination where Fuel was spent. Recover 1 spent Fuel.
Scrap Rig: Flip when completing an Asteroid. Ignore 1 non-Fuel icon if an Engine crew is committed.
Tow Cable: Flip before choosing a visible Destination. Replace 1 visible Destination.
```

Potential Star variants:

```text
Gravity Map: Flip before refilling the Destination map. Look at 2 cards and choose which one enters the map.
Signal Echo: Flip after Scout. Keep 2 cards on top instead of 1.
Beacon Trace: Flip when using MOTHER. 1 spent MOTHER from this completion does not count toward Gate pressure.
```

These are not part of the initial implementation recommendation.

## UI Requirements

The board needs a persistent `Route` area with 3 slots for the current sector.

Route cards should be visually distinct from visible unvisited Destinations.

Face-up Route cards should clearly show that they are usable.

Face-down Route cards should clearly show that they are used but still part of the traveled route.

Valid Route benefit targets should highlight when the player is in a relevant action state.

For example:

```text
Planet Route cards highlight while resolving a completion that will tire crew.
Asteroid Route cards highlight while resolving a completion that spends Fuel.
Star Route cards highlight while visible Destinations can be replaced.
```

The playtest log should state when a Route benefit is used.

Example log lines:

```text
Dust Garden route benefit used: Lei Watanabe remains Ready.
Iron Wake route benefit used: recovered 1 spent Fuel.
Gravity Sling route benefit used: replaced Sleeper Arklet with Broken Atlas.
```

## Rules Text Draft

This text can be adapted into `docs/PROTOTYPE_USER_MANUAL.md` after the mechanic is accepted.

```text
Visited Destinations

When you complete a Destination, move it to your Route face up instead of discarding it. Each sector has 3 Route slots. A face-up Route card has one Route benefit that can be used once later in the same sector. When you use a Route benefit, flip that Destination face down. Its name and type remain visible so your traveled route is still clear.

Destination Map

Keep up to 3 Destinations visible while a sector is active. When you complete one visible Destination, refill only that empty slot from the Sector deck. The other visible Destinations remain available.

Route Benefits

Planet: Flip when completing a Destination. Choose 1 committed crew; that crew does not become Tired.

Asteroid: Flip when completing a Destination where Fuel was spent. After the completion resolves, recover 1 spent Fuel.

Star: Flip before choosing a visible Destination. Replace 1 visible Destination with the top card of the Sector deck, then put the replaced card on the bottom of the Sector deck.
```

## Implementation Notes

Likely data model changes:

```text
Add a current-sector Route area to game state.
Track Route card status as face-up available or face-down used.
Keep completed Destinations in Route instead of sending them directly to discard.
Change Sector proposal behavior so unchosen visible Destinations persist.
Refill only the completed Destination slot.
Add actions for using each Route benefit.
Add playtest log events for Route movement and Route benefit use.
```

Likely rules changes:

```text
Sector completion no longer discards unchosen visible Destinations.
Sector completion moves the chosen Destination to Route.
Gate becomes available when 3 Route slots are filled and no unresolved visible completion is pending for that sector's required count.
Route benefits expire when the sector archives after Gate completion.
```

Potential affected files:

```text
src/game/types.ts
src/game/setup.ts
src/game/rules.ts
src/game/effects.ts
src/game/state.ts
src/game/logEvents.ts
src/App.tsx
src/components/*
src/App.css
docs/PROTOTYPE_USER_MANUAL.md
```

## Playtest Questions

Ask these during tests:

```text
What are you deciding between right now?
Which Route benefit are you saving, and why?
Do the three Destination types feel different?
Did you feel trapped by affordability or able to build toward a plan?
Did any Route benefit feel like a delayed resource instead of a strategy tool?
Was it obvious which Route cards were available and which were spent?
Did the Gate feel like a test of the route you built?
```

## Success Criteria

The update is working if playtesters say things like:

```text
I am trying to build a Planet route so my crew stays online.
I saved that Star benefit because I needed to fix the map later.
I took this Asteroid first so I could afford the expensive Destination without losing tempo.
I should have used that Route benefit earlier.
```

The update is not working if playtesters still say:

```text
I just picked the only card I could afford.
I forgot what my visited cards do.
I always use the benefit immediately.
All Destination types feel the same.
```

## Recommended First Implementation

Implement the smallest complete version:

```text
Persistent 3-Destination map.
Three current-sector Route slots.
Completed Destinations move to Route face up.
Face-up Route cards can be used once, then flip face down.
One Route benefit per Destination type.
Route benefits expire after the sector Gate.
Playtest log records Route movement and benefit use.
```

Do not implement unique per-card Route benefits in the first pass.

Do not implement route-set Gate bonuses in the first pass.

Do not add new Destination cards until the changed loop has been tested.
