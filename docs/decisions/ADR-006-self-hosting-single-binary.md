# ADR-006 — Single-binary self-hosting

**Status:** accepted  
**Date:** 2026-07-02

## Context

BM Planning is open source for teams already using Businessmap. It should be simple to host internally.

## Decision

- One Go binary serves API + React static assets (`//go:embed` of `web/dist`).
- Alpine Docker image target < 50 MB.
- Room state in memory by default; optional `REDIS_URL` in M5 for multi-instance.
- Variables: `PORT`, `ROOM_TTL`, `MAX_PARTICIPANTS`, `ALLOWED_ORIGINS`.

## Consequences

- Build pipeline: `npm run build` → `go build` with embed.
- No S3/CDN dependency for assets in v1.
- Horizontal scaling requires Redis (M5) — document single-instance limitation before that.

## Rejected alternatives

- **Separate front and back deploy** — more complex for self-hosters.
- **Serverless** — unsuitable for WebSocket and room state.

## References

- `bm-planning-spec/raw/architecture-spec.md` §9
