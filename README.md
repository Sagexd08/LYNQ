# LYNQ Multi-Chain DeFi Lending Platform

A production-grade, multi-chain DeFi lending platform with ML-enhanced credit scoring, fraud detection, and risk assessment.

## 🏗️ Monorepo Structure

```
LYNQ/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── frontend/         # Next.js user application
│   └── admin/           # Next.js admin dashboard
├── packages/
│   └── blockchain-adapter/  # Multi-chain abstraction layer
├── contracts/
│   └── evm/             # Ethereum/EVM smart contracts
└── deployments/         # Docker & Kubernetes configs
```

## 🚀 Features

### Backend Modules

#### 🔐 Authentication (`apps/backend/src/modules/auth`)
- JWT-based authentication
- Multi-chain wallet connection (Ethereum, Aptos, Flow)
- Signature verification for wallet-based login
- Passport strategies for protected routes

#### 👥 User Management (`apps/backend/src/modules/user`)
- User profiles with reputation tracking
- Tier system: BRONZE → SILVER → GOLD → PLATINUM
- Point-based progression (100 → 1000 → 5000 → 15000)
- Social graph and referral tracking

#### 💰 Loan Core (`apps/backend/src/modules/loan`)
- Create, repay, and liquidate loans
- Dynamic interest rates based on reputation:
  - BRONZE: 15%
  - SILVER: 10%
  - GOLD: 7.5%
  - PLATINUM: 5%
- Loan statuses: PENDING, ACTIVE, REPAID, DEFAULTED, LIQUIDATED

#### 🔒 Collateral Management (`apps/backend/src/modules/collateral`)
- Lock/unlock collateral for loan security
- Multi-token support (ERC20, native tokens)
- Real-time collateral value tracking
- Statuses: LOCKED, UNLOCKED, LIQUIDATED

#### 🤖 ML Module (`apps/backend/src/modules/ml`)

**Credit Scoring Service**
- 5-factor weighted algorithm:
  - Payment History (35%): On-time payment ratio
  - Utilization Rate (25%): Debt-to-limit ratio
  - Account Age (15%): Platform history
  - Reputation Score (15%): Platform standing
  - Diversification (10%): Asset variety
- Credit grades: A+ (800+) to F (<500)

**Fraud Detection Service**
- Pattern analysis checks:
  - Unusual loan amounts (>5x median)
  - Velocity anomalies (>5 loans in 24h)
  - New account risk (<30 days)
  - Suspicious patterns (rapid borrow/repay cycles)
  - Blacklist validation
- Recommendations: APPROVE, REVIEW, REJECT

**Risk Assessment Service**
- Default probability calculation based on:
  - Credit score
  - Payment history
  - Current debt ratio
- Liquidation risk monitoring (120% threshold)
- Collateral health tracking
- Risk levels: LOW, MEDIUM, HIGH, CRITICAL

## 📦 Smart Contracts (EVM)

### LoanCore.sol
- Loan lifecycle management
- Interest calculation
- Collateral integration
- Liquidation logic

### CollateralVault.sol
- Secure collateral storage
- ERC20 token support
- Lock/unlock mechanisms
- Balance tracking

### ReputationPoints.sol
- ERC721 NFT badges for tiers
- On-chain reputation tracking
- Automated tier upgrades
- Point award system

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 16 with TypeORM
- **Authentication**: JWT + Passport
- **API**: RESTful with Swagger docs
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Next.js 14 (App Router)
- **State**: Zustand + React Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Wallet**: RainbowKit, Petra (Aptos), Flow Client Library
- **Forms**: React Hook Form + Zod

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts 5.0
- **Networks**: Ethereum, Polygon, BSC

### Infrastructure
- **Containerization**: Docker multi-stage builds
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monorepo**: Turborepo

## 🚦 Getting Started

### Prerequisites
```bash
node >= 18.0.0
pnpm >= 8.0.0
docker >= 24.0.0
postgresql >= 16.0.0
```

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd LYNQ
pnpm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. **Start PostgreSQL**
```bash
docker-compose up -d postgres
```

4. **Run database migrations**
```bash
cd apps/backend
pnpm run migration:run
```

5. **Start development servers**
```bash
# Start all apps
pnpm run dev

# Or individually:
pnpm run dev:backend   # Port 3000
pnpm run dev:frontend  # Port 3001
pnpm run dev:admin     # Port 3002
```

### Deploy Smart Contracts

```bash
cd contracts/evm
pnpm install
pnpm run compile

# Deploy to local network
pnpm run deploy

# Deploy to Ethereum
pnpm run deploy:ethereum

# Deploy to Polygon
pnpm run deploy:polygon
```

## 📊 API Endpoints

### Authentication
```
POST /auth/register          - Register new user
POST /auth/wallet-connect    - Connect wallet (EVM/Aptos/Flow)
POST /auth/login             - Login with credentials
GET  /auth/profile           - Get user profile (protected)
```

### Loans
```
POST /loans                  - Create new loan
GET  /loans                  - List user loans
GET  /loans/:id              - Get loan details
POST /loans/:id/repay        - Repay loan
POST /loans/:id/liquidate    - Liquidate defaulted loan
```

### Collateral
```
POST /collateral             - Lock collateral
GET  /collateral             - List user collateral
GET  /collateral/:id         - Get collateral details
POST /collateral/:id/unlock  - Unlock collateral
GET  /collateral/:id/value   - Get current value
```

### ML Services (Internal)
```
POST /ml/credit-score        - Calculate credit score
POST /ml/fraud-check         - Run fraud detection
POST /ml/risk-assessment     - Assess loan risk
```

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lynq

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Blockchain RPCs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-key
BSC_RPC_URL=https://bsc-dataseed.binance.org

# Aptos
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
APTOS_FAUCET_URL=https://faucet.mainnet.aptoslabs.com

# Flow
FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_ENABLE_APTOS=true
NEXT_PUBLIC_ENABLE_FLOW=true
```

## 📈 ML Algorithm Details

### Credit Score Calculation
```
Score = (PaymentHistory × 0.35) + 
        (UtilizationRate × 0.25) + 
        (AccountAge × 0.15) + 
        (ReputationScore × 0.15) + 
        (Diversification × 0.10)

Grade Thresholds:
A+ : 800-1000
A  : 750-799
B+ : 700-749
B  : 650-699
C+ : 600-649
C  : 550-599
D  : 500-549
F  : 0-499
```

### Fraud Detection Rules
```
1. Unusual Amount: loan > 5 × median(user_loans)
2. Velocity: >5 loans in 24 hours
3. New Account: account_age < 30 days
4. Suspicious Pattern: >3 rapid borrow-repay cycles
5. Blacklist: address in fraud_addresses table

Risk Score = Σ(triggered_flags × weight)
Recommendation:
- APPROVE: score < 30
- REVIEW: 30 ≤ score < 70
- REJECT: score ≥ 70
```

### Risk Assessment
```
Default Probability = f(credit_score, payment_history, debt_ratio)
Liquidation Risk = current_collateral_value / loan_amount
Collateral Health = (collateral_value - loan_value) / loan_value

Risk Level:
- LOW: default_prob < 10%, liquidation_risk > 150%
- MEDIUM: 10% ≤ default_prob < 25%, 120% < liquidation_risk ≤ 150%
- HIGH: 25% ≤ default_prob < 50%, liquidation_risk ≤ 120%
- CRITICAL: default_prob ≥ 50%, liquidation_risk < 100%
```

## 🏗️ Architecture Diagrams

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Landing  │  │Dashboard │  │ Wallet Connect   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────────┐
│              Backend (NestJS)                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Auth   │ │  User   │ │  Loan    │ │   ML    │ │
│  └─────────┘ └─────────┘ └──────────┘ └─────────┘ │
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Collateral     │  │  Blockchain Adapter      │ │
│  └─────────────────┘  └──────────────────────────┘ │
└────────────┬───────────────────┬────────────────────┘
             │                   │
    ┌────────┴────────┐  ┌───────┴──────────┐
    │   PostgreSQL    │  │  Smart Contracts │
    │   (TypeORM)     │  │  EVM/Aptos/Flow  │
    └─────────────────┘  └──────────────────┘
```

### Loan Lifecycle
```
1. User connects wallet
2. ML Credit Scoring runs
3. Fraud Detection analyzes
4. Risk Assessment evaluates
   ↓
5. Loan terms calculated (interest rate based on reputation)
6. User locks collateral
7. Loan activated
   ↓
8. User makes payments
9. Reputation points awarded
10. Collateral unlocked on full repayment
    OR
11. Liquidation if defaulted
```

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run backend tests
cd apps/backend
pnpm run test
pnpm run test:e2e

# Run contract tests
cd contracts/evm
pnpm run test
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.
