# Chambers

Previous: [Ship Tasks](ship-tasks.md) | [Wiki Index](README.md) | Next: [Department Heads](department-heads.md)

Chambers are still core. They make the ship feel unfinished and personally built.

## Blueprint Slots

Each opened slot increases Population Capacity by +1.

Habitation chambers add more capacity.

## Opening A Slot

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

## Chamber Design Rule

Each Chamber card should have exactly three things:

| Element |
|---|
| One online benefit. |
| One task or project. |
| One MOTHER Override or failure interaction. |

Example:

```text
HYDROPONICS SECTOR
Chamber - Biosphere

Online:
The first Ration each zone costs Food 1 less.

Task - CULTURE EMERGENCY CROPS
Need: BIO 2
Reward: Food +2
Hazard 1 at Pressure 2+.

MOTHER Override:
Complete CULTURE EMERGENCY CROPS now.
MOTHER Autonomy +1.
```

## Related Pages

| Link | Relationship |
|---|---|
| [Resources](resources.md#power-output-clarification) | Power Output determines how many chambers can be online. |
| [Ship Tasks](ship-tasks.md) | Open Blueprint Slot is an always-available ship task. |
| [Act I Prototype](act-i-prototype.md#prototype-components) | The prototype includes locked blueprint slots and chamber cards. |

Previous: [Ship Tasks](ship-tasks.md) | Next: [Department Heads](department-heads.md)
