# Threat model: POST /api/issues/create

Recorded 2026-08-18, after the engineering audit (issue #53). This is the app's only server
endpoint with side effects: it turns an anonymous web submission into a GitHub issue, using a
credential held on the server. Review this document when the endpoint, its token, or the
hosting chain changes.

## System

Caller (anonymous internet user or LAN user) -> Cloudflare -> Caddy on the home server ->
Express in the `chores-rewards-app` container -> GitHub API (private repo `candr-reports`)
using a fine-grained PAT from the server `.env`.

## Assets

- The PAT (`candr-reports-intake`): Issues and Contents read/write on `candr-reports` only,
  90-day expiry. Worst case if stolen: spam or vandalise the private intake repo. It cannot
  touch any other repository.
- The private intake repo's contents: user bug reports, which can include full-page
  screenshots showing family data.
- The public repo's reputation surface: nothing user-submitted lands there any more.
- Server availability: the endpoint shares a container with the app itself.

## Abuse cases and controls

| Abuse | Control |
|---|---|
| Issue spam / making the inbox useless | Rate limit 5 per hour per client, keyed on `CF-Connecting-IP` (Cloudflare-set), `req.ip` fallback |
| Using screenshot upload as a file host | Magic-byte validation (PNG/JPEG/WebP only), 5 MB decoded cap, and uploads land in the private repo, so nothing is publicly served |
| Malformed or hostile payloads | Zod schema validation (enum types, allowlisted categories, length caps) before any use |
| Oversized bodies | 10 MB JSON body limit |
| Backend fingerprinting via errors | Generic error messages only; details go to server logs; `x-powered-by` disabled |
| Token theft via server compromise | Token scope limits blast radius to the intake repo; rotation at most 90 days out |
| Abuse spread across many clients (under the per-IP limit) | Structured logs for every rejection/failure category, plus an ntfy burst alert when accepted submissions exceed a threshold in a rolling window (see `docs/security/alerting-setup.md`) |
| Silent GitHub integration failure (reports lost, nobody notices) | `github-api-failure` events are logged, reported to GlitchTip, and alert via ntfy (throttled to 1/hour) |
| Publishing family data | Intake repo is private; the form discloses that reports are private; public issues are written by hand, sanitised (see the access policy) |

## Accepted residual risks

- A request that reaches the origin directly, bypassing Cloudflare, can forge
  `CF-Connecting-IP`. The only thing keyed on it is the rate limiter, so the exposure is
  limit evasion, not access.
- The rate limiter is in-memory per container; a redeploy resets counters. Acceptable at
  this traffic level.
- No CAPTCHA or auth on submission: deliberate, to keep the report path frictionless for
  family and visitors. The rate limit and private intake bound the damage.
- Alerting delivery (GlitchTip, ntfy) is itself best-effort: if either is unreachable the
  request path is unaffected and the failure is only visible in container logs. Both default
  off, so a deploy that never sets `SENTRY_DSN` / `NTFY_URL` gets no alerting at all, only the
  structured logs. See `docs/security/alerting-setup.md` (issue #61).
