"""
Data and Model Drift Detection
"""

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp, chi2_contingency
from typing import Dict, Tuple
from loguru import logger


class DriftDetector:
    """Detect data and model drift."""
    
    def __init__(self, reference_data: pd.DataFrame = None):
        self.reference_data = reference_data
        self.reference_stats = self._calculate_stats(reference_data) if reference_data is not None else None
    
    def _calculate_stats(self, data: pd.DataFrame) -> Dict:
        """Calculate reference statistics."""
        stats = {}
        
        for col in data.select_dtypes(include=[np.number]).columns:
            stats[col] = {
                'mean': data[col].mean(),
                'std': data[col].std(),
                'min': data[col].min(),
                'max': data[col].max(),
                'median': data[col].median(),
                'q25': data[col].quantile(0.25),
                'q75': data[col].quantile(0.75)
            }
        
        return stats
    
    def detect_numerical_drift(
        self,
        current_data: pd.DataFrame,
        threshold: float = 0.05
    ) -> Dict[str, Dict]:
        """Detect drift in numerical features using KS test."""
        
        if self.reference_data is None:
            raise ValueError("Reference data not set")
        
        drift_results = {}
        
        numerical_cols = current_data.select_dtypes(include=[np.number]).columns
        
        for col in numerical_cols:
            if col not in self.reference_data.columns:
                continue
            
            # KS test
            statistic, p_value = ks_2samp(
                self.reference_data[col].dropna(),
                current_data[col].dropna()
            )
            
            drift_detected = p_value < threshold
            
            drift_results[col] = {
                'ks_statistic': float(statistic),
                'p_value': float(p_value),
                'drift_detected': drift_detected,
                'severity': self._categorize_drift(statistic)
            }
            
            if drift_detected:
                logger.warning(f"Drift detected in {col}: KS={statistic:.4f}, p={p_value:.4f}")
        
        return drift_results
    
    def detect_categorical_drift(
        self,
        current_data: pd.DataFrame,
        threshold: float = 0.05
    ) -> Dict[str, Dict]:
        """Detect drift in categorical features using chi-square test."""
        
        if self.reference_data is None:
            raise ValueError("Reference data not set")
        
        drift_results = {}
        
        categorical_cols = current_data.select_dtypes(include=['object', 'category']).columns
        
        for col in categorical_cols:
            if col not in self.reference_data.columns:
                continue
            
            # Create contingency table
            ref_counts = self.reference_data[col].value_counts()
            curr_counts = current_data[col].value_counts()
            
            # Align categories
            all_categories = set(ref_counts.index) | set(curr_counts.index)
            ref_counts = ref_counts.reindex(all_categories, fill_value=0)
            curr_counts = curr_counts.reindex(all_categories, fill_value=0)
            
            # Chi-square test
            contingency_table = pd.DataFrame({
                'reference': ref_counts,
                'current': curr_counts
            }).T
            
            if len(all_categories) > 1:
                chi2, p_value, dof, expected = chi2_contingency(contingency_table)
                drift_detected = p_value < threshold
                
                drift_results[col] = {
                    'chi2_statistic': float(chi2),
                    'p_value': float(p_value),
                    'drift_detected': drift_detected
                }
                
                if drift_detected:
                    logger.warning(f"Drift detected in {col}: chi2={chi2:.4f}, p={p_value:.4f}")
        
        return drift_results
    
    def _categorize_drift(self, ks_statistic: float) -> str:
        """Categorize drift severity."""
        if ks_statistic < 0.1:
            return "low"
        elif ks_statistic < 0.2:
            return "medium"
        else:
            return "high"
    
    def detect_prediction_drift(
        self,
        current_predictions: np.ndarray,
        reference_predictions: np.ndarray = None,
        threshold: float = 0.05
    ) -> Dict:
        """Detect drift in model predictions."""
        
        if reference_predictions is None and not hasattr(self, 'reference_predictions'):
            logger.warning("No reference predictions available")
            return {}
        
        ref_preds = reference_predictions if reference_predictions is not None else self.reference_predictions
        
        # KS test on prediction distributions
        statistic, p_value = ks_2samp(ref_preds, current_predictions)
        
        drift_detected = p_value < threshold
        
        result = {
            'ks_statistic': float(statistic),
            'p_value': float(p_value),
            'drift_detected': drift_detected,
            'reference_mean': float(np.mean(ref_preds)),
            'current_mean': float(np.mean(current_predictions)),
            'reference_std': float(np.std(ref_preds)),
            'current_std': float(np.std(current_predictions))
        }
        
        if drift_detected:
            logger.warning(f"Prediction drift detected: KS={statistic:.4f}, p={p_value:.4f}")
        
        return result
