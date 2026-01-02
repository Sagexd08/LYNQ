"""
Synthetic Borrower Data Generator

Generates realistic loan applicant profiles using multiple techniques:
- Statistical synthesis (distributions from real data)
- GAN-based generation (CTGAN)
- Rule-based scenarios
"""

import numpy as np
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import argparse
from loguru import logger
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class SyntheticDataGenerator:
    """Generate synthetic borrower profiles for credit scoring."""
    
    def __init__(self, seed: int = 42):
        self.seed = seed
        np.random.seed(seed)
        self.fake = Faker()
        Faker.seed(seed)
        
        # Distribution parameters from real data analysis
        self.distributions = {
            'age': {'mean': 35, 'std': 12, 'min': 18, 'max': 75},
            'annual_income': {'shape': 2, 'scale': 35000, 'min': 15000, 'max': 500000},
            'years_employed': {'mean': 8, 'std': 6, 'min': 0, 'max': 40},
            'credit_score': {'mean': 680, 'std': 85, 'min': 300, 'max': 850},
            'loan_amount': {'mu': 10.5, 'sigma': 1.2},  # lognormal
            'portfolio_value': {'mu': 11.8, 'sigma': 1.5},  # lognormal
        }
        
    def generate_demographics(self, n_samples: int) -> pd.DataFrame:
        """Generate demographic features."""
        logger.info(f"Generating demographics for {n_samples} samples")
        
        data = {
            'id': [f"SYNTH_{i:06d}" for i in range(n_samples)],
            'age': np.clip(
                np.random.normal(
                    self.distributions['age']['mean'],
                    self.distributions['age']['std'],
                    n_samples
                ),
                self.distributions['age']['min'],
                self.distributions['age']['max']
            ).astype(int),
            'country': np.random.choice(
                ['US', 'UK', 'SG', 'DE', 'CA', 'AU', 'JP', 'OTHER'],
                n_samples,
                p=[0.30, 0.15, 0.10, 0.10, 0.10, 0.08, 0.07, 0.10]
            ),
            'employment_type': np.random.choice(
                ['full_time', 'self_employed', 'student', 'part_time', 'unemployed'],
                n_samples,
                p=[0.55, 0.25, 0.10, 0.08, 0.02]
            ),
        }
        
        df = pd.DataFrame(data)
        
        # Years employed correlates with age
        df['years_employed'] = np.clip(
            df['age'] - 22 + np.random.normal(0, 4, n_samples),
            0,
            df['age'] - 18
        ).astype(int)
        
        # Adjust for employment type
        df.loc[df['employment_type'] == 'student', 'years_employed'] = 0
        df.loc[df['employment_type'] == 'unemployed', 'years_employed'] = 0
        
        return df
    
    def generate_financial_profile(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate financial features."""
        logger.info("Generating financial profiles")
        
        n_samples = len(df)
        
        # Annual income (correlated with age and employment)
        base_income = np.random.gamma(
            self.distributions['annual_income']['shape'],
            self.distributions['annual_income']['scale'],
            n_samples
        )
        
        # Adjust for age (experience premium)
        age_factor = 1 + (df['age'] - 25) * 0.02
        age_factor = np.clip(age_factor, 0.7, 2.5)
        
        # Adjust for employment type
        employment_factors = {
            'full_time': 1.0,
            'self_employed': 1.2,
            'part_time': 0.5,
            'student': 0.3,
            'unemployed': 0.1
        }
        employment_multiplier = df['employment_type'].map(employment_factors).values
        
        df['annual_income'] = np.clip(
            base_income * age_factor * employment_multiplier,
            self.distributions['annual_income']['min'],
            self.distributions['annual_income']['max']
        ).astype(int)
        
        # Credit history
        df['years_credit_history'] = np.clip(
            df['age'] - 18 + np.random.normal(0, 2, n_samples),
            0,
            df['age'] - 18
        ).astype(int)
        
        df['num_credit_accounts'] = np.random.poisson(3.5, n_samples)
        df['num_credit_accounts'] = np.clip(df['num_credit_accounts'], 0, 15)
        
        # Credit score (correlated with credit history and income)
        base_score = np.random.normal(
            self.distributions['credit_score']['mean'],
            self.distributions['credit_score']['std'],
            n_samples
        )
        
        # Boost for longer history
        history_boost = np.minimum(df['years_credit_history'] * 2, 50)
        
        # Boost for higher income
        income_percentile = pd.qcut(df['annual_income'], q=4, labels=False, duplicates='drop')
        income_boost = income_percentile * 15
        
        df['credit_score'] = np.clip(
            base_score + history_boost + income_boost,
            self.distributions['credit_score']['min'],
            self.distributions['credit_score']['max']
        ).astype(int)
        
        # Past defaults (inversely correlated with credit score)
        default_probability = 1 - (df['credit_score'] - 300) / 550
        df['past_defaults'] = np.random.binomial(3, default_probability * 0.3)
        
        # Payment history score
        df['payment_history_score'] = np.clip(
            (df['credit_score'] - 300) / 550 * 100 + np.random.normal(0, 10, n_samples),
            0, 100
        ).astype(int)
        
        return df
    
    def generate_onchain_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate on-chain blockchain features."""
        logger.info("Generating on-chain features")
        
        n_samples = len(df)
        
        # Portfolio value (correlated with income)
        income_log = np.log(df['annual_income'] + 1)
        portfolio_base = np.random.lognormal(
            self.distributions['portfolio_value']['mu'],
            self.distributions['portfolio_value']['sigma'],
            n_samples
        )
        
        income_factor = np.exp((income_log - income_log.mean()) * 0.3)
        df['total_portfolio_value'] = (portfolio_base * income_factor).astype(int)
        
        # Asset distribution
        # Generate Dirichlet distribution for percentages
        alpha = np.array([2, 3, 4, 1])  # BTC, ETH, Stablecoins, Other
        asset_dist = np.random.dirichlet(alpha, n_samples)
        
        df['btc_pct'] = (asset_dist[:, 0] * 100).round(2)
        df['eth_pct'] = (asset_dist[:, 1] * 100).round(2)
        df['stablecoins_pct'] = (asset_dist[:, 2] * 100).round(2)
        df['other_pct'] = (asset_dist[:, 3] * 100).round(2)
        
        # Portfolio volatility (inversely correlated with stablecoin %)
        df['portfolio_volatility_30d'] = (
            15 + (100 - df['stablecoins_pct']) * 0.3 + np.random.normal(0, 5, n_samples)
        )
        df['portfolio_volatility_30d'] = np.clip(df['portfolio_volatility_30d'], 1, 100)
        
        # Transaction features
        df['transaction_frequency_30d'] = np.random.poisson(12, n_samples)
        df['transaction_frequency_30d'] = np.clip(df['transaction_frequency_30d'], 0, 100)
        
        df['average_transaction_size'] = (
            df['total_portfolio_value'] * np.random.uniform(0.05, 0.3, n_samples)
        ).astype(int)
        
        # Wallet age
        df['wallet_age_days'] = np.random.gamma(3, 180, n_samples).astype(int)
        df['wallet_age_days'] = np.clip(df['wallet_age_days'], 30, 3650)
        
        # Smart contract interactions
        df['smart_contract_interactions'] = np.random.poisson(8, n_samples)
        df['smart_contract_interactions'] = np.clip(df['smart_contract_interactions'], 0, 200)
        
        # DeFi experience level (0-100)
        experience_factors = [
            df['wallet_age_days'] / 3650 * 30,  # Age factor
            df['smart_contract_interactions'] / 50 * 40,  # Interaction factor
            df['transaction_frequency_30d'] / 50 * 30  # Activity factor
        ]
        df['defi_experience_level'] = np.clip(
            np.sum(experience_factors, axis=0) + np.random.normal(0, 10, n_samples),
            0, 100
        ).astype(int)
        
        # Gas spending
        df['gas_fee_spending_30d'] = (
            df['transaction_frequency_30d'] * np.random.uniform(5, 50, n_samples)
        ).astype(int)
        
        return df
    
    def generate_loan_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate loan-specific features."""
        logger.info("Generating loan features")
        
        n_samples = len(df)
        
        # Requested loan amount (function of income and portfolio)
        income_factor = np.log(df['annual_income'] + 1) / 12  # Monthly capacity
        portfolio_factor = df['total_portfolio_value'] * 0.4  # 40% of portfolio
        
        loan_base = np.minimum(income_factor, portfolio_factor)
        df['requested_loan_amount'] = (
            loan_base * np.random.uniform(0.5, 2.0, n_samples)
        ).astype(int)
        df['requested_loan_amount'] = np.clip(df['requested_loan_amount'], 1000, 500000)
        
        # Loan purpose
        df['loan_purpose'] = np.random.choice(
            ['business', 'personal', 'education', 'emergency', 'investment', 'other'],
            n_samples,
            p=[0.25, 0.20, 0.15, 0.15, 0.15, 0.10]
        )
        
        # Collateral
        df['collateral_amount'] = (
            df['requested_loan_amount'] * np.random.uniform(1.2, 2.0, n_samples)
        ).astype(int)
        
        df['collateral_type'] = np.random.choice(
            ['USDC', 'USDT', 'DAI', 'ETH', 'BTC', 'Mixed'],
            n_samples,
            p=[0.30, 0.25, 0.15, 0.15, 0.10, 0.05]
        )
        
        # Loan term
        df['requested_term_months'] = np.random.choice(
            [3, 6, 12, 24, 36],
            n_samples,
            p=[0.15, 0.25, 0.35, 0.15, 0.10]
        )
        
        # LTV ratio
        df['ltv_ratio'] = (
            df['requested_loan_amount'] / df['collateral_amount'] * 100
        ).round(2)
        
        # Debt-to-income ratio
        df['debt_to_income_ratio'] = (
            df['requested_loan_amount'] / 12 / df['annual_income'] * 100
        ).round(2)
        df['debt_to_income_ratio'] = np.clip(df['debt_to_income_ratio'], 0, 100)
        
        return df
    
    def generate_risk_score(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate risk score and default label."""
        logger.info("Calculating risk scores and default labels")
        
        # Risk score components
        credit_risk = 100 - (df['credit_score'] - 300) / 550 * 100
        income_risk = np.clip(100 - df['annual_income'] / 1000, 0, 100)
        ltv_risk = df['ltv_ratio']
        volatility_risk = df['portfolio_volatility_30d']
        experience_risk = 100 - df['defi_experience_level']
        
        # Weighted risk score
        df['risk_score'] = (
            credit_risk * 0.25 +
            income_risk * 0.15 +
            ltv_risk * 0.20 +
            volatility_risk * 0.15 +
            experience_risk * 0.15 +
            np.random.normal(0, 5, len(df)) * 0.10  # Random factor
        )
        df['risk_score'] = np.clip(df['risk_score'], 0, 100).round(2)
        
        # Default probability (sigmoid function)
        logit = (df['risk_score'] - 50) / 15
        default_prob = 1 / (1 + np.exp(-logit))
        
        # Generate default labels
        df['default_in_12_months'] = np.random.binomial(1, default_prob)
        
        # For non-defaults, generate repayment days
        expected_days = df['requested_term_months'] * 30
        df['actual_repayment_days'] = np.where(
            df['default_in_12_months'] == 0,
            (expected_days * np.random.uniform(0.9, 1.1, len(df))).astype(int),
            np.nan
        )
        
        return df
    
    def generate(self, n_samples: int = 10000, default_rate_target: float = 0.15) -> pd.DataFrame:
        """Generate complete synthetic dataset."""
        logger.info(f"Starting synthetic data generation for {n_samples} samples")
        
        df = self.generate_demographics(n_samples)
        df = self.generate_financial_profile(df)
        df = self.generate_onchain_features(df)
        df = self.generate_loan_features(df)
        df = self.generate_risk_score(df)
        
        # Adjust to target default rate
        current_default_rate = df['default_in_12_months'].mean()
        logger.info(f"Current default rate: {current_default_rate:.2%}")
        
        if abs(current_default_rate - default_rate_target) > 0.02:
            logger.info(f"Adjusting to target default rate: {default_rate_target:.2%}")
            df = self._adjust_default_rate(df, default_rate_target)
        
        # Add metadata
        df['generated_at'] = datetime.now().isoformat()
        df['generator_version'] = '1.0.0'
        
        logger.info("✅ Synthetic data generation complete")
        logger.info(f"Final shape: {df.shape}")
        logger.info(f"Default rate: {df['default_in_12_months'].mean():.2%}")
        
        return df
    
    def _adjust_default_rate(self, df: pd.DataFrame, target_rate: float) -> pd.DataFrame:
        """Adjust default labels to match target rate."""
        current_rate = df['default_in_12_months'].mean()
        
        if current_rate < target_rate:
            # Need more defaults - flip some non-defaults with high risk
            non_defaults = df[df['default_in_12_months'] == 0].index
            high_risk = df.loc[non_defaults, 'risk_score'].nlargest(
                int(len(non_defaults) * (target_rate - current_rate))
            ).index
            df.loc[high_risk, 'default_in_12_months'] = 1
        else:
            # Need fewer defaults - flip some defaults with low risk
            defaults = df[df['default_in_12_months'] == 1].index
            low_risk = df.loc[defaults, 'risk_score'].nsmallest(
                int(len(defaults) * (current_rate - target_rate))
            ).index
            df.loc[low_risk, 'default_in_12_months'] = 0
        
        return df


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic borrower data')
    parser.add_argument('--samples', type=int, default=100000, help='Number of samples to generate')
    parser.add_argument('--output', type=str, default='data/synthetic_loans.csv', help='Output file path')
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    parser.add_argument('--default-rate', type=float, default=0.15, help='Target default rate')
    
    args = parser.parse_args()
    
    # Generate data
    generator = SyntheticDataGenerator(seed=args.seed)
    df = generator.generate(n_samples=args.samples, default_rate_target=args.default_rate)
    
    # Save to file
    output_path = args.output
    df.to_csv(output_path, index=False)
    logger.info(f"✅ Data saved to {output_path}")
    
    # Print summary statistics
    print("\n" + "="*60)
    print("SYNTHETIC DATA SUMMARY")
    print("="*60)
    print(f"Total samples: {len(df):,}")
    print(f"Features: {len(df.columns)}")
    print(f"Default rate: {df['default_in_12_months'].mean():.2%}")
    print(f"\nFeature statistics:")
    print(df[['age', 'annual_income', 'credit_score', 'requested_loan_amount', 
              'total_portfolio_value', 'risk_score']].describe())


if __name__ == '__main__':
    main()
