# ADR-002 — Tech stack

**Status:** accepted  
**Date:** 2026-07-02

## Decision

| Area | Choice |
|------|--------|
| Back-end | Go 1.23+ **Gin** |
| Front-end | React 19 + TypeScript 5 + Vite 6 |
| Styles | TailwindCSS 4 |
| Routing | React Router 7 |
| Real-time | WebSocket (primary), SSE (fallback M5) |
| Integration | Businessmap REST API v2 |
| Deploy | Docker Alpine, single binary |
| CI | GitHub Actions |

## Consequences

- Monorepo `bm-planning` with `server/` (Go) and `web/` (React).
- Front-end built and embedded in the Go binary for self-hosting.
- No relational database in v1.

## Rejected alternatives

- **Node.js back-end** — preference for single binary and smaller footprint.
- **Next.js** — self-hosted SPA app; SSR unnecessary.
- **Vue/Svelte** — team standardizes on React.

## References

- `bm-planning-spec/docs/tech-stack.md`
