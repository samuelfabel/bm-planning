# BM Planning — Docker image

Self-hosted Planning Poker for [Businessmap](https://businessmap.io). Single Alpine image with the Go server and embedded React UI.

**Image:** [`samuelfabel/bm-planning`](https://hub.docker.com/r/samuelfabel/bm-planning)

## Quick start

```bash
docker run -d --name bm-planning \
  -p 8080:8080 \
  -e CORS_ORIGINS=https://planning.example.com \
  samuelfabel/bm-planning:latest
```

Open `http://localhost:8080` (or your mapped host/port).

## Tags

| Tag | When to use |
|-----|-------------|
| `latest` | Latest stable release |
| `1.2.3` | Exact semver release |
| `1.2` | Latest patch in minor line |
| `1` | Latest release in major line |

Releases are published from Git tags `v*.*.*` on [github.com/samuelfabel/bm-planning](https://github.com/samuelfabel/bm-planning).

## Docker Compose

```bash
curl -O https://raw.githubusercontent.com/samuelfabel/bm-planning/main/docker/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

Or clone the repo and run `docker compose -f docker/docker-compose.hub.yml up -d`.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP listen port |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins (comma-separated) |
| `ALLOWED_ORIGINS` | — | Overrides `CORS_ORIGINS` when set |
| `ROOM_GRACE_AFTER_DISCONNECT` | `1h` | TTL after all clients disconnect |
| `MAX_PARTICIPANTS` | `50` | Participant limit per room |
| `HTTP_RATE_LIMIT_PER_MIN` | `60` | Rate limit for `/api/v1/*` per IP |

The Businessmap API key stays in the **facilitator browser** only — this container coordinates rooms; it never receives API keys.

## Health

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `GET /ready` | Readiness |
| `GET /metrics` | Prometheus metrics |
| `GET /api/docs` | OpenAPI / Swagger UI |

## Build from source

```bash
git clone https://github.com/samuelfabel/bm-planning.git
cd bm-planning
docker build -f docker/Dockerfile -t bm-planning:local .
```

## License

MIT — see [LICENSE](https://github.com/samuelfabel/bm-planning/blob/main/LICENSE) in the repository.
