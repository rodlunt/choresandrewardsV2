# Bug-report endpoint: logging and alerting setup

Recorded 2026-08-19 (issue #61). Operator notes for the logging and alerting added to
`POST /api/issues/create`. See `docs/security/threat-model-issues-endpoint.md` for the
threat model this sits inside.

## What's always on

Every submission (accepted, rejected, or failed) emits one structured JSON log line to the
container's stdout/stderr, whether or not any of the config below is set. Fields: `timestamp`,
`event`, `outcome`, `status`, plus a reason category where relevant. Report content, screenshot
bytes, and tokens are never logged.

Events: `submission-accepted`, `rejected-validation`, `rejected-rate-limit`,
`rejected-screenshot`, `token-missing`, `github-api-failure`, `screenshot-upload-failed`,
`alerting-delivery-failed`.

`docker logs chores-rewards-app` shows these; grep for `"event":"github-api-failure"` etc.

## What's optional (off by default)

Two independent alerting channels, both gated purely on environment variables. Neither is
required for the app or the bug-report feature to work: absent config means the feature is
silently disabled, with a one-line notice logged once at startup so a forgotten env var is
visible in `docker logs` rather than only mattering the day it would have paged someone.

### GlitchTip (error reporting)

Set `SENTRY_DSN` to a GlitchTip project's DSN (Settings -> Client Keys (DSN) in the GlitchTip
UI) to report two genuine-fault categories: `github-api-failure` and any unhandled exception
that reaches the app's top-level error handler. Delivery is a small dependency-free fetch()
call against GlitchTip's Sentry-compatible store endpoint, not the `@sentry/node` SDK (see the
PR that introduced this for the reasoning). Delivery is best-effort: if GlitchTip is
unreachable the request being served is unaffected, and the failure is logged as
`alerting-delivery-failed`.

### ntfy (paging alerts)

Set `NTFY_URL` (and `NTFY_TOKEN` if the topic requires auth) to enable two alerts:

- **Volume burst**: fires once when accepted submissions exceed `NTFY_BURST_THRESHOLD`
  (default 10) within a rolling `NTFY_BURST_WINDOW_MINUTES` window (default 60), then re-arms
  only once the window has quieted back under the threshold. This is a separate signal from
  the per-IP rate limit (5/hour) documented in `bug-report-access-policy.md`: it catches abuse
  spread across many clients, each individually under that limit.
- **GitHub API failure**: fires on the first `github-api-failure`, throttled to at most one per
  hour, because a broken GitHub integration otherwise loses reports silently.

Both are sent with `Priority: high` and an ASCII-only title. Delivery is best-effort: a failed
ntfy send can't page anyone by definition, so it's logged loudly instead
(`alerting-delivery-failed`) as the only remaining trail.

## Environment variables

| Variable | Default | Effect when unset |
|---|---|---|
| `SENTRY_DSN` | (none) | Error reporting to GlitchTip disabled |
| `NTFY_URL` | (none) | ntfy alerting disabled |
| `NTFY_TOKEN` | (none) | Alerts sent without an `Authorization` header |
| `NTFY_BURST_THRESHOLD` | `10` | n/a (only used when `NTFY_URL` is set) |
| `NTFY_BURST_WINDOW_MINUTES` | `60` | n/a (only used when `NTFY_URL` is set) |

## Known gaps

- Burst tracking and the GitHub-failure throttle are in-memory per container: both reset on
  redeploy. Acceptable at this traffic level, same trade-off as the rate limiter itself.
- Nothing watches these alerting paths themselves; a GlitchTip or ntfy outage is only visible
  as `alerting-delivery-failed` log lines, which nobody is paged on. Acceptable for a hobby
  project's secondary alerting channel; would need its own watchdog to close fully.
