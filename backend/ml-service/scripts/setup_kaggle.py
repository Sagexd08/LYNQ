"""
Setup Kaggle API credentials.

This script helps configure Kaggle API credentials for downloading datasets.
"""

import os
import json
from pathlib import Path

def setup_kaggle_credentials(username: str = None, key: str = None):
    """
    Set up Kaggle API credentials.
    
    Args:
        username: Kaggle username (optional, will prompt if not provided)
        key: Kaggle API key (optional, will prompt if not provided)
    """
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_dir.mkdir(exist_ok=True)
    
    kaggle_json = kaggle_dir / "kaggle.json"
    
    # Check if credentials already exist
    if kaggle_json.exists():
        print(f"⚠️  Kaggle credentials already exist at {kaggle_json}")
        response = input("Do you want to overwrite them? (y/n): ")
        if response.lower() != 'y':
            print("Keeping existing credentials.")
            return
    
    # Get credentials
    if not username:
        username = input("Enter your Kaggle username: ").strip()
    
    if not key:
        key = input("Enter your Kaggle API key: ").strip()
    
    # Create credentials file
    credentials = {
        "username": username,
        "key": key
    }
    
    with open(kaggle_json, 'w') as f:
        json.dump(credentials, f)
    
    # Set proper permissions (Unix-like systems)
    if os.name != 'nt':  # Not Windows
        os.chmod(kaggle_json, 0o600)
    
    print(f"✅ Kaggle credentials saved to {kaggle_json}")
    print("\nTo get your Kaggle API credentials:")
    print("1. Go to https://www.kaggle.com/")
    print("2. Click on your profile picture → Settings")
    print("3. Scroll down to 'API' section")
    print("4. Click 'Create New Token'")
    print("5. Download kaggle.json and extract username and key")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) == 3:
        username = sys.argv[1]
        key = sys.argv[2]
        setup_kaggle_credentials(username, key)
    else:
        setup_kaggle_credentials()
