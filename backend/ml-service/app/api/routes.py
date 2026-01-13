from fastapi import APIRouter, HTTPException, status
from app.schemas.credit import CreditScoreRequest, CreditScoreResponse
from app.services.inference import InferenceService
from app.services.explainability import ExplainabilityService
from app.services.fallback import FallbackService
from app.utils.timers import Timer
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

inference_service = InferenceService()
explainability_service = ExplainabilityService()
fallback_service = FallbackService()


@router.post("/ml/credit-score", response_model=CreditScoreResponse)
async def get_credit_score(request: CreditScoreRequest):
    """Main credit scoring endpoint with ML inference."""
    from app.models.loader import model_loader
    
    # Lazy load model if not preloaded
    if not model_loader.is_loaded:
        model_loader.load_models()
    
    timer = Timer()
    timer.start()
    
    try:
        prediction = inference_service.predict(request)
        
        if prediction is None:
            logger.warning("ML model prediction failed, using fallback")
            prediction = fallback_service.calculate_score(request)
            prediction.is_fallback = True
        
        if explainability_service.is_enabled and not prediction.is_fallback:
            try:
                explanation = explainability_service.explain(request)
                prediction.top_factors = explanation.top_factors
                prediction.confidence_score = explanation.confidence
            except Exception as e:
                logger.warning(f"SHAP explanation failed: {e}")
        
        prediction.processing_time_ms = timer.elapsed_ms()
        
        return prediction
        
    except Exception as e:
        logger.error(f"Credit score prediction error: {e}")
        
        fallback_prediction = fallback_service.calculate_score(request)
        fallback_prediction.is_fallback = True
        fallback_prediction.processing_time_ms = timer.elapsed_ms()
        
        return fallback_prediction
