import logging
from app.schemas.credit import (
    CreditScoreRequest,
    CreditScoreResponse,
    RiskLevel,
    RecommendedAction,
)

logger = logging.getLogger(__name__)


class FallbackService:
    def calculate_score(self, request: CreditScoreRequest) -> CreditScoreResponse:
        logger.info("Using fallback rule-based scoring")
        
        collateral_ratio = (
            request.collateral_value_usd / request.loan_amount
            if request.loan_amount > 0
            else 0
        )
        
        score = 500
        
        if request.wallet_age_days >= 365:
            score += 150
        elif request.wallet_age_days >= 180:
            score += 100
        elif request.wallet_age_days >= 90:
            score += 50
        elif request.wallet_age_days >= 30:
            score += 25
        else:
            score -= 50
        
        if request.reputation_score >= 80:
            score += 150
        elif request.reputation_score >= 60:
            score += 75
        elif request.reputation_score >= 40:
            score += 0
        else:
            score -= 100
        
        if collateral_ratio >= 2.0:
            score += 100
        elif collateral_ratio >= 1.5:
            score += 75
        elif collateral_ratio >= 1.0:
            score += 25
        else:
            score -= 100
        
        if request.previous_loans > 0 and request.defaults == 0:
            score += 50 * min(request.successful_repayments, 3)
        
        score -= request.defaults * 150
        
        score = max(100, min(1000, score))
        
        if score >= 800:
            risk_level = RiskLevel.VERY_LOW
            default_prob = 0.02
            interest_rate = 5.0
        elif score >= 700:
            risk_level = RiskLevel.LOW
            default_prob = 0.05
            interest_rate = 7.5
        elif score >= 600:
            risk_level = RiskLevel.MEDIUM
            default_prob = 0.12
            interest_rate = 10.0
        elif score >= 500:
            risk_level = RiskLevel.HIGH
            default_prob = 0.22
            interest_rate = 15.0
        else:
            risk_level = RiskLevel.VERY_HIGH
            default_prob = 0.40
            interest_rate = 20.0
        
        fraud_score = 0.0
        if request.wallet_age_days < 7:
            fraud_score += 0.5
        if request.total_transactions < 3:
            fraud_score += 0.3
        if request.defaults > 2:
            fraud_score += 0.4
        fraud_score = min(fraud_score, 1.0)
        
        if fraud_score > 0.7 or request.defaults >= 2:
            action = RecommendedAction.REJECT
        elif fraud_score > 0.4 or risk_level == RiskLevel.VERY_HIGH:
            action = RecommendedAction.MANUAL_REVIEW
        elif risk_level in [RiskLevel.HIGH, RiskLevel.MEDIUM]:
            action = RecommendedAction.APPROVE_WITH_CONDITIONS
        else:
            action = RecommendedAction.APPROVE
        
        max_loan = request.collateral_value_usd * 0.75
        if risk_level == RiskLevel.VERY_HIGH:
            max_loan *= 0.25
        elif risk_level == RiskLevel.HIGH:
            max_loan *= 0.5
        elif risk_level == RiskLevel.MEDIUM:
            max_loan *= 0.75
        
        return CreditScoreResponse(
            credit_score=score,
            fraud_score=fraud_score,
            anomaly_score=0.1,
            risk_level=risk_level,
            default_probability=default_prob,
            recommended_action=action,
            interest_rate_suggestion=interest_rate,
            max_loan_amount=max_loan,
            model_version="fallback-v1.0",
            is_fallback=True,
        )
