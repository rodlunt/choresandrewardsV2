# Rollback to previous deployment
# Useful if new deployment has issues

param(
    [int]$commits = 1  # How many commits to go back
)

Write-Host "⏪ Rolling back $commits commit(s)..."

# Stop current containers
Write-Host "⏹️  Stopping current containers..."
docker-compose -f docker-compose-standard-ssl.yml down

# Rollback to previous commit
Write-Host "🔄 Rolling back code..."
git reset --hard HEAD~$commits

# Rebuild and restart
Write-Host "🔨 Rebuilding containers..."
docker-compose -f docker-compose-standard-ssl.yml up -d --build

# Wait for startup
Start-Sleep -Seconds 3

# Show status
Write-Host "📊 Rollback status:"
docker-compose -f docker-compose-standard-ssl.yml ps

$commit = git rev-parse --short HEAD
Write-Host "✅ Rollback complete! Now at commit: $commit"
Write-Host "🌐 Test your app: https://www.choresandrewards.app"