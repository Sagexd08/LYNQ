"""
Feature Engineering Pipeline

Transforms raw borrower data into ML-ready features.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from typing import List, Tuple
from loguru import logger


class FeatureEngineer:
    """Feature engineering for credit scoring."""
    
    def __init__(self):
        self.scaler = None
        self.feature_names = None
        
    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create engineered features from raw data."""
        logger.info("Engineering features...")
        
        df = df.copy()
        
        # Interaction features
        df['income_to_loan_ratio'] = df['annual_income'] / (df['requested_loan_amount'] + 1)
        df['portfolio_to_loan_ratio'] = df['total_portfolio_value'] / (df['requested_loan_amount'] + 1)
        df['collateral_to_portfolio_ratio'] = df['collateral_amount'] / (df['total_portfolio_value'] + 1)
        
        # Temporal features
        df['wallet_age_years'] = df['wallet_age_days'] / 365
        df['credit_history_to_age_ratio'] = df['years_credit_history'] / (df['age'] + 1)
        df['employment_stability'] = df['years_employed'] / (df['age'] - 18 + 1)
        
        # Risk indicators
        df['high_leverage_flag'] = (df['ltv_ratio'] > 70).astype(int)
        df['high_volatility_flag'] = (df['portfolio_volatility_30d'] > 30).astype(int)
        df['low_credit_flag'] = (df['credit_score'] < 600).astype(int)
        df['high_debt_to_income_flag'] = (df['debt_to_income_ratio'] > 40).astype(int)
        
        # Experience indicators
        df['experienced_defi_user'] = (df['defi_experience_level'] > 60).astype(int)
        df['active_trader'] = (df['transaction_frequency_30d'] > 20).astype(int)
        df['long_term_holder'] = (df['wallet_age_days'] > 365).astype(int)
        
        # Portfolio composition risk
        df['volatile_asset_pct'] = df['btc_pct'] + df['eth_pct'] + df['other_pct']
        df['safe_asset_ratio'] = df['stablecoins_pct'] / 100
        
        # Credit utilization
        df['accounts_per_year'] = df['num_credit_accounts'] / (df['years_credit_history'] + 1)
        df['defaults_per_account'] = df['past_defaults'] / (df['num_credit_accounts'] + 1)
        
        # Loan characteristics
        df['loan_to_income_months'] = df['requested_loan_amount'] / (df['annual_income'] / 12)
        df['monthly_payment_estimate'] = df['requested_loan_amount'] / df['requested_term_months']
        df['payment_to_income_ratio'] = df['monthly_payment_estimate'] / (df['annual_income'] / 12)
        
        # Activity metrics
        df['avg_transaction_to_portfolio'] = df['average_transaction_size'] / (df['total_portfolio_value'] + 1)
        df['gas_per_transaction'] = df['gas_fee_spending_30d'] / (df['transaction_frequency_30d'] + 1)
        
        # Polynomial features for key variables
        df['credit_score_squared'] = df['credit_score'] ** 2
        df['ltv_squared'] = df['ltv_ratio'] ** 2
        df['volatility_squared'] = df['portfolio_volatility_30d'] ** 2
        
        # Log transformations for skewed features
        df['log_annual_income'] = np.log1p(df['annual_income'])
        df['log_loan_amount'] = np.log1p(df['requested_loan_amount'])
        df['log_portfolio_value'] = np.log1p(df['total_portfolio_value'])
        
        logger.info(f"✅ Created {len(df.columns)} total features")
        return df
    
    def get_feature_columns(self) -> Tuple[List[str], List[str]]:
        """Get categorical and numerical feature columns."""
        
        categorical_features = [
            'country',
            'employment_type',
            'loan_purpose',
            'collateral_type'
        ]
        
        numerical_features = [
            # Demographics
            'age',
            'years_employed',
            'employment_stability',
            
            # Credit history
            'annual_income',
            'log_annual_income',
            'years_credit_history',
            'num_credit_accounts',
            'credit_score',
            'credit_score_squared',
            'past_defaults',
            'payment_history_score',
            'credit_history_to_age_ratio',
            'accounts_per_year',
            'defaults_per_account',
            
            # Portfolio
            'total_portfolio_value',
            'log_portfolio_value',
            'btc_pct',
            'eth_pct',
            'stablecoins_pct',
            'other_pct',
            'portfolio_volatility_30d',
            'volatility_squared',
            'volatile_asset_pct',
            'safe_asset_ratio',
            
            # On-chain behavior
            'transaction_frequency_30d',
            'average_transaction_size',
            'wallet_age_days',
            'wallet_age_years',
            'smart_contract_interactions',
            'defi_experience_level',
            'gas_fee_spending_30d',
            'gas_per_transaction',
            'avg_transaction_to_portfolio',
            
            # Loan features
            'requested_loan_amount',
            'log_loan_amount',
            'collateral_amount',
            'requested_term_months',
            'ltv_ratio',
            'ltv_squared',
            'debt_to_income_ratio',
            'income_to_loan_ratio',
            'portfolio_to_loan_ratio',
            'collateral_to_portfolio_ratio',
            'loan_to_income_months',
            'monthly_payment_estimate',
            'payment_to_income_ratio',
            
            # Risk indicators
            'risk_score',
            'high_leverage_flag',
            'high_volatility_flag',
            'low_credit_flag',
            'high_debt_to_income_flag',
            'experienced_defi_user',
            'active_trader',
            'long_term_holder',
        ]
        
        return categorical_features, numerical_features
    
    def prepare_for_training(
        self, 
        df: pd.DataFrame,
        target_col: str = 'default_in_12_months',
        test_size: float = 0.2
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """Prepare data for model training."""
        logger.info("Preparing data for training...")
        
        # Engineer features
        df = self.create_features(df)
        
        # Get feature columns
        categorical_features, numerical_features = self.get_feature_columns()
        
        # Encode categorical features
        df = pd.get_dummies(df, columns=categorical_features, drop_first=True)
        
        # Get all feature columns (numerical + encoded categorical)
        feature_cols = [col for col in df.columns if col.startswith(tuple(categorical_features)) or col in numerical_features]
        feature_cols = [col for col in feature_cols if col in df.columns]
        
        # Split features and target
        X = df[feature_cols]
        y = df[target_col]
        
        # Split train/test
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = pd.DataFrame(
            self.scaler.fit_transform(X_train),
            columns=X_train.columns,
            index=X_train.index
        )
        X_test_scaled = pd.DataFrame(
            self.scaler.transform(X_test),
            columns=X_test.columns,
            index=X_test.index
        )
        
        self.feature_names = list(X_train.columns)
        
        logger.info(f"✅ Training set: {X_train_scaled.shape}")
        logger.info(f"✅ Test set: {X_test_scaled.shape}")
        logger.info(f"✅ Default rate - Train: {y_train.mean():.2%}, Test: {y_test.mean():.2%}")
        
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform new data using fitted scaler."""
        if self.scaler is None:
            raise ValueError("Scaler not fitted. Call prepare_for_training first.")
        
        df = self.create_features(df)
        categorical_features, _ = self.get_feature_columns()
        df = pd.get_dummies(df, columns=categorical_features, drop_first=True)
        
        # Ensure all training features exist
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0
        
        df = df[self.feature_names]
        
        df_scaled = pd.DataFrame(
            self.scaler.transform(df),
            columns=df.columns,
            index=df.index
        )
        
        return df_scaled
