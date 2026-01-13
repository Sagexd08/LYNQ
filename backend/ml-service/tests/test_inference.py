"""Tests for inference service."""
import pytest
import numpy as np
from app.services.inference import InferenceService
from app.schemas.credit import CreditScoreRequest, RiskLevel, RecommendedAction


def test_rule_based_prediction(sample_request):
    """Test rule-based prediction when model is not available."""
    service = InferenceService()
    service.model = None
    
    result = service.predict(sample_request)
    
    assert result is not None
    assert result.credit_score >= 100
    assert result.credit_score <= 1000
    assert result.risk_level in RiskLevel
    assert result.recommended_action in RecommendedAction
    assert result.default_probability >= 0
    assert result.default_probability <= 1
    assert result.fraud_score >= 0
    assert result.fraud_score <= 1
    assert result.is_fallback == False


def test_ml_prediction_with_mock_model(sample_request, mock_model, mock_scaler):
    """Test ML prediction with mock model."""
    service = InferenceService()
    service.model = mock_model
    service.scaler = mock_scaler
    
    result = service.predict(sample_request)
    
    assert result is not None
    assert result.credit_score >= 100
    assert result.credit_score <= 1000
    assert result.risk_level in RiskLevel
    assert result.default_probability >= 0
    assert result.default_probability <= 1


def test_fraud_score_calculation(sample_request):
    """Test fraud score calculation."""
    service = InferenceService()
    

    sample_request.wallet_age_days = 5
    sample_request.total_transactions = 2
    fraud_score = service._calculate_fraud_score(sample_request)
    assert fraud_score > 0.5
    

    sample_request.wallet_age_days = 365
    sample_request.total_transactions = 100
    fraud_score = service._calculate_fraud_score(sample_request)
    assert fraud_score < 0.3


def test_anomaly_score_calculation(sample_request):
    """Test anomaly score calculation."""
    service = InferenceService()
    
    # Normal request
    sample_request.loan_amount = 1000
    sample_request.collateral_value_usd = 1500
    anomaly_score = service._calculate_anomaly_score(sample_request)
    assert anomaly_score < 0.5
    
    # Anomalous request (loan > collateral)
    sample_request.loan_amount = 5000
    sample_request.collateral_value_usd = 1000
    anomaly_score = service._calculate_anomaly_score(sample_request)
    assert anomaly_score > 0.3


def test_feature_extraction(sample_request):
    """Test feature extraction."""
    service = InferenceService()
    features = service._extract_features(sample_request)
    
    assert len(features) == 12
    assert all(isinstance(f, (int, float)) for f in features)
    assert features[0] == sample_request.wallet_age_days
    assert features[11] > 0
