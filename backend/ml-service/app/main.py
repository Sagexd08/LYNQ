from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uuid

from app.api.routes import router as api_router
from app.core.config import settings
from app.core.security import verify_api_key
from app.core.logging import setup_logging, request_id_var, get_logger
from app.models.loader import ModelLoader


setup_logging(settings.LOG_LEVEL)
logger = get_logger(__name__)

model_loader = ModelLoader()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting LYNQ ML Service...")
    if settings.PRELOAD_MODEL:
        logger.info("Preloading model on startup...")
        model_loader.load_models()
        logger.info("Models loaded successfully")
    else:
        logger.info("Lazy loading enabled - model will load on first request")
    yield
    logger.info("Shutting down LYNQ ML Service...")


app = FastAPI(
    title="LYNQ ML Service",
    description="AI-powered credit risk assessment for DeFi lending",
    version="1.0.0",
    lifespan=lifespan,
)

# FIXED: Restrict CORS to allowed origins
import os
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3003",
    "https://lynq.finance",          # Production frontend
    "https://app.lynq.finance",      # Production app
    os.getenv("BACKEND_URL", ""),    # Backend service URL
]

# Filter out empty strings
ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Restrict methods
    allow_headers=["X-API-KEY", "Content-Type", "Authorization"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to each request for tracing."""
    request_id = str(uuid.uuid4())
    request_id_var.set(request_id)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.include_router(api_router, prefix="/api", dependencies=[Depends(verify_api_key)])


@app.get("/health")
async def health_check():
    """Health check endpoint with model status."""
    import time
    uptime_start = getattr(health_check, '_start_time', None)
    if uptime_start is None:
        health_check._start_time = time.time()
        uptime_start = health_check._start_time
    
    uptime_seconds = int(time.time() - uptime_start)
    
    return {
        "status": "ok",
        "model_loaded": model_loader.is_loaded,
        "model_version": model_loader.model_version,
        "uptime_seconds": uptime_seconds,
    }


@app.get("/model/info")
async def model_info(api_key: str = Depends(verify_api_key)):
    """Get model metadata and configuration."""
    feature_config = model_loader.get_feature_config()
    
    return {
        "model_version": model_loader.model_version,
        "trained_on": "kaggle" if "kaggle" in model_loader.model_version.lower() else "synthetic",
        "features": len(model_loader.get_feature_names()),
        "feature_names": model_loader.get_feature_names(),
        "model_source": settings.MODEL_SOURCE,
        "shap_enabled": settings.ENABLE_SHAP,
        "auc_roc": feature_config.get("auc_roc", None) if feature_config else None,
        "frameworks": ["scikit-learn", "xgboost", "lightgbm"] if model_loader.get_model() else [],
        "last_updated": feature_config.get("last_updated", None) if feature_config else None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
