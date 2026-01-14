# LYNQ ML Service

AI-powered credit risk assessment service for the LYNQ DeFi lending platform.

## Features

- Credit score prediction (0-1000)
- Fraud detection
- Anomaly detection
- Risk level classification
- SHAP-based explainability
- Rule-based fallback when ML models are unavailable

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Generate mock model for development (optional)
python scripts/generate_mock_model.py

# Run the service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Generating Mock Model

For local development, you can generate a mock ML model:

```bash
# Install ML dependencies first
pip install scikit-learn numpy pandas joblib

# Generate the model
python scripts/generate_mock_model.py
```

This will create:
- `models/credit_model.pkl` - Trained RandomForest model
- `models/scaler.pkl` - Feature scaler
- `models/feature_config.json` - Feature configuration

The service will automatically use these files if they exist, otherwise it falls back to rule-based scoring.

### Docker

```bash
docker build -t lynq-ml-service .
docker run -p 8000:8000 -e API_KEY=your-api-key lynq-ml-service
```

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### Credit Score Assessment
```bash
curl -X POST http://localhost:8000/api/ml/credit-score \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92",
    "wallet_age_days": 365,
    "total_transactions": 150,
    "total_volume_usd": 50000.0,
    "defi_interactions": 25,
    "loan_amount": 1000.0,
    "collateral_value_usd": 1500.0,
    "term_months": 3,
    "previous_loans": 2,
    "successful_repayments": 2,
    "defaults": 0,
    "reputation_score": 75
  }'
```

### Model Info
```bash
curl http://localhost:8000/model/info \
  -H "X-API-KEY: your-api-key"
```

## Response Example

```json
{
  "credit_score": 750,
  "fraud_score": 0.05,
  "anomaly_score": 0.1,
  "risk_level": "LOW",
  "default_probability": 0.08,
  "recommended_action": "APPROVE",
  "interest_rate_suggestion": 8.5,
  "max_loan_amount": 5000.0,
  "confidence_score": 0.92,
  "top_factors": [
    {"feature": "reputation_score", "impact": "positive", "value": 75, "contribution": 0.25}
  ],
  "model_version": "v1.0.0",
  "processing_time_ms": 45,
  "is_fallback": false
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MODEL_SOURCE | Model source: `local` or `s3` | `local` |
| LOCAL_MODEL_PATH | Path to local model file | `./models/credit_model.pkl` |
| S3_BUCKET | S3 bucket name | - |
| S3_KEY | S3 model key | - |
| AWS_REGION | AWS region | `us-east-1` |
| AWS_ACCESS_KEY_ID | AWS access key | - |
| AWS_SECRET_ACCESS_KEY | AWS secret key | - |
| API_KEY | API authentication key | `dev-api-key` |
| ENABLE_SHAP | Enable SHAP explanations | `true` |
| PRELOAD_MODEL | Load model on startup | `false` |
| HOST | Server host | `0.0.0.0` |
| PORT | Server port | `8000` |
| LOG_LEVEL | Logging level | `INFO` |
| DEBUG | Debug mode | `false` |

## AWS Deployment

### EC2 Free Tier Setup

1. Launch a t2.micro instance with Amazon Linux 2
2. Install Docker
3. Pull and run the container
4. Configure security group for port 8000

```bash
# On EC2 instance
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Pull and run
docker run -d -p 8000:8000 \
  -e API_KEY=your-api-key \
  -e MODEL_SOURCE=s3 \
  -e S3_BUCKET=your-bucket \
  lynq-ml-service
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api.py -v
```

## Model Loading

The service supports two model loading strategies:

1. **Lazy Loading** (default): Model loads on first request
   - Faster startup time
   - Better for AWS Free Tier
   - Set `PRELOAD_MODEL=false`

2. **Preload**: Model loads on startup
   - First request is faster
   - Higher memory usage
   - Set `PRELOAD_MODEL=true`

## Model Sources

### Local Filesystem
```env
MODEL_SOURCE=local
LOCAL_MODEL_PATH=./models/credit_model.pkl
```

### AWS S3
```env
MODEL_SOURCE=s3
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Risk Level Mapping

The service maps default probabilities to risk levels:

- `< 10%` → `VERY_LOW`
- `10-25%` → `LOW`
- `25-50%` → `MEDIUM`
- `50-75%` → `HIGH`
- `≥ 75%` → `VERY_HIGH`

## Recommended Actions

- `VERY_LOW` / `LOW` → `APPROVE`
- `MEDIUM` → `APPROVE_WITH_CONDITIONS`
- `HIGH` / `VERY_HIGH` → `MANUAL_REVIEW` or `REJECT`

## Troubleshooting

### Model Not Loading
- Check file paths and permissions
- Verify model file exists
- Check logs for specific errors
- Service will fall back to rule-based scoring

### SHAP Not Working
- Ensure SHAP is installed: `pip install shap`
- Check `ENABLE_SHAP=true` in environment
- Service falls back to rule-based explanations

### High Latency
- Use lazy loading for faster startup
- Consider model optimization
- Check AWS region for S3 access

## Production Deployment

### AWS EC2 Free Tier

1. Launch t2.micro instance
2. Install Docker
3. Build and push image to ECR (or use Docker Hub)
4. Run container with environment variables
5. Set up security group for port 8000
6. Configure load balancer (optional)

### Docker Compose

```yaml
ml-service:
  build: ./ml-service
  ports:
    - "8000:8000"
  environment:
    - MODEL_SOURCE=s3
    - S3_BUCKET=lynq-models
    - API_KEY=${ML_API_KEY}
  env_file:
    - .env
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
