"""
Download datasets from Kaggle.

This script downloads the specified Kaggle datasets for training.
"""

import os
import sys
from pathlib import Path
from kaggle.api.kaggle_api_extended import KaggleApi

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Dataset configurations
DATASETS = {
    "employee_burnout": {
        "name": "redwankarimsony/hackerearth-employee-burnout-challenge",
        "output_dir": "data/employee_burnout"
    },
    "emotional_speech": {
        "name": "uwrfkaggler/ravdess-emotional-speech-audio",
        "output_dir": "data/emotional_speech"
    },
    "driver_drowsiness": {
        "name": "ismailnasri20/driver-drowsiness-dataset-ddd",
        "output_dir": "data/driver_drowsiness"
    }
}

# Base directory is ml-service (parent of scripts)
BASE_DIR = Path(__file__).parent.parent


def download_dataset(dataset_name: str, output_dir: str = None):
    """
    Download a dataset from Kaggle.
    
    Args:
        dataset_name: Kaggle dataset name (e.g., "username/dataset-name")
        output_dir: Output directory for the dataset
    """
    try:
        api = KaggleApi()
        api.authenticate()
        
        if output_dir:
            output_path = BASE_DIR / output_dir
        else:
            output_path = BASE_DIR / "data" / dataset_name.split("/")[-1]
        
        output_path.mkdir(parents=True, exist_ok=True)
        
        print(f"📥 Downloading dataset: {dataset_name}")
        print(f"📁 Output directory: {output_path}")
        
        api.dataset_download_files(
            dataset_name,
            path=str(output_path),
            unzip=True
        )
        
        print(f"✅ Dataset downloaded successfully to {output_path}")
        return output_path
        
    except Exception as e:
        print(f"❌ Error downloading dataset {dataset_name}: {str(e)}")
        print("\nMake sure:")
        print("1. Kaggle credentials are set up (run setup_kaggle.py)")
        print("2. You have accepted the dataset's terms of use on Kaggle")
        print("3. The dataset name is correct")
        raise


def download_all_datasets():
    """Download all configured datasets."""
    print("🚀 Starting dataset downloads...\n")
    
    downloaded = {}
    
    for key, config in DATASETS.items():
        try:
            print(f"\n{'='*60}")
            print(f"Downloading: {key}")
            print(f"{'='*60}")
            
            output_path = download_dataset(
                config["name"],
                config["output_dir"]
            )
            downloaded[key] = str(output_path)
            
        except Exception as e:
            print(f"⚠️  Failed to download {key}: {str(e)}")
            continue
    
    print(f"\n{'='*60}")
    print("📊 Download Summary")
    print(f"{'='*60}")
    print(f"Successfully downloaded: {len(downloaded)}/{len(DATASETS)} datasets")
    
    for key, path in downloaded.items():
        print(f"  ✅ {key}: {path}")
    
    return downloaded


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Download Kaggle datasets")
    parser.add_argument(
        "--dataset",
        choices=list(DATASETS.keys()) + ["all"],
        default="all",
        help="Dataset to download (default: all)"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Custom output directory (optional)"
    )
    
    args = parser.parse_args()
    
    if args.dataset == "all":
        download_all_datasets()
    else:
        config = DATASETS[args.dataset]
        download_dataset(
            config["name"],
            args.output or config["output_dir"]
        )
