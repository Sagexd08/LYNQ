# ML Service - Deployment Guide

## Prerequisites

- Python 3.11+
- PostgreSQL (for storing loan data)
- Redis (for caching)
- MLflow (for experiment tracking)

## Setup Instructions

### 1. Install Dependencies

```bash
cd packages/ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Generate Synthetic Training Data

```bash
# Generate 100,000 synthetic borrower profiles
python src/data/synthetic_generator.py \
  --samples 100000 \
  --output data/synthetic_loans.csv \
  --default-rate 0.15
```

**Output:** `data/synthetic_loans.csv` (100K samples, ~50MB)

### 4. Train Models

```bash
# Train ensemble model (XGBoost + LightGBM)
python src/training/train_model.py \
  --data data/synthetic_loans.csv \
  --output models/production
```

**Training time:** ~15-30 minutes on modern CPU  
**Output:** Model artifacts in `models/production/`

### 5. Start API Service

```bash
# Development mode
uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload

# Production mode
uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --workers 4
```

**API available at:** http://localhost:8001

### 6. Test API

```bash
# Health check
curl http://localhost:8001/api/ml/health

# Get model info
curl http://localhost:8001/api/ml/model/info

# Predict credit score
curl -X POST http://localhost:8001/api/ml/credit-score \
  -H "Content-Type: application/json" \
  -d '{
    "applicant_id": "0x123abc...",
    "loan_amount": 50000,
    "loan_term_months": 12,
    "collateral_amount": 75000,
    "collateral_type": "USDC"
  }'
```

## Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

```bash
# Build and run
docker build -t lynq-ml-service .
docker run -p 8001:8001 --env-file .env lynq-ml-service
```

## Integration with Backend

Add ML service endpoint to backend configuration:

```typescript
// apps/backend/src/config/ml.config.ts
export const mlConfig = {
  serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  timeout: 5000,
  retries: 3
};
```

## Monitoring

### MLflow Dashboard

```bash
mlflow ui --host 0.0.0.0 --port 5000
```

Access at: http://localhost:5000

### Performance Monitoring

```python
from src.monitoring.performance_tracker import PerformanceTracker

tracker = PerformanceTracker()
tracker.record_prediction(prediction=0.08, actual=0, latency_ms=145)
print(tracker.get_summary_report())
```

## Retraining Pipeline

Schedule quarterly retraining:

```bash
# Cron job (every 3 months)
0 0 1 */3 * cd /path/to/ml-service && python src/training/train_model.py --data data/latest_loans.csv --output models/production
```

## Troubleshooting

**Issue: Model loading fails**
```bash
# Check model directory exists
ls models/production/
# Should contain: ensemble_model.pkl, xgb_model.pkl, lgb_model.pkl, etc.
```

**Issue: Low memory**
```bash
# Reduce synthetic data size
python src/data/synthetic_generator.py --samples 10000
```

**Issue: Slow predictions**
```bash
# Enable Redis caching
# Check Redis connection: redis-cli ping
```

## Performance Benchmarks

- **Data Generation:** 100K samples in ~30 seconds
- **Model Training:** 100K samples in ~20 minutes
- **Inference Latency:** <200ms (p95)
- **Throughput:** ~50 predictions/second (single worker)

## Production Checklist

- [ ] Environment variables configured
- [ ] Models trained and validated (AUC > 0.85)
- [ ] API endpoints tested
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Backup strategy for models
- [ ] Retraining schedule defined
- [ ] Integration tests passed
