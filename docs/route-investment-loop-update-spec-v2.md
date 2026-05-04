# Route Investment Loop Update Spec V2

## Status

Draft v2 for review. This replaces the first draft's passive flip benefits with simpler, target-based Route Aids and resolves the Gate, soft-lock, timing, and promise-fit issues listed in `docs/route-investment-loop-update-feedback-checklist.md`.

## Source Context

This spec builds on:

- Current rules in `docs/PROTOTYPE_USER_MANUAL.md`
- Design goals in `docs/game-design-principles.md`
- Feedback checklist in `docs/route-investment-loop-update-feedback-checklist.md`

## Design Thesis

Emotional promise:

```text
In each sector, the player feels like a desperate navigator charting a 3-stop route to survive the Gate by spending visited places as tactical aids under crew, Fuel, and MOTHER pressure.
```

This is intentionally a sector-scale mechanic, not a run-long relic system. Fuel, crew growth, and MOTHER pressure already carry across sectors. Route Aids are local preparation for the current Gate.

V2 keeps the core loop small:

```text
Reveal persistent map -> choose a Destination -> commit cards -> optionally spend one Route Aid -> resolve -> change state -> refill or face the Gate.
```

## Design Goals

1. Make completed Destinations remain tactically meaningful until the sector Gate resolves.
2. Make Route benefits tactile and legible through clear board targets instead of passive memory triggers.
3. Preserve the conservative first implementation: one default Route Aid per Destination type.
4. Add a non-Star stuck-state release valve for the persistent map.
5. Make the Gate the cash-out moment for the Route without adding set bonuses or long-run progression.

## Non-Goals

Do not add unique per-card Route benefits in v2.

Do not add route-set bonuses such as `2 Planets reduce Gate need` in v2.

Do not add a run-long relic, tech tree, score track, market, or character progression layer in v2.

Do not make players remember whether a benefit is available. Availability must be visible on the Route card.

Do not let Route Aids become generic stored resources. They should change timing, requirements, risk, or payment pressure.

## Key Terms

Destination Map:

```text
The up-to-3 visible unvisited Destination cards for the current sector.
```

Sector Route:

```text
The 3 visited Destination slots for the current sector.
```

Route Aid:

```text
The single-use tactical effect on a face-up visited Destination in the Sector Route.
```

Route Archive:

```text
The spent history of completed sectors. In v2 this is visual history only and has no mechanical carryover.
```

## Updated Core Loop

```text
1. Reveal Destinations until the Destination Map has up to 3 visible cards.
2. Choose and complete 1 visible Destination.
3. Move the completed Destination to the next Sector Route slot face up.
4. Resolve its Visit Reward.
5. If fewer than 3 Route slots are filled, refill only the emptied map slot.
6. Use face-up Route Aids at useful timing windows by stacking/clicking them onto eligible targets.
7. After the third Route slot is filled, clear the remaining Destination Map, set aside undealt Sector deck cards, and attempt the Gate.
8. Face-up Route Aids may still be spent during the Gate if their Gate use has a valid target.
9. After the Gate resolves, archive the Sector Route and expire all unspent Route Aids.
```

Old feeling:

```text
What can I afford right now?
```

New target feeling:

```text
Which 3-stop route gets me through this Gate, and which aid am I saving for the moment that matters?
```

## Destination Map Rule

There are always up to 3 visible unvisited Destinations while a sector is active and fewer than 3 Route slots are filled.

When the player completes a visible Destination, that Destination leaves the map and moves to the Sector Route.

Only the emptied map slot refills. Other visible Destinations remain available.

After the third Route slot is filled, do not refill the emptied slot. Clear all remaining visible unvisited Destinations and set aside all undealt cards remaining in the active Sector deck as unvisited sector cards, then begin the Gate phase. These unvisited cards cannot be drawn or affected by Route Aids during the Gate.

At the next sector setup, follow that sector's setup rule for building and shuffling its Destination deck.

If the Sector deck is empty when a refill is needed, the map simply has fewer than 3 visible Destinations. The sector continues until 3 Route slots are filled, a Gate begins, or the player reaches a loss state.

If fewer than 3 Route slots are filled, the Sector deck is empty, and no visible Destination can be completed or rerouted, the sector is lost.

## Sector Route Rule

Each sector has 3 Route slots.

When a Destination is completed, move it to the next Route slot face up.

A face-up Route card has one available Route Aid.

A Destination's Route Aid becomes available only after that Destination completion and its Visit Reward fully resolve. A Route Aid cannot affect the completion that created it.

When a Route Aid is used, return the card to its Route slot face down. The face-down side still shows Destination name and type shape/icon.

Face-up Route Aids remain available through the Gate phase.

After the Gate resolves, move all Route cards to the Route Archive. Unspent Route Aids expire at that moment.

The Route Archive is visible history only in v2. It does not create future bonuses.

## Route Aid Use Rule

A Route Aid is used by targeting the face-up Route card at an eligible board object.

Digital implementation may support either drag-stacking or click-targeting, but the rule should teach as:

```text
Stack a face-up Route card onto the thing it is helping. Resolve the aid, then flip the Route card face down.
```

Eligible targets are intentionally narrow:

| Type | Normal Sector Target | Gate Target |
| --- | --- | --- |
| Planet | A Destination completion stack with committed crew | A Tired crew card before Gate payment |
| Asteroid | A Destination completion stack with printed Fuel need 1 or more | The Gate card when MOTHER pressure is active |
| Star | The Sector deck during a map refill or Emergency Reroute | The Gate card when a non-Fuel icon is missing |

If there is no valid target, the Route Aid cannot be used. It does not flip and does not fizzle.

## Timing And Limits

Route Aids must be declared before the affected step resolves.

For Destination completions, a valid stack should enter a brief completion-preview state only if at least one face-up Route Aid can legally affect it with a non-zero effect. The player may spend up to 1 eligible Route Aid, then resolve. If no Route Aid can affect the stack, existing auto-resolution can remain.

For map refills, pause before dealing the replacement card only if a Star Route Aid is available and at least 2 Sector deck cards remain. The player may spend 1 Star Aid or skip it.

For Emergency Reroute, pause before dealing the replacement card only if a Star Route Aid is available and at least 2 undealt Sector deck cards were available before the replaced Destination was moved. The player may spend 1 Star Aid or take the top card normally.

For the Gate, there are three separate timing windows:

```text
1. Gate approach: Planet may Ready 1 Tired crew.
2. Gate pressure check: Asteroid may ignore the MOTHER pressure crew penalty for this Gate.
3. Gate icon payment: Star may cover 1 missing non-Fuel icon without spending MOTHER.
```

At most 1 Route Aid can be used in each timing window.

This means:

- At most 1 Route Aid can affect a single Destination completion.
- At most 1 Star Aid can affect a single map refill or Emergency Reroute.
- At most 1 Planet, 1 Asteroid, and 1 Star can affect a single Gate.
- Extra same-type Route Aids remain face up but cannot be stacked into the same timing window.

This cap prevents three identical benefits from deleting pressure while still letting a varied Route cash out at the Gate.

## Default Route Aids

Use the same Route Aid for all Destinations of the same type in v2.

| Type | Route Aid | Normal Sector Use | Gate Use | Why It Works |
| --- | --- | --- | --- | --- |
| Planet | Shelter | Stack on a Destination completion before resolution. Choose exactly 1 committed crew. That crew does not become Tired from this completion. | Stack on 1 Tired crew before Gate payment. Ready that crew. | Preserves crew tempo and lets Planet routes turn prior exhaustion into Gate readiness. |
| Asteroid | Patch | Stack on a Destination completion with printed Fuel need 1 or more before Fuel is paid. Reduce the Fuel need by 1 for this completion, minimum 0. | Stack on the Gate during the pressure check. If MOTHER pressure would add +1 crew, ignore that +1 crew for this Gate only. | Changes payment pressure and lets Asteroid routes absorb risky MOTHER use without refunding resources. |
| Star | Chart | Stack on the Sector deck during a map refill or Emergency Reroute when at least 2 undealt Sector cards are available. Look at the top 2 Sector cards, choose 1 to enter the map slot, and put the other on the bottom. | Stack on the Gate during icon payment. Cover 1 missing non-Fuel icon without spending MOTHER. Gate crew-card count must still be met. | Gives foresight and rule-bending without making early Star always the obvious immediate map reset. |

## Invalid Target Details

Planet Shelter cannot be used on a Destination completion with no committed crew that would become Tired.

Planet Shelter cannot be used at the Gate if there are no Tired crew.

Asteroid Patch cannot be used on a Destination with printed Fuel need 0.

Asteroid Patch cannot be used at the Gate if the MOTHER pressure penalty is not active.

Star Chart cannot be used for map refill or Emergency Reroute if fewer than 2 undealt Sector deck cards are available to choose from.

Star Chart cannot be used at the Gate if no non-Fuel icon is missing after committed Ready crew are counted.

No Route Aid can be used after its affected completion, refill, reroute, or Gate timing window has resolved.

## Emergency Reroute

The persistent map needs a release valve that does not require already having a Star Route Aid.

Emergency Reroute is a stuck-state tool, not a normal optimization action.

The player may Emergency Reroute only if no visible Destination can currently be completed using available Ready crew, Fuel, and usable MOTHER currently in play. Do not require the player to spend saved Route Aids to prove they are stuck.

To Emergency Reroute:

```text
1. Spend 1 usable MOTHER card as pressure.
2. Choose 1 visible Destination.
3. Put that Destination on the bottom of the Sector deck.
4. Reveal the top Sector deck card into that map slot.
```

Emergency Reroute requires 1 usable MOTHER already in play. If none is in play, the player may draw MOTHER normally, then recheck whether Emergency Reroute is available.

If the Sector deck has no cards before the chosen visible Destination is moved, Emergency Reroute cannot be used.

If a Star Route Aid is face up and at least 2 undealt Sector deck cards are available, it may be spent during Emergency Reroute to choose the replacement from the top 2 Sector cards instead of taking the top card blindly. For Emergency Reroute with Star Chart, first set the chosen visible Destination aside, then look at the top 2 undealt Sector deck cards, choose 1 for the map slot, put any unchosen looked-at card on the bottom, then put the set-aside Destination on the bottom.

Emergency Reroute does not count as a visited Destination and does not refill the Route.

Emergency Refuel remains available under the current manual's restriction. Emergency Reroute covers broader map/icon locks; Emergency Refuel covers fuel-only locks.

## Gate Interaction

The Gate is the cash-out test for the Sector Route.

After the third Destination is completed:

```text
1. Move the third Destination to the Route face up.
2. Resolve its Visit Reward.
3. Do not refill the map.
4. Clear remaining visible unvisited Destinations and set aside undealt Sector deck cards.
5. Begin the Gate phase.
```

Face-up Route Aids may be used at the Gate only in their listed Gate timing window.

Gate timing order:

```text
1. Planet window: Ready 1 Tired crew, if a Planet Aid is spent.
2. Gate requirement preview: calculate required crew-card count, required icons, available Ready crew, usable MOTHER, and active MOTHER pressure.
3. Asteroid window: ignore active MOTHER pressure +1 crew for this Gate, if an Asteroid Aid is spent.
4. Commit Ready crew to meet the final crew-card count.
5. Star window: cover 1 missing non-Fuel icon without spending MOTHER, if a Star Aid is spent.
6. Commit and spend MOTHER only for any remaining missing non-Fuel icons.
7. Resolve Gate success or loss.
8. Archive the Sector Route and expire unspent Route Aids.
```

MOTHER pressure markers are not removed by Asteroid Patch. The patch only ignores the current Gate's +1 crew penalty.

Star Chart cannot reduce the number of crew cards required by the Gate. It only covers one missing icon after the crew-card count is satisfied.

Planet Shelter used at the Gate readies crew before Gate payment. It does not create extra crew after the Gate resolves.

## Sector Transition

After Gate 1 is completed:

```text
1. Archive the Sector 1 Route cards as visited history.
2. Clear Route slots for Sector 2.
3. Expire any unspent Sector 1 Route Aids.
4. All Tired crew become Ready, as in the current rules.
5. Fuel carries forward, as in the current rules.
6. Spent MOTHER pressure carries forward, as in the current rules.
7. Reveal the Sector 2 Destination Map.
```

This keeps the first implementation focused. If playtests show players strongly expect route history to matter across sectors, test a single small archive rule later. Do not add it in v2.

## Impact On Existing Cards

Current Visit Rewards can remain unchanged for the first implementation. V2 tests whether type identity can be carried by Route Aids before tuning individual rewards.

| Destination | Type | Current Visit Reward | V2 Route Aid |
| --- | --- | --- | --- |
| Dust Garden | Planet | Fuel +1 | Planet Shelter |
| Life Orchard | Planet | Ready 1 Tired crew | Planet Shelter |
| Cryo Choir | Star | Wake 1 crew, then Ready 1 Tired crew | Star Chart |
| Sleeper Arklet | Star | Wake 1 crew, then Ready 1 Tired crew | Star Chart |
| Iron Wake | Asteroid | Fuel +1 | Asteroid Patch |
| Red Salvage | Asteroid | Fuel +1 | Asteroid Patch |
| Broken Atlas | Asteroid | Scout 2 | Asteroid Patch |
| Gravity Sling | Star | Next Star costs -1 Fuel | Star Chart |
| Quiet Relay | Planet | Scout 3 | Planet Shelter |

Known tuning risk:

```text
Gravity Sling already creates route-shaping through its Visit Reward. If Gravity Sling plus Star Chart becomes too correct, tune Gravity Sling after playtesting rather than creating a one-card exception in v2.
```

## UI Requirements

The board needs:

- A persistent Destination Map with up to 3 visible unvisited cards.
- A Sector Route area with 3 slots.
- Face-up Route cards that clearly read as available.
- Face-down Route cards that clearly read as spent but still show name and type.
- A clear Gate phase state after the third Route slot fills.

Route Aid targeting should be legible:

- Highlight Planet Route cards only during eligible Destination completion previews or the Gate approach window when Tired crew exist.
- Highlight Asteroid Route cards only during eligible Fuel-cost Destination completion previews or the Gate pressure window when MOTHER pressure is active.
- Highlight Star Route cards only during map refill or Emergency Reroute when at least 2 undealt Sector deck cards are available, or during the Gate icon-payment window when an icon is missing.
- Do not highlight Route Aids that have no valid target.
- Do not pause for a Route Aid window unless at least one Aid has a legal non-zero effect in that window.
- Show a short preview of the effect before the player confirms or drops the card.

Playtest log examples:

```text
Dust Garden moved to Route slot 1 with Planet Shelter available.
Dust Garden Shelter used: Lei Watanabe remains Ready.
Iron Wake Patch used: Fuel need reduced by 1.
Gravity Sling Chart used: chose Broken Atlas for the map; Sleeper Arklet moved to bottom.
Red Salvage Patch used at Gate: ignored MOTHER pressure crew penalty for Narrow Crossing.
Cryo Choir Chart used at Gate: covered missing Signal without spending MOTHER.
Emergency Reroute: spent usable MOTHER pressure to replace Life Orchard with Iron Wake.
```

## Rules Text Draft

This text can be adapted into `docs/PROTOTYPE_USER_MANUAL.md` after the mechanic is accepted.

```text
Destination Map

Keep up to 3 Destinations visible while a sector is active. When you complete one visible Destination, move it to your Route and refill only that empty map slot. The other visible Destinations remain available. After your third visited Destination in a sector, do not refill the map; clear remaining visible unvisited Destinations, set aside undealt Sector deck cards, and attempt the Gate.

Sector Route

Each sector has 3 Route slots. When you complete a Destination, move it to the next Route slot face up. Its Route Aid becomes available only after that completion and its Visit Reward fully resolve. A face-up Route card has one Route Aid. To use a Route Aid, stack the face-up Route card onto its valid target. Resolve the aid, then flip that Route card face down. Face-up Route Aids remain available until the sector Gate resolves, then expire.

Route Aids

Planet Shelter: During a Destination completion, choose exactly 1 committed crew; that crew does not become Tired. At the Gate, Ready 1 Tired crew before Gate payment.

Asteroid Patch: During a Destination completion with printed Fuel need 1 or more, reduce the Fuel need by 1 for this completion. At the Gate, if MOTHER pressure would add +1 required crew, ignore that +1 crew for this Gate only.

Star Chart: During a map refill or Emergency Reroute with at least 2 undealt Sector deck cards, look at the top 2 Sector cards, choose 1 to enter the map slot, and put the other on the bottom. At the Gate, cover 1 missing non-Fuel icon without spending MOTHER. The Gate crew-card count must still be met.

Gate Aid Timing

At the Gate, resolve Route Aid windows in this order: Planet may Ready 1 Tired crew; preview Gate requirements and active MOTHER pressure; Asteroid may ignore the MOTHER pressure +1 crew requirement; commit Ready crew to meet the final crew-card count; Star may cover 1 missing non-Fuel icon; then spend MOTHER only for any remaining missing non-Fuel icons.

Emergency Reroute

If no visible Destination can be completed using current Ready crew, Fuel, and usable MOTHER in play, and the Sector deck has at least 1 card, you may spend 1 usable MOTHER as pressure to replace 1 visible Destination with the top card of the Sector deck. Put the replaced Destination on the bottom first. If a Star Chart is available and at least 2 undealt Sector deck cards are available, set the replaced Destination aside instead, choose the replacement from the top 2 undealt Sector cards, put the unchosen looked-at card on the bottom, then put the set-aside Destination on the bottom.
```

## Implementation Notes

Likely data model changes:

```text
Add Destination Map slots instead of temporary proposals.
Add current-sector Route slots with available/spent status.
Keep completed Destinations in Route until Gate archive.
Track Gate phase timing windows for Planet, Asteroid, and Star Route Aids.
Add Emergency Reroute action and playtest log event.
Add Route Aid use actions and playtest log events.
```

Likely rules changes:

```text
Sector Gate begins after 3 Route slots are filled, not after the Sector deck is exhausted.
Unchosen visible Destinations persist until completed, rerouted, or cleared at Gate phase.
After the third Destination completion, remaining visible Destinations and undealt Sector deck cards are set aside, and the map is not refilled.
Route Aids remain available through Gate resolution, then expire.
At most 1 Route Aid can affect a Destination completion, map refill, Emergency Reroute, or individual Gate timing window.
```

Potential affected files:

```text
src/game/types.ts
src/game/setup.ts
src/game/rules.ts
src/game/effects.ts
src/game/state.ts
src/game/logEvents.ts
src/board/boardUpdaters.ts
src/App.tsx
src/components/*
src/App.css
docs/PROTOTYPE_USER_MANUAL.md
```

## Playtest Questions

Ask these during tests:

```text
What are you deciding between right now?
Which Route Aid are you saving, and why?
Did your third visited Destination matter at the Gate?
Did the Gate feel like a test of the route you built?
Did any Route Aid feel like a delayed resource instead of a tactical aid?
Was it obvious which Route Aids were available and which were spent?
Was it obvious why a Route Aid was or was not highlighted?
Did Emergency Reroute feel like a rescue valve or an optimal normal action?
Did Star Chart feel worth saving, or did you always spend it immediately?
Did Asteroid Patch feel useful outside simple Fuel math?
Did Planet Shelter create a meaningful crew-tempo decision?
Did the persistent map reduce helpless randomness?
Did the added Route choices slow turns too much?
```

## Success Criteria

The update is working if playtesters say things like:

```text
I saved that Planet because I knew the Gate needed one more Ready crew.
I took the Asteroid because I was planning to spend MOTHER and patch the Gate pressure later.
I held the Star Chart for the final refill instead of using it immediately.
I rerouted because I was stuck, but I did not want the extra MOTHER pressure.
I can see what my route is preparing me for.
```

The update is not working if playtesters still say:

```text
I just picked the only card I could afford.
I forgot what my visited cards do.
I always use the benefit immediately.
The third Route card did not matter.
The Gate had nothing to do with my route.
Emergency Reroute is always correct.
All Destination types feel the same.
```

## Verification Against Feedback Checklist

| ID | Result | V2 Response |
| --- | --- | --- |
| B1 | Addressed | Route Aids are used by stacking/click-targeting a face-up Route card onto a narrow eligible target. |
| B2 | Addressed | Planet, Asteroid, and Star each have explicit Gate uses and timing windows. |
| B3 | Addressed | The third Route card can matter because face-up Aids remain usable during the Gate. |
| B4 | Addressed | Emergency Reroute gives a non-Star stuck-state release valve at the cost of MOTHER pressure. |
| B5 | Addressed | Gate starts after 3 Route slots; remaining map cards and undealt deck cards are set aside as unvisited sector cards. |
| B6 | Addressed by reframing | V2 defines this as sector preparation, not run-long relic progression. Archive is visual only. |
| B7 | Addressed | Star changes from visible replacement before choosing to peek-2-choose-1 during refill/reroute, plus a Gate use. |
| B8 | Addressed | Asteroid reduces printed Fuel need by 1 and has a clear Gate pressure use. No ambiguous "Fuel was spent" trigger. |
| B9 | Addressed | V2 adds completion-preview/refill/Gate timing windows before resolution. |
| B10 | Addressed | V2 caps Route Aid use by timing window and states exact Gate windows. |
| R1 | Addressed | Planet changes readiness timing/preservation; Asteroid changes requirements/pressure; neither simply grants resources. |
| R2 | Addressed | Existing rewards remain for first test; reward/type conflicts are explicitly deferred tuning. |
| R3 | Addressed as scoped risk | Homogeneous route depth is flagged for playtest; set bonuses stay out of v2. |
| R4 | Addressed | UI highlights only currently eligible Route Aids and hides invalid ones. Timing windows cap simultaneous decisions. |
| R5 | Addressed as tuning risk | Gravity Sling double-route value is called out without adding exceptions. |
| T1 | Addressed | Planet wording consistently says choose exactly 1 committed crew for Destination use. |
| T2 | Addressed | Invalid target details specify when each Aid cannot be used. |
| T3 | Addressed | Empty-deck refill and sector-loss cases are defined. |
| T4 | Addressed | Gate interaction is explicit by type and timing window. |
| T5 | Addressed | Face-up Aids remain available through Gate resolution and expire on archive. |
| S1 | Preserved | Visit Reward and Route Aid remain separate outputs. |
| S2 | Preserved | Face-up available and face-down spent remain the visual model. |
| S3 | Preserved | One default Aid per Destination type. |
| S4 | Preserved | No set bonuses in v2. |
| S5 | Expanded | Playtest questions now cover Gate payoff, reroute, timing clarity, and overhead. |
| P1 | Addressed | V2 states a sector-scale emotional promise and aligns mechanics to it. |
| P2 | Addressed | Core loop remains reveal -> choose -> commit -> resolve -> change state -> pressure. |
| P3 | Addressed | Route cards now act as protect/filter/patch/rule-bend verbs. |
| P4 | Addressed | Aids interact with crew readiness, Fuel need, and MOTHER pressure. |
| P5 | Addressed | Emergency Reroute and Star Chart provide randomness mitigation. |
| P6 | Addressed | Aids synergize with state but same-window stacking is capped. |
| P7 | Addressed | UI and log requirements focus on eligible targets and clear outcomes. |
| P8 | Addressed | The visible map, Route slots, and Gate preview create a 2-3 turn sector plan. |
| P9 | Addressed | Effects can be tuned by target, timing, caps, and pressure cost. |
| P10 | Addressed | Stack/click targeting plus highlights teach the first Route Aid use. |

## Recommended First Implementation

Implement the smallest complete version:

```text
Persistent 3-Destination map.
Three current-sector Route slots.
Completed Destinations move to Route face up.
Face-up Route cards can be spent once as type-based Route Aids.
Route Aids use target-based stack/click timing.
Each type has one normal sector use and one Gate use.
Emergency Reroute exists only as a stuck-state valve.
Gate starts after the third Route slot fills.
Route Aids expire after the sector Gate resolves.
Playtest log records Route movement, Route Aid use, Emergency Reroute, and archive.
```

Do not implement unique per-card Route Aids in the first pass.

Do not implement route-set Gate bonuses in the first pass.

Do not implement cross-sector archive bonuses in the first pass.

Do not add new Destination cards until the changed loop has been tested.
