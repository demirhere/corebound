# Route Investment Loop Update Spec V3

## Status

Draft v3 for review. This keeps the v2 rules shape intact but changes the fiction, naming, and table language: each completed Destination yields a single-use Found Upgrade, represented as a chamber, fix, or addon recovered along the route and installed into the ship for the current sector.

Mechanical deltas from v2 should be treated as accidental unless explicitly called out. V3 is mainly a content, story, naming, and theme pass.

## Source Context

This spec builds on:

- Current rules in `docs/PROTOTYPE_USER_MANUAL.md`
- Design goals in `docs/game-design-principles.md`
- Feedback checklist in `docs/route-investment-loop-update-feedback-checklist.md`
- Prior draft in `docs/route-investment-loop-update-spec-v2.md`

## Design Thesis

Emotional promise:

```text
In each sector, the player feels like a desperate navigator plotting a 3-stop salvage route to bolt enough recovered ship improvements onto the vessel to survive the Gate under crew, Fuel, and MOTHER pressure.
```

This is intentionally a sector-scale mechanic, not a run-long relic system. Fuel, crew growth, and MOTHER pressure already carry across sectors. Found Upgrades are local field installations for the current Gate.

V3 keeps the core loop small:

```text
Reveal persistent map -> choose a Destination -> commit cards -> optionally spend one already-installed Found Upgrade -> resolve -> install the new find -> change state -> refill or face the Gate.
```

## Design Goals

1. Make completed Destinations remain tactically meaningful until the sector Gate resolves.
2. Make Destination benefits tactile and legible by turning them into visible ship parts with clear board targets.
3. Preserve the conservative first implementation: one default Found Upgrade per Destination type.
4. Add a non-Star stuck-state release valve for the persistent map.
5. Make the Gate the cash-out moment for the ship kit assembled during the route without adding set bonuses or long-run progression.

## Non-Goals

Do not add unique per-card Found Upgrades in v3.

Do not add route-set bonuses such as `2 Planets reduce Gate need` in v3.

Do not add a run-long relic, tech tree, score track, market, or character progression layer in v3.

Do not make players remember whether a Found Upgrade is available. Availability must be visible on the visited Destination card.

Do not let Found Upgrades become generic stored resources. They should feel like installed ship equipment that changes timing, requirements, risk, or payment pressure.

## Key Terms

Destination Map:

```text
The up-to-3 visible unvisited Destination cards for the current sector.
```

Sector Route:

```text
The 3 visited Destination slots for the current sector.
```

Found Upgrade:

```text
The single-use chamber, fix, or addon recovered from a face-up visited Destination and temporarily installed into the ship for the current sector.
```

Ship Log:

```text
The spent history of completed sectors. In v3 this is visual history only and has no mechanical carryover.
```

## Updated Core Loop

```text
1. Reveal Destinations until the Destination Map has up to 3 visible cards.
2. Choose and complete 1 visible Destination.
3. Move the completed Destination to the next Sector Route slot face up.
4. Resolve its Visit Reward.
5. Mark its Found Upgrade as installed and available.
6. If fewer than 3 Route slots are filled, refill only the emptied map slot.
7. Use face-up Found Upgrades at useful timing windows by stacking/clicking the visited card onto eligible targets.
8. After the third Route slot is filled, clear the remaining Destination Map, set aside undealt Sector deck cards, and attempt the Gate.
9. Face-up Found Upgrades may still be spent during the Gate if their Gate use has a valid target.
10. After the Gate resolves, move the Sector Route to the Ship Log and expire all unspent Found Upgrades.
```

Old feeling:

```text
What can I afford right now?
```

New target feeling:

```text
Which 3-stop route leaves my ship ready for this Gate, and which installed upgrade am I saving for the moment that matters?
```

## Destination Map Rule

There are always up to 3 visible unvisited Destinations while a sector is active and fewer than 3 Route slots are filled.

When the player completes a visible Destination, that Destination leaves the map and moves to the Sector Route.

Only the emptied map slot refills. Other visible Destinations remain available.

After the third Route slot is filled, do not refill the emptied slot. Clear all remaining visible unvisited Destinations and set aside all undealt cards remaining in the active Sector deck as unvisited sector cards, then begin the Gate phase. These unvisited cards cannot be drawn or affected by Found Upgrades during the Gate.

At the next sector setup, follow that sector's setup rule for building and shuffling its Destination deck.

If the Sector deck is empty when a refill is needed, the map simply has fewer than 3 visible Destinations. The sector continues until 3 Route slots are filled, a Gate begins, or the player reaches a loss state.

If fewer than 3 Route slots are filled, the Sector deck is empty, and no visible Destination can be completed or rerouted, the sector is lost.

## Sector Route Rule

Each sector has 3 Route slots.

When a Destination is completed, move it to the next Route slot face up.

A face-up Route card has one available Found Upgrade installed into the ship.

A Destination's Found Upgrade becomes available only after that Destination completion and its Visit Reward fully resolve. A Found Upgrade cannot affect the completion that created it.

When a Found Upgrade is used, return the card to its Route slot face down. The face-down side still shows Destination name and type shape/icon.

Face-up Found Upgrades remain available through the Gate phase.

After the Gate resolves, move all Route cards to the Ship Log. Unspent Found Upgrades expire at that moment.

The Ship Log is visible history only in v3. It does not create future bonuses.

## Found Upgrade Use Rule

A Found Upgrade is used by targeting the face-up Route card at an eligible board object.

Digital implementation may support either drag-stacking or click-targeting, but the rule should teach as:

```text
Stack a face-up Route card onto the thing its installed upgrade is helping. Resolve the upgrade, then flip the Route card face down.
```

Eligible targets are intentionally narrow:

| Type | Found Upgrade Identity | Normal Sector Target | Gate Target |
| --- | --- | --- | --- |
| Planet | Old Water Tank chamber | A Destination completion stack with committed crew | A Tired crew card before Gate payment |
| Asteroid | Hull Patch fix | A Destination completion stack with printed Fuel need 1 or more | The Gate card when MOTHER pressure is active |
| Star | Wayfinder Beacon addon | The Sector deck during a map refill or Emergency Reroute | The Gate card when a non-Fuel icon is missing |

If there is no valid target, the Found Upgrade cannot be used. It does not flip and does not fizzle.

## Timing And Limits

Found Upgrades must be declared before the affected step resolves.

For Destination completions, a valid stack should enter a brief completion-preview state only if at least one face-up Found Upgrade can legally affect it with a non-zero effect. The player may spend up to 1 eligible Found Upgrade, then resolve. If no Found Upgrade can affect the stack, existing auto-resolution can remain.

For map refills, pause before dealing the replacement card only if a Star Found Upgrade is available and at least 2 Sector deck cards remain. The player may spend 1 Wayfinder Beacon or skip it.

For Emergency Reroute, pause before dealing the replacement card only if a Star Found Upgrade is available and at least 2 undealt Sector deck cards were available before the replaced Destination was moved. The player may spend 1 Wayfinder Beacon or take the top card normally.

For the Gate, there are three separate timing windows:

```text
1. Gate approach: Planet may Ready 1 Tired crew.
2. Gate pressure check: Asteroid may ignore the MOTHER pressure crew penalty for this Gate.
3. Gate icon payment: Star may cover 1 missing non-Fuel icon without spending MOTHER.
```

At most 1 Found Upgrade can be used in each timing window.

This means:

- At most 1 Found Upgrade can affect a single Destination completion.
- At most 1 Star Found Upgrade can affect a single map refill or Emergency Reroute.
- At most 1 Planet, 1 Asteroid, and 1 Star Found Upgrade can affect a single Gate.
- Extra same-type Found Upgrades remain face up but cannot be stacked into the same timing window.

This cap prevents three identical ship parts from deleting pressure while still letting a varied route cash out at the Gate.

## Default Found Upgrades

Use the same Found Upgrade for all Destinations of the same type in v3.

| Type | Found Upgrade | Upgrade Kind | Normal Sector Use | Gate Use | Why It Works |
| --- | --- | --- | --- | --- | --- |
| Planet | Old Water Tank | Chamber | Stack on a Destination completion before resolution. Choose exactly 1 committed crew. That crew does not become Tired from this completion. | Stack on 1 Tired crew before Gate payment. Ready that crew. | Turns Planet visits into life-support capacity and crew tempo. The tank stores enough clean water and rest-cycle support to keep one crew member functional. |
| Asteroid | Hull Patch | Fix | Stack on a Destination completion with printed Fuel need 1 or more before Fuel is paid. Reduce the Fuel need by 1 for this completion, minimum 0. | Stack on the Gate during the pressure check. If MOTHER pressure would add +1 crew, ignore that +1 crew for this Gate only. | Turns Asteroid visits into structural repairs and pressure tolerance. The patch does not refund resources; it lets the ship take one costly maneuver or MOTHER-stressed crossing more cleanly. |
| Star | Wayfinder Beacon | Addon | Stack on the Sector deck during a map refill or Emergency Reroute when at least 2 undealt Sector cards are available. Look at the top 2 Sector cards, choose 1 to enter the map slot, and put the other on the bottom. | Stack on the Gate during icon payment. Cover 1 missing non-Fuel icon without spending MOTHER. Gate crew-card count must still be met. | Turns Star visits into navigation and signal reach. The beacon gives foresight and one narrow rule-bend without making early Star always the obvious immediate map reset. |

## Invalid Target Details

Old Water Tank cannot be used on a Destination completion with no committed crew that would become Tired.

Old Water Tank cannot be used at the Gate if there are no Tired crew.

Hull Patch cannot be used on a Destination with printed Fuel need 0.

Hull Patch cannot be used at the Gate if the MOTHER pressure penalty is not active.

Wayfinder Beacon cannot be used for map refill or Emergency Reroute if fewer than 2 undealt Sector deck cards are available to choose from.

Wayfinder Beacon cannot be used at the Gate if no non-Fuel icon is missing after committed Ready crew are counted.

No Found Upgrade can be used after its affected completion, refill, reroute, or Gate timing window has resolved.

## Emergency Reroute

The persistent map needs a release valve that does not require already having a Wayfinder Beacon installed.

Emergency Reroute is a stuck-state tool, not a normal optimization action.

The player may Emergency Reroute only if no visible Destination can currently be completed using available Ready crew, Fuel, and usable MOTHER currently in play. Do not require the player to spend saved Found Upgrades to prove they are stuck.

To Emergency Reroute:

```text
1. Spend 1 usable MOTHER card as pressure.
2. Choose 1 visible Destination.
3. Put that Destination on the bottom of the Sector deck.
4. Reveal the top Sector deck card into that map slot.
```

Emergency Reroute requires 1 usable MOTHER already in play. If none is in play, the player may draw MOTHER normally, then recheck whether Emergency Reroute is available.

If the Sector deck has no cards before the chosen visible Destination is moved, Emergency Reroute cannot be used.

If a Star Found Upgrade is face up and at least 2 undealt Sector deck cards are available, it may be spent during Emergency Reroute to choose the replacement from the top 2 Sector cards instead of taking the top card blindly. For Emergency Reroute with Wayfinder Beacon, first set the chosen visible Destination aside, then look at the top 2 undealt Sector deck cards, choose 1 for the map slot, put any unchosen looked-at card on the bottom, then put the set-aside Destination on the bottom.

Emergency Reroute does not count as a visited Destination and does not install a Found Upgrade.

Emergency Refuel remains available under the current manual's restriction. Emergency Reroute covers broader map/icon locks; Emergency Refuel covers fuel-only locks.

## Gate Interaction

The Gate is the cash-out test for the Sector Route and the temporary ship kit assembled along it.

After the third Destination is completed:

```text
1. Move the third Destination to the Route face up.
2. Resolve its Visit Reward.
3. Install its Found Upgrade.
4. Do not refill the map.
5. Clear remaining visible unvisited Destinations and set aside undealt Sector deck cards.
6. Begin the Gate phase.
```

Face-up Found Upgrades may be used at the Gate only in their listed Gate timing window.

Gate timing order:

```text
1. Planet window: Ready 1 Tired crew with Old Water Tank, if spent.
2. Gate requirement preview: calculate required crew-card count, required icons, available Ready crew, usable MOTHER, and active MOTHER pressure.
3. Asteroid window: ignore active MOTHER pressure +1 crew for this Gate with Hull Patch, if spent.
4. Commit Ready crew to meet the final crew-card count.
5. Star window: cover 1 missing non-Fuel icon with Wayfinder Beacon, if spent.
6. Commit and spend MOTHER only for any remaining missing non-Fuel icons.
7. Resolve Gate success or loss.
8. Move the Sector Route to the Ship Log and expire unspent Found Upgrades.
```

MOTHER pressure markers are not removed by Hull Patch. The patch only ignores the current Gate's +1 crew penalty.

Wayfinder Beacon cannot reduce the number of crew cards required by the Gate. It only covers one missing icon after the crew-card count is satisfied.

Old Water Tank used at the Gate readies crew before Gate payment. It does not create extra crew after the Gate resolves.

## Sector Transition

After Gate 1 is completed:

```text
1. Move the Sector 1 Route cards to the Ship Log as visited history.
2. Clear Route slots for Sector 2.
3. Expire any unspent Sector 1 Found Upgrades.
4. All Tired crew become Ready, as in the current rules.
5. Fuel carries forward, as in the current rules.
6. Spent MOTHER pressure carries forward, as in the current rules.
7. Reveal the Sector 2 Destination Map.
```

This keeps the first implementation focused. If playtests show players strongly expect installed ship history to matter across sectors, test a single small Ship Log rule later. Do not add it in v3.

## Impact On Existing Cards

Current Visit Rewards can remain unchanged for the first implementation. V3 tests whether type identity can be carried by Found Upgrades before tuning individual rewards.

| Destination | Type | Current Visit Reward | V3 Found Upgrade |
| --- | --- | --- | --- |
| Dust Garden | Planet | Fuel +1 | Old Water Tank |
| Life Orchard | Planet | Ready 1 Tired crew | Old Water Tank |
| Cryo Choir | Star | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Sleeper Arklet | Star | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Iron Wake | Asteroid | Fuel +1 | Hull Patch |
| Red Salvage | Asteroid | Fuel +1 | Hull Patch |
| Broken Atlas | Asteroid | Scout 2 | Hull Patch |
| Gravity Sling | Star | Next Star costs -1 Fuel | Wayfinder Beacon |
| Quiet Relay | Planet | Scout 3 | Old Water Tank |

Known tuning risk:

```text
Gravity Sling already creates route-shaping through its Visit Reward. If Gravity Sling plus Wayfinder Beacon becomes too correct, tune Gravity Sling after playtesting rather than creating a one-card exception in v3.
```

## UI Requirements

The board needs:

- A persistent Destination Map with up to 3 visible unvisited cards.
- A Sector Route area with 3 slots.
- Face-up Route cards that clearly read as installed Found Upgrades available for use.
- Face-down Route cards that clearly read as spent but still show name and type.
- A clear Gate phase state after the third Route slot fills.

Found Upgrade targeting should be legible:

- Highlight Planet Route cards only during eligible Destination completion previews or the Gate approach window when Tired crew exist.
- Highlight Asteroid Route cards only during eligible Fuel-cost Destination completion previews or the Gate pressure window when MOTHER pressure is active.
- Highlight Star Route cards only during map refill or Emergency Reroute when at least 2 undealt Sector deck cards are available, or during the Gate icon-payment window when an icon is missing.
- Do not highlight Found Upgrades that have no valid target.
- Do not pause for a Found Upgrade window unless at least one upgrade has a legal non-zero effect in that window.
- Show a short preview of the effect before the player confirms or drops the card.

Playtest log examples:

```text
Dust Garden moved to Route slot 1 with Old Water Tank installed.
Dust Garden Old Water Tank used: Lei Watanabe remains Ready.
Iron Wake Hull Patch used: Fuel need reduced by 1.
Gravity Sling Wayfinder Beacon used: chose Broken Atlas for the map; Sleeper Arklet moved to bottom.
Red Salvage Hull Patch used at Gate: ignored MOTHER pressure crew penalty for Narrow Crossing.
Cryo Choir Wayfinder Beacon used at Gate: covered missing Signal without spending MOTHER.
Emergency Reroute: spent usable MOTHER pressure to replace Life Orchard with Iron Wake.
```

## Rules Text Draft

This text can be adapted into `docs/PROTOTYPE_USER_MANUAL.md` after the mechanic is accepted.

```text
Destination Map

Keep up to 3 Destinations visible while a sector is active. When you complete one visible Destination, move it to your Route and refill only that empty map slot. The other visible Destinations remain available. After your third visited Destination in a sector, do not refill the map; clear remaining visible unvisited Destinations, set aside undealt Sector deck cards, and attempt the Gate.

Sector Route

Each sector has 3 Route slots. When you complete a Destination, move it to the next Route slot face up. Its Found Upgrade becomes available only after that completion and its Visit Reward fully resolve. A face-up Route card has one chamber, fix, or addon installed into the ship. To use a Found Upgrade, stack the face-up Route card onto its valid target. Resolve the upgrade, then flip that Route card face down. Face-up Found Upgrades remain available until the sector Gate resolves, then expire.

Found Upgrades

Old Water Tank: During a Destination completion, choose exactly 1 committed crew; that crew does not become Tired. At the Gate, Ready 1 Tired crew before Gate payment.

Hull Patch: During a Destination completion with printed Fuel need 1 or more, reduce the Fuel need by 1 for this completion. At the Gate, if MOTHER pressure would add +1 required crew, ignore that +1 crew for this Gate only.

Wayfinder Beacon: During a map refill or Emergency Reroute with at least 2 undealt Sector deck cards, look at the top 2 Sector cards, choose 1 to enter the map slot, and put the other on the bottom. At the Gate, cover 1 missing non-Fuel icon without spending MOTHER. The Gate crew-card count must still be met.

Gate Upgrade Timing

At the Gate, resolve Found Upgrade windows in this order: Old Water Tank may Ready 1 Tired crew; preview Gate requirements and active MOTHER pressure; Hull Patch may ignore the MOTHER pressure +1 crew requirement; commit Ready crew to meet the final crew-card count; Wayfinder Beacon may cover 1 missing non-Fuel icon; then spend MOTHER only for any remaining missing non-Fuel icons.

Emergency Reroute

If no visible Destination can be completed using current Ready crew, Fuel, and usable MOTHER in play, and the Sector deck has at least 1 card, you may spend 1 usable MOTHER as pressure to replace 1 visible Destination with the top card of the Sector deck. Put the replaced Destination on the bottom first. If Wayfinder Beacon is available and at least 2 undealt Sector deck cards are available, set the replaced Destination aside instead, choose the replacement from the top 2 undealt Sector cards, put the unchosen looked-at card on the bottom, then put the set-aside Destination on the bottom.
```

## Implementation Notes

Likely data model changes:

```text
Add Destination Map slots instead of temporary proposals.
Add current-sector Route slots with available/spent Found Upgrade status.
Keep completed Destinations in Route until Gate archive.
Track Gate phase timing windows for Planet, Asteroid, and Star Found Upgrades.
Add Emergency Reroute action and playtest log event.
Add Found Upgrade use actions and playtest log events.
```

Likely rules changes:

```text
Sector Gate begins after 3 Route slots are filled, not after the Sector deck is exhausted.
Unchosen visible Destinations persist until completed, rerouted, or cleared at Gate phase.
After the third Destination completion, remaining visible Destinations and undealt Sector deck cards are set aside, and the map is not refilled.
Found Upgrades remain available through Gate resolution, then expire.
At most 1 Found Upgrade can affect a Destination completion, map refill, Emergency Reroute, or individual Gate timing window.
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
Which Found Upgrade are you saving, and why?
Did your third visited Destination add something useful to the ship before the Gate?
Did the Gate feel like a test of the route you built and the ship kit you assembled?
Did any Found Upgrade feel like a delayed resource instead of installed equipment?
Was it obvious which Found Upgrades were available and which were spent?
Was it obvious why a Found Upgrade was or was not highlighted?
Did Emergency Reroute feel like a rescue valve or an optimal normal action?
Did Wayfinder Beacon feel worth saving, or did you always spend it immediately?
Did Hull Patch feel useful outside simple Fuel math?
Did Old Water Tank create a meaningful crew-tempo decision?
Did the persistent map reduce helpless randomness?
Did the added route choices slow turns too much?
Did the chamber/fix/addon fiction make visited Destinations feel more concrete?
```

## Success Criteria

The update is working if playtesters say things like:

```text
I saved that water tank because I knew the Gate needed one more Ready crew.
I took the Asteroid because I wanted a Hull Patch before spending MOTHER.
I held the beacon for the final refill instead of using it immediately.
I rerouted because I was stuck, but I did not want the extra MOTHER pressure.
I can see what my route is adding to the ship.
```

The update is not working if playtesters still say:

```text
I just picked the only card I could afford.
I forgot what my installed upgrades do.
I always use the benefit immediately.
The third Route card did not matter.
The Gate had nothing to do with my route or my ship.
Emergency Reroute is always correct.
All Destination types feel the same.
```

## Verification Against Feedback Checklist

| ID | Result | V3 Response |
| --- | --- | --- |
| B1 | Addressed | Found Upgrades are used by stacking/click-targeting a face-up Route card onto a narrow eligible target. |
| B2 | Addressed | Planet, Asteroid, and Star each have explicit Gate uses and timing windows. |
| B3 | Addressed | The third Route card can matter because face-up Found Upgrades remain usable during the Gate. |
| B4 | Addressed | Emergency Reroute gives a non-Star stuck-state release valve at the cost of MOTHER pressure. |
| B5 | Addressed | Gate starts after 3 Route slots; remaining map cards and undealt deck cards are set aside as unvisited sector cards. |
| B6 | Addressed by reframing | V3 defines this as sector preparation and temporary ship installation, not run-long relic progression. Ship Log is visual only. |
| B7 | Addressed | Star changes from visible replacement before choosing to peek-2-choose-1 during refill/reroute, plus a Gate use. |
| B8 | Addressed | Asteroid reduces printed Fuel need by 1 and has a clear Gate pressure use. No ambiguous resource-refund trigger. |
| B9 | Addressed | V3 adds completion-preview/refill/Gate timing windows before resolution. |
| B10 | Addressed | V3 caps Found Upgrade use by timing window and states exact Gate windows. |
| R1 | Addressed | Planet changes readiness timing/preservation; Asteroid changes requirements/pressure; neither simply grants resources. |
| R2 | Addressed | Existing rewards remain for first test; reward/type conflicts are explicitly deferred tuning. |
| R3 | Addressed as scoped risk | Homogeneous route depth is flagged for playtest; set bonuses stay out of v3. |
| R4 | Addressed | UI highlights only currently eligible Found Upgrades and hides invalid ones. Timing windows cap simultaneous decisions. |
| R5 | Addressed as tuning risk | Gravity Sling double-route value is called out without adding exceptions. |
| T1 | Addressed | Planet wording consistently says choose exactly 1 committed crew for Destination use. |
| T2 | Addressed | Invalid target details specify when each upgrade cannot be used. |
| T3 | Addressed | Empty-deck refill and sector-loss cases are defined. |
| T4 | Addressed | Gate interaction is explicit by type and timing window. |
| T5 | Addressed | Face-up Found Upgrades remain available through Gate resolution and expire on archive. |
| S1 | Preserved | Visit Reward and Found Upgrade remain separate outputs. |
| S2 | Preserved | Face-up available and face-down spent remain the visual model. |
| S3 | Preserved | One default Found Upgrade per Destination type. |
| S4 | Preserved | No set bonuses in v3. |
| S5 | Expanded | Playtest questions now cover Gate payoff, reroute, timing clarity, overhead, and upgrade fiction. |
| P1 | Addressed | V3 states a sector-scale emotional promise and aligns mechanics to it. |
| P2 | Addressed | Core loop remains reveal -> choose -> commit -> resolve -> change state -> pressure. |
| P3 | Addressed | Route cards now act as installed ship parts with protect/filter/patch/rule-bend verbs. |
| P4 | Addressed | Found Upgrades interact with crew readiness, Fuel need, and MOTHER pressure. |
| P5 | Addressed | Emergency Reroute and Wayfinder Beacon provide randomness mitigation. |
| P6 | Addressed | Found Upgrades synergize with state but same-window stacking is capped. |
| P7 | Addressed | UI and log requirements focus on eligible targets and clear outcomes. |
| P8 | Addressed | The visible map, Route slots, and Gate preview create a 2-3 turn sector plan. |
| P9 | Addressed | Effects can be tuned by target, timing, caps, and pressure cost. |
| P10 | Addressed | Stack/click targeting plus highlights teach the first Found Upgrade use. |

## Recommended First Implementation

Implement the smallest complete version:

```text
Persistent 3-Destination map.
Three current-sector Route slots.
Completed Destinations move to Route face up.
Face-up Route cards install Found Upgrades that can be spent once.
Found Upgrades use target-based stack/click timing.
Each type has one normal sector use and one Gate use.
Emergency Reroute exists only as a stuck-state valve.
Gate starts after the third Route slot fills.
Found Upgrades expire after the sector Gate resolves.
Playtest log records Route movement, Found Upgrade use, Emergency Reroute, and Ship Log archive.
```

Do not implement unique per-card Found Upgrades in the first pass.

Do not implement route-set Gate bonuses in the first pass.

Do not implement cross-sector Ship Log bonuses in the first pass.

Do not add new Destination cards until the changed loop has been tested.
