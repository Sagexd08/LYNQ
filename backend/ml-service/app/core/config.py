"""Configuration management for LYNQ ML Service"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # ===== Model Configuration =====
    MODEL_SOURCE: str = "local"  # "local" or "s3"
    
    # Local model path
    LOCAL_MODEL_PATH: str = "./models/credit_model.pkl"
    
    # ===== S3 Configuration =====
    S3_BUCKET: str = ""
    S3_KEY: str = ""
    
    # ===== AWS Configuration =====
    # AWS Region
    AWS_REGION: str = "us-east-1"
    
    # AWS Credentials (optional if using EC2 IAM role)
    # Leave empty on EC2 instances with proper IAM role - boto3 will auto-detect
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # ===== API Security =====
    API_KEY: str = "dev-api-key"
    
    # ===== Feature Flags =====
    ENABLE_SHAP: bool = True
    PRELOAD_MODEL: bool = False  # Load model on startup vs lazy loading
    
    # ===== Server Configuration =====
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # ===== Logging =====
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def has_explicit_credentials(self) -> bool:
        """Check if explicit AWS credentials are configured"""
        return bool(self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY)
