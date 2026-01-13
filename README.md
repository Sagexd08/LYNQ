# LYNQ - Multi-chain DeFi Lending Platform

<div align="center">
  <h3>AI-Powered Credit Risk Assessment for DeFi Lending</h3>
  <p>A comprehensive decentralized lending platform with machine learning risk assessment, multi-chain support, and Telegram bot integration.</p>
</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Backend                             │
└─────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┘
      │         │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Supabase │ │FastAPI  │ │Telegram │ │  Smart  │ │ Redis   │ │BullMQ   │
│Auth+DB  │ │ML Svc   │ │Bot API  │ │Contracts│ │ Cache   │ │ Queues  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
                │
                ▼
          ┌───────────┐
          │  AWS S3   │
          │  Models   │
          └───────────┘
```

## 📋 Features

### Core Features
- **Wallet Authentication**: Sign-in with Ethereum wallet (EIP-4361)
- **AI Credit Scoring**: ML-powered risk assessment with SHAP explainability
- **Multi-chain Support**: Ethereum Sepolia, Polygon Amoy testnets
- **Smart Contracts**: On-chain loan and collateral management
- **Real-time Notifications**: Telegram bot for alerts and status updates

### Technical Highlights
- **NestJS Backend**: Modular, scalable architecture
- **FastAPI ML Service**: High-performance credit scoring
- **BullMQ Queues**: Async job processing
- **Prisma ORM**: Type-safe database access
- **Swagger Docs**: Comprehensive API documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Development

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd LYNQ
npm install
```

2. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services**
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Generate Prisma client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

4. **Start ML Service**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
LYNQ/
├── src/                          # NestJS Backend
│   ├── auth/                     # Wallet authentication
│   ├── loans/                    # Loan management
│   ├── collateral/               # Collateral management
│   ├── risk/                     # Risk engine
│   ├── ml/                       # ML service client
│   ├── blockchain/               # Smart contract integration
│   ├── telegram/                 # Telegram bot
│   ├── queues/                   # BullMQ queue system
│   ├── health/                   # Health checks
│   └── main.ts
├── ml-service/                   # FastAPI ML Service
│   ├── app/
│   │   ├── api/                  # API routes
│   │   ├── core/                 # Config, security
│   │   ├── models/               # Model loading
│   │   ├── schemas/              # Pydantic schemas
│   │   └── services/             # Inference, explainability
│   ├── Dockerfile
│   └── requirements.txt
├── contracts/                    # Solidity smart contracts
│   ├── contracts/
│   │   ├── LoanCore.sol
│   │   └── CollateralVault.sol
│   ├── scripts/
│   └── hardhat.config.ts
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
└── package.json
```

## 🔧 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/wallet/challenge` | Get sign-in challenge |
| POST | `/api/v1/auth/wallet/verify` | Verify signature & login |
| GET | `/api/v1/auth/me` | Get current user |

### Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/loans` | Create loan request |
| GET | `/api/v1/loans` | Get user's loans |
| GET | `/api/v1/loans/:id` | Get loan details |
| POST | `/api/v1/loans/:id/repay` | Make repayment |

### Risk Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/risk/evaluate` | Evaluate loan risk |
| GET | `/api/v1/risk/:loanId` | Get risk assessment |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health status |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

## 📚 Documentation

- **API Docs**: `http://localhost:3000/docs`
- **ML Service**: `http://localhost:8000/docs`

## 🔐 Environment Variables

### Backend
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
JWT_SECRET=your-jwt-secret-min-32-chars
ML_SERVICE_URL=http://localhost:8000
ML_API_KEY=your-ml-api-key
TELEGRAM_BOT_TOKEN=...
REDIS_URL=redis://localhost:6379
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/...
```

### ML Service
```env
MODEL_SOURCE=local
API_KEY=your-ml-api-key
ENABLE_SHAP=true
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚢 Deployment

### Backend (Railway/Fly.io)
```bash
# Using Railway
railway login
railway deploy

# Using Fly.io
fly launch
fly deploy
```

### ML Service (AWS EC2)
```bash
# On EC2 instance
docker build -t lynq-ml .
docker run -d -p 8000:8000 lynq-ml
```

### Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

## 📊 Risk Scoring

The ML service evaluates credit risk based on:
- **Wallet Age**: Account history length
- **Transaction History**: Volume and frequency
- **DeFi Activity**: Protocol interactions
- **Reputation Score**: Platform performance
- **Collateral Ratio**: Loan-to-value ratio

### Risk Levels
| Level | Score Range | Default Interest |
|-------|-------------|------------------|
| VERY_LOW | 800-1000 | 5% |
| LOW | 700-799 | 7.5% |
| MEDIUM | 600-699 | 10% |
| HIGH | 500-599 | 15% |
| VERY_HIGH | 100-499 | 20% |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

UNLICENSED - All rights reserved

---

<div align="center">
  <p>Built with ❤️ by the LYNQ Team</p>
</div>
