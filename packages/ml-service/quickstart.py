"""
Quick Start Script - Run Complete ML Pipeline
"""

import subprocess
import sys
from pathlib import Path
from loguru import logger

def run_command(cmd, description):
    """Run a shell command."""
    logger.info(f"🚀 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"✅ {description} completed")
        return result.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ {description} failed: {e.stderr}")
        sys.exit(1)

def main():
    """Run the complete ML pipeline."""
    
    logger.info("=" * 60)
    logger.info("LYNQ ML SERVICE - QUICK START")
    logger.info("=" * 60)
    
    # Create directories
    Path("data").mkdir(exist_ok=True)
    Path("models/production").mkdir(parents=True, exist_ok=True)
    
    # Step 1: Generate synthetic data
    logger.info("\n📊 Step 1/3: Generating Synthetic Training Data")
    run_command(
        "python src/data/synthetic_generator.py --samples 10000 --output data/synthetic_loans.csv",
        "Data generation"
    )
    
    # Step 2: Train model
    logger.info("\n🤖 Step 2/3: Training ML Models")
    run_command(
        "python src/training/train_model.py --data data/synthetic_loans.csv --output models/production --no-mlflow",
        "Model training"
    )
    
    # Step 3: Start API
    logger.info("\n🚀 Step 3/3: Starting API Service")
    logger.info("API will be available at: http://localhost:8001")
    logger.info("Press Ctrl+C to stop")
    
    try:
        subprocess.run(
            "uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload",
            shell=True,
            check=True
        )
    except KeyboardInterrupt:
        logger.info("\n👋 Shutting down...")
    
    logger.info("\n✅ Quick start completed successfully!")

if __name__ == "__main__":
    main()
