# choresandrewardsV2 Session Handoff Baton

**Date:** 2026-08-19. **Session:** engineering audit, full burndown, deploy automation.

**Branch:** main

## Where things stand

Every issue on the repo is CLOSED (the 2026-08-18 engineering audit filed 42; all are
resolved, 41 in code and one by recorded decision). Do not trust this file for live
status: check the Actions tab and https://candr.lunt.au directly.

## How this repo operates now (changed this session)

- **Branch protection on main**: strict, enforce_admins, three required checks ("Run
  Pre-Deployment Checks", "Security audit", "Tests"). Everything merges via PR with green
  checks, batons included. Zero required approvals (solo repo).
- **CI** is `.github/workflows/ci.yml` (audit and tests are separate jobs; runs on push
  and pull_request). The test suite is Vitest (storage/schema, fake-indexeddb) plus a
  Playwright journey; `pnpm test` and `pnpm test:e2e`.
- **Deploys are poll-based**: `candr-deploy.timer` on opti (script at
  `/usr/local/lib/candr-deploy/`, NOT the checkout) deploys origin/main within ~5 minutes
  of a merge, only when that exact commit's required checks are green, then verifies sha,
  container health and the live URL. There is NO SSH deploy and NO self-hosted runner
  (deliberate: public repo, fork-PR runs-on risk). See `deploy/README.md`, including the
  stated gap (nothing watches the timer itself).
- **Bug reports land in the PRIVATE repo `rodlunt/candr-reports`** (fine-grained PAT
  `candr-reports-intake`, expires 2026-11-16; `GITHUB_REPO_NAME=candr-reports` in the
  server `.env`). Reports never go public; sanitised issues are written by hand. Policy
  docs: `docs/security/`.
- **Alerting is live**: ntfy (server-alerts topic; burst >10 accepted reports/60m,
  GitHub-failure one/hour) and GlitchTip (project "Chores and Rewards", org rodlunt, id 2;
  DSN via docker network name `glitchtip:8000`, which dies silently if glitchtip leaves
  the shared `web` network). Runbook: `docs/security/alerting-setup.md`.
- **App changes**: completions ledger (DB v3), parent PIN gating (payout/edit/delete/
  import; no PIN set = ungated), import confirm + auto-backup + undo-completion,
  `Payout.childName` dropped (join on childId), private-intake disclosure in the form,
  maskable PWA icons + full "Chores and Rewards" home-screen name.

## Open follow-ups (none are issues)

1. Another session ("Github Repo Cleanup") was batch-merging ~9 Dependabot PRs to main
   as this session closed; each lands on prod via the poller. If prod misbehaves, suspect
   the major bumps (framer-motion, lucide, zod-validation-error) and check with them.
2. Rodney was asked to remove and re-add the phone home-screen shortcut to pick up the
   new icon and name (Android caches both at add time).
3. Watch-the-watcher gap on candr-deploy.timer: a Kuma push heartbeat would close it.
4. Dependabot cadence (weekly, grouped minors) may deserve retuning if PR volume annoys.

## Suggested starting point

Nothing urgent. The queue memory (`project_candr_open_items.md` in the global memory dir)
mirrors this file's follow-ups.
