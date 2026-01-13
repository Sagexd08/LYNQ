# Fix pnpm lockfile sync issue (PowerShell)
# This script regenerates the pnpm-lock.yaml to match package.json

Write-Host "🔧 Fixing pnpm lockfile..." -ForegroundColor Cyan

# Remove old lockfile if exists
if (Test-Path "pnpm-lock.yaml") {
    Write-Host "Removing old pnpm-lock.yaml..." -ForegroundColor Yellow
    Remove-Item "pnpm-lock.yaml"
}

# Install dependencies to regenerate lockfile
Write-Host "Installing dependencies to regenerate lockfile..." -ForegroundColor Yellow
pnpm install

Write-Host "✅ Lockfile regenerated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Commit the new pnpm-lock.yaml"
Write-Host "2. Push to your repository"
Write-Host "3. Redeploy"
