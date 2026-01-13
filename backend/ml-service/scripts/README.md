# LYNQ ML Model Training Scripts

This directory contains scripts for training and deploying ML models for the LYNQ credit risk assessment service.

## Scripts

### `train_model.py`

Generates a synthetic dataset and trains an XGBoost credit risk prediction model.

**Features:**
- Generates 100,000 synthetic samples with realistic DeFi lending patterns
- Trains XGBoost classifier with imbalanced data handling
- Evaluates model performance with comprehensive metrics
- Saves model artifacts in AWS-compatible format

**Usage:**
```bash
cd backend/ml-service
python scripts/train_model.py
```

**Output:**
- `models/lynq_risk_dataset.csv` - Generated training dataset
- `models/credit_model.pkl` - Trained XGBoost model
- `models/scaler.pkl` - Feature scaler (StandardScaler)
- `models/feature_config.json` - Feature configuration and metadata

**Model Features:**
The model uses 12 features matching the inference service API:
1. `wallet_age_days` - Age of wallet in days
2. `total_transactions` - Total wallet transactions
3. `total_volume_usd` - Total transaction volume in USD
4. `defi_interactions` - Number of DeFi protocol interactions
5. `loan_amount` - Requested loan amount
6. `collateral_value_usd` - Total collateral value
7. `term_months` - Loan term in months
8. `previous_loans` - Number of previous loans
9. `successful_repayments` - Number of successful repayments
10. `defaults` - Number of defaults
11. `reputation_score` - Current reputation score (0-100)
12. `collateral_ratio` - Collateral value / loan amount

### `upload_to_s3.py`

Uploads trained model artifacts to AWS S3 for deployment.

**Usage:**
```bash
# Basic usage (uses environment variables for AWS credentials)
python scripts/upload_to_s3.py --bucket your-bucket-name

# With custom key prefix
python scripts/upload_to_s3.py --bucket your-bucket-name --key-prefix models/credit_model_v1

# With explicit AWS credentials
python scripts/upload_to_s3.py \
  --bucket your-bucket-name \
  --region us-east-1 \
  --access-key YOUR_ACCESS_KEY \
  --secret-key YOUR_SECRET_KEY
```

**Required Environment Variables:**
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (defaults to us-east-1)

**Uploaded Files:**
- `{key_prefix}.pkl` - Model file
- `{key_prefix}_scaler.pkl` - Scaler file
- `{key_prefix}_config.json` - Configuration file

## Complete Workflow

### 1. Train the Model

```bash
cd backend/ml-service
python scripts/train_model.py
```

This will:
- Generate synthetic dataset
- Train XGBoost model
- Evaluate performance
- Save all artifacts to `models/` directory

### 2. Review Model Performance

Check the training output for metrics:
- Accuracy
- Precision/Recall
- F1 Score
- ROC-AUC
- Confusion Matrix

### 3. Upload to AWS S3

```bash
# Set AWS credentials (if not already set)
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1

# Upload model
python scripts/upload_to_s3.py --bucket lynq-models --key-prefix models/credit_model_v1
```

### 4. Configure ML Service

Update your `.env` file or environment variables:

```env
MODEL_SOURCE=s3
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### 5. Deploy and Test

The ML service will automatically download and load the model from S3 on startup (or first request if lazy loading is enabled).

## Dataset Generation Details

The synthetic dataset is generated using realistic distributions:

- **Wallet Age**: Gamma distribution (older wallets = lower risk)
- **Income**: Log-normal distribution (simulating stablecoin inflows)
- **DTI Ratio**: Beta distribution (debt-to-income ratio)
- **Utilization Rate**: Uniform distribution (collateral usage)
- **Transaction Velocity**: Poisson distribution (activity patterns)
- **Protocol Loyalty**: Exponential distribution (governance participation)

The target variable (`default_event`) is generated using a weighted risk score based on:
- DTI ratio (30%)
- Utilization rate (25%)
- Wallet age (15%)
- Liquidation risk (20%)
- Transaction velocity anomalies (10%)

The dataset maintains an ~8% default rate (matching Home Credit dataset imbalance).

## Model Architecture

- **Algorithm**: XGBoost Classifier
- **Hyperparameters**:
  - n_estimators: 200
  - max_depth: 6
  - learning_rate: 0.1
  - scale_pos_weight: Auto-calculated for imbalanced data
- **Preprocessing**: StandardScaler for feature normalization
- **Evaluation**: Train/Val/Test split (70/15/15)

## Troubleshooting

### Model Training Fails
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version (3.8+ required)
- Verify sufficient disk space for dataset generation

### S3 Upload Fails
- Verify AWS credentials are correct
- Check bucket exists and you have write permissions
- Ensure bucket is in the specified region
- Check network connectivity

### Model Not Loading in Service
- Verify S3_KEY matches the uploaded model file name
- Check AWS credentials in service environment
- Review service logs for specific error messages
- Ensure model file format is correct (.pkl)

## Next Steps

After training and uploading:
1. Monitor model performance in production
2. Collect real-world data for retraining
3. Implement model versioning strategy
4. Set up automated retraining pipeline
5. Add A/B testing for model improvements
