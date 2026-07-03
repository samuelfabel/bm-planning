# ADR-007 — Facilitator role: Croupier or participant

**Status:** accepted  
**Date:** 2026-07-02

## Context

In planning poker, whoever creates and runs the session does not always vote. Generic tools count the facilitator in votes, forcing teams to manually exclude them from the average or consensus.

## Decision

In **session configuration** (`PlanningConfig.facilitatorRole`), the creator chooses:

| Value | UI (EN) | Behavior |
|-------|---------|----------|
| `croupier` | Croupier — facilitates only | `can_vote: false`; round control; **excluded** from average, median, and histogram |
| `participant` | Join the vote | `can_vote: true`; facilitates **and** votes; **included** in the count |

The user who creates the room always has `is_facilitator: true`. The `can_vote` field derives from `facilitatorRole`.

### UI

- Selector on the setup screen (alongside session configuration).
- **Croupier** badge in the waiting room and participant grid when `croupier`.
- Voting deck **hidden** for the facilitator in Croupier mode.

### Back-end (M2+)

- Validate `POST /rounds/vote` → HTTP 403 if facilitator in `croupier` mode.
- Consensus services ignore votes from users with `can_vote: false`.

## Consequences

- Config travels in the room snapshot (`POST /rooms`).
- Reconnection preserves `facilitatorRole` from room config.
- Default UI suggestion: `croupier` (most common in facilitated planning).

## Rejected alternatives

- **Always vote** — forces manual exclusion.
- **Two separate roles** (croupier ≠ creator) — unnecessary complexity in v1.
- **Per-round toggle** — confusing; decision is per session.

## References

- `bm-planning-spec/raw/architecture-spec.md` §2.2, §2.6
- `bm-planning-spec/wiki/concepts/OPEN-QUESTIONS.md` Q4
