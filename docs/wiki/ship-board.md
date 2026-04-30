# Ship Board

The board tracks four things with matching token rows: Hull, Fuel, Parts, and spent MOTHER cards.

| Track | Start | Lose if... |
|---|---:|---|
| Hull | 5 | Hull reaches 0 |
| Fuel | 3 | You may still play at 0, but only Fuel 0 Stars are reachable |
| Parts | 0 | Never — Parts only go up or down when spent |
| MOTHER cards | 0 used / 6 available | A 7th MOTHER card is needed |

## Hull

The physical ark. Hull comes back from Star rewards that grant `Hull +N`, or once per sector from Bulkhead Garden if installed.

## Fuel

The route control resource. Every Star shows its Fuel cost (0–3) in the Need section. If Fuel is below that cost, that Star is unreachable. If all three Horizon Stars are unreachable, you may **Reroute**: discard them, use 1 MOTHER card, redraw three. With no MOTHER cards left and no reachable Star, the run is **Stranded in the Reach**.

## Parts

The build resource. Spent only to install Chambers. Earned from some Star rewards. There is no Parts cap.

MOTHER cannot pay Parts.

## MOTHER cards — the band track

Six MOTHER cards begin in the MOTHER Deck. Click the deck to draw a temporary wild into your crew hand. Whenever you resolve an action with a highlighted MOTHER card, that card is spent and increases the MOTHER used count.

```text
MOTHER Deck   →   spent cards set the band
```

| Used | Band | Band effect |
|---:|---|---|
| 0–2 | Clear Route | none |
| 3–4 | Bent Route | `3+ MOTHER` lines on cards activate |
| 5–6 | Hostile Route | `3+` and `5+ MOTHER` lines active; **Gates need +1 icon** |
| 7 needed | MOTHER Takes the Wheel | loss |

Spent MOTHER cards are also the ending barometer:

| Used | Ending tone |
|---:|---|
| 0–2 | Human Command |
| 3–4 | Shared Future |
| 5–6 | MOTHER Ascendant |
| 7 | Loss |

Next: [Stars](stars.md).
