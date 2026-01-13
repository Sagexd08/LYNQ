import logging
from typing import Optional, List
from dataclasses import dataclass
import numpy as np
from app.schemas.credit import CreditScoreRequest, FactorExplanation
from app.core.config import settings
from app.models.loader import model_loader

logger = logging.getLogger(__name__)

# Try to import SHAP
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP not available, using rule-based explanations")


@dataclass
class ExplanationResult:
    top_factors: List[FactorExplanation]
    confidence: float


class ExplainabilityService:
    def __init__(self):
        self._shap_explainer = None
        self._model = None
        
    @property
    def is_enabled(self) -> bool:
        return settings.ENABLE_SHAP
    
    def explain(self, request: CreditScoreRequest) -> ExplanationResult:
        """Generate explanations using SHAP if available, otherwise use rule-based."""
        if settings.ENABLE_SHAP and SHAP_AVAILABLE:
            try:
                return self._explain_with_shap(request)
            except Exception as e:
                logger.warning(f"SHAP explanation failed: {e}, falling back to rule-based")
        
        # Fallback to rule-based explanations
        factors = self._calculate_feature_importance(request)
        confidence = self._calculate_confidence(request)
        
        return ExplanationResult(
            top_factors=factors[:3],
            confidence=confidence,
        )
    
    def _explain_with_shap(self, request: CreditScoreRequest) -> ExplanationResult:
        """Generate SHAP-based explanations."""
        model = model_loader.get_model()
        scaler = model_loader.get_scaler()
        
        if model is None:
            raise ValueError("Model not loaded, cannot use SHAP")
        
        # Extract features (duplicate logic from inference service to avoid circular import)
        collateral_ratio = request.collateral_value_usd / request.loan_amount if request.loan_amount > 0 else 0
        features = np.array([[
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
        ]])
        
        # Scale if scaler available
        if scaler:
            features = scaler.transform(features)
        
        # Initialize SHAP explainer if needed
        if self._shap_explainer is None:
            # Use TreeExplainer for tree-based models
            if hasattr(model, 'tree_') or hasattr(model, 'estimators_'):
                self._shap_explainer = shap.TreeExplainer(model)
            else:
                # Use KernelExplainer as fallback
                self._shap_explainer = shap.KernelExplainer(
                    model.predict_proba,
                    features[:1]  # Use single sample as background
                )
        
        # Calculate SHAP values
        shap_values = self._shap_explainer.shap_values(features)
        
        # Handle multi-class output
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Use positive class
        
        # Get feature names
        feature_names = model_loader.get_feature_names()
        
        # Create factor explanations
        factors = []
        feature_values = {
            'wallet_age_days': request.wallet_age_days,
            'total_transactions': request.total_transactions,
            'total_volume_usd': request.total_volume_usd,
            'defi_interactions': request.defi_interactions,
            'loan_amount': request.loan_amount,
            'collateral_value_usd': request.collateral_value_usd,
            'term_months': request.term_months,
            'previous_loans': request.previous_loans,
            'successful_repayments': request.successful_repayments,
            'defaults': request.defaults,
            'reputation_score': request.reputation_score,
            'collateral_ratio': request.collateral_value_usd / request.loan_amount if request.loan_amount > 0 else 0,
        }
        
        for i, (name, shap_value) in enumerate(zip(feature_names, shap_values[0])):
            feature_value = feature_values.get(name, 0.0)
            factors.append(FactorExplanation(
                feature=name,
                impact="positive" if shap_value > 0 else "negative",
                value=float(feature_value),
                contribution=float(abs(shap_value))
            ))
        
        # Sort by contribution and take top 3
        factors.sort(key=lambda x: x.contribution, reverse=True)
        top_factors = factors[:3]
        
        # Calculate confidence from SHAP values variance
        confidence = 1.0 - min(np.std(shap_values[0]) / (np.abs(shap_values[0]).mean() + 1e-6), 1.0)
        confidence = max(0.5, min(0.99, confidence))
        
        return ExplanationResult(
            top_factors=top_factors,
            confidence=confidence,
        )
    
    def _calculate_feature_importance(self, request: CreditScoreRequest) -> List[FactorExplanation]:
        factors = []
        
        factors.append(FactorExplanation(
            feature="reputation_score",
            impact="positive" if request.reputation_score >= 50 else "negative",
            value=request.reputation_score,
            contribution=abs(request.reputation_score - 50) / 100 * 0.3
        ))
        
        wallet_age_impact = "positive" if request.wallet_age_days >= 90 else "negative"
        factors.append(FactorExplanation(
            feature="wallet_age_days",
            impact=wallet_age_impact,
            value=request.wallet_age_days,
            contribution=min(request.wallet_age_days / 365 * 0.25, 0.25)
        ))
        
        collateral_ratio = request.collateral_value_usd / request.loan_amount if request.loan_amount > 0 else 0
        factors.append(FactorExplanation(
            feature="collateral_ratio",
            impact="positive" if collateral_ratio >= 1.0 else "negative",
            value=collateral_ratio,
            contribution=min(collateral_ratio * 0.2, 0.3)
        ))
        
        if request.successful_repayments > 0:
            factors.append(FactorExplanation(
                feature="successful_repayments",
                impact="positive",
                value=request.successful_repayments,
                contribution=min(request.successful_repayments * 0.1, 0.2)
            ))
        
        if request.defaults > 0:
            factors.append(FactorExplanation(
                feature="defaults",
                impact="negative",
                value=request.defaults,
                contribution=min(request.defaults * 0.3, 0.5)
            ))
        
        factors.append(FactorExplanation(
            feature="defi_interactions",
            impact="positive" if request.defi_interactions >= 10 else "neutral",
            value=request.defi_interactions,
            contribution=min(request.defi_interactions / 50 * 0.15, 0.15)
        ))
        
        factors.sort(key=lambda x: abs(x.contribution), reverse=True)
        
        return factors
    
    def _calculate_confidence(self, request: CreditScoreRequest) -> float:
        confidence = 0.5
        
        if request.wallet_age_days > 180:
            confidence += 0.15
        
        if request.total_transactions > 50:
            confidence += 0.1
        
        if request.previous_loans > 0:
            confidence += 0.15
        
        if request.collateral_value_usd >= request.loan_amount:
            confidence += 0.1
        
        return min(confidence, 0.99)
