"""
Tests for Synthetic Data Generator
"""

import pytest
import pandas as pd
import numpy as np
from src.data.synthetic_generator import SyntheticDataGenerator


def test_generator_initialization():
    """Test generator initialization."""
    generator = SyntheticDataGenerator(seed=42)
    assert generator.seed == 42
    assert generator.distributions is not None


def test_generate_demographics():
    """Test demographic generation."""
    generator = SyntheticDataGenerator(seed=42)
    df = generator.generate_demographics(n_samples=100)
    
    assert len(df) == 100
    assert 'age' in df.columns
    assert 'country' in df.columns
    assert 'employment_type' in df.columns
    assert df['age'].min() >= 18
    assert df['age'].max() <= 75


def test_complete_generation():
    """Test complete synthetic data generation."""
    generator = SyntheticDataGenerator(seed=42)
    df = generator.generate(n_samples=1000, default_rate_target=0.15)
    
    # Check shape
    assert len(df) == 1000
    assert len(df.columns) > 30  # Should have many features
    
    # Check target column
    assert 'default_in_12_months' in df.columns
    assert df['default_in_12_months'].isin([0, 1]).all()
    
    # Check default rate close to target
    actual_default_rate = df['default_in_12_months'].mean()
    assert abs(actual_default_rate - 0.15) < 0.05  # Within 5%
    
    # Check data types
    assert df['age'].dtype in [np.int32, np.int64]
    assert df['annual_income'].dtype in [np.int32, np.int64]
    assert df['credit_score'].dtype in [np.int32, np.int64]
    
    # Check ranges
    assert df['credit_score'].min() >= 300
    assert df['credit_score'].max() <= 850
    assert df['risk_score'].min() >= 0
    assert df['risk_score'].max() <= 100


def test_reproducibility():
    """Test that same seed produces same results."""
    generator1 = SyntheticDataGenerator(seed=42)
    df1 = generator1.generate(n_samples=100)
    
    generator2 = SyntheticDataGenerator(seed=42)
    df2 = generator2.generate(n_samples=100)
    
    # Should be identical
    pd.testing.assert_frame_equal(
        df1.drop(columns=['generated_at', 'generator_version']),
        df2.drop(columns=['generated_at', 'generator_version'])
    )


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
