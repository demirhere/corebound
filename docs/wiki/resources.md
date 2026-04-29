# Resources

Previous: [Game Structure](game-structure.md) | [Wiki Index](README.md) | Next: [Crew](crew.md)

Track these core resources:

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
| Core Pressure | Environmental and psychological pressure, 0-5 |

## Power Output Clarification

Power Output is not spent like money. It is the number of open chambers that can be online.

During cleanup, players may choose which open chambers are online, up to current Power Output.

If Power Output decreases and too many chambers are online, immediately turn chambers offline until the number online is legal.

If Power Output reaches 0, trigger [The Light Goes Out](active-row-and-failure.md#failure-conditions).

## Food Clarification

There is no automatic Food cost every cycle.

Food is paid when a Passage, Site, Ordeal, Event, or Milestone shows a Ration icon.

```text
Ration cost = ceil(Awake Population / 4)
```

This preserves the population pressure without forcing food bookkeeping every turn.

## Related Pages

| Link | Relationship |
|---|---|
| [Cycle Loop](cycle-loop.md) | Ration icons and online chambers resolve during upkeep and cleanup. |
| [Ship Tasks](ship-tasks.md) | Always-available tasks repair and refill resources. |
| [Active Row And Failure](active-row-and-failure.md) | Loss conditions are tied to several tracks. |

Previous: [Game Structure](game-structure.md) | Next: [Crew](crew.md)
