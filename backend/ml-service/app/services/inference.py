import logging
import time
from typing import Optional
from app.schemas.credit import (
    CreditScoreRequest,
    CreditScoreResponse,
    RiskLevel,
    RecommendedAction,
)
from app.models.loader import model_loader
from app.core.aws import get_cloudwatch_metrics

logger = logging.getLogger(__name__)


class InferenceService:
    def __init__(self):
        self.model = None
        self.scaler = None
        
    def predict(self, request: CreditScoreRequest) -> Optional[CreditScoreResponse]:
        self.model = model_loader.get_model()
        self.scaler = model_loader.get_scaler()
        
        start_time = time.time()
        
        if self.model is None:
            result = self._rule_based_prediction(request)
            self._log_inference_metrics("rule_based", start_time, result is not None)
            return result
        
        try:
            features = self._extract_features(request)
            
            if self.scaler:
                features = self.scaler.transform([features])[0]
            
            prediction = self.model.predict([features])[0]
            probability = self.model.predict_proba([features])[0]
            
            result = self._format_prediction(prediction, probability, request)
            self._log_inference_metrics("ml_model", start_time, result is not None)
            return result
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            self._log_inference_metrics("ml_model", start_time, False)
            return None
    
    def _log_inference_metrics(self, model_type: str, start_time: float, success: bool):
        """Log inference metrics to CloudWatch"""
        try:
            latency_ms = (time.time() - start_time) * 1000
            metrics = get_cloudwatch_metrics()
            metrics.log_inference_metric(model_type, latency_ms, success)
        except Exception as e:
            logger.warning(f"Failed to log inference metrics: {e}")
    
    def _rule_based_prediction(self, request: CreditScoreRequest) -> CreditScoreResponse:
        collateral_ratio = request.collateral_value_usd / request.loan_amount if request.loan_amount > 0 else 0
        
        base_score = 500
        
        age_score = min(request.wallet_age_days / 365 * 100, 100)
        base_score += age_score
        
        tx_score = min(request.total_transactions / 100 * 50, 50)
        base_score += tx_score
        
        defi_score = min(request.defi_interactions / 20 * 50, 50)
        base_score += defi_score
        
        reputation_bonus = (request.reputation_score - 50) * 2
        base_score += reputation_bonus
        
        if request.previous_loans > 0:
            success_rate = request.successful_repayments / request.previous_loans
            base_score += success_rate * 100
        
        base_score -= request.defaults * 100
        
        if collateral_ratio >= 1.5:
            base_score += 100
        elif collateral_ratio >= 1.0:
            base_score += 50
        
        credit_score = max(100, min(1000, int(base_score)))
        
        fraud_score = self._calculate_fraud_score(request)
        anomaly_score = self._calculate_anomaly_score(request)
        
        if credit_score >= 800:
            risk_level = RiskLevel.VERY_LOW
            default_prob = 0.02
        elif credit_score >= 700:
            risk_level = RiskLevel.LOW
            default_prob = 0.05
        elif credit_score >= 600:
            risk_level = RiskLevel.MEDIUM
            default_prob = 0.10
        elif credit_score >= 500:
            risk_level = RiskLevel.HIGH
            default_prob = 0.20
        else:
            risk_level = RiskLevel.VERY_HIGH
            default_prob = 0.35
        
        if fraud_score > 0.7 or request.defaults > 0:
            recommended_action = RecommendedAction.REJECT
        elif fraud_score > 0.5 or anomaly_score > 0.5:
            recommended_action = RecommendedAction.MANUAL_REVIEW
        elif risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            recommended_action = RecommendedAction.APPROVE_WITH_CONDITIONS
        elif risk_level == RiskLevel.MEDIUM:
            recommended_action = RecommendedAction.APPROVE_WITH_CONDITIONS
        else:
            recommended_action = RecommendedAction.APPROVE
        
        base_rate = 5.0
        risk_premium = {
            RiskLevel.VERY_LOW: 0,
            RiskLevel.LOW: 2,
            RiskLevel.MEDIUM: 5,
            RiskLevel.HIGH: 10,
            RiskLevel.VERY_HIGH: 15,
        }
        interest_rate = base_rate + risk_premium[risk_level]
        
        max_loan = request.collateral_value_usd * 0.8
        if risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            max_loan *= 0.5
        elif risk_level == RiskLevel.MEDIUM:
            max_loan *= 0.75
        
        return CreditScoreResponse(
            credit_score=credit_score,
            fraud_score=fraud_score,
            anomaly_score=anomaly_score,
            risk_level=risk_level,
            default_probability=default_prob,
            recommended_action=recommended_action,
            interest_rate_suggestion=interest_rate,
            max_loan_amount=max_loan,
            model_version=model_loader.model_version,
            is_fallback=False,
        )
    
    def _calculate_fraud_score(self, request: CreditScoreRequest) -> float:
        score = 0.0
        
        if request.wallet_age_days < 7:
            score += 0.4
        elif request.wallet_age_days < 30:
            score += 0.2
        
        if request.total_transactions < 5:
            score += 0.3
        
        if request.defaults > 0:
            score += min(request.defaults * 0.2, 0.4)
        
        return min(score, 1.0)
    
    def _calculate_anomaly_score(self, request: CreditScoreRequest) -> float:
        score = 0.0
        
        if request.total_transactions > 0:
            avg_tx_value = request.total_volume_usd / request.total_transactions
            if request.loan_amount > avg_tx_value * 10:
                score += 0.3
        
        if request.collateral_value_usd < request.loan_amount:
            score += 0.4
        
        return min(score, 1.0)
    
    def _extract_features(self, request: CreditScoreRequest) -> list:
        collateral_ratio = request.collateral_value_usd / request.loan_amount if request.loan_amount > 0 else 0
        
        return [
            request.wallet_age_days,
            request.total_transactions,
            request.total_volume_usd,
            request.defi_interactions,
            request.loan_amount,
            request.collateral_value_usd,
            request.term_months,
            request.previous_loans,
            request.successful_repayments,
            request.defaults,
            request.reputation_score,
            collateral_ratio,
        ]
    
    def _format_prediction(self, prediction, probability, request: CreditScoreRequest) -> CreditScoreResponse:
        """Format ML model prediction into CreditScoreResponse."""
        # prediction is binary (0 or 1), probability is array [prob_no_default, prob_default]
        default_probability = float(probability[1]) if len(probability) > 1 else float(probability[0])
        
        # Calculate credit score from default probability (inverse relationship)
        credit_score = int((1 - default_probability) * 900 + 100)  # Scale to 100-1000
        
        # Determine risk level from default probability
        if default_probability < 0.10:
            risk_level = RiskLevel.VERY_LOW
        elif default_probability < 0.25:
            risk_level = RiskLevel.LOW
        elif default_probability < 0.50:
            risk_level = RiskLevel.MEDIUM
        elif default_probability < 0.75:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.VERY_HIGH
        
        # Calculate fraud and anomaly scores
        fraud_score = self._calculate_fraud_score(request)
        anomaly_score = self._calculate_anomaly_score(request)
        
        # Determine recommended action
        if fraud_score > 0.7 or default_probability > 0.75:
            recommended_action = RecommendedAction.REJECT
        elif fraud_score > 0.5 or anomaly_score > 0.5 or risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            recommended_action = RecommendedAction.MANUAL_REVIEW
        elif risk_level == RiskLevel.MEDIUM:
            recommended_action = RecommendedAction.APPROVE_WITH_CONDITIONS
        else:
            recommended_action = RecommendedAction.APPROVE
        
        # Calculate interest rate
        base_rate = 5.0
        risk_premium = {
            RiskLevel.VERY_LOW: 0,
            RiskLevel.LOW: 2,
            RiskLevel.MEDIUM: 5,
            RiskLevel.HIGH: 10,
            RiskLevel.VERY_HIGH: 15,
        }
        interest_rate = base_rate + risk_premium[risk_level]
        
        # Calculate max loan amount
        max_loan = request.collateral_value_usd * 0.8
        if risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
            max_loan *= 0.5
        elif risk_level == RiskLevel.MEDIUM:
            max_loan *= 0.75
        
        return CreditScoreResponse(
            credit_score=credit_score,
            fraud_score=fraud_score,
            anomaly_score=anomaly_score,
            risk_level=risk_level,
            default_probability=default_probability,
            recommended_action=recommended_action,
            interest_rate_suggestion=interest_rate,
            max_loan_amount=max_loan,
            model_version=model_loader.model_version,
            is_fallback=False,
        )
