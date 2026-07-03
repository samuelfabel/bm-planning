# Roadmap — BM Planning

Public roadmap mirroring the internal backlog (`bm-planning-spec/specs/_index.md`).

Legend: ✅ done · ⚠️ partial · ⬜ open

---

## M0 — Spec + mocked UI ✅

- [x] Screens `/`, `/setup`, `/room/:id` with mocks
- [x] Context API, `bm.*` palette, Croupier mode (ADR-007)
- [x] Configurable consensus in the UI (ADR-008)
- [x] UI flow diagram in README (screenshots optional)

## M1 — Businessmap in browser (facilitator) ✅

- [x] Facilitator calls Businessmap API v2 directly from the browser
- [x] `/setup` integrated (boards, columns, lanes, cards)
- [x] Go server: health only (rooms in M2)

## M2 — Rooms + WebSocket ✅

- [x] `POST /api/v1/rooms`, join, queue
- [x] WebSocket `/api/v1/rooms/:id/live`
- [x] `useRoomWebSocket`, `ConnectionContext`
- [x] Setup → create room → real waiting room flow

## M3 — Full voting ✅

- [x] Rounds, reveal, revote, skip, next
- [x] Deck hidden for Croupier
- [x] Average + nearest card in consensus (server + client)

## M4 — Businessmap sync ✅

- [x] Consensus → custom field or native `size` (browser)
- [x] `nearest_card` vs `raw_average`
- [x] `QueuedCard.estimated` updated after success

## M5 — Hardening + deploy ✅

- [x] Embed `web/dist` in Go binary
- [x] Rate limit, `/metrics`, `/ready`
- [x] Docker multi-stage build
- [x] README with env vars
- [x] OpenAPI spec + Swagger UI at `/api/docs`

See **[FUTURE.md](./FUTURE.md)** for post-MVP items.

| Repo | Role |
|------|------|
| [bm-planning](https://github.com/samuelfabel/bm-planning) | App (this) |
| bm-planning-site | GitHub Pages landing |
| bm-planning-spec | Private spec (maintainers) |
