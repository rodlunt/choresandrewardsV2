// Structured single-line logging for the bug-report endpoint (issue #61).
//
// Each call emits one JSON object per line: timestamp, event, outcome,
// status, plus a small set of categorical fields (reason, issueNumber,
// channel, detail). This is deliberately a thin wrapper around
// console.log/console.error rather than a logging library: one file, one
// job, easy to swap for a real log pipeline later without touching call
// sites.
//
// NEVER pass report content, screenshot bytes, or tokens through `detail`
// or any other field here - only diagnostic categories, counts and short
// error messages. The whole point of this file is that it is safe to ship
// straight to container logs and, via GlitchTip, off the box.

export type IssueLogEvent =
  | 'submission-accepted'
  | 'rejected-validation'
  | 'rejected-rate-limit'
  | 'rejected-screenshot'
  | 'github-api-failure'
  | 'token-missing'
  | 'screenshot-upload-failed'
  | 'alerting-delivery-failed';

export type IssueLogOutcome = 'accepted' | 'rejected' | 'error';

export interface IssueLogFields {
  event: IssueLogEvent;
  outcome: IssueLogOutcome;
  status: number;
  /** Short reason category, e.g. a Zod issue path or "too-large". Never free text from the payload. */
  reason?: string;
  issueNumber?: number;
  channel?: 'glitchtip' | 'ntfy';
  /** Short diagnostic string (e.g. an error message). Never report content. */
  detail?: string;
}

export function logIssueEvent(fields: IssueLogFields): void {
  const entry = {
    timestamp: new Date().toISOString(),
    ...fields,
  };

  if (fields.outcome === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
