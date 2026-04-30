# Prototype Components

| Component | Count |
|---|---:|
| Crew cards | 12 (6 awake, 6 cryo) |
| Star cards | 36 (12 per sector deck) |
| Gate cards | 6 (2 per sector pool) |
| Arrival cards | 6 (3 drawn at the Final Approach) |
| Chamber cards | 9 (market shows 3, refilled when one is installed) |
| MOTHER cards | 6 (each is a wild icon) |
| Ship board | 1 |
| MOTHER deck | 1 |
| Fuel tokens | 10 |
| Parts tokens | 8 |
| Hull marker | 1 |

## Sector difficulty

| Sector | Star icon need | Travel mix | Gate icon need |
|---|---:|---|---:|
| Sector 1 | 2–3 | 5 Near, 4 Far, 3 Deep | 4 |
| Sector 2 | 3–4 | 3 Near, 5 Far, 3 Deep, 1 Abyssal | 5 |
| Sector 3 | 4–5 | 2 Near, 4 Far, 4 Deep, 2 Abyssal | 6 |

At Hostile Route (5+ used MOTHER cards), every Gate's Need grows by +1.

## Target play time

A first playtest game should run **30–45 minutes**, including teach.

## Solo digital prototype

The browser app at [`index.html`](../../index.html) implements the full rules:

- 3 sectors × (3 Stars + 1 Gate) → Final Approach.
- The board starts with an unrevealed Sector Deck. Click it to reveal the sector card/Gate and make that sector's Horizon Deck available.
- The Horizon starts empty. Click the visible Horizon Deck to draw 3 Stars from the current sector's shuffled Star deck into the center slots.
- Each Star shows its Fuel cost in its Need section and carries its own **Travel here** button.
- The Chamber market shows up to 3 chambers; each shows its own **Install** button. Installed chambers are replaced by the next chamber from the deck.
- The MOTHER Deck sits with the other decks. Click it to draw a temporary wild card into the crew hand; click that temporary MOTHER card again to return it before acting.
- Highlighted crew + MOTHER cards drive every action button. The button is enabled when resources, icons, and threshold rules are met. There is no "Resolve" or "Decline" button.
- If all three Horizon Stars are unaffordable, a **Reroute** action discards them, uses 1 MOTHER card, and redraws. With no MOTHER cards left, the run is **Stranded in the Reach** (loss).
- MOTHER threshold lines on Stars (`3+ MOTHER`, `5+ MOTHER`) activate based on the current band: Clear / Bent / Hostile Route.
- At 5+ MOTHER cards used, Gates need +1 any icon.
- MOTHER cards may fill gaps only if at least one human is highlighted.
- Gates must be passed. If the available crew and MOTHER cards cannot cover the Gate after three Stars, the run fails immediately.
- Stars have no penalty. If you don't engage, you don't lose anything but the Reward.
- Wounded crew flip and contribute 1 icon; `Heal` rewards flip them back.
- The Crew hand shows only awake crew. The Cryo Deck is visible as a deck/count; `Wake` rewards draw from it automatically, and woken crew are Tired until the next sector refresh.
- The Arrival deck stays hidden until after the third Gate, when 3 Arrivals are drawn and shown side-by-side.
- The Arrival picker discounts Need icons by matching Legacy stamps from visited Stars, up to 3 (or 4 with Seed Vault for Life arrivals).
- Endings are generated from Destination + MOTHER tone (0–2 / 3–4 / 5–6) + dominant Legacy.

State persists in `localStorage`. `R` resets, `M` toggles the manual.

Next: [Playtest Checklist](playtest-checklist.md).
