# Corebound Prototype User Manual

This manual describes the current two-sector solo Corebound board prototype. The app sets up the board automatically on load or restart, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Visit 3 Stops. Get 3 Ship Parts. Use them to pass the Gate.
```

## Objective

Visit 3 Map Stops in Sector 1, pass Narrow Crossing, then visit 3 Map Stops in Sector 2 and pass Dark Threshold.

You win when Dark Threshold is completed after the Sector 2 Route is resolved.

You lose if no visible Map Stop can be completed and Distress Call cannot help, or if the current Gate cannot be completed with available Ship Parts, Ready crew, and unused MOTHER cards.

## Starting Setup

The prototype uses two sectors, one active Stop Deck at a time, one Fuel deck, one MOTHER deck, one Cryo deck, a 3-slot Map, a 3-slot Route, a Gate, a Stress area, a set-aside area, and two crew areas: Crew and Tired.

On load or restart, setup is staged as an animated deal instead of cards snapping into place. After that animation, the playable counts match the table below.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 2 Fuel Cell cards | Shuffle 12 Fuel Cells, deal the top 2 face up as the starting Fuel Supply. |
| Fuel Deck | 10 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards and Distress Call draw from here. |
| Starting Crew | 5 crew | Deal all starting crew to the Crew area as Ready crew. |
| Tired Crew | 0 crew | Starts empty. Crew used on Stops or Gates move here. |
| Stop Deck | 9 Stops | Shuffle all 9 Stops for the sector. Deal 3 face up into the Map and leave the rest in the Stop Deck. |
| Map | 3 Stops | These are the visible unvisited Stops available this sector. |
| Route | 0 Stops | Fill these slots with completed Stops. |
| Gate | 1 Gate card | Reveal Narrow Crossing face up at setup. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Stress | 0 Stress | Spent MOTHER and Distress Calls add Stress. |
| Cryo Deck | 7 Cryo crew | Shuffle and keep as a reward-only deck. Wake rewards draw from here. |

## Crew Icons

Each crew card has two specialization icons. These icons satisfy matching Stop or Gate requirements, and unused crew can also be paired to pay Fuel.

The visible crew icon formerly called Star is now called Nav.

| Starting Crew | Icons |
| --- | --- |
| Lei Watanabe | Life, Nav |
| Mara Voss | Engine, Engine |
| Ada Chen | Engine, Signal |
| Sana Iqbal | Life, Life |
| Nia Okonkwo | Signal, Nav |

| Cryo Crew | Icons |
| --- | --- |
| Juno Pike | Engine, Nav |
| Tomas Hale | Engine, Life |
| Priya Shah | Life, Engine |
| Elise Tan | Life, Signal |
| Ilya Rao | Nav, Signal |
| Oren Vale | Signal, Signal |
| Malik Ortega | Nav, Nav |

## Stops And Ship Parts

Stops are shuffled into the Stop Deck. A sector begins with exactly 3 face-up Map Stops. Completing a Stop moves it into the next Route slot instead of discarding it.

Each completed Route Stop gives exactly 1 Gate-only Ship Part based on its type.

| Stop | Type | Need | Visit Reward | Ship Part |
| --- | --- | --- | --- | --- |
| Dust Garden | Planet | Life, Nav | Fuel +1 | Water Tank |
| Life Orchard | Planet | Fuel 1, Life, Engine | Ready 1 Tired crew | Water Tank |
| Cryo Choir | Deep Space | Fuel 2, Life, Signal | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Sleeper Arklet | Deep Space | Fuel 2, Life, Life, Nav | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Iron Wake | Asteroid | Fuel 1, Engine, Engine | Fuel +1 | Hull Patch |
| Red Salvage | Asteroid | Fuel 1, Engine, Signal | Fuel +1 | Hull Patch |
| Broken Atlas | Asteroid | Signal, Signal | Scout 2 | Hull Patch |
| Gravity Sling | Deep Space | Fuel 2, Nav, Engine | Next Stop costs -1 Fuel | Wayfinder Beacon |
| Quiet Relay | Planet | Fuel 1, Signal, Nav | Scout 3 | Water Tank |

Ship Parts are used only at the Gate. Each Ship Part can be spent once. Spent Ship Parts stay visible on their Route cards. Unspent Ship Parts expire after the sector Gate resolves.

| Ship Part | Gate Use |
| --- | --- |
| Water Tank | Ready 1 Tired crew before Gate payment. |
| Hull Patch | Fill 1 Gate crew slot. It provides no icon. |
| Wayfinder Beacon | Cover 1 missing Gate icon. It fills no crew slot. |

## Map And Route Loop

On each turn while fewer than 3 Route slots are filled:

1. Choose 1 face-up Stop from the Map.
2. Pay its Fuel and icon requirements with Ready crew, Fuel, and usable MOTHER.
3. Move used crew to Tired.
4. Spend MOTHER only if needed to cover missing non-Fuel icons.
5. Resolve the Stop's printed Visit Reward.
6. Move the completed Stop to the next empty Route slot.
7. Its Ship Part is now available for the Gate.
8. If fewer than 3 Route slots are filled, refill only the emptied Map slot from the Stop Deck.
9. If the third Route slot was just filled, do not refill. Clear remaining Map Stops and undealt Stop Deck cards to the set-aside area, then attempt the Gate.

Important: a Ship Part cannot help complete the Stop that created it. Ship Parts are available only after that Stop's completion and Visit Reward fully resolve.

## Rewards

Fuel +1 draws 1 Fuel Cell from the Fuel Deck into play. It stacks onto the existing Fuel Supply if one is in play, otherwise it appears at the Fuel Supply setup position.

Wake 1 reveals up to 2 cards from the Cryo Deck. Choose 1 to recruit into Tired, then Ready 1 Tired crew from the front of the Tired row; unchosen Cryo crew go to the bottom of the Cryo Deck.

Scout N looks at the top N Stop Deck cards. Choose 1 to put on top of the Stop Deck. Put the rest on the bottom in any order. In this prototype, the Scout choice panel asks you to select the cards to bottom and leave 1 unselected for the top.

Ready 1 moves the front Tired crew card back to the Crew area.

Next Stop costs -1 Fuel creates a pending -1 Fuel discount for the next Stop completion in the current sector. It expires at Gate transition if unused.

## Gate Cards

Gate requirements are two separate checks: crew slots and required icons.

| Gate | Timing | Crew Slots | Icons Needed | Stress |
| --- | --- | ---: | --- | --- |
| Narrow Crossing | End of Sector 1 Route | 3 | Engine, Life, Nav, Signal | If Stress is 3+, add 1 red crew slot. |
| Dark Threshold | End of Sector 2 Route | 4 | Engine, Life, Nav, Signal | If Stress is 3+, add 1 red crew slot. |

Gate resolution order:

1. Check Stress. If Stress is 3 or more, add 1 red crew slot to the Gate.
2. Use any Water Tanks to Ready Tired crew.
3. Use any Hull Patches to fill crew slots.
4. Commit Ready crew to fill all remaining crew slots.
5. Check required icons shown by committed crew.
6. Use any Wayfinder Beacons to cover missing icons.
7. Spend MOTHER only for remaining missing non-Fuel icons.
8. If all crew slots are filled and all icons are shown or covered, the Gate is completed.
9. If not, the ship fails at the Gate.

Non-negotiable clarifications:

```text
MOTHER can cover icons only. MOTHER never fills a crew slot.
Wayfinder Beacon can cover icons only. Beacon never fills a crew slot.
Hull Patch fills a crew slot only. Hull Patch never provides an icon.
```

## Stress And MOTHER

MOTHER is powerful but increases Stress when spent.

A usable MOTHER card can cover 1 missing non-Fuel icon. MOTHER cannot pay Fuel, cannot count as crew, and cannot satisfy Gate crew-slot requirements.

MOTHER can only help a Stop or Gate completion if at least 1 human crew is committed.

When a completion resolves, only the MOTHER cards needed for that completion are spent. Spent MOTHER cards stay in play as Stress markers and cannot be reused. Unused MOTHER cards in play return to the MOTHER Deck after a Stop or Gate completion.

Stress rules:

```text
Each spent MOTHER adds 1 Stress.
Each Distress Call adds 1 Stress.
If Stress is 3 or more at a Gate, add 1 red crew slot.
Stress carries from Sector 1 to Sector 2.
```

## Distress Call

Distress Call is a stuck-state tool, not a normal best move.

You may make a Distress Call only if no face-up Map Stop can be completed using currently available Ready crew, Fuel, and usable MOTHER.

When you make a Distress Call:

1. Add 1 Stress.
2. Choose one: gain 1 Fuel from the Fuel Deck, or replace 1 face-up Map Stop with the top card of the Stop Deck.

If you replace a Map Stop, put the replaced Stop on the bottom of the Stop Deck. If the Fuel Deck is empty, you cannot choose gain Fuel. If the Stop Deck is empty, you cannot choose replace a Map Stop. If neither option can help and no Map Stop can be completed, you lose as stranded.

## Valid Completion Stacks

A Stop completion stack can contain the Stop card, Ready crew, Fuel Cells, and usable MOTHER cards. Other card types block completion.

A Gate completion stack can contain the Gate card, Ready crew, and usable MOTHER cards. Fuel Cells and other card types block completion.

Completion happens automatically when a stack satisfies the active requirement.

## Sector Transition

After Gate 1 succeeds:

1. The Sector 1 Route is archived to history.
2. Ship Part markers are cleared.
3. All Tired crew become Ready.
4. Fuel carries forward.
5. Stress carries forward.
6. The 9 Stops are reshuffled for Sector 2.
7. Dark Threshold is revealed.
8. Deal 3 Stops into the Sector 2 Map.

After Gate 2 succeeds, the player wins.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. The MOTHER Deck draws 1 card, stacking onto an existing usable MOTHER stack if one is in play or dealing next to the MOTHER Deck setup position otherwise. The Stop Deck is refilled automatically by the Map loop and Scout.

Drag decks to reposition them. A deck can merge only with another deck containing the same card family, such as Fuel with Fuel or MOTHER with MOTHER.

Drag Ready crew from the Crew area onto the board. Tired crew cannot be dragged manually unless a reward or Water Tank readies them first.

Drag a card stack onto a highlighted valid target to combine it into a Stop, Gate, or temporary support stack of Ready crew, Fuel Cells, and usable MOTHER cards. Dragging from a card inside a stack splits that card and every card above it into a new moving stack.

Use the Route Ship Part buttons during the Gate. Water Tank readies a Tired crew. Hull Patch fills a crew slot. Wayfinder Beacon covers a missing icon.

Use the Distress Call panel only when no Map Stop is reachable. The available buttons show whether you can gain Fuel or replace a Map Stop.

Drag an all-crew stack back to the Crew area to return those Ready crew to hand.

Drag a stack or Ready crew card to the discard zone to discard it. Gates and Map Stops cannot be discarded.

Resolve Wake and Scout choice panels before taking more board actions.

Use Restart and reshuffle to start a fresh random run.

## Win And Loss Summary

Win by completing Dark Threshold after the Sector 2 Route is resolved.

Lose as Stranded in the Reach if no visible Map Stop can be completed and Distress Call cannot help.

Lose as The Gate cannot be passed if the current Gate cannot be completed with available Ship Parts, Ready crew cards, and unused MOTHER cards for missing icons. Unused MOTHER includes usable MOTHER cards in play plus cards still in the MOTHER Deck.

There is no active Hull, health, damage, sector field, score track, market, relic system, or character progression in this prototype.

## Player Aid

```text
CORE LOOP

1. Visit 1 Map Stop.
2. Pay Fuel + icons.
3. Move used crew to Tired.
4. Get the Stop reward.
5. Put the Stop in your Route.
6. Refill the Map.

After 3 Stops: face the Gate.

SHIP PARTS

Planet = Water Tank: ready 1 Tired crew.
Asteroid = Hull Patch: fill 1 crew slot, no icon.
Deep Space = Beacon: cover 1 icon, no crew slot.

MOTHER

MOTHER covers icons only.
MOTHER never fills crew slots.
Each spent MOTHER adds 1 Stress.
At 3+ Stress, Gates add 1 crew slot.

STUCK?

Distress Call: +1 Stress, then gain 1 Fuel or replace 1 Map Stop.
```
