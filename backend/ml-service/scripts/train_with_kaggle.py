"""
Master script to download Kaggle datasets and train models.

This script orchestrates the entire training pipeline:
1. Sets up Kaggle credentials (if needed)
2. Downloads datasets from Kaggle
3. Trains ML models on the data
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.download_kaggle_datasets import download_all_datasets
from scripts.train_model import main as train_main


def check_kaggle_credentials():
    """Check if Kaggle credentials are set up."""
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    return kaggle_json.exists()


def main():
    """Main training pipeline."""
    print("="*70)
    print("🚀 LYNQ ML Training Pipeline - Kaggle Dataset Integration")
    print("="*70)
    
    # Check Kaggle credentials
    print("\n1️⃣ Checking Kaggle credentials...")
    if not check_kaggle_credentials():
        print("   ⚠️  Kaggle credentials not found!")
        print("\n   Please set up Kaggle credentials first:")
        print("   python scripts/setup_kaggle.py")
        print("\n   Or run:")
        print("   python scripts/setup_kaggle.py <username> <api_key>")
        
        response = input("\n   Do you want to set up credentials now? (y/n): ")
        if response.lower() == 'y':
            from scripts.setup_kaggle import setup_kaggle_credentials
            setup_kaggle_credentials()
        else:
            print("   ❌ Cannot proceed without Kaggle credentials.")
            sys.exit(1)
    else:
        print("   ✅ Kaggle credentials found")
    
    # Download datasets
    print("\n2️⃣ Downloading Kaggle datasets...")
    try:
        downloaded = download_all_datasets()
        if not downloaded:
            print("   ⚠️  No datasets were downloaded successfully")
            print("   Will use synthetic data for training")
    except Exception as e:
        print(f"   ⚠️  Error downloading datasets: {str(e)}")
        print("   Will use synthetic data for training")
        downloaded = {}
    
    # Train models
    print("\n3️⃣ Training ML models...")
    print("   Note: Since the downloaded datasets don't directly map to credit")
    print("   scoring features, we'll use synthetic data based on credit features.")
    print("   The downloaded datasets can be used for future feature engineering.\n")
    
    # Use synthetic data for now
    import sys as sys_module
    sys_module.argv = [
        "train_model.py",
        "--synthetic",
        "--model-type", "all",
        "--samples", "10000"
    ]
    
    train_main()
    
    print("\n" + "="*70)
    print("✅ Training pipeline complete!")
    print("="*70)
    print("\nNext steps:")
    print("1. Review the trained models in backend/ml-service/models/")
    print("2. Test the models with the ML service")
    print("3. Upload models to S3 for production deployment")
    print("\nTo upload to S3:")
    print("  aws s3 cp models/credit_model.pkl s3://lynq-models/models/")
    print("  aws s3 cp models/scaler.pkl s3://lynq-models/models/")
    print("  aws s3 cp models/feature_config.json s3://lynq-models/models/")


if __name__ == "__main__":
    main()
