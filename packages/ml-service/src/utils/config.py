"""
Configuration Management
"""

import os
from pathlib import Path
from typing import Dict, Any
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost:5432/lynq")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # MLflow
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    MLFLOW_EXPERIMENT_NAME: str = os.getenv("MLFLOW_EXPERIMENT_NAME", "lynq-credit-scoring")
    
    # Model
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "v1.0.0")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/production")
    SYNTHETIC_DATA_SIZE: int = int(os.getenv("SYNTHETIC_DATA_SIZE", "100000"))
    SYNTHETIC_DEFAULT_RATE: float = float(os.getenv("SYNTHETIC_DEFAULT_RATE", "0.15"))
    
    # API
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8001"))
    API_WORKERS: int = int(os.getenv("API_WORKERS", "4"))
    
    # Monitoring
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENABLE_MONITORING: bool = os.getenv("ENABLE_MONITORING", "true").lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
