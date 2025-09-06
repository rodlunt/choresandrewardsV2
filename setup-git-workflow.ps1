# Setup Git workflow on production server
# Run this once to initialize the Git repository

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo  # e.g., "yourusername/chores-app"
)

$REPO_URL = "https://github.com/$GitHubRepo.git"
$PROD_PATH = "E:\Prod\ChoresandRewards"

Write-Host "Setting up Git workflow for production server..."

# Navigate to production directory
Set-Location $PROD_PATH

# Initialize Git if not already done
if (!(Test-Path ".git")) {
    Write-Host "Initializing Git repository..."
    git init
    git branch -M main
}

# Add GitHub remote
Write-Host "Adding GitHub remote..."
git remote remove origin -ErrorAction SilentlyContinue
git remote add origin $REPO_URL

# Create .gitignore for production
Write-Host "Creating .gitignore..."
$gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*

# Production builds
dist/
build/

# Environment files
.env
.env.local
.env.production

# Docker volumes
caddy_data/
caddy_config/
caddy_certs/

# Logs
*.log

# OS generated files
.DS_Store
Thumbs.db
"@

$gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8

Write-Host "Git setup complete!"
Write-Host "Next steps:"
Write-Host "   1. Create GitHub repository: $GitHubRepo"
Write-Host "   2. Push your code from VSCode to GitHub"
Write-Host "   3. Use deploy-from-github.ps1 to deploy updates"