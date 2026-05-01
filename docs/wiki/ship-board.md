# Ship Board

The board tracks shared ship survival: Hull, Fuel, Parts, and spent MOTHER cards.

| Track | Start | Shared loss if... |
|---|---:|---|
| Hull | 5 | Hull reaches 0 |
| Fuel | 3 | Not direct loss, but only Fuel 0 Stars are reachable at 0 Fuel |
| Parts | 0 | Never; Parts are only gained and spent |
| MOTHER cards | 0 used / 6 available | A 7th MOTHER card would be needed |

## Hull

Hull is the physical ark. Hull comes back from Star rewards that grant `Hull +N`, or once per sector from Bulkhead Garden if repaired.

## Fuel

Fuel is the route control resource. Every Star shows its Fuel cost in the Need section. If Fuel is below that cost, that Star is unreachable.

If all three Horizon Stars are unreachable and nothing else helps, the active player may Reroute: discard all three, use 1 MOTHER card, and reveal three new Stars. With no MOTHER card left, the ship is Stranded in the Reach and all players lose.

## Parts

Parts are the build resource. Parts are spent only to repair Chambers and earned from some Star rewards. MOTHER cannot pay Parts.

## MOTHER Cards

Six MOTHER cards begin in the MOTHER Deck. Click the deck to draw a temporary wild into the proposal. Whenever a proposal resolves with used MOTHER cards, those cards are spent and increase the MOTHER used count.

```text
MOTHER Deck -> spent cards are counted directly on the ship board
```

| Used | Effect |
|---:|---|
| 0-2 | none |
| 3-4 | `3+ ✶` lines on cards activate |
| 5-6 | `3+ ✶` and `5+ ✶` lines active; Gates need +1 icon |
| 7 needed | MOTHER Takes the Wheel: shared loss |

MOTHER's role is a shared shortcut that can save the ship, steal timing, or push everyone closer to failure.

Next: [Stars](stars.md).
