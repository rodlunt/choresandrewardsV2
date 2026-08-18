# Chores and Rewards

[![Validate and Deploy to Production](https://github.com/rodlunt/choresandrewardsV2/actions/workflows/validate-and-deploy.yml/badge.svg)](https://github.com/rodlunt/choresandrewardsV2/actions/workflows/validate-and-deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A family chore tracking and rewards app. Kids get a list of chores, ticking one off adds its
value to their running total, and a payout resets that total to zero. Everything runs client-side
against the browser's IndexedDB: there is no database and no server-side persistence.

## What it is

- **Chores**: a title and a cent value, managed globally.
- **Children**: a name and a running cent total, plus a per-child list of favourite chores
  (`Child.favoriteChoreIds`, not a property on the chore itself).
- **Payouts**: recorded against a child, each one zeroes that child's total.
- **Bug reports**: an in-app button posts to `/api/issues`, which files a GitHub issue in this
  repository via Octokit (see [`GITHUB_TOKEN_SETUP.md`](GITHUB_TOKEN_SETUP.md)). Without a
  configured token the button still renders; submitting just fails.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, wouter |
| Backend | Express 5 on Node.js, serving the built SPA plus the `/api/issues` route |
| Storage | Client-side only, IndexedDB via `idb`. No database, no server-side persistence |
| Package manager | pnpm (workspace-pinned, see `packageManager` in `package.json`) |
| Deployment | Docker Compose on a home server, via GitHub Actions CI/CD |

## Development setup

Requires [pnpm](https://pnpm.io/) (never npm, see `packageManager` in `package.json` for the
pinned version) and Node.js 22, matching CI.

```bash
pnpm install
cp .env.example .env   # then fill in GITHUB_TOKEN if you want bug reports to work locally
pnpm run dev            # starts the dev server (Vite + Express) on PORT, default 5000
```

See [`.env.example`](.env.example) for every environment variable the app reads, and
[`GITHUB_TOKEN_SETUP.md`](GITHUB_TOKEN_SETUP.md) for how to generate and scope the GitHub
token the bug report feature needs.

## Tests / checks

These are the exact commands CI runs in `.github/workflows/validate-and-deploy.yml`. Run them
all locally before pushing:

```bash
pnpm install --frozen-lockfile
pnpm run check                     # TypeScript type check (tsc)
pnpm run build                     # production build (vite build + esbuild)
pnpm audit --audit-level=high      # dependency security audit, runs as its own CI job
```

CI also greps the built client for hooks called after conditional returns or inside loops, and
checks the build output directory contains the expected files. There is no automated test suite
(no Jest/Vitest) in this repository at present; `pnpm run check` and `pnpm run build` are the
whole of the type and build safety net.

## Deploy pipeline

`.github/workflows/validate-and-deploy.yml` runs on every push to `main` and on every pull
request against it. Two gate jobs, **Security audit** (`pnpm audit --audit-level=high`) and
**Run Pre-Deployment Checks** (type check, build, build-output validation), are required status
checks on `main` and run on both pull requests and pushes. A third job, **Deploy to Server**,
only runs on a push to `main`: it SSHes into the target server and runs
`docker-compose build && docker-compose up -d`. Full detail, including the current known gap
where the GitHub-hosted runner cannot reach the deploy target, is in
[`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md).

## Docs

| Doc | What it covers |
|---|---|
| [`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md) | Hosting, CI/CD pipeline detail, manual deploy and rollback commands |
| [`GITHUB_TOKEN_SETUP.md`](GITHUB_TOKEN_SETUP.md) | Scoping and installing the GitHub token the bug report feature needs |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Dev setup, local CI gates, PR expectations |
| [`SECURITY.md`](SECURITY.md) | How to report a vulnerability |
| [`VALIDATION.md`](VALIDATION.md) | Manual pre-deploy validation guide (predates the pnpm migration; commands there are npm-era) |
| [`BUG_REPORT.md`](BUG_REPORT.md) | A point-in-time bug audit from 2025-10-19; historical, not a live issue list |
| [`TODO.md`](TODO.md) | Outstanding low-priority items |

## Screenshots

None captured yet. This is a known gap, not an oversight to paper over with placeholder images.

## Licence

MIT, see [`LICENSE`](LICENSE).
