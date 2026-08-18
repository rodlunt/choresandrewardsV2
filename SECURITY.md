# Security Policy

## Reporting a vulnerability

Report security issues privately through GitHub's advisory tool, not as a public issue:

**https://github.com/rodlunt/choresandrewardsV2/security/advisories/new**

This opens a private draft advisory visible only to the maintainer. It lets you attach detail
(reproduction steps, proof of concept) without exposing it to the public before there's a fix.

Please do not report security issues through the public issue tracker.

## Scope

This is a small, self-hosted family application with no user accounts and no server-side
persistence: chore, child and payout data live entirely in the browser's IndexedDB and never
reach the server except via the bug-report screenshot upload. The server-side surface is one
Express app with a single API route (`/api/issues`) that files GitHub issues on behalf of the
app via a scoped personal access token. Reports relevant to this scope include, but aren't
limited to:

- Anything that lets `/api/issues` be used to write outside the intended repository or branch
- Cross-site scripting or injection through user-submitted bug report text
- Ways to bypass the app's rate limiting or Content-Security-Policy
- Dependency vulnerabilities not already caught by the CI security audit

## What to expect

There's no formal SLA. This is a hobby project maintained in spare time. Reports are read and
triaged as they come in, and a fix or mitigation ships as a normal pull request once one exists.

## Supported versions

There's a single deployed version, tracking the `main` branch. Fixes land on `main`; there are
no older versions receiving separate security patches.
