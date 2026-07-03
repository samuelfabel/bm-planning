# ADR-004 — WebSocket primary + SSE fallback

**Status:** accepted  
**Date:** 2026-07-02

## Context

Planning poker requires real-time updates (votes, reveal, participants). Corporate environments may block WebSocket.

## Decision

| Transport | Use |
|-----------|-----|
| **WebSocket** | Primary — `/api/v1/rooms/{id}/live` |
| **SSE** | Fallback — `/api/v1/rooms/{id}/events` (M5) |

Client actions over WS are bidirectional. In SSE mode, actions use complementary REST POST.

Message protocol defined in spec §7.2.

## Consequences

- Implement hub in `internal/providers/` with central goroutine.
- Front-end: `useRoomWebSocket` with reconnect and `client_id` in sessionStorage.
- SSE can ship in M5 without blocking M2–M4.

## Rejected alternatives

- **HTTP polling** — inadequate latency and load.
- **SSE only** — facilitator actions would require many endpoints.
- **Socket.io** — unnecessary extra dependency in Go.

## References

- `bm-planning-spec/raw/architecture-spec.md` §7
