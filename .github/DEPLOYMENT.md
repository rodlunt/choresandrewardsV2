# Deployment

## Hosting

The app runs as a Docker Compose stack on the owner's Linux home server, reachable only over
Tailscale (tailnet-only, no public SSH). Deploy path on the server: `/srv/prod/ChoresandRewards`.
Caddy fronts the container and Cloudflare sits in front of Caddy, serving the app at
`candr.lunt.au`.

## CI

`.github/workflows/validate-and-deploy.yml` runs on every push to `main`:

1. **validate**: `pnpm install --frozen-lockfile`, `pnpm audit --audit-level=high`,
   `pnpm run check` (tsc), `pnpm run build`.
2. **deploy**: SSHes to the server and runs `docker-compose build && docker-compose up -d`.

The deploy job runs on a GitHub-hosted runner, which cannot reach a tailnet-only host. It
currently fails at the SSH step on every run. Issue #29 tracks moving this to a self-hosted
runner on the tailnet so deploy can work again.

## Manual deploy (current, until #29 lands)

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
