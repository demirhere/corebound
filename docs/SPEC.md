# Revised Core Spec v0.2

## Design pillars

COREBOUND is a cooperative survival card game about named humans, partial knowledge, and irreversible shortcuts.

The game should repeatedly create this decision:

> We can spend people, time, and materials now — or let MOTHER solve it and make the future less ours.

The winning condition remains clean:

> Reach Arrival. You win immediately. The epilogue diagnoses what kind of future survived.

## Standard game structure

A standard game uses three zones between Earth Wreckage and Arrival.

```text
Earth Wreckage → Zone 1 → Zone 2 → Core Zone → Arrival
```

Use 8 Passage cards per zone. The Core Zone is usually Core Storm or another late-zone scenario.

Players know each zone’s Passage composition and known Ordeals. They do not know card order.

## Act I prototype structure

Prototype only this:

```text
Earth Wreckage → Ash Belt → Quiet Harvest
```

Ash Belt has 10–12 Passage cards. Quiet Harvest is treated as prototype Arrival. Reaching it is success.

Do not include Next-Gen, full endings, faction decks, or full Core Pressure escalation in the first prototype.

---

## Core resources

Track these:

| Track | Meaning | Loss trigger |
|---|---|---|
| Hull | Physical integrity | Hull reaches 0 |
| Fuel | Route control and burns | Fuel is required and cannot be paid |
| Food | Stores and ration discipline | Food is required by a Ration and cannot be paid |
| Materials | Repair and construction stock | No direct loss |
| Power Output | Reactor/system output | Power Output reaches 0 |
| Hope | Social cohesion and legitimacy | Hope is 0 and another Hope loss occurs |
| MOTHER Autonomy | AI control | Autonomy reaches 10 |

Also track:

| Track | Meaning |
|---|---|
| Awake Population | Living, awake crew |
| Population Capacity | How many awake people the opened ship can support |
| Core Pressure | Environmental and psychological pressure, 0–5 |

### Power Output clarification

Power Output is not spent like money. It is the number of open chambers that can be online.

During cleanup, players may choose which open chambers are online, up to current Power Output.

If Power Output decreases and too many chambers are online, immediately turn chambers offline until the number online is legal.

If Power Output reaches 0, trigger **The Light Goes Out**.

### Food clarification

There is no automatic Food cost every cycle.

Food is paid when a Passage, Site, Ordeal, Event, or Milestone shows a **Ration** icon.

```text
Ration cost = ceil(Awake Population / 4)
```

This preserves the population pressure without forcing food bookkeeping every turn.

---

## Crew

Crew remain named people with skills, traits, Vigil, and wounds.

### Skill rule

A task requirement uses icons.

```text
ENG/GEN 3
```

means the assigned crew must provide 3 total matching ENG or GEN icons in any combination.

```text
BIO 2 + Materials 1
```

means assigned crew must provide 2 BIO icons and the table must spend 1 Materials.

### Wounds

Most crew have 2 wound slots. A crew at max wounds who would take another wound enters the Memorial.

Each wound reduces effective Vigil by 1 during Vigil Muster.

### Vigil

Use a compressed standard-game scale.

| Crew type | Typical Vigil |
|---|---:|
| Fragile / older adults | 2–3 |
| Standard adults | 3–4 |
| Hardened specialists / named crew | 4–5 |
| Children / Next-Gen | 5–6 |

At each Milestone crossing after Core Pressure increases, perform Vigil Muster:

```text
A crew survives if effective Vigil >= Core Pressure.
Effective Vigil = printed Vigil - wounds.
```

### Waking crew

Always-available task:

```text
WAKE POD
Need: any 1 crew
Restriction: Awake Population below Population Capacity
Result: Draw 1 Cryo crew and add them to the acting player’s hand. Awake Population +1. The new crew cannot be assigned until next cycle.
```

Optional chamber upgrade:

```text
CRYO VAULT ANNEX
While online, Wake Pod draws 2 Cryo crew; keep 1 and return 1 to the top or bottom of the Cryo deck.
```

Waking is a delayed action gain and a future Ration liability. It does not need an additional Power cost in the prototype.

---

## The cycle loop

Each cycle has five phases.

### 1. Reveal Passage

Reveal the top Passage of the current zone deck.

Resolve immediate text. If it is a Site or standing Event, place it in the active row.

### 2. Negotiate priorities

The table identifies the active fronts:

1. the current Passage,
2. one active Site or standing Event,
3. the ship board: resources, chamber tasks, open blueprint slots, wounds, and Wake Pod.

Players may discuss openly. No player may move another player’s crew without permission.

### 3. Assign crew

Each crew card may be assigned to one task.

Place the crew stack beside the exact task it is working. Use numbered markers only when the table is crowded.

Assignments are flexible until the table locks them.

### 4. Resolve tasks and MOTHER Intervention

Resolve tasks in an order chosen by the table, unless a card says otherwise.

If a task succeeds, apply its result. If it is a multi-cycle task, add 1 progress.

If a task with assigned crew would fail, the table may use **MOTHER Intervention** once this cycle.

### 5. Upkeep and cleanup

Resolve Ration icons and other printed upkeep effects.

Return assigned crew to their owners unless killed, wounded, pinned, or otherwise removed.

Reduce Site Orbit if applicable.

Discard one-time Passages.

If the current zone deck is empty, cross to the next Milestone.

---

## MOTHER

MOTHER must be tempting every cycle.

### Universal MOTHER Intervention

Once per cycle, when a task with at least one assigned crew would fail, players may choose:

```text
MOTHER completes the task.
MOTHER Autonomy +1.
If the task is an Ordeal mitigation, Blueprint opening, Core project, or prevents an immediate loss, MOTHER Autonomy +2 instead.
```

Restrictions:

- MOTHER cannot complete Council Address or Memorial rites.
- MOTHER cannot assign crew or create a task from nothing.
- The task must have had at least one human assigned.

### Corruption thresholds

Use MOTHER Autonomy, not Core Pressure, to determine corruption timing.

| Autonomy | Effect |
|---:|---|
| 0–2 | MOTHER help feels clean. No corruption unless card says so. |
| 3–5 | Each Intervention or Override adds 1 Corruption to the next zone deck. |
| 6–8 | Each Intervention or Override shuffles 1 Corruption into the current zone deck. |
| 9 | Mark the **MOTHER Ascendant** epilogue flag. Each further Autonomy gain resolves 1 Corruption immediately. |
| 10 | Loss: **MOTHER Takes the Wheel**. |

### Card-specific MOTHER Overrides

Cards may print Overrides that are better than the universal Intervention.

Example:

```text
MOTHER Override:
Complete this task immediately and ignore its Hazard.
MOTHER Autonomy +1.
If Autonomy is 6+, shuffle 1 Corruption into the current deck.
```

---

## Core Pressure

Core Pressure is the voyage tightening around the ship.

Use a 0–5 track.

Core Pressure increases:

- when the ship crosses into a new zone,
- when an Ordeal says so,
- when a Corruption card says so.

At each increase, perform Vigil Muster.

### Pressure bands

| Pressure | Rule |
|---:|---|
| 0 | Departure. No global modifier. |
| 1 | Unstable Site Hazards gain +1. |
| 2 | Red lines on Event cards are active. |
| 3 | Red lines on Ordeals are active. |
| 4 | Site Orbit values are reduced by 1, minimum 1. |
| 5 | At the start of each cycle, turn one random crew in hand face-down until assigned. |

This replaces the 1–10 table. Late-game weirdness belongs on Corruption cards, not a long global reference table.

---

## Passage cards

There are four teachable Passage types.

### Site

A temporary opportunity with Orbit and tasks.

Only one Site may be active at a time.

If a new Site appears while another Site is active, choose one:

1. abandon the old Site, or
2. pay the old Site’s Anchor cost to keep it and discard the new Site, or
3. discard the old Site and enter the new Site.

Recommended Site template:

```text
KEPLER-1649c
Ash Belt — Site
Orbit 3

HARVEST ICE
Need: BIO/GEN 2
Reward: Food +1, Fuel +1

HARVEST METALS
Need: ENG/GEN 3
Reward: Materials +2
Hazard 1: unless overstaffed by 1, wound one assigned crew.

INVESTIGATE DERELICT
Need: SCI/NAV 2
Reward: Peek at the next Passage. You may leave it or bottom it.

Anchor: Spend Fuel 1 to prevent this Site’s Orbit from decreasing this cycle.
```

### Ordeal

A public crisis. Known by name on the zone Milestone, hidden in order inside the deck.

Ordeals should use proportional consequences, not frequent instant loss.

Recommended Ordeal template:

```text
LONG JUMP
Ash Belt — Ordeal
Known Ordeal

Check:
Fuel 5+
Hull 6+

Before check:
NAV 2 reduces required Fuel by 1.
ENG 2 reduces required Hull by 1.

If short:
For each missing Fuel, choose: Fuel -1 or discard 1 Cryo card.
For each missing Hull, Hull -1.
If both checks fail, Hope -2.

Red line, Pressure 3+:
If either check fails, Core Pressure +1 after resolution.

MOTHER Override:
Pass the Fuel check.
MOTHER Autonomy +1.
```

### Event

Events include quiet moments, scarcity, signals, social pressure, standing repairs, deferred cards, and crossing warnings.

Do not teach these as separate card types. The card text explains itself.

Recommended Event template:

```text
RATIONS BECOME NUMBERS
Ash Belt — Event — Scarcity — Ration

Pay Ration.

Then choose:
- No one may Wake Pod this cycle. Hope -1.
- Wake Pod may be worked once for free this cycle. Then Food -1.
```

### MOTHER

MOTHER cards should force an argument.

Recommended MOTHER template:

```text
MOTHER OFFERS A CLEANER TRAJECTORY
Ash Belt — MOTHER

Choose one:

Human calculation:
Assign NAV 2 this cycle. If completed, Fuel +1 and peek at the next Passage.

MOTHER route:
Fuel +2 now.
MOTHER Autonomy +1.
If Autonomy is 3+, add 1 Corruption to the next zone deck.
```

---

## Always-available ship tasks

Use fewer ship tasks. Each should be a real alternative to current Passage work.

| Task | Need | Result |
|---|---|---|
| Repair Hull | ENG/GEN 2 + Materials 1 | Hull +2 |
| Restore Power | ENG 2 + Materials 1 | Power Output +1, max 6 |
| Recycle Stores | BIO/GEN 2 | Food +1 |
| Plot Burn | NAV/SCI 2 | Fuel +1, or peek at next Passage if Fuel is 6+ |
| Treat Wounds | MED 1 per wound | Remove wounds from assigned crew |
| Wake Pod | any 1 crew, capacity available | Draw 1 Cryo crew; Awake Population +1 |
| Open Blueprint Slot | ENG/GEN 3 | Add 1 progress to adjacent locked slot |
| Council Address | any 3 crew | Hope +1, or prevent 1 Hope loss this cycle |

Default rule: each named task can be worked once per cycle unless it says Repeatable.

---

## Chambers

Chambers are still core. They make the ship feel unfinished and personally built.

### Blueprint slots

Each opened slot increases Population Capacity by +1.

Habitation chambers add more capacity.

### Opening a slot

```text
OPEN BLUEPRINT SLOT
Need: ENG/GEN 3
Work: 2 for slots adjacent to Command Spine; Work: 3 otherwise.
Completion cost: Materials 1.
Restriction: chosen locked slot must be adjacent to an open chamber.

When complete:
Draw 3 Chamber cards. If the chosen slot touches two or more open chambers, draw 4 instead.
Choose 1 to install. Bottom the rest.
Name the chamber.
Population Capacity +1.
```

### Chamber design rule

Each Chamber card should have exactly three things:

1. one online benefit,
2. one task or project,
3. one MOTHER Override or failure interaction.

Example:

```text
HYDROPONICS SECTOR
Chamber — Biosphere

Online:
The first Ration each zone costs Food 1 less.

Task — CULTURE EMERGENCY CROPS
Need: BIO 2
Reward: Food +2
Hazard 1 at Pressure 2+.

MOTHER Override:
Complete CULTURE EMERGENCY CROPS now.
MOTHER Autonomy +1.
```

---

## Department Heads

Department Heads create ownership and advocacy, not command over other players.

Each Department Head has:

1. a domain,
2. a once-per-cycle support ability,
3. a once-per-zone Emergency Order,
4. a roleplaying priority.

Remove broad “final authority” except for rules disputes inside that domain.

### Consent rules

- A player controls their own crew.
- No player may move another player’s crew without permission.
- MOTHER Intervention or Override requires table majority.
- If a MOTHER decision would wound, kill, pin, or transfer a player’s crew, that player may veto it unless the table spends Hope 1.

### Example Department Head

```text
CHIEF ENGINEER
Domain: Hull, Power Output, Materials, chamber construction.

Support:
Once per cycle, one GEN from your hand assigned to Repair Hull, Restore Power, or Open Blueprint Slot counts as ENG.

Emergency Order:
Once per zone, prevent up to 2 Hull or Power Output loss from one Passage. Then spend Materials 1 or wound one assigned ENG/GEN crew.

Priority:
You should argue for the ship to remain buildable. If Materials is 0 at a Milestone crossing, Hope -1 unless you opened a chamber this zone.
```

The Priority gives the role a voice, but it should be light. Avoid private scoring.

---

## Active row limits

To preserve readability:

- at most one active Site,
- at most one standing Event,
- at most one active Ordeal after the reveal phase,
- any number of open chambers, but only online chambers need markers,
- unfinished chamber and blueprint progress stays on the source card.

If a second standing Event would enter play, the table chooses:

1. resolve the older standing Event’s penalty and discard it, or
2. discard the new Event after suffering its immediate red-line penalty.

This turns table sprawl into a choice rather than a layout problem.

---

## Failure conditions

Use five main loss conditions in the prototype.

| Failure | Trigger |
|---|---|
| The Hull Opens | Hull reaches 0 |
| The Light Goes Out | Power Output reaches 0 |
| Starvation | A Ration must be paid and Food cannot cover it |
| We Lost the Way | Fuel is required and cannot be paid |
| MOTHER Takes the Wheel | MOTHER Autonomy reaches 10 |

Use Hope collapse as a sixth condition only if the social system is central to the prototype:

| Failure | Trigger |
|---|---|
| Mutiny | Hope is 0 and another Hope loss would occur |

Move these out of the prototype and into full-game / scenario rules:

- The Frozen Are Gone,
- We Failed Our People,
- special Cryo deck destruction loss,
- faction-specific collapse.

---

## Epilogue flags

For now, replace the detailed ending priority table with five flags.

| Flag | Mark if... |
|---|---|
| Human Command | MOTHER Autonomy is 0–5 at Arrival |
| MOTHER Ascendant | MOTHER Autonomy is 7–9 at Arrival |
| Children | At least 3 Next-Gen or child crew survive |
| Archive | Archive Core is open or 3 Archive clues are unlocked |
| Living Ship | Habitation and Hydroponics are both open and online |

At Arrival, read one epilogue assembled from the flags. The full ending deck can return after core loop validation.

---

# Act I revised prototype

## Goal

Reach Quiet Harvest after surviving the Ash Belt deck.

Quiet Harvest is prototype Arrival. Reaching it means success immediately.

## Prototype components

| Component | Count |
|---|---:|
| Milestones | Earth Wreckage, Ash Belt, Quiet Harvest |
| Ash Belt Passages | 10–12 |
| Cryo crew | 24 |
| Department Heads | 4 |
| Locked blueprint slots | 4 |
| Chamber cards | 8 |
| Corruption cards | 6 |
| Failure cards | 5 |
| Resource tracks | Hull, Fuel, Food, Materials, Power Output, Hope, Autonomy |

## Ash Belt Passage mix, 12-card version

| Type | Count | Notes |
|---|---:|---|
| Site | 3 | 1 safe, 1 high-yield hazardous, 1 information Site |
| Ordeal | 2 | Long Jump, Radiation Belt |
| Event | 5 | Include 2 Ration icons, 1 standing repair, 1 signal, 1 quiet temptation |
| MOTHER | 2 | One clean offer, one frightening offer |

Known Ordeals are listed on the Ash Belt Milestone.

## Starting resources

| Resource | Value |
|---|---:|
| Hull | 7 |
| Fuel | 4 |
| Food | 5 |
| Materials | 3 |
| Power Output | 3 |
| Hope | 5 |
| MOTHER Autonomy | 0 |
| Core Pressure | 0 |

Set Population Capacity to starting Awake Population +2.

Each opened slot adds Capacity +1.

## What Act I must prove

The prototype is successful only if these are true:

1. Players understand the cycle after one round.
2. Every cycle has at least two plausible priorities.
3. Players voluntarily use MOTHER in some games.
4. Waking crew feels tempting before it feels safe.
5. Opening a chamber feels like changing the ship’s future, not drawing a random perk.
6. Ration pressure makes population matter without forcing food work every turn.
7. The table state remains readable with one Site, one standing Event, and several chamber tasks.
8. Reaching Quiet Harvest feels like a clean win.

---

# Systems to cut or park for now

Cut from the first prototype:

- full six-zone route,
- 72-card full-game structure,
- 1–10 Core Pressure table,
- per-cycle Food upkeep,
- Fuel Pressure as a separate Passage type,
- Signal as a separate Passage type,
- Scarcity as a separate Passage type,
- Drift keyword,
- multiple active Sites,
- multiple standing Events,
- detailed ending priority table,
- Next-Gen births,
- faction sub-decks,
- generic crew transfer Hope penalty,
- Failure conditions tied to Cryo deck destruction or no awake adults.

Park for later expansion:

- births and Next-Gen,
- Archive ending web,
- faction politics,
- complex Corruption disposal,
- Core Drive project,
- named-crew rarity tuning,
- long/campaign route.

Keep and test hard:

- named crew as action economy,
- Passage deck as route clock,
- known Ordeals hidden in order,
- Sites as temporary opportunities,
- chambers as visible ship growth,
- MOTHER Intervention,
- Ration icons,
- Vigil at Milestone crossings,
- Department Head ownership.

---

# Playtest checklist

Track these numbers during Act I:

| Metric | Target |
|---|---|
| Teach time | Under 12 minutes after setup |
| Average cycle after round 3 | 2–4 minutes |
| Number of MOTHER uses | 1–3 per successful game |
| Number of Wake Pod uses | 1–4 per game |
| Number of chamber openings | 1–2 per game |
| Number of turns with obvious best action | Fewer than 25% |
| Number of active fronts at once | Usually 2–3 |
| Player-reported confusion points | Fewer each playtest |
| Loss rate first-time groups | 50–70% acceptable for survival prototype |
| Loss cause | Should vary between Hull, Fuel, Food, Hope, MOTHER, not always one track |

Ask players after each game:

1. What decision felt hardest?
2. Did you ever feel MOTHER was worth the cost?
3. Which rule did you forget?
4. Which task felt automatic or boring?
5. Which crew death or wound do you remember?
6. Did you feel you could prepare without feeling safe?
7. Did the table ever become unreadable?

---

## Final design thesis

COREBOUND should be built around three visible fronts every cycle:

1. **The road** — the current Passage and known Ordeals somewhere ahead.
2. **The ship** — resources, chambers, power, wounds, and capacity.
3. **The future** — MOTHER Autonomy, Corruption, Vigil, and epilogue flags.

Players win by reaching Arrival, but they have fun because the route constantly asks them to choose what kind of survivors they are becoming.

