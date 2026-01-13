"""
Train ML models on downloaded datasets.

This script processes the downloaded datasets and trains credit scoring models.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import xgboost as xgb
import lightgbm as lgb

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Output directory
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# Expected feature names for credit scoring
CREDIT_FEATURES = [
    "wallet_age_days",
    "total_transactions",
    "total_volume_usd",
    "defi_interactions",
    "loan_amount",
    "collateral_value_usd",
    "term_months",
    "previous_loans",
    "successful_repayments",
    "defaults",
    "reputation_score",
    "collateral_ratio",
]


def load_employee_burnout_data(data_dir: Path):
    """Load and process employee burnout dataset."""
    print("📊 Loading employee burnout dataset...")
    
    # Find CSV files
    csv_files = list(data_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {data_dir}")
    
    # Load the main dataset
    df = pd.read_csv(csv_files[0])
    print(f"   Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Map to credit scoring features (example mapping)
    # This is a placeholder - you'll need to adapt based on actual dataset structure
    feature_mapping = {}
    
    return df, feature_mapping


def load_emotional_speech_data(data_dir: Path):
    """Load and process emotional speech dataset."""
    print("📊 Loading emotional speech dataset...")
    
    # This dataset contains audio files, not directly usable for credit scoring
    # You might need to extract features or use it for a different model
    audio_files = list(data_dir.rglob("*.wav"))
    print(f"   Found {len(audio_files)} audio files")
    
    # Placeholder - would need audio feature extraction
    return None, {}


def load_driver_drowsiness_data(data_dir: Path):
    """Load and process driver drowsiness dataset."""
    print("📊 Loading driver drowsiness dataset...")
    
    # Find CSV or image files
    csv_files = list(data_dir.glob("*.csv"))
    img_files = list(data_dir.rglob("*.jpg")) + list(data_dir.rglob("*.png"))
    
    if csv_files:
        df = pd.read_csv(csv_files[0])
        print(f"   Loaded {len(df)} rows from CSV")
        return df, {}
    elif img_files:
        print(f"   Found {len(img_files)} image files")
        # Would need image feature extraction
        return None, {}
    else:
        raise FileNotFoundError(f"No data files found in {data_dir}")


def create_synthetic_credit_data(n_samples: int = 10000):
    """
    Create synthetic credit scoring dataset based on expected features.
    
    This is used when the downloaded datasets don't directly map to credit features.
    """
    print(f"🔄 Generating synthetic credit scoring dataset ({n_samples} samples)...")
    
    np.random.seed(42)
    
    X = []
    y = []
    
    for _ in range(n_samples):
        # Generate realistic feature values
        wallet_age = int(np.random.exponential(365))
        total_tx = int(np.random.poisson(50))
        total_volume = np.random.lognormal(8, 1.5)
        defi_interactions = int(np.random.poisson(5))
        loan_amount = np.random.uniform(1000, 50000)
        collateral_value = loan_amount * np.random.uniform(1.0, 2.5)
        term_months = np.random.choice([3, 6, 12, 24])
        previous_loans = int(np.random.poisson(2))
        successful_repayments = max(0, previous_loans - int(np.random.poisson(0.3)))
        defaults = max(0, previous_loans - successful_repayments)
        reputation_score = int(np.random.uniform(0, 100))
        collateral_ratio = collateral_value / loan_amount if loan_amount > 0 else 0
        
        features = [
            wallet_age,
            total_tx,
            total_volume,
            defi_interactions,
            loan_amount,
            collateral_value,
            term_months,
            previous_loans,
            successful_repayments,
            defaults,
            reputation_score,
            collateral_ratio,
        ]
        
        # Generate target (default probability)
        risk_score = (
            (1 - min(wallet_age / 730, 1)) * 0.2 +
            (1 - min(collateral_ratio / 2, 1)) * 0.3 +
            (defaults / max(previous_loans, 1)) * 0.3 +
            (1 - reputation_score / 100) * 0.2
        )
        
        will_default = 1 if risk_score > 0.3 else 0
        
        X.append(features)
        y.append(will_default)
    
    return np.array(X), np.array(y)


def train_models(X_train, X_test, y_train, y_test, model_type: str = "random_forest"):
    """
    Train ML models on the data.
    
    Args:
        X_train: Training features
        X_test: Test features
        y_train: Training labels
        y_test: Test labels
        model_type: Type of model to train ('random_forest', 'xgboost', 'lightgbm', 'gradient_boosting', 'all')
    """
    print(f"\n🤖 Training {model_type} model...")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    models = {}
    
    if model_type in ["random_forest", "all"]:
        print("   Training RandomForest...")
        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1
        )
        rf.fit(X_train_scaled, y_train)
        models['random_forest'] = rf
    
    if model_type in ["xgboost", "all"]:
        print("   Training XGBoost...")
        xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric='logloss'
        )
        xgb_model.fit(X_train_scaled, y_train)
        models['xgboost'] = xgb_model
    
    if model_type in ["lightgbm", "all"]:
        print("   Training LightGBM...")
        lgb_model = lgb.LGBMClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            verbose=-1
        )
        lgb_model.fit(X_train_scaled, y_train)
        models['lightgbm'] = lgb_model
    
    if model_type in ["gradient_boosting", "all"]:
        print("   Training GradientBoosting...")
        gb = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        gb.fit(X_train_scaled, y_train)
        models['gradient_boosting'] = gb
    
    # Evaluate models
    results = {}
    for name, model in models.items():
        print(f"\n   📈 Evaluating {name}...")
        
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        try:
            auc = roc_auc_score(y_test, y_pred_proba)
        except:
            auc = 0.0
        
        results[name] = {
            'model': model,
            'scaler': scaler,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'auc': auc
        }
        
        print(f"      Accuracy:  {accuracy:.4f}")
        print(f"      Precision: {precision:.4f}")
        print(f"      Recall:    {recall:.4f}")
        print(f"      F1 Score:  {f1:.4f}")
        print(f"      AUC-ROC:   {auc:.4f}")
    
    # Select best model based on F1 score
    best_model_name = max(results.keys(), key=lambda k: results[k]['f1'])
    print(f"\n✅ Best model: {best_model_name} (F1: {results[best_model_name]['f1']:.4f})")
    
    return results[best_model_name], results


def save_model(model, scaler, metrics: dict, model_name: str = "credit_model"):
    """Save trained model and metadata."""
    print(f"\n💾 Saving model...")
    
    # Save model
    model_path = os.path.join(MODEL_DIR, f"{model_name}.pkl")
    joblib.dump(model, model_path)
    print(f"   Model saved: {model_path}")
    
    # Save scaler
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    joblib.dump(scaler, scaler_path)
    print(f"   Scaler saved: {scaler_path}")
    
    # Save feature config
    config_path = os.path.join(MODEL_DIR, "feature_config.json")
    feature_config = {
        "features": CREDIT_FEATURES,
        "version": f"v1.0.0-{datetime.now().strftime('%Y%m%d')}",
        "model_type": type(model).__name__,
        "metrics": {
            "accuracy": float(metrics['accuracy']),
            "precision": float(metrics['precision']),
            "recall": float(metrics['recall']),
            "f1_score": float(metrics['f1']),
            "auc_roc": float(metrics['auc'])
        },
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    
    with open(config_path, 'w') as f:
        json.dump(feature_config, f, indent=2)
    print(f"   Config saved: {config_path}")
    
    return model_path, scaler_path, config_path


def main():
    """Main training pipeline."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train ML models")
    parser.add_argument(
        "--data-dir",
        type=str,
        help="Directory containing downloaded datasets"
    )
    parser.add_argument(
        "--model-type",
        choices=["random_forest", "xgboost", "lightgbm", "gradient_boosting", "all"],
        default="all",
        help="Type of model to train"
    )
    parser.add_argument(
        "--synthetic",
        action="store_true",
        help="Use synthetic data instead of downloaded datasets"
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=10000,
        help="Number of synthetic samples to generate"
    )
    
    args = parser.parse_args()
    
    print("="*60)
    print("🚀 LYNQ ML Model Training Pipeline")
    print("="*60)
    
    # Load or generate data
    if args.synthetic or not args.data_dir:
        print("\n📊 Using synthetic credit scoring data...")
        X, y = create_synthetic_credit_data(args.samples)
    else:
        data_dir = Path(args.data_dir)
        if not data_dir.exists():
            print(f"❌ Data directory not found: {data_dir}")
            print("   Falling back to synthetic data...")
            X, y = create_synthetic_credit_data(args.samples)
        else:
            # Try to load from datasets
            # For now, use synthetic as the datasets don't directly map to credit features
            print("⚠️  Downloaded datasets don't directly map to credit features.")
            print("   Using synthetic data based on credit scoring features...")
            X, y = create_synthetic_credit_data(args.samples)
    
    print(f"\n📊 Dataset: {len(X)} samples, {X.shape[1]} features")
    print(f"   Default rate: {y.mean():.2%}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"   Train: {len(X_train)} samples")
    print(f"   Test:  {len(X_test)} samples")
    
    # Train models
    best_result, all_results = train_models(
        X_train, X_test, y_train, y_test, args.model_type
    )
    
    # Save best model
    model_path, scaler_path, config_path = save_model(
        best_result['model'],
        best_result['scaler'],
        best_result,
        "credit_model"
    )
    
    print("\n" + "="*60)
    print("✅ Training complete!")
    print("="*60)
    print(f"Best model: {model_path}")
    print(f"Scaler: {scaler_path}")
    print(f"Config: {config_path}")
    print("\nYou can now use these models with the ML service.")


if __name__ == "__main__":
    main()
