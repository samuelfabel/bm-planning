# Documentation — BM Planning

Public project documentation. Detailed spec and backlog live in the private `bm-planning-spec` repository.

## Index

| Document | Content |
|----------|---------|
| [decisions/](decisions/) | **Development ADRs** — engineering decisions |
| [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Architectural overview + links |
| [roadmap/ROADMAP.md](roadmap/ROADMAP.md) | Public roadmap M0–M5 |

## ADRs

Development decisions live here (public repository). AI agent workflow decisions live in `bm-planning-spec/wiki/decisions/`.

| ADR | Title |
|-----|-------|
| [ADR-001](decisions/ADR-001-client-side-credentials.md) | Credentials in the browser only |
| [ADR-002](decisions/ADR-002-tech-stack.md) | Go + React stack |
| [ADR-003](decisions/ADR-003-go-project-layout.md) | Go layout (accounts style) |
| [ADR-004](decisions/ADR-004-realtime-transport.md) | WebSocket + SSE fallback |
| [ADR-005](decisions/ADR-005-react-state-management.md) | Context API without Redux |
| [ADR-006](decisions/ADR-006-self-hosting-single-binary.md) | Single-binary self-hosting |
| [ADR-007](decisions/ADR-007-facilitator-role.md) | Croupier vs participant |
| [ADR-008](decisions/ADR-008-estimation-and-consensus.md) | BM target + consensus |

## Related repositories

| Repo | Role |
|------|------|
| **bm-planning** (this) | Code + public docs |
| **bm-planning-spec** | Private spec + backlog |
| **bm-planning-site** | GitHub Pages landing (future) |
