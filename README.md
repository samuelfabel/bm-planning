# BM Planning

Open source **Planning Poker** tool natively integrated with [Businessmap](https://businessmap.io) via REST API v2.

## Features

- Facilitator calls Businessmap **directly from the browser** (API Key in `sessionStorage` only)
- Task filtering by board, column, lane, and tags
- Real-time voting sessions (WebSocket)
- Story Points consolidation directly on Businessmap cards
- Self-hosting with a single Go binary + Docker

## Stack

| Layer | Technology |
|-------|------------|
| Back-end | Go — planning rooms + WebSocket; no Businessmap proxy |
| Front-end | React 19 · TypeScript · TailwindCSS 4 · Vite (embedded in binary) |
| Real-time | WebSocket (primary) · SSE fallback (planned) |

## UI overview

Screenshots are not bundled in the repo yet. Typical flow:

```text
  Landing (/)          Setup (/setup)              Room (/room/:id)
+----------------+   +----------------------+   +------------------------+
| Create / Join  | ->| API key + board query| ->| Waiting · Voting ·     |
| session        |   | deck + participants  |   | Consensus              |
+----------------+   +----------------------+   +------------------------+
```

## Documentation

| Document | Content |
|----------|---------|
| **[docs/README.md](docs/README.md)** | Documentation index |
| **[docs/decisions/](docs/decisions/)** | Development ADRs |
| **[docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)** | Architectural overview |

Detailed spec and backlog live in the private `bm-planning-spec` repository.

## Quick start (development)

### Front-end only

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`.

### Full stack (Go + embedded SPA)

```bash
cd web && npm ci && npm run build
cp -r dist ../server/internal/static/dist   # Windows: xcopy /E /I dist ..\server\internal\static\dist

cd ../server
go run ./cmd/server
```

Open `http://localhost:8080`.

## Deployment

### Docker

**Docker Hub** (after the first release is published):

```bash
docker run -d --name bm-planning -p 8080:8080 samuelfabel/bm-planning:latest
```

Or with Compose (pull, no build):

```bash
docker compose -f docker/docker-compose.hub.yml up -d
```

**Build from source:**

```bash
docker compose -f docker/docker-compose.yml up --build
```

Or build the image directly:

```bash
docker build -f docker/Dockerfile -t bm-planning .
docker run -p 8080:8080 bm-planning
```

Release process: see [`docker/RELEASE.md`](docker/RELEASE.md). Hub README: [`docker/README.md`](docker/README.md).

The Alpine image ships a single static binary with the React build embedded (see [ADR-006](docs/decisions/ADR-006-self-hosting-single-binary.md)).

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP listen port |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins (overrides `CORS_ORIGINS`) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated CORS origins |
| `ROOM_TTL` | `4h` | Inactive room TTL (documented; wired when Redis scaling lands) |
| `ROOM_GRACE_AFTER_DISCONNECT` | `1h` | Grace period before empty rooms are removed |
| `MAX_PARTICIPANTS` | `50` | Maximum participants per room |
| `HTTP_RATE_LIMIT_PER_MIN` | `60` | Rate limit for `/api/v1/*` per client IP |
| `REDIS_URL` | — | Optional Redis URL for multi-instance deployments (future) |

WebSocket message rate limiting (10 msg/s per client) is planned as a configurable option.

### Health and metrics

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `GET /ready` | Readiness |
| `GET /metrics` | Prometheus (`rooms_active`, `ws_connections`, `http_requests_total`) |
| `GET /api/docs` | Swagger UI (OpenAPI 3) |
| `GET /api/docs/openapi.yaml` | OpenAPI spec |

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/setup` | Configuration + task query |
| `/room/:roomId` | Voting room |

## Structure

```text
bm-planning/
├── server/                 # Go back-end (go.mod here)
│   ├── cmd/server/
│   └── internal/
│       └── static/dist/    # Populated by web build (embedded via go:embed)
├── web/                    # React front-end
│   └── src/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml      # build from source
│   ├── docker-compose.hub.yml  # pull samuelfabel/bm-planning
│   ├── README.md               # synced to Docker Hub
│   └── RELEASE.md              # maintainer release guide
├── docs/
├── .github/workflows/
└── README.md
```

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| M0 | Mocked UI | partial |
| M1 | Businessmap in browser | partial |
| M2 | Rooms + WebSocket | partial |
| M3 | Full voting | partial |
| M4 | Businessmap sync | open |
| M5 | Hardening + deploy | partial |

## Visual identity

`bm.*` palette inspired by Businessmap (Slate/Blue). Configured in `web/src/index.css` via Tailwind v4 `@theme`.

## License

MIT
