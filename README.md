# COREBOUND: Starpath

A semi-cooperative survival race about crossing the universe with a damaged ark ship.

> Propose a visible Star, Chamber, or Gate. Commit loyal crew, negotiate help, and use MOTHER only when the ship needs a shortcut. If the ship fails, everyone loses. If the ship passes the Final Gate, the player with the most living loyal crew wins.

## Run The Prototype

Open `index.html` in a browser, or serve locally:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/>. The prototype is still solo-playable: it uses one solo player while enforcing the new proposal loop, Wake choices, Gate Drafts, Final Gate success, and loyal crew winner count.

| Key | Action |
|---|---|
| <kbd>M</kbd> | Toggle the manual |
| <kbd>R</kbd> | Reset the voyage |
| <kbd>Esc</kbd> | Close overlays |

## Documentation

| Link | Purpose |
|---|---|
| [Wiki](docs/wiki/README.md) | Linked reference for the design. |
| [Introduction](docs/wiki/introduction.md) | Premise, teach text, design thesis. |
| [Leadership and Proposals](docs/wiki/leadership.md) | Turn structure, Implementer, winning. |
| [MOTHER](docs/wiki/mother.md) | Route bands and what MOTHER can or cannot do. |
| [Chambers](docs/wiki/chambers.md) | Public ship upgrades. |
| [Prototype Components](docs/wiki/prototype.md) | Card counts, sector difficulty. |
| [Playtest Checklist](docs/wiki/playtest-checklist.md) | What to track in early tests. |

## The Whole Game In One Sentence

> Propose, commit crew, negotiate, resolve or dissolve, survive Gates, count loyal crew.
