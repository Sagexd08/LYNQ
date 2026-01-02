"""
Hyperparameter Tuning with Optuna
"""

import optuna
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import roc_auc_score
from loguru import logger
import argparse


def objective(trial, X_train, y_train):
    """Objective function for Optuna optimization."""
    
    # Suggest hyperparameters
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000, step=100),
        'max_depth': trial.suggest_int('max_depth', 3, 12),
        'learning_rate': trial.suggest_float('learning_rate', 0.001, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
        'gamma': trial.suggest_float('gamma', 0, 1),
        'reg_alpha': trial.suggest_float('reg_alpha', 0, 2),
        'reg_lambda': trial.suggest_float('reg_lambda', 0, 2),
        'scale_pos_weight': trial.suggest_float('scale_pos_weight', 1, 10),
        'objective': 'binary:logistic',
        'eval_metric': 'auc',
        'random_state': 42,
        'n_jobs': -1
    }
    
    # Cross-validation
    model = xgb.XGBClassifier(**params)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    scores = cross_val_score(
        model, X_train, y_train,
        cv=cv,
        scoring='roc_auc',
        n_jobs=-1
    )
    
    return scores.mean()


def tune_hyperparameters(X_train, y_train, n_trials: int = 100):
    """Tune hyperparameters using Optuna."""
    
    logger.info(f"Starting hyperparameter tuning with {n_trials} trials...")
    
    study = optuna.create_study(
        direction='maximize',
        study_name='xgboost_tuning',
        sampler=optuna.samplers.TPESampler(seed=42)
    )
    
    study.optimize(
        lambda trial: objective(trial, X_train, y_train),
        n_trials=n_trials,
        show_progress_bar=True
    )
    
    logger.info("✅ Hyperparameter tuning complete!")
    logger.info(f"Best AUC: {study.best_value:.4f}")
    logger.info(f"Best parameters: {study.best_params}")
    
    return study.best_params, study.best_value


def main():
    parser = argparse.ArgumentParser(description='Hyperparameter tuning')
    parser.add_argument('--data', type=str, required=True, help='Training data path')
    parser.add_argument('--trials', type=int, default=100, help='Number of trials')
    
    args = parser.parse_args()
    
    # Load data
    from src.features.engineering import FeatureEngineer
    
    df = pd.read_csv(args.data)
    feature_engineer = FeatureEngineer()
    X_train, X_test, y_train, y_test = feature_engineer.prepare_for_training(df)
    
    # Tune
    best_params, best_score = tune_hyperparameters(X_train, y_train, args.trials)
    
    # Save results
    import json
    with open('models/best_hyperparameters.json', 'w') as f:
        json.dump({'params': best_params, 'auc': best_score}, f, indent=2)
    
    logger.info("Best parameters saved to models/best_hyperparameters.json")


if __name__ == '__main__':
    main()
