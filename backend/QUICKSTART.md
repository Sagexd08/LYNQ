# LYNQ Quick Start Guide

## Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

## Quick Setup (5 minutes)

### 1. Clone and Install

```bash
git clone <repository-url>
cd LYNQ
npm install
```

### 2. Run Setup Script

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

### 3. Configure Environment

Copy and edit environment files:

```bash
# Backend
cp .env.example .env
# Edit .env with your Supabase credentials, etc.

# ML Service
cd ml-service
cp .env.example .env
# Edit .env with your API key
cd ..
```

### 4. Start Services

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Manual Start**
```bash
# Terminal 1: Start database and Redis
docker-compose up -d postgres redis

# Terminal 2: Start backend
npm run start:dev

# Terminal 3: Start ML service
cd ml-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Verify Installation

- Backend API: http://localhost:3000/docs
- ML Service: http://localhost:8000/health
- Health Check: http://localhost:3000/health

## Generate Mock ML Model (Optional)

For local development without a trained model:

```bash
cd ml-service
python scripts/generate_mock_model.py
```

This creates a simple RandomForest model for testing.

## First API Call

### 1. Get Wallet Challenge

```bash
curl -X POST http://localhost:3000/api/v1/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92"}'
```

### 2. Sign Message with Wallet

Use MetaMask or another wallet to sign the returned message.

### 3. Verify Signature

```bash
curl -X POST http://localhost:3000/api/v1/auth/wallet/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92",
    "signature": "0x..."
  }'
```

### 4. Create Loan (with JWT token)

```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1000,
    "termMonths": 6,
    "collateralValueUsd": 1500
  }'
```

## Environment Variables Quick Reference

### Backend (.env)
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
JWT_SECRET=your-secret-min-32-chars
ML_SERVICE_URL=http://localhost:8000
ML_API_KEY=your-api-key
REDIS_URL=redis://localhost:6379
TELEGRAM_BOT_TOKEN=...
BLOCKCHAIN_RPC_URL=https://...
```

### ML Service (ml-service/.env)
```env
MODEL_SOURCE=local
API_KEY=your-api-key
ENABLE_SHAP=true
HOST=0.0.0.0
PORT=8000
```

## Common Issues

### Database Connection Error
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in .env
- Run migrations: `npm run prisma:migrate`

### ML Service Not Responding
- Check if service is running: `curl http://localhost:8000/health`
- Verify API_KEY matches in both services
- Check ML service logs

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Port Already in Use
- Change PORT in .env
- Or stop the service using the port

## Next Steps

1. **Set up Supabase**: Create project and get credentials
2. **Deploy Smart Contracts**: Deploy to testnet
3. **Configure Telegram Bot**: Create bot with @BotFather
4. **Test Full Flow**: Create loan, lock collateral, make repayment

## Documentation

- API Docs: http://localhost:3000/docs
- ML Service: See `ml-service/README.md`
- Smart Contracts: See `contracts/README.md` (if exists)
- Full Documentation: See `README.md`

## Support

For issues or questions:
1. Check `IMPLEMENTATION_STATUS.md` for feature status
2. Review logs in console
3. Check health endpoints
4. Review API documentation

---

**Happy Coding! 🚀**
