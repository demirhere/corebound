# Passage Cards

Previous: [Core Pressure](core-pressure.md) | [Wiki Index](README.md) | Next: [Ship Tasks](ship-tasks.md)

There are four teachable Passage types.

## Site

A temporary opportunity with Orbit and tasks.

Only one Site may be active at a time.

If a new Site appears while another Site is active, choose one:

| Option |
|---|
| Abandon the old Site. |
| Pay the old Site's Anchor cost to keep it and discard the new Site. |
| Discard the old Site and enter the new Site. |

Recommended Site template:

```text
KEPLER-1649c
Ash Belt - Site
Orbit 3

HARVEST ICE
Need: BIO/GEN 2
Reward: Food +1, Fuel +1

HARVEST METALS
Need: ENG/GEN 3
Reward: Materials +2
Hazard 1: unless overstaffed by 1, wound one assigned crew.

INVESTIGATE DERELICT
Need: SCI/NAV 2
Reward: Peek at the next Passage. You may leave it or bottom it.

Anchor: Spend Fuel 1 to prevent this Site's Orbit from decreasing this cycle.
```

## Ordeal

A public crisis. Known by name on the zone Milestone, hidden in order inside the deck.

Ordeals should use proportional consequences, not frequent instant loss.

Recommended Ordeal template:

```text
LONG JUMP
Ash Belt - Ordeal
Known Ordeal

Check:
Fuel 5+
Hull 6+

Before check:
NAV 2 reduces required Fuel by 1.
ENG 2 reduces required Hull by 1.

If short:
For each missing Fuel, choose: Fuel -1 or discard 1 Cryo card.
For each missing Hull, Hull -1.
If both checks fail, Hope -2.

Red line, Pressure 3+:
If either check fails, Core Pressure +1 after resolution.

MOTHER Override:
Pass the Fuel check.
MOTHER Autonomy +1.
```

## Event

Events include quiet moments, scarcity, signals, social pressure, standing repairs, deferred cards, and crossing warnings.

Do not teach these as separate card types. The card text explains itself.

Recommended Event template:

```text
RATIONS BECOME NUMBERS
Ash Belt - Event - Scarcity - Ration

Pay Ration.

Then choose:
- No one may Wake Pod this cycle. Hope -1.
- Wake Pod may be worked once for free this cycle. Then Food -1.
```

## MOTHER

MOTHER cards should force an argument.

Recommended MOTHER template:

```text
MOTHER OFFERS A CLEANER TRAJECTORY
Ash Belt - MOTHER

Choose one:

Human calculation:
Assign NAV 2 this cycle. If completed, Fuel +1 and peek at the next Passage.

MOTHER route:
Fuel +2 now.
MOTHER Autonomy +1.
If Autonomy is 3+, add 1 Corruption to the next zone deck.
```

## Related Pages

| Link | Relationship |
|---|---|
| [Cycle Loop](cycle-loop.md) | Each cycle starts by revealing a Passage. |
| [Active Row And Failure](active-row-and-failure.md) | Sites, standing Events, and Ordeals have active row limits. |
| [MOTHER](mother.md) | Overrides and MOTHER cards feed the Autonomy track. |

Previous: [Core Pressure](core-pressure.md) | Next: [Ship Tasks](ship-tasks.md)
