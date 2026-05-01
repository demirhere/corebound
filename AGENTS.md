# AGENTS.md

## Repo Shape

- This repo is a static vanilla JS solo prototype for **COREBOUND: Starpath**, not a packaged app: there is no `package.json`, build step, lint config, test runner, or CI workflow.
- Runtime entrypoint is `index.html`, which loads `style.css`, then `data.js`, then `game.js` with `defer`.
- `data.js` is the content/data source: icons, crew, three sector Star decks, Gates, Chambers, and starting values. Cards do not contain executable rules text.
- `game.js` is a strict rules engine plus renderer. It owns one mutable `state` and re-renders after each action. State is also exposed as `window.STARPATH` for browser dev tools and ad-hoc test harnesses.
- `docs/wiki/README.md` is the rules index.

## Local Verification

- Serve locally with `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/`.
- A direct `file://` open also works for the current app because it has no external dependencies, but a local server is safer for browser testing.
- There are no automated checks configured. For engine smoke tests, `data.js` and `game.js` can be evaluated under a minimal Node-based DOM mock that exposes `window.STARPATH.state` for assertions.

## Prototype Constraints

- Keep the app dependency-free unless the user explicitly asks for tooling.
- The prototype remains solo-playable, but it models the multiplayer leadership rules with one solo player.
- The prototype enforces the rules. Illegal states are not reachable through the UI; the engine refuses invalid moves rather than allowing them.
- Card content is data-only. Rules logic lives in `game.js`.
- If a prototype change alters game design, rules, setup, components, or playtest goals, update the matching docs in `docs/wiki/` in the same change.
- Prefer boring, direct DOM/state code over abstractions: data-action delegation, one `state`, render-after-action.

## Game Loop In Code

- Phases are `play -> (draw Horizon, propose/resolve Star x3) -> gate -> gateDraft after Gates 1-2 -> play -> final Gate -> finished|loss`.
- Crew are loyal to players via `ownerPlayerId`; Cryo crew are unowned. The solo prototype starts with one player owning six awake crew and six crew in Cryo.
- Crew flags remain `awake`, `tired`, and `wounded` because Wounded crew can also become Tired after committing.
- MOTHER is six cards (`state.motherCards = [{id, used}, ...]`). Temporary highlighted MOTHER cards add wild icons; resolving a proposal spends only the used cards. A 7th card needed = loss.
- Each Star prints its own Travel Fuel cost; the Horizon row is three revealed Stars. Active discounts/free-Star bonuses are shown outside the card in Active Effects. Stars have no penalty.
- A proposal succeeds iff resources are sufficient (Fuel/Parts), committed crew icons plus used MOTHER wilds cover the Need, at least one human crew is committed, and threshold rules are met.
- MOTHER threshold lines (`mother3`, `mother5`) on Stars activate based on `motherUsedCount()`: `3+ ✶` at 3+ spent cards and `5+ ✶` at 5+ spent cards. At 5+ spent cards, Gates need +1 icon.
- MOTHER cannot satisfy `extraCrew` requirements, cannot pay Fuel, cannot pay Parts, cannot count as a human crew, and cannot prevent wounds.
- Gates must be passed. If the available crew and MOTHER cards cannot cover the Gate after three Stars, the run fails.
- After a Gate, all `tired` flags clear. `wounded` persists.
- Chambers are repaired by proposal: spend `parts` and commit crew matching `build` icons; up to 3 repaired.
- Wake rewards open a choice overlay: reveal up to two Cryo crew, the Implementer recruits one loyal crew Tired, and unchosen crew return to the bottom of Cryo.
- Gate Drafts run after Gate 1 and Gate 2. The solo prototype drafts one crew for the solo player.
- Passing the Final Gate ends the game. The winner screen counts living loyal crew, healthy loyal crew, Final Gate contribution, and Final Gate Implementer.

## App Behavior To Preserve

- State persists in `localStorage` under `corebound.starpath.v3`; changing the key discards existing browser saves.
- Keyboard shortcuts: `M` toggles the manual, `R` resets after confirm, `Esc` closes overlays.
- Crew tiles are buttons; click highlights / unhighlights. The hand shows awake loyal crew only; the Cryo deck is displayed separately.
- MOTHER Deck sits with the other decks. Click it to draw a temporary wild card into the crew row; click that temporary card again to return it before resolving.
- Each sector starts unrevealed. Clicking the Sector Deck reveals the sector card/Gate and its Horizon Deck. Horizon starts empty; clicking the visible Horizon Deck draws three Stars from that sector's shuffled Star deck.
- A Reroute action is exposed when no Horizon Star is affordable: discards all three, uses 1 MOTHER card, redraws. With no MOTHER cards left, the run is **Stranded in the Reach** (loss).
- Scout rewards open a modal overlay; one chosen Star goes to the top of the current sector deck, the other two are discarded.
- Chamber market shows up to 3 Chambers; each Chamber can be proposed when the player has selected at least one Ready loyal crew.

## Rules Sources

- For the full design and per-topic rules, use the wiki pages under `docs/wiki/`.
- For prototype counts and sector difficulty, use `docs/wiki/prototype.md`.
- For playtest metrics and what the prototype should help measure, use `docs/wiki/playtest-checklist.md`.
