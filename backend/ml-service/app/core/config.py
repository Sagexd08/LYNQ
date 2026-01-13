from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MODEL_SOURCE: str = "local"  # "local" or "s3"
    
    # Local model path
    LOCAL_MODEL_PATH: str = "./models/credit_model.pkl"
    
    # S3 configuration
    S3_BUCKET: str = ""
    S3_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    
    # API Security
    API_KEY: str = "dev-api-key"
    
    # Feature Flags
    ENABLE_SHAP: bool = True
    PRELOAD_MODEL: bool = False  # Load model on startup vs lazy loading
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
