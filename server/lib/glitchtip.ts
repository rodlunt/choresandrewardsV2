// Dependency-free client for reporting genuine faults to the self-hosted
// GlitchTip instance (issue #61). GlitchTip speaks the Sentry "store"
// protocol, so this is a tiny fetch() POST rather than a full SDK - see
// the PR description for why @sentry/node was passed over.
//
// This is telemetry, not a gate: nothing here may affect the request the
// caller is serving. Every function is fire-and-forget from the caller's
// point of view and swallows its own errors, logging them loudly instead
// (rule: a swallowed exception needs a written reason - the reason is that
// a reporting failure must never become a user-facing failure).
//
// Config is env-only and defaults OFF: absent SENTRY_DSN means
// errorReportingEnabled is false and reportFault() is a no-op.

import { randomUUID } from 'node:crypto';
import { logIssueEvent } from './log';

interface ParsedDsn {
  storeUrl: string;
  publicKey: string;
}

// DSN shape: https://<publicKey>@<host>[:port][/path-prefix]/<projectId>
function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (!publicKey || !projectId) {
      return null;
    }

    return {
      storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/`,
      publicKey,
    };
  } catch {
    return null;
  }
}

const dsn = process.env.SENTRY_DSN;
const parsedDsn = dsn ? parseDsn(dsn) : null;

if (dsn && !parsedDsn) {
  // Config error, not a fault to report to GlitchTip (it's unreachable by
  // definition). Log it loudly so a typo'd DSN doesn't fail silently.
  logIssueEvent({
    event: 'alerting-delivery-failed',
    outcome: 'error',
    status: 0,
    channel: 'glitchtip',
    detail: 'SENTRY_DSN is set but could not be parsed; error reporting disabled',
  });
}

export const errorReportingEnabled = parsedDsn !== null;

function normaliseError(error: unknown): { type: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { type: error.name || 'Error', message: error.message, stack: error.stack };
  }
  return { type: 'NonErrorThrown', message: String(error) };
}

export async function reportFault(params: {
  event: string;
  error: unknown;
  tags?: Record<string, string>;
}): Promise<void> {
  if (!parsedDsn) {
    return;
  }

  try {
    const { type, message, stack } = normaliseError(params.error);

    const payload = {
      event_id: randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'node',
      level: 'error',
      logger: 'candr-issues-endpoint',
      exception: {
        values: [{ type, value: message }],
      },
      extra: stack ? { stack } : undefined,
      tags: { source: 'issues-endpoint', event: params.event, ...params.tags },
    };

    const res = await fetch(parsedDsn.storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=candr-issues-alerting/1.0, sentry_key=${parsedDsn.publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      logIssueEvent({
        event: 'alerting-delivery-failed',
        outcome: 'error',
        status: res.status,
        channel: 'glitchtip',
      });
    }
  } catch (err) {
    // Best-effort: GlitchTip being unreachable must never affect the
    // response already sent (or about to be sent) to the caller.
    logIssueEvent({
      event: 'alerting-delivery-failed',
      outcome: 'error',
      status: 0,
      channel: 'glitchtip',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
