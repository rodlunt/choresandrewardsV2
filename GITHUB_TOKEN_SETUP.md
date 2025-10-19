# GitHub Token Setup for Bug Report Feature

The bug report feature allows users to submit bugs and feature requests directly from the app, which creates GitHub issues in your repository.

## Setup Instructions

### 1. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name: `ChoresAndRewards Bug Reports`
4. Set expiration: **No expiration** (or your preferred duration)
5. Select the following scopes:
   - ✅ **repo** (Full control of private repositories)
     - This is needed to create issues and upload screenshots

6. Click **"Generate token"** at the bottom
7. **Copy the token immediately** (you won't be able to see it again!)

### 2. Add Token to .env File

1. On your server, navigate to the project directory:
   ```bash
   cd E:\Prod\ChoresandRewards
   ```

2. Create a `.env` file from the example (if it doesn't exist):
   ```bash
   copy .env.example .env
   ```

3. Edit the `.env` file and add your token:
   ```
   GITHUB_TOKEN=ghp_your_actual_token_here
   GITHUB_REPO_OWNER=rodlunt
   GITHUB_REPO_NAME=choresandrewardsV2
   ```

4. Save the file

### 3. Restart the Container

```bash
docker-compose down
docker-compose up -d
```

The bug report feature will now work! Users can submit bugs/features and they'll appear as issues in your GitHub repository.

## Testing the Feature

1. Visit https://www.choresandrewards.app
2. Click the **Bug Report** button (floating button in bottom-right)
3. Fill out the form and submit
4. Check your GitHub repository issues - you should see a new issue created!

## Security Notes

- ⚠️ **Never commit the `.env` file to git** - it's already in `.gitignore`
- ⚠️ The token has write access to your repository - keep it secret
- ✅ Screenshots are uploaded to a separate `bug-report-screenshots` branch, not main
- ✅ All user-submitted issues are tagged with `user-submitted` label

## Troubleshooting

If bug reports aren't working:

1. Check container logs:
   ```bash
   docker logs chores-rewards-app
   ```

2. Look for errors like:
   - `GITHUB_TOKEN not configured` - Token not set in .env
   - `401 Unauthorized` - Token is invalid or expired
   - `403 Forbidden` - Token doesn't have correct permissions

3. Verify the token is loaded:
   ```bash
   docker exec chores-rewards-app env | grep GITHUB
   ```

## Without a Token

If you don't set a GITHUB_TOKEN, the bug report button will still appear, but users will get an error when they try to submit. The app will continue to work normally for all other features.
