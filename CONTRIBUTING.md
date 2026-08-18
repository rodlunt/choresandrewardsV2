# Contributing

This is a small, mostly-solo family project, but it's public and pull requests are welcome.

## Where things go

- **Bugs and feature ideas**: open an issue using the bug report or feature request template.
  Both templates carry an Acceptance criteria field, fill it in with testable statements, not
  "it works now".
- **Security vulnerabilities**: do not open a public issue. Report privately via
  [GitHub's security advisory tool](https://github.com/rodlunt/choresandrewardsV2/security/advisories/new).
  See [`SECURITY.md`](SECURITY.md) for scope.
- **General questions**: an issue is fine if there's nowhere better; this repo doesn't currently
  have GitHub Discussions enabled.

## Dev setup

Requires [pnpm](https://pnpm.io/) and Node.js 22. This project never uses npm; the
`packageManager` field in `package.json` pins the exact pnpm version.

```bash
pnpm install
cp .env.example .env   # fill in GITHUB_TOKEN if you want the bug-report feature to work locally
pnpm run dev
```

## Before you push

Run the same gates CI runs, in the same order it runs them:

```bash
pnpm run check                     # TypeScript type check
pnpm run build                     # production build
pnpm audit --audit-level=high      # dependency security audit
```

All three are required status checks on `main` (`Run Pre-Deployment Checks` covers the first
two, `Security audit` is the third, run as its own job so a dependency advisory can't silently
stop type-check and build from reporting their own status). A pull request that fails either
cannot merge.

## Pull requests

- Branch off `main`, one topic per branch.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`), with an optional scope.
- Fill in the PR template: what and why, a Verification section naming the artefact that proves
  it works, and a `Closes #N` line for the issue it resolves.
- Add tests or a described manual verification step for behavioural changes; there's no
  automated test suite beyond the type check and build, so a Verification note in the PR is
  doing real work here.
- Australian English, no em dashes or en dashes.

## What not to touch without asking

`.github/workflows/validate-and-deploy.yml` and the branch protection rules on `main` are
deliberately configured (SHA-pinned actions, split gate jobs, required status checks). Changes
to CI or deploy behaviour should be their own PR with the reasoning spelled out, not a drive-by
edit inside an unrelated change.
