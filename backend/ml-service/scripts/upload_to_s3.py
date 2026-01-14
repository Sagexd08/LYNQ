"""
Upload LYNQ ML Model to AWS S3
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from datetime import datetime
import json

try:
    from dotenv import load_dotenv

    root_env = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
    if os.path.exists(root_env):
        load_dotenv(root_env)
    else:

        load_dotenv()
except ImportError:

    pass


MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_FILE = os.path.join(MODEL_DIR, "credit_model.pkl")
SCALER_FILE = os.path.join(MODEL_DIR, "scaler.pkl")
CONFIG_FILE = os.path.join(MODEL_DIR, "feature_config.json")


def upload_model_to_s3(
    bucket_name: str,
    model_key_prefix: str = "models/credit_model",
    aws_region: str = None,
    aws_access_key_id: str = None,
    aws_secret_access_key: str = None
):
    """
    Upload model artifacts to S3
    
    Args:
        bucket_name: S3 bucket name
        model_key_prefix: Prefix for model files (without extension)
        aws_region: AWS region (defaults to AWS_REGION env var or us-east-1)
        aws_access_key_id: AWS access key (defaults to AWS_ACCESS_KEY_ID env var)
        aws_secret_access_key: AWS secret key (defaults to AWS_SECRET_ACCESS_KEY env var)
    """

    region = aws_region or os.getenv("AWS_REGION", "us-east-1")
    

    client_config = {"region_name": region}
    
    if aws_access_key_id and aws_secret_access_key:

        client_config["aws_access_key_id"] = aws_access_key_id
        client_config["aws_secret_access_key"] = aws_secret_access_key
    elif os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):

        client_config["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
        client_config["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")

    
    try:

        s3_client = boto3.client("s3", **client_config)
        

        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"[OK] Bucket '{bucket_name}' exists")
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                print(f"[ERROR] Bucket '{bucket_name}' does not exist!")
                print(f"\nCreate it with:")
                print(f"  aws s3 mb s3://{bucket_name} --region {region}")
                return False
            elif error_code == "403":
                print(f"[ERROR] Access denied to bucket '{bucket_name}'")
                return False
            else:
                raise
        

        files_to_upload = {
            "model": MODEL_FILE,
            "scaler": SCALER_FILE,
            "config": CONFIG_FILE
        }
        
        missing_files = []
        for name, path in files_to_upload.items():
            if not os.path.exists(path):
                missing_files.append(f"{name}: {path}")
        
        if missing_files:
            print("[ERROR] Missing model files:")
            for f in missing_files:
                print(f"  - {f}")
            print("\nPlease run train_model.py first to generate the model files.")
            return False
        
        print("\n" + "="*60)
        print("UPLOADING MODEL TO S3")
        print("="*60)
        print(f"Bucket: {bucket_name}")
        print(f"Region: {region}")
        print(f"Prefix: {model_key_prefix}")
        print()
        

        upload_results = {}
        

        model_key = f"{model_key_prefix}.pkl"
        print(f"Uploading model: {model_key}...")
        s3_client.upload_file(MODEL_FILE, bucket_name, model_key)
        upload_results["model"] = model_key
        print(f"[OK] Model uploaded: s3://{bucket_name}/{model_key}")
        

        scaler_key = f"{model_key_prefix}_scaler.pkl"
        print(f"Uploading scaler: {scaler_key}...")
        s3_client.upload_file(SCALER_FILE, bucket_name, scaler_key)
        upload_results["scaler"] = scaler_key
        print(f"[OK] Scaler uploaded: s3://{bucket_name}/{scaler_key}")
        

        config_key = f"{model_key_prefix}_config.json"
        print(f"Uploading config: {config_key}...")
        s3_client.upload_file(CONFIG_FILE, bucket_name, config_key)
        upload_results["config"] = config_key
        print(f"[OK] Config uploaded: s3://{bucket_name}/{config_key}")
        

        print("\n" + "="*60)
        print("UPLOAD COMPLETE!")
        print("="*60)
        print("\nUploaded files:")
        for name, key in upload_results.items():
            print(f"  {name}: s3://{bucket_name}/{key}")
        
        print("\n[INFO] To use this model in the ML service, set these environment variables:")
        print(f"  MODEL_SOURCE=s3")
        print(f"  S3_BUCKET={bucket_name}")
        print(f"  S3_KEY={model_key}")
        print(f"  AWS_REGION={region}")
        print(f"  AWS_ACCESS_KEY_ID={access_key[:10]}...")
        print(f"  AWS_SECRET_ACCESS_KEY=***")
        
        return True
        
    except NoCredentialsError:
        print("[ERROR] AWS credentials not found!")
        print("\nPlease configure AWS credentials:")
        print("  1. Set environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        print("  2. Use AWS CLI: aws configure")
        print("  3. Add to .env file")
        return False
    except ClientError as e:
        print(f"[ERROR] AWS Error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function with command line argument support"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Upload LYNQ ML model to AWS S3")
    parser.add_argument(
        "--bucket",
        type=str,
        required=True,
        help="S3 bucket name"
    )
    parser.add_argument(
        "--key-prefix",
        type=str,
        default="models/credit_model_v1",
        help="S3 key prefix for model files (default: models/credit_model_v1)"
    )
    parser.add_argument(
        "--region",
        type=str,
        default=None,
        help="AWS region (defaults to AWS_REGION env var or us-east-1)"
    )
    parser.add_argument(
        "--access-key",
        type=str,
        default=None,
        help="AWS access key ID (defaults to AWS_ACCESS_KEY_ID env var)"
    )
    parser.add_argument(
        "--secret-key",
        type=str,
        default=None,
        help="AWS secret access key (defaults to AWS_SECRET_ACCESS_KEY env var)"
    )
    
    args = parser.parse_args()
    
    success = upload_model_to_s3(
        bucket_name=args.bucket,
        model_key_prefix=args.key_prefix,
        aws_region=args.region,
        aws_access_key_id=args.access_key,
        aws_secret_access_key=args.secret_key
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
