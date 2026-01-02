# LYNQ Multi-Chain DeFi Lending Platform

A production-grade, multi-chain DeFi lending platform with **synthetic training data ML system**, ensemble credit scoring, fraud detection, and advanced risk assessment.

## ⭐ New Features

### 🤖 Production ML Service
- **Synthetic Data Generation**: 100K+ realistic borrower profiles with 50+ features
- **Ensemble Models**: XGBoost + LightGBM achieving **76.8% AUC-ROC**
- **Real-time API**: FastAPI service with <200ms inference latency
- **Model Explainability**: SHAP-based feature importance and explanations
- **Drift Detection**: Automated data/model drift monitoring
- **MLflow Integration**: Complete experiment tracking and model registry

### 📊 Performance Metrics
- **AUC-ROC**: 0.7683 (76.83%)
- **Precision**: 46.22%
- **Recall**: 65.80%
- **F1 Score**: 54.30%
- **Inference Latency**: <200ms (p95)
- **Throughput**: 50+ predictions/second

## 🏗️ Monorepo Structure

```
LYNQ/
├── apps/
│   ├── backend/          # NestJS API server with ML integration
│   └── web/
│       ├── frontend/     # Vite + React user app
│       └── admin/        # Next.js admin dashboard
├── packages/
│   ├── blockchain-adapter/  # Multi-chain abstraction layer
│   └── ml-service/       # 🆕 Python ML service (FastAPI)
│       ├── src/
│       │   ├── data/            # Synthetic data generation
│       │   ├── features/        # Feature engineering (75+ features)
│       │   ├── training/        # Model training & hyperparameter tuning
│       │   ├── evaluation/      # Model validation & metrics
│       │   ├── api/             # FastAPI endpoints
│       │   ├── monitoring/      # Drift detection & performance tracking
│       │   └── utils/           # Configuration & logging
│       ├── models/              # Trained model artifacts
│       ├── data/                # Training datasets
│       └── tests/               # Unit tests
├── contracts/
│   └── evm/             # Ethereum/EVM smart contracts
└── deployments/         # Docker & Kubernetes configs
```

## 🚀 Features

### Backend Modules
> [!NOTE]
> **Backend Status:** The backend services are currently in active development. The Indexer module uses a polling mechanism for simplicity. Advanced ML features are integrated but may require partial mocking for local testing without full data pipelines.


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

#### 🤖 ML Service (`packages/ml-service`) ⭐ **NEW**

**Production ML Pipeline**
- **Synthetic Data Generation**:
  - Statistical synthesis with realistic distributions
  - GAN-based profile generation
  - 100K+ borrower profiles with 50+ features
  - Configurable default rates (target: 15%)
  - Demographic, financial, and on-chain features

- **Feature Engineering** (75+ features):
  - Borrower profiles: age, income, employment, credit history
  - On-chain metrics: wallet age, DeFi experience, transaction patterns
  - Behavioral indicators: gas spending, smart contract interactions
  - Risk factors: LTV ratio, debt-to-income, portfolio volatility
  - Interaction terms and polynomial features

- **Ensemble Models**:
  - **XGBoost Classifier** (60% weight): 500 estimators, depth 7
  - **LightGBM Classifier** (40% weight): 500 estimators, 31 leaves
  - SMOTE for class imbalance handling
  - Cross-validation with stratified k-fold

- **Model Performance**:
  - AUC-ROC: **0.7683** (76.83%)
  - Precision: 46.22%, Recall: 65.80%, F1: 54.30%
  - Top features: risk_score, wallet_age_days, defi_experience_level

- **Real-time API** (FastAPI):
  - `/api/ml/credit-score`: Individual credit assessment
  - `/api/ml/batch-score`: Batch predictions
  - `/api/ml/model/info`: Model metadata
  - `/api/ml/health`: Service health check
  - Response time: <200ms (p95)

- **Model Explainability**:
  - SHAP feature importance
  - Confidence intervals (95%)
  - Human-readable explanations
  - Risk level classification: VERY_LOW → VERY_HIGH
  - Recommended actions: APPROVE, MANUAL_REVIEW, DECLINE

- **Monitoring & Drift Detection**:
  - Real-time data drift detection (KS test)
  - Model performance tracking
  - Automated alerting for degradation
  - Quarterly retraining schedule
  - Performance benchmarks tracking

- **MLflow Integration**:
  - Experiment tracking
  - Model versioning
  - Artifact storage
  - Hyperparameter logging

**Backend ML Module** (`apps/backend/src/modules/ml`)
- **MLServiceClient**: HTTP client for ML service integration
- **MLService**: Risk assessment orchestration with fallback
- **MLController**: REST endpoints for frontend
- Automatic fallback to rule-based scoring if ML unavailable
- Environment-based configuration

#### 🎯 Risk Scoring Module (`apps/backend/src/modules/risk-scoring`)

**Credit Scoring Service**
- 5-factor weighted algorithm:
  - Payment History (35%): On-time payment ratio
  - Utilization Rate (25%): Debt-to-limit ratio
  - Account Age (15%): Platform history
  - Reputation Score (15%): Platform standing
  - Diversification (10%): Asset variety
- Credit grades: A+ (800+) to F (<500)
- Integration with ML service for enhanced predictions

**Fraud Detection Service**
- Pattern analysis checks:
  - Unusual loan amounts (>5x median)
  - Velocity anomalies (>5 loans in 24h)
  - New account risk (<30 days)
  - Suspicious patterns (rapid borrow/repay cycles)
  - Blacklist validation
- Recommendations: APPROVE, REVIEW, REJECT

**Risk Assessment Service**
- Default probability from ML model
- Liquidation risk monitoring (120% threshold)
- Collateral health tracking
- Risk levels: LOW, MEDIUM, HIGH, CRITICAL

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
- **ML Integration**: Axios HTTP client for ML service

### ML Service 🆕
- **Framework**: FastAPI (Python 3.11+)
- **ML Libraries**: 
  - XGBoost 2.0.3, LightGBM 4.3.0
  - scikit-learn 1.4.0, Optuna 3.5.0
  - SHAP 0.44.1, imbalanced-learn
- **Data Processing**: Pandas, NumPy, Polars
- **Synthetic Data**: Faker, SDV, CTGAN
- **Tracking**: MLflow 3.8.1
- **Cache**: Redis 7.0
- **Testing**: pytest, pytest-cov

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
- **Networks**: Ethereum, Polygon, BSC, Mantle Sepolia

### Infrastructure
- **Containerization**: Docker multi-stage builds
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monorepo**: Turborepo + pnpm workspaces
- **Monitoring**: Prometheus + Grafana (planned)
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
python >= 3.11.0
docker >= 24.0.0
postgresql >= 16.0.0
redis >= 7.0.0 (optional, for ML caching)
```

### Quick Start (Full Stack)

#### 1. **Using Docker Compose** (Recommended)
```bash
# Clone repository
git clone https://github.com/Sagexd08/LYNQ.git
cd LYNQ

# Start all services (Backend + ML Service + Database + Redis)
docker-compose up -d

# Check service health
curl http://localhost:3000/health
curl http://localhost:8001/api/ml/health

# View logs
docker-compose logs -f
```

Services will be available at:
- Backend API: http://localhost:3000
- ML Service: http://localhost:8001
- MLflow UI: http://localhost:5000
- Swagger Docs: http://localhost:3000/api

#### 2. **Manual Installation**

**A. Backend Setup**
```bash
# Install dependencies
pnpm install

# Setup environment
cd apps/backend
cp .env.example .env
# Edit .env with your database credentials and ML_SERVICE_URL

# Run database migrations
pnpm migration:run

# Start backend
pnpm dev
```

**B. ML Service Setup**
```bash
cd packages/ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env

# Generate synthetic training data
python src/data/synthetic_generator.py \
  --samples 100000 \
  --output data/synthetic_loans.csv \
  --default-rate 0.15

# Train model
python src/training/train_model.py \
  --data data/synthetic_loans.csv \
  --output models/production

# Start ML service
uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload
```

**C. Start Frontend** (Optional)
```bash
cd apps/web/frontend
pnpm dev
# Frontend at http://localhost:3001
```

### Development Workflow

**Backend Development**
```bash
cd apps/backend
pnpm dev              # Start dev server
pnpm test             # Run tests
pnpm test:e2e         # Run e2e tests
pnpm build            # Build for production
```

**ML Service Development**
```bash
cd packages/ml-service

# Run tests
pytest tests/ -v --cov=src

# Generate new training data
python src/data/synthetic_generator.py --samples 10000

# Retrain model
python src/training/train_model.py --data data/synthetic_loans.csv

# Hyperparameter tuning
python src/training/hyperparameter_tuning.py --data data/synthetic_loans.csv --trials 100

# Start API
uvicorn src.api.main:app --reload
```

**Frontend Development**
```bash
cd apps/web/frontend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run linter
```
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
pnpm run dev:apps

# Or individually via workspace filters
pnpm --filter @lynq/backend dev   # Port 3000 (API)
pnpm --filter @lynq/frontend dev  # Port 3001 (Vite frontend)
pnpm --filter @lynq/admin dev     # Port 3002 (Next admin)
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

### ML Services 🆕

**Backend Integration** (http://localhost:3000/ml)
```
GET  /ml/status              - Get ML service health status
POST /ml/assess-risk         - Comprehensive risk assessment
```

**ML Service API** (http://localhost:8001/api/ml)
```
POST /credit-score           - Get credit score prediction
  Request: { applicant_id, loan_amount, loan_term_months, collateral_amount, collateral_type }
  Response: { credit_score, default_probability, risk_level, recommended_action, 
              interest_rate, confidence_interval, feature_importance, explanation }

POST /batch-score            - Batch credit predictions
  Request: { applicant_ids[], processing_mode }
  Response: { results[], total_processed }

GET  /model/info             - Get model metadata
  Response: { model_version, trained_date, feature_count, training_samples, auc_roc }

GET  /health                 - Health check
  Response: { status, model_loaded, timestamp }
```

**Example Request**
```bash
curl -X POST http://localhost:8001/api/ml/credit-score \
  -H "Content-Type: application/json" \
  -d '{
    "applicant_id": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "loan_amount": 50000,
    "loan_term_months": 12,
    "collateral_amount": 75000,
    "collateral_type": "USDC"
  }'
```

**Example Response**
```json
{
  "credit_score": 720,
  "default_probability": 0.08,
  "risk_level": "MEDIUM",
  "recommended_action": "APPROVE",
  "interest_rate": 8.5,
  "confidence_interval": {
    "lower": 0.06,
    "upper": 0.10
  },
  "feature_importance": {
    "risk_score": 14.47,
    "wallet_age_days": 7.61,
    "defi_experience_level": 6.01
  },
  "explanation": "Good credit history and low volatility portfolio...",
  "model_version": "v1.0.0",
  "inference_time_ms": 145
}
```
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
# apps/web/frontend (Vite)
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=LYNQ
VITE_APP_VERSION=dev
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false

# apps/web/admin (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
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
