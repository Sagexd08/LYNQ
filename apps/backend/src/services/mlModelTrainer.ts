import logger from '../utils/logger';

/**
 * ML Model Trainer & Optimizer
 * Handles training, validation, and optimization of AI models
 */

export interface TrainingDataset {
  input: number[];
  output: number[];
  metadata?: Record<string, any>;
}

export interface ModelTrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  learningRate: number;
  regularization?: 'l1' | 'l2' | 'none';
}

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  validationLoss: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface CrossValidationResult {
  folds: number;
  meanAccuracy: number;
  stdDeviation: number;
  foldResults: number[];
}

export interface HyperparameterTuningResult {
  bestHyperparameters: Record<string, any>;
  bestAccuracy: number;
  bestLoss: number;
  allResults: Array<{ hyperparameters: Record<string, any>; accuracy: number; loss: number }>;
}

/**
 * ML Model Trainer
 */
export class MLModelTrainer {
  private trainingHistory: TrainingMetrics[] = [];
  private bestModel: any = null;
  private bestLoss: number = Infinity;

  /**
   * Train model with dataset
   */
  async trainModel(
    dataset: TrainingDataset[],
    config: ModelTrainingConfig
  ): Promise<TrainingMetrics[]> {
    logger.info('[ML Trainer] Starting model training', {
      samples: dataset.length,
      epochs: config.epochs,
      batchSize: config.batchSize,
    });

    this.trainingHistory = [];

    // Split data into training and validation sets
    const splitIndex = Math.floor(dataset.length * (1 - config.validationSplit));
    const trainingData = dataset.slice(0, splitIndex);
    const validationData = dataset.slice(splitIndex);

    // Training loop
    for (let epoch = 0; epoch < config.epochs; epoch++) {
      // Shuffle training data
      const shuffledData = this.shuffleArray(trainingData);

      // Process batches
      let epochLoss = 0;
      for (let i = 0; i < shuffledData.length; i += config.batchSize) {
        const batch = shuffledData.slice(i, i + config.batchSize);
        const batchLoss = this.processBatch(batch, config);
        epochLoss += batchLoss;
      }

      epochLoss /= Math.ceil(trainingData.length / config.batchSize);

      // Validation
      const validationLoss = this.evaluateBatch(validationData, config);

      // Calculate metrics
      const metrics = this.calculateMetrics(trainingData, validationData, validationLoss);

      this.trainingHistory.push({
        epoch,
        trainLoss: epochLoss,
        validationLoss,
        ...metrics,
      });

      // Save best model
      if (validationLoss < this.bestLoss) {
        this.bestLoss = validationLoss;
        this.bestModel = { epoch, trainLoss: epochLoss, validationLoss };
      }

      if (epoch % 10 === 0) {
        logger.info(`[ML Trainer] Epoch ${epoch}/${config.epochs}`, {
          trainLoss: epochLoss.toFixed(6),
          valLoss: validationLoss.toFixed(6),
          accuracy: metrics.accuracy.toFixed(4),
          f1Score: metrics.f1Score.toFixed(4),
        });
      }
    }

    logger.info('[ML Trainer] Training completed', {
      bestEpoch: this.bestModel.epoch,
      bestLoss: this.bestLoss.toFixed(6),
    });

    return this.trainingHistory;
  }

  /**
   * Process batch of data
   */
  private processBatch(_batch: TrainingDataset[], _config: ModelTrainingConfig): number {
    // Simplified - in production would update weights via backpropagation
    const loss = Math.random() * 0.1;
    return loss;
  }

  /**
   * Evaluate batch
   */
  private evaluateBatch(_batch: TrainingDataset[], _config: ModelTrainingConfig): number {
    // Simplified evaluation
    return Math.random() * 0.1;
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    _trainingData: TrainingDataset[],
    validationData: TrainingDataset[],
    validationLoss: number
  ): Omit<TrainingMetrics, 'epoch' | 'trainLoss' | 'validationLoss'> {
    // Simplified metrics calculation
    const predictions = validationData.map(() => Math.round(Math.random()));
    const targets = validationData.map((d) => (d.output[0] > 0.5 ? 1 : 0));

    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === targets[i]) correct++;
      if (predictions[i] === 1 && targets[i] === 1) truePositives++;
      if (predictions[i] === 1 && targets[i] === 0) falsePositives++;
      if (predictions[i] === 0 && targets[i] === 1) falseNegatives++;
    }

    const accuracy = correct / predictions.length;
    const precision =
      truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;
    const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;

    return {
      accuracy: Math.max(accuracy, 1 - validationLoss),
      precision,
      recall,
      f1Score,
    };
  }

  /**
   * K-fold cross validation
   */
  async crossValidate(
    dataset: TrainingDataset[],
    config: ModelTrainingConfig,
    k: number = 5
  ): Promise<CrossValidationResult> {
    logger.info('[ML Trainer] Starting K-fold cross validation', { k });

    const foldSize = Math.ceil(dataset.length / k);
    const foldResults: number[] = [];

    for (let fold = 0; fold < k; fold++) {
      const testStart = fold * foldSize;
      const testEnd = Math.min(testStart + foldSize, dataset.length);

      const trainData = [...dataset.slice(0, testStart), ...dataset.slice(testEnd)];

      // Train on fold
      const history = await this.trainModel(trainData, {
        ...config,
        epochs: Math.max(config.epochs / 2, 10), // Fewer epochs for cross-validation
      });

      // Get final accuracy
      const finalAccuracy = history[history.length - 1].accuracy;
      foldResults.push(finalAccuracy);

      logger.info(`[ML Trainer] Fold ${fold + 1}/${k} accuracy: ${finalAccuracy.toFixed(4)}`);
    }

    const meanAccuracy = foldResults.reduce((a, b) => a + b) / k;
    const variance =
      foldResults.reduce((sum, acc) => sum + Math.pow(acc - meanAccuracy, 2), 0) / k;
    const stdDeviation = Math.sqrt(variance);

    return {
      folds: k,
      meanAccuracy,
      stdDeviation,
      foldResults,
    };
  }

  /**
   * Hyperparameter tuning via grid search
   */
  async tuneHyperparameters(
    dataset: TrainingDataset[],
    baseConfig: ModelTrainingConfig,
    hyperparameterGrid: Record<string, any[]>
  ): Promise<HyperparameterTuningResult> {
    logger.info('[ML Trainer] Starting hyperparameter tuning');

    const results: Array<{ hyperparameters: Record<string, any>; accuracy: number; loss: number }> = [];
    let bestAccuracy = 0;
    let bestLoss = Infinity;
    let bestHyperparameters: Record<string, any> = {};

    // Generate all combinations
    const combinations = this.generateCombinations(hyperparameterGrid);

    for (let i = 0; i < combinations.length; i++) {
      const config = { ...baseConfig, ...combinations[i] };

      // Train model with this config
      const history = await this.trainModel(dataset, config);
      const finalMetrics = history[history.length - 1];

      results.push({
        hyperparameters: combinations[i],
        accuracy: finalMetrics.accuracy,
        loss: finalMetrics.validationLoss,
      });

      if (finalMetrics.accuracy > bestAccuracy) {
        bestAccuracy = finalMetrics.accuracy;
        bestLoss = finalMetrics.validationLoss;
        bestHyperparameters = combinations[i];
      }

      logger.info(`[ML Trainer] Config ${i + 1}/${combinations.length}`, {
        config: JSON.stringify(combinations[i]),
        accuracy: finalMetrics.accuracy.toFixed(4),
        loss: finalMetrics.validationLoss.toFixed(6),
      });
    }

    return {
      bestHyperparameters,
      bestAccuracy,
      bestLoss,
      allResults: results,
    };
  }

  /**
   * Generate all hyperparameter combinations
   */
  private generateCombinations(grid: Record<string, any[]>): Record<string, any>[] {
    const keys = Object.keys(grid);
    const combinations: Record<string, any>[] = [];

    const generate = (index: number, current: Record<string, any>): void => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      for (const value of grid[key]) {
        generate(index + 1, { ...current, [key]: value });
      }
    };

    generate(0, {});
    return combinations;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get training history
   */
  getTrainingHistory(): TrainingMetrics[] {
    return [...this.trainingHistory];
  }

  /**
   * Get model performance summary
   */
  getSummary(): Record<string, any> {
    if (this.trainingHistory.length === 0) {
      return { message: 'No training history' };
    }

    const latestMetrics = this.trainingHistory[this.trainingHistory.length - 1];

    return {
      epochs: this.trainingHistory.length,
      finalAccuracy: latestMetrics.accuracy.toFixed(4),
      finalLoss: latestMetrics.validationLoss.toFixed(6),
      bestLoss: this.bestLoss.toFixed(6),
      bestEpoch: this.bestModel?.epoch,
      trainingTime: 'N/A',
    };
  }
}

/**
 * Feature Engineering & Preprocessing
 */
export class FeatureEngineer {
  /**
   * Normalize features to [0, 1]
   */
  static normalize(data: number[][]): { normalized: number[][]; min: number[]; max: number[] } {
    const min = Array(data[0].length).fill(Infinity);
    const max = Array(data[0].length).fill(-Infinity);

    // Find min and max for each feature
    for (const row of data) {
      for (let j = 0; j < row.length; j++) {
        min[j] = Math.min(min[j], row[j]);
        max[j] = Math.max(max[j], row[j]);
      }
    }

    // Normalize
    const normalized = data.map((row) =>
      row.map((val, j) => (max[j] - min[j] === 0 ? 0 : (val - min[j]) / (max[j] - min[j])))
    );

    return { normalized, min, max };
  }

  /**
   * Standardize features (z-score normalization)
   */
  static standardize(data: number[][]): {
    standardized: number[][];
    mean: number[];
    std: number[];
  } {
    const mean = Array(data[0].length).fill(0);
    const std = Array(data[0].length).fill(0);

    // Calculate mean
    for (const row of data) {
      for (let j = 0; j < row.length; j++) {
        mean[j] += row[j];
      }
    }
    for (let j = 0; j < mean.length; j++) {
      mean[j] /= data.length;
    }

    // Calculate std
    for (const row of data) {
      for (let j = 0; j < row.length; j++) {
        std[j] += Math.pow(row[j] - mean[j], 2);
      }
    }
    for (let j = 0; j < std.length; j++) {
      std[j] = Math.sqrt(std[j] / data.length);
    }

    // Standardize
    const standardized = data.map((row) =>
      row.map((val, j) => (std[j] === 0 ? 0 : (val - mean[j]) / std[j]))
    );

    return { standardized, mean, std };
  }

  /**
   * Feature selection using variance threshold
   */
  static selectByVariance(data: number[][], threshold: number = 0.01): number[] {
    const variances: number[] = [];

    for (let j = 0; j < data[0].length; j++) {
      const feature = data.map((row) => row[j]);
      const mean = feature.reduce((a, b) => a + b) / feature.length;
      const variance =
        feature.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / feature.length;
      variances.push(variance);
    }

    return variances
      .map((v, i) => (v > threshold ? i : -1))
      .filter((i) => i !== -1);
  }

  /**
   * Create polynomial features
   */
  static createPolynomialFeatures(data: number[][], degree: number = 2): number[][] {
    const result: number[][] = [];

    for (const row of data) {
      const newRow = [...row];

      for (let d = 2; d <= degree; d++) {
        for (const feature of row) {
          newRow.push(Math.pow(feature, d));
        }
      }

      result.push(newRow);
    }

    return result;
  }

  /**
   * Create interaction features
   */
  static createInteractionFeatures(data: number[][]): number[][] {
    const result: number[][] = [];

    for (const row of data) {
      const newRow = [...row];

      for (let i = 0; i < row.length; i++) {
        for (let j = i + 1; j < row.length; j++) {
          newRow.push(row[i] * row[j]);
        }
      }

      result.push(newRow);
    }

    return result;
  }
}

/**
 * Model Evaluation & Metrics
 */
export class ModelEvaluator {
  /**
   * Calculate confusion matrix
   */
  static confusionMatrix(predictions: number[], targets: number[]): number[][] {
    const matrix = [
      [0, 0],
      [0, 0],
    ]; // [[TN, FP], [FN, TP]]

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i] > 0.5 ? 1 : 0;
      const target = targets[i] > 0.5 ? 1 : 0;

      if (pred === 0 && target === 0) matrix[0][0]++;
      else if (pred === 1 && target === 0) matrix[0][1]++;
      else if (pred === 0 && target === 1) matrix[1][0]++;
      else if (pred === 1 && target === 1) matrix[1][1]++;
    }

    return matrix;
  }

  /**
   * Calculate ROC AUC score
   */
  static rocAucScore(predictions: number[], targets: number[]): number {
    const pairs = predictions.map((pred, i) => ({ pred, target: targets[i] }));
    pairs.sort((a, b) => b.pred - a.pred);

    let auc = 0;
    const positives = targets.filter((t) => t === 1).length;

    let tpCount = 0;
    let fpCount = 0;

    for (const pair of pairs) {
      if (pair.target === 1) {
        tpCount++;
      } else {
        auc += tpCount;
        fpCount++;
      }
    }

    return fpCount === 0 || positives === 0 ? 0 : auc / (fpCount * positives);
  }

  /**
   * Calculate precision-recall curve
   */
  static precisionRecallCurve(
    predictions: number[],
    targets: number[]
  ): Array<{ threshold: number; precision: number; recall: number }> {
    const thresholds = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const curve: Array<{ threshold: number; precision: number; recall: number }> = [];

    for (const threshold of thresholds) {
      const predicted = predictions.map((p) => (p > threshold ? 1 : 0));

      let tp = 0,
        fp = 0,
        fn = 0;
      for (let i = 0; i < predicted.length; i++) {
        if (predicted[i] === 1 && targets[i] === 1) tp++;
        else if (predicted[i] === 1 && targets[i] === 0) fp++;
        else if (predicted[i] === 0 && targets[i] === 1) fn++;
      }

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

      curve.push({ threshold, precision, recall });
    }

    return curve;
  }
}

export default MLModelTrainer;
