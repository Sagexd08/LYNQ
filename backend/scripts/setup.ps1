# LYNQ Setup Script (PowerShell)
# This script helps set up the development environment

Write-Host "🚀 LYNQ Setup Script" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install npm" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Docker is not installed. Docker Compose features will not work." -ForegroundColor Yellow
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Python 3 is not installed. ML service will not work." -ForegroundColor Yellow
}

Write-Host "✓ Prerequisites check complete" -ForegroundColor Green
Write-Host ""

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "⚠️  Created .env from .env.example. Please update with your credentials." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  .env.example not found. Please create .env manually." -ForegroundColor Yellow
    }
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

Write-Host "✓ Backend setup complete" -ForegroundColor Green
Write-Host ""

# ML Service setup
if (Test-Path "ml-service") {
    Write-Host "Setting up ML service..." -ForegroundColor Yellow
    Push-Location ml-service
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "⚠️  Created ml-service/.env from .env.example" -ForegroundColor Yellow
        }
    }
    
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv -ErrorAction SilentlyContinue
        
        Write-Host "Installing ML service dependencies..." -ForegroundColor Yellow
        & "venv\Scripts\Activate.ps1"
        pip install -r requirements.txt
        
        Write-Host "Generating mock model (optional)..." -ForegroundColor Yellow
        python scripts/generate_mock_model.py 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Mock model generation skipped (optional)" -ForegroundColor Yellow
        }
        
        Write-Host "✓ ML service setup complete" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Python 3 not found. Skipping ML service setup." -ForegroundColor Yellow
    }
    
    Pop-Location
    Write-Host ""
}

# Database setup
Write-Host "Setting up database..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Starting PostgreSQL and Redis with Docker Compose..." -ForegroundColor Yellow
    docker-compose up -d postgres redis 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Docker Compose failed. Please start services manually." -ForegroundColor Yellow
    }
    
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npm run prisma:migrate 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Migration failed. Please run manually: npm run prisma:migrate" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Docker not found. Please set up PostgreSQL and Redis manually." -ForegroundColor Yellow
    Write-Host "Then run: npm run prisma:migrate" -ForegroundColor Yellow
}

Write-Host "✓ Database setup complete" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "====================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Update .env with your credentials (Supabase, Telegram, etc.)"
Write-Host "2. Start the backend: npm run start:dev"
Write-Host "3. Start the ML service: cd ml-service; uvicorn app.main:app --reload"
Write-Host "4. Visit http://localhost:3000/docs for API documentation"
Write-Host ""
