# Solo JS Prototype Plan

Previous: [Playtest Checklist](playtest-checklist.md) | [Wiki Index](README.md)

## Purpose

Build the simplest possible browser tool for solo digital testing of the Act I prototype.

The tool is a manual table-state manager. It should make cards, decks, tracks, and assignments easy to manipulate without enforcing game rules.

Primary question:

```text
Is the Act I loop fun when the bookkeeping friction is low?
```

## Platform

Use a static vanilla JavaScript app.

| Choice | Decision |
|---|---|
| Runtime | Browser |
| Files | `index.html`, `style.css`, `game.js`, optional `data.js` |
| Dependencies | None |
| Hosting | Local file, simple dev server, GitHub Pages, or Netlify |
| Persistence | `localStorage` only |

No build tooling is needed for the first version.

## Product Shape

This is not a video game version of COREBOUND. It is a solo digital table.

The player should be able to:

| Need | Control |
|---|---|
| Reveal cards | Draw and flip Passage cards manually |
| Move cards | Move any card between table zones |
| Reorder cards | Move cards up, down, top, bottom, or shuffle a stack |
| Hide information | Flip cards face-down |
| Track state | Increment and decrement resources manually |
| Track crew use | Assign crew cards to named task rows manually |
| Reset tests | New game, save, load, export log |

## Non-Goals

Do not build these in the first version:

| Non-goal | Reason |
|---|---|
| Rules enforcement | Rules are still changing and manual playtesting is the goal |
| Multiplayer sync | Solo facilitator testing is enough |
| Drag-and-drop dependency | Buttons are clearer and faster to debug |
| Polished visual design | Readability beats theme |
| Animations | They add no playtest value |
| Automated win/loss detection | Manual failure and success calls are sufficient |
| AI opponents or suggestions | The test is about human priorities |

## Minimum Table Zones

Implement card containers as plain lists.

| Zone | Contents |
|---|---|
| Passage Deck | Face-down Ash Belt cards |
| Current Passage | The revealed card for the current cycle |
| Active Site | At most one Site, managed manually |
| Standing Event | At most one standing Event, managed manually |
| Discard | Resolved Passage cards |
| Cryo Deck | Face-down crew cards |
| Awake Crew | Available crew cards |
| Assigned Crew | Crew grouped under task names |
| Chamber Deck | Face-down chamber cards |
| Chamber Offers | Drawn chamber choices |
| Installed Chambers | Opened chambers |
| Memorial | Dead or removed crew |

The app should not prevent illegal states. Illegal states can be useful during testing.

## Minimum Tracks

Show each track as a number with minus and plus buttons.

| Track | Starting Value |
|---|---:|
| Hull | 7 |
| Fuel | 4 |
| Food | 5 |
| Materials | 3 |
| Power Output | 3 |
| Hope | 5 |
| MOTHER Autonomy | 0 |
| Core Pressure | 0 |
| Awake Population | Manual |
| Population Capacity | Starting awake population +2 |
| Cycle | 1 |

Include a free-text `Status` field for notes like `Won`, `Lost: Hull`, or `Testing alternate ruling`.

## Card Model

Use one simple object shape for all cards.

```js
{
  id: "long-jump",
  type: "passage",
  subtype: "ordeal",
  title: "Long Jump",
  faceUp: false,
  text: "Check: Fuel 5+, Hull 6+...",
  tags: ["ash-belt", "known-ordeal"]
}
```

Crew can use the same shape with extra text for skills, Vigil, wounds, and owner if needed.

```js
{
  id: "crew-ada-chen",
  type: "crew",
  title: "Ada Chen",
  faceUp: true,
  text: "ENG 1, GEN 1, Vigil 4, Wounds 0/2"
}
```

Do not model rules as code yet. Store rules as readable text.

## Core Controls

Each card should have the same small control set.

| Control | Effect |
|---|---|
| Flip | Toggle front/back |
| Move | Choose destination zone from a select box |
| Up | Move earlier in the current zone |
| Down | Move later in the current zone |
| Top | Move to top of current zone |
| Bottom | Move to bottom of current zone |
| Edit | Edit card title or text in place |

Each stack should have these controls.

| Control | Effect |
|---|---|
| Draw | Move top card to a chosen zone and flip it face-up |
| Shuffle | Randomize order of cards in that zone |
| Flip All Down | Hide all cards in that zone |
| Collapse | Hide card text for compact view |

## Screen Layout

Keep the layout plain and dense.

```text
Top:        Cycle, status, save/load/reset, playtest log buttons
Left:       Resource tracks and population
Center:     Current Passage, Active Site, Standing Event
Right:      Passage Deck, Discard, Cryo Deck, Chamber Deck
Bottom:     Awake Crew, Assigned Crew, Ship Tasks, Chambers, Memorial
```

Use simple borders, default fonts, and small buttons. Avoid art, icons, and custom card frames.

## Ship Tasks

Represent tasks as editable rows, not automated actions.

| Task |
|---|
| Repair Hull |
| Restore Power |
| Recycle Stores |
| Plot Burn |
| Treat Wounds |
| Wake Pod |
| Open Blueprint Slot |
| Council Address |

Each task row should include:

| Field | Purpose |
|---|---|
| Task name | Which action is being considered |
| Need | Human-readable requirement |
| Assigned crew | Manual text or linked card list |
| Notes | Outcome, cost, hazard, reminder |
| Worked | Manual checkbox for this cycle |

## Playtest Log

The log should be append-only unless manually cleared.

Useful buttons:

| Button | Log Entry |
|---|---|
| Start Cycle | Cycle number and current deck count |
| MOTHER Used | Current Autonomy and note field |
| Wake Pod Used | Current population and capacity |
| Chamber Opened | Installed chamber name |
| Confusion | Free-text note |
| Obvious Action | Free-text note |
| End Game | Win/loss and cause |

Allow export as copied JSON or plain text.

## Data Scope For Version 1

Hardcode only enough content to test Act I.

| Data | Count |
|---|---:|
| Milestones | 3 |
| Ash Belt Passage cards | 12 |
| Cryo crew | 24 |
| Department Heads | 4 |
| Chamber cards | 8 |
| Corruption cards | 6 |
| Failure cards | 5 |

Placeholder card text is acceptable where final content does not exist. The movement and visibility controls are more important than card completeness.

## Development Phases

### Phase 1: Static Table

Goal: render the manual table with hardcoded data.

Tasks:

- Create `index.html`, `style.css`, `game.js`, and optional `data.js`.
- Render resource tracks with plus and minus buttons.
- Render zones as lists of cards.
- Render cards with title, type, text, and face-up state.
- Add reset-to-initial-state.

Done when a full Act I starting table is visible in the browser.

### Phase 2: Card Manipulation

Goal: make cards easy to move, flip, and reorder.

Tasks:

- Add Flip to every card.
- Add Move destination selector to every card.
- Add Up, Down, Top, and Bottom controls.
- Add stack-level Shuffle.
- Add Draw from Passage Deck to Current Passage.
- Add Draw from Cryo Deck to Awake Crew.
- Add Draw from Chamber Deck to Chamber Offers.

Done when the whole prototype can be manually played without touching the code.

### Phase 3: Manual Playtest Helpers

Goal: reduce bookkeeping friction during solo tests.

Tasks:

- Add cycle and status fields.
- Add editable ship task rows.
- Add assigned crew area.
- Add simple playtest log buttons.
- Add free-text notes per cycle.
- Add export log as text.

Done when a solo test can produce useful notes without a separate document.

### Phase 4: Persistence

Goal: make interrupted tests recoverable.

Tasks:

- Save full state to `localStorage`.
- Load saved state on page open.
- Add manual Save button.
- Add Clear Save button.
- Add Export State as JSON.
- Add Import State from JSON.

Done when a test can be paused, resumed, duplicated, or shared as text.

### Phase 5: Only If Needed

Add these only after at least three solo tests.

| Feature | Add If |
|---|---|
| Drag and drop | Button movement feels too slow |
| Keyboard shortcuts | Repeated solo play becomes tedious |
| Compact mode | The table becomes unreadable |
| Print view | Physical reference cards become useful |
| Scenario editor | Card text changes every test |

## Implementation Rules

Keep the code intentionally boring.

| Rule | Reason |
|---|---|
| One global `state` object | Easy to inspect and export |
| Re-render after every action | Simpler than partial DOM updates |
| Use event delegation | Avoid attaching many listeners repeatedly |
| Store card text as strings | Avoid encoding unstable rules |
| Prefer buttons over drag-and-drop | More reliable and less code |
| Avoid clever abstractions | Prototype speed matters more |

## Success Criteria

The app succeeds if it enables fast solo tests with minimal friction.

| Test | Target |
|---|---|
| Start a new Act I run | Under 10 seconds |
| Reveal and resolve a cycle manually | Under 2-4 minutes after learning |
| Move any card anywhere | One or two clicks plus destination choice |
| Reorder a deck | No code changes required |
| Record a playtest note | Under 10 seconds |
| Recover from accidental refresh | Saved state restores |

## Recommended First Build

Build only this first:

```text
Resource counters
Passage Deck -> Current Passage -> Discard
Cryo Deck -> Awake Crew -> Assigned Crew
Chamber Deck -> Chamber Offers -> Installed Chambers
Flip, move, reorder, shuffle
Editable ship task rows
Local save/load
Plain text playtest log
```

If that version feels useful, improve the content. If it does not feel useful, do not polish the UI.

## Related Pages

| Link | Relationship |
|---|---|
| [Act I Prototype](act-i-prototype.md) | Defines the prototype scope and starting resources. |
| [Cycle Loop](cycle-loop.md) | Defines the cycle the app should help facilitate. |
| [Passage Cards](passage-cards.md) | Defines the card types the app must display. |
| [Playtest Checklist](playtest-checklist.md) | Defines the metrics the app should help record. |

Previous: [Playtest Checklist](playtest-checklist.md)
