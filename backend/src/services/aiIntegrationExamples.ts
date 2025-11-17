/**
 * Enhanced AI/ML Integration Examples
 * Demonstrates how to use the advanced AI engine and ML trainer
 */

import AdvancedAIEngine from '../services/advancedAIEngine';
import MLModelTrainer, {
  ModelTrainingConfig,
  FeatureEngineer,
  ModelEvaluator,
} from '../services/mlModelTrainer';

// ============================================================================
// EXAMPLE 1: Neural Network-based Risk Prediction
// ============================================================================

export async function exampleNeuralNetworkPrediction(): Promise<void> {
  console.log('🧠 Example 1: Neural Network Risk Prediction\n');

  const aiEngine = new AdvancedAIEngine();

  // Create transaction data with historical context
  const transactionData = {
    amount: 5000,
    gasPrice: 50,
    slippage: 0.5,
    chainId: 1,
    confidence: 0.8,
    velocity: 2,
    isNewRecipient: false,
    accountAge: 90,
    hasHistory: true,
    successRate: 95,
    isPeakTime: true,
    networkCongestion: 45,
    isBlacklisted: false,
    timeSinceLastTx: 7200,
    anomalyScore: 15,
  };

  // Historical data for time series analysis
  const historicalData = [
    { timestamp: 1000, value: 100, features: [1, 0.5, 2] },
    { timestamp: 2000, value: 105, features: [1.1, 0.55, 2.1] },
    { timestamp: 3000, value: 102, features: [1.05, 0.52, 2.05] },
    { timestamp: 4000, value: 110, features: [1.2, 0.6, 2.2] },
    { timestamp: 5000, value: 108, features: [1.15, 0.58, 2.15] },
  ];

  // Get advanced validation
  const result = await aiEngine.validateAdvanced('user123', transactionData, historicalData);

  console.log('Transaction Validation Result:');
  console.log(`  Risk Score: ${result.overallRiskScore.toFixed(2)}/100`);
  console.log(`  Recommendation: ${result.predictions.recommendedAction}`);
  console.log(`  Success Probability: ${result.predictions.successProbability.toFixed(2)}%`);
  console.log(`  Fraud Probability: ${result.predictions.fraudProbability.toFixed(2)}%`);
  console.log(`  Anomaly Detected: ${result.insights.anomalyDetected}`);
  console.log(`  Confidence: ${result.confidence.toFixed(2)}%`);
  console.log(`  Execution Time: ${result.executionTime}ms`);
  console.log(`  Alert: ${result.naturalLanguageAlert}\n`);
}

// ============================================================================
// EXAMPLE 2: Time Series Forecasting for Gas Price Prediction
// ============================================================================

export async function exampleTimeSeriesForecast(): Promise<void> {
  console.log('📈 Example 2: Time Series Gas Price Forecasting\n');

  const aiEngine = new AdvancedAIEngine();

  // Simulate historical gas prices
  const historicalPrices = [
    { timestamp: Date.now() - 5000, value: 45, features: [0.5] },
    { timestamp: Date.now() - 4000, value: 47, features: [0.6] },
    { timestamp: Date.now() - 3000, value: 46, features: [0.55] },
    { timestamp: Date.now() - 2000, value: 48, features: [0.7] },
    { timestamp: Date.now() - 1000, value: 50, features: [0.75] },
  ];

  // Validate with historical context
  const result = await aiEngine.validateAdvanced(
    'user456',
    {
      amount: 1000,
      gasPrice: 50,
      type: 'swap',
    },
    historicalPrices
  );

  console.log('Gas Price Forecast:');
  console.log(`  Current Risk: ${result.overallRiskScore.toFixed(2)}/100`);
  console.log(`  Time Series Trend: ${result.insights.timeSeriesTrend}`);
  console.log(`  Execution Time: ${result.executionTime}ms\n`);
}

// ============================================================================
// EXAMPLE 3: Model Training with Dataset
// ============================================================================

export async function exampleModelTraining(): Promise<void> {
  console.log('🎓 Example 3: Model Training\n');

  const trainer = new MLModelTrainer();

  // Create training dataset
  const trainingDataset = Array.from({ length: 100 }, () => ({
    input: Array.from({ length: 15 }, () => Math.random()),
    output: [Math.random() > 0.5 ? 1 : 0],
  }));

  // Training configuration
  const config: ModelTrainingConfig = {
    epochs: 50,
    batchSize: 10,
    validationSplit: 0.2,
    learningRate: 0.01,
    regularization: 'l2',
  };

  // Train model
  const history = await trainer.trainModel(trainingDataset, config);

  console.log('Training Complete:');
  console.log(`  Total Epochs: ${history.length}`);
  console.log(`  Initial Loss: ${history[0].trainLoss.toFixed(6)}`);
  console.log(`  Final Loss: ${history[history.length - 1].validationLoss.toFixed(6)}`);
  console.log(`  Final Accuracy: ${(history[history.length - 1].accuracy * 100).toFixed(2)}%`);
  console.log(`  Final F1 Score: ${history[history.length - 1].f1Score.toFixed(4)}\n`);

  // Show summary
  const summary = trainer.getSummary();
  console.log('Training Summary:', JSON.stringify(summary, null, 2));
  console.log();
}

// ============================================================================
// EXAMPLE 4: K-Fold Cross Validation
// ============================================================================

export async function exampleCrossValidation(): Promise<void> {
  console.log('🔄 Example 4: K-Fold Cross Validation\n');

  const trainer = new MLModelTrainer();

  // Create dataset
  const dataset = Array.from({ length: 50 }, () => ({
    input: Array.from({ length: 15 }, () => Math.random()),
    output: [Math.random() > 0.5 ? 1 : 0],
  }));

  const config: ModelTrainingConfig = {
    epochs: 20,
    batchSize: 5,
    validationSplit: 0.2,
    learningRate: 0.01,
  };

  // Perform 5-fold cross validation
  const result = await trainer.crossValidate(dataset, config, 5);

  console.log('Cross Validation Results:');
  console.log(`  Folds: ${result.folds}`);
  console.log(`  Mean Accuracy: ${(result.meanAccuracy * 100).toFixed(2)}%`);
  console.log(`  Standard Deviation: ${(result.stdDeviation * 100).toFixed(2)}%`);
  console.log(`  Fold Accuracies:`);
  result.foldResults.forEach((acc, i) => {
    console.log(`    Fold ${i + 1}: ${(acc * 100).toFixed(2)}%`);
  });
  console.log();
}

// ============================================================================
// EXAMPLE 5: Hyperparameter Tuning
// ============================================================================

export async function exampleHyperparameterTuning(): Promise<void> {
  console.log('⚙️ Example 5: Hyperparameter Tuning\n');

  const trainer = new MLModelTrainer();

  // Create dataset
  const dataset = Array.from({ length: 30 }, () => ({
    input: Array.from({ length: 15 }, () => Math.random()),
    output: [Math.random() > 0.5 ? 1 : 0],
  }));

  const baseConfig: ModelTrainingConfig = {
    epochs: 10,
    batchSize: 5,
    validationSplit: 0.2,
    learningRate: 0.01,
  };

  // Grid search
  const hyperparameterGrid = {
    learningRate: [0.001, 0.01, 0.1],
    batchSize: [5, 10],
  };

  console.log('Tuning hyperparameters...');
  const tuningResult = await trainer.tuneHyperparameters(dataset, baseConfig, hyperparameterGrid);

  console.log('Best Hyperparameters:');
  console.log(JSON.stringify(tuningResult.bestHyperparameters, null, 2));
  console.log(`Best Accuracy: ${(tuningResult.bestAccuracy * 100).toFixed(2)}%`);
  console.log(`Best Loss: ${tuningResult.bestLoss.toFixed(6)}\n`);
}

// ============================================================================
// EXAMPLE 6: Feature Engineering
// ============================================================================

export async function exampleFeatureEngineering(): Promise<void> {
  console.log('🔧 Example 6: Feature Engineering\n');

  // Sample data
  const data = [
    [100, 200, 50],
    [150, 250, 75],
    [200, 300, 100],
    [250, 350, 125],
  ];

  // Normalization
  const { normalized, min, max } = FeatureEngineer.normalize(data);
  console.log('Normalized Features:');
  console.log('  Min values:', min);
  console.log('  Max values:', max);
  console.log('  Normalized sample:', normalized[0]);

  // Standardization
  const { standardized, mean, std } = FeatureEngineer.standardize(data);
  console.log('\nStandardized Features:');
  console.log('  Mean:', mean);
  console.log('  Std Dev:', std);
  console.log('  Standardized sample:', standardized[0]);

  // Variance-based feature selection
  const selectedFeatures = FeatureEngineer.selectByVariance(data, 0.5);
  console.log('\nSelected Features (variance > 0.5):', selectedFeatures);

  // Polynomial features
  const polyFeatures = FeatureEngineer.createPolynomialFeatures(data, 2);
  console.log('\nPolynomial Features (degree 2):');
  console.log('  Original features:', 3);
  console.log('  Expanded to:', polyFeatures[0].length);

  // Interaction features
  const interactionFeatures = FeatureEngineer.createInteractionFeatures(data);
  console.log('\nInteraction Features:');
  console.log('  Original features:', 3);
  console.log('  Expanded to:', interactionFeatures[0].length);
  console.log();
}

// ============================================================================
// EXAMPLE 7: Model Evaluation Metrics
// ============================================================================

export async function exampleModelEvaluation(): Promise<void> {
  console.log('📊 Example 7: Model Evaluation Metrics\n');

  // Sample predictions and targets
  const predictions = [0.9, 0.8, 0.2, 0.1, 0.95, 0.3, 0.85, 0.15];
  const targets = [1, 1, 0, 0, 1, 0, 1, 0];

  // Confusion Matrix
  const cm = ModelEvaluator.confusionMatrix(predictions, targets);
  console.log('Confusion Matrix:');
  console.log(`  TN: ${cm[0][0]}, FP: ${cm[0][1]}`);
  console.log(`  FN: ${cm[1][0]}, TP: ${cm[1][1]}`);

  // ROC AUC Score
  const rocAuc = ModelEvaluator.rocAucScore(predictions, targets);
  console.log(`\nROC AUC Score: ${rocAuc.toFixed(4)}`);

  // Precision-Recall Curve
  const prc = ModelEvaluator.precisionRecallCurve(predictions, targets);
  console.log('\nPrecision-Recall Curve (sample thresholds):');
  prc.slice(0, 5).forEach((point) => {
    console.log(
      `  Threshold ${point.threshold.toFixed(1)}: Precision=${point.precision.toFixed(4)}, Recall=${point.recall.toFixed(4)}`
    );
  });
  console.log();
}

// ============================================================================
// EXAMPLE 8: NLP Alert Generation
// ============================================================================

export async function exampleNLPAlerts(): Promise<void> {
  console.log('🗣️ Example 8: NLP Alert Generation\n');

  const aiEngine = new AdvancedAIEngine();

  console.log('Generated Alerts:');
  for (let i = 0; i < 3; i++) {
    const result = await aiEngine.validateAdvanced('user789', {
      amount: 50000,
      type: 'flash_loan',
    });
    console.log(`  Alert ${i + 1}: ${result.naturalLanguageAlert}`);
  }
  console.log();
}

// ============================================================================
// EXAMPLE 9: Real-time Transaction Validation Flow
// ============================================================================

export async function exampleRealTimeValidation(): Promise<void> {
  console.log('⚡ Example 9: Real-time Transaction Validation Flow\n');

  const aiEngine = new AdvancedAIEngine();

  // Simulate multiple transactions
  const transactions = [
    {
      userId: 'user_001',
      type: 'swap',
      amount: 1000,
      recipient: '0xabc123',
    },
    {
      userId: 'user_002',
      type: 'flash_loan',
      amount: 100000,
      recipient: '0xdef456',
    },
    {
      userId: 'user_003',
      type: 'transfer',
      amount: 500,
      recipient: '0xghi789',
    },
  ];

  console.log('Processing transactions...\n');

  for (const tx of transactions) {
    const result = await aiEngine.validateAdvanced(tx.userId, {
      amount: tx.amount,
      type: tx.type,
      recipient: tx.recipient,
      gasPrice: 50,
      chainId: 1,
      confidence: 0.8,
      successRate: 95,
    });

    console.log(`Transaction: ${tx.userId} -> ${tx.type} (${tx.amount})`);
    console.log(`  Status: ${result.predictions.recommendedAction}`);
    console.log(`  Risk: ${result.overallRiskScore.toFixed(1)}/100`);
    console.log(`  Time: ${result.executionTime}ms`);
    console.log(`  Alert: ${result.naturalLanguageAlert}\n`);
  }
}

// ============================================================================
// EXAMPLE 10: Model Performance Metrics
// ============================================================================

export async function exampleModelMetrics(): Promise<void> {
  console.log('📈 Example 10: Model Performance Metrics\n');

  const aiEngine = new AdvancedAIEngine();

  // Get model metrics
  const metrics = aiEngine.getModelMetrics();

  console.log('Neural Network:');
  console.log(`  Training Epochs: ${metrics.neuralNetwork.trainingEpochs}`);
  console.log(`  Latest Loss: ${metrics.neuralNetwork.latestLoss}`);

  console.log('\nTime Series Forecaster:');
  console.log(`  Data Points: ${metrics.timeSeries.dataPoints}`);
  console.log(`  Volatility: ${metrics.timeSeries.volatility}`);

  console.log('\nEnsemble Classifier:');
  console.log(`  Model Count: ${metrics.ensemble.modelCount}`);
  console.log(`  Average Accuracy: ${metrics.ensemble.averageAccuracy}%`);
  console.log();
}

// ============================================================================
// RUNNER - Execute all examples
// ============================================================================

export async function runAllExamples(): Promise<void> {
  console.log('═'.repeat(70));
  console.log('ENHANCED AI/ML INTEGRATION EXAMPLES');
  console.log('═'.repeat(70) + '\n');

  try {
    await exampleNeuralNetworkPrediction();
    await exampleTimeSeriesForecast();
    await exampleModelTraining();
    await exampleCrossValidation();
    await exampleHyperparameterTuning();
    await exampleFeatureEngineering();
    await exampleModelEvaluation();
    await exampleNLPAlerts();
    await exampleRealTimeValidation();
    await exampleModelMetrics();

    console.log('═'.repeat(70));
    console.log('ALL EXAMPLES COMPLETED SUCCESSFULLY ✅');
    console.log('═'.repeat(70));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other modules
export { AdvancedAIEngine, MLModelTrainer };
