// ntfy alerting for the bug-report endpoint (issue #61): a burst-volume
// alert (accepted submissions exceeding a threshold within a rolling
// window - abuse that got past the per-IP rate limit by spreading across
// clients) and a throttled github-api-failure alert (the GitHub
// integration is broken, so reports are being lost silently otherwise).
//
// Delivery is best-effort and must never block or fail the request it is
// reporting on. A failed alert can't page anyone by definition, so on
// failure it is logged loudly instead - the log line is the only trail
// left. Config is env-only and defaults OFF: absent NTFY_URL means
// ntfyEnabled is false and both entry points below are no-ops.

import { logIssueEvent } from './log';

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const NTFY_URL = process.env.NTFY_URL;
const NTFY_TOKEN = process.env.NTFY_TOKEN;
export const ntfyEnabled = !!NTFY_URL;

export const BURST_THRESHOLD = parseIntEnv(process.env.NTFY_BURST_THRESHOLD, 10);
export const BURST_WINDOW_MINUTES = parseIntEnv(process.env.NTFY_BURST_WINDOW_MINUTES, 60);
const BURST_WINDOW_MS = BURST_WINDOW_MINUTES * 60 * 1000;

// Not configurable: this is a floor against alert fatigue on a channel
// that pages a person, not a tunable abuse threshold.
const GITHUB_FAILURE_THROTTLE_MS = 60 * 60 * 1000;

async function publish(title: string, message: string, priority: 'high' | 'default'): Promise<void> {
  if (!NTFY_URL) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      Title: title,
      Priority: priority,
    };
    if (NTFY_TOKEN) {
      headers.Authorization = `Bearer ${NTFY_TOKEN}`;
    }

    const res = await fetch(NTFY_URL, { method: 'POST', body: message, headers });
    if (!res.ok) {
      logIssueEvent({ event: 'alerting-delivery-failed', outcome: 'error', status: res.status, channel: 'ntfy' });
    }
  } catch (err) {
    logIssueEvent({
      event: 'alerting-delivery-failed',
      outcome: 'error',
      status: 0,
      channel: 'ntfy',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

// --- Burst tracking -------------------------------------------------------
//
// Rolling window of accepted-submission timestamps, held in memory (resets
// on redeploy, same as the rate limiter this complements - acceptable at
// this traffic level). Fires once when the count first crosses the
// threshold, then re-arms only once the window has quieted back under
// threshold, so a sustained burst pages once, not once per submission.

let acceptedTimestamps: number[] = [];
let burstArmed = true;

export function recordAcceptedSubmission(): void {
  if (!NTFY_URL) {
    return;
  }

  const now = Date.now();
  acceptedTimestamps.push(now);
  acceptedTimestamps = acceptedTimestamps.filter((t) => now - t <= BURST_WINDOW_MS);

  if (acceptedTimestamps.length > BURST_THRESHOLD) {
    if (burstArmed) {
      burstArmed = false;
      void publish(
        'Chores and Rewards: report volume alert',
        `${acceptedTimestamps.length} bug/feature reports accepted in the last ${BURST_WINDOW_MINUTES} minutes (threshold ${BURST_THRESHOLD}). Check for abuse.`,
        'high',
      );
    }
  } else {
    burstArmed = true;
  }
}

// --- GitHub API failure alert, throttled to at most one per hour ---------

let lastGithubFailureAlertAt = 0;

export function alertGithubApiFailure(): void {
  if (!NTFY_URL) {
    return;
  }

  const now = Date.now();
  if (now - lastGithubFailureAlertAt < GITHUB_FAILURE_THROTTLE_MS) {
    return;
  }
  lastGithubFailureAlertAt = now;

  void publish(
    'Chores and Rewards: GitHub integration failing',
    'The bug-report endpoint is failing to reach the GitHub API. Reports may be getting lost. Check container logs.',
    'high',
  );
}
