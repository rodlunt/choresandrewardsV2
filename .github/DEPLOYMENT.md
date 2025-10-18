# GitHub Actions Auto-Deployment Setup

This repository is configured for automatic deployment to your production server on every push to the `main` branch.

## 🚀 How It Works

1. Push code to `main` branch
2. GitHub Actions triggers automatically
3. Connects to your server via SSH
4. Pulls latest changes
5. Installs dependencies
6. Builds the application
7. Restarts the service

## 🔧 Setup Instructions

### 1. Generate SSH Key (if you don't have one)

On your local machine:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

This creates two files:
- `~/.ssh/github_actions_deploy` (private key)
- `~/.ssh/github_actions_deploy.pub` (public key)

### 2. Add Public Key to Server

Copy the public key to your server:
```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@homeserver
```

Or manually add it to `~/.ssh/authorized_keys` on the server.

### 3. Configure GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

#### Required Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SERVER_HOST` | Your server hostname or IP | `homeserver` or `192.168.1.100` |
| `SERVER_USERNAME` | SSH username | `rodlu` or `administrator` |
| `SSH_PRIVATE_KEY` | Private SSH key content | Contents of `~/.ssh/github_actions_deploy` |
| `DEPLOY_PATH` | Deployment directory on server | `/home/rodlu/prod/ChoresandRewards` |

#### Optional Secrets:

| Secret Name | Description | Default |
|------------|-------------|---------|
| `SERVER_PORT` | SSH port | `22` |

### 4. Update Deployment Script

Edit `.github/workflows/deploy.yml` and uncomment the appropriate restart command:

```yaml
# For PM2:
pm2 restart chores-app

# For Docker Compose:
docker-compose restart

# For systemd:
systemctl restart chores-app

# For npm:
npm run start
```

## 📋 Server Requirements

Your server must have:
- [x] Git installed
- [x] Node.js installed (v18+)
- [x] npm installed
- [x] SSH access enabled
- [x] Git repository cloned at `DEPLOY_PATH`
- [x] Appropriate permissions for deployment user

## 🧪 Testing the Deployment

### Manual Test via GitHub UI:
1. Go to **Actions** tab in GitHub
2. Click **Deploy to Production**
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

### Monitor Deployment:
1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the deployment logs in real-time

## 🔒 Security Best Practices

1. **Never commit private keys** to the repository
2. **Use dedicated SSH keys** for GitHub Actions (not your personal key)
3. **Limit SSH key permissions** on the server (use `authorized_keys` restrictions)
4. **Use environment-specific secrets** for sensitive data
5. **Review deployment logs** regularly

## 🛠️ Troubleshooting

### Deployment Fails: Permission Denied

**Issue**: SSH connection fails
**Solution**:
```bash
# On server, check SSH key permissions:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Ensure GitHub Actions key is in authorized_keys
cat ~/.ssh/authorized_keys | grep "github-actions"
```

### Deployment Fails: npm install Error

**Issue**: Dependencies fail to install
**Solution**:
```bash
# On server, try manual install:
cd /path/to/deploy
npm install --verbose

# Check Node.js version:
node --version  # Should be v18+
```

### Deployment Fails: Build Error

**Issue**: `npm run build` fails
**Solution**:
```bash
# Check if all dependencies are installed:
npm ls

# Try building manually:
npm run build
```

### Git Pull Fails: Uncommitted Changes

**Issue**: Server has uncommitted changes
**Solution**:
```bash
# On server:
cd /path/to/deploy
git status

# Either commit changes:
git add . && git commit -m "server changes"

# Or discard changes (be careful!):
git reset --hard origin/main
```

## 🔄 Rollback Procedure

If a deployment breaks production:

```bash
# SSH into server
ssh user@homeserver

# Navigate to deployment directory
cd /path/to/deploy

# Check recent commits
git log --oneline -5

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart service
# (use your restart command)
```

## 📊 Monitoring

After each deployment, verify:
- [x] Application is running
- [x] No errors in logs
- [x] Database connectivity
- [x] All routes working
- [x] Frontend loads correctly

## 🎯 Advanced Configuration

### Deploy Only on Tagged Releases

Modify `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    tags:
      - 'v*'  # Deploy on version tags (v1.0.0, v2.1.3, etc.)
```

### Deploy to Multiple Environments

Create separate workflows:
- `.github/workflows/deploy-staging.yml` (deploys to staging server)
- `.github/workflows/deploy-production.yml` (deploys to production)

### Add Slack/Discord Notifications

Add notification step to workflow:
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📝 Workflow Status Badge

Add this badge to your README.md:
```markdown
![Deploy Status](https://github.com/rodlunt/choresandrewardsV2/actions/workflows/deploy.yml/badge.svg)
```

## 🆘 Support

If you encounter issues:
1. Check the Actions logs in GitHub
2. Verify all secrets are correctly configured
3. Test SSH connection manually: `ssh user@homeserver`
4. Check server logs for application errors

---

**Last Updated**: 2025-10-18
**Workflow File**: `.github/workflows/deploy.yml`
