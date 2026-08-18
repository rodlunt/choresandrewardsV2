#!/usr/bin/env bash
# Poll-based deployer for candr.lunt.au.
#
# Runs from a root-owned install path (NOT from the repo checkout: the
# checkout is writable by an unprivileged user, and root must never execute
# code that user can edit). Install per deploy/README.md; changes to this
# file in the repo do nothing until reinstalled.
#
# Every few minutes (candr-deploy.timer): if origin/main is ahead of the
# local checkout AND that exact commit's required CI checks concluded
# green, pull and rebuild. The CI gate fails CLOSED: if the GitHub API is
# unreachable or the checks are pending, the deploy is held, never waved
# through. A hold that persists past HOLD_ALERT_SECS raises one ntfy alert
# per commit, re-nagged hourly at most.
#
# Verification derives from the work (hardening rule 3/7): success means
# the checkout sits at the target sha AND the container reports healthy
# AND the public URL answers; "the script finished" proves nothing.
#
# Watch-the-watcher: every controlled exit (up to date, hold, success)
# pings the Uptime Kuma push monitor named by KUMA_PUSH_URL, so the timer
# dying, the script wedging, or the unit crashing all read as a missed
# heartbeat and Kuma raises the alarm. Failure paths still ping: their
# alerting is the script's own ntfy calls, and the heartbeat only claims
# "the timer is running me".

set -euo pipefail

REPO_DIR="${CANDR_REPO_DIR:-/srv/prod/ChoresandRewards}"
REPO_USER="${CANDR_REPO_USER:-aspacenoob}"
STATE_DIR="${CANDR_STATE_DIR:-/var/lib/candr-deploy}"
API_BASE="${CANDR_API_BASE:-https://api.github.com/repos/rodlunt/choresandrewardsV2}"
LIVE_URL="${CANDR_LIVE_URL:-https://candr.lunt.au/}"
CONTAINER="${CANDR_CONTAINER:-chores-rewards-app}"
REQUIRED_CHECKS=("Run Pre-Deployment Checks" "Security audit")
HOLD_ALERT_SECS=2700   # alert if a new commit is stuck undeployed for 45 min
RENAG_SECS=3600        # re-alert for a persisting fault hourly at most

# /etc/candr-deploy.env (root, 0600) supplies NTFY_URL, kept out of this
# public repository. Missing env file means alerts cannot be sent, which
# alert() treats as its own loud failure.
[ -f /etc/candr-deploy.env ] && . /etc/candr-deploy.env

mkdir -p "$STATE_DIR"

log() { echo "candr-deploy: $*"; }

# Best-effort by design: the heartbeat's own delivery failure needs no
# handling here, because Kuma treats a missed beat as the alarm condition,
# so a broken push path IS the alert (fires on Kuma's side).
kuma_heartbeat() {
  [ -n "${KUMA_PUSH_URL:-}" ] && curl -s --max-time 10 -o /dev/null "$KUMA_PUSH_URL?status=up&msg=$1" || true
}

# The one loud-failure primitive (hardening rule 11). Sends the house ntfy
# shape; if the alert itself cannot be delivered, that failure is printed
# and the script exits non-zero so OnFailure= fires as the backup alarm
# (rule 6: the alarm's own failure must be loud).
alert() {
  local title="$1" body="$2"
  local token code
  if ! token=$(cat /root/.ntfy_pub_token 2>/dev/null); then
    log "ALERT DELIVERY FAILED: cannot read ntfy token; wanted to say: $title: $body"
    exit 1
  fi
  if [ -z "${NTFY_URL:-}" ]; then
    log "ALERT DELIVERY FAILED: NTFY_URL not set in /etc/candr-deploy.env; wanted to say: $title: $body"
    exit 1
  fi
  code=$(curl -s --max-time 15 -o /dev/null -w '%{http_code}' \
    -H "Title: $title" \
    -H "Priority: urgent" \
    -H "Tags: rotating_light" \
    -H "Authorization: Bearer $token" \
    -d "$body" \
    "$NTFY_URL") || code="000"
  if [ "$code" != "200" ]; then
    log "ALERT DELIVERY FAILED: ntfy returned $code; wanted to say: $title: $body"
    exit 1
  fi
  log "alerted: $title"
}

# Throttled alert: at most one per marker per RENAG_SECS.
alert_throttled() {
  local marker="$STATE_DIR/$1" title="$2" body="$3"
  local now last=0
  now=$(date +%s)
  [ -f "$marker" ] && last=$(stat -c %Y "$marker")
  if (( now - last >= RENAG_SECS )); then
    alert "$title" "$body"
    touch "$marker"
  fi
}

as_repo_user() { sudo -u "$REPO_USER" git -C "$REPO_DIR" "$@"; }

LOCAL=$(as_repo_user rev-parse HEAD)
as_repo_user fetch -q origin main
REMOTE=$(as_repo_user rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  # Up to date: the quiet common case. The heartbeat is the one observable
  # side effect, proving the timer is alive between deploys.
  kuma_heartbeat "up-to-date"
  exit 0
fi

log "new commit on origin/main: $REMOTE (local: $LOCAL)"

# Track how long this commit has been waiting so a stuck hold gets loud.
PENDING_FILE="$STATE_DIR/pending-$REMOTE"
[ -f "$PENDING_FILE" ] || date +%s > "$PENDING_FILE"
FIRST_SEEN=$(cat "$PENDING_FILE")
WAITED=$(( $(date +%s) - FIRST_SEEN ))

hold() {
  # Fail closed: no deploy. Alert only once the hold has persisted, so an
  # in-flight CI run or a transient API blip does not page anyone.
  local reason="$1"
  log "holding deploy of $REMOTE: $reason (waiting ${WAITED}s)"
  if (( WAITED >= HOLD_ALERT_SECS )); then
    alert_throttled "alerted-hold-$REMOTE" \
      "candr deploy held" \
      "Commit ${REMOTE:0:12} has been undeployable for $((WAITED / 60)) min: $reason. Deploys are stopped until it resolves. Check https://github.com/rodlunt/choresandrewardsV2/actions"
  fi
  kuma_heartbeat "holding"
  exit 0
}

# Ask GitHub for the check runs on exactly this commit. Control first
# (hardening rule 12): prove the instrument answered before interpreting
# its content; an empty or unparsable response is could-not-run, not pass
# and not fail.
CHECKS_JSON=$(curl -sf --max-time 20 \
  -H "Accept: application/vnd.github+json" \
  "$API_BASE/commits/$REMOTE/check-runs?per_page=100") || hold "GitHub API unreachable"

TOTAL=$(jq -r '.total_count // empty' <<<"$CHECKS_JSON") || hold "check-runs response unparsable"
[ -n "$TOTAL" ] || hold "check-runs response missing total_count"
[ "$TOTAL" -gt 0 ] || hold "no check runs reported yet"

for name in "${REQUIRED_CHECKS[@]}"; do
  conclusion=$(jq -r --arg n "$name" \
    '[.check_runs[] | select(.name == $n)] | sort_by(.started_at) | last | .conclusion // "pending"' \
    <<<"$CHECKS_JSON") || hold "check-runs parse failed for $name"
  case "$conclusion" in
    success) ;;
    pending|null) hold "required check '$name' has not concluded" ;;
    *)
      # A red commit on main should be impossible (branch protection), so
      # this is worth hearing about sooner than a generic hold.
      alert_throttled "alerted-red-$REMOTE" \
        "candr main is red" \
        "Required check '$name' concluded '$conclusion' on ${REMOTE:0:12}. Deploys are stopped. https://github.com/rodlunt/choresandrewardsV2/actions"
      log "holding deploy of $REMOTE: check '$name' concluded $conclusion"
      kuma_heartbeat "main-red"
      exit 0
      ;;
  esac
done

log "CI green for $REMOTE; deploying"

as_repo_user merge --ff-only origin/main
cd "$REPO_DIR"
if ! docker compose build 2>&1 | tail -5; then
  alert "candr deploy failed" "docker compose build failed for ${REMOTE:0:12} on opti. Old container is still running. See journalctl -u candr-deploy.service"
  exit 1
fi
docker compose up -d

# Prove the deploy moved the system (rule 7), not just that commands ran.
DEPLOYED=$(as_repo_user rev-parse HEAD)
if [ "$DEPLOYED" != "$REMOTE" ]; then
  alert "candr deploy failed" "Checkout is at ${DEPLOYED:0:12}, expected ${REMOTE:0:12}. See journalctl -u candr-deploy.service"
  exit 1
fi

for _ in $(seq 1 18); do
  HEALTH=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")
  [ "$HEALTH" = "healthy" ] && break
  sleep 5
done
if [ "${HEALTH:-missing}" != "healthy" ]; then
  alert "candr deploy failed" "Container $CONTAINER is '$HEALTH' 90s after deploying ${REMOTE:0:12}. See docker logs $CONTAINER"
  exit 1
fi

if ! curl -sf --max-time 20 -o /dev/null "$LIVE_URL"; then
  alert "candr deploy failed" "Deployed ${REMOTE:0:12} and container is healthy, but $LIVE_URL is not answering. Check Caddy and Cloudflare."
  exit 1
fi

date +%s > "$STATE_DIR/last-success"
rm -f "$PENDING_FILE" "$STATE_DIR/alerted-hold-$REMOTE" "$STATE_DIR/alerted-red-$REMOTE"
kuma_heartbeat "deployed"
log "deployed $REMOTE: container healthy, $LIVE_URL answering"
