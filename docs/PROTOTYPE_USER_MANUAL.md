# Corebound Prototype User Manual

This manual describes the current two-sector solo Corebound board prototype. The app sets up the board automatically on load or restart, but the setup and rules below are written so a playtester can understand what was dealt, what each card type does, and how a complete run is supposed to flow.

## Objective

Complete 3 Sector cards in Sector 1, pass Narrow Crossing, then complete 3 Sector cards in Sector 2 and pass Dark Threshold.

You win when Dark Threshold is completed after the Sector 2 deck has been exhausted and no Sector cards remain in play.

You lose if no visible Sector can be completed and Emergency Refuel is not available, or if the current sector Gate cannot be completed once that sector deck is finished.

## Starting Setup

The prototype uses two sectors, one active Sector deck at a time, one Fuel deck, one MOTHER deck, one Cryo deck, and two crew areas: Crew and Tired.

On load or restart, setup is staged as an animated deal instead of cards snapping into place: the source decks appear first, then the starting Fuel Supply, starting Crew, and current Gate are dealt into their setup positions. After that animation, the playable counts match the table below.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 2 Fuel Cell cards | Shuffle 12 Fuel Cells, deal the top 2 face up as the starting Fuel Supply. |
| Fuel Deck | 10 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards and Emergency Refuel draw from here. |
| Starting Crew | 5 crew | Deal all starting crew to the Crew area as Ready crew. |
| Tired Crew | 0 crew | Starts empty. Crew used on Sectors, Gates, or Emergency Refuel move here. |
| Sector Deck | 9 Sector cards | Shuffle all Sector cards for Sector 1. Draw 3 per Sector proposal. |
| Gate | 1 Gate card | Reveal Narrow Crossing face up at setup. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Cryo Deck | 7 Cryo crew | Shuffle and keep as a reward-only deck. Wake rewards draw from here. |

Hull cards, Beacons, and Sector Fields are not active in the current prototype.

## Starting Crew

Each crew card has two specialization icons. These icons satisfy matching Sector or Gate requirements, and unused crew can also be paired to pay Fuel.

| Crew | Icons |
| --- | --- |
| Lei Watanabe | Life, Star |
| Mara Voss | Engine, Engine |
| Ada Chen | Engine, Signal |
| Sana Iqbal | Life, Life |
| Nia Okonkwo | Signal, Star |

## Cryo Crew

Cryo crew enter the game through Wake rewards. The chosen crew joins Tired, then the Wake reward readies 1 Tired crew from the front of the Tired row. Tired Cryo crew become Ready after Gate 1 if they are still Tired then.

| Crew | Icons |
| --- | --- |
| Juno Pike | Engine, Star |
| Tomas Hale | Engine, Life |
| Priya Shah | Life, Engine |
| Elise Tan | Life, Signal |
| Ilya Rao | Star, Signal |
| Oren Vale | Signal, Signal |
| Malik Ortega | Star, Star |

## Sector Cards

Sector cards are shuffled into the Sector Deck. A Sector proposal draws up to 3 Sector cards, then you choose one to complete and discard the other cards from that proposal.

Sector 2 reuses the same 9-card deck, reshuffled after Gate 1.

| Sector | Type | Need | Reward |
| --- | --- | --- | --- |
| Dust Garden | Planet | Life, Star | Fuel +1 |
| Life Orchard | Planet | Fuel 1, Life, Engine | Ready 1 Tired crew |
| Cryo Choir | Star | Fuel 2, Life, Signal | Wake 1 crew, then Ready 1 Tired crew |
| Sleeper Arklet | Star | Fuel 2, Life, Life, Star | Wake 1 crew, then Ready 1 Tired crew |
| Iron Wake | Asteroid | Fuel 1, Engine, Engine | Fuel +1 |
| Red Salvage | Asteroid | Fuel 1, Engine, Signal | Fuel +1 |
| Broken Atlas | Asteroid | Signal, Signal | Scout 2 |
| Gravity Sling | Star | Fuel 2, Star, Engine | Next Star costs -1 Fuel |
| Quiet Relay | Planet | Fuel 1, Signal, Star | Scout 3 |

## Gate Cards

| Gate | Timing | Need | MOTHER Pressure |
| --- | --- | --- | --- |
| Narrow Crossing | End of Sector 1 | 3 Ready crew cards showing Engine, Life, Star, and Signal among them | If 3 or more MOTHER cards have been spent during the run, also commit +1 additional crew card. MOTHER cannot satisfy crew-card requirements. |
| Dark Threshold | End of Sector 2 | 4 Ready crew cards showing Engine, Life, Star, and Signal among them | If 3 or more MOTHER cards have been spent during the run, also commit +1 additional crew card. MOTHER cannot satisfy crew-card requirements. |

A Gate can only be completed after its sector deck is empty and no Sector cards remain in play.

## Core Concepts

### Ready And Tired Crew

Crew in the Crew area are Ready and can be sent to a Sector, Gate, or Emergency Refuel.

Crew used to complete a Sector become Tired. Tired crew cannot be manually used until a reward or Gate transition readies them.

Ready rewards move crew from the front of the Tired row back into the Crew area. Crew spent on the Sector that grants the reward do not become Ready from that same reward.

After Gate 1, all Tired crew become Ready, including woken Cryo crew and crew spent at Gate 1.

### Requirements

Specific icons such as Life, Star, Engine, and Signal are paid by matching crew icons.

Gate crew-card requirements are paid with committed Ready crew cards. MOTHER can cover missing Gate icons, but it does not reduce the number of crew cards required.

Fuel requirements are paid by Fuel Cell cards or crew fuel-pairing.

At least 1 human crew must be sent on every Sector completion if MOTHER is used. Gates require their listed number of crew cards. MOTHER cannot count as crew.

### Crew Fuel-Pairing

Crew can help pay Fuel requirements after their required icons have been counted.

Two unused crew can pay 1 Fuel.

MOTHER cannot pay Fuel during normal Sector completion.

### MOTHER Cards

MOTHER is powerful but increases Gate pressure when spent.

A usable MOTHER card can cover 1 missing non-Fuel icon.

MOTHER cannot pay Fuel, cannot count as crew, and cannot satisfy Gate crew-card requirements.

MOTHER can only help a Sector or Gate completion if at least 1 human crew is committed.

When a completion resolves, only the MOTHER cards needed for that completion are spent. Spent MOTHER cards stay in play as pressure markers, count toward Gate penalties, and cannot be reused. Treat them as permanent pressure markers for the run.

Unused MOTHER cards in play return to the MOTHER Deck after a Sector or Gate completion.

### Emergency Refuel

Emergency Refuel is a stuck-state tool, not a normal way to stockpile Fuel.

You may Emergency Refuel only if no visible Sector can be completed and all visible Sector cards cost more Fuel than the ship currently has.

To Emergency Refuel, commit either:

- 2 Ready crew, at least one with Engine or Star.
- 1 Ready crew with Engine or Star plus 1 MOTHER.

Gain Fuel +1 from the Fuel Deck. The new Fuel Cell stacks onto the existing Fuel Supply if one is in play, otherwise it appears at the Fuel Supply setup position.

Committed crew become Tired. Used MOTHER is spent and counts toward Gate pressure.

You may repeat Emergency Refuel only while no visible Sector is reachable. You cannot Emergency Refuel just because you want more Fuel.

### Valid Completion Stacks

A Sector completion stack can contain the Sector card, Ready crew, Fuel Cells, and usable MOTHER cards. Other card types block completion.

A Gate completion stack can contain the Gate card, Ready crew, and usable MOTHER cards. Fuel Cells and other card types block completion.

An Emergency Refuel stack can contain only the committed Ready crew and optional usable MOTHER.

Completion or Emergency Refuel happens automatically when a stack satisfies the active requirement.

## Game Loop

1. Draw a Sector proposal.

Click or activate the Sector Deck to draw 3 Sector cards. If fewer than 3 cards remain, draw all remaining Sector cards.

If none of the visible Sector cards can be completed and Emergency Refuel is not available, the game immediately ends in a Sector loss.

2. Choose one Sector to complete.

Pick one of the drawn Sector cards. Stack Ready crew, Fuel Cells, and MOTHER cards onto it until the requirements can be paid.

The normal playtest sequence is to resolve one 3-card proposal before drawing the next proposal.

3. Complete the Sector.

When the selected Sector stack is valid, the prototype resolves it automatically.

The completed Sector and spent Fuel are discarded.

Crew used on the Sector move to Tired.

Required MOTHER cards become spent pressure markers.

Unused MOTHER cards in play return to the MOTHER Deck.

The other Sector cards from the same proposal are discarded.

4. Resolve rewards.

Rewards happen immediately. Some rewards create a choice panel that must be finished before play continues.

Fuel +1 draws 1 Fuel Cell from the Fuel Deck into play. It stacks onto the existing Fuel Supply if one is in play, otherwise it appears at the Fuel Supply setup position.

Wake 1 reveals up to 2 cards from the Cryo Deck. Choose 1 to recruit into Tired, then Ready 1 Tired crew from the front of the Tired row; unchosen Cryo crew go to the bottom of the Cryo Deck.

Scout N looks at up to the next N Sector cards. Select the cards you do not like to send to the back of the Sector Deck; the single unselected card stays on top.

Ready 1 moves the front Tired crew card back to the Crew area.

Next Star costs -1 Fuel creates a pending -1 Fuel discount for the next Sector completion in the current sector. It expires at Gate transition if unused.

5. Repeat until the sector deck is gone.

Keep drawing proposals, completing one Sector from each proposal, and resolving rewards until the Sector Deck is empty and there are no Sector cards still in play.

6. Attempt the sector Gate.

After all Sector cards are resolved, stack Ready crew and any needed usable MOTHER cards onto the current Gate.

Gate 1 normally needs 3 Ready crew cards showing Engine, Life, Star, and Signal among them. Gate 2 normally needs 4 Ready crew cards showing Engine, Life, Star, and Signal among them. If 3 or more MOTHER cards have been spent by the time a Gate resolves, it also requires +1 additional crew card.

If Gate 1 is completed, all Tired crew become Ready, Fuel carries forward, spent MOTHER stays spent, unused MOTHER returns to the MOTHER Deck, Sector 2 is revealed, and the same 9-card Sector deck is reshuffled.

If Gate 2 is completed, you win.

If the current Gate cannot be completed with the remaining Ready crew and unused MOTHER cards, the ship fails and you lose.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. The Sector Deck draws 3 cards. The MOTHER Deck draws 1 card, stacking onto an existing usable MOTHER stack if one is in play or dealing next to the MOTHER Deck setup position otherwise. Fuel and Cryo decks draw only through rewards or Emergency Refuel.

Drag Ready crew from the Crew area onto the board. Tired crew cannot be dragged manually.

Drag a card stack onto a highlighted valid target to combine it into a Sector, Gate, Emergency Refuel, or temporary all-crew stack. Dragging from a card inside a stack splits that card and every card above it into a new moving stack.

To Emergency Refuel, stack either 2 valid Ready crew together or stack 1 valid Ready crew with 1 usable MOTHER while no visible Sector is reachable.

Drag an all-crew stack back to the Crew area to return those Ready crew to hand.

Drag a stack or Ready crew card to the discard zone to discard it. Gates cannot be discarded.

Resolve Wake and Scout choice panels before taking more board actions.

Use Restart and reshuffle to start a fresh random run.

## Win And Loss Summary

Win by completing Dark Threshold after Sector 2 is resolved.

Lose as Stranded in the Reach if no visible Sector can be completed and Emergency Refuel is not available.

Lose as The Gate cannot be passed if the current sector Gate cannot be completed with the remaining Ready crew cards plus unused MOTHER cards for missing icons. Unused MOTHER includes usable MOTHER cards in play plus cards still in the MOTHER Deck.

There is no active Hull, health, damage, Beacon, Sector Field, or score track in this prototype.
