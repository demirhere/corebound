# Corebound Prototype User Manual

This manual describes the current two-sector Corebound board prototype. It supports solo play and PartyKit multiplayer. The app sets up the board automatically when the run launches or restarts, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Visit 3 Destinations. Find ship parts or immediate benefits. Ship Parts, crew, and MOTHER help pass the Gate.
```

## Objective

Visit 3 Map Destinations in Sector 1, pass Narrow Crossing, then visit 3 Map Destinations in Sector 2 and pass Dark Threshold.

Solo: you win when Dark Threshold is completed after 3 Sector 2 Destinations are traveled.

Multiplayer: everyone is trying to keep the ship alive, but only the ship's survival creates a score. If the ship is stranded or any Gate cannot be passed, everyone loses. If Dark Threshold succeeds, count each player's owned surviving crew; the player with the most crew leads the new world.

Multiplayer tie-breakers:

1. Most Blueprints built.
2. Most Ready crew.
3. Shared victory.

You lose if the sector has no reachable Map Destination before 3 Destinations are traveled, or if the current Gate cannot be completed with available Ship Parts, Ready crew, and unused MOTHER cards.

## Starting Setup

The prototype uses two sectors, one active Sector Stops deck at a time, one Fuel deck, one MOTHER deck, one Cryo deck, a 3-slot Map, a Gate, a Stress area, and two crew areas: Crew and Tired.

On load or restart, setup is staged as an animated deal instead of cards snapping into place. After that animation, the Map is empty; click the Sector Stops deck to deal the first 3-card Map offer.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 2 Fuel Cell cards | Shuffle 12 Fuel Cells, deal the top 2 face up as the starting Fuel Supply. |
| Fuel Deck | 10 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards draw from here. |
| Starting Crew | 5 crew in solo, even hands in multiplayer | Deal all starting crew as Ready crew. In multiplayer, every launched player starts with the same number of Ready crew; if the 5-card starting set does not divide evenly, draw enough extra crew from the shuffled Cryo deck to finish the even deal. |
| Tired Crew | 0 crew | Starts empty. Crew used on Destinations or Gates move here. |
| Sector Stops | 9 Destinations | Shuffle all 9 Destinations for the sector and place them as a manual draw deck. Do not deal Map Destinations during setup; the player draws the first 3-card Map offer from here. |
| Map | 0 Destinations before the first draw | Starts empty. After the player draws from Sector Stops, these are the current visible Destinations. Complete 1, keep its card on the board only if it found a Ship Part, and clear Immediate Benefit Destinations with the other visible Destinations. New Map offers are drawn manually from Sector Stops, at most once per turn. |
| Gate | 1 Gate card | Place the Sector Gate face down below Sector 1 Stops. Click it to reveal or hide Narrow Crossing as needed. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Stress | 0 Stress | Spent MOTHER adds Stress. |
| Cryo Deck | Up to 7 Cryo crew | Shuffle and keep as a reward-only deck. In solo, all 7 Cryo crew start here. In multiplayer, any Cryo crew needed to finish the even starting deal are removed first, so Wake rewards draw from the remaining Cryo deck. |

## Crew Icons

Each crew card has two specialization icons. These icons satisfy matching Destination or Gate requirements. Fuel Cells pay Fuel normally. Without enough Fuel Cells, only one Ready Engineer paired with one Ready Scientist can make 1 water to pay 1 Fuel. Other crew pairs cannot pay Fuel.

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

## Destinations And Finds

Destinations are shuffled into Sector Stops. A sector begins with an empty Map; draw from Sector Stops to reveal exactly 3 face-up Map Destinations side by side. Completing a Destination marks it traveled. Ship Part Destination cards move to the route area and remain on the board after sector completion; Immediate Benefit Destination cards clear with the other visible Map Destinations. The next 3 Destinations are not drawn automatically. End the turn, then draw from Sector Stops on a later turn if the Map is empty.

Every visible Destination card uses the found item as the main title, labels the find as Ship Part or Resources, shows that item's effect, and shows the completion cost. The physical Destination name is used in logs, accessibility labels, and the manual table below. The destination terrain type is not shown as a rule on the card.

Each traveled Destination gives exactly one find:

```text
Immediate Benefit: resolve it now, mark the Destination traveled, then clear its card.
Ship Part: make that Ship Part available for a Gate and keep its Destination card on the board. It gives no immediate benefit.
```

No Destination gives both an immediate benefit and a Ship Part. In the current deck, deep-space Destinations provide immediate benefits only; Ship Parts are found at physical destinations.

| Destination | Find | Cost | Result |
| --- | --- | --- | --- |
| Dust Garden | Medbay Rehydrator | Life, Nav | Ship Part: Ready 1 Tired crew before Gate. |
| Life Orchard | Biogel Cache | Fuel 1, Life, Engine | Immediate Benefit: Ready 1 crew. |
| Cryo Choir | Cryo Access Codes | Fuel 2, Life, Science | Immediate Benefit: Wake 1 crew into Tired and Ready 1 crew. |
| Sleeper Arklet | Cryo Access Codes | Fuel 2, Life, Life, Nav | Immediate Benefit: Wake 1 crew into Tired and Ready 1 crew. |
| Iron Wake | Service Drone Bay | Fuel 1, Engine, Engine | Ship Part: Fill 1 Gate crew slot. It provides no icon. |
| Red Salvage | Fuel Cell Cache | Fuel 1, Engine, Science | Immediate Benefit: Collect 1 Fuel. |
| Broken Atlas | Survey Archive | Science, Science | Immediate Benefit: Peek at top 2 stops, keep 1. |
| Gravity Sling | Slingshot Trajectory | Fuel 2, Nav, Engine | Immediate Benefit: Next stop -1 Fuel. |
| Quiet Relay | Adaptive Control Console | Fuel 1, Science, Nav | Ship Part: Cover 1 missing Gate icon. It fills no crew slot. |

Ship Parts are controlled by the app at Gates. Medbay Rehydrator spends only if there is a Tired crew to ready. Service Drone Bay and Adaptive Control Console are spent automatically at the next Gate, up to that Gate's crew-slot and icon capacity, so plan as though they will be used at that Gate rather than saved by choice. Each Ship Part can be spent once. Spent Ship Parts stay visible on their traveled Destination cards and cannot be reused. Unspent Ship Parts remain visible and available after the sector Gate resolves, so they can be carried forward to a later Gate.

In multiplayer, Ship Part Blueprints are credited to the Mission Lead who traveled to that Destination for tie-break scoring, but their effects help everyone.

| Ship Part | Gate Effect |
| --- | --- |
| Medbay Rehydrator | Ready 1 Tired crew before Gate. |
| Service Drone Bay | Fill 1 Gate crew slot. It provides no icon. |
| Adaptive Control Console | Cover 1 missing Gate icon. It fills no crew slot. |

## Map Loop

At the start of each sector, click Sector Stops to draw the first 3 Map Destinations. Sector Stops can produce a new 3-card Map offer only once per turn, only if the Map is empty, and never after a Destination has already been traveled that turn. Visible Map Destinations can remain on the table across turns if the Mission Lead chooses not to visit one.

On your turn, take as many board actions as needed. You may draw Fuel with an Engineer + Scientist stack, draw MOTHER, organize stacks, prepare a Destination, let Ship Parts apply automatically during the Gate, or visit no Destination. You may travel to only one Destination per turn. While fewer than 3 Destinations have been traveled this sector:

1. Choose 1 face-up Destination from the Map.
2. Stack its Fuel and icon payment with Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER.
3. Click the Travel action button above the ready stack to confirm the visit.
4. Move used crew to Tired.
5. Spend MOTHER only if needed to cover missing non-Fuel icons.
6. Resolve the Destination's find. Immediate Benefits resolve now. Ship Parts become available for the Gate.
7. Mark the completed Destination traveled. Keep its card in the route area only if it found a Ship Part; otherwise clear it with the other Map cards.
8. Discard the other visible untraveled Map Destinations.
9. If fewer than 3 Destinations have been traveled, end the turn before drawing a new Map offer.
10. If the third Destination was just traveled, do not draw again. Clear any undealt Sector Stops cards, then attempt the Gate.

In multiplayer, the current turn player is the Mission Lead. Only the Mission Lead can draw decks, move table cards freely, trigger stack actions, choose Wake or Scout rewards, pass Gates, and end the turn. Other players can still commit their own Ready crew by clicking or dragging a card out of their Crew area, and can remove their own committed crew from the board by clicking it or dragging it back to their Crew area.

Important: a Ship Part cannot help complete the Destination that created it. Ship Parts are available only after that Destination's completion fully resolves.

Important: crew-made water for Fuel payment requires exactly one Ready Engineer plus one Ready Scientist per Fuel. Those two crew cannot also satisfy Destination icons for that same completion, and they move to Tired with the other used crew.

## Immediate Benefits

Collect 1 Fuel draws 1 Fuel Cell from the Fuel Deck into play. It stacks onto the existing Fuel Supply if one is in play, otherwise it appears at the Fuel Supply setup position. Fuel rewards help the shared ship.

Wake 1 reveals up to 2 cards from the Cryo Deck. Choose 1 to recruit into the back of Tired, then Ready 1 crew from the front of the Tired row. Unchosen Cryo crew go to the bottom of the Cryo Deck. In multiplayer, the recruited crew belongs to the Mission Lead.

Scout N looks at the top N Sector Stops cards. Choose the card you like to keep on top of Sector Stops. The others are sent to the back in their revealed order. If Scout resolves after a Destination, complete the Scout choice before the turn continues; it does not draw the next 3-card Map offer automatically. Scout is skipped if it is earned by the third Destination in a sector, because the Gate begins instead of preparing another stop.

Ready 1 moves the front Tired crew card back to the Crew area. Ready rewards help the shared ship.

Next stop -1 Fuel creates a pending -1 Fuel discount for the next Destination completion in the current sector. It expires at Gate transition if unused.

## Gate Cards

Gate requirements are two separate checks: crew slots and required icons.

| Gate | Timing | Crew Slots | Icons Needed | Stress |
| --- | --- | ---: | --- | --- |
| Narrow Crossing | After 3 Sector 1 Destinations | 3 | Engine, Life, Nav, Science | If Stress is 3+, add 1 red crew slot. |
| Dark Threshold | After 3 Sector 2 Destinations | 4 | Engine, Life, Nav, Science | If Stress is 3+, add 1 red crew slot. |

Gate resolution is also confirmed from stack actions. Click a face-down Sector Gate to reveal it before completing it; click it again to hide it if needed. Available Ship Parts apply automatically when the Gate begins, usually right after the third Destination and after resolving any pending Wake choice from that Destination: Medbay Rehydrators ready Tired crew, Service Drone Bays scribble out crew slots, and Adaptive Control Consoles scribble out required icons. Then stack Ready crew and usable MOTHER onto the Gate and click Pass Gate when the requirements are satisfied.

Gate resolution order:

1. Check Stress. If Stress is 3 or more, add 1 red crew slot to the Gate.
2. Apply any Medbay Rehydrators automatically to Ready Tired crew.
3. Apply any Service Drone Bays automatically to fill crew slots.
4. Commit Ready crew to fill all remaining crew slots.
5. Check required icons shown by committed crew.
6. Count already-applied Adaptive Control Consoles against missing Gate icons.
7. Spend MOTHER only for remaining missing non-Fuel icons.
8. If all crew slots are filled and all icons are shown or covered, the Gate is completed.
9. If not, the ship fails at the Gate.

Non-negotiable clarifications:

```text
MOTHER can cover icons only. MOTHER never fills a crew slot.
Adaptive Control Console can cover icons only. It never fills a crew slot.
Service Drone Bay fills a crew slot only. It never provides an icon.
```

## Stress And MOTHER

MOTHER is powerful but increases Stress when spent.

A usable MOTHER card can cover 1 missing non-Fuel icon. MOTHER cannot pay Fuel, cannot count as crew, and cannot satisfy Gate crew-slot requirements.

MOTHER can only help a Destination or Gate completion if at least 1 human crew is committed.

When a completion resolves, only the MOTHER cards needed for that completion are spent. Spent MOTHER cards stay in play as Stress markers and cannot be reused. Unused MOTHER cards in play return to the MOTHER Deck after a Destination or Gate completion.

Stress rules:

```text
Each spent MOTHER adds 1 Stress.
If Stress is 3 or more at a Gate, add 1 red crew slot.
Stress carries from Sector 1 to Sector 2.
```

## Valid Completion Stacks

A Destination completion stack can contain the Destination card, Ready crew, Fuel Cells, and usable MOTHER cards. Crew paying Fuel must be valid Engineer + Scientist water pairs. Other card types block completion.

A Ship Part blueprint Destination can also be used as a temporary prep pile with Ready crew, Fuel Cells, and usable MOTHER before it is ready to complete.

A Gate completion stack can contain the Gate card, Ready crew, and usable MOTHER cards. Fuel Cells and other card types block completion.

Completion never happens automatically, except automatic Ship Part Gate modifiers. When a stack satisfies an active requirement, an action button appears above that stack. Click the button to resolve the action.

The current stack actions are:

| Stack | Action |
| --- | --- |
| Engineer + Scientist | Draw 1 Fuel from the Fuel Deck; both crew move to Tired. |
| Ready Destination payment | Travel to that Destination. |
| Ready Gate payment | Pass the Gate. |

## Sector Transition

After Gate 1 succeeds:

1. The Sector 1 route progress resets. Immediate Benefit traveled Destinations leave the board; Ship Part Destination cards remain visible.
2. Ship Part Destination cards stay on the board. Unspent Ship Parts remain available; spent Ship Parts remain spent.
3. All Tired crew become Ready.
4. Fuel carries forward.
5. Stress carries forward.
6. The 9 Destinations are reshuffled for Sector 2 and placed in Sector 2 Stops.
7. The Sector Gate is placed face down below Sector 2 Stops. Click it to reveal or hide Dark Threshold as needed.
8. The Sector 2 Map starts empty; click Sector 2 Stops to draw 3 Destinations side by side.

After Gate 2 succeeds, the player wins.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. Sector Stops draws one 3-card Map offer per turn when the Map is empty. The MOTHER Deck draws 1 card, stacking onto an existing usable MOTHER stack if one is in play or dealing next to the MOTHER Deck setup position otherwise. Scout can set the top card before a future Sector Stops draw.

In multiplayer, you see only your own Crew and Tired hand areas. You can see each other player's total crew count plus Ready and Tired counts in the player panel.

Drag decks to reposition them. A deck can merge only with another deck containing the same card family, such as Fuel with Fuel or MOTHER with MOTHER.

Drag Ready crew from the Crew area onto the board. Tired crew cannot be dragged manually unless an Immediate Benefit or Medbay Rehydrator readies them first.

Drag a card stack onto a highlighted valid target to combine it into a Destination, Gate, Ship Part blueprint prep pile, or temporary support stack of Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER cards. Dragging from a card inside a stack splits that card and every card above it into a new moving stack. When a stack has an available action, click the button above it to confirm.

Drag visible traveled Ship Part Destination cards onto each other to stack them and organize board space. During the Gate, the app applies available Ship Parts automatically; no Gate stacking is required. Ship Part cards cannot be discarded.

Use the End turn button to start the next turn and refresh the once-per-turn Sector Stops draw permission.

Drag an all-crew stack back to the Crew area to return those Ready crew to hand.

Off-turn multiplayer players cannot freely drag stacks, draw decks, use stack actions, or end the turn. They can click or drag one of their own Ready crew cards to add it to the board, and click or drag one of their own crew cards on the board to return it to their Crew area.

Drag a stack or Ready crew card to the discard zone to discard it. Gates, active Map Destinations, and visible traveled Ship Part Destinations cannot be discarded.

Resolve Wake and Scout choice panels before taking more board actions.

Use Restart and reshuffle to start a fresh random run.

## Realtime Multiplayer

The prototype can run with a PartyKit room so other browsers can join the same table in realtime. Start the Vite app and PartyKit dev server together:

```text
pnpm dev
pnpm party:dev
```

The first browser is a host by default. When the host opens the root table without a `room` query parameter, the launch screen creates a four-letter table code and updates the URL with that room. Other players join the same room with `role=player`, for example:

```text
http://localhost:5173/?room=corebound-table&role=player
```

Use the launch screen's Copy link control or the Network panel's Copy player link control when sharing across browsers; both include the resolved PartyKit host.

On the Netlify deployment, the app expects the PartyKit server at `corebound.demirhere.partykit.dev`. If using a different PartyKit project host, open the host page with `partyHost=your-project.your-name.partykit.dev`; the copied player link will keep that override.

Players who are connected on the start screen become the player roster when Launch is pressed. Late joiners after launch receive the current table state but are not added to the scoring roster for that run.

The app still accepts `role=observer` for a read-only view. Observers receive card and deck positions, active stack/deck drag previews, Wake and Scout dialogs, How to Play dialog state, win/loss screens, and playtest log state.

## Win And Loss Summary

Solo: win by completing Dark Threshold after 3 Sector 2 Destinations are traveled.

Multiplayer scoring happens only if the ship survives:

```text
If the ship is stranded or any Gate fails: everyone loses.
If Dark Threshold succeeds: count each player's owned crew.
Most crew wins.
```

Count both Ready and Tired crew. They survived. If crew totals tie, compare Blueprints built, then Ready crew. If still tied, the victory is shared.

Lose as Stranded in the Reach if the sector has no reachable Map Destination before 3 Destinations are traveled. This can happen when the Map is empty and Sector Stops has no cards left, or when visible Map Destinations exist but none can be completed with available Fuel, Ready crew, crew-made water, and unused MOTHER.

Lose as The Gate cannot be passed if the current Gate cannot be completed with available Ship Parts, Ready crew cards, and unused MOTHER cards for missing icons. Available Ship Parts include unspent parts carried from an earlier sector. Unused MOTHER includes usable MOTHER cards in play plus cards still in the MOTHER Deck.

There is no active Hull, health, damage, sector field, score track, market, relic system, or character progression in this prototype.

## Player Aid

```text
CORE LOOP

Start each sector: click Sector Stops to draw 3 Map Destinations. Draw a new Map offer at most once per turn.

1. Choose 1 of 3 Map Destinations.
2. Pay Fuel + icons.
   Engineer + Scientist = 1 water for Fuel.
3. Click Travel above the ready stack.
4. Move used crew to Tired.
5. Resolve the find.
   Immediate Benefit = resolve now.
   Ship Part = save; applies automatically at a Gate.
6. Keep Ship Part Destinations on the board; clear Immediate Benefit Destinations.
7. Discard the other Map Destinations.
8. End turn before drawing a new Map offer unless that was the 3rd Destination.

After 3 Destinations: face the Gate.

SHIP PARTS

Medbay Rehydrator: ready 1 Tired crew.
Service Drone Bay: fill 1 crew slot, no icon.
Adaptive Control Console: cover 1 icon, no crew slot.
Unspent Ship Parts carry forward after a Gate.

MOTHER

MOTHER covers icons only.
MOTHER never fills crew slots.
Each spent MOTHER adds 1 Stress.
At 3+ Stress, Gates add 1 crew slot.

STUCK?

If the sector has no reachable Map Destination before the route is full, you lose as Stranded in the Reach.

MULTIPLAYER

Mission Lead takes the full turn.
Other players may only add or remove their own crew by click or drag.
Shared rewards help the ship.
Crew rewards join the Mission Lead.
Blueprints help everyone, but score for the Mission Lead who found them.
Any ship loss means everyone loses; only Dark Threshold success scores crew.
```
