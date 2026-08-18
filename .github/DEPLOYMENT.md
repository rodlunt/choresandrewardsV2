# Deployment

## Hosting

The app runs as a Docker Compose stack on the owner's Linux home server, reachable only over
Tailscale (tailnet-only, no public SSH). Deploy path on the server: `/srv/prod/ChoresandRewards`.
Caddy fronts the container and Cloudflare sits in front of Caddy, serving the app at
`candr.lunt.au`.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests:

1. **Security audit** (own job): `pnpm audit --audit-level=high`.
2. **validate**: `pnpm install --frozen-lockfile`, `pnpm run check` (tsc), `pnpm run build`.

Both jobs are required status checks on `main`. CI does not deploy: a GitHub-hosted runner
cannot reach the tailnet-only server, and a self-hosted runner on a public repository is a
documented risk. Deployment is pull-based instead: see below and `deploy/README.md`.

## Automated deploy (poll-based)

A systemd timer on the server (`candr-deploy.timer`, every 5 minutes) checks whether
`origin/main` is ahead of the local checkout, verifies that commit's required CI checks
concluded green via the public checks API, then pulls, rebuilds and restarts the stack,
verifying the checkout sha, container health and the live URL. Failures alert via ntfy;
holds (CI pending or API unreachable) never deploy. Install and failure behaviour:
`deploy/README.md`. Merged PRs reach candr.lunt.au within about 5 minutes.

## Manual deploy (fallback)

```bash
ssh <server>
cd /srv/prod/ChoresandRewards
git pull --ff-only
docker compose build
docker compose up -d
```

## Status

Check the Actions tab for the last validate/deploy run, and check the live site at
`candr.lunt.au` directly. Neither is asserted here, both go stale the moment this file isn't
updated.

## Recovery

```bash
cd /srv/prod/ChoresandRewards
git log --oneline -10        # pick a known-good sha
git checkout <known-good-sha>
docker compose build
docker compose up -d
```
