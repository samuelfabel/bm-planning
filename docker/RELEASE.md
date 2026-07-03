# Docker Hub releases

Published image: **`samuelfabel/bm-planning`** on [Docker Hub](https://hub.docker.com/r/samuelfabel/bm-planning).

## One-time setup

1. Create the repository `samuelfabel/bm-planning` on Docker Hub (public).
2. Create Docker Hub access token(s) — see **Token permissions** below.
3. Add GitHub repository secrets on `samuelfabel/bm-planning`:
   - `DOCKERHUB_USERNAME` — your Docker Hub username (`samuelfabel`)
   - `DOCKERHUB_TOKEN` — access token with at least **Read** + **Write** (image push)
   - `DOCKERHUB_DESCRIPTION_TOKEN` — *(optional)* token with **Read** + **Write** + **Delete** for README sync; if omitted, `DOCKERHUB_TOKEN` is used for both

### Token permissions

| Task | Required scopes |
|------|-----------------|
| `docker push` (CI release) | Read, Write |
| Sync `docker/README.md` to Hub page | Read, Write, **Delete** |

A token with only Read + Write can push images but returns **403 Forbidden** on the Hub README API. Regenerate the token on [Docker Hub → Account Settings → Security](https://hub.docker.com/settings/security) and enable all three permissions, or use two tokens (push vs description).

## Cut a release

Releases are driven by **semver Git tags** on `main`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow [`.github/workflows/docker-release.yml`](../.github/workflows/docker-release.yml) will:

1. Build `docker/Dockerfile` (multi-stage: React → Go → Alpine).
2. Push tags to Docker Hub:
   - `samuelfabel/bm-planning:0.1.0`
   - `samuelfabel/bm-planning:0.1`
   - `samuelfabel/bm-planning:0`
   - `samuelfabel/bm-planning:latest`
3. Try to update the Docker Hub README from [`docker/README.md`](./README.md) (non-blocking — release still succeeds if this step fails).

### Manual publish (testing)

Actions → **Docker Release** → **Run workflow** → optional custom tag (default `latest`).

Use this only for smoke tests; prefer semver tags for production.

## CI (no publish)

[`.github/workflows/docker.yml`](../.github/workflows/docker.yml) builds the image on PRs and `main` pushes (paths: `docker/`, `server/`, `web/`) without pushing to a registry.

## Local verification

```bash
docker build -f docker/Dockerfile -t bm-planning:local .
docker run --rm -p 8080:8080 bm-planning:local
curl -s http://localhost:8080/health
```

## Files

| File | Role |
|------|------|
| `docker/Dockerfile` | Multi-stage production image |
| `docker/docker-compose.yml` | Build from source (dev/self-host) |
| `docker/docker-compose.hub.yml` | Pull `samuelfabel/bm-planning` from Hub |
| `docker/README.md` | Long description synced to Docker Hub |
| `.dockerignore` | Build context exclusions |
