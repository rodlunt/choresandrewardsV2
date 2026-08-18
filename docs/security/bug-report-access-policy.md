# Bug report access policy

Recorded 2026-08-18 (issue #67). This is the decision record for who may submit reports
through the app and what happens to them.

## Who may submit

Anyone using the app, anonymously. No account, no CAPTCHA. The form is for genuine bug
reports and feature requests about Chores and Rewards.

## Volume

Five submissions per client per hour, enforced server-side. This is generous for genuine
use and exists to stop scripted abuse.

## Where reports go and who sees them

Reports, including any screenshot and browser details, are filed as issues on the private
`rodlunt/candr-reports` repository. Only the repository owner sees them. Nothing
user-submitted is published anywhere public, and the form says so.

## Promotion to public issues

When a report describes real work, the owner writes a fresh, sanitised issue on the public
`choresandrewardsV2` repository in his own words: no screenshots, no browser details, no
user-authored text pasted verbatim. Automated redaction was considered and rejected, since
free text cannot be reliably redacted by machine and the report volume does not justify a
pipeline.

## Retention and removal

Reports are kept while useful for the work they describe. A reporter who wants their report
removed can say so in a follow-up report referencing it, and it will be deleted.

## Moderation

Abusive or off-topic submissions are deleted without action. Persistent abuse from one
source is handled at the Cloudflare layer.
