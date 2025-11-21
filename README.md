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

#### 🤖 Advanced ML Module (`apps/backend/src/modules/ml`)

**Credit Scoring Service**
- 5-factor weighted algorithm:
  - Payment History (35%): On-time payment ratio
  - Utilization Rate (25%): Debt-to-limit ratio
  - Account Age (15%): Platform history
  - Reputation Score (15%): Platform standing
  - Diversification (10%): Asset variety
- AI-enhanced predictions using Advanced AI Engine
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

**🆕 Ensemble Models Service** ⭐
- **Random Forest Classifier**: 50-tree ensemble for robust predictions
- **Gradient Boosting**: Adaptive learning with residual corrections
- **Neural Network**: Backpropagation-trained network (20→15→10 architecture)
- **Logistic Regression**: Baseline linear classification
- **Decision Trees**: Information gain optimization with 10-level depth
- Weighted ensemble combination (RF: 40%, GB: 30%, NN: 20%, LR: 10%)
- Features:
  - Cross-validation (k-fold) support for model evaluation
  - Feature importance calculation and ranking
  - Anomaly detection between model predictions
  - Confidence scoring based on model agreement
  - Training history tracking

**🆕 Anomaly Detection Service** ⭐
- **Z-Score Detection**: Statistical deviation analysis with configurable thresholds
- **Isolation Forest**: Tree-based isolation algorithm (100 trees, 256 sample size)
- **Local Outlier Factor (LOF)**: Density-based anomaly scoring with k-nearest neighbors
- **Statistical Methods**: Rule-based detection (transaction frequency, location changes, reputation)
- Real-time anomaly scoring (0-100)
- Severity levels: NORMAL, SUSPICIOUS, CRITICAL
- Actionable recommendations: ALLOW, REVIEW, BLOCK
- Reasons generation for detected anomalies
- Baseline statistics calculation from historical data

**🆕 Predictive Analytics Service** ⭐
- **ARIMA Forecasting**: AutoRegressive Integrated Moving Average with differencing
- **Exponential Smoothing**: Double exponential smoothing with trend adjustment
- **Gradient Boosted Regression**: 50-estimator ensemble for regression tasks
- **Loan Default Prediction**:
  - Risk scoring from multiple factors
  - Time-to-default estimation
  - Recommended interventions (MONITOR, INTERVENE, ALERT_LENDER)
- **User Churn Prediction**:
  - Engagement-based scoring
  - Retention factor analysis
  - Customized retention strategies
- **Market Trend Forecasting**: Price and volatility predictions
- Confidence intervals with uncertainty bands
- Trend analysis (INCREASING, DECREASING, STABLE)

**🆕 ML Pipeline Features**
- End-to-end ML training and inference pipeline
- Automatic feature normalization and scaling
- Model persistence and serialization
- Real-time prediction endpoints
- Historical data tracking for model improvement
- Performance metrics tracking
- Cross-validation for robust evaluation

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

### ML Services (Internal & Advanced)
```
# Legacy ML Services
POST /ml/credit-score          - Calculate credit score
POST /ml/fraud-check           - Run fraud detection
POST /ml/risk-assessment       - Assess loan risk

# 🆕 Advanced ML Endpoints
POST /ml/ensemble-prediction   - Get ensemble model prediction with confidence
POST /ml/ensemble-train        - Train ensemble models with historical data
GET  /ml/feature-importance    - Get feature importance scores for all models
POST /ml/cross-validate        - Perform k-fold cross-validation (default 5 folds)

# 🆕 Anomaly Detection Endpoints
POST /ml/anomaly-detection     - Detect anomalies in user behavior/transactions
POST /ml/train-anomaly-detector - Train anomaly detector on historical data
GET  /ml/anomaly-baseline      - Get baseline statistics for comparison

# 🆕 Predictive Analytics Endpoints
POST /ml/forecast-timeseries   - Forecast time series data with confidence intervals
POST /ml/predict-loan-default  - Predict loan default probability (advanced)
POST /ml/predict-churn         - Predict user churn probability
POST /ml/forecast-market       - Forecast market trends and volatility
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

## 📈 Advanced ML Architecture

### Ensemble Learning Pipeline
The platform employs a sophisticated ensemble learning approach that combines multiple ML algorithms for superior predictive accuracy:

```
Input Features
     ↓
┌────────────────────────────────┐
│  Feature Normalization (0-1)   │
└────────────────────┬───────────┘
                     ↓
    ┌────────────────┼────────────────┐
    ↓                ↓                ↓
┌─────────────┐ ┌──────────────┐ ┌──────────────┐
│ Random      │ │ Gradient     │ │ Neural       │
│ Forest (40%)│ │ Boosting     │ │ Network (20%)│
│ 50 trees    │ │ (30%)        │ │ 20→15→10     │
└──────┬──────┘ │ 100 iter     │ └──────┬───────┘
       │        └──────┬───────┘        │
       │               ↓                │
       │        ┌────────────────┐      │
       │        │ Logistic       │      │
       │        │ Regression(10%)│      │
       │        └────────┬───────┘      │
       │                 │              │
       └────────────────┬┴──────────────┘
                        ↓
           ┌────────────────────────┐
           │ Weighted Combination   │
           │ & Confidence Calc      │
           └────────────┬───────────┘
                        ↓
              ┌──────────────────┐
              │ Prediction       │
              │ + Confidence     │
              │ + Anomaly Score  │
              └──────────────────┘
```

**Model Parameters:**
- Random Forest: 50 decision trees with bootstrap sampling
- Gradient Boosting: 100 iterations with 0.1 learning rate
- Neural Network: 3-layer (20→15→10) with ReLU activation
- Logistic Regression: Optimized coefficients via gradient descent
- Decision Trees: 10-level depth with information gain splitting

### Anomaly Detection Multi-Algorithm Approach
```
Transaction Input
     ↓
┌─────────────────────────────────┐
│ Four-Method Anomaly Analysis    │
└────────────┬────────────────────┘
    ↓        ↓         ↓         ↓
  Z-Score  Isolation  LOF    Statistical
   (30%)   Forest(30%) (20%)   Rules(20%)
    ↓        ↓         ↓         ↓
└────────────┬────────────────────┘
             ↓
  ┌──────────────────────┐
  │ Weighted Anomaly     │
  │ Score (0-100)        │
  └─────────┬────────────┘
            ↓
   ┌────────────────────┐
   │ Severity Level &   │
   │ Action             │
   │ NORMAL/SUSPICIOUS/ │
   │ CRITICAL           │
   │ ALLOW/REVIEW/BLOCK │
   └────────────────────┘
```

**Detection Methods:**
1. **Z-Score**: σ-based deviation (threshold: 2.5σ)
2. **Isolation Forest**: 100 trees, 256 sample bootstrap
3. **Local Outlier Factor**: k=5 nearest neighbor density
4. **Statistical Rules**: 8 feature-based heuristics

### Time Series Forecasting
```
Historical Data Points (n)
     ↓
┌────────────────────────────┐
│ Two-Method Forecasting     │
└────────────┬───────────────┘
    ↓                 ↓
  ARIMA            Exponential
  (p,d,q)=(1,1,1)  Smoothing
                    α=0.3,β=0.1
    ↓                 ↓
└────────────┬───────────────┘
             ↓
  ┌──────────────────────┐
  │ Ensemble Averaging   │
  │ Confidence Intervals │
  │ Trend Analysis       │
  └──────────┬───────────┘
             ↓
  Forecast (h periods)
  with ±1.96σ bounds
```

### Predictive Models

**Loan Default Prediction**
- Factors: Payment History (25%), Delinquencies (30%), Utilization (15%), Income Stability (20%), Account Age (10%)
- Output: Default Probability (0-100%), Time-to-Default, Recommended Action
- Actions: MONITOR (<30%), INTERVENE (30-70%), ALERT_LENDER (>70%)

**User Churn Prediction**
- Factors: Activity Gap (40%), Account Age (20%), Engagement (20%), Support Issues (15%), Transaction Value (5%)
- Risk Levels: LOW (<30%), MEDIUM (30-60%), HIGH (>60%)
- Strategies: Standard Monitoring → Engagement Campaigns → Proactive Outreach

**Market Trend Forecasting**
- Forecasts: Price trajectory (30 days), Volatility index, Market direction
- Trend Classification: BULLISH, BEARISH based on forecast
- Confidence: Uncertainty bands for risk assessment

## 📊 ML Algorithm Details

### Enhanced Credit Score Calculation
```
Score = (PaymentHistory × 0.35) + 
        (UtilizationRate × 0.25) + 
        (AccountAge × 0.15) + 
        (ReputationScore × 0.15) + 
        (Diversification × 0.10) +
        (AIAdjustment × ±25)     ← NEW: AI-based adjustment

Grade Thresholds:
A+ : 800-1000 (Excellent)
A  : 750-799  (Very Good)
B+ : 700-749  (Good)
B  : 650-699  (Fair)
C+ : 600-649  (Acceptable)
C  : 550-599  (Poor)
D  : 500-549  (Very Poor)
F  : 0-499    (Critical)
```

### Advanced Fraud Detection Scoring
```
Risk Score = Σ(triggered_flags × weights)

Flags & Weights:
- Unusual Amount (>5x median): +25
- Velocity (>5 loans/24h): +30
- New Account (<30 days): +20
- Suspicious Pattern: +15
- Blacklist Match: +10
- Location Mismatch: +10
- Time Anomaly (3am-6am): +5
- Low Reputation (<40): +15

Total Risk Calibration:
< 30  → APPROVE (Green)
30-70 → REVIEW (Yellow)
> 70  → REJECT (Red)

Confidence: Based on model agreement & data completeness
```

### Risk Assessment Matrix
```
Default Probability = f(credit_score, payment_history, debt_ratio)
Liquidation Risk = current_collateral_value / loan_amount
Collateral Health = (collateral_value - loan_value) / loan_value

Risk Level Classification:
┌─────────────┬──────────────────┬────────────────┬─────────────────┐
│ Risk Level  │ Default Prob     │ Liquidation    │ Collateral      │
├─────────────┼──────────────────┼────────────────┼─────────────────┤
│ LOW         │ < 10%            │ > 150%         │ > 50%           │
│ MEDIUM      │ 10-25%           │ 120-150%       │ 20-50%          │
│ HIGH        │ 25-50%           │ 100-120%       │ 0-20%           │
│ CRITICAL    │ > 50%            │ < 100%         │ < 0% (unsafe)   │
└─────────────┴──────────────────┴────────────────┴─────────────────┘

Recommendations:
- LOW: Standard monitoring, eligible for premium rates
- MEDIUM: Enhanced monitoring, risk-adjusted rates
- HIGH: Strict monitoring, collateral increase required
- CRITICAL: Immediate intervention, potential liquidation
```

### Ensemble Model Confidence Calculation
```
Confidence = 100 - σ(predictions)

Where:
σ = standard deviation of all model predictions
High σ (disagreement) → Low confidence
Low σ (agreement) → High confidence

Confidence Interpretation:
> 90: Very High (1-5% error margin)
80-90: High (5-10% error margin)
70-80: Medium (10-15% error margin)
60-70: Low (15-20% error margin)
< 60: Very Low (>20% error margin, recommend REVIEW)
```

### Anomaly Detection Severity Levels
```
Score Range    Severity     Characteristics              Action
0-30           NORMAL       Standard patterns           ALLOW
30-70          SUSPICIOUS   Pattern deviation          REVIEW
70-100         CRITICAL     High-risk indicators       BLOCK

Reasons Generated For Each Anomaly:
- High transaction amount deviation
- Unusual activity timing
- New account with risky behavior
- Geographic location change
- Low reputation score
- Multiple delinquencies
- Unusual transaction frequency
- Device/IP inconsistencies
```

## 📊 ML Algorithm Details

### Original Fraud Detection Rules
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

### Original Risk Assessment
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
