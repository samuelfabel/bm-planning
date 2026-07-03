# Architecture Decision Records — BM Planning

Record of **development** and engineering decisions.

> Full policy: `bm-planning-spec/docs/adr-policy.md`  
> AI agent workflow ADRs: `bm-planning-spec/wiki/decisions/`

## Index

| ADR | Status | Title |
|-----|--------|-------|
| [ADR-001](ADR-001-client-side-credentials.md) | accepted | Credentials in the browser only |
| [ADR-002](ADR-002-tech-stack.md) | accepted | Go + React stack |
| [ADR-003](ADR-003-go-project-layout.md) | accepted | Go layout (accounts style) |
| [ADR-004](ADR-004-realtime-transport.md) | accepted | WebSocket + SSE fallback |
| [ADR-005](ADR-005-react-state-management.md) | accepted | Context API without Redux |
| [ADR-006](ADR-006-self-hosting-single-binary.md) | accepted | Single-binary self-hosting |
| [ADR-007](ADR-007-facilitator-role.md) | accepted | Croupier vs participant |
| [ADR-008](ADR-008-estimation-and-consensus.md) | accepted | BM target + configurable consensus |

## Template

New ADRs follow this format:

```markdown
# ADR-NNN — Title
**Status:** proposed | accepted | superseded
**Date:** YYYY-MM-DD

## Context
## Decision
## Consequences
## Rejected alternatives
```
