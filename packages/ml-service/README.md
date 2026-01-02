# LYNQ ML Service

Machine Learning service for credit scoring using synthetic training data generation.

## Features

- 🤖 Synthetic data generation using GANs and statistical methods
- 📊 Advanced feature engineering for DeFi credit scoring
- 🎯 Ensemble models (XGBoost + LightGBM)
- 📈 Model explainability with SHAP values
- 🚀 FastAPI service for real-time predictions
- 📊 MLflow integration for experiment tracking
- 🔄 Automated retraining pipelines

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
```

## Quick Start

### 1. Generate Synthetic Training Data

```bash
python src/data/synthetic_generator.py --samples 100000 --output data/synthetic_loans.csv
```

### 2. Train Models

```bash
python src/training/train_model.py --data data/synthetic_loans.csv --output models/
```

### 3. Start API Service

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Make Predictions

```bash
curl -X POST http://localhost:8001/api/ml/credit-score \
  -H "Content-Type: application/json" \
  -d '{
    "applicant_id": "0x123...",
    "loan_amount": 50000,
    "loan_term_months": 12,
    "collateral_amount": 75000,
    "collateral_type": "USDC"
  }'
```

## Project Structure

```
ml-service/
├── src/
│   ├── data/
│   │   ├── synthetic_generator.py    # Synthetic data generation
│   │   ├── data_loader.py            # Data loading utilities
│   │   └── validators.py             # Data validation
│   ├── features/
│   │   ├── engineering.py            # Feature engineering
│   │   ├── transformers.py           # Custom transformers
│   │   └── selection.py              # Feature selection
│   ├── models/
│   │   ├── xgboost_model.py          # XGBoost implementation
│   │   ├── lightgbm_model.py         # LightGBM implementation
│   │   ├── ensemble.py               # Ensemble methods
│   │   └── base_model.py             # Base model class
│   ├── training/
│   │   ├── train_model.py            # Training pipeline
│   │   ├── hyperparameter_tuning.py  # Optuna optimization
│   │   └── cross_validation.py       # CV strategies
│   ├── evaluation/
│   │   ├── metrics.py                # Evaluation metrics
│   │   ├── explainability.py         # SHAP/LIME
│   │   └── validation.py             # Model validation
│   ├── api/
│   │   ├── main.py                   # FastAPI app
│   │   ├── routes.py                 # API routes
│   │   ├── schemas.py                # Pydantic schemas
│   │   └── dependencies.py           # API dependencies
│   ├── monitoring/
│   │   ├── drift_detection.py        # Data/model drift
│   │   ├── performance_tracker.py    # Performance monitoring
│   │   └── alerts.py                 # Alert system
│   └── utils/
│       ├── config.py                 # Configuration
│       ├── logger.py                 # Logging setup
│       └── database.py               # Database connections
├── tests/
├── notebooks/
├── models/
├── data/
└── requirements.txt
```

## API Endpoints

- `POST /api/ml/credit-score` - Get credit score prediction
- `POST /api/ml/batch-score` - Batch predictions
- `GET /api/ml/model/info` - Model information
- `GET /api/ml/health` - Health check
- `GET /api/ml/metrics` - Model metrics

## Model Performance

Current production model metrics:
- AUC-ROC: 0.87
- Precision@90% Recall: 0.91
- Inference Latency: <200ms (p95)

## Development

```bash
# Run tests
pytest tests/ -v --cov=src

# Format code
black src/ tests/

# Lint code
flake8 src/ tests/

# Type checking
mypy src/
```

## Deployment

See [deployment/README.md](deployment/README.md) for production deployment instructions.

## License

MIT
