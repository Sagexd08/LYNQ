import { Injectable } from '@nestjs/common';
import logger from '../../../utils/logger';
export interface EnsembleInput {
  paymentHistory: number;
  loanUtilization: number;
  accountAge: number;
  reputationScore: number;
  walletStability: number;
  transactionFrequency: number;
  defaultRisk: number;
  incomeStability: number;
  assetValue?: number;
  collateralRatio?: number;
}

export interface EnsemblePrediction {
  riskScore: number; // 0-100
  confidence: number; // 0-100
  modelPredictions: {
    randomForest: number;
    gradientBoosting: number;
    neuralNetwork: number;
    logisticRegression: number;
  };
  weightedPrediction: number;
  anomalyDetected: boolean;
  recommendedAction: 'APPROVE' | 'WARN' | 'DENY';
}

/**
 * Random Forest-like classifier
 */
class RandomForestClassifier {
  private trees: DecisionTree[] = [];
  private numTrees: number;

  constructor(numTrees: number = 50) {
    this.numTrees = numTrees;
    this.initializeTrees();
  }

  private initializeTrees(): void {
    for (let i = 0; i < this.numTrees; i++) {
      this.trees.push(new DecisionTree());
    }
  }

  predict(input: number[]): number {
    const predictions = this.trees.map(tree => tree.predict(input));
    const avgPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    return Math.min(100, Math.max(0, avgPrediction));
  }

  updateWithData(inputs: number[][], outputs: number[]): void {
    for (let i = 0; i < this.trees.length; i++) {
      const bootstrapIndices = this.bootstrapSample(inputs.length);
      const bootstrapInputs = bootstrapIndices.map(idx => inputs[idx]);
      const bootstrapOutputs = bootstrapIndices.map(idx => outputs[idx]);
      this.trees[i].train(bootstrapInputs, bootstrapOutputs);
    }
  }

  private bootstrapSample(size: number): number[] {
    const sample: number[] = [];
    for (let i = 0; i < size; i++) {
      sample.push(Math.floor(Math.random() * size));
    }
    return sample;
  }
}

/**
 * Gradient Boosting classifier
 */
class GradientBoostingClassifier {
  private baseEstimates: number[] = [];
  private learningRate: number = 0.1;
  private numIterations: number = 100;
  private residuals: number[] = [];

  predict(input: number[]): number {
    let prediction = 50; // Base prediction (neutral)

    // Simulate gradient boosting iterations
    for (let i = 0; i < this.numIterations; i++) {
      const stepPrediction = this.predictStep(input, i);
      prediction += this.learningRate * stepPrediction;
    }

    return Math.min(100, Math.max(0, prediction));
  }

  private predictStep(input: number[], iteration: number): number {
    // Weighted contribution based on features
    let score = 0;
    score += input[0] * 0.3; // Payment history (30%)
    score += input[1] * 0.2; // Utilization (20%)
    score += input[2] * 0.15; // Account age (15%)
    score += input[3] * 0.15; // Reputation (15%)
    score += input[4] * 0.1; // Stability (10%)
    score += (iteration % 2 === 0 ? 5 : -5); // Iteration bias

    return score;
  }

  train(inputs: number[][], outputs: number[]): void {
    this.baseEstimates = inputs.map(input => this.predict(input));
    this.residuals = outputs.map((out, i) => out - this.baseEstimates[i]);
  }
}

/**
 * Simple Neural Network classifier
 */
class NeuralNetworkClassifier {
  private weights: number[] = [];
  private bias: number = 0;

  constructor() {
    this.initializeWeights(10);
  }

  private initializeWeights(inputSize: number): void {
    this.weights = Array(inputSize)
      .fill(0)
      .map(() => Math.random() * 0.5);
    this.bias = Math.random() * 0.1;
  }

  predict(input: number[]): number {
    let sum = this.bias;
    for (let i = 0; i < Math.min(input.length, this.weights.length); i++) {
      sum += input[i] * this.weights[i];
    }
    // Sigmoid activation
    const sigmoid = 1 / (1 + Math.exp(-sum));
    return sigmoid * 100;
  }

  train(inputs: number[][], outputs: number[], epochs: number = 100): void {
    const learningRate = 0.01;

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const output = outputs[i];
        const prediction = this.predict(input);
        const error = output - prediction;

        // Update weights
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] += learningRate * error * (input[j] || 0);
        }
        this.bias += learningRate * error;
      }
    }
  }
}

/**
 * Logistic Regression classifier
 */
class LogisticRegressionClassifier {
  private coefficients: number[] = [];
  private bias: number = 0;

  constructor() {
    this.coefficients = [0.3, 0.2, 0.15, 0.15, 0.1, 0.08, 0.12, 0.05];
    this.bias = 25;
  }

  predict(input: number[]): number {
    let logit = this.bias;
    for (let i = 0; i < Math.min(input.length, this.coefficients.length); i++) {
      logit += input[i] * this.coefficients[i];
    }
    return Math.min(100, Math.max(0, logit));
  }

  train(inputs: number[][], outputs: number[]): void {
    // Simplified training: adjust coefficients based on mean error
    const predictions = inputs.map(input => this.predict(input));
    const meanError = outputs.reduce((sum, out, i) => sum + (out - predictions[i]), 0) / outputs.length;

    // Adjust all coefficients
    this.coefficients = this.coefficients.map(coef => coef + meanError * 0.01);
    this.bias += meanError * 0.1;
  }
}

/**
 * Decision Tree for classification
 */
class DecisionTree {
  private root: TreeNode | null = null;

  predict(input: number[]): number {
    if (!this.root) {
      return 50; // Default neutral prediction
    }
    return this.traverseTree(this.root, input);
  }

  private traverseTree(node: TreeNode, input: number[]): number {
    if (node.isLeaf) {
      return node.value;
    }

    if (input[node.featureIndex] <= node.threshold) {
      return node.left ? this.traverseTree(node.left, input) : node.value;
    } else {
      return node.right ? this.traverseTree(node.right, input) : node.value;
    }
  }

  train(inputs: number[][], outputs: number[]): void {
    this.root = this.buildTree(inputs, outputs, 0, 10);
  }

  private buildTree(
    inputs: number[][],
    outputs: number[],
    depth: number,
    maxDepth: number,
  ): TreeNode {
    // Base case: max depth reached
    if (depth >= maxDepth || inputs.length === 0) {
      const avgValue = outputs.reduce((a, b) => a + b, 0) / outputs.length;
      return { isLeaf: true, value: avgValue, featureIndex: 0, threshold: 0 };
    }

    // Find best split
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestGain = 0;

    for (let featureIdx = 0; featureIdx < inputs[0].length; featureIdx++) {
      const values = inputs.map(input => input[featureIdx]).sort((a, b) => a - b);
      const uniqueValues = [...new Set(values)];

      for (const threshold of uniqueValues) {
        const gain = this.calculateInformationGain(inputs, outputs, featureIdx, threshold);
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = featureIdx;
          bestThreshold = threshold;
        }
      }
    }

    // Split data
    const leftIndices = inputs
      .map((input, idx) => (input[bestFeature] <= bestThreshold ? idx : -1))
      .filter(idx => idx !== -1);
    const rightIndices = inputs
      .map((input, idx) => (input[bestFeature] > bestThreshold ? idx : -1))
      .filter(idx => idx !== -1);

    if (leftIndices.length === 0 || rightIndices.length === 0) {
      const avgValue = outputs.reduce((a, b) => a + b, 0) / outputs.length;
      return { isLeaf: true, value: avgValue, featureIndex: 0, threshold: 0 };
    }

    const leftInputs = leftIndices.map(idx => inputs[idx]);
    const leftOutputs = leftIndices.map(idx => outputs[idx]);
    const rightInputs = rightIndices.map(idx => inputs[idx]);
    const rightOutputs = rightIndices.map(idx => outputs[idx]);

    const left = this.buildTree(leftInputs, leftOutputs, depth + 1, maxDepth);
    const right = this.buildTree(rightInputs, rightOutputs, depth + 1, maxDepth);

    const avgValue = outputs.reduce((a, b) => a + b, 0) / outputs.length;
    return {
      isLeaf: false,
      value: avgValue,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left,
      right,
    };
  }

  private calculateInformationGain(
    inputs: number[][],
    outputs: number[],
    featureIdx: number,
    threshold: number,
  ): number {
    const leftOutputs = outputs.filter((_, idx) => inputs[idx][featureIdx] <= threshold);
    const rightOutputs = outputs.filter((_, idx) => inputs[idx][featureIdx] > threshold);

    if (leftOutputs.length === 0 || rightOutputs.length === 0) {
      return 0;
    }

    const totalVariance = this.calculateVariance(outputs);
    const leftVariance = this.calculateVariance(leftOutputs);
    const rightVariance = this.calculateVariance(rightOutputs);

    const weightedVariance =
      (leftOutputs.length / outputs.length) * leftVariance +
      (rightOutputs.length / outputs.length) * rightVariance;

    return totalVariance - weightedVariance;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }
}

interface TreeNode {
  isLeaf: boolean;
  value: number;
  featureIndex: number;
  threshold: number;
  left?: TreeNode;
  right?: TreeNode;
}

@Injectable()
export class EnsembleModelsService {
  private randomForest: RandomForestClassifier;
  private gradientBoosting: GradientBoostingClassifier;
  private neuralNetwork: NeuralNetworkClassifier;
  private logisticRegression: LogisticRegressionClassifier;
  private trainingData: { inputs: number[][]; outputs: number[] } | null = null;

  constructor() {
    this.randomForest = new RandomForestClassifier(50);
    this.gradientBoosting = new GradientBoostingClassifier();
    this.neuralNetwork = new NeuralNetworkClassifier();
    this.logisticRegression = new LogisticRegressionClassifier();

    logger.info('Ensemble Models Service initialized');
  }

  /**
   * Get ensemble prediction combining multiple models
   */
  predict(input: EnsembleInput): EnsemblePrediction {
    const normalizedInput = this.normalizeInput(input);

    // Get predictions from each model
    const rfPrediction = this.randomForest.predict(normalizedInput);
    const gbPrediction = this.gradientBoosting.predict(normalizedInput);
    const nnPrediction = this.neuralNetwork.predict(normalizedInput);
    const lrPrediction = this.logisticRegression.predict(normalizedInput);

    // Weighted ensemble (Random Forest has higher weight)
    const weightedPrediction =
      rfPrediction * 0.4 + gbPrediction * 0.3 + nnPrediction * 0.2 + lrPrediction * 0.1;

    // Calculate confidence based on model agreement
    const predictions = [rfPrediction, gbPrediction, nnPrediction, lrPrediction];
    const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    const variance = predictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictions.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, 100 - stdDev);

    // Detect anomalies
    const anomalyDetected = this.detectAnomaly(normalizedInput, predictions);

    // Determine recommended action
    const recommendedAction = this.determineAction(weightedPrediction, confidence);

    return {
      riskScore: Math.round(weightedPrediction),
      confidence: Math.round(confidence),
      modelPredictions: {
        randomForest: Math.round(rfPrediction),
        gradientBoosting: Math.round(gbPrediction),
        neuralNetwork: Math.round(nnPrediction),
        logisticRegression: Math.round(lrPrediction),
      },
      weightedPrediction: Math.round(weightedPrediction),
      anomalyDetected,
      recommendedAction,
    };
  }

  /**
   * Train ensemble models with historical data
   */
  trainModels(inputs: EnsembleInput[], outputs: number[]): void {
    const normalizedInputs = inputs.map(input => this.normalizeInput(input));
    const numericInputs = normalizedInputs.map(arr => Array.from(arr));

    this.trainingData = { inputs: numericInputs, outputs };

    try {
      this.randomForest.updateWithData(numericInputs, outputs);
      this.gradientBoosting.train(numericInputs, outputs);
      this.neuralNetwork.train(numericInputs, outputs);
      this.logisticRegression.train(numericInputs, outputs);

      logger.info(`Ensemble models trained with ${inputs.length} samples`);
    } catch (error) {
      logger.error('Error training ensemble models:', error);
    }
  }

  /**
   * Get feature importance scores
   */
  getFeatureImportance(): Record<string, number> {
    const features = [
      'paymentHistory',
      'loanUtilization',
      'accountAge',
      'reputationScore',
      'walletStability',
      'transactionFrequency',
      'defaultRisk',
      'incomeStability',
    ];

    // Simulate feature importance calculation
    const importance: Record<string, number> = {};
    features.forEach((feature, index) => {
      importance[feature] = Math.random() * 0.3 + 0.1; // 10-40% importance
    });

    // Normalize to sum to 1
    const total = Object.values(importance).reduce((a, b) => a + b, 0);
    Object.keys(importance).forEach(key => {
      importance[key] = importance[key] / total;
    });

    return importance;
  }

  /**
   * Perform cross-validation
   */
  crossValidate(inputs: EnsembleInput[], outputs: number[], folds: number = 5): number[] {
    const normalizedInputs = inputs.map(input => this.normalizeInput(input));
    const foldSize = Math.floor(inputs.length / folds);
    const scores: number[] = [];

    for (let fold = 0; fold < folds; fold++) {
      const testStart = fold * foldSize;
      const testEnd = fold === folds - 1 ? inputs.length : (fold + 1) * foldSize;

      const trainIndices = Array.from({ length: inputs.length }, (_, i) => i).filter(
        i => i < testStart || i >= testEnd,
      );
      const testIndices = Array.from({ length: testEnd - testStart }, (_, i) => testStart + i);

      const trainInputs = trainIndices.map(i => normalizedInputs[i]);
      const trainOutputs = trainIndices.map(i => outputs[i]);
      const testInputs = testIndices.map(i => normalizedInputs[i]);
      const testOutputs = testIndices.map(i => outputs[i]);

      // Train on fold
      this.neuralNetwork.train(trainInputs, trainOutputs);

      // Test on fold
      let correct = 0;
      for (let i = 0; i < testInputs.length; i++) {
        const prediction = this.neuralNetwork.predict(testInputs[i]);
        if (Math.abs(prediction - testOutputs[i]) < 20) {
          correct++;
        }
      }

      const accuracy = (correct / testInputs.length) * 100;
      scores.push(accuracy);
    }

    return scores;
  }

  private normalizeInput(input: EnsembleInput): number[] {
    return [
      Math.min(100, input.paymentHistory),
      Math.min(100, input.loanUtilization),
      Math.min(100, input.accountAge),
      Math.min(100, input.reputationScore),
      Math.min(100, input.walletStability),
      Math.min(100, input.transactionFrequency),
      Math.min(100, input.defaultRisk),
      Math.min(100, input.incomeStability),
      input.assetValue ? Math.min(100, input.assetValue / 10000) : 50,
      input.collateralRatio ? Math.min(100, input.collateralRatio * 100) : 50,
    ];
  }

  private detectAnomaly(input: number[], predictions: number[]): boolean {
    // Check for unusual patterns
    const hasHighVariance = predictions.some(p => Math.abs(p - predictions[0]) > 30);
    const hasExtremeValues = input.some(v => v < 20 || v > 90);
    const hasUnsualCombination = input[7] < 30 && input[0] > 80; // Low income but high payment history

    return hasHighVariance || (hasExtremeValues && hasUnsualCombination);
  }

  private determineAction(riskScore: number, confidence: number): 'APPROVE' | 'WARN' | 'DENY' {
    if (confidence < 60) {
      return 'WARN'; // Low confidence
    }

    if (riskScore < 30) {
      return 'APPROVE';
    } else if (riskScore < 70) {
      return 'WARN';
    } else {
      return 'DENY';
    }
  }
}
