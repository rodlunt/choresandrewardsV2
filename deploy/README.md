# Poll-based deployment

`deploy-poll.sh` runs on the server from a systemd timer every 5 minutes: if
`origin/main` is ahead of the local checkout and that exact commit's required
CI checks ("Run Pre-Deployment Checks" and "Security audit") concluded green,
it pulls, rebuilds and restarts the compose stack, then verifies the checkout
sha, the container healthcheck and the public URL. No inbound access and no
GitHub credentials are involved: the checks API for a public repo is
unauthenticated read.

This replaces the old push-triggered SSH deploy job, which could never reach
the tailnet-only server from GitHub-hosted runners, and deliberately avoids a
self-hosted runner: on a public repository a fork PR can retarget workflows at
`runs-on: self-hosted`, and GitHub itself recommends against runners on public
repos.

## Failure behaviour

- CI pending, API unreachable, or response unparsable: the deploy is **held**
  (fail closed). A hold persisting past 45 minutes raises one ntfy alert per
  commit, re-nagged hourly at most.
- A required check concluding red on main (should be impossible under branch
  protection): immediate throttled alert, deploys stop.
- Build, health or liveness failure after deploying: urgent ntfy alert; the
  old container keeps serving if the build failed.
- Alert delivery itself failing is loud: logged and non-zero exit, with the
  unit's `OnFailure=ntfy-fail@%n.service` as the backup alarm.

**Stated gap:** nothing watches the timer itself. If it quietly stops, the
symptom is merged PRs never reaching candr.lunt.au, with no alert. A Kuma push
heartbeat on `last-success`/timer activity can close this later.

## Install (once, as root on the server)

The script must run from a root-owned path, never from this checkout (the
checkout is writable by an unprivileged user; root must not execute what that
user can edit). Editing `deploy/deploy-poll.sh` in the repo does nothing until
reinstalled:

```bash
install -d -o root -g root /usr/local/lib/candr-deploy
install -o root -g root -m 0755 deploy/deploy-poll.sh /usr/local/lib/candr-deploy/deploy-poll.sh
install -o root -g root -m 0644 deploy/candr-deploy.service deploy/candr-deploy.timer /etc/systemd/system/
printf 'NTFY_URL=%s\n' 'https://ntfy.lunt.au/<topic>' > /etc/candr-deploy.env
chmod 0600 /etc/candr-deploy.env
systemctl daemon-reload
systemctl enable --now candr-deploy.timer
```

The ntfy topic stays in `/etc/candr-deploy.env` on the server, not in this
public repository.
