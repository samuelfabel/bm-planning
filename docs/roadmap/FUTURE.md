# Roadmap — post-MVP

Items planned after the initial M0–M5 release. The public site mirrors this file under **Now / Next / Later**.

Legend: ⬜ planned · ⚠️ in progress · ✅ done

---

## Now

| Item | Description |
|------|-------------|
| ✅ OpenAPI + Swagger UI | Interactive docs at `/api/docs` on self-hosted deployments |
| ⬜ Docker Hub image | Image `samuelfabel/bm-planning` — CI + release workflow in repo; first publish pending Hub setup |

---

## Next

| Item | Description |
|------|-------------|
| ⬜ Offline planning mode | Textarea-only queue in the browser; no server; immutable after create |
| ⬜ SSE fallback | `GET /api/v1/rooms/{id}/events` for networks that block WebSocket |
| ⬜ E2E tests | Playwright: facilitator + guest vote flow |
| ⬜ Vote histogram | Distribution chart after reveal (Planning Poker Online style) |

---

## Later

| Item | Description |
|------|-------------|
| ⬜ Redis multi-instance | Optional `REDIS_URL` for horizontal scale |
| ⬜ WebSocket rate limit | Per-client message throttle (10 msg/s) |
| ⬜ Session export | CSV/JSON of estimates and sync results |
| ⬜ Post-sync verification | Read custom field back from Businessmap and confirm in UI |
| ⬜ Helm chart | Production templates with TLS and ingress |

---

## Shipped (MVP)

See [ROADMAP.md](./ROADMAP.md) for the completed M0–M5 scope.

---

## External references

| Resource | URL |
|----------|-----|
| BM Planning OpenAPI (self-host) | In repo — Swagger at `/api/docs` when you run the Go server |
| Businessmap API overview | https://businessmap.io/api |
| Businessmap REST API (KB) | https://knowledgebase.businessmap.io/hc/en-us/articles/360012393692-Businessmap-REST-API |
