# ADR-001 — Credentials in the browser only

**Status:** accepted (updated 2026-07-02)  
**Date:** 2026-07-02

## Context

BM Planning connects to Businessmap with a per-workspace API Key. Persisting credentials on the server would create leakage risk and custody responsibility.

## Decision

- Subdomain and API Key live in `sessionStorage` in the browser (facilitator only).
- The **facilitator browser** calls the Businessmap REST API v2 **directly** (`https://{subdomain}.businessmap.io`).
- The Go back-end **does not** receive, forward, or store Businessmap credentials.
- The Go back-end is reserved for planning-room coordination (REST + WebSocket, M2+).
- Browser session TTL: until the tab is closed.

## Consequences

- No built-in login in v1.
- Self-hosters do not configure Businessmap secrets on the server.
- One fewer failure point (no proxy hop for BM reads/writes from facilitator).
- Requires Businessmap API CORS to allow browser calls with `apikey` header from the app origin.
- Participants never call Businessmap — they only join a room.

## Rejected alternatives

- **API Key on the server (.env)** — custody and risk in multi-tenant setups.
- **Go stateless proxy** (previous v1) — extra hop, 429 amplification, server saw credentials in transit.
- **Businessmap OAuth** — not available / out of scope for v1.
- **localStorage** — larger exposure window than sessionStorage.

## References

- Spec: `bm-planning-spec/raw/architecture-spec.md` §2.1, §8
