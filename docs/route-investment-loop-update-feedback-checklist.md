# Route Investment Loop Update Feedback Checklist

## Status

Consolidated feedback checklist for revising `docs/route-investment-loop-update-spec.md` into a smaller, clearer v2 spec.

## Source Inputs

- Original draft: `docs/route-investment-loop-update-spec.md`
- Current rules: `docs/PROTOTYPE_USER_MANUAL.md`
- Design principles: `docs/game-design-principles.md`
- Review feedback from the current design pass

## Blocking Issues

| ID | Feedback Item | Why It Matters | Required V2 Response |
| --- | --- | --- | --- |
| B1 | Stack grammar is promised but not delivered. | The original draft says visited Destinations are exploited by stacking, but the prototype benefits are flip-triggered passives. That creates a promise-vs-mechanic mismatch and weakens tactile card grammar. | Either remove the Stacklands-style framing or make Route benefits use a real stack/click target. |
| B2 | Route benefits do not work at the Gate. | The Gate is supposed to be the pressure climax, but Planet, Asteroid, and Star triggers are written for Destination/map timing only. | Give every default type benefit an explicit Gate use or rewrite the Gate promise. |
| B3 | The third Route benefit can be dead. | If Gate begins immediately after 3 visited Destinations and benefits expire afterward, the last visited card may have no useful window. | Ensure each type has a meaningful Gate use so the third Route card can still matter. |
| B4 | Persistent 3-card map removes the old reset valve. | The old proposal rule discarded unchosen cards. Keeping all visible cards can soft-lock the player when the map is unaffordable or icon-blocked. | Add a non-Star emergency reroute or other explicit stuck-state release valve. |
| B5 | Current Gate/deck exhaustion rules conflict with the new loop. | The manual gates the sector after the deck is empty and no Sector cards remain in play, while the draft gates after 3 visited Destinations. | State exactly when the Gate starts, what happens to unvisited visible cards, and what happens to remaining deck cards. |
| B6 | Route promise is broader than sector-local mechanics. | The draft says the player is charting a route through space, but benefits expire at the sector boundary. This risks promising run-long compounding that the system does not provide. | Either add a minimal cross-sector carryover or reframe the mechanic honestly as sector preparation. |
| B7 | Star benefit has a sharp early-sector value curve. | Replacing a visible Destination is strongest early and weak late, encouraging "take Star first and use it immediately." | Use a flatter timing, such as peek-2-choose-1 on refill, and give Star an alternate Gate use. |
| B8 | Asteroid trigger is fragile and vague. | "Where Fuel was spent" invites edge cases and can sit dead when visible cards have no Fuel requirements. | Define Fuel timing precisely or replace it with a clearer requirement-reduction effect plus a Gate use. |
| B9 | Route benefit timing conflicts with auto-resolution. | The current prototype auto-resolves valid stacks, leaving no clean moment to declare optional benefits. | Specify a declaration/stacking window or a small completion-preview rule. |
| B10 | Multiple eligible Route benefits have no resolution rule. | Two Planets or Asteroids could either stack powerfully or be disallowed; both need explicit rules. | State how many Route benefits can affect one completion, refill, and Gate timing window. |

## Major Design Risks

| ID | Feedback Item | Why It Matters | Required V2 Response |
| --- | --- | --- | --- |
| R1 | Planet and Asteroid benefits resemble delayed resources. | The original non-goal says benefits should change timing, risk, requirements, or preservation rather than simply bank resources. | Make them alter payment, readiness, risk, or Gate pressure rather than simply grant Fuel/Ready. |
| R2 | Type identities conflict with some current rewards. | Current rewards blur identities: Planet can Scout, Star can Ready crew, and Gravity Sling shapes Fuel. | Clarify that v2 tests type identity through Route Aids first, with reward tuning deferred. |
| R3 | Homogeneous routes scale quantitatively but not qualitatively. | Three Planets equal three copies of the same thing, not a deeper archetype. | Acknowledge this as acceptable for the first type-based prototype and add playtest checks before adding set bonuses. |
| R4 | Decision overhead can grow quietly. | Players may track 3 visible Destinations, 3 Route benefits, crew/Fuel/MOTHER state, and Gate pressure. | Limit simultaneous benefit windows and require UI to highlight only currently eligible Route Aids. |
| R5 | Gravity Sling may double up on route-control identity. | Its existing visit reward already shapes later Star costs, so a Star Route Aid on top can concentrate value. | Flag Gravity Sling for tuning after playtests rather than adding exceptions in v2. |

## Rules Text Issues

| ID | Feedback Item | Why It Matters | Required V2 Response |
| --- | --- | --- | --- |
| T1 | Planet text differs between table and rules draft. | "Choose 1 committed crew" is materially different from passive preservation. | Use one exact wording everywhere. |
| T2 | Fizzle cases are unspecified. | Benefits need to say what happens if no valid crew, no Fuel need, no deck card, or no missing icon exists. | Define valid targets; if there is no valid target, the benefit cannot be used. |
| T3 | Sector deck exhaustion is unaddressed. | Future card counts or reroutes could run the deck dry before 3 visits. | Define map refill behavior when the deck is empty and loss conditions when Route slots are not filled. |
| T4 | Gate interaction says "if trigger allows it" without trigger specifics. | This makes the main climax ambiguous. | Replace with explicit type-by-type Gate timing. |
| T5 | Route benefit expiration is ambiguous around Gate timing. | Players need to know whether unused benefits can be spent at the Gate and when they vanish. | State that face-up Route Aids remain available through Gate resolution, then expire on sector archive. |

## Things The Original Draft Gets Right

| ID | Strength | Preserve In V2 |
| --- | --- | --- |
| S1 | Separating immediate Visit Reward from later Route Benefit is the right fracture point. | Keep two outputs, but make the later output more tactical and legible. |
| S2 | Face-up means available and face-down means spent is strong legibility. | Preserve this visual language. |
| S3 | One benefit per Destination type is the right first prototype scope. | Keep type-based defaults and defer unique per-card benefits. |
| S4 | No route-set bonuses in the first pass is prudent. | Keep set bonuses out of v2 unless playtests prove homogeneous routes need more. |
| S5 | Playtest questions and success/failure language are useful acceptance criteria. | Expand them to cover Gate payoff, reroute use, trigger clarity, and cognitive load. |

## Principle Checks From `game-design-principles.md`

| ID | Principle | V2 Must Support |
| --- | --- | --- |
| P1 | Emotional promise first. | State the player fantasy in one sentence and make the mechanic match it. |
| P2 | 30-second loop. | Preserve reveal/draw -> choose -> commit -> resolve -> change state -> face pressure. |
| P3 | Cards as verbs. | Route cards should protect, filter, reduce risk, or bend rules, not just sit as facts. |
| P4 | Economy as tension machine. | Fuel, crew readiness, and MOTHER pressure should create spend-now/save-later choices. |
| P5 | Randomness with mitigation. | Persistent map randomness must have visible mitigation that is not circularly locked behind Star. |
| P6 | Synergy with constraints. | Let Route Aids combine with current state, but cap same-window stacking. |
| P7 | Legibility. | The board must answer what can be used, where, and what changed. |
| P8 | Medium-term plan. | The player should see a 2-3 turn plan toward the Gate. |
| P9 | Balance knobs. | Costs, timing windows, target limits, and type effects should be tunable without rewriting the system. |
| P10 | Teachability. | The first use of a Route Aid should teach the mechanic without a rules lookup. |

## Acceptance Criteria For V2

The v2 spec is ready for implementation only if it can answer all of these:

1. What is the exact player fantasy and planning horizon?
2. What are the visible Destination map rules?
3. What happens to unchosen visible Destinations after each visit?
4. What happens after the third Route slot fills?
5. What happens if the Sector deck runs out before 3 visits?
6. How does the player use a Route benefit physically or digitally?
7. How many Route benefits can affect a single completion, refill, or Gate window?
8. How does each type work during normal sector play?
9. How does each type work during the Gate?
10. What are the invalid/fizzle cases for each Route Aid?
11. What non-Star mechanic prevents persistent-map soft locks?
12. Do benefits expire at the Gate or after the Gate?
13. Does the third visited Destination still have a chance to matter?
14. Does the design avoid adding per-card exceptions, set bonuses, tech trees, or long-run relic systems?
15. Does the UI only highlight benefits that are currently eligible?
16. Does the playtest log explain each Route movement and Route Aid use?
17. Are known tuning risks called out instead of hidden?
18. Are playtest questions updated to validate the new hypotheses?
