import os
import json
import logging
from typing import Optional, List
import joblib
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import boto3 for S3 support
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logger.warning("boto3 not available, S3 model loading disabled")


class ModelLoader:
    def __init__(self):
        self._model = None
        self._scaler = None
        self._feature_config = None
        self._model_version = "v1.0.0-mock"
        self._is_loaded = False
        
    @property
    def is_loaded(self) -> bool:
        return self._is_loaded
    
    @property
    def model_version(self) -> str:
        return self._model_version
    
    def load_models(self):
        try:
            if settings.MODEL_SOURCE == "s3":
                self._load_from_s3()
            else:
                self._load_from_local()
            
            self._is_loaded = True
            logger.info(f"Models loaded successfully: {self._model_version}")
            
        except Exception as e:
            logger.warning(f"Failed to load ML models: {e}")
            logger.info("Using mock model for development")
            self._use_mock_model()
            self._is_loaded = True
    
    def _load_from_s3(self):
        if not BOTO3_AVAILABLE:
            logger.warning("boto3 not available, falling back to mock model")
            self._use_mock_model()
            return
        
        try:
            logger.info(f"Loading model from S3: {settings.S3_BUCKET}/{settings.S3_KEY}")
            
            s3_client = boto3.client(
                's3',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            
            # Download model
            model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
            os.makedirs(model_dir, exist_ok=True)
            
            model_path = os.path.join(model_dir, "credit_model.pkl")
            scaler_path = os.path.join(model_dir, "scaler.pkl")
            config_path = os.path.join(model_dir, "feature_config.json")
            
            # Download files from S3
            s3_client.download_file(settings.S3_BUCKET, settings.S3_KEY, model_path)
            
            # Try to download scaler and config (optional)
            scaler_key = settings.S3_KEY.replace(".pkl", "_scaler.pkl")
            config_key = settings.S3_KEY.replace(".pkl", "_config.json")
            
            try:
                s3_client.download_file(settings.S3_BUCKET, scaler_key, scaler_path)
            except ClientError:
                logger.warning(f"Scaler not found at {scaler_key}, continuing without scaler")
            
            try:
                s3_client.download_file(settings.S3_BUCKET, config_key, config_path)
            except ClientError:
                logger.warning(f"Config not found at {config_key}, using defaults")
            
            # Load model
            self._model = joblib.load(model_path)
            logger.info("Model loaded from S3 successfully")
            
            # Load scaler if available
            if os.path.exists(scaler_path):
                self._scaler = joblib.load(scaler_path)
                logger.info("Scaler loaded from S3 successfully")
            
            # Load config if available
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    self._feature_config = json.load(f)
                self._model_version = self._feature_config.get("version", "v1.0.0")
                logger.info("Feature config loaded from S3 successfully")
            else:
                self._feature_config = {"features": self._get_default_features(), "version": "v1.0.0"}
                self._model_version = "v1.0.0"
            
        except Exception as e:
            logger.error(f"Failed to load model from S3: {e}")
            logger.info("Falling back to mock model")
            self._use_mock_model()
    
    def _load_from_local(self):
        # Use LOCAL_MODEL_PATH if specified, otherwise default location
        if settings.LOCAL_MODEL_PATH and os.path.exists(settings.LOCAL_MODEL_PATH):
            model_path = settings.LOCAL_MODEL_PATH
            # Infer scaler and config paths from model path
            base_path = os.path.splitext(model_path)[0]
            scaler_path = f"{base_path}_scaler.pkl"
            config_path = f"{base_path}_config.json"
        else:
            # Default location
            model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
            model_path = os.path.join(model_dir, "credit_model.pkl")
            scaler_path = os.path.join(model_dir, "scaler.pkl")
            config_path = os.path.join(model_dir, "feature_config.json")
        
        if not os.path.exists(model_path):
            logger.info("No local model file found, using mock model")
            self._use_mock_model()
            return
        
        try:
            # Load model
            self._model = joblib.load(model_path)
            logger.info("Model loaded from local file successfully")
            
            # Load scaler if available
            if os.path.exists(scaler_path):
                self._scaler = joblib.load(scaler_path)
                logger.info("Scaler loaded from local file successfully")
            
            # Load config
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    self._feature_config = json.load(f)
                self._model_version = self._feature_config.get("version", "v1.0.0")
                logger.info("Feature config loaded from local file")
            else:
                self._feature_config = {"features": self._get_default_features(), "version": "v1.0.0"}
                self._model_version = "v1.0.0"
                logger.warning("Feature config not found, using defaults")
                
        except Exception as e:
            logger.error(f"Failed to load model from local file: {e}")
            logger.info("Falling back to mock model")
            self._use_mock_model()
    
    def _use_mock_model(self):
        self._model = None
        self._scaler = None
        self._feature_config = {
            "features": self._get_default_features(),
            "version": "v1.0.0-mock"
        }
        self._model_version = "v1.0.0-mock"
    
    def _get_default_features(self) -> List[str]:
        return [
            "wallet_age_days",
            "total_transactions",
            "total_volume_usd",
            "defi_interactions",
            "loan_amount",
            "collateral_value_usd",
            "term_months",
            "previous_loans",
            "successful_repayments",
            "defaults",
            "reputation_score",
            "collateral_ratio"
        ]
    
    def get_model(self):
        return self._model
    
    def get_scaler(self):
        return self._scaler
    
    def get_feature_config(self):
        return self._feature_config
    
    def get_feature_names(self) -> List[str]:
        if self._feature_config:
            return self._feature_config.get("features", [])
        return []


model_loader = ModelLoader()
