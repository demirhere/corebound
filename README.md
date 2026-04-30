# COREBOUND: Starpath

A cooperative journey card game about crossing the universe with a damaged ark ship.

> Click the Sector Deck, then the Horizon Deck to reveal three Stars. Highlight crew tiles. Draw a MOTHER card into your hand if you need a wild icon. The Travel button on each Horizon Star (and the Install button on each Chamber) lights up when you can pay for it. Click it. The Star's Legacy is recorded; spent MOTHER cards bend the future. Three Arrivals are drawn at the very end, and your visited Stars decide which one accepts you.

## Run the prototype

Open `index.html` in a browser, or serve locally:

```sh
python3 -m http.server 8000
```

…then visit <http://localhost:8000/>. The prototype enforces the rules: 3 sectors of 3 Stars + a Gate, then a Final Approach with 3 drawn Arrivals. Install Chambers along the way. Stars have no penalty — engage them or skip them.

| Key | Action |
|---|---|
| <kbd>M</kbd> | Toggle the manual |
| <kbd>R</kbd> | Reset the voyage |
| <kbd>Esc</kbd> | Close overlays |

## Documentation

| Link | Purpose |
|---|---|
| [Wiki](docs/wiki/README.md) | Linked reference for the design. |
| [Introduction](docs/wiki/introduction.md) | Premise, central mechanic, design thesis. |
| [MOTHER](docs/wiki/mother.md) | The three bands and what MOTHER can / cannot do. |
| [Chambers](docs/wiki/chambers.md) | Buyable permanent ship upgrades. |
| [Prototype Components](docs/wiki/prototype.md) | Card counts, sector difficulty. |
| [Playtest Checklist](docs/wiki/playtest-checklist.md) | What to track in early tests. |

## The whole game in one sentence

> Highlight crew, click an action — every spent MOTHER card bends the future.
