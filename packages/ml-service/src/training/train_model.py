import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score
from sklearn.ensemble import VotingClassifier
from imblearn.over_sampling import SMOTE
import joblib
try:
    import mlflow
    import mlflow.sklearn
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
from pathlib import Path
from typing import Dict, Tuple, List
from loguru import logger
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.features.engineering import FeatureEngineer
from src.evaluation.metrics import ModelEvaluator


class CreditScoringModel:
    """Ensemble model for credit scoring."""
    
    def __init__(self, config: Dict = None):
        self.config = config or self._default_config()
        self.xgb_model = None
        self.lgb_model = None
        self.ensemble = None
        self.feature_engineer = FeatureEngineer()
        self.evaluator = ModelEvaluator()
        
    def _default_config(self) -> Dict:
        """Default model configuration."""
        return {
            'xgboost': {
                'n_estimators': 500,
                'max_depth': 7,
                'learning_rate': 0.05,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'min_child_weight': 3,
                'gamma': 0.1,
                'reg_alpha': 0.1,
                'reg_lambda': 1.0,
                'scale_pos_weight': 5,
                'objective': 'binary:logistic',
                'eval_metric': 'auc',
                'random_state': 42,
                'n_jobs': -1
            },
            'lightgbm': {
                'n_estimators': 500,
                'max_depth': 8,
                'learning_rate': 0.05,
                'num_leaves': 31,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'min_child_samples': 20,
                'reg_alpha': 0.1,
                'reg_lambda': 1.0,
                'class_weight': 'balanced',
                'objective': 'binary',
                'metric': 'auc',
                'random_state': 42,
                'n_jobs': -1,
                'verbose': -1
            },
            'ensemble': {
                'xgb_weight': 0.6,
                'lgb_weight': 0.4
            }
        }
    
    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame = None,
        y_val: pd.Series = None,
        use_smote: bool = True
    ) -> Dict:
        """Train the ensemble model."""
        logger.info("Starting model training...")
        
        # Apply SMOTE if requested
        if use_smote:
            logger.info("Applying SMOTE for class imbalance...")
            smote = SMOTE(random_state=42, sampling_strategy=0.5)
            X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
            logger.info(f"After SMOTE - Samples: {len(y_train_resampled)}, Default rate: {y_train_resampled.mean():.2%}")
        else:
            X_train_resampled, y_train_resampled = X_train, y_train
        
        # Train XGBoost
        logger.info("Training XGBoost model...")
        self.xgb_model = xgb.XGBClassifier(**self.config['xgboost'])
        
        if X_val is not None:
            self.xgb_model.fit(
                X_train_resampled, y_train_resampled,
                eval_set=[(X_train_resampled, y_train_resampled), (X_val, y_val)],
                verbose=False
            )
        else:
            self.xgb_model.fit(X_train_resampled, y_train_resampled)
        
        # Train LightGBM
        logger.info("Training LightGBM model...")
        self.lgb_model = lgb.LGBMClassifier(**self.config['lightgbm'])
        
        if X_val is not None:
            self.lgb_model.fit(
                X_train_resampled, y_train_resampled,
                eval_set=[(X_train_resampled, y_train_resampled), (X_val, y_val)],
                callbacks=[lgb.early_stopping(50, verbose=False)]
            )
        else:
            self.lgb_model.fit(X_train_resampled, y_train_resampled)
        
        # Create ensemble
        logger.info("Creating ensemble model...")
        self.ensemble = VotingClassifier(
            estimators=[
                ('xgb', self.xgb_model),
                ('lgb', self.lgb_model)
            ],
            voting='soft',
            weights=[
                self.config['ensemble']['xgb_weight'],
                self.config['ensemble']['lgb_weight']
            ]
        )
        
        # Fit ensemble (already trained base models)
        self.ensemble.fit(X_train_resampled, y_train_resampled)
        
        # Evaluate
        train_metrics = self._evaluate(X_train, y_train, "Training")
        
        if X_val is not None:
            val_metrics = self._evaluate(X_val, y_val, "Validation")
            return {'train': train_metrics, 'validation': val_metrics}
        
        return {'train': train_metrics}
    
    def _evaluate(self, X: pd.DataFrame, y: pd.Series, dataset_name: str) -> Dict:
        """Evaluate model performance."""
        logger.info(f"Evaluating on {dataset_name} set...")
        
        # Predictions
        y_pred_proba = self.ensemble.predict_proba(X)[:, 1]
        y_pred = self.ensemble.predict(X)
        
        # Metrics
        metrics = {
            'auc_roc': roc_auc_score(y, y_pred_proba),
            'precision': precision_score(y, y_pred),
            'recall': recall_score(y, y_pred),
            'f1': f1_score(y, y_pred)
        }
        
        logger.info(f"{dataset_name} Metrics:")
        for metric_name, value in metrics.items():
            logger.info(f"  {metric_name}: {value:.4f}")
        
        return metrics
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict class labels."""
        return self.ensemble.predict(X)
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict class probabilities."""
        return self.ensemble.predict_proba(X)[:, 1]
    
    def get_feature_importance(self, feature_names: List[str]) -> pd.DataFrame:
        """Get feature importance from models."""
        xgb_importance = self.xgb_model.feature_importances_
        lgb_importance = self.lgb_model.feature_importances_
        
        # Weighted average
        importance = (
            xgb_importance * self.config['ensemble']['xgb_weight'] +
            lgb_importance * self.config['ensemble']['lgb_weight']
        )
        
        df = pd.DataFrame({
            'feature': feature_names,
            'importance': importance,
            'xgb_importance': xgb_importance,
            'lgb_importance': lgb_importance
        }).sort_values('importance', ascending=False)
        
        return df
    
    def save(self, model_dir: str):
        """Save model to disk."""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        
        joblib.dump(self.ensemble, model_dir / 'ensemble_model.pkl')
        joblib.dump(self.xgb_model, model_dir / 'xgb_model.pkl')
        joblib.dump(self.lgb_model, model_dir / 'lgb_model.pkl')
        joblib.dump(self.feature_engineer, model_dir / 'feature_engineer.pkl')
        joblib.dump(self.config, model_dir / 'config.pkl')
        
        logger.info(f"✅ Model saved to {model_dir}")
    
    @classmethod
    def load(cls, model_dir: str):
        """Load model from disk."""
        model_dir = Path(model_dir)
        
        model = cls()
        model.ensemble = joblib.load(model_dir / 'ensemble_model.pkl')
        model.xgb_model = joblib.load(model_dir / 'xgb_model.pkl')
        model.lgb_model = joblib.load(model_dir / 'lgb_model.pkl')
        model.feature_engineer = joblib.load(model_dir / 'feature_engineer.pkl')
        model.config = joblib.load(model_dir / 'config.pkl')
        
        logger.info(f"✅ Model loaded from {model_dir}")
        return model


def train_model(data_path: str, output_dir: str, mlflow_tracking: bool = True):
    """Main training function."""
    logger.info("=" * 60)
    logger.info("CREDIT SCORING MODEL TRAINING")
    logger.info("=" * 60)
    
    # Load data
    logger.info(f"Loading data from {data_path}")
    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df):,} samples with {len(df.columns)} columns")
    
    # Feature engineering and split
    feature_engineer = FeatureEngineer()
    X_train, X_test, y_train, y_test = feature_engineer.prepare_for_training(
        df, target_col='default_in_12_months', test_size=0.2
    )
    
    # Further split train into train/val
    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.125, random_state=42, stratify=y_train
    )
    
    # MLflow tracking
    if mlflow_tracking and MLFLOW_AVAILABLE:
        mlflow.set_experiment("lynq-credit-scoring")
        mlflow.start_run()
        mlflow.log_params({
            'data_samples': len(df),
            'train_samples': len(X_train),
            'val_samples': len(X_val),
            'test_samples': len(X_test),
            'features': len(X_train.columns),
            'default_rate': df['default_in_12_months'].mean()
        })
    elif mlflow_tracking and not MLFLOW_AVAILABLE:
        logger.warning("MLflow not available, skipping experiment tracking")
    
    # Train model
    model = CreditScoringModel()
    metrics = model.train(X_train, y_train, X_val, y_val, use_smote=True)
    
    # Test set evaluation
    test_metrics = model._evaluate(X_test, y_test, "Test")
    metrics['test'] = test_metrics
    
    # Log metrics
    if mlflow_tracking and MLFLOW_AVAILABLE:
        for dataset, dataset_metrics in metrics.items():
            for metric_name, value in dataset_metrics.items():
                mlflow.log_metric(f"{dataset}_{metric_name}", value)
    
    # Feature importance
    feature_importance = model.get_feature_importance(X_train.columns.tolist())
    logger.info("\nTop 20 Most Important Features:")
    print(feature_importance.head(20))
    
    # Save model
    output_path = Path(output_dir)
    model.save(output_path)
    
    # Save feature importance
    feature_importance.to_csv(output_path / 'feature_importance.csv', index=False)
    
    # Log model to MLflow
    if mlflow_tracking and MLFLOW_AVAILABLE:
        mlflow.sklearn.log_model(model.ensemble, "model")
        mlflow.log_artifact(str(output_path / 'feature_importance.csv'))
        mlflow.end_run()
    
    logger.info("=" * 60)
    logger.info("✅ TRAINING COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Test AUC-ROC: {test_metrics['auc_roc']:.4f}")
    logger.info(f"Test Precision: {test_metrics['precision']:.4f}")
    logger.info(f"Test Recall: {test_metrics['recall']:.4f}")
    logger.info(f"Test F1: {test_metrics['f1']:.4f}")
    
    return model, metrics


def main():
    parser = argparse.ArgumentParser(description='Train credit scoring model')
    parser.add_argument('--data', type=str, required=True, help='Path to training data CSV')
    parser.add_argument('--output', type=str, default='models/production', help='Output directory for model')
    parser.add_argument('--no-mlflow', action='store_true', help='Disable MLflow tracking')
    
    args = parser.parse_args()
    
    train_model(
        data_path=args.data,
        output_dir=args.output,
        mlflow_tracking=not args.no_mlflow
    )


if __name__ == '__main__':
    main()
