# Quick health check for your production deployment

Write-Host "🔍 Checking deployment health..."

# Check container status
Write-Host "`n📦 Container Status:"
docker-compose -f docker-compose-standard-ssl.yml ps

# Check recent logs
Write-Host "`n📜 Recent Caddy Logs:"
docker logs caddy-ssl --tail 5 | ForEach-Object { "   $_" }

Write-Host "`n📜 Recent App Logs:"
docker logs chores-rewards-app --tail 5 | ForEach-Object { "   $_" }

# Check Git status
Write-Host "`n🔧 Git Status:"
$branch = git branch --show-current
$commit = git rev-parse --short HEAD
Write-Host "   Current branch: $branch"
Write-Host "   Latest commit: $commit"

# Check disk usage
Write-Host "`n💾 Docker Disk Usage:"
docker system df | ForEach-Object { "   $_" }

Write-Host "`n✅ Health check complete!"
Write-Host "🌐 App URL: https://www.choresandrewards.app"