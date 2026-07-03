# ADR-008 — Estimation target and consensus strategy

**Status:** accepted  
**Date:** 2026-07-02

## Context

Businessmap workspaces use custom fields or the native `size` field. Planning teams have preferences on how to consolidate votes (average vs deck card). Tools like [planningpokeronline.com](https://planningpokeronline.com/) reveal votes, show the average, and suggest the nearest card.

## Decision

### Businessmap target (`estimationTarget`)

| `kind` | Description | API v2 |
|--------|-------------|--------|
| `custom_field` | Custom field chosen by the team | `POST /cards/{id}/customFields/{fieldId}` |
| `native_size` | Card native `size` field | `PUT /cards/{id}` with `size` or equivalent endpoint |

Configured globally for the session — the team chooses once at setup.

### Suggestion algorithm (`consensusAlgorithm`)

| Value | Behavior |
|-------|----------|
| `average_nearest` | Arithmetic mean of numeric votes → deck card with smallest distance |
| `median_nearest` | Median of numeric votes → nearest card |
| `manual` | No automatic suggestion; facilitator sets value freely |

Non-numeric votes (`?`, `Pass`, `☕`, T-shirt without numeric mapping) are ignored in the calculation.

Users with `can_vote: false` (Croupier mode — [ADR-007](ADR-007-facilitator-role.md)) are excluded.

### Synced value (`syncValueSource`)

After the facilitator confirms, what is written to Businessmap:

| Value | Written |
|-------|---------|
| `nearest_card` | Suggested card value (e.g., `8`) |
| `raw_average` | Arithmetic mean (e.g., `7.3` → round per field type) |

For `dropdown`, `nearest_card` resolves to the corresponding `value_id`.

### UX flow

1. Votes hidden until reveal.
2. After reveal: histogram + displayed average + suggested card.
3. Facilitator confirms or edits final value.
4. Optional sync with Businessmap (`sync_to_businessmap`).

## Consequences

- `PlanningConfig` includes `estimationTarget`, `consensusAlgorithm`, `syncValueSource`.
- `ConsensusPanel` and Go service share the same calculation logic.
- M4 implements both targets (`custom_field` and `native_size`).

## Rejected alternatives

- **Custom field only** — many boards use native `size`.
- **Mode only** — does not reflect common average + nearest card practice.
- **Always write average** — some teams prefer discrete deck value.

## References

- `bm-planning-spec/raw/architecture-spec.md` §2.4, §2.7, §5.5
- `bm-planning-spec/wiki/concepts/OPEN-QUESTIONS.md` Q2
