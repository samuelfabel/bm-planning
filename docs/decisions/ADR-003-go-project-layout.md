# ADR-003 — Go layout (accounts style)

**Status:** accepted (amended 2026-07-02 — Go in `server/`)  
**Date:** 2026-07-02

## Context

The original spec described Clean Architecture (`domain/`, `usecase/`, `port/`, `adapter/`). The Zona69 `accounts` project uses a pragmatic layout already familiar to the team.

The `bm-planning` repository is a **monorepo** (`server/` + `web/`). Go at the root mixed `go.mod`, `cmd/`, and `internal/` with `web/`, `docs/`, and `docker/`.

## Decision

Go back-end lives in **`server/`**, mirroring `web/`:

```text
bm-planning/
├── server/              # go.mod here — module github.com/msi/bm-planning/server
│   ├── cmd/server/
│   └── internal/
│       ├── api/handlers|middlewares|response
│       ├── services/
│       ├── repositories/
│       ├── models/
│       ├── contracts/
│       ├── providers/
│       └── config/
├── web/
├── docker/
└── docs/
```

**Flow:** handlers → services → repositories/providers.

- **Gin** as HTTP router (aligned with `accounts`)
- `SetupRoutes` per handler on `*gin.RouterGroup`

Go commands always from `server/`:

```bash
cd server && go test ./...
cd server && go build -o bin/server ./cmd/server
```

## Consequences

- Monorepo root stays clean: product folders only (`server/`, `web/`) + infra (`docker/`, `.github/`).
- CI uses `working-directory: server`.
- Go-only projects (e.g., `accounts`) keep layout at repo root — different pattern because there is no front-end in the same repo.

## Rejected alternatives

- **Go at monorepo root** — confuses with `web/` and clutters the root.
- **Separate repo for Go only** — coordination overhead; front embed requires monorepo.
- **Strict Clean Architecture** — overhead for limited scope.

## References

- `bm-planning-spec/docs/development-rules.md` §1
- Internal layout reference: `Zona69/accounts`
