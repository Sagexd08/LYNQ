# LYNQ ML Service - Complete Machine Learning System

## 🎯 Overview

Production-ready ML service for credit scoring using synthetic training data generation and ensemble models.

## ✨ Features

- **Synthetic Data Generation**: 100K+ realistic borrower profiles
- **Ensemble Models**: XGBoost + LightGBM with 76.8% AUC-ROC
- **Real-time API**: <500ms inference latency
- **Model Explainability**: SHAP-based feature importance
- **Data Drift Detection**: Automated monitoring and alerts
- **MLflow Integration**: Complete experiment tracking

## 📊 Model Performance

- **AUC-ROC**: 0.7683 (76.83%)
- **Precision**: 0.4622 (46.22%)
- **Recall**: 0.6580 (65.80%)
- **F1 Score**: 0.5430 (54.30%)
- **Inference**: <200ms (p95)

## 🚀 Quick Start

### 1. Local Development

```bash
cd packages/ml-service

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data
python src/data/synthetic_generator.py --samples 100000 --output data/synthetic_loans.csv

# Train model
python src/training/train_model.py --data data/synthetic_loans.csv --output models/production

# Start API server
uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Docker Deployment

```bash
# Build and run ML service
docker-compose up ml-service

# API available at http://localhost:8001
```

### 3. Full Stack (Backend + ML Service)

```bash
# Start all services
docker-compose up

# Backend: http://localhost:3000
# ML Service: http://localhost:8001
# MLflow: http://localhost:5000
```

## 📡 API Usage

### Credit Score Prediction

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

**Response:**
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

### Model Health Check

```bash
curl http://localhost:8001/api/ml/health
```

### Backend Integration

```bash
# From NestJS backend
curl -X POST http://localhost:3000/ml/assess-risk \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "loanAmount": "50000",
    "loanTermMonths": 12,
    "collateralAmount": "75000",
    "collateralType": "USDC"
  }'
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   LYNQ System Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Frontend   │────────→│   Backend    │                  │
│  │   (Next.js)  │         │   (NestJS)   │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                          │
│                                   ↓                          │
│                          ┌─────────────────┐                 │
│                          │   ML Service    │                 │
│                          │   (FastAPI)     │                 │
│                          │                 │                 │
│                          │  • Credit Score │                 │
│                          │  • Risk Level   │                 │
│                          │  • Explainability│                │
│                          └─────────────────┘                 │
│                                   │                          │
│               ┌───────────────────┼───────────────┐          │
│               ↓                   ↓               ↓          │
│         ┌──────────┐        ┌─────────┐    ┌─────────┐      │
│         │PostgreSQL│        │  Redis  │    │ MLflow  │      │
│         └──────────┘        └─────────┘    └─────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
packages/ml-service/
├── src/
│   ├── data/
│   │   └── synthetic_generator.py      # Synthetic data generation
│   ├── features/
│   │   └── engineering.py              # Feature engineering
│   ├── training/
│   │   ├── train_model.py              # Model training pipeline
│   │   └── hyperparameter_tuning.py    # Optuna optimization
│   ├── evaluation/
│   │   └── metrics.py                  # Model evaluation
│   ├── api/
│   │   └── main.py                     # FastAPI service
│   ├── monitoring/
│   │   ├── drift_detection.py          # Data/model drift
│   │   └── performance_tracker.py      # Performance monitoring
│   └── utils/
│       ├── config.py                   # Configuration
│       └── logger.py                   # Logging
├── models/
│   └── production/                     # Trained models
├── data/                               # Training data
├── tests/                              # Unit tests
├── requirements.txt                    # Python dependencies
├── Dockerfile                          # Docker configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

```bash
# ML Service (.env in packages/ml-service)
DATABASE_URL=postgresql://user:password@localhost:5432/lynq
REDIS_URL=redis://localhost:6379/0
MLFLOW_TRACKING_URI=http://localhost:5000
MODEL_VERSION=v1.0.0
MODEL_PATH=./models/production
API_PORT=8001
LOG_LEVEL=INFO
```

### Backend Integration (.env in apps/backend)

```bash
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_ENABLED=true
```

## 🔬 Development

### Generate More Training Data

```bash
python src/data/synthetic_generator.py \
  --samples 100000 \
  --output data/synthetic_loans.csv \
  --default-rate 0.15 \
  --seed 42
```

### Train New Model

```bash
python src/training/train_model.py \
  --data data/synthetic_loans.csv \
  --output models/production
```

### Hyperparameter Tuning

```bash
python src/training/hyperparameter_tuning.py \
  --data data/synthetic_loans.csv \
  --trials 100
```

### Run Tests

```bash
pytest tests/ -v --cov=src
```

## 📊 Monitoring

### View MLflow Dashboard

```bash
mlflow ui --host 0.0.0.0 --port 5000
# Open http://localhost:5000
```

### Check Model Drift

```python
from src.monitoring.drift_detection import DriftDetector

detector = DriftDetector(reference_data=train_data)
drift_results = detector.detect_numerical_drift(new_data)
```

### Performance Metrics

```python
from src.monitoring.performance_tracker import PerformanceTracker

tracker = PerformanceTracker()
tracker.record_prediction(prediction=0.08, actual=0, latency_ms=145)
print(tracker.get_summary_report())
```

## 🚢 Production Deployment

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Deploy Steps

1. **Build Services**
   ```bash
   docker-compose build
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Check Health**
   ```bash
   curl http://localhost:8001/api/ml/health
   curl http://localhost:3000/ml/status
   ```

4. **View Logs**
   ```bash
   docker-compose logs -f ml-service
   ```

## 🔄 Model Retraining

### Automated Schedule

Add to crontab for quarterly retraining:

```bash
0 0 1 */3 * cd /path/to/ml-service && python src/training/train_model.py --data data/latest_loans.csv --output models/production
```

### Manual Retraining

```bash
# 1. Collect new data
python scripts/collect_loan_data.py --output data/new_loans.csv

# 2. Retrain model
python src/training/train_model.py --data data/new_loans.csv --output models/production

# 3. Restart service
docker-compose restart ml-service
```

## 📈 Performance Optimization

- **Caching**: Redis for prediction caching (24h TTL)
- **Batching**: Batch predictions for high throughput
- **Workers**: Multiple uvicorn workers for concurrency
- **Model Quantization**: Optional for faster inference

## 🤝 Integration Examples

### From NestJS Backend

```typescript
// apps/backend/src/modules/ml/ml.service.ts
const riskAssessment = await this.mlService.assessCreditRisk({
  userId: '0x742d35Cc...',
  loanAmount: '50000',
  loanTermMonths: 12,
  collateralAmount: '75000',
  collateralType: 'USDC'
});
```

### From Python

```python
import requests

response = requests.post(
    'http://localhost:8001/api/ml/credit-score',
    json={
        'applicant_id': '0x742d35Cc...',
        'loan_amount': 50000,
        'loan_term_months': 12,
        'collateral_amount': 75000,
        'collateral_type': 'USDC'
    }
)

result = response.json()
print(f"Credit Score: {result['credit_score']}")
print(f"Risk Level: {result['risk_level']}")
```

## 📝 License

MIT

## 👥 Team

LYNQ ML Engineering Team

---

**Version**: 1.0.0  
**Last Updated**: January 3, 2026
