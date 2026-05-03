# Corebound Prototype User Manual

This manual describes the current single-sector Corebound board prototype. The app sets up the board automatically on load or restart, but the setup and rules below are written so a playtester can understand what was dealt, what each card type does, and how a complete run is supposed to flow.

## Objective

Complete Sector cards to travel through the Narrow Crossing, then clear the final Gate.

You win when the Gate is completed after the Sector deck has been exhausted and no Sector cards remain in play.

You lose if a drawn Sector proposal cannot be completed with the Fuel, Ready crew, crew fuel-pairing, and unused MOTHER cards available to you, or if the Gate cannot be completed once the Sector deck is finished.

## Starting Setup

The prototype uses one Gate, one Sector deck, one Fuel deck, one MOTHER deck, one Cryo deck, and two crew areas: Crew and Tired.

| Area | Cards | Setup |
| --- | ---: | --- |
| Fuel Supply | 3 Fuel Cell cards | Shuffle 12 Fuel Cells, deal the top 3 face up as the starting Fuel Supply. |
| Fuel Deck | 9 Fuel Cell cards | The remaining Fuel Cells stay in the Fuel Deck. Fuel rewards draw from here. |
| Starting Crew | 6 crew | Deal all starting crew to the Crew area as Ready crew. |
| Tired Crew | 0 crew | Starts empty. Crew used on Sectors or the Gate move here. |
| Sector Deck | 9 Sector cards | Shuffle all Sector cards. Draw 3 per Sector proposal. |
| Gate | 1 Gate card | Reveal Narrow Crossing face up at setup. |
| MOTHER Deck | 6 MOTHER cards | Place as a manual draw deck. Draws 1 card at a time. |
| Cryo Deck | 6 Cryo crew | Shuffle and keep as a reward-only deck. Wake rewards draw from here. |

Hull cards are not active in the current prototype.

## Starting Crew

Each crew card has two specialization icons. These icons satisfy matching Sector or Gate requirements, and unused crew can also be paired to pay Fuel.

| Crew | Icons |
| --- | --- |
| Lei Watanabe | Life, Star |
| Mara Voss | Engine, Engine |
| Ada Chen | Engine, Signal |
| Sana Iqbal | Life, Life |
| Juno Pike | Engine, Star |
| Nia Okonkwo | Signal, Star |

## Cryo Crew

Cryo crew enter the game through Wake rewards. The chosen crew joins Tired, not Ready.

| Crew | Icons |
| --- | --- |
| Ilya Rao | Star, Signal |
| Tomas Hale | Engine, Life |
| Elise Tan | Life, Signal |
| Oren Vale | Signal, Signal |
| Malik Ortega | Star, Star |
| Priya Shah | Life, Engine |

## Sector Cards

Sector cards are shuffled into the Sector Deck. A Sector proposal draws up to 3 Sector cards, then you choose one to complete and discard the other cards from that proposal.

| Sector | Type | Need | Reward |
| --- | --- | --- | --- |
| Dust Garden | Planet | Life, Star | Fuel +1 |
| Life Orchard | Planet | Fuel 1, Life, Engine | Ready 1 Tired crew |
| Cryo Choir | Star | Fuel 2, Life, Signal | Wake 1 crew |
| Sleeper Arklet | Star | Fuel 2, Life, Life, Star | Wake 1 crew |
| Iron Wake | Asteroid | Fuel 1, Engine, Engine | Fuel +1 |
| Red Salvage | Asteroid | Fuel 1, Engine, Signal | Fuel +1 |
| Broken Atlas | Asteroid | Signal, Signal | Scout 2 |
| Gravity Sling | Star | Fuel 2, Star, Engine | Next Star costs -1 Fuel |
| Quiet Relay | Planet | Fuel 1, Signal, Star | Scout 3 |

## Gate Card

The current prototype Gate is Narrow Crossing.

| Gate | Need | MOTHER Pressure |
| --- | --- | --- |
| Narrow Crossing | Engine, Life, Star, Signal, Any 1 | If 3 or more MOTHER cards have been spent during the run, the Gate needs +1 additional Any icon. |

The Gate can only be completed after the Sector deck is empty and no Sector cards remain in play.

## Core Concepts

### Ready And Tired Crew

Crew in the Crew area are Ready and can be sent to a Sector or the Gate.

Crew used to complete a Sector become Tired. Tired crew cannot be manually used until a reward readies them.

Ready rewards move crew from the front of the Tired row back into the Crew area. Crew spent on the Sector that grants the reward do not become Ready from that same reward.

### Requirements

Specific icons such as Life, Star, Engine, and Signal are paid by matching crew icons.

Any icons are paid by any unused crew icon.

Fuel requirements are paid by Fuel Cell cards, crew fuel-pairing, or crew plus MOTHER pairing.

At least 1 crew must be sent on every Sector or Gate completion.

### Crew Fuel-Pairing

Crew can help pay Fuel requirements after their required icons have been counted.

Two unused crew can pay 1 Fuel.

One unused crew plus one MOTHER can pay 1 Fuel.

MOTHER cannot pay Fuel by itself.

### MOTHER Cards

MOTHER is powerful but increases Gate pressure when spent.

A usable MOTHER card can cover 1 missing non-Fuel icon.

A usable MOTHER card can pair with 1 crew to pay 1 Fuel.

When a completion resolves, only the MOTHER cards needed for that completion are spent. Spent MOTHER cards stay in play as pressure markers, count toward the Gate penalty, and cannot be reused. Treat them as permanent pressure markers for the run.

Unused MOTHER cards in play return to the MOTHER Deck after a Sector or Gate completion.

### Valid Completion Stacks

A Sector completion stack can contain the Sector card, Ready crew, Fuel Cells, and usable MOTHER cards. Other card types block completion.

A Gate completion stack can contain the Gate card, Ready crew, and usable MOTHER cards. Fuel Cells and other card types block completion.

Completion happens automatically when a stack satisfies the active Sector or Gate requirement.

## Game Loop

1. Draw a Sector proposal.

Click or activate the Sector Deck to draw 3 Sector cards. If fewer than 3 cards remain, draw all remaining Sector cards.

If none of the drawn Sector cards can be completed with available Fuel, Ready crew, crew fuel-pairing, and unused MOTHER cards, the game immediately ends in a Sector loss.

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

Fuel +1 draws 1 Fuel Cell from the Fuel Deck into play.

Wake 1 reveals up to 2 cards from the Cryo Deck. Choose 1 to recruit into Tired; unchosen Cryo crew go to the bottom of the Cryo Deck.

Scout N looks at up to the next N Sector cards. Choose 1 to keep on top of the Sector Deck, then choose the order for the rest to go on the bottom.

Ready 1 moves the front Tired crew card back to the Crew area.

Next Star costs -1 Fuel creates a pending -1 Fuel discount. Prototype note: the card text labels this as a Star reward, while the current app displays the active discount on Sector requirements and consumes it on the next Sector completion.

5. Repeat until all Sector cards are gone.

Keep drawing proposals, completing one Sector from each proposal, and resolving rewards until the Sector Deck is empty and there are no Sector cards still in play.

6. Attempt the Gate.

After all Sectors are resolved, stack Ready crew and any needed usable MOTHER cards onto Narrow Crossing.

The Gate normally needs Engine, Life, Star, Signal, and Any 1. If 3 or more MOTHER cards have been spent by the time the Gate resolves, it also needs +1 additional Any icon.

If the Gate stack can pay its requirement, the ship arrives beyond the Narrow Crossing and you win.

If the Gate cannot be completed with the remaining Ready crew and unused MOTHER cards, the ship fails and you lose.

## Prototype Controls

Click a manual deck, or press Enter or Space while it is focused, to draw from it. The Sector Deck draws 3 cards. The MOTHER Deck draws 1 card. Fuel and Cryo decks draw only through rewards.

Drag Ready crew from the Crew area onto the board. Tired crew cannot be dragged manually.

Drag a card stack onto a highlighted valid target to combine it into a Sector or Gate completion stack. Dragging from a card inside a stack splits that card and every card above it into a new moving stack.

Drag an all-crew stack back to the Crew area to return those Ready crew to hand.

Drag a stack or Ready crew card to the discard zone to discard it. The Gate cannot be discarded.

Resolve Wake and Scout choice panels before taking more board actions.

Use Restart and reshuffle to start a fresh random run.

## Win And Loss Summary

Win by completing Narrow Crossing after all Sector cards are resolved.

Lose as Stranded in the Reach if a newly drawn Sector proposal has no completable Sector.

Lose as The Gate cannot be passed if all Sector cards are resolved and the remaining Ready crew plus unused MOTHER cards cannot satisfy the Gate. Unused MOTHER includes usable MOTHER cards in play plus cards still in the MOTHER Deck.

There is no active Hull, health, damage, or score track in this prototype.
