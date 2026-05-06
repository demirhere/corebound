# Corebound Prototype User Manual

This manual describes the current ten-sector Corebound board prototype. It supports solo play and PartyKit multiplayer. The app sets up the board automatically when the run launches or restarts, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Pass each sector Gate by paying its Fuel-first cost. Optional Missions reveal 3 Destinations at a time; visit them only if you want ship parts or immediate benefits before the Gate.
```

## Objective

Pass 10 sector Gates. At setup, shuffle the Gate deck and draw the top Gate face up. After each Gate succeeds, draw the next Gate from the top of the visible Gate deck. A sector Gate can be attempted at any time in that sector. Map Destinations are optional preparation, not prerequisites.

Solo: you win after the 10th Gate is completed and End run is pressed.

Multiplayer: everyone is trying to keep the ship alive, but only the ship's survival creates a score. If the ship is stranded or any Gate cannot be passed, everyone loses. If the final Gate succeeds, press End run, then count each player's owned surviving crew; the player with the most crew leads the new world.

Multiplayer tie-breakers:

1. Most Blueprints built.
2. Most Ready crew.
3. Shared victory.

You lose if no reachable Mission remains and the current Gate cannot be passed with required Gate Fuel, crew-made Fuel, and available Gate Fuel discounts.

## Starting Setup

The prototype uses 10 sectors, one active Missions deck at a time, one Fuel deck, one MOTHER deck, one Cryo deck, one Drift deck, one visible Gate deck, one Damage deck, a 3-slot Map, one face-up Gate, a Stress area, and two hand areas: Hand and Tired. The Discovery deck is temporarily disabled.

On load or restart, setup is staged as an animated deal instead of cards snapping into place. After that animation, the Map is empty; click the active Missions deck to deal the first 3-card Map offer.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 1 Fuel Cell card | Shuffle Fuel Cells, deal the top 1 face up as the starting Fuel Supply. |
| Fuel Deck | 10 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards draw from here. If the Fuel Deck is empty when Fuel would be drawn, shuffle the Fuel Discard into the Fuel Deck first. |
| Fuel Discard | 0 Fuel Cell cards | Starts empty. Fuel spent from the Fuel Supply or burned by Drift goes here, then can be reshuffled into the Fuel Deck. |
| Starting Crew | 4 crew in solo, even hands in multiplayer | Deal 4 starting crew as Ready crew. In multiplayer, every launched player starts with the same number of Ready crew; if the 4-card starting set does not divide evenly, draw enough extra crew from the shuffled Cryo deck to finish the even deal. |
| Tired Crew | 0 crew | Starts empty. Crew used on Destinations or Gates move here. |
| Missions | 15 Destinations | Shuffle all 15 Destinations for the sector and place them as a manual draw deck titled after the current Gate. Do not deal Map Destinations during setup; the player draws the first Map offer from here. |
| Map | 0 Destinations before the first draw | Starts empty. After the player draws from Missions, these are the current visible Destinations. Complete 1, keep its card on the board only if it found a Ship Part, and clear Resource Destinations with the other visible Destinations. New Map offers are drawn manually from Missions, at most once per turn. |
| Gate | 1 Gate card | Shuffle all 14 Gates, place the top Gate face up below Missions, and keep the rest visible as the Gate Deck. The run uses 10 of the shuffled Gates in the order they are drawn; the remainder stay unused for this run. The face-up Gate is attemptable anytime. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Discovery Deck | Disabled | Temporarily not set up. Completing a Destination does not award a Discovery. |
| Drift Deck | 10 Drift cards | Shuffle 7 Burn and 3 Fatigue receipt cards. This deck resolves only when a Gate effect asks for Drift. Reshuffle the full Drift deck when it is empty before a Drift draw. |
| Gate Deck | 13 remaining Gates | Shows how many shuffled Gates remain. Each Gate success draws the next Gate from here, for 10 Gates total. |
| Damage Deck | 12 Damage cards | Shuffle and keep as a reward-only penalty deck. If a passed Gate is not cleared cleanly, draw the top Damage and leave it on the ship board. |
| Stress | 0 Stress | Spent MOTHER adds Stress. |
| Cryo Deck | Up to 8 Cryo crew | Shuffle the unused starting crew and Cryo crew together. Each player's turn starts by drawing 1 Cryo crew into Ready if any remain. In multiplayer, any Cryo crew needed to finish the even starting deal are removed first. |

## Crew Icons

Each crew card has two specialization icons. These icons satisfy matching Destination requirements. Gates no longer ask for crew slots or specialization icons. Fuel Cells stacked on the Gate pay Gate Fuel normally. Without enough Fuel Cells, only one Ready Engineer paired with one Ready Scientist can make 1 water to pay 1 Fuel. Other crew pairs cannot pay Fuel.

The visible crew icon formerly called Star is now called Nav. Science uses a beaker icon.

| Starting Crew | Icons | Role |
| --- | --- | --- |
| Lei Watanabe | Life, Nav | Pilot |
| Mara Voss | Engine, Engine | Engineer |
| Ada Chen | Engine, Science | Scientist |
| Sana Iqbal | Life, Life | Medic |

| Cryo Crew | Icons | Role |
| --- | --- | --- |
| Juno Pike | Engine, Nav | Helmsman |
| Tomas Hale | Engine, Life | Mechanic |
| Priya Shah | Life, Engine | Mechanic |
| Elise Tan | Life, Science | Doctor |
| Ilya Rao | Nav, Science | Recon |
| Oren Vale | Science, Science | Operator |
| Malik Ortega | Nav, Nav | Pilot |
| Nia Okonkwo | Science, Nav | Recon |

## Destinations And Finds

Destinations are shuffled into Missions. A sector begins with an empty Map; draw from Missions to reveal 3 face-up Map Destinations side by side, or 2 if Phantom Course Damage is active. Completing a Destination marks it traveled. Ship Part Destination cards move to the route area and remain on the board after sector completion; Resource Destination cards clear with the other visible Destinations. You may pass the Gate before visiting any Destination, after one or two Destinations, or after all 3 route slots are full. The next Map offer is not drawn automatically. End the turn, then draw from Missions on a later turn if the Map is empty and you still want more optional preparation.

Every visible Destination card uses the found item as the main title, labels the find as Ship Part or Resources, shows that item's effect, and shows the completion cost. Destination costs are crew-icon combinations only; they never include printed Fuel. The physical Destination name is used in logs, accessibility labels, and the manual table below. The destination terrain type is not shown as a rule on the card.

Each traveled Destination gives one find. Finds can reward Fuel, ready Tired crew, wake Cryo crew, combine those immediate rewards, or reveal a Ship Part:

```text
Resources: recover the printed 1-4 Fuel now, mark the Destination traveled, then clear its card.
Ready: ready the printed number of crew that were already Tired.
Wake: the Mission Lead chooses the printed 1-2 Cryo crew, each joins Tired, and each wake readies 1 crew that was already Tired.
Ship Part: make that Ship Part available and keep its Destination card on the board. It gives no resource reward.
```

No Destination gives both Resources and a Ship Part. Some immediate reward Destinations combine Ready, Wake, and Fuel rewards.

| Destination | Find | Cost | Result |
| --- | --- | --- | --- |
| Dust Garden | Medbay Rehydrator | Life, Nav | Ship Part: Ready +1 crew after each sector. |
| Life Orchard | Biogel Fuel Cache | Life, Engine | Resources: Recover 2 Fuel. |
| Cryo Choir | Cryo Fuel Cells | Life, Science, Science | Resources: Recover 3 Fuel. |
| Sleeper Arklet | Ark Fuel Vault | Life, Life, Nav, Nav | Resources: Recover 4 Fuel. |
| Iron Wake | Service Drone Cache | Engine, Engine | Ready 1 crew and recover 1 Fuel. |
| Red Salvage | Fuel Cell Cache | Engine, Engine, Science | Resources: Recover 3 Fuel. |
| Broken Atlas | Atlas Fuel Cache | Science, Science | Resources: Recover 2 Fuel. |
| Gravity Sling | Slingshot Fuel Reserve | Nav | Resources: Recover 1 Fuel. |
| Cryo Ping | Cryo Wake Beacon | Science | Wake 1 Cryo crew. |
| Frost Lullaby | Thaw Ration Cache | Life, Nav | Wake 1 Cryo crew and recover 1 Fuel. |
| Vault Nursery | Revival Fuel Locker | Engine, Life, Science | Wake 1 Cryo crew and recover 2 Fuel. |
| Sleeping Convoy | Crew Ark Pods | Nav, Nav, Science | Wake 2 Cryo crew. |
| Amber Hibernaculum | Biogel Cryo Reserve | Life, Life, Engine, Science | Wake 2 Cryo crew and recover 1 Fuel. |
| Last Dormitory | Deep Sleep Fuel Cache | Engine, Engine, Life, Nav | Wake 2 Cryo crew and recover 2 Fuel. |
| Quiet Relay | Adaptive Control Console | Science, Nav | Ship Part: Reduce required Gate Fuel by 1. |

## Discoveries

Discoveries are temporarily disabled. The Discovery deck is not set up, and completing a Destination does not draw or award a Discovery.

Ship Parts are controlled by the app. Medbay Rehydrator readies +1 Tired crew after each sector and stays available. Adaptive Control Console spends automatically when a Gate has required Fuel left to reduce. Adaptive Control Console can be spent once. Spent Ship Parts stay visible on their traveled Destination cards and cannot be reused. Unspent Ship Parts remain visible and available after the sector Gate resolves, so they can be carried forward to a later Gate.

In multiplayer, Ship Part Blueprints are credited to the Mission Lead who traveled to that Destination for tie-break scoring, but their effects help everyone.

| Ship Part | Gate Effect |
| --- | --- |
| Medbay Rehydrator | Ready +1 crew after each sector. |
| Adaptive Control Console | Reduce required Gate Fuel by 1. |

## Map Loop

At the start of each sector, the Gate is already visible. The Mission Lead can attempt the Gate whenever they are ready. Click Missions to draw the first Map offer. Missions can produce a new Map offer only once per turn, only if the Map is empty, and never after a Destination has already been traveled that turn. Visible Map Destinations can remain on the table across turns if the Mission Lead chooses not to visit one.

On your turn, take as many board actions as needed. You may draw Fuel with an Engineer + Scientist stack, draw MOTHER, organize stacks, prepare a Destination, start the Gate, or visit no Destination. You may travel to only one Destination per turn. To visit an optional Destination:

1. Choose 1 face-up Destination from the Map.
2. Stack its crew-icon payment with Ready crew and usable MOTHER.
3. Click the Travel action button above the ready stack to confirm the visit.
4. Move used crew to Tired.
5. Spend MOTHER only if needed to cover missing non-Fuel icons.
6. Resolve the Destination's find. Fuel rewards recover Fuel now, Ready rewards ready Tired crew, Wake rewards recruit Cryo crew for the Mission Lead, and Ship Parts become available.
7. Skip Discovery awards while the Discovery deck is disabled.
8. Mark the completed Destination traveled. Keep its card in the route area only if it found a Ship Part; otherwise clear it with the other Map cards.
9. Discard the other visible untraveled Map Destinations.
10. End the turn before drawing a new Map offer. You can also ignore further Missions and start the Gate instead.
11. If all 3 route slots are full, no more Destinations are traveled in that sector; start the Gate when ready.

Every player turn starts by drawing the top Cryo crew into Ready for that player, if any Cryo crew remain. End turn advances to the next player, resets the once-per-turn Missions draw permission, and does not trigger any special round-end step.

Drift cards resolve only from Gate effects that call for Drift:

| Drift | Count | Effect |
| --- | ---: | --- |
| Burn | 7 | Discard 1 Fuel from the Fuel Supply. If no Fuel is available, discard nothing. |
| Fatigue | 3 | Move the first Ready crew in the shared Hand order to Tired. If no Ready crew is available, add 1 Stress. |

Gates with the extra-Drift effect resolve 1 additional Drift card when the Gate begins, before Ship Parts apply.

In multiplayer, the current turn player is the Mission Lead. Only the Mission Lead can draw decks, move table cards freely, trigger stack actions, choose pending reward panels, pass Gates, and end the turn. Other players can still commit their own Ready crew by clicking or dragging a card out of their Hand area, and can remove their own committed crew from the board by clicking them or dragging them back to their Hand area.

Important: a Ship Part cannot help complete the Destination that created it. Ship Parts are available only after that Destination's completion fully resolves.

Important: crew-made water for Fuel payment requires exactly one Ready Engineer plus one Ready Scientist per Fuel. Those two crew move to Tired with the other used crew.

## Destination Rewards

Fuel rewards draw the printed number of Fuel Cells from the Fuel Deck into play. They stack onto the existing Fuel Supply if one is in play, otherwise they appear at the Fuel Supply setup position. If the Fuel Deck is empty, shuffle the Fuel Discard into it first. Fuel rewards help the shared ship.

Wake rewards draw 2 Cryo crew choices at a time. The Mission Lead chooses 1, that crew joins Tired under the Mission Lead's ownership, and then 1 crew that was already Tired readies. Wake 2 rewards repeat this process once if enough Cryo crew remain.

## Gate Cards

Each sector Gate has two layers:

```text
1. Pass the Gate's basic Fuel requirement and any Gate resolve costs.
2. Pay the Gate's extra clean-clear Fuel cost.
```

Passing the Gate is required. If you fail to pass, the ship loses at the Gate. Clearing the Gate cleanly is optional. If you pass but do not clear it, draw the top Damage card and leave it visible on the ship board for the rest of the run. Damage effects apply to all future rounds.

Gate requirements are Fuel-first checks. Current Gates cost 3-6 Fuel before discounts. Gates do not show or require crew slots or Gate icons. Gate effects are either no special effect or 1 extra Drift before the Gate can finish.

Clean-clear costs are extra costs above the pass requirement. The app spends the extra clean-clear Fuel automatically if the Gate can afford it.

| Gate | Pass Fuel | Effect at Resolve | Clean Clear |
| --- | ---: | --- | --- |
| Narrow Crossing | 3 | No special effect. | No extra cost. |
| Quiet Drift | 3 | Resolve 1 extra Drift before passing. | Pay +1 Fuel. |
| Old Pass | 4 | No special effect. | Pay +1 Fuel. |
| Lost Beacon | 3 | No special effect. | Pay +2 Fuel. |
| Dust Reach | 4 | No special effect. | Pay +2 Fuel. |
| Cold Mirror | 5 | No special effect. | Pay +1 Fuel. |
| Echo Vault | 4 | No special effect. | Pay +2 Fuel. |
| Ash Belt | 5 | No special effect. | Pay +2 Fuel. |
| Black Threshold | 4 | No special effect. | Pay +2 Fuel. |
| Hollow Span | 5 | No special effect. | Pay +2 Fuel. |
| Iron Shoal | 5 | No special effect. | Pay +2 Fuel. |
| Last Verge | 6 | Resolve 1 extra Drift before passing. | Pay +3 Fuel. |
| Drowned Comm | 5 | No special effect. | Pay +3 Fuel. |
| The Reach | 6 | No special effect. | Pay +4 Fuel. |

### Damage Deck

The Damage deck is a standalone 11-card deck. If a Gate is passed but not cleared cleanly, draw the top Damage card automatically, leave it visible on the ship board, and apply it to all future rounds. Cards marked "(to be implemented)" are visible but have no active effect yet.

| Damage | Effect | Trigger |
| --- | --- | --- |
| Fractured Engine | Engine Missions require +1 Engine icon. (to be implemented) | At each Mission attempt. |
| Frozen Sector | No current effect while round-end steps are disabled. (to be implemented) | No current trigger. |
| Comm Failure | Each MOTHER use costs +1 Fuel. | When MOTHER is spent. |
| Sensor Loss | Cannot peek anything. | Always. |
| Hull Crack | No current effect while round-end steps are disabled. (to be implemented) | No current trigger. |
| Crew Quarters Damaged | Discovery hand limit -1. No current impact while Discoveries are disabled. | Always. |
| Sealed Cargo | First Mission per sector gives no Discovery. No current impact while Discoveries are disabled. | Each sector. |
| Stress Echo | Each MOTHER spend adds 1 extra Stress. | When MOTHER is spent. |
| Phantom Course | Missions reveal 2 cards instead of 3. | Each sector start. |
| Drift Loop | No current effect while round-end Drift is disabled. (to be implemented) | No current trigger. |
| Long Reach | The 3rd Mission in a sector requires +1 crew icon. | At each Mission attempt. |

Gate resolution is confirmed from stack actions. Each sector Gate is dealt face up and remains visible. Available Gate Fuel discounts apply automatically when the Gate begins: Adaptive Control Consoles scribble out required Gate Fuel. Medbay Rehydrators apply after the sector instead. If the Gate is already started and a later optional Destination creates a Gate Fuel discount, the app applies that discount before the Gate is passed. Then stack required Fuel Cells from the Fuel Supply and any water-pair crew needed for missing Fuel onto the Gate. Click the Gate action when the stack satisfies the pass requirements. The action says Complete sector with damage when the Gate can pass but the clean-clear cost is missing.

Gate resolution order:

1. Resolve 1 extra Drift if this Gate requires extra Drift.
2. Apply any Adaptive Control Consoles automatically to reduce required Gate Fuel.
3. Spend required Gate Fuel from the committed Fuel Cells. If Fuel is short, committed Engineer + Scientist water pairs can cover missing Fuel.
4. If Fuel is paid, the Gate is passed.
5. Check the Gate clean-clear Fuel cost. If it is not cleared, draw the top Damage card and leave it on the ship board.
6. If the Gate pass requirements are not met, the ship fails at the Gate.

Non-negotiable clarifications:

```text
MOTHER can cover icons only. Gates do not require icons.
Adaptive Control Console reduces required Gate Fuel only.
```

## Stress And MOTHER

MOTHER is powerful but increases Stress when spent.

A usable MOTHER card can cover 1 missing non-Fuel Destination icon. MOTHER cannot pay Fuel or count as crew.

MOTHER can only help a Destination completion if at least 1 human crew is committed.

When a completion resolves, only the MOTHER cards needed for that completion are spent. Spent MOTHER cards stay in play as Stress markers and cannot be reused. Unused MOTHER cards in play return to the MOTHER Deck after completion.

Stress rules:

```text
Each spent MOTHER adds 1 Stress.
Stress carries forward across all sectors of the run.
```

## Valid Completion Stacks

A Destination completion stack can contain the Destination card, Ready crew, and usable MOTHER cards. Other card types block completion.

A Ship Part blueprint Destination can also be used as a temporary prep pile with Ready crew and usable MOTHER before it is ready to complete.

A Gate completion stack can contain the Gate card, Fuel Cells, and Ready Engineer + Scientist water pairs. Every Gate requires committed Fuel or committed water pairs to cover missing Fuel. Fuel Cells can also be stacked when extra Gate or Damage Fuel costs apply, such as clean-clear Fuel or Comm Failure. Other card types block completion.

Completion never happens automatically, except automatic Ship Part Gate modifiers. When a stack satisfies an active requirement, an action button appears above that stack. Click the button to resolve the action.

The current stack actions are:

| Stack | Action |
| --- | --- |
| Engineer + Scientist | Draw 1 Fuel from the Fuel Deck; both crew move to Tired. |
| Ready Destination payment | Travel to that Destination. |
| Ready Gate payment | Pass the Gate. If clean-clear costs are missing, the action says Complete sector with damage. |

## Sector Transition

After each non-final Gate succeeds:

1. The current sector's route progress resets. Any unresolved visible Map Destinations are discarded. Resource traveled Destinations leave the board; Ship Part Destination cards remain visible.
2. Ship Part Destination cards stay on the board. Unspent Ship Parts remain available; spent Ship Parts remain spent.
3. Each available Medbay Rehydrator readies +1 Tired crew. Other Tired crew stay Tired until another effect readies them.
4. Fuel carries forward, and spent Fuel in the Fuel Discard can be reshuffled into the Fuel Deck when needed.
5. Stress carries forward.
6. If the Gate was not cleared cleanly, the drawn Damage remains visible and its effect carries forward across all remaining sectors.
7. The 15 Destinations are reshuffled for the next sector and placed in Missions titled after the next Gate.
8. Draw the next Gate from the Gate Deck, place it face up below Missions, and attempt it anytime.
9. The next sector's Map starts empty; click Missions to fill the Map.

After the 10th Gate succeeds, play locks to End run. Press End run to score and show the arrival screen.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. Missions draws one 3-card Map offer per turn when the Map is empty. The MOTHER Deck draws 1 card, stacking onto an existing usable MOTHER stack if one is in play or dealing next to the MOTHER Deck setup position otherwise.

In multiplayer, you see only your own Hand and Tired areas. You can see each other player's total crew count plus Ready and Tired counts in the player panel.

Drag decks to reposition them. A deck can merge only with another deck containing the same card family, such as Fuel with Fuel or MOTHER with MOTHER.

Drag Ready crew from the Hand area onto the board. Tired crew cannot be dragged manually until Medbay Rehydrator or another effect readies them first.

Drag a card stack onto a highlighted valid target to combine it into a Destination, Gate, Ship Part blueprint prep pile, or temporary support stack of Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER cards. MOTHER supports Destinations only. Dragging from a card inside a stack splits that card and every card above it into a new moving stack. When a stack has an available action, click the button above it to confirm.

Drag visible traveled Ship Part Destination cards onto each other to stack them and organize board space. During the Gate, the app applies available Gate Fuel discounts automatically; no Gate stacking is required. Ship Part cards cannot be discarded.

Use the End turn button to start the next turn and refresh the once-per-turn Missions draw permission. Missions are drawn manually from the Missions deck; End turn does not force a Mission draw or any round-end effect. The next turn player immediately draws 1 Cryo crew into Ready if any remain. After the final Gate succeeds, this control becomes End run; pressing it shows the arrival screen.

Drag an all-crew stack back to the Hand area to return those cards to hand.

Off-turn multiplayer players cannot freely drag stacks, draw decks, use stack actions, or end the turn. They can click or drag one of their own Ready crew cards to add it to the board, and click or drag one of their own crew cards on the board to return it to their Hand area.

Drag a stack or Ready crew card to the discard zone to discard it. Gates, Damage, active Map Destinations, and visible traveled Ship Part Destinations cannot be discarded.

Resolve pending choice panels before taking more board actions.

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

The app still accepts `role=observer` for a read-only view. Observers receive card and deck positions, active stack/deck drag previews, pending choice dialogs, How to Play dialog state, win/loss screens, and playtest log state.

## Win And Loss Summary

Solo: win by completing the 10th Gate and pressing End run.

Multiplayer scoring happens only if the ship survives:

```text
If the ship is stranded or any Gate fails: everyone loses.
If the final Gate succeeds: press End run, then count each player's owned crew.
Most crew wins.
```

Count both Ready and Tired crew. If crew totals tie, compare Blueprints built, then Ready crew. If still tied, the victory is shared.

Lose as Stranded in the Reach if no reachable Mission remains and the current Gate cannot be passed with available resources. This can happen when the Map is empty and Missions has no cards left, when visible Map Destinations exist but none can be completed with Ready crew and unused MOTHER, or when the Fuel Supply, Fuel Deck, Fuel Discard, water-pair crew, and Gate Fuel discounts cannot produce enough Fuel and the Gate is also out of reach.

Lose as The Gate cannot be passed if the current Gate cannot be completed with required Gate Fuel, crew-made Fuel, and available Gate Fuel discounts. Available Gate Fuel discounts come from unspent Adaptive Control Consoles carried from an earlier sector.

There is no active Hull, health, sector field, score track, market, relic system, Research repair deck, or character progression in this prototype. Damage is active and permanent for the run.

## Player Aid

```text
CORE LOOP

Start each sector: read the face-up Gate. Either start the Gate now, or click Missions to draw optional Map Destinations. Draw a new Map offer at most once per turn.

1. If you want preparation, choose 1 of 3 Map Destinations.
2. Pay crew icons.
   MOTHER can cover missing non-Fuel icons.
3. Click Travel above the ready stack.
4. Move used crew to Tired.
5. Resolve the find.
   Resources = recover Fuel now.
   Wake = Mission Lead recruits Cryo crew into Tired, then readies crew.
   Ready = ready Tired crew.
   Ship Part = save; applies automatically when relevant.
6. Keep Ship Part Destinations on the board; clear non-Ship Part Destinations.
7. Discard the other Map Destinations.
8. End turn before drawing a new Map offer.
9. After the final player ends their turn, resolve 1 Drift card, then ready each player's longest-Tired crew that was already Tired at the start of the round.

DISCOVERIES

Temporarily disabled. Destinations do not award Discovery cards.

Gate anytime: spend 3-6 Fuel, pass the Gate to survive, and clear it cleanly with extra Fuel to avoid drawing permanent Damage.

SHIP PARTS

Medbay Rehydrator: ready +1 crew after each sector.
Adaptive Control Console: reduce required Gate Fuel by 1.
Unspent Ship Parts carry forward after a Gate.

MOTHER

MOTHER covers icons only.
MOTHER never pays Fuel.
Each spent MOTHER adds 1 Stress.
Gates do not require MOTHER support.

STUCK?

If no reachable Mission remains and the Gate cannot be passed, you lose as Stranded in the Reach.

MULTIPLAYER

Mission Lead takes the full turn.
Other players may only add or remove their own crew by click or drag.
Shared rewards help the ship.
Fuel rewards help the shared ship.
Wake rewards add crew for the Mission Lead.
Blueprints help everyone, but score for the Mission Lead who found them.
Any ship loss means everyone loses; only 10th Gate success plus End run scores crew.
```
