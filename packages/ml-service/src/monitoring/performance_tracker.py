"""
Performance Monitoring and Tracking
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List
from collections import deque
from loguru import logger


class PerformanceTracker:
    """Track model performance metrics over time."""
    
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.predictions = deque(maxlen=window_size)
        self.actuals = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        self.latencies = deque(maxlen=window_size)
        
    def record_prediction(
        self,
        prediction: float,
        actual: float = None,
        latency_ms: float = None
    ):
        """Record a prediction and optional actual outcome."""
        timestamp = datetime.now()
        
        self.predictions.append(prediction)
        self.actuals.append(actual)
        self.timestamps.append(timestamp)
        
        if latency_ms is not None:
            self.latencies.append(latency_ms)
    
    def get_recent_metrics(self, n: int = None) -> Dict:
        """Get metrics for recent predictions."""
        if n is None:
            n = len(self.predictions)
        
        recent_preds = list(self.predictions)[-n:]
        recent_actuals = [a for a in list(self.actuals)[-n:] if a is not None]
        recent_latencies = list(self.latencies)[-n:]
        
        metrics = {
            'total_predictions': len(recent_preds),
            'prediction_mean': np.mean(recent_preds),
            'prediction_std': np.std(recent_preds),
        }
        
        # Performance metrics (if actuals available)
        if len(recent_actuals) > 0:
            from sklearn.metrics import roc_auc_score, brier_score_loss
            
            preds_with_actuals = recent_preds[:len(recent_actuals)]
            
            if len(set(recent_actuals)) > 1:  # Need both classes for AUC
                metrics['auc_roc'] = roc_auc_score(recent_actuals, preds_with_actuals)
            
            metrics['brier_score'] = brier_score_loss(recent_actuals, preds_with_actuals)
            metrics['default_rate_predicted'] = np.mean(preds_with_actuals)
            metrics['default_rate_actual'] = np.mean(recent_actuals)
        
        # Latency metrics
        if len(recent_latencies) > 0:
            metrics['latency_mean_ms'] = np.mean(recent_latencies)
            metrics['latency_p50_ms'] = np.percentile(recent_latencies, 50)
            metrics['latency_p95_ms'] = np.percentile(recent_latencies, 95)
            metrics['latency_p99_ms'] = np.percentile(recent_latencies, 99)
        
        return metrics
    
    def check_performance_degradation(
        self,
        baseline_auc: float,
        threshold: float = 0.03
    ) -> Dict:
        """Check if performance has degraded compared to baseline."""
        metrics = self.get_recent_metrics()
        
        if 'auc_roc' not in metrics:
            return {'degradation_detected': False, 'reason': 'insufficient_data'}
        
        current_auc = metrics['auc_roc']
        degradation = baseline_auc - current_auc
        degradation_detected = degradation > threshold
        
        result = {
            'degradation_detected': degradation_detected,
            'baseline_auc': baseline_auc,
            'current_auc': current_auc,
            'degradation': degradation,
            'threshold': threshold
        }
        
        if degradation_detected:
            logger.warning(
                f"Performance degradation detected! "
                f"Baseline AUC: {baseline_auc:.4f}, Current AUC: {current_auc:.4f}"
            )
        
        return result
    
    def get_summary_report(self) -> str:
        """Generate a summary report."""
        metrics = self.get_recent_metrics()
        
        report = [
            "\n" + "=" * 60,
            "PERFORMANCE MONITORING REPORT",
            "=" * 60,
            f"\nTotal Predictions: {metrics['total_predictions']}",
            f"Prediction Distribution: μ={metrics['prediction_mean']:.4f}, σ={metrics['prediction_std']:.4f}",
        ]
        
        if 'auc_roc' in metrics:
            report.extend([
                f"\nModel Performance:",
                f"  AUC-ROC: {metrics['auc_roc']:.4f}",
                f"  Brier Score: {metrics['brier_score']:.4f}",
                f"  Predicted Default Rate: {metrics['default_rate_predicted']:.2%}",
                f"  Actual Default Rate: {metrics['default_rate_actual']:.2%}",
            ])
        
        if 'latency_mean_ms' in metrics:
            report.extend([
                f"\nLatency Metrics:",
                f"  Mean: {metrics['latency_mean_ms']:.1f}ms",
                f"  P50: {metrics['latency_p50_ms']:.1f}ms",
                f"  P95: {metrics['latency_p95_ms']:.1f}ms",
                f"  P99: {metrics['latency_p99_ms']:.1f}ms",
            ])
        
        report.append("=" * 60 + "\n")
        
        return "\n".join(report)
