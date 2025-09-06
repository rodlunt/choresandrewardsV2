# Deploy from GitHub to production server
# Run this whenever you want to deploy updates

param(
    [string]$branch = "main",
    [switch]$force = $false
)

$PROD_PATH = "E:\Prod\ChoresandRewards"

Write-Host "🚀 Deploying from GitHub (branch: $branch)..."

# Navigate to production directory
Set-Location $PROD_PATH

# Check for uncommitted changes
$status = git status --porcelain
if ($status -and !$force) {
    Write-Host "⚠️  Warning: Uncommitted changes detected on server!"
    Write-Host "   Use -force flag to override, or commit changes first"
    Write-Host "   Changes:"
    git status --short
    exit 1
}

# Fetch and pull latest code
Write-Host "📥 Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/$branch

# Stop current containers
Write-Host "⏹️  Stopping current containers..."
docker-compose -f docker-compose-standard-ssl.yml down

# Clean up old images (optional)
Write-Host "🗑️  Cleaning up old Docker images..."
docker image prune -f

# Build and start containers
Write-Host "🔨 Building and starting containers..."
docker-compose -f docker-compose-standard-ssl.yml up -d --build

# Wait a moment for containers to start
Start-Sleep -Seconds 3

# Check deployment status
Write-Host "📊 Checking deployment status..."
$containers = docker-compose -f docker-compose-standard-ssl.yml ps --format "table {{.Name}}\t{{.Status}}"
Write-Host $containers

# Test SSL certificate status
Write-Host "🔒 Checking SSL certificate..."
docker logs caddy-ssl --tail 10 | Select-String -Pattern "certificate|error" | Select-Object -Last 3

Write-Host "✅ Deployment complete!"
Write-Host "🌐 Your app is live at: https://www.choresandrewards.app"
Write-Host "📱 Test it on your phone to confirm external access"