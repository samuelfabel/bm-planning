# Contributing to BM Planning

Thank you for your interest in contributing. This repository contains the Planning Poker app (Go + React) integrated with [Businessmap](https://businessmap.io).

## Before you start

- Read the [README](README.md) and [documentation](docs/README.md)
- Architecture decisions: [docs/decisions/](docs/decisions/)
- Public roadmap: [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## Repository structure

```text
server/     # Go API (Gin) — cd server && go test ./...
web/        # React — cd web && npm run dev
docker/     # Self-hosting
docs/       # Public documentation
```

## Local environment

### Prerequisites

- Go 1.23+
- Node.js 20+
- Businessmap account with API Key (to test real integration)

### Git hooks (commit message lint)

From the repository root:

```bash
npm install
```

This runs `husky` via `prepare` and installs the `commit-msg` hook. Commits must match Conventional Commits — scope in parentheses is **optional** (use it only for a single area). Examples: `docs: update roadmap`, `feat(web): add vote histogram`. The initial `first-commit` from GitHub is unchanged; new commits are validated.

### Back-end

```bash
cd server
cp .env.example .env   # optional — variables have defaults
go run ./cmd/server
```

Server at `http://localhost:8080`.

### Front-end

```bash
cd web
npm install
npm run dev
```

App at `http://localhost:5173` (Vite proxy → `:8080`).

## How to contribute

1. Open an **issue** describing the bug or feature (templates in `.github/ISSUE_TEMPLATE/`)
2. Fork + branch from `main`
3. Implement with minimal scope
4. Run local checks:

```bash
cd server && go test ./... && go vet ./...
cd web && npm run build
```

5. Open a **Pull Request** using the template

## Code standards

| Area | Rule |
|------|------|
| Go | Thin handlers → services → repositories. Code in **English**. |
| React | Context API, `bm.*` palette, strict TypeScript |
| Commits | [Conventional Commits](https://www.conventionalcommits.org/) — **enforced** by `commitlint` + Husky (`npm install` at repo root) |
| API Key | **Never** persist on the server — see [ADR-001](docs/decisions/ADR-001-client-side-credentials.md) |

Detailed spec and backlog live in the private `bm-planning-spec` repository (maintainers). For external contributions, the issue/PR is the source of requirements.

## Security

Do not open a public issue for vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
