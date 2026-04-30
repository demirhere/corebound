# AGENTS.md

## Repo Shape

- This repo is a static vanilla JS solo prototype for **COREBOUND: Starpath**, not a packaged app: there is no `package.json`, build step, lint config, test runner, or CI workflow.
- Runtime entrypoint is `index.html`, which loads `style.css`, then `data.js`, then `game.js` with `defer`.
- `data.js` is the content/data source: icons, legacies, crew, three sector star decks, gates, arrivals, chambers, ending text. Star cards no longer carry penalty fields; Gates are hard pass/fail checks.
- `game.js` is a strict rules engine plus renderer. It owns one mutable `state` and re-renders after each action. State is also exposed as `window.STARPATH` for browser dev tools and ad-hoc test harnesses.
- `docs/wiki/README.md` is the rules index.

## Local Verification

- Serve locally with `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/`.
- A direct `file://` open also works for the current app because it has no external dependencies, but a local server is safer for browser testing.
- There are no automated checks configured. For engine smoke tests, `data.js` and `game.js` can be evaluated under a minimal Node-based DOM mock that exposes `window.STARPATH.state` for assertions.

## Prototype Constraints

- Keep the app dependency-free unless the user explicitly asks for tooling.
- Unlike the prior free-form tabletop, this prototype **enforces the rules**. Illegal states are not reachable through the UI — the engine refuses invalid moves rather than allowing them.
- Card content is data-only. Rules logic lives in `game.js`. Cards do not contain executable card text.
- If a prototype change alters game design, rules, setup, components, or playtest goals, update the matching docs in `docs/wiki/` in the same change.
- Prefer boring, direct DOM/state code over abstractions: data-action delegation, one `state`, render-after-action.

## Game Loop In Code

- Phases are `play → (draw Horizon, resolve Star ×3) → gate → (next sector) → arrival → ending|loss`. There is no separate `commit` phase — Stars and Chambers each carry their own `Travel`/`Install` button that resolves immediately when clicked.
- Crew states: `awake`, `tired`, `wounded`, `cryo` (combinable via flags `awake/tired/wounded`).
- MOTHER is six cards (`state.motherCards = [{id, used}, …]`). Highlighted unused cards add wild icons; resolving the action moves them to `used: true`. A 7th card needed = loss.
- Each Star prints its own `travel` Fuel cost; the Horizon row is just three slots for revealed cards. Stars have no penalty.
- An action succeeds iff: resources sufficient (Fuel/Parts) + highlighted crew icons + highlighted MOTHER wilds cover the Need + at least one human if MOTHER is being used + threshold rules met (`extraCrew`, etc).
- MOTHER threshold lines (`mother3`, `mother5`) on Stars activate based on `motherUsedCount()`: 0–2 Clear, 3–4 Bent, 5–6 Hostile. At 5+ MOTHER, Gates need +1 any icon.
- MOTHER cannot satisfy `extraCrew` requirements, cannot pay Fuel, cannot pay Parts, and cannot prevent wounds.
- Gates must be passed. If the available crew and MOTHER cards cannot cover the Gate after three Stars, the run fails.
- After a Gate, all `tired` flags clear. `wounded` persists.
- Chambers are installed by clicking Install on a market entry: spend `parts` and highlight crew matching `build` icons; up to 3 installed.
- Three Arrivals are drawn from `state.arrivalDeck` after the third Gate; pick one to attempt. If none can be covered, the Arrival button drifts the run.
- Endings combine destination + MOTHER tone (0–2 / 3–4 / 5–6) + dominant Legacy from visited Stars.

## App Behavior To Preserve

- State persists in `localStorage` under `corebound.starpath.v3`; changing the key discards existing browser saves.
- Keyboard shortcuts: `M` toggles the manual, `R` resets after confirm, `Esc` closes overlays.
- Crew tiles are buttons; click highlights / unhighlights. The hand shows awake crew only; the Cryo deck is displayed separately.
- MOTHER Deck sits with the other decks. Click it to draw a temporary wild card into the crew hand; click that temporary card again to return it before acting.
- Each sector starts unrevealed. Clicking the Sector Deck reveals the sector card/Gate and its Horizon Deck. Horizon starts empty; clicking the visible Horizon Deck draws three Stars from that sector's shuffled Star deck. Each Star shows its Fuel cost and carries its own **Travel here** button.
- A Reroute action is exposed when no Horizon Star is affordable: discards all three, uses 1 MOTHER card, redraws. With no MOTHER cards left, the run is **Stranded in the Reach** (loss).
- Scout rewards open a modal overlay; one chosen Star goes to the top of the current sector deck, the other two are discarded.
- Chamber market shows up to 3 chambers; each chamber has its own **Install** button, enabled when player has resources and highlighted crew/MOTHER cover the build.
- Arrivals are not revealed at setup. They are drawn (3) only after the third Gate.

## Rules Sources

- For the full design and per-topic rules, use the wiki pages under `docs/wiki/`.
- For prototype counts and sector difficulty, use `docs/wiki/prototype.md`.
- For playtest metrics and what the prototype should help measure, use `docs/wiki/playtest-checklist.md`.
