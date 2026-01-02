"""
Model Evaluation Metrics

Comprehensive evaluation metrics for credit scoring models.
"""

import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score, roc_curve, precision_recall_curve,
    confusion_matrix, classification_report, 
    average_precision_score, brier_score_loss
)
from scipy.stats import ks_2samp
from typing import Dict, Tuple
import matplotlib.pyplot as plt
import seaborn as sns
from loguru import logger


class ModelEvaluator:
    """Evaluate model performance with comprehensive metrics."""
    
    def evaluate_comprehensive(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        y_pred: np.ndarray = None
    ) -> Dict:
        """Calculate comprehensive evaluation metrics."""
        
        if y_pred is None:
            y_pred = (y_pred_proba >= 0.5).astype(int)
        
        metrics = {}
        
        # AUC-ROC
        metrics['auc_roc'] = roc_auc_score(y_true, y_pred_proba)
        
        # Average Precision (PR-AUC)
        metrics['avg_precision'] = average_precision_score(y_true, y_pred_proba)
        
        # Brier Score (calibration)
        metrics['brier_score'] = brier_score_loss(y_true, y_pred_proba)
        
        # Gini Coefficient
        metrics['gini'] = 2 * metrics['auc_roc'] - 1
        
        # KS Statistic
        metrics['ks_statistic'] = self._calculate_ks_statistic(y_true, y_pred_proba)
        
        # Confusion Matrix metrics
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        metrics['true_positives'] = int(tp)
        metrics['true_negatives'] = int(tn)
        metrics['false_positives'] = int(fp)
        metrics['false_negatives'] = int(fn)
        
        # Derived metrics
        metrics['accuracy'] = (tp + tn) / (tp + tn + fp + fn)
        metrics['precision'] = tp / (tp + fp) if (tp + fp) > 0 else 0
        metrics['recall'] = tp / (tp + fn) if (tp + fn) > 0 else 0
        metrics['f1_score'] = 2 * (metrics['precision'] * metrics['recall']) / \
                             (metrics['precision'] + metrics['recall']) \
                             if (metrics['precision'] + metrics['recall']) > 0 else 0
        metrics['specificity'] = tn / (tn + fp) if (tn + fp) > 0 else 0
        metrics['false_positive_rate'] = fp / (fp + tn) if (fp + tn) > 0 else 0
        metrics['false_negative_rate'] = fn / (fn + tp) if (fn + tp) > 0 else 0
        
        # Precision at different recall levels
        precision, recall, thresholds = precision_recall_curve(y_true, y_pred_proba)
        metrics['precision_at_90_recall'] = self._precision_at_recall(precision, recall, 0.90)
        metrics['precision_at_95_recall'] = self._precision_at_recall(precision, recall, 0.95)
        
        return metrics
    
    def _calculate_ks_statistic(self, y_true: np.ndarray, y_pred_proba: np.ndarray) -> float:
        """Calculate Kolmogorov-Smirnov statistic."""
        # Separate scores for defaults and non-defaults
        scores_default = y_pred_proba[y_true == 1]
        scores_non_default = y_pred_proba[y_true == 0]
        
        # KS statistic
        ks_stat, _ = ks_2samp(scores_default, scores_non_default)
        return ks_stat
    
    def _precision_at_recall(
        self,
        precision: np.ndarray,
        recall: np.ndarray,
        target_recall: float
    ) -> float:
        """Get precision at a specific recall level."""
        idx = np.where(recall >= target_recall)[0]
        if len(idx) > 0:
            return precision[idx[0]]
        return 0.0
    
    def print_report(self, metrics: Dict):
        """Print formatted evaluation report."""
        print("\n" + "=" * 60)
        print("MODEL EVALUATION REPORT")
        print("=" * 60)
        
        print("\n📊 Discrimination Metrics:")
        print(f"  AUC-ROC:              {metrics['auc_roc']:.4f}")
        print(f"  Gini Coefficient:     {metrics['gini']:.4f}")
        print(f"  KS Statistic:         {metrics['ks_statistic']:.4f}")
        print(f"  Average Precision:    {metrics['avg_precision']:.4f}")
        
        print("\n🎯 Classification Metrics (at 0.5 threshold):")
        print(f"  Accuracy:             {metrics['accuracy']:.4f}")
        print(f"  Precision:            {metrics['precision']:.4f}")
        print(f"  Recall:               {metrics['recall']:.4f}")
        print(f"  F1 Score:             {metrics['f1_score']:.4f}")
        print(f"  Specificity:          {metrics['specificity']:.4f}")
        
        print("\n⚠️  Error Rates:")
        print(f"  False Positive Rate:  {metrics['false_positive_rate']:.4f}")
        print(f"  False Negative Rate:  {metrics['false_negative_rate']:.4f}")
        
        print("\n📈 Precision at Recall Levels:")
        print(f"  Precision @ 90% Recall: {metrics['precision_at_90_recall']:.4f}")
        print(f"  Precision @ 95% Recall: {metrics['precision_at_95_recall']:.4f}")
        
        print("\n📉 Calibration:")
        print(f"  Brier Score:          {metrics['brier_score']:.4f}")
        
        print("\n🔢 Confusion Matrix:")
        print(f"  True Positives:       {metrics['true_positives']}")
        print(f"  True Negatives:       {metrics['true_negatives']}")
        print(f"  False Positives:      {metrics['false_positives']}")
        print(f"  False Negatives:      {metrics['false_negatives']}")
        
        print("=" * 60 + "\n")
