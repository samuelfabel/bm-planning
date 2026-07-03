# ADR-005 — Context API without Redux

**Status:** accepted  
**Date:** 2026-07-02

## Context

Application state: BM credentials, current room, voting, WS connection. State scope is limited to a few contexts.

## Decision

- `AuthContext` — subdomain, apiKey (sessionStorage)
- `PlanningContext` — room, user, votes, planning actions
- No Redux, Zustand, or similar in phase 1 (M0–M4)

Re-evaluate if excessive prop drilling or complex persisted state emerges.

## Consequences

- Less boilerplate and fewer dependencies.
- Custom hooks (`useRoomWebSocket`, `useBusinessmapProxy`) encapsulate effects.
- Component tests with mocked providers.

## Rejected alternatives

- **Redux Toolkit** — overkill for current scope.
- **Local state only** — room and WS need shared state across routes/components.

## References

- `bm-planning-spec/raw/architecture-spec.md` §6.4
