# Corebound Prototype User Manual

This manual describes the current two-sector Corebound board prototype. It supports solo play and PartyKit multiplayer. The app sets up the board automatically when the run launches or restarts, but the rules below are written so a playtester can understand the physical table loop.

Player-facing teach:

```text
Pass each sector Gate. Optional Missions reveal 3 Destinations at a time; visit them only if you want ship parts, immediate benefits, or Discoveries before the Gate.
```

## Objective

Pass two sector Gates. At setup, shuffle the Gate deck and draw the top Gate face up. After Gate 1 succeeds, draw the next Gate from the top of the visible Gate deck. A sector Gate can be attempted at any time in that sector. Map Destinations are optional preparation, not prerequisites.

Solo: you win when the second Gate is completed.

Multiplayer: everyone is trying to keep the ship alive, but only the ship's survival creates a score. If the ship is stranded or any Gate cannot be passed, everyone loses. If Gate 2 succeeds, count each player's owned surviving crew; the player with the most crew leads the new world.

Multiplayer tie-breakers:

1. Most Blueprints built.
2. Most Ready crew.
3. Shared victory.

You lose if no reachable Mission remains and the current Gate cannot be passed with available Ship Parts, Ready crew, required Fuel, and unused MOTHER cards.

## Starting Setup

The prototype uses two sectors, one active Missions deck at a time, one Fuel deck, one MOTHER deck, one Cryo deck, one Discovery deck, one Drift deck, one visible Gate deck, one Damage deck, a 3-slot Map, one face-up Gate, a Stress area, and two hand areas: Hand and Tired.

On load or restart, setup is staged as an animated deal instead of cards snapping into place. After that animation, the Map is empty; click the active Missions deck to deal the first 3-card Map offer.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 2 Fuel Cell cards | Shuffle 12 Fuel Cells, deal the top 2 face up as the starting Fuel Supply. |
| Fuel Deck | 10 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards draw from here. |
| Starting Crew | 5 crew in solo, even hands in multiplayer | Deal all starting crew as Ready crew. In multiplayer, every launched player starts with the same number of Ready crew; if the 5-card starting set does not divide evenly, draw enough extra crew from the shuffled Cryo deck to finish the even deal. |
| Tired Crew | 0 crew | Starts empty. Crew used on Destinations or Gates move here. |
| Missions | 9 Destinations | Shuffle all 9 Destinations for the sector and place them as a manual draw deck titled after the current Gate. Do not deal Map Destinations during setup; the player draws the first Map offer from here. |
| Map | 0 Destinations before the first draw | Starts empty. After the player draws from Missions, these are the current visible Destinations. Complete 1, keep its card on the board only if it found a Ship Part, and clear Immediate Benefit Destinations with the other visible Destinations. New Map offers are drawn manually from Missions, at most once per turn. |
| Gate | 1 Gate card | Shuffle all 14 Gates, place the top Gate face up below Missions, and keep the rest visible as the Gate Deck. The face-up Gate is attemptable anytime. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Discovery Deck | 24 Discovery cards | Shuffle 3 copies each of 8 Discovery designs. This is reward-only; completing a Destination automatically deals the top Discovery to the earning player's Hand. |
| Drift Deck | 10 Drift cards | Shuffle 7 Burn and 3 Fatigue receipt cards. This deck resolves automatically after the final player ends their turn each round. Reshuffle the full Drift deck when it is empty before a Drift draw. |
| Gate Deck | 13 remaining Gates | Shows how many shuffled Gates remain. Gate 1 success draws the next Gate from here. |
| Damage Deck | 12 Damage cards | Shuffle and keep as a reward-only penalty deck. If a passed Gate is not cleared cleanly, draw the top Damage and leave it on the ship board. |
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

Destinations are shuffled into Missions. A sector begins with an empty Map; draw from Missions to reveal 3 face-up Map Destinations side by side, or 2 if Phantom Course Damage is active. Completing a Destination marks it traveled. Ship Part Destination cards move to the route area and remain on the board after sector completion; Immediate Benefit Destination cards clear with the other visible Destinations. You may pass the Gate before visiting any Destination, after one or two Destinations, or after all 3 route slots are full. The next Map offer is not drawn automatically. End the turn, then draw from Missions on a later turn if the Map is empty and you still want more optional preparation.

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

## Discoveries

When a crew completes a Destination, they bring home one Discovery. Draw the top card of the 24-card Discovery Deck automatically and add it to the earning player's Hand.

In solo, you earn every Discovery. In multiplayer, the Discovery goes to the player whose crew committed the most to that Destination. If tied, it goes to the Mission Lead, which is the current turn player.

Discovery cards are not crew. They are specimen-style cards kept in Hand until played. Stack them with the commitment they modify:

| Discovery | Tag | Effect |
| --- | --- | --- |
| Star Chart | Crew | This committed crew counts as Nav. |
| Spare Coil | Crew | This committed crew counts as Engine. |
| Bio-sample | Crew | This committed crew counts as Life. |
| Field Notes | Crew | This committed crew counts as Science. |
| Pressure Suit | Mission | -1 Fuel cost on this Destination. |
| Coolant Pack | Gate | Clear 1 Stress before this Gate scores. |
| Local Allies | Gate | Skip 1 extra Gate crew slot. You still must pass the Gate normally. |
| Ration Pack | Anytime | +1 Fuel to supply, then discard. |

Crew-tag Discoveries pair with adjacent committed crew; the intended physical stack is Discovery under the crew it modifies. The prototype also accepts the reverse adjacent order to make drag-and-drop forgiving. Mission-tag Discoveries must be in the Destination stack. Gate-tag Discoveries must be in the Gate stack. Ration Pack is used by dropping it onto the board by itself, then clicking Use ration above the card.

Ship Parts are controlled by the app at Gates. Medbay Rehydrator spends only if there is a Tired crew to ready. Service Drone Bay and Adaptive Control Console are spent automatically at the next Gate, up to that Gate's crew-slot and icon capacity, so plan as though they will be used at that Gate rather than saved by choice. Each Ship Part can be spent once. Spent Ship Parts stay visible on their traveled Destination cards and cannot be reused. Unspent Ship Parts remain visible and available after the sector Gate resolves, so they can be carried forward to a later Gate.

In multiplayer, Ship Part Blueprints are credited to the Mission Lead who traveled to that Destination for tie-break scoring, but their effects help everyone.

| Ship Part | Gate Effect |
| --- | --- |
| Medbay Rehydrator | Ready 1 Tired crew before Gate. |
| Service Drone Bay | Fill 1 Gate crew slot. It provides no icon. |
| Adaptive Control Console | Cover 1 missing Gate icon. It fills no crew slot. |

## Map Loop

At the start of each sector, the Gate is already visible. The Mission Lead can attempt the Gate whenever they are ready. Click Missions to draw the first Map offer. Missions can produce a new Map offer only once per turn, only if the Map is empty, and never after a Destination has already been traveled that turn. Visible Map Destinations can remain on the table across turns if the Mission Lead chooses not to visit one.

On your turn, take as many board actions as needed. You may draw Fuel with an Engineer + Scientist stack, draw MOTHER, organize stacks, prepare a Destination, start the Gate, or visit no Destination. You may travel to only one Destination per turn. To visit an optional Destination:

1. Choose 1 face-up Destination from the Map.
2. Stack its Fuel and icon payment with Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER.
3. Click the Travel action button above the ready stack to confirm the visit.
4. Move used crew to Tired.
5. Spend MOTHER only if needed to cover missing non-Fuel icons.
6. Resolve the Destination's find. Immediate Benefits resolve now. Ship Parts become available for the Gate.
7. Award 1 Discovery from the Discovery Deck to the player whose crew committed most. Ties go to the Mission Lead.
8. Mark the completed Destination traveled. Keep its card in the route area only if it found a Ship Part; otherwise clear it with the other Map cards.
9. Discard the other visible untraveled Map Destinations.
10. End the turn before drawing a new Map offer. You can also ignore further Missions and start the Gate instead.
11. If all 3 route slots are full, no more Destinations are traveled in that sector; start the Gate when ready.

After every player has taken one turn, the final End turn press starts Drift before the next round begins unless Last Verge is the active Gate. Interaction locks, the top Drift card flips face up, and shortly after it is fully revealed it is discarded and resolved. Drift Loop Damage resolves 2 Drift cards at round end:

| Drift | Count | Effect |
| --- | ---: | --- |
| Burn | 7 | Discard 1 Fuel from the Fuel Supply. If no Fuel is available, discard nothing. |
| Fatigue | 3 | Move the first Ready crew in the shared Hand order to Tired. If no Ready crew is available, add 1 Stress. |

After the Drift card is discarded and its effect resolves, each player readies their longest-Tired crew card that was already Tired at the start of the round. Crew that became Tired during this round, including from this Drift card, cannot be readied by this round-end step. If a player has no eligible Tired crew, that player readies nothing.

Last Verge holds round-end Drift cards in reserve. When that Gate begins, all held Drift cards resolve immediately before Ship Parts apply.

In solo, every turn is also a full round, so Drift resolves after each End turn press.

In multiplayer, the current turn player is the Mission Lead. Only the Mission Lead can draw decks, move table cards freely, trigger stack actions, choose Wake or Scout rewards, pass Gates, and end the turn. Other players can still commit their own Ready crew and Discovery cards by clicking or dragging a card out of their Hand area, and can remove their own committed cards from the board by clicking them or dragging them back to their Hand area.

Important: a Ship Part cannot help complete the Destination that created it. Ship Parts are available only after that Destination's completion fully resolves.

Important: crew-made water for Fuel payment requires exactly one Ready Engineer plus one Ready Scientist per Fuel. Those two crew cannot also satisfy Destination icons for that same completion, and they move to Tired with the other used crew.

## Immediate Benefits

Collect 1 Fuel draws 1 Fuel Cell from the Fuel Deck into play. It stacks onto the existing Fuel Supply if one is in play, otherwise it appears at the Fuel Supply setup position. Fuel rewards help the shared ship.

Wake 1 reveals up to 2 cards from the Cryo Deck. Choose 1 to recruit into the back of Tired, then Ready 1 crew from the front of the Tired row. Unchosen Cryo crew go to the bottom of the Cryo Deck. In multiplayer, the recruited crew belongs to the Mission Lead.

Scout N looks at the top N Missions cards. Choose the card you like to keep on top of Missions. The others are sent to the back in their revealed order. If Scout resolves after a Destination, complete the Scout choice before the turn continues; it does not draw the next 3-card Map offer automatically. Scout is skipped if it is earned when all 3 route slots are full, because no more Destinations can be traveled in that sector.

Ready 1 moves the front Tired crew card back to the Hand area. Ready rewards help the shared ship.

Next stop -1 Fuel creates a pending -1 Fuel discount for the next Destination completion in the current sector. It expires at Gate transition if unused.

## Gate Cards

Each sector Gate has two layers:

```text
1. Pass the Gate's basic requirements: crew slots, icons, and any Gate resolve costs.
2. Clear the Gate's clean-clear condition.
```

Passing the Gate is required. If you fail to pass, the ship loses at the Gate. Clearing the Gate cleanly is optional. If you pass but do not clear it, draw the top Damage card and leave it visible on the ship board for the rest of the run. Damage effects apply to all future rounds.

Gate requirements are two separate base checks: crew slots and required icons. Gate effects can add costs, block support, or change how those checks count.

| Gate | Slots | Icons | Effect at Resolve | Clear |
| --- | ---: | --- | --- | --- |
| Narrow Crossing | 3 | Engine, Life, Nav | None. Clean Gate. | Commit 1 crew beyond minimum. |
| Quiet Drift | 3 | Engine, Engine, Nav | First crew committed contributes 0 icons. | Commit 4+ crew total. |
| Old Pass | 3 | Nav, Life, Science | Engine-icon crew cost +1 Fuel each. | Commit 2+ Engineers. |
| Lost Beacon | 3 | Engine, Life, Nav | -1 slot capacity: need 1 extra crew. | Spend 2 MOTHER. |
| Dust Reach | 4 | Engine, Nav, Life | Discoveries cannot be played. | Have 0 Tired crew committed. |
| Cold Mirror | 4 | Engine, Engine, Life | Ship Part / Blueprint "ready Tired" effects blocked. | Commit 2+ Medics. |
| Echo Vault | 4 | Nav, Science, Life | MOTHER unusable. | Commit a Pilot. |
| Ash Belt | 4 | Engine, Engine, Nav | If Stress is 3+, +1 slot needed. | Stress = 0 at Resolve. |
| Black Threshold | 4 | Life, Life, Science | Each Blueprint that triggers adds 1 Stress. | Commit 2+ Scientists. |
| Hollow Span | 4 | Nav, Engine, Science | Ship Parts unusable. | Commit 5+ crew total. |
| Iron Shoal | 5 | Engine, Engine, Nav, Science | MOTHER cannot substitute for icons. | Commit 5 different crew roles. |
| Last Verge | 5 | Engine, Life, Nav, Science | All Drift cards held in reserve trigger before Resolve. | Commit 2+ crew of same role. |
| Drowned Comm | 5 | Engine, Life, Life, Nav | The leftmost committed crew has 1 icon ignored. | Commit a Recon and a Medic. |
| The Reach | 5 | Engine, Life, Nav, Science | One icon type chosen by the Mission Lead must be covered twice. | Commit 6+ crew total. |

### Damage Deck

The Damage deck is a standalone 12-card deck. If a Gate is passed but not cleared cleanly, draw the top Damage card automatically, leave it visible on the ship board, and apply it to all future rounds. Cards marked "(to be implemented)" are visible but have no active effect yet.

| Damage | Effect | Trigger |
| --- | --- | --- |
| Fractured Engine | Mission Engine costs +1 Fuel. | At each Mission attempt. |
| Frozen Sector | No Tired-to-Ready trickle at round end. | Each round end. |
| Comm Failure | Each MOTHER use costs +1 Fuel. | When MOTHER is spent. |
| Sensor Loss | Cannot peek anything. | Always. |
| Hull Crack | +1 Stress at each round end. | Each round end. |
| Crew Quarters Damaged | Discovery hand limit -1. (to be implemented) | Always. |
| Mission Lead Injured | Mission Lead may not commit a 4th crew per turn. (to be implemented) | Each turn. |
| Sealed Cargo | First Mission per sector gives no Discovery. | Each sector. |
| Stress Echo | Each MOTHER spend adds 1 extra Stress. | When MOTHER is spent. |
| Phantom Course | Sector Stops reveals 2 Missions instead of 3. | Each sector start. |
| Drift Loop | Drift flips happen 2x per round end. | Each round end. |
| Long Reach | All Mission Fuel costs +1. | At each Mission attempt. |

Gate resolution is confirmed from stack actions. Each sector Gate is dealt face up and remains visible. Available Ship Parts apply automatically when the Gate begins unless the Gate blocks them: Medbay Rehydrators ready Tired crew, Service Drone Bays scribble out crew slots, and Adaptive Control Consoles scribble out required icons. If the Gate is already started and a later optional Destination creates a Ship Part, the app applies that Ship Part before the Gate is passed if the Gate allows it. Then stack Ready crew, any required Gate Fuel, and usable MOTHER onto the Gate and click Pass Gate when the pass requirements are satisfied.

Gate resolution order:

1. Apply stacked Coolant Packs to clear Stress before the Gate scores.
2. Resolve any held Drift from Last Verge.
3. Apply any Medbay Rehydrators automatically to Ready Tired crew unless this Gate blocks ready-Tired effects.
4. Apply any Service Drone Bays automatically to fill crew slots.
5. Apply any Adaptive Control Consoles automatically to cover missing icons.
6. If Black Threshold is active, add 1 Stress for each Ship Part Blueprint that triggered.
7. Check Stress. If Ash Belt is active and Stress is 3 or more, add 1 red crew slot to the Gate.
8. Apply stacked Local Allies to skip extra Gate crew slots.
9. Commit Ready crew to fill all remaining crew slots.
10. Apply Gate icon changes such as Quiet Drift, Drowned Comm, and The Reach.
11. Check required icons shown by committed crew, including paired Crew-tag Discoveries.
12. Count already-applied Adaptive Control Consoles against missing Gate icons.
13. Spend MOTHER only for remaining missing non-Fuel icons if this Gate allows it.
14. If all crew slots are filled and all icons are shown or covered, the Gate is passed.
15. Check the Gate clear condition. If it is not cleared, draw the top Damage card and leave it on the ship board.
16. If the Gate pass requirements are not met, the ship fails at the Gate.

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
If Ash Belt is the active Gate and Stress is 3 or more, add 1 red crew slot.
Stress carries from Sector 1 to Sector 2.
```

## Valid Completion Stacks

A Destination completion stack can contain the Destination card, Ready crew, Fuel Cells, usable MOTHER cards, Crew-tag Discoveries paired with committed crew, and Mission-tag Discoveries stacked on that Destination. Crew paying Fuel must be valid Engineer + Scientist water pairs. Other card types block completion.

A Ship Part blueprint Destination can also be used as a temporary prep pile with Ready crew, Fuel Cells, and usable MOTHER before it is ready to complete.

A Gate completion stack can contain the Gate card, Ready crew, usable MOTHER cards, Crew-tag Discoveries paired with committed crew, and Gate-tag Discoveries stacked on that Gate. Fuel Cells are allowed only when the Gate or Damage requires Gate Fuel, such as Old Pass or Comm Failure; otherwise Fuel Cells and other card types block completion.

Completion never happens automatically, except automatic Ship Part Gate modifiers. When a stack satisfies an active requirement, an action button appears above that stack. Click the button to resolve the action.

The current stack actions are:

| Stack | Action |
| --- | --- |
| Engineer + Scientist | Draw 1 Fuel from the Fuel Deck; both crew move to Tired. |
| Ration Pack by itself | Use ration to draw 1 Fuel from the Fuel Deck to the Fuel Supply, then discard the Ration Pack. |
| Ready Destination payment | Travel to that Destination. |
| Ready Gate payment | Pass the Gate. |

## Sector Transition

After Gate 1 succeeds:

1. The Sector 1 route progress resets. Any unresolved visible Map Destinations are discarded. Immediate Benefit traveled Destinations leave the board; Ship Part Destination cards remain visible.
2. Ship Part Destination cards stay on the board. Unspent Ship Parts remain available; spent Ship Parts remain spent.
3. All Tired crew become Ready.
4. Fuel carries forward.
5. Stress carries forward.
6. If the Gate was not cleared cleanly, the drawn Damage remains visible and its effect carries forward.
7. The 9 Destinations are reshuffled for Sector 2 and placed in Missions titled after the next Gate.
8. Draw the next Gate from the Gate Deck, place it face up below Missions, and attempt it anytime.
9. The Sector 2 Map starts empty; click Missions to fill the Map.

After Gate 2 succeeds, the player wins.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. Missions draws one 3-card Map offer per turn when the Map is empty. The MOTHER Deck draws 1 card, stacking onto an existing usable MOTHER stack if one is in play or dealing next to the MOTHER Deck setup position otherwise. Scout can set the top card before a future Missions draw.

In multiplayer, you see only your own Hand and Tired areas. You can see each other player's total crew count plus Ready and Tired counts in the player panel.

Drag decks to reposition them. A deck can merge only with another deck containing the same card family, such as Fuel with Fuel or MOTHER with MOTHER.

Drag Ready crew and Discovery cards from the Hand area onto the board. Tired crew cannot be dragged manually unless an Immediate Benefit or Medbay Rehydrator readies them first.

Drag a card stack onto a highlighted valid target to combine it into a Destination, Gate, Ship Part blueprint prep pile, Discovery pairing, or temporary support stack of Ready crew, Fuel Cells, Engineer + Scientist water pairs, and usable MOTHER cards. Dragging from a card inside a stack splits that card and every card above it into a new moving stack. When a stack has an available action, click the button above it to confirm.

Drag visible traveled Ship Part Destination cards onto each other to stack them and organize board space. During the Gate, the app applies available Ship Parts automatically; no Gate stacking is required. Ship Part cards cannot be discarded.

Use the End turn button to start the next turn and refresh the once-per-turn Missions draw permission. Missions are drawn manually from the Missions deck; End turn no longer forces a Mission draw. On the final turn of a round, End turn draws and reveals Drift first; controls stay disabled until the Drift card discards, resolves, and each player readies their longest eligible Tired crew.

Drag an all-crew, all-Discovery, or mixed crew-and-Discovery stack back to the Hand area to return those cards to hand.

Off-turn multiplayer players cannot freely drag stacks, draw decks, use stack actions, or end the turn. They can click or drag one of their own Ready crew or Discovery cards to add it to the board, and click or drag one of their own crew or Discovery cards on the board to return it to their Hand area.

Drag a stack or Ready crew card to the discard zone to discard it. Gates, Damage, active Map Destinations, and visible traveled Ship Part Destinations cannot be discarded.

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

Solo: win by completing Gate 2.

Multiplayer scoring happens only if the ship survives:

```text
If the ship is stranded or any Gate fails: everyone loses.
If Gate 2 succeeds: count each player's owned crew.
Most crew wins.
```

Count both Ready and Tired crew. They survived. If crew totals tie, compare Blueprints built, then Ready crew. If still tied, the victory is shared.

Lose as Stranded in the Reach if no reachable Mission remains and the current Gate cannot be passed with available resources. This can happen when the Map is empty and Missions has no cards left, or when visible Map Destinations exist but none can be completed with available Fuel, Ready crew, crew-made water, and unused MOTHER, and the Gate is also out of reach.

Lose as The Gate cannot be passed if the current Gate cannot be completed with available Ship Parts, Ready crew cards, required Gate Fuel, and unused MOTHER cards for missing icons. Available Ship Parts include unspent parts carried from an earlier sector unless the Gate blocks Ship Parts. Unused MOTHER includes usable MOTHER cards in play plus cards still in the MOTHER Deck, subject to Gate and Damage restrictions.

There is no active Hull, health, sector field, score track, market, relic system, Research repair deck, or character progression in this prototype. Damage is active and permanent for the run.

## Player Aid

```text
CORE LOOP

Start each sector: read the face-up Gate. Either start the Gate now, or click Missions to draw optional Map Destinations. Draw a new Map offer at most once per turn.

1. If you want preparation, choose 1 of 3 Map Destinations.
2. Pay Fuel + icons.
   Engineer + Scientist = 1 water for Fuel.
3. Click Travel above the ready stack.
4. Move used crew to Tired.
5. Resolve the find.
   Immediate Benefit = resolve now.
   Ship Part = save; applies automatically at a Gate.
6. Earn 1 Discovery for the player whose crew committed most.
7. Keep Ship Part Destinations on the board; clear Immediate Benefit Destinations.
8. Discard the other Map Destinations.
9. End turn before drawing a new Map offer.
10. After the final player ends their turn, resolve 1 Drift card, then ready each player's longest-Tired crew that was already Tired at the start of the round.

DISCOVERIES

Crew tags pair with committed crew.
Mission tags stack on Destinations.
Gate tags stack on Gates.
Ration Pack drops by itself, then Use ration.

Gate anytime: pass the Gate to survive; clear it cleanly to avoid drawing permanent Damage.

SHIP PARTS

Medbay Rehydrator: ready 1 Tired crew.
Service Drone Bay: fill 1 crew slot, no icon.
Adaptive Control Console: cover 1 icon, no crew slot.
Unspent Ship Parts carry forward after a Gate.

MOTHER

MOTHER covers icons only.
MOTHER never fills crew slots.
Each spent MOTHER adds 1 Stress.
At 3+ Stress, Ash Belt adds 1 crew slot while it is the active Gate.

STUCK?

If no reachable Mission remains and the Gate cannot be passed, you lose as Stranded in the Reach.

MULTIPLAYER

Mission Lead takes the full turn.
Other players may only add or remove their own crew by click or drag.
Shared rewards help the ship.
Crew rewards join the Mission Lead.
Blueprints help everyone, but score for the Mission Lead who found them.
Any ship loss means everyone loses; only Gate 2 success scores crew.
```
