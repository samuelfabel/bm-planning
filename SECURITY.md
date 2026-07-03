# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` | ✅ active development |
| Releases | TBD (post M5) |

## Reporting a vulnerability

**Do not** open a public issue for security problems.

Email the maintainers (configure contact on GitHub when the repo is published) with:

- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 7 business days.

## Security scope

Areas of interest:

- API Key exposure on the server or in logs
- Businessmap proxy bypass
- Enumerable voting rooms or session hijacking
- XSS that steals credentials from `sessionStorage`
- CORS misconfiguration in production

## Out of scope

- Businessmap credentials obtained via user phishing
- Insecure self-hosting configuration by the administrator (e.g., HTTP without TLS in production)

## Project principles

- API Key and subdomain stay **in the browser only** ([ADR-001](docs/decisions/ADR-001-client-side-credentials.md))
- Authentication headers are **never** logged
