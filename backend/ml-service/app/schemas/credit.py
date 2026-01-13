from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class RiskLevel(str, Enum):
    VERY_LOW = "VERY_LOW"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


class RecommendedAction(str, Enum):
    APPROVE = "APPROVE"
    APPROVE_WITH_CONDITIONS = "APPROVE_WITH_CONDITIONS"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    REJECT = "REJECT"


class CreditScoreRequest(BaseModel):
    wallet_address: str = Field(..., description="User's wallet address")
    
    wallet_age_days: int = Field(..., ge=0, description="Age of wallet in days")
    total_transactions: int = Field(..., ge=0, description="Total wallet transactions")
    total_volume_usd: float = Field(..., ge=0, description="Total transaction volume in USD")
    defi_interactions: int = Field(..., ge=0, description="Number of DeFi protocol interactions")
    
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in USD")
    collateral_value_usd: float = Field(..., ge=0, description="Total collateral value in USD")
    term_months: int = Field(..., ge=1, le=36, description="Loan term in months")
    
    previous_loans: int = Field(default=0, ge=0, description="Number of previous loans")
    successful_repayments: int = Field(default=0, ge=0, description="Number of successful repayments")
    defaults: int = Field(default=0, ge=0, description="Number of defaults")
    reputation_score: int = Field(default=50, ge=0, le=100, description="Current reputation score")
    
    class Config:
        json_schema_extra = {
            "example": {
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92",
                "wallet_age_days": 365,
                "total_transactions": 150,
                "total_volume_usd": 50000.0,
                "defi_interactions": 25,
                "loan_amount": 1000.0,
                "collateral_value_usd": 1500.0,
                "term_months": 3,
                "previous_loans": 2,
                "successful_repayments": 2,
                "defaults": 0,
                "reputation_score": 75
            }
        }


class FactorExplanation(BaseModel):
    feature: str
    impact: str
    value: float
    contribution: float


class CreditScoreResponse(BaseModel):
    credit_score: int = Field(..., ge=0, le=1000, description="Credit score (0-1000)")
    fraud_score: float = Field(..., ge=0, le=1, description="Fraud probability (0-1)")
    anomaly_score: float = Field(..., ge=0, le=1, description="Anomaly score (0-1)")
    risk_level: RiskLevel
    default_probability: float = Field(..., ge=0, le=1, description="Default probability")
    recommended_action: RecommendedAction
    interest_rate_suggestion: float = Field(..., description="Suggested interest rate %")
    max_loan_amount: float = Field(..., description="Maximum recommended loan amount")
    
    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="Model confidence")
    top_factors: Optional[List[FactorExplanation]] = Field(None, description="Top factors influencing decision")
    model_version: Optional[str] = Field(None, description="ML model version used")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")
    is_fallback: bool = Field(default=False, description="Whether fallback rules were used")
    
    class Config:
        json_schema_extra = {
            "example": {
                "credit_score": 750,
                "fraud_score": 0.05,
                "anomaly_score": 0.1,
                "risk_level": "LOW",
                "default_probability": 0.08,
                "recommended_action": "APPROVE",
                "interest_rate_suggestion": 8.5,
                "max_loan_amount": 5000.0,
                "confidence_score": 0.92,
                "top_factors": [
                    {"feature": "reputation_score", "impact": "positive", "value": 75, "contribution": 0.25},
                    {"feature": "wallet_age_days", "impact": "positive", "value": 365, "contribution": 0.2},
                    {"feature": "successful_repayments", "impact": "positive", "value": 2, "contribution": 0.15}
                ],
                "model_version": "v1.0.0",
                "processing_time_ms": 45,
                "is_fallback": False
            }
        }
