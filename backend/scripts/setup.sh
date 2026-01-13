#!/bin/bash

# LYNQ Setup Script
# This script helps set up the development environment

set -e

echo "🚀 LYNQ Setup Script"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker Compose features will not work."
fi

if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python 3 is not installed. ML service will not work."
fi

echo -e "${GREEN}✓${NC} Prerequisites check complete"
echo ""

# Backend setup
echo "Setting up backend..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️${NC} Created .env from .env.example. Please update with your credentials."
    else
        echo -e "${YELLOW}⚠️${NC} .env.example not found. Please create .env manually."
    fi
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo -e "${GREEN}✓${NC} Backend setup complete"
echo ""

# ML Service setup
if [ -d "ml-service" ]; then
    echo "Setting up ML service..."
    cd ml-service
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${YELLOW}⚠️${NC} Created ml-service/.env from .env.example"
        fi
    fi
    
    if command -v python3 &> /dev/null; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv || true
        
        echo "Installing ML service dependencies..."
        if [ -f "venv/bin/activate" ]; then
            source venv/bin/activate
        elif [ -f "venv/Scripts/activate" ]; then
            source venv/Scripts/activate
        fi
        
        pip install -r requirements.txt
        
        echo "Generating mock model (optional)..."
        python scripts/generate_mock_model.py || echo -e "${YELLOW}⚠️${NC} Mock model generation skipped (optional)"
        
        echo -e "${GREEN}✓${NC} ML service setup complete"
    else
        echo -e "${YELLOW}⚠️${NC} Python 3 not found. Skipping ML service setup."
    fi
    
    cd ..
    echo ""
fi

# Database setup
echo "Setting up database..."
if command -v docker &> /dev/null; then
    echo "Starting PostgreSQL and Redis with Docker Compose..."
    docker-compose up -d postgres redis || echo -e "${YELLOW}⚠️${NC} Docker Compose failed. Please start services manually."
    
    echo "Waiting for database to be ready..."
    sleep 5
    
    echo "Running database migrations..."
    npm run prisma:migrate || echo -e "${YELLOW}⚠️${NC} Migration failed. Please run manually: npm run prisma:migrate"
else
    echo -e "${YELLOW}⚠️${NC} Docker not found. Please set up PostgreSQL and Redis manually."
    echo "Then run: npm run prisma:migrate"
fi

echo -e "${GREEN}✓${NC} Database setup complete"
echo ""

# Summary
echo "===================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env with your credentials (Supabase, Telegram, etc.)"
echo "2. Start the backend: npm run start:dev"
echo "3. Start the ML service: cd ml-service && uvicorn app.main:app --reload"
echo "4. Visit http://localhost:3000/docs for API documentation"
echo ""
