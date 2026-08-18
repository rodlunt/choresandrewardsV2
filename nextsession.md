# choresandrewardsV2 Session Handoff Baton

**Date:** 2026-08-18. **Session:** BMC URL sweep, deploy blocked.

**Branch:** main

**Last commits this session:**

- 2ef5d7a Merge pull request #33 from rodlunt/fix/bmac-url
- ed7383f fix: update Buy Me a Coffee URL to /rodlunt

---

## What shipped this session

- This repo was one stop in an account-wide Buy Me a Coffee sweep (the page moved
  from /rodluntgithub to /rodlunt). PR #33 updated the URL in
  `client/src/components/Footer.tsx` and `client/src/components/BuyMeCoffeeBanner.tsx`,
  merged to main. No README footer was added because the repo has no README, by design
  of the sweep rules.
- Context from the wider sweep: seven public repos got README footers, AmIAKnob got the
  same URL fix and was deployed live on opti, and rod.lunt.au gained a footer coffee
  glyph plus a per-note support line (rodluntau-home-page PR #98). All merged and
  verified against live artefacts.

## Open follow-ups

1. **The merged URL fix is NOT live.** candr.lunt.au still serves the old
   buymeacoffee.com/rodluntgithub link (inside the built JS bundle,
   `/assets/index-C33qMOAF.js` at time of writing), and since the BMC rename that
   live link is presumably dead. LIKELY on the dead-link claim; the old URL was not
   probed.
2. **Why:** the "Validate and Deploy to Production" workflow fails at its
   pre-deployment security audit and has failed on every run since 2026-07-05.
   `pnpm audit` reports 5 vulnerabilities (4 high, 1 moderate); the headline one is
   postcss <=8.5.17 (needs >=8.5.18, GHSA-r28c-9q8g-f849) pulled in via
   tailwindcss/tailwindcss-animate, 19 paths. Fix is a dependency bump PR (branch +
   PR per house rules), get the gate green, and the deploy then carries the URL fix
   out with it. Do not bypass the audit gate.
3. After a successful deploy, verify against the live bundle, not the workflow row:
   `curl -s https://candr.lunt.au/ | grep -oP 'src="[^"]+\.js"'` then grep that asset
   for `buymeacoffee.com/rodlunt`.

## Suggested starting point

Bump the vulnerable dependencies (start with `pnpm audit` locally to get the current
list, then override or update postcss and friends), open a PR, and once the deploy
gate passes confirm candr.lunt.au serves the new BMC URL.
