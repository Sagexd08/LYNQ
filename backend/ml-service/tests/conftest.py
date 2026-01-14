"""Pytest configuration and fixtures."""
import pytest
import os
import sys
from unittest.mock import Mock, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.credit import CreditScoreRequest
from app.models.loader import ModelLoader


@pytest.fixture
def sample_request():
    """Sample credit score request for testing."""
    return CreditScoreRequest(
        wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92",
        wallet_age_days=365,
        total_transactions=150,
        total_volume_usd=50000.0,
        defi_interactions=25,
        loan_amount=1000.0,
        collateral_value_usd=1500.0,
        term_months=3,
        previous_loans=2,
        successful_repayments=2,
        defaults=0,
        reputation_score=75,
    )


@pytest.fixture
def mock_model():
    """Mock ML model for testing."""
    model = Mock()
    model.predict.return_value = [0]  # No default
    model.predict_proba.return_value = [[0.9, 0.1]]  # 10% default probability
    return model


@pytest.fixture
def mock_scaler():
    """Mock scaler for testing."""
    scaler = Mock()
    scaler.transform.return_value = [[0.5] * 12]
    return scaler


@pytest.fixture
def mock_model_loader(mock_model, mock_scaler):
    """Mock model loader for testing."""
    loader = Mock(spec=ModelLoader)
    loader.get_model.return_value = mock_model
    loader.get_scaler.return_value = mock_scaler
    loader.is_loaded = True
    loader.model_version = "v1.0.0-test"
    loader.get_feature_names.return_value = [
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
        "collateral_ratio",
    ]
    loader.get_feature_config.return_value = {
        "features": loader.get_feature_names(),
        "version": "v1.0.0-test",
    }
    return loader
