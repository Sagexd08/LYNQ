"""
Download Kaggle datasets using kagglehub.
"""

import kagglehub
import os

def download_datasets():
    """Download all three datasets using kagglehub."""
    
    datasets = [
        {
            "name": "Employee Burnout Challenge",
            "id": "redwankarimsony/hackerearth-employee-burnout-challenge"
        },
        {
            "name": "RAVDESS Emotional Speech Audio",
            "id": "uwrfkaggler/ravdess-emotional-speech-audio"
        },
        {
            "name": "Driver Drowsiness Dataset",
            "id": "ismailnasri20/driver-drowsiness-dataset-ddd"
        }
    ]
    
    print("="*70)
    print("🚀 LYNQ ML - Downloading Kaggle Datasets")
    print("="*70)
    
    downloaded_paths = {}
    
    for dataset in datasets:
        try:
            print(f"\n📥 Downloading: {dataset['name']}")
            print(f"   Dataset ID: {dataset['id']}")
            
            path = kagglehub.dataset_download(dataset['id'])
            
            print(f"   ✅ Downloaded successfully!")
            print(f"   📁 Path: {path}")
            
            downloaded_paths[dataset['name']] = path
            
        except Exception as e:
            print(f"   ❌ Error downloading {dataset['name']}: {str(e)}")
            continue
    
    print("\n" + "="*70)
    print("📊 Download Summary")
    print("="*70)
    print(f"Successfully downloaded: {len(downloaded_paths)}/{len(datasets)} datasets\n")
    
    for name, path in downloaded_paths.items():
        print(f"✅ {name}")
        print(f"   Path: {path}\n")
    
    return downloaded_paths

if __name__ == "__main__":
    paths = download_datasets()
    
    print("\n" + "="*70)
    print("Next Steps:")
    print("="*70)
    print("1. Datasets are downloaded and cached by kagglehub")
    print("2. You can now train models using these datasets")
    print("3. Run: python scripts/train_with_kaggle.py")
    print("="*70)
