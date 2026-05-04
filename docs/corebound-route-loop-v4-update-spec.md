# Corebound Route + Ship Parts Update Spec v4

**Status:** Proposed implementation spec  
**Audience:** Prototype owner / implementer familiar with the current prototype manual  
**Scope:** Replace the current 3-card proposal/discard loop with a persistent 3-card map, add a 3-stop Route per sector, and make each visited Stop provide one simple physical Ship Part for the Gate.

---

## 1. One-Sentence Design Thesis

In each sector, the player should feel like a desperate navigator choosing a 3-stop salvage route, collecting three visible ship parts, and using those parts to survive the Gate while crew, Fuel, and MOTHER pressure tighten.

Player-facing teach:

```text
Visit 3 Stops. Get 3 Ship Parts. Use them to pass the Gate.
```

That sentence should be true at the table and in the prototype.

---

## 2. Why This Update Exists

The current prototype has a good survival puzzle, but completed Sector cards disappear after resolution. This means the route has little memory: the player mostly asks, "Which visible card can I afford right now?"

This update makes the three completed cards in each sector remain visible as the player's Route. Each completed card gives one one-use Ship Part. The Gate then becomes a test of the Route the player built, not only a final check of remaining Ready crew and MOTHER.

The update should improve:

- Medium-term planning over the next 2-3 choices.
- Visible consequences from completed Stops.
- Physical-board readability.
- Kid teachability.
- Story cohesion: the ship survives because of places visited and parts salvaged.

---

## 3. Design Principles For This Version

Prioritize these principles in implementation and playtesting:

1. **Simplicity before cleverness.** Do not add timing windows, hidden exceptions, or UI-only legality logic unless absolutely necessary.
2. **Physical first.** Every rule must work with real cards, board slots, and tokens.
3. **Visible state over memory.** If a Ship Part is available, it must be visible. If it is spent, that must be visible.
4. **One card, one clear job.** Each visited Stop already has a Visit Reward. The added Ship Part should be short and easy to remember.
5. **Gate clarity.** Separate crew slots from icon requirements. MOTHER and Beacons can cover icons only; they never count as crew.
6. **Kid-readable loop.** A player should not need to read a wall of text to know the core loop.

---

## 4. Summary Of Major Changes From Current Prototype

| Current Prototype | V4 Change |
|---|---|
| Draw 3 Sector cards as a proposal. Complete 1 and discard the other 2. | Keep 3 visible Stops in a persistent Map. Complete 1, refill only that empty Map slot, and leave the other visible Stops in place. |
| Completed Sector cards are discarded. | Completed Stops move to one of 3 Route slots for the current sector. |
| Gate begins when the Sector deck is exhausted and no Sector cards remain in play. | Gate begins immediately after the third Route slot is filled. Remaining Map cards and undealt deck cards are set aside as unvisited. |
| Completed cards have no later Gate impact. | Each completed Stop provides one one-use Ship Part that can be spent at the Gate. |
| Emergency Refuel is fuel-only. V3 proposed a separate Emergency Reroute. | Replace both with one simpler stuck-state action: Distress Call. |
| MOTHER pressure is tracked by spent MOTHER cards. | Keep internal MOTHER spent count, but present it physically as Stress tokens or spent MOTHER cards in a Stress area. |
| Gate requirements mix crew-card count and icons in a way that can be misread. | Gate cards must show crew slots separately from required icons. |
| Player-facing terminology uses Star as both a Destination type and crew icon. | Recommended terminology cleanup: rename the Star crew icon to Nav and the Star Destination type to Deep Space. Internal code may keep existing identifiers during migration. |

---

## 5. Terminology

Use these player-facing terms in rules and UI.

| Term | Meaning |
|---|---|
| **Stop** | A place the ship can visit. This replaces player-facing "Sector card" / "Destination." |
| **Map** | The 3 face-up unvisited Stops available in the current sector. |
| **Route** | The 3 visited Stops in the current sector. |
| **Ship Part** | A one-use helper gained from a visited Stop. |
| **Stress** | Pressure created by spending MOTHER or making a Distress Call. At 3+ Stress, Gates require one extra crew slot. |
| **Crew slot** | A required body at the Gate. Must be filled by a Ready crew card or Hull Patch. |
| **Icon requirement** | A required symbol at the Gate. Can be shown by committed crew, Wayfinder Beacon, or MOTHER. |

### Recommended Naming Cleanup

Current player-facing terminology overloads **Star** as both a card type and a crew icon. Clean this up in V4.

Recommended language:

| Current | V4 Player-Facing Name | Notes |
|---|---|---|
| Sector card / Destination | **Stop** | Shorter and route-friendly. |
| Star Destination type | **Deep Space Stop** | Keeps the cosmic fiction without conflicting with a crew icon. |
| Star crew icon | **Nav icon** | Easier to distinguish from the Stop type. |
| MOTHER Pressure | **Stress** | Easier to represent with red tokens. |
| Found Upgrade / chamber / fix / addon | **Ship Part** | One clear term. |

Implementation note: internal code can continue using `sector`, `horizon`, or `star` identifiers for now, but the visible rule text should move toward the names above.

---

## 6. Board Layout Requirements

The board needs these visible areas:

1. **Stop Deck**
2. **Map:** 3 face-up Stop slots
3. **Route:** 3 face-up visited Stop slots
4. **Gate:** current Gate card
5. **Crew:** Ready crew area
6. **Tired Crew:** Tired crew area
7. **Fuel Supply**
8. **MOTHER Deck / usable MOTHER area**
9. **Stress area:** spent MOTHER cards and/or red Stress tokens
10. **Set-aside / unvisited area:** for cleared Map cards and undealt Stop cards after the Gate begins

Physical guidance:

- Do not rely on digital highlights to teach the rule.
- A Route card should remain face up after its Ship Part is spent.
- Mark spent Ship Parts with a token or by rotating the card sideways.
- Avoid flipping Route cards face down unless the physical card back still shows the card name, type, and spent status.

---

## 7. Sector Setup

At the start of each sector:

1. Reveal the sector Gate.
2. Shuffle the 9 Stop cards for that sector.
3. Deal 3 Stops face up into the Map.
4. Leave the 3 Route slots empty.

Sector 2 continues to reuse the same 9 Stop cards, reshuffled after Gate 1, unless later content changes that deck.

---

## 8. Updated Turn Loop

On each turn while fewer than 3 Route slots are filled:

1. Choose 1 face-up Stop from the Map.
2. Pay its Fuel and icon requirements using the current prototype payment rules.
3. Move used crew to Tired.
4. Spend MOTHER only if needed to cover missing non-Fuel icons.
5. Resolve the Stop's printed Visit Reward.
6. Move the completed Stop to the next empty Route slot.
7. Its Ship Part is now available for the Gate.
8. If fewer than 3 Route slots are filled, refill only the emptied Map slot from the Stop Deck.
9. If the third Route slot was just filled, do not refill. Clear remaining Map cards and set aside all undealt Stop Deck cards. Begin the Gate.

Important: a Ship Part cannot help complete the Stop that created it. Ship Parts are available only after the Stop's completion and Visit Reward fully resolve.

---

## 9. Ship Parts

Each visited Stop gives exactly one Ship Part based on its Stop type.

| Stop Type | Ship Part | Gate Use |
|---|---|---|
| **Planet** | **Water Tank** | Ready 1 Tired crew before Gate payment. |
| **Asteroid** | **Hull Patch** | Fill 1 Gate crew slot. It provides no icon. |
| **Deep Space** | **Wayfinder Beacon** | Cover 1 missing Gate icon. It fills no crew slot. |

### Ship Part Rules

- Ship Parts are used only at the Gate in this V4 implementation.
- Each Ship Part can be used once.
- A Route can contain duplicates. For example, three Asteroids give three Hull Patches.
- There is no timing-window cap beyond one-use-per-Part.
- A spent Ship Part stays visible but marked spent.
- Unspent Ship Parts expire after the sector Gate resolves.

### Why Gate-Only Parts

V3 proposed normal-sector and Gate uses for each upgrade. This created too many timing windows and exception checks. V4 intentionally keeps the first implementation simpler: Visit Rewards affect the sector immediately; Ship Parts matter at the Gate.

---

## 10. Gate Rewrite

Gate requirements must be represented as two separate checks:

1. **Crew slots:** how many bodies are required.
2. **Required icons:** which symbols must be shown or covered.

### Gate Cards

Recommended player-facing Gate text:

#### Narrow Crossing

```text
Crew slots: 3
Icons needed: Engine, Life, Nav, Signal
Stress: If you have 3+ Stress, add 1 red crew slot.
```

#### Dark Threshold

```text
Crew slots: 4
Icons needed: Engine, Life, Nav, Signal
Stress: If you have 3+ Stress, add 1 red crew slot.
```

### Gate Resolution Order

1. Check Stress. If Stress is 3 or more, add 1 red crew slot to the Gate.
2. Use any Water Tanks to Ready Tired crew.
3. Use any Hull Patches to fill crew slots. Hull Patch fills a slot but provides no icon.
4. Commit Ready crew to fill all remaining crew slots.
5. Check required icons shown by committed crew.
6. Use any Wayfinder Beacons to cover missing icons. Beacon covers an icon but fills no crew slot.
7. Spend MOTHER only for any remaining missing non-Fuel icons.
8. If all crew slots are filled and all icons are shown or covered, the Gate is completed.
9. If not, the ship fails at the Gate.

### Non-Negotiable Gate Clarifications

Use these exact rules in the implementation and player aid:

```text
MOTHER can cover icons only. MOTHER never fills a crew slot.
Wayfinder Beacon can cover icons only. Beacon never fills a crew slot.
Hull Patch fills a crew slot only. Hull Patch never provides an icon.
```

This is important because the current prototype can be misread as if extra icons or MOTHER somehow satisfy crew-card requirements. They should not.

---

## 11. Stress And MOTHER

MOTHER still works as in the current prototype unless changed here:

- A usable MOTHER card can cover 1 missing non-Fuel icon.
- MOTHER cannot pay Fuel during normal Stop completion.
- MOTHER cannot count as crew.
- At least 1 human crew must be committed when MOTHER is used.
- Spent MOTHER adds pressure for the rest of the run.

V4 presentation change:

```text
Each spent MOTHER adds 1 Stress.
Each Distress Call adds 1 Stress.
If Stress is 3 or more at a Gate, add 1 red crew slot.
Stress carries from Sector 1 to Sector 2.
```

Implementation can keep using the current `motherSpentTotal` style count, but the board should show Stress in a visible, physical way. Recommended physical implementation: put spent MOTHER cards and/or red tokens in a Stress area.

---

## 12. Distress Call

Replace the current Emergency Refuel and do not add V3's separate Emergency Reroute. Use one stuck-state rule instead.

### When Distress Call Is Allowed

The player may make a Distress Call only if they cannot complete any face-up Stop in the Map using currently available Ready crew, Fuel, and usable MOTHER.

The player does not need to spend Ship Parts to prove they are stuck, because Ship Parts are Gate-only in V4.

### Distress Call Effect

When the player makes a Distress Call:

1. Add 1 Stress.
2. Choose one:
   - Gain 1 Fuel from the Fuel Deck.
   - Replace 1 face-up Map Stop with the top card of the Stop Deck. Put the replaced Stop on the bottom of the Stop Deck.

If the player is still stuck after resolving the Distress Call, they may make another Distress Call.

### Edge Cases

- If the Fuel Deck is empty, the player cannot choose Gain 1 Fuel.
- If the Stop Deck is empty, the player cannot choose Replace 1 Map Stop.
- If neither option can help and no visible Stop can be completed, the player loses as stranded.

### Why Distress Call Is Better For V4

It is physical, short, and easy to teach:

```text
If you are stuck, call for help. Add Stress. Take Fuel or change the Map.
```

It also unifies the game's emergency pressure around Stress instead of splitting it into Emergency Refuel, Emergency Reroute, and MOTHER-only conditions.

---

## 13. Stop Card Mapping

Use the current 9-card deck. Visit Rewards mostly stay unchanged for the first V4 test.

| Stop | Current Type | V4 Type | Current Visit Reward | V4 Ship Part |
|---|---|---|---|---|
| Dust Garden | Planet | Planet | Fuel +1 | Water Tank |
| Life Orchard | Planet | Planet | Ready 1 Tired crew | Water Tank |
| Cryo Choir | Star | Deep Space | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Sleeper Arklet | Star | Deep Space | Wake 1 crew, then Ready 1 Tired crew | Wayfinder Beacon |
| Iron Wake | Asteroid | Asteroid | Fuel +1 | Hull Patch |
| Red Salvage | Asteroid | Asteroid | Fuel +1 | Hull Patch |
| Broken Atlas | Asteroid | Asteroid | Scout 2 | Hull Patch |
| Gravity Sling | Star | Deep Space | See recommended change below | Wayfinder Beacon |
| Quiet Relay | Planet | Planet | Scout 3 | Water Tank |

### Recommended Gravity Sling Change

Current Gravity Sling reward:

```text
Next Star costs -1 Fuel.
```

Recommended V4 reward:

```text
Next Stop costs -1 Fuel.
```

Reason: in a persistent Map, "Next Deep Space costs -1 Fuel" is narrow and creates terminology/memory overhead. "Next Stop costs -1 Fuel" is easier to understand, easier to remember, and more likely to matter.

This should be tested. If it becomes too strong, tune Gravity Sling's printed Fuel cost or requirement rather than adding a one-card exception.

---

## 14. Scout In The Persistent Map

Keep Scout as the main route-planning reward, but clarify its text for the new refill model.

Recommended text:

```text
Scout N: Look at the top N cards of the Stop Deck. Choose 1 to put on top of the deck. Put the rest on the bottom in any order.
```

This means Scout shapes the next Map refill.

Example:

```text
Quiet Relay resolves Scout 3. The player looks at Iron Wake, Gravity Sling, and Broken Atlas. They put Iron Wake on top and put the other two on the bottom. The next empty Map slot refills with Iron Wake.
```

---

## 15. Sector Transition

After Gate 1 succeeds:

1. Move the Sector 1 Route cards to a visible history area or discard area.
2. Clear any spent/unspent Ship Part markers.
3. All Tired crew become Ready, as in the current prototype.
4. Fuel carries forward, as in the current prototype.
5. Stress carries forward.
6. Shuffle the 9 Stop cards for Sector 2.
7. Reveal Dark Threshold.
8. Deal 3 Stops into the Sector 2 Map.

After Gate 2 succeeds, the player wins.

If any Gate cannot be completed after Ship Parts, Ready crew, and available MOTHER are considered, the player loses at the Gate.

---

## 16. Rules Text Draft For Manual

This section can be pasted into the prototype manual after implementation.

```text
Map

Each sector has a Map with 3 face-up Stops. On your turn, choose 1 face-up Stop to visit. Pay its Fuel and icon requirements, move used crew to Tired, resolve its reward, then move the Stop to the next Route slot. Refill only the empty Map slot.

After your third Stop in a sector, do not refill the Map. Clear the remaining Map cards, set aside the rest of the Stop Deck, and attempt the Gate.

Route And Ship Parts

Each sector has 3 Route slots. Each visited Stop gives 1 Ship Part based on its type:

Planet: Water Tank.
Asteroid: Hull Patch.
Deep Space: Wayfinder Beacon.

Ship Parts are used only at the Gate. Each Ship Part can be used once. Mark spent Ship Parts with a spent token or rotate the Route card sideways. Unspent Ship Parts expire after the Gate.

Gate

A Gate has crew slots and required icons. Crew slots are bodies. Icons are symbols.

First check Stress. If you have 3 or more Stress, add 1 red crew slot.

Then use Ship Parts:
Water Tank readies 1 Tired crew.
Hull Patch fills 1 crew slot but provides no icon.
Wayfinder Beacon covers 1 missing icon but fills no crew slot.

Then commit Ready crew to fill all remaining crew slots. Check required icons. Spend MOTHER only for missing icons.

MOTHER can cover icons only. MOTHER never fills a crew slot.
Beacon can cover icons only. Beacon never fills a crew slot.
Hull Patch fills a crew slot only. Hull Patch never provides an icon.

Stress

Each spent MOTHER adds 1 Stress. Each Distress Call adds 1 Stress. Stress carries forward. If Stress is 3 or more at a Gate, add 1 red crew slot.

Distress Call

If you cannot complete any face-up Stop, make a Distress Call. Add 1 Stress, then choose one: gain 1 Fuel, or replace 1 face-up Map Stop with the top card of the Stop Deck.
```

---

## 17. Implementation Notes

### Data Model

Likely additions:

```text
mapSlots: up to 3 visible unvisited Stop cards
routeSlots: 3 visited Stop cards per sector
shipPartStatus per route slot: available | spent | expired
stressCount: number
setAsideStops: cards cleared when Gate begins
```

Potentially keep existing names internally:

```text
horizon/sector card -> Stop in UI text
star kind -> Deep Space in UI text
star icon -> Nav in UI text
motherSpentTotal -> Stress display/count
```

### Rule System

Required rule changes:

```text
Sector draw becomes persistent Map setup/refill.
Completed Stops move to Route instead of discard.
Unchosen Map Stops persist.
Gate begins after 3 Route slots are filled.
Remaining Map/deck cards are set aside at Gate start.
Ship Parts can be spent at Gate.
Distress Call replaces Emergency Refuel.
Gate validator separates crew slot count from icon coverage.
```

### Logging

Add log events for:

```text
map.initialized
map.refilled
stop.moved_to_route
ship_part.available
ship_part.spent
stress.added
stress.threshold_active
distress_call.used
gate.crew_slots_checked
gate.icons_checked
route.archived
```

Example logs:

```text
Red Salvage moved to Route slot 1. Hull Patch available.
Quiet Relay moved to Route slot 2. Water Tank available.
Iron Wake moved to Route slot 3. Hull Patch available. Gate begins.
Water Tank spent: readied Ada Chen.
Hull Patch spent: filled 1 red Gate crew slot.
Wayfinder Beacon spent: covered missing Signal.
MOTHER spent: covered missing Engine. Stress is now 3.
Distress Call used: +1 Stress, replaced Sleeper Arklet with Dust Garden.
```

---

## 18. UI / Physical Simulation Requirements

The digital prototype should simulate the physical table rather than introduce digital-only mechanics.

Required:

- 3 persistent Map slots.
- 3 Route slots.
- Route cards remain visible.
- Ship Part availability and spent status are visible.
- Gate card visually separates crew slots from required icons.
- Stress is shown as a count and ideally as tokens/cards in an area.
- Ship Parts can be spent with a simple interaction, such as clicking the Route card and choosing the Gate use.

Allowed digital assistance:

- Highlight usable Ship Parts during the Gate.
- Show a short confirmation like "Hull Patch fills 1 crew slot, no icon."
- Show missing Gate slots/icons before final resolution.

Avoid:

- Hidden timing windows.
- Auto-pauses that cannot be represented physically.
- Rules that only make sense with UI highlights.
- Long explanatory popups as the primary teach.

---

## 19. Acceptance Criteria

The implementation is ready for playtest when all of these are true:

1. A sector begins with exactly 3 visible Map Stops.
2. Completing a Stop moves it to Route, not discard.
3. Only the emptied Map slot refills.
4. The Gate begins after exactly 3 Route slots are filled.
5. Remaining Map and deck cards are set aside when Gate begins.
6. Each Route card clearly shows its Ship Part type.
7. Each Ship Part can be spent once at the Gate.
8. Spent Ship Parts remain visibly spent.
9. Stress increases when MOTHER is spent.
10. Stress increases when Distress Call is used.
11. At 3+ Stress, Gates add one extra crew slot.
12. MOTHER and Wayfinder Beacon never fill crew slots.
13. Hull Patch never provides an icon.
14. Gate success requires all crew slots filled and all required icons shown or covered.
15. The player can understand the core loop from a short player aid.

---

## 20. Player Aid Draft

Use this as the first printed/card-sized teaching aid.

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

---

## 21. Playtest Questions

Ask these after each V4 test:

1. Could the player explain the loop after one example turn?
2. Did the player plan around the 3 Route slots?
3. Did the player understand why each Ship Part mattered?
4. Did the Gate feel like a test of the Route?
5. Did the player ever confuse crew slots with icons?
6. Did the player understand that MOTHER covers icons only?
7. Did Distress Call feel like a rescue valve rather than a normal best move?
8. Did any Ship Part feel useless or always correct?
9. Did the persistent Map reduce helpless randomness?
10. Did the added Route layer slow turns too much?
11. Could a child remember Water/Patch/Beacon without reading the full rules again?
12. Was the story clear: each Stop salvages something useful for the ship?

---

## 22. Metrics To Log

Track these during playtests:

| Metric | Why It Matters |
|---|---|
| Stop pick rate by type | Checks if Planet/Asteroid/Deep Space all matter. |
| Ship Part use rate | Checks whether Parts are remembered and useful. |
| Unspent Ship Parts at Gate end | Too many may mean the system is forgettable or too narrow. |
| Stress at each Gate | Checks MOTHER and Distress pressure. |
| Distress Call frequency | Checks if the Map creates too many stuck states. |
| Gate losses by cause | Separate crew-slot failure from icon failure. |
| Rule lookups | Measures teachability. |
| Turn length | Checks whether the update adds too much overhead. |
| Child explanation success | Can a new/kid player teach back the loop? |

---

## 23. First Implementation Recommendation

Implement only this V4 core first:

```text
Persistent 3-Stop Map.
Three Route slots per sector.
Completed Stops move to Route.
Each Route card has one Gate-only Ship Part.
Planet = Water Tank.
Asteroid = Hull Patch.
Deep Space = Wayfinder Beacon.
Stress display.
Distress Call.
Gate crew-slot/icon separation.
Gate starts after 3 Route slots.
```

Do not implement in the first V4 pass:

```text
Unique Ship Parts per Stop.
Route set bonuses.
Ship Part uses during normal Stop completion.
Multiple timing windows.
Cross-sector Ship Part carryover.
A tech tree, market, relic system, score track, or character progression.
```

The goal of this pass is to test whether the Route itself creates meaningful planning and a better Gate payoff. Add more content only after this loop is proven.
