import os
import json
import logging
from typing import Optional, List
import joblib
from app.core.config import settings
from app.core.aws import get_s3_loader, get_cloudwatch_metrics

logger = logging.getLogger(__name__)


class ModelLoader:
    def __init__(self):
        self._model = None
        self._scaler = None
        self._feature_config = None
        self._model_version = "rule-based"
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
            logger.error(f"Failed to load ML models: {e}")
            logger.warning("ML model not available - will use rule-based prediction fallback")
            self._use_mock_model()
            self._is_loaded = True
    
    def _load_from_s3(self):
        """Load model from S3 using AWS SDK"""
        try:
            logger.info(f"Loading model from S3: {settings.S3_BUCKET}/{settings.S3_KEY}")
            
            s3_loader = get_s3_loader()
            
            # Create models directory
            model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
            os.makedirs(model_dir, exist_ok=True)
            
            model_path = os.path.join(model_dir, "credit_model.pkl")
            scaler_path = os.path.join(model_dir, "scaler.pkl")
            config_path = os.path.join(model_dir, "feature_config.json")
            
            # Download model file
            if not s3_loader.download_model(settings.S3_BUCKET, settings.S3_KEY, model_path):
                logger.error("Failed to download model from S3 - model file not found")
                self._use_mock_model()
                return
            
            # Try to download scaler and config (optional)
            scaler_key = settings.S3_KEY.replace(".pkl", "_scaler.pkl")
            config_key = settings.S3_KEY.replace(".pkl", "_config.json")
            
            s3_loader.download_model(settings.S3_BUCKET, scaler_key, scaler_path)
            s3_loader.download_model(settings.S3_BUCKET, config_key, config_path)
            
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
            
            # Log to CloudWatch
            metrics = get_cloudwatch_metrics()
            metrics.put_metric("S3ModelLoad", 1, "Count", {"Status": "Success"})
            
        except Exception as e:
            logger.error(f"Failed to load model from S3: {e}")
            logger.warning("Falling back to rule-based prediction")
            
            # Log failure to CloudWatch
            try:
                metrics = get_cloudwatch_metrics()
                metrics.put_metric("S3ModelLoad", 0, "Count", {"Status": "Failed"})
            except Exception as metric_error:
                logger.error(f"Failed to log metric: {metric_error}")
            
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
            logger.warning("No local model file found - will use rule-based prediction fallback")
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
            logger.warning("Falling back to rule-based prediction")
            self._use_mock_model()
    
    def _use_mock_model(self):
        """Fallback when model cannot be loaded - use rule-based prediction instead"""
        self._model = None
        self._scaler = None
        self._feature_config = {
            "features": self._get_default_features(),
            "version": "rule-based"
        }
        self._model_version = "rule-based"
        logger.warning("ML model not available - using rule-based prediction fallback")
    
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
