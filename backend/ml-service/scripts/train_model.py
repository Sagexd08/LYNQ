"""
LYNQ ML Model Training Script
Generates synthetic dataset and trains a credit risk prediction model
"""

import pandas as pd
import numpy as np
import random
import os
import json
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)
import xgboost as xgb


NUM_SAMPLES = 100000
DEFAULT_RATE = 0.08
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATASET_FILE = os.path.join(OUTPUT_DIR, "lynq_risk_dataset.csv")
MODEL_FILE = os.path.join(OUTPUT_DIR, "credit_model.pkl")
SCALER_FILE = os.path.join(OUTPUT_DIR, "scaler.pkl")
CONFIG_FILE = os.path.join(OUTPUT_DIR, "feature_config.json")


np.random.seed(42)
random.seed(42)


def generate_lynq_dataset(n_rows):
    """Generate synthetic LYNQ risk dataset"""
    data = {
        # --- IDENTITY & FINANCIAL PROXIES (Home Credit / LendingClub) ---
        
        # Wallet Age: Older wallets tend to be lower risk 
        'wallet_age_days': np.random.gamma(shape=2.0, scale=500, size=n_rows).astype(int),
        
        # Stablecoin Inflow: Log-normal distribution to simulate income 
        'est_monthly_income_stable': np.random.lognormal(mean=8.5, sigma=1.0, size=n_rows),
        
        # DTI (Debt-to-Income): Higher is riskier 
        'dti_ratio_cross_chain': np.random.beta(a=2, b=5, size=n_rows) * 100,
        
        # --- BEHAVIORAL METRICS (Aave / Compound) ---
        
        # Protocol Loyalty: Days staking in governance contracts
        'protocol_loyalty_score': np.random.exponential(scale=200, size=n_rows),
        
        # Utilization Rate: % of collateral used. Spikes near 80-90% indicate stress 
        'utilization_rate': np.random.uniform(0.1, 0.95, size=n_rows),
        
        # --- FORENSIC & FRAUD (Ethereum / Elliptic) ---
        
        # Transaction Velocity: Burst activity suggests bots/fraud 
        'txn_velocity_24h': np.random.poisson(lam=5, size=n_rows),
        
        # Gas Price Z-Score: High values indicate desperation or front-running 
        'gas_price_z_score': np.random.normal(0, 1, size=n_rows),
        
        # Contract Interaction: Higher count = higher DeFi literacy = lower risk
        'unique_interacted_contracts': np.random.poisson(lam=15, size=n_rows),
        
        # --- MACRO & SOLVENCY (MakerDAO / Market Sentiment) ---
        
        # GBM Liquidation Risk: Probability derived from MakerDAO models 
        'liquidation_risk_gbm': np.random.beta(a=1, b=10, size=n_rows),
        
        # Market Volatility: External factor 
        'market_volatility_index': np.random.normal(50, 15, size=n_rows)
    }
    
    df = pd.DataFrame(data)
    
    # --- TARGET GENERATION (Logic-based) ---
    # We create a synthetic target based on the features to ensure the model can actually learn something.
    # Logic: High DTI + High Utilization + Low Wallet Age + High Volatility = High Risk
    
    risk_score = (
        (df['dti_ratio_cross_chain'] / 100) * 0.3 + 
        (df['utilization_rate']) * 0.25 + 
        (1 / (df['wallet_age_days'] + 1)) * 1000 * 0.15 +
        (df['liquidation_risk_gbm']) * 0.2 + 
        (df['txn_velocity_24h'] > 20).astype(int) * 0.1 # Penalty for bot-like behavior
    )
    
    # Normalize risk score
    risk_score = (risk_score - risk_score.min()) / (risk_score.max() - risk_score.min())
    
    # Assign target based on weighted probability (Default = 1)
    # We want top 8% risky users to default 
    threshold = np.percentile(risk_score, 100 * (1 - DEFAULT_RATE))
    df['default_event'] = (risk_score > threshold).astype(int)
    
    # Add some noise to make it realistic (perfect separation is unrealistic)
    noise_indices = np.random.choice(df.index, size=int(n_rows * 0.05), replace=False)
    df.loc[noise_indices, 'default_event'] = 1 - df.loc[noise_indices, 'default_event']
    
    return df


def prepare_features(df):
    """
    Prepare features for training.
    Maps dataset features to model features and creates derived features.
    """
    # Create derived features that match the inference service expectations
    features_df = pd.DataFrame()
    
    # Direct mappings
    features_df['wallet_age_days'] = df['wallet_age_days']
    
    # Map income to total_volume_usd (proxy)
    features_df['total_volume_usd'] = df['est_monthly_income_stable'] * 12 * np.random.uniform(0.8, 1.2, len(df))
    
    # Map contract interactions
    features_df['defi_interactions'] = df['unique_interacted_contracts']
    
    # Map transaction velocity to total_transactions (proxy)
    features_df['total_transactions'] = (df['txn_velocity_24h'] * 30).astype(int) + np.random.poisson(lam=50, size=len(df))
    
    # Derived features
    features_df['loan_amount'] = df['est_monthly_income_stable'] * np.random.uniform(0.5, 3.0, len(df))
    features_df['collateral_value_usd'] = features_df['loan_amount'] * (1 + df['utilization_rate'] * 0.5)
    features_df['term_months'] = np.random.choice([1, 3, 6, 12], size=len(df), p=[0.2, 0.3, 0.3, 0.2])
    
    # Historical loan features (simulated)
    features_df['previous_loans'] = np.random.poisson(lam=2, size=len(df))
    features_df['successful_repayments'] = features_df['previous_loans'] * (1 - df['default_event'] * np.random.uniform(0.3, 0.7, len(df)))
    features_df['successful_repayments'] = features_df['successful_repayments'].astype(int)
    features_df['defaults'] = (features_df['previous_loans'] - features_df['successful_repayments']).clip(lower=0)
    
    # Reputation score (inverse of risk)
    features_df['reputation_score'] = (1 - df['default_event']) * np.random.uniform(60, 100, len(df)) + \
                                      df['default_event'] * np.random.uniform(20, 60, len(df))
    
    return features_df


def train_model(X_train, y_train, X_val, y_val):
    """Train XGBoost model with hyperparameter tuning"""
    print("\nTraining XGBoost model...")
    

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=len(y_train[y_train == 0]) / len(y_train[y_train == 1]),
        random_state=42,
        eval_metric='logloss'
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    return model


def evaluate_model(model, X_test, y_test, scaler):
    """Evaluate model performance"""
    print("\n" + "="*60)
    print("MODEL EVALUATION")
    print("="*60)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"\nAccuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['No Default', 'Default']))
    
    return {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'roc_auc': float(roc_auc)
    }


def save_model_artifacts(model, scaler, feature_names, metrics, version="v1.0.0"):
    """Save model, scaler, and configuration files"""

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    

    print(f"\nSaving model to {MODEL_FILE}...")
    joblib.dump(model, MODEL_FILE)
    

    print(f"Saving scaler to {SCALER_FILE}...")
    joblib.dump(scaler, SCALER_FILE)
    

    config = {
        "features": feature_names,
        "version": version,
        "created_at": datetime.now().isoformat(),
        "description": "LYNQ Credit Risk Prediction Model - Trained on synthetic DeFi lending data",
        "metrics": metrics,
        "model_type": "XGBoost",
        "default_rate": DEFAULT_RATE,
        "num_samples": NUM_SAMPLES
    }
    

    print(f"Saving config to {CONFIG_FILE}...")
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    
    print("\n[OK] Model artifacts saved successfully!")
    print(f"   Model: {MODEL_FILE}")
    print(f"   Scaler: {SCALER_FILE}")
    print(f"   Config: {CONFIG_FILE}")


def main():
    """Main training pipeline"""
    print("="*60)
    print("LYNQ ML MODEL TRAINING")
    print("="*60)
    
    # Step 1: Generate dataset
    print(f"\n[1/5] Generating {NUM_SAMPLES} rows of synthetic LYNQ risk data...")
    df = generate_lynq_dataset(NUM_SAMPLES)
    
    # Save dataset
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(DATASET_FILE, index=False)
    print(f"[OK] Dataset saved to {DATASET_FILE}")
    
    # Preview
    print("\nDataset Preview:")
    print(df.head())
    
    # Stats
    print("\nClass Distribution:")
    print(df['default_event'].value_counts(normalize=True))
    
    # Step 2: Prepare features
    print("\n[2/5] Preparing features...")
    features_df = prepare_features(df)
    
    # Select features for training (matching inference service expectations exactly)
    # The inference service expects 12 features including collateral_ratio (computed)
    feature_columns = [
        'wallet_age_days',
        'total_transactions',
        'total_volume_usd',
        'defi_interactions',
        'loan_amount',
        'collateral_value_usd',
        'term_months',
        'previous_loans',
        'successful_repayments',
        'defaults',
        'reputation_score',
        'collateral_ratio'  # This matches what inference service computes
    ]
    
    # Add collateral_ratio to features_df
    features_df['collateral_ratio'] = features_df['collateral_value_usd'] / features_df['loan_amount']
    features_df['collateral_ratio'] = features_df['collateral_ratio'].replace([np.inf, -np.inf], 0).fillna(0)
    
    X = features_df[feature_columns].values
    y = df['default_event'].values
    
    print(f"[OK] Features prepared: {X.shape[1]} features, {X.shape[0]} samples")
    
    # Step 3: Split data
    print("\n[3/5] Splitting data...")
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )
    
    print(f"[OK] Train: {X_train.shape[0]}, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}")
    
    # Step 4: Scale features
    print("\n[4/5] Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    print("[OK] Features scaled")
    
    # Step 5: Train model
    print("\n[5/5] Training model...")
    model = train_model(X_train_scaled, y_train, X_val_scaled, y_val)
    
    # Evaluate
    metrics = evaluate_model(model, X_test_scaled, y_test, scaler)
    
    # Step 6: Save artifacts
    print("\n[6/6] Saving model artifacts...")
    save_model_artifacts(model, scaler, feature_columns, metrics)
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    print(f"\nModel ready for deployment:")
    print(f"  - Local: {MODEL_FILE}")
    print(f"  - AWS S3: Use upload_to_s3.py script")


if __name__ == "__main__":
    main()
