# Models Directory

This directory is for ML model artifacts.

## Local Development

For development, the service uses rule-based fallback scoring.

## Production

In production, models can be loaded from:
- Local filesystem (MODEL_SOURCE=local)
- AWS S3 (MODEL_SOURCE=s3)

## Model Files

- `credit_model.pkl` - Main credit scoring model
- `scaler.pkl` - Feature scaler
- `feature_config.json` - Feature configuration

## Training New Models

See the ML training documentation for instructions on:
1. Generating synthetic training data
2. Training classification models
3. Evaluating model performance
4. Deploying to production
