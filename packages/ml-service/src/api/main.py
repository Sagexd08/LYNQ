"""
FastAPI Service for ML Predictions

Real-time credit scoring API.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from loguru import logger
import time

# Initialize FastAPI app
app = FastAPI(
    title="LYNQ ML Service",
    description="Machine Learning service for credit scoring",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
MODEL_CACHE = {}


class CreditScoreRequest(BaseModel):
    """Credit score prediction request."""
    applicant_id: str
    loan_amount: float = Field(..., gt=0, description="Requested loan amount")
    loan_term_months: int = Field(..., gt=0, le=60, description="Loan term in months")
    collateral_amount: float = Field(..., gt=0, description="Collateral amount")
    collateral_type: str = Field(..., description="Type of collateral")
    request_timestamp: Optional[str] = None
    
    # Applicant data (optional - can be fetched from database)
    age: Optional[int] = None
    annual_income: Optional[float] = None
    credit_score: Optional[int] = None
    total_portfolio_value: Optional[float] = None
    
    @validator('collateral_type')
    def validate_collateral_type(cls, v):
        allowed = ['USDC', 'USDT', 'DAI', 'ETH', 'BTC', 'Mixed']
        if v not in allowed:
            raise ValueError(f"Collateral type must be one of {allowed}")
        return v


class CreditScoreResponse(BaseModel):
    """Credit score prediction response."""
    applicant_id: str
    credit_score: int
    default_probability: float
    risk_level: str
    recommended_action: str
    interest_rate: float
    confidence_interval: Dict[str, float]
    feature_importance: Dict[str, float]
    explanation: str
    model_version: str
    inference_time_ms: int


class BatchScoreRequest(BaseModel):
    """Batch scoring request."""
    applicant_ids: List[str]
    processing_mode: str = "sync"  # sync or async
    
    @validator('processing_mode')
    def validate_mode(cls, v):
        if v not in ['sync', 'async']:
            raise ValueError("Processing mode must be 'sync' or 'async'")
        return v


class ModelInfo(BaseModel):
    """Model information response."""
    model_version: str
    trained_date: str
    feature_count: int
    training_samples: int
    auc_roc: float
    status: str


def load_model(model_dir: str = "models/production"):
    """Load model from disk with caching."""
    if 'model' not in MODEL_CACHE:
        logger.info(f"Loading model from {model_dir}")
        
        from src.training.train_model import CreditScoringModel
        
        model_path = Path(model_dir)
        if not model_path.exists():
            raise FileNotFoundError(f"Model directory not found: {model_dir}")
        
        model = CreditScoringModel.load(model_dir)
        MODEL_CACHE['model'] = model
        MODEL_CACHE['load_time'] = datetime.now()
        
        logger.info("✅ Model loaded successfully")
    
    return MODEL_CACHE['model']


def fetch_applicant_data(applicant_id: str) -> Dict:
    """Fetch applicant data from database."""
    # TODO: Implement database query
    # For now, return mock data
    return {
        'age': 35,
        'annual_income': 75000,
        'years_employed': 8,
        'employment_type': 'full_time',
        'years_credit_history': 12,
        'num_credit_accounts': 5,
        'credit_score': 720,
        'past_defaults': 0,
        'payment_history_score': 85,
        'total_portfolio_value': 150000,
        'btc_pct': 20,
        'eth_pct': 30,
        'stablecoins_pct': 40,
        'other_pct': 10,
        'portfolio_volatility_30d': 18,
        'transaction_frequency_30d': 15,
        'average_transaction_size': 5000,
        'wallet_age_days': 730,
        'smart_contract_interactions': 25,
        'defi_experience_level': 70,
        'gas_fee_spending_30d': 250,
        'country': 'US',
        'loan_purpose': 'business'
    }


def calculate_confidence_interval(probability: float, n_samples: int = 1000) -> Dict[str, float]:
    """Calculate confidence interval for prediction."""
    # Simple approximation using binomial distribution
    std_error = np.sqrt(probability * (1 - probability) / n_samples)
    lower = max(0, probability - 1.96 * std_error)
    upper = min(1, probability + 1.96 * std_error)
    
    return {'lower': round(lower, 4), 'upper': round(upper, 4)}


def determine_risk_level(probability: float) -> str:
    """Determine risk level from default probability."""
    if probability < 0.05:
        return "VERY_LOW"
    elif probability < 0.10:
        return "LOW"
    elif probability < 0.20:
        return "MEDIUM"
    elif probability < 0.35:
        return "HIGH"
    else:
        return "VERY_HIGH"


def recommend_action(probability: float, risk_level: str) -> str:
    """Recommend action based on risk assessment."""
    if risk_level in ["VERY_LOW", "LOW"]:
        return "APPROVE"
    elif risk_level == "MEDIUM":
        return "MANUAL_REVIEW"
    else:
        return "DECLINE"


def calculate_interest_rate(probability: float, base_rate: float = 5.0) -> float:
    """Calculate risk-adjusted interest rate."""
    # Risk premium based on default probability
    risk_premium = probability * 30  # Up to 30% premium
    rate = base_rate + risk_premium
    return round(rate, 2)


def generate_explanation(data: Dict, probability: float, feature_importance: Dict) -> str:
    """Generate human-readable explanation."""
    top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]
    
    explanation = f"Default probability: {probability:.1%}. "
    
    if probability < 0.10:
        explanation += "Strong credit profile with "
    elif probability < 0.20:
        explanation += "Moderate credit profile with "
    else:
        explanation += "Weak credit profile with "
    
    feature_desc = []
    for feat, importance in top_features:
        if 'credit_score' in feat:
            feature_desc.append(f"credit score of {data.get('credit_score', 'N/A')}")
        elif 'portfolio' in feat:
            feature_desc.append("portfolio considerations")
        elif 'ltv' in feat:
            feature_desc.append("loan-to-value ratio")
    
    explanation += ", ".join(feature_desc) + "."
    
    return explanation


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "service": "LYNQ ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "predict": "/api/ml/credit-score",
            "batch": "/api/ml/batch-score",
            "info": "/api/ml/model/info",
            "health": "/api/ml/health"
        }
    }


@app.get("/api/ml/health")
def health_check():
    """Health check endpoint."""
    try:
        model = load_model()
        return {
            "status": "healthy",
            "model_loaded": model is not None,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@app.get("/api/ml/model/info", response_model=ModelInfo)
def get_model_info():
    """Get model information."""
    try:
        model = load_model()
        
        return ModelInfo(
            model_version="v1.0.0",
            trained_date="2026-01-03",
            feature_count=len(model.feature_engineer.feature_names) if model.feature_engineer.feature_names else 52,
            training_samples=100000,
            auc_roc=0.87,
            status="production"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/credit-score", response_model=CreditScoreResponse)
def predict_credit_score(request: CreditScoreRequest):
    """Predict credit score for an applicant."""
    start_time = time.time()
    
    try:
        # Load model
        model = load_model()
        
        # Fetch applicant data
        applicant_data = fetch_applicant_data(request.applicant_id)
        
        # Override with provided data
        if request.age:
            applicant_data['age'] = request.age
        if request.annual_income:
            applicant_data['annual_income'] = request.annual_income
        if request.credit_score:
            applicant_data['credit_score'] = request.credit_score
        if request.total_portfolio_value:
            applicant_data['total_portfolio_value'] = request.total_portfolio_value
        
        # Add loan-specific data
        applicant_data['requested_loan_amount'] = request.loan_amount
        applicant_data['requested_term_months'] = request.loan_term_months
        applicant_data['collateral_amount'] = request.collateral_amount
        applicant_data['collateral_type'] = request.collateral_type
        
        # Create DataFrame
        df = pd.DataFrame([applicant_data])
        
        # Transform features
        X = model.feature_engineer.transform(df)
        
        # Predict
        probability = model.predict_proba(X)[0]
        
        # Risk assessment
        risk_level = determine_risk_level(probability)
        action = recommend_action(probability, risk_level)
        interest_rate = calculate_interest_rate(probability)
        confidence_interval = calculate_confidence_interval(probability)
        
        # Feature importance (top 5)
        if hasattr(model, 'get_feature_importance'):
            importance_df = model.get_feature_importance(X.columns.tolist())
            top_features = importance_df.head(5)
            feature_importance = dict(zip(top_features['feature'], 
                                         top_features['importance'].round(2)))
        else:
            feature_importance = {}
        
        # Generate explanation
        explanation = generate_explanation(applicant_data, probability, feature_importance)
        
        # Calculate credit score (300-850 scale, inverse of probability)
        credit_score = int(850 - (probability * 550))
        credit_score = max(300, min(850, credit_score))
        
        # Calculate inference time
        inference_time_ms = int((time.time() - start_time) * 1000)
        
        return CreditScoreResponse(
            applicant_id=request.applicant_id,
            credit_score=credit_score,
            default_probability=round(probability, 4),
            risk_level=risk_level,
            recommended_action=action,
            interest_rate=interest_rate,
            confidence_interval=confidence_interval,
            feature_importance=feature_importance,
            explanation=explanation,
            model_version="v1.0.0",
            inference_time_ms=inference_time_ms
        )
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/batch-score")
def batch_predict(request: BatchScoreRequest):
    """Batch prediction endpoint."""
    if request.processing_mode == "async":
        # TODO: Implement async processing with job queue
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        return {
            "batch_id": batch_id,
            "status": "processing",
            "estimated_completion": datetime.now().isoformat(),
            "applicant_count": len(request.applicant_ids)
        }
    else:
        # Synchronous processing
        results = []
        for applicant_id in request.applicant_ids:
            try:
                req = CreditScoreRequest(
                    applicant_id=applicant_id,
                    loan_amount=50000,
                    loan_term_months=12,
                    collateral_amount=75000,
                    collateral_type="USDC"
                )
                result = predict_credit_score(req)
                results.append(result.dict())
            except Exception as e:
                results.append({
                    "applicant_id": applicant_id,
                    "error": str(e)
                })
        
        return {
            "results": results,
            "total_processed": len(results)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
