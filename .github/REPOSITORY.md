# Repository metadata (GitHub + Docker Hub)

Copy-paste values for repository settings. Not applied automatically — update the dashboards manually (or via API).

## GitHub — `samuelfabel/bm-planning`

**Description** (About → Description):

```text
Open-source Planning Poker for Businessmap. Self-host with Docker — real-time voting, story point sync, API keys stay in the browser.
```

**Website** (optional):

```text
https://samuelfabel.github.io/bm-planning-site/
```

**Topics** (About → Topics):

```text
planning-poker
businessmap
agile
websocket
self-hosted
golang
react
docker
openapi
```

**Social preview:** add a screenshot or OG image when available (Settings → General → Social preview).

---

## Docker Hub — `samuelfabel/bm-planning`

**Short description** (Repository → General → Short description, max ~100 characters):

```text
Self-hosted Planning Poker for Businessmap — Go + React, WebSocket voting, browser-only API keys.
```

**Categories** (up to 3, Repository → General → Categories):

| Category | Slug (API/metadata) | Why |
|----------|---------------------|-----|
| Web servers | `web-servers` | Serves the embedded React SPA and REST API |
| Developer tools | `developer-tools` | Agile estimation sessions for software teams |
| API management | `api-management` | Room coordination API with OpenAPI docs |

**Full description:** synced from [`docker/README.md`](../docker/README.md) by the release workflow (requires Hub token with Read + Write + Delete).

Structured reference: [`docker/hub-metadata.json`](../docker/hub-metadata.json).
