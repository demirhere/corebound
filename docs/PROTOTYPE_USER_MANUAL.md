# Corebound Prototype User Manual

This manual describes the current two-sector solo Corebound board prototype. The app sets up the board automatically on load or restart, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Visit 3 Stops. Get 3 Ship Parts. Use them to pass the Gate.
```

## Objective

Visit 3 Map Stops in Sector 1, pass Narrow Crossing, then visit 3 Map Stops in Sector 2 and pass Dark Threshold.

You win when Dark Threshold is completed after 3 Sector 2 Stops are traveled.

You lose if no visible Map Stop can be completed, or if the current Gate cannot be completed with available Ship Parts, Ready crew, and unused MOTHER cards.

## Starting Setup

The prototype uses two sectors, one active Stop Deck at a time, one Fuel deck, one MOTHER deck, one Cryo deck, a 3-slot Map, a Gate, a Stress area, and two crew areas: Crew and Tired.

On load or restart, setup is staged as an animated deal instead of cards snapping into place. After that animation, the playable counts match the table below.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 2 Fuel Cell cards | Shuffle 12 Fuel Cells, deal the top 2 face up as the starting Fuel Supply. |
| Fuel Deck | 10 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards draw from here. |
| Starting Crew | 5 crew | Deal all starting crew to the Crew area as Ready crew. |
| Tired Crew | 0 crew | Starts empty. Crew used on Stops or Gates move here. |
| Stop Deck | 9 Stops | Shuffle all 9 Stops for the sector. Deal 3 face up side by side into the Map and leave the rest in the Stop Deck for later 3-card Map offers. |
| Map | 3 Stops | These are the current visible Stops. Complete 1, move that traveled Stop to the route area, discard the other visible Stops, then draw 3 new side-by-side Stops after the first and second traveled Stop. |
| Gate | 1 Gate card | Reveal Narrow Crossing face up at setup. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Stress | 0 Stress | Spent MOTHER adds Stress. |
| Cryo Deck | 7 Cryo crew | Shuffle and keep as a reward-only deck. Wake rewards draw from here. |

## Crew Icons

Each crew card has two specialization icons. These icons satisfy matching Stop or Gate requirements. Fuel Cells pay Fuel normally. Without enough Fuel Cells, only one Ready Engineer paired with one Ready Scientist can make 1 water to pay 1 Fuel. Other crew pairs cannot pay Fuel.

The visible crew icon formerly called Star is now called Nav. Science uses a beaker icon.

| Starting Crew | Icons | Role |
| --- | --- | --- |
| Lei Watanabe | Life, Nav | Pilot |
| Mara Voss | Engine, Engine | Engineer |
| Ada Chen | Engine, Science | Scientist |
| Sana Iqbal | Life, Life | Medic |
| Nia Okonkwo | Science, Nav | Recon |

| Cryo Crew | Icons | Role |
| --- | --- | --- |
| Juno Pike | Engine, Nav | Helmsman |
| Tomas Hale | Engine, Life | Mechanic |
| Priya Shah | Life, Engine | Mechanic |
| Elise Tan | Life, Science | Doctor |
| Ilya Rao | Nav, Science | Recon |
| Oren Vale | Science, Science | Operator |
| Malik Ortega | Nav, Nav | Pilot |

## Stops And Ship Parts

Stops are shuffled into the Stop Deck. A sector begins with exactly 3 face-up Map Stops dealt side by side. Completing a Stop marks it traveled; the card moves to the route area instead of staying in the Map. The other visible Map Stops are discarded, then the next 3 Stops are drawn side by side as a fresh Map offer after the first and second traveled Stop.

Each traveled Stop gives exactly 1 Gate-only Ship Part based on its type. A Stop's complete reward set, including its Gate-only Ship Part, is printed on the card from the moment it is drawn.

| Stop | Type | Need | Visit Reward | Ship Part |
| --- | --- | --- | --- | --- |
| Dust Garden | Planet | Life, Nav | Fuel +1 | Water Tank |
| Life Orchard | Planet | Fuel 1, Life, Engine | Ready 1 Tired crew | Water Tank |
| Cryo Choir | Deep Space | Fuel 2, Life, Science | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Sleeper Arklet | Deep Space | Fuel 2, Life, Life, Nav | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Iron Wake | Asteroid | Fuel 1, Engine, Engine | Fuel +1 | Hull Patch |
| Red Salvage | Asteroid | Fuel 1, Engine, Science | Fuel +1 | Hull Patch |
| Broken Atlas | Asteroid | Science, Science | Scout 2 | Hull Patch |
| Gravity Sling | Deep Space | Fuel 2, Nav, Engine | Next Stop costs -1 Fuel | Wayfinder Beacon |
| Quiet Relay | Planet | Fuel 1, Science, Nav | Scout 3 | Water Tank |

Ship Parts are used only at the Gate. Each Ship Part can be spent once. Spent Ship Parts stay visible on their traveled Stop cards. Unspent Ship Parts expire after the sector Gate resolves.

| Ship Part | Gate Use |
| --- | --- |
| Water Tank | Ready 1 Tired crew before Gate payment. |
| Hull Patch | Fill 1 Gate crew slot. It provides no icon. |
| Wayfinder Beacon | Cover 1 missing Gate icon. It fills no crew slot. |

## Map Loop

On each turn while fewer than 3 Stops have been traveled this sector:

1. Choose 1 face-up Stop from the Map.
2. Pay its Fuel and icon requirements with Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER.
3. Move used crew to Tired.
4. Spend MOTHER only if needed to cover missing non-Fuel icons.
5. Resolve the Stop's printed Visit Reward.
6. Move the completed Stop to the route area and mark it traveled.
7. Its Ship Part is now available for the Gate.
8. Discard the other visible untraveled Map Stops.
9. If fewer than 3 Stops have been traveled, draw 3 new Stops side by side from the Stop Deck into the Map.
10. If the third Stop was just traveled, do not draw again. Clear any undealt Stop Deck cards, then attempt the Gate.

Important: a Ship Part cannot help complete the Stop that created it. Ship Parts are available only after that Stop's completion and Visit Reward fully resolve.

Important: crew-made water for Fuel payment requires exactly one Ready Engineer plus one Ready Scientist per Fuel. Those two crew cannot also satisfy Stop icons for that same completion, and they move to Tired with the other used crew.

## Rewards

Fuel +1 draws 1 Fuel Cell from the Fuel Deck into play. It stacks onto the existing Fuel Supply if one is in play, otherwise it appears at the Fuel Supply setup position.

Wake 1 reveals up to 2 cards from the Cryo Deck. Choose 1 to recruit into Tired, then Ready 1 Tired crew from the front of the Tired row; unchosen Cryo crew go to the bottom of the Cryo Deck.

Scout N looks at the top N Stop Deck cards. Choose the card you like to keep on top of the Stop Deck. The others are sent to the back in their revealed order. If Scout resolves after a Stop, complete the Scout choice before drawing the next 3-card Map offer.

Ready 1 moves the front Tired crew card back to the Crew area.

Next Stop costs -1 Fuel creates a pending -1 Fuel discount for the next Stop completion in the current sector. It expires at Gate transition if unused.

## Gate Cards

Gate requirements are two separate checks: crew slots and required icons.

| Gate | Timing | Crew Slots | Icons Needed | Stress |
| --- | --- | ---: | --- | --- |
| Narrow Crossing | After 3 Sector 1 Stops | 3 | Engine, Life, Nav, Science | If Stress is 3+, add 1 red crew slot. |
| Dark Threshold | After 3 Sector 2 Stops | 4 | Engine, Life, Nav, Science | If Stress is 3+, add 1 red crew slot. |

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
If Stress is 3 or more at a Gate, add 1 red crew slot.
Stress carries from Sector 1 to Sector 2.
```

## Valid Completion Stacks

A Stop completion stack can contain the Stop card, Ready crew, Fuel Cells, and usable MOTHER cards. Crew paying Fuel must be valid Engineer + Scientist water pairs. Other card types block completion.

A Gate completion stack can contain the Gate card, Ready crew, and usable MOTHER cards. Fuel Cells and other card types block completion.

Completion happens automatically when a stack satisfies the active requirement.

## Sector Transition

After Gate 1 succeeds:

1. The Sector 1 traveled Stops are archived to history.
2. Ship Part markers are cleared.
3. All Tired crew become Ready.
4. Fuel carries forward.
5. Stress carries forward.
6. The 9 Stops are reshuffled for Sector 2.
7. Dark Threshold is revealed.
8. Deal 3 Stops side by side into the Sector 2 Map.

After Gate 2 succeeds, the player wins.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. The MOTHER Deck draws 1 card, stacking onto an existing usable MOTHER stack if one is in play or dealing next to the MOTHER Deck setup position otherwise. The Stop Deck automatically draws 3 cards for each Map offer; Scout can set the top card before the next offer.

Drag decks to reposition them. A deck can merge only with another deck containing the same card family, such as Fuel with Fuel or MOTHER with MOTHER.

Drag Ready crew from the Crew area onto the board. Tired crew cannot be dragged manually unless a reward or Water Tank readies them first.

Drag a card stack onto a highlighted valid target to combine it into a Stop, Gate, or temporary support stack of Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER cards. Dragging from a card inside a stack splits that card and every card above it into a new moving stack.

Drag traveled Stop cards onto each other to stack them and organize board space. Traveled Stops cannot be stacked into payment stacks or discarded.

Use the Ship Part buttons during the Gate. Water Tank readies a Tired crew. Hull Patch fills a crew slot. Wayfinder Beacon covers a missing icon.

Drag an all-crew stack back to the Crew area to return those Ready crew to hand.

Drag a stack or Ready crew card to the discard zone to discard it. Gates and active or traveled Map Stops cannot be discarded.

Resolve Wake and Scout choice panels before taking more board actions.

Use Restart and reshuffle to start a fresh random run.

## Win And Loss Summary

Win by completing Dark Threshold after 3 Sector 2 Stops are traveled.

Lose as Stranded in the Reach if no visible Map Stop can be completed.

Lose as The Gate cannot be passed if the current Gate cannot be completed with available Ship Parts, Ready crew cards, and unused MOTHER cards for missing icons. Unused MOTHER includes usable MOTHER cards in play plus cards still in the MOTHER Deck.

There is no active Hull, health, damage, sector field, score track, market, relic system, or character progression in this prototype.

## Player Aid

```text
CORE LOOP

1. Choose 1 of 3 Map Stops.
2. Pay Fuel + icons.
   Engineer + Scientist = 1 water for Fuel.
3. Move used crew to Tired.
4. Get the Stop reward.
5. Move the traveled Stop to the route area.
6. Discard the other Map Stops.
7. Draw 3 new Map Stops unless that was the 3rd Stop.

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

If no visible Map Stop can be completed, you lose as Stranded in the Reach.
```
