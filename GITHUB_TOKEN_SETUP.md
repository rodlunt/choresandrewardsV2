# GitHub Token Setup for Bug Report Feature

The bug report feature lets users submit bugs and feature requests from the app, which creates
GitHub issues in the private `rodlunt/candr-reports` intake repository via the `/api/issues`
route. Reports (including screenshots and browser details) deliberately do not land in this
public repository; when a report becomes real work, a sanitised issue is written here by hand.

## Setup Instructions

### 1. Create a fine-grained Personal Access Token

1. Go to https://github.com/settings/personal-access-tokens/new
2. Give it a descriptive name: `ChoresAndRewards Bug Reports`
3. Set **Resource owner** to `rodlunt` and **Repository access** to "Only select repositories",
   then pick `candr-reports` (the private intake repo). Do not grant access to any other
   repository.
4. Set **Expiration** to 90 days.
5. Under **Repository permissions**, grant:
   - **Issues**: Read and write
   - **Contents**: Read and write (needed for the screenshot upload branch)
6. Click **Generate token** and copy it immediately, you will not see it again.

Because the token is repo-restricted and time-limited, a leak is bounded: it cannot touch any
other repository and expires on its own in 90 days.

### 2. Add the token to the `.env` file on the server

```bash
cd /srv/prod/ChoresandRewards
cp .env.example .env   # if it doesn't exist yet
```

Enter the token without it ever landing in shell history:

```bash
read -rs GITHUB_TOKEN
```

Paste the token at the prompt, then write it into `.env` along with:

```
GITHUB_REPO_OWNER=rodlunt
GITHUB_REPO_NAME=candr-reports
```

### 3. Recreate the container so it picks up the new environment

```bash
docker compose up -d
```

## Testing the Feature

1. Visit https://candr.lunt.au
2. Click the **Bug Report** button (floating button, bottom-right)
3. Fill out the form and submit
4. Check the private `candr-reports` repository's Issues tab for the new issue

## Security Notes

- Never commit the `.env` file to git; it is already in `.gitignore`.
- The token only has Issues and Contents write access on this one repository, and expires after
  90 days. Rotate it before it does if the feature is still in use.
- Screenshots are uploaded to a separate `bug-report-screenshots` branch, not `main`.
- All user-submitted issues are tagged with the `user-submitted` label.

## Troubleshooting

If bug reports aren't working:

1. Check container logs:
   ```bash
   docker logs chores-rewards-app
   ```
2. Look for:
   - `GITHUB_TOKEN not configured` - token not set in `.env`
   - `401 Unauthorized` - token is invalid or expired
   - `403 Forbidden` - token is missing the Issues or Contents permission
3. Verify the token is loaded:
   ```bash
   docker exec chores-rewards-app env | grep GITHUB
   ```

## Without a Token

If `GITHUB_TOKEN` is not set, the bug report button still appears, but submitting gives an error.
The rest of the app works normally.
