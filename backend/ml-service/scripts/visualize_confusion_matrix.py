"""
Generate confusion matrix visualization for the trained model
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix


sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_FILE = os.path.join(MODEL_DIR, "credit_model.pkl")
SCALER_FILE = os.path.join(MODEL_DIR, "scaler.pkl")
DATASET_FILE = os.path.join(MODEL_DIR, "lynq_risk_dataset.csv")
OUTPUT_FILE = os.path.join(MODEL_DIR, "confusion_matrix.png")


from train_model import generate_lynq_dataset, prepare_features


def generate_confusion_matrix_plot():
    """Generate and save confusion matrix visualization"""
    
    print("Loading model and generating test predictions...")
    
    # Load model and scaler
    if not os.path.exists(MODEL_FILE):
        print(f"Error: Model file not found at {MODEL_FILE}")
        print("Please run train_model.py first to generate the model.")
        return False
    
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    
    # Generate fresh test data
    print("Generating test dataset...")
    df = generate_lynq_dataset(15000)  # Generate test set
    features_df = prepare_features(df)
    
    # Select features
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
        'collateral_ratio'
    ]
    
    # Add collateral_ratio if not present
    if 'collateral_ratio' not in features_df.columns:
        features_df['collateral_ratio'] = features_df['collateral_value_usd'] / features_df['loan_amount']
        features_df['collateral_ratio'] = features_df['collateral_ratio'].replace([np.inf, -np.inf], 0).fillna(0)
    
    X = features_df[feature_columns].values
    y = df['default_event'].values
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    # Make predictions
    print("Making predictions...")
    y_pred = model.predict(X_scaled)
    
    # Generate confusion matrix
    cm = confusion_matrix(y, y_pred)
    
    # Create visualization
    print("Creating visualization...")
    plt.figure(figsize=(10, 8))
    
    # Create heatmap
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        cbar=True,
        square=True,
        linewidths=2,
        linecolor='black',
        annot_kws={'size': 16, 'weight': 'bold'},
        xticklabels=['No Default', 'Default'],
        yticklabels=['No Default', 'Default']
    )
    
    plt.title('LYNQ Credit Risk Model - Confusion Matrix', fontsize=18, fontweight='bold', pad=20)
    plt.ylabel('Actual Label', fontsize=14, fontweight='bold')
    plt.xlabel('Predicted Label', fontsize=14, fontweight='bold')
    
    # Add metrics text
    tn, fp, fn, tp = cm.ravel()
    accuracy = (tn + tp) / (tn + fp + fn + tp)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    metrics_text = f'Accuracy: {accuracy:.4f}\nPrecision: {precision:.4f}\nRecall: {recall:.4f}\nF1 Score: {f1:.4f}'
    plt.text(0.5, -0.15, metrics_text, 
             transform=plt.gca().transAxes,
             fontsize=12,
             verticalalignment='top',
             horizontalalignment='center',
             bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    plt.tight_layout()
    
    # Save figure
    os.makedirs(MODEL_DIR, exist_ok=True)
    plt.savefig(OUTPUT_FILE, dpi=300, bbox_inches='tight')
    print(f"\n[OK] Confusion matrix saved to: {OUTPUT_FILE}")
    
    # Print summary
    print("\n" + "="*60)
    print("CONFUSION MATRIX SUMMARY")
    print("="*60)
    print(f"\nTrue Negatives (TN):  {tn:>6}")
    print(f"False Positives (FP): {fp:>6}")
    print(f"False Negatives (FN): {fn:>6}")
    print(f"True Positives (TP):   {tp:>6}")
    print(f"\nAccuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    
    plt.close()
    return True


if __name__ == "__main__":
    success = generate_confusion_matrix_plot()
    sys.exit(0 if success else 1)
