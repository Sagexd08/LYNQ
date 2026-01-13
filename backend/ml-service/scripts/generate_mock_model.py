"""
Generate a mock ML model for development and testing.

This script creates a simple scikit-learn model trained on synthetic data
that can be used for local development when a real trained model is not available.
"""

import os
import sys
import json
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Output directory
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# Feature names (must match what the service expects)
FEATURE_NAMES = [
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

NUM_FEATURES = len(FEATURE_NAMES)
NUM_SAMPLES = 10000


def generate_synthetic_data(n_samples: int = NUM_SAMPLES) -> tuple:
    """Generate synthetic training data."""
    np.random.seed(42)
    
    X = []
    y = []
    
    for _ in range(n_samples):
        # Generate realistic feature values
        wallet_age = np.random.exponential(365)  # Days
        total_tx = np.random.poisson(50)
        total_volume = np.random.lognormal(8, 1.5)  # USD
        defi_interactions = np.random.poisson(5)
        loan_amount = np.random.uniform(1000, 50000)  # USD
        collateral_value = loan_amount * np.random.uniform(1.0, 2.5)
        term_months = np.random.choice([3, 6, 12, 24])
        previous_loans = np.random.poisson(2)
        successful_repayments = max(0, previous_loans - np.random.poisson(0.3))
        defaults = previous_loans - successful_repayments
        reputation_score = np.random.uniform(0, 100)
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
        # Higher risk if: low wallet age, low collateral ratio, high defaults, low reputation
        risk_score = (
            (1 - min(wallet_age / 730, 1)) * 0.2 +  # Wallet age factor
            (1 - min(collateral_ratio / 2, 1)) * 0.3 +  # Collateral factor
            (defaults / max(previous_loans, 1)) * 0.3 +  # Default history
            (1 - reputation_score / 100) * 0.2  # Reputation factor
        )
        
        # Binary classification: 1 = default, 0 = no default
        will_default = 1 if risk_score > 0.3 else 0
        
        X.append(features)
        y.append(will_default)
    
    return np.array(X), np.array(y)


def train_model():
    """Train a simple RandomForest model on synthetic data."""
    print("Generating synthetic training data...")
    X, y = generate_synthetic_data()
    
    print(f"Generated {len(X)} samples with {X.shape[1]} features")
    print(f"Default rate: {y.mean():.2%}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    print("Fitting scaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print("Training RandomForest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced',
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    print(f"\nModel Performance:")
    print(f"  Train Accuracy: {train_score:.4f}")
    print(f"  Test Accuracy: {test_score:.4f}")
    
    # Save model and scaler
    model_path = os.path.join(MODEL_DIR, "credit_model.pkl")
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    config_path = os.path.join(MODEL_DIR, "feature_config.json")
    
    print(f"\nSaving model to {model_path}...")
    joblib.dump(model, model_path)
    
    print(f"Saving scaler to {scaler_path}...")
    joblib.dump(scaler, scaler_path)
    
    # Save feature config
    feature_config = {
        "features": FEATURE_NAMES,
        "version": "v1.0.0-mock",
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "max_depth": 10,
        "train_accuracy": float(train_score),
        "test_accuracy": float(test_score),
    }
    
    print(f"Saving feature config to {config_path}...")
    with open(config_path, 'w') as f:
        json.dump(feature_config, f, indent=2)
    
    print("\n✅ Mock model generated successfully!")
    print(f"   Model: {model_path}")
    print(f"   Scaler: {scaler_path}")
    print(f"   Config: {config_path}")


if __name__ == "__main__":
    train_model()
