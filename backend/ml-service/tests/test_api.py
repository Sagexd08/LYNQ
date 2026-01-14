"""Tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data
    assert "model_version" in data
    assert "uptime_seconds" in data


def test_model_info_without_api_key():
    """Test model info endpoint without API key."""
    response = client.get("/model/info")
    assert response.status_code == 422  # Missing header


def test_model_info_with_invalid_api_key():
    """Test model info endpoint with invalid API key."""
    response = client.get("/model/info", headers={"X-API-KEY": "invalid-key"})
    assert response.status_code == 401


def test_credit_score_without_api_key():
    """Test credit score endpoint without API key."""
    response = client.post("/api/ml/credit-score", json={
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92",
        "wallet_age_days": 365,
        "total_transactions": 150,
        "total_volume_usd": 50000.0,
        "defi_interactions": 25,
        "loan_amount": 1000.0,
        "collateral_value_usd": 1500.0,
        "term_months": 3,
    })
    assert response.status_code == 422  # Missing header


def test_credit_score_with_valid_request(sample_request):
    """Test credit score endpoint with valid request."""
    response = client.post(
        "/api/ml/credit-score",
        json=sample_request.dict(),
        headers={"X-API-KEY": settings.API_KEY}
    )
    assert response.status_code == 200
    data = response.json()
    assert "credit_score" in data
    assert "risk_level" in data
    assert "default_probability" in data
    assert "recommended_action" in data
    assert "processing_time_ms" in data
    assert data["credit_score"] >= 0
    assert data["credit_score"] <= 1000


def test_credit_score_invalid_request():
    """Test credit score endpoint with invalid request."""
    response = client.post(
        "/api/ml/credit-score",
        json={"wallet_address": "invalid"},
        headers={"X-API-KEY": settings.API_KEY}
    )
    assert response.status_code == 422  # Validation error
