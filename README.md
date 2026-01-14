# LYNQ - Multi-chain DeFi Lending Platform

<div align="center">

[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-E0234E.svg)](https://nestjs.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Mantle](https://img.shields.io/badge/Mantle-Sepolia-000000.svg)](https://www.mantle.xyz/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E.svg)](https://railway.app/)

  <h3>🚀 AI-Powered Credit Risk Assessment for DeFi Lending</h3>
  <p>A comprehensive decentralized lending platform with machine learning risk assessment, multi-chain support, and real-time monitoring.</p>

  [Live Demo](#) • [Documentation](./DEPLOYMENT.md) • [Smart Contracts](#-deployed-smart-contracts-mantle-sepolia-testnet) • [API Docs](#)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#️-architecture)
- [Smart Contracts](#-deployed-smart-contracts-mantle-sepolia-testnet)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [ML Risk Scoring](#-ml-risk-scoring)
- [Testing](#-testing)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Core Features
- **Wallet Authentication** - Sign-in with Ethereum wallet using EIP-4361 (SIWE)
- **AI Credit Scoring** - ML-powered risk assessment with SHAP explainability
- **Smart Contracts** - Audited Solidity contracts for loan and collateral management
- **Multi-chain Support** - Mantle L2 (primary), Ethereum, Polygon testnets
- **Real-time Notifications** - Telegram bot with webhooks for instant alerts
- **Automated Settlement** - On-chain loan lifecycle management

### 🛠️ Technical Stack
- **Backend**: NestJS 10 with TypeScript
- **Database**: Supabase PostgreSQL with Prisma ORM
- **ML Service**: FastAPI on AWS EC2 with S3 model storage
- **Smart Contracts**: Solidity 0.8.20 with Hardhat
- **Job Queue**: BullMQ with Redis
- **Deployment**: Railway (Backend), AWS (ML), Mantle (Contracts)
- **Testing**: Jest, Supertest, Hardhat

### 🌟 Advanced Features
- **📊 SHAP Explainability** - Understand why loans are approved/rejected
- **⚡ L2 Optimization** - 90% lower gas costs on Mantle Network
- **🔄 Model Versioning** - A/B testing and rollback support via S3
- **📈 Health Monitoring** - Comprehensive service health checks
- **🔒 Security** - ReentrancyGuard, Pausable, Access Control
- **📦 Modular Architecture** - Easy to extend and maintain

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite + TailwindCSS)               │
│                    + ethers.js for Web3 interactions                 │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS/REST API + WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│              NestJS Backend (Railway Hosted + Auto-Scale)            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Modules: Auth • Loans • Risk • Blockchain • Telegram • Admin│   │
│  └──────────────────────────────────────────────────────────────┘   │
└──┬────────┬────────┬─────────┬─────────┬──────────┬────────┬────────┘
   │        │        │         │         │          │        │
   ▼        ▼        ▼         ▼         ▼          ▼        ▼
┌──────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌───────┐
│Supa- │ │FastAPI│ │Telegram│ │Smart   │ │Redis  │ │BullMQ│ │AWS S3 │
│base  │ │ML Svc │ │Bot API │ │Contracts│ │Cache  │ │Queues│ │Models │
│Auth+ │ │(AWS   │ │Webhooks│ │(Mantle │ │(Rail- │ │Jobs  │ │(Ver-  │
│DB    │ │EC2+   │ │        │ │Sepolia)│ │way)   │ │      │ │sioned)│
│(Pg)  │ │Lambda)│ │        │ │EVM     │ │       │ │      │ │       │
└──────┘ └───┬───┘ └───────┘ └────────┘ └───────┘ └──────┘ └───────┘
             │                     │
             │                     │
             ▼                     ▼
      ┌──────────────┐     ┌──────────────┐
      │ AWS S3 Bucket│     │Block Explorer│
      │ ML Models    │     │   Mantle     │
      │ (Versioned)  │     │   Sepolia    │
      └──────────────┘     └──────────────┘
```

### 🔄 Data Flow

1. **User Authentication**: Wallet connects → Signs SIWE message → Backend verifies → JWT issued
2. **Loan Request**: Frontend → Backend validates → ML Service evaluates risk → Smart contract called
3. **Risk Assessment**: Wallet data analyzed → ML model predicts default probability → Interest rate calculated
4. **On-chain Settlement**: Loan created → Collateral locked → Funds transferred → Events emitted
5. **Monitoring**: Telegram notifications → Health checks → BullMQ jobs for async tasks

---

## 📜 Deployed Smart Contracts (Mantle Sepolia Testnet)

### 🎯 Main Contract Suite (Production-Ready)

| Contract | Address | Explorer | Purpose |
|----------|---------|----------|---------|
| **LoanPlatform** | `0x2Ec5fD3E16e6fC4170010844969d2458fB192f9E` | [View →](https://explorer.sepolia.mantle.xyz/address/0x2Ec5fD3E16e6fC4170010844969d2458fB192f9E) | Main entry point for all loan operations |
| **TrustScore** | `0x15CAaA13e41937178F1B84eDB0193dc54230E27A` | [View →](https://explorer.sepolia.mantle.xyz/address/0x15CAaA13e41937178F1B84eDB0193dc54230E27A) | User credit score and reputation management |
| **CollateralManager** | `0x2074C5959f37CbF5fA2b1782E770B04bfbC93ebA` | [View →](https://explorer.sepolia.mantle.xyz/address/0x2074C5959f37CbF5fA2b1782E770B04bfbC93ebA) | Collateral deposits, liquidations, and seizure |
| **InterestRateModel** | `0x38d116a3Ed5104fEBB6f0455ce04A03172F28e45` | [View →](https://explorer.sepolia.mantle.xyz/address/0x38d116a3Ed5104fEBB6f0455ce04A03172F28e45) | Dynamic interest rate calculation |

### 🔄 Alternative Implementation (Lightweight)

| Contract | Address | Explorer | Use Case |
|----------|---------|----------|----------|
| **LoanCore** | `0x0E5419f4644afEdE849D24eeDebb9D491b821F9e` | [View →](https://explorer.sepolia.mantle.xyz/address/0x0E5419f4644afEdE849D24eeDebb9D491b821F9e) | Simplified loan management |
| **CollateralVault** | `0x1470b502711b080C7B9A061FD637A2514f362D10` | [View →](https://explorer.sepolia.mantle.xyz/address/0x1470b502711b080C7B9A061FD637A2514f362D10) | Basic collateral storage |

### 🌐 Network Details

```yaml
Network: Mantle Sepolia Testnet (L2)
Chain ID: 5003
RPC: https://rpc.sepolia.mantle.xyz
Explorer: https://explorer.sepolia.mantle.xyz
Faucet: https://faucet.sepolia.mantle.xyz
Currency: MNT (Test Tokens)
Deployer: 0xa025505514a057D9f7D9aA6992e0f30Fa5072071
```

### 📊 Contract Architecture

```
LoanPlatform (Main Entry Point)
├── TrustScore.sol         // Credit scoring & reputation
├── CollateralManager.sol  // Collateral handling
└── InterestRateModel.sol  // Interest calculation

Features:
✅ Ownable (Access Control)
✅ ReentrancyGuard (Security)
✅ Pausable (Emergency Stop)
✅ Event Logging (Transparency)
✅ Upgradeable Design (Future-proof)
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Node.js >= 18.0.0
- Python >= 3.11
- Docker & Docker Compose
- PostgreSQL >= 15
- Redis >= 7

# Recommended
- pnpm (faster package manager)
- Hardhat (for contract development)
- AWS CLI (for ML service deployment)
```

### 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/LYNQ.git
cd LYNQ

# 2. Install dependencies
cd backend && npm install
cd ../frontend/landing-v2 && npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start local services (PostgreSQL + Redis)
cd backend && docker-compose up -d

# 5. Run database migrations
npx prisma generate
npx prisma migrate deploy

# 6. Start backend
npm run start:dev
# Backend: http://localhost:3000
# API Docs: http://localhost:3000/docs

# 7. Start frontend (new terminal)
cd frontend/landing-v2 && npm run dev
# Frontend: http://localhost:5173
```

### 🎯 Quick Test

```bash
# Check API health
curl http://localhost:3000/health

# Get Swagger docs
open http://localhost:3000/docs

# Test wallet auth
curl -X POST http://localhost:3000/api/v1/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"address":"0x..."}'
```

---

## 📁 Project Structure

```
LYNQ/
├── 📄 .env                           # Environment variables (gitignored)
├── 📄 README.md                      # This file
├── 📄 DEPLOYMENT.md                  # Production deployment guide
├── 📄 package.json                   # Root workspace config
│
├── 📁 backend/                       # NestJS Backend
│   ├── 📁 src/
│   │   ├── 📁 auth/                  # Wallet auth (EIP-4361 SIWE)
│   │   ├── 📁 loans/                 # Loan CRUD operations
│   │   ├── 📁 collateral/            # Collateral management
│   │   ├── 📁 risk/                  # Risk assessment engine
│   │   ├── 📁 ml/                    # ML service client
│   │   ├── 📁 blockchain/            # Smart contract integration
│   │   ├── 📁 telegram/              # Telegram bot
│   │   ├── 📁 queues/                # BullMQ job processing
│   │   ├── 📁 repayments/            # Repayment logic
│   │   ├── 📁 reputation/            # User reputation
│   │   ├── 📁 users/                 # User management
│   │   ├── 📁 admin/                 # Admin endpoints
│   │   ├── 📁 health/                # Health checks
│   │   └── 📄 main.ts                # App entry point
│   │
│   ├── 📁 prisma/                    # Database ORM
│   │   ├── 📄 schema.prisma          # DB schema
│   │   └── 📁 migrations/            # SQL migrations
│   │
│   ├── 📁 contracts/                 # Smart Contracts
│   │   ├── 📁 ethereum/
│   │   │   ├── 📁 contracts/         # Solidity files
│   │   │   ├── 📁 scripts/           # Deploy scripts
│   │   │   ├── 📁 test/              # Contract tests
│   │   │   ├── 📁 deployments/       # Deployment records
│   │   │   └── 📄 hardhat.config.js  # Hardhat config
│   │   └── 📁 evm/                   # Multi-chain contracts
│   │
│   ├── 📁 ml-service/                # FastAPI ML Service
│   │   ├── 📁 app/
│   │   │   ├── 📁 api/               # API routes
│   │   │   ├── 📁 core/              # Config & security
│   │   │   ├── 📁 models/            # Model loading
│   │   │   ├── 📁 schemas/           # Pydantic models
│   │   │   └── 📁 services/          # ML inference
│   │   ├── 📁 models/                # Trained models
│   │   ├── 📁 scripts/               # Utilities
│   │   ├── 📄 requirements.txt       # Python deps
│   │   └── 📄 Dockerfile             # Docker config
│   │
│   ├── 📄 nixpacks.toml              # Railway build config
│   ├── 📄 docker-compose.yml         # Local dev services
│   └── 📄 package.json               # Backend deps
│
├── 📁 frontend/                      # React Frontend
│   └── 📁 landing-v2/
│       ├── 📁 src/
│       │   ├── 📁 components/        # React components
│       │   ├── 📁 lib/               # Utilities
│       │   ├── 📁 hooks/             # Custom hooks
│       │   └── 📄 App.tsx            # Main app
│       ├── 📄 vite.config.ts         # Vite config
│       └── 📄 package.json           # Frontend deps
│
└── 📁 docs/                          # Additional documentation
    ├── 📄 API.md                     # API reference
    ├── 📄 SMART_CONTRACTS.md         # Contract docs
    └── 📄 ML_MODEL.md                # ML model info
```

---

## 🔧 API Endpoints

### 🔐 Authentication

```http
POST   /api/v1/auth/wallet/challenge    # Get SIWE challenge
POST   /api/v1/auth/wallet/verify       # Verify signature & login
GET    /api/v1/auth/me                  # Get current user
POST   /api/v1/auth/refresh             # Refresh JWT token
POST   /api/v1/auth/logout              # Logout user
```

### 💰 Loans

```http
POST   /api/v1/loans                    # Create loan request
GET    /api/v1/loans                    # List user's loans
GET    /api/v1/loans/:id                # Get loan details
POST   /api/v1/loans/:id/activate       # Activate pending loan
POST   /api/v1/loans/:id/repay          # Make repayment
GET    /api/v1/loans/:id/repayments     # Get repayment history
POST   /api/v1/loans/:id/default        # Mark loan as defaulted (admin)
```

### 📊 Risk Assessment

```http
POST   /api/v1/risk/evaluate            # Evaluate loan risk
GET    /api/v1/risk/:loanId             # Get risk assessment
GET    /api/v1/risk/user/:userId        # Get user risk profile
POST   /api/v1/risk/recalculate         # Recalculate risk (admin)
```

### 🏦 Collateral

```http
POST   /api/v1/collateral/lock          # Lock collateral
POST   /api/v1/collateral/unlock        # Unlock collateral
GET    /api/v1/collateral/:loanId       # Get collateral info
POST   /api/v1/collateral/seize         # Seize collateral (admin)
```

### 🔔 Telegram

```http
POST   /api/v1/telegram/subscribe       # Subscribe to notifications
POST   /api/v1/telegram/unsubscribe     # Unsubscribe
GET    /api/v1/telegram/status          # Get subscription status
POST   /api/v1/telegram/webhook         # Telegram webhook (internal)
```

### 👤 Users

```http
GET    /api/v1/users/:id                # Get user profile
PATCH  /api/v1/users/:id                # Update user
GET    /api/v1/users/:id/reputation     # Get reputation
GET    /api/v1/users/:id/achievements   # Get achievements
```

### 💊 Health & Monitoring

```http
GET    /health                          # Overall health status
GET    /health/live                     # Liveness probe
GET    /health/ready                    # Readiness probe
GET    /health/database                 # Database health
GET    /health/redis                    # Redis health
GET    /health/blockchain               # Blockchain connection
GET    /health/ml-service               # ML service health
```

### 📚 API Documentation

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs-json`
- **Redoc**: `http://localhost:3000/redoc`

---

## 🚢 Deployment

### 🚂 Railway (Backend) - Recommended

**1. Prerequisites:**
- Railway account
- GitHub repo connected
- Supabase project

**2. Create Project:**
```bash
railway login
railway init
railway link
```

**3. Add Services:**
- Backend (NestJS)
- Redis (from template)
- PostgreSQL (from Supabase)

**4. Environment Variables:**
```env
# Copy from .env.example and configure
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
# ... see .env.example for complete list
```

**5. Deploy:**
```bash
git push origin main
# Railway auto-deploys on push
```

### ☁️ AWS (ML Service)

**Option 1: EC2**
```bash
# Launch t2.micro instance
ssh -i key.pem ec2-user@your-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# Deploy ML service
git clone your-repo
cd backend/ml-service
docker build -t lynq-ml .
docker run -d -p 8000:8000 --env-file .env lynq-ml
```

**Option 2: Lambda + API Gateway**
```bash
# Package ML service
cd backend/ml-service
zip -r function.zip .

# Upload to Lambda
aws lambda create-function \
  --function-name lynq-ml-service \
  --runtime python3.11 \
  --handler app.main.handler \
  --zip-file fileb://function.zip
```

### 🔗 Smart Contracts

```bash
cd backend/contracts/ethereum

# Compile
npx hardhat compile --config hardhat.config.js

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy-remaining.js \
  --network mantleSepolia \
  --config hardhat.config.js

# Verify on explorer
npx hardhat verify --network mantleSepolia CONTRACT_ADDRESS
```

---

## 🤖 ML Risk Scoring

### 📊 Features Used

| Feature | Weight | Description |
|---------|--------|-------------|
| **Wallet Age** | 25% | Account history length (days) |
| **Transaction Volume** | 20% | Total USD value transacted |
| **Transaction Count** | 15% | Number of transactions |
| **DeFi Interactions** | 20% | Protocol interactions count |
| **Collateral Ratio** | 15% | Loan-to-value ratio |
| **Historical Performance** | 5% | Previous loan repayment rate |

### 🎯 Risk Levels & Interest Rates

```typescript
VERY_LOW:  800-1000  →  5.0%  APR  (Excellent)
LOW:       700-799   →  7.5%  APR  (Good)
MEDIUM:    600-699   →  10.0% APR  (Fair)
HIGH:      500-599   →  15.0% APR  (Risky)
VERY_HIGH: 100-499   →  20.0% APR  (Very Risky)
```

### 🔍 SHAP Explainability

```json
{
  "credit_score": 750,
  "risk_level": "LOW",
  "interest_rate": 7.5,
  "max_loan_amount": 10000,
  "shap_values": {
    "wallet_age": 0.15,
    "transaction_volume": 0.12,
    "defi_interactions": 0.08,
    "collateral_ratio": 0.10,
    "transaction_count": 0.05
  },
  "explanation": "High wallet age and transaction volume contribute positively to credit score"
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch

# Smart contract tests
cd backend/contracts/ethereum
npx hardhat test

# Load testing
npm run test:load
```

### 📊 Coverage Report

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
All files               |   85.2  |   78.5   |   88.1  |   86.3
 auth/                  |   92.1  |   85.3   |   95.2  |   93.4
 loans/                 |   88.7  |   82.1   |   90.5  |   89.2
 risk/                  |   91.3  |   88.7   |   92.8  |   91.9
 blockchain/            |   78.5  |   71.2   |   82.3  |   79.8
```

---

## 🆕 Recent Updates

### v1.3.0 (Current) - Mantle Integration ✨
- ✅ **Mantle L2 Deployment**: Primary network on Mantle Sepolia
- ✅ **90% Gas Savings**: Optimized for L2 transactions
- ✅ **Multi-Chain Support**: Mantle, Ethereum, Polygon configured
- ✅ **Enhanced Docs**: Complete Mantle deployment guide
- ✅ **Contract Suite**: Full production-ready contracts deployed

### v1.2.0 - Production Ready 🚀
- ✅ **AWS S3 Integration**: ML model versioning and management
- ✅ **Railway Deployment**: Full production deployment
- ✅ **Redis Queues**: BullMQ for async job processing
- ✅ **Health Monitoring**: Comprehensive health checks
- ✅ **Telegram Bot**: Production webhooks
- ✅ **Environment Configs**: Optimized for cloud deployment

### v1.1.0 - Core Features 🎯
- ✅ AI-powered credit scoring with SHAP
- ✅ Multi-chain support (Ethereum, Polygon)
- ✅ Telegram notifications
- ✅ Supabase integration
- ✅ Smart contract deployment

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 📋 Development Process

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/LYNQ.git
   cd LYNQ
   git checkout -b feature/your-feature
   ```

2. **Make Changes**
   - Follow TypeScript/Solidity best practices
   - Write tests for new features
   - Update documentation

3. **Commit**
   ```bash
   git commit -m "feat: add amazing feature"
   # Use conventional commits format
   ```

4. **Push & PR**
   ```bash
   git push origin feature/your-feature
   # Create PR on GitHub
   ```

### 📝 Commit Convention

```
feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: add tests
chore: maintenance
```

### 🎨 Code Style

- **TypeScript**: Prettier + ESLint
- **Solidity**: Solhint
- **Python**: Black + Flake8

---

## 📄 License

**UNLICENSED** - All rights reserved.  
This is proprietary software. Unauthorized copying or distribution is prohibited.

---

## 📞 Support & Resources

### 🔗 Links
- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Smart Contracts**: [Mantle Explorer](https://explorer.sepolia.mantle.xyz)
- **API Docs**: [Swagger UI](http://localhost:3000/docs)
- **Telegram**: [Join Community](#)

### 🐛 Issues
Found a bug? [Open an issue](https://github.com/your-org/LYNQ/issues)

### 💬 Discussions
Have questions? [Start a discussion](https://github.com/your-org/LYNQ/discussions)

---

## 🙏 Acknowledgments

Built with amazing open-source projects:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [Prisma](https://www.prisma.io/) - Next-gen ORM
- [Railway](https://railway.app/) - Cloud platform
- [Mantle Network](https://www.mantle.xyz/) - L2 scaling solution

---

<div align="center">

### 🌟 Star us on GitHub if you like this project!

**Built with ❤️ by the LYNQ Team**

[⬆ Back to Top](#lynq---multi-chain-defi-lending-platform)

</div>
