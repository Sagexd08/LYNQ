"""Tests for fallback service."""
import pytest
from app.services.fallback import FallbackService
from app.schemas.credit import CreditScoreRequest, RiskLevel, RecommendedAction


def test_fallback_scoring(sample_request):
    """Test fallback rule-based scoring."""
    service = FallbackService()
    result = service.calculate_score(sample_request)
    
    assert result is not None
    assert result.credit_score >= 100
    assert result.credit_score <= 1000
    assert result.risk_level in RiskLevel
    assert result.recommended_action in RecommendedAction
    assert result.default_probability >= 0
    assert result.default_probability <= 1
    assert result.is_fallback == True
    assert result.model_version == "fallback-v1.0"


def test_fallback_high_risk(sample_request):
    """Test fallback scoring for high-risk scenario."""
    service = FallbackService()
    
    # High risk: new wallet, low collateral, defaults
    sample_request.wallet_age_days = 5
    sample_request.collateral_value_usd = 500
    sample_request.defaults = 2
    
    result = service.calculate_score(sample_request)
    
    assert result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]
    assert result.recommended_action in [RecommendedAction.REJECT, RecommendedAction.MANUAL_REVIEW]


def test_fallback_low_risk(sample_request):
    """Test fallback scoring for low-risk scenario."""
    service = FallbackService()
    

    sample_request.wallet_age_days = 730
    sample_request.collateral_value_usd = 3000
    sample_request.reputation_score = 90
    sample_request.successful_repayments = 5
    sample_request.defaults = 0
    
    result = service.calculate_score(sample_request)
    
    assert result.risk_level in [RiskLevel.VERY_LOW, RiskLevel.LOW]
    assert result.recommended_action in [RecommendedAction.APPROVE, RecommendedAction.APPROVE_WITH_CONDITIONS]
