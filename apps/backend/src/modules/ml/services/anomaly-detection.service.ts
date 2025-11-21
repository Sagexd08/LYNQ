import { Injectable } from '@nestjs/common';
import logger from '../../../utils/logger';
export interface AnomalyInput {
  transactionAmount: number;
  transactionFrequency: number;
  historicalAverage: number;
  historicalStdDev: number;
  accountAge: number;
  userReputation: number;
  walletAge: number;
  deviceFingerprint?: string;
  ipCountry?: string;
  previousIPCountry?: string;
  timeOfDay: number; // 0-24
  dayOfWeek: number; // 0-6
}

export interface AnomalyScore {
  overallScore: number; // 0-100
  isAnomaly: boolean;
  severity: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';
  reasons: string[];
  algorithms: {
    zScore: number;
    isolationForest: number;
    localOutlierFactor: number;
    statistical: number;
  };
  suggestedAction: 'ALLOW' | 'REVIEW' | 'BLOCK';
}

/**
 * Z-Score based anomaly detection
 */
class ZScoreDetector {
  private threshold: number = 2.5; // Standard deviations

  detect(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    const zScore = Math.abs((value - mean) / stdDev);
    return Math.min(100, (zScore / this.threshold) * 100);
  }
}

/**
 * Isolation Forest-like anomaly detector
 */
class IsolationForestDetector {
  private trees: IsolationTree[] = [];
  private numTrees: number = 100;
  private sampleSize: number = 256;

  constructor() {
    for (let i = 0; i < this.numTrees; i++) {
      this.trees.push(new IsolationTree());
    }
  }

  detect(input: number[]): number {
    const pathLengths = this.trees.map(tree => tree.getPathLength(input));
    const avgPathLength = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;

    // Normalize: lower path length = more anomalous
    const c = this.calculateC(this.sampleSize);
    const anomalyScore = Math.pow(2, -(avgPathLength / c));

    return Math.min(100, anomalyScore * 100);
  }

  private calculateC(m: number): number {
    if (m <= 1) return 0;
    return 2 * (Math.log(m - 1) + 0.5772156649) - (2 * (m - 1)) / m;
  }

  train(data: number[][]): void {
    for (const tree of this.trees) {
      const sample = this.randomSample(data, this.sampleSize);
      tree.build(sample);
    }
  }

  private randomSample(data: number[][], size: number): number[][] {
    const sample: number[][] = [];
    for (let i = 0; i < size; i++) {
      sample.push(data[Math.floor(Math.random() * data.length)]);
    }
    return sample;
  }
}

interface IsolationNode {
  splitAttribute?: number;
  splitValue?: number;
  left?: IsolationNode;
  right?: IsolationNode;
  size: number;
}

/**
 * Isolation Tree for anomaly detection
 */
class IsolationTree {
  private root: IsolationNode | null = null;
  private height: number = 0;

  build(data: number[][]): void {
    this.root = this.buildTree(data, 0);
  }

  private buildTree(data: number[][], depth: number): IsolationNode {
    const maxDepth = Math.log2(Math.max(data.length, 2));
    const node: IsolationNode = { size: data.length };

    if (depth >= maxDepth || data.length <= 1) {
      return node;
    }

    if (data.length === 0) {
      return node;
    }

    // Random attribute and split value
    const numAttributes = data[0].length;
    const attribute = Math.floor(Math.random() * numAttributes);
    const values = data.map(d => d[attribute]).sort((a, b) => a - b);
    const minVal = values[0];
    const maxVal = values[values.length - 1];

    if (minVal === maxVal) {
      return node;
    }

    const splitValue = minVal + Math.random() * (maxVal - minVal);

    const leftData = data.filter(d => d[attribute] < splitValue);
    const rightData = data.filter(d => d[attribute] >= splitValue);

    node.splitAttribute = attribute;
    node.splitValue = splitValue;
    node.left = this.buildTree(leftData, depth + 1);
    node.right = this.buildTree(rightData, depth + 1);

    return node;
  }

  getPathLength(input: number[]): number {
    if (!this.root) return 0;
    return this.traverse(this.root, input, 0);
  }

  private traverse(node: IsolationNode | undefined, input: number[], depth: number): number {
    if (!node) return depth;

    if (node.splitAttribute === undefined) {
      // Leaf node
      return depth + this.calculateIsolationPathAdjustment(node.size);
    }

    const splitAttribute = node.splitAttribute;
    const splitValue = node.splitValue!;

    if (input[splitAttribute] < splitValue) {
      return this.traverse(node.left, input, depth + 1);
    } else {
      return this.traverse(node.right, input, depth + 1);
    }
  }

  private calculateIsolationPathAdjustment(size: number): number {
    if (size <= 1) return 0;
    return Math.log(size - 1) + 0.5772156649;
  }
}

/**
 * Local Outlier Factor detector
 */
class LocalOutlierFactorDetector {
  private k: number = 5;
  private neighbors: number[][] = [];
  private reachDists: number[] = [];

  detect(point: number[], neighbors: number[][]): number {
    const kDistances: number[] = [];

    for (const neighbor of neighbors) {
      const distance = this.euclideanDistance(point, neighbor);
      kDistances.push(distance);
    }

    kDistances.sort((a, b) => a - b);
    const kDist = kDistances[Math.min(this.k - 1, kDistances.length - 1)];

    let reachDist = 0;
    for (const neighbor of neighbors) {
      const dist = this.euclideanDistance(point, neighbor);
      reachDist += Math.max(kDist, dist);
    }
    reachDist /= neighbors.length || 1;

    // Compare to neighbors' reach distances
    let neighborReachDist = 0;
    for (const neighbor of neighbors) {
      neighborReachDist += reachDist; // Simplified: use same reachDist for neighbors
    }
    neighborReachDist /= neighbors.length || 1;

    const lof = reachDist > 0 && neighborReachDist > 0 ? neighborReachDist / reachDist : 1;

    // Convert LOF to anomaly score (1.0 = normal, >1.5 = anomalous)
    return Math.min(100, Math.max(0, (lof - 1) * 50));
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }
}

/**
 * Statistical methods detector
 */
class StatisticalDetector {
  detect(input: AnomalyInput): number {
    let score = 0;

    // Transaction amount deviation
    if (input.historicalStdDev > 0) {
      const zScore = Math.abs((input.transactionAmount - input.historicalAverage) / input.historicalStdDev);
      score += Math.min(30, zScore * 12); // Up to 30 points
    }

    // Transaction frequency anomaly
    if (input.transactionFrequency > input.historicalAverage * 3) {
      score += 20; // High frequency
    }

    // New account risk
    if (input.accountAge < 30) {
      score += 15;
    } else if (input.accountAge < 90) {
      score += 5;
    }

    // Location change
    if (input.ipCountry && input.previousIPCountry && input.ipCountry !== input.previousIPCountry) {
      score += 10;
    }

    // Time anomaly
    if (input.timeOfDay < 3 || input.timeOfDay > 23) {
      score += 5; // Late night transactions
    }

    // Low reputation
    if (input.userReputation < 40) {
      score += 15;
    }

    return Math.min(100, score);
  }
}

@Injectable()
export class AnomalyDetectionService {
  private zScoreDetector: ZScoreDetector;
  private isolationForest: IsolationForestDetector;
  private lofDetector: LocalOutlierFactorDetector;
  private statisticalDetector: StatisticalDetector;
  private historicalData: number[][] = [];

  constructor() {
    this.zScoreDetector = new ZScoreDetector();
    this.isolationForest = new IsolationForestDetector();
    this.lofDetector = new LocalOutlierFactorDetector();
    this.statisticalDetector = new StatisticalDetector();

    logger.info('Anomaly Detection Service initialized');
  }

  /**
   * Detect anomalies in transaction or user behavior
   */
  detect(input: AnomalyInput): AnomalyScore {
    const normalizedInput = this.normalizeInput(input);

    // Run all detection algorithms
    const zScore = this.zScoreDetector.detect(
      input.transactionAmount,
      input.historicalAverage,
      input.historicalStdDev,
    );

    const isolationScore = this.isolationForest.detect(normalizedInput);

    const nearbyPoints = this.findNearbyPoints(normalizedInput);
    const lofScore = this.lofDetector.detect(normalizedInput, nearbyPoints);

    const statisticalScore = this.statisticalDetector.detect(input);

    // Weighted combination
    const overallScore = zScore * 0.3 + isolationScore * 0.3 + lofScore * 0.2 + statisticalScore * 0.2;

    // Determine severity and action
    let severity: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';
    let suggestedAction: 'ALLOW' | 'REVIEW' | 'BLOCK';

    if (overallScore < 30) {
      severity = 'NORMAL';
      suggestedAction = 'ALLOW';
    } else if (overallScore < 70) {
      severity = 'SUSPICIOUS';
      suggestedAction = 'REVIEW';
    } else {
      severity = 'CRITICAL';
      suggestedAction = 'BLOCK';
    }

    const reasons = this.generateReasons(input, zScore, isolationScore, lofScore, statisticalScore);

    return {
      overallScore: Math.round(overallScore),
      isAnomaly: overallScore > 50,
      severity,
      reasons,
      algorithms: {
        zScore: Math.round(zScore),
        isolationForest: Math.round(isolationScore),
        localOutlierFactor: Math.round(lofScore),
        statistical: Math.round(statisticalScore),
      },
      suggestedAction,
    };
  }

  /**
   * Train on historical data
   */
  trainOnHistoricalData(data: number[][]): void {
    this.historicalData = data;
    this.isolationForest.train(data);
    logger.info(`Anomaly detection trained on ${data.length} historical data points`);
  }

  /**
   * Get baseline statistics
   */
  getBaselineStats(): { mean: number; stdDev: number; min: number; max: number } {
    if (this.historicalData.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const flatData = this.historicalData.flat();
    const mean = flatData.reduce((a, b) => a + b, 0) / flatData.length;
    const variance =
      flatData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flatData.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      min: Math.min(...flatData),
      max: Math.max(...flatData),
    };
  }

  private normalizeInput(input: AnomalyInput): number[] {
    return [
      Math.min(100, (input.transactionAmount / 10000) * 100),
      Math.min(100, input.transactionFrequency),
      Math.min(100, (input.historicalAverage / 10000) * 100),
      Math.min(100, (input.historicalStdDev / 5000) * 100),
      Math.min(100, (input.accountAge / 3650) * 100), // normalized by ~10 years
      Math.min(100, input.userReputation),
      Math.min(100, (input.walletAge / 3650) * 100),
      input.timeOfDay * 4.166, // 0-100 scale
      input.dayOfWeek * 14.286, // 0-100 scale
    ];
  }

  private findNearbyPoints(point: number[], k: number = 5): number[][] {
    if (this.historicalData.length === 0) {
      return [];
    }

    const distances = this.historicalData.map(data => {
      let sum = 0;
      for (let i = 0; i < Math.min(data.length, point.length); i++) {
        sum += Math.pow(data[i] - point[i], 2);
      }
      return Math.sqrt(sum);
    });

    const indices = distances
      .map((dist, idx) => ({ dist, idx }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, k)
      .map(item => item.idx);

    return indices.map(idx => this.historicalData[idx]);
  }

  private generateReasons(
    input: AnomalyInput,
    zScore: number,
    isolationScore: number,
    lofScore: number,
    statisticalScore: number,
  ): string[] {
    const reasons: string[] = [];

    if (zScore > 50) {
      reasons.push('Transaction amount significantly deviates from historical pattern');
    }

    if (isolationScore > 60) {
      reasons.push('Unusual feature combination detected by isolation analysis');
    }

    if (lofScore > 40) {
      reasons.push('Local outlier detected in user behavior');
    }

    if (input.accountAge < 30) {
      reasons.push('New account with limited history');
    }

    if (input.userReputation < 40) {
      reasons.push('Low user reputation score');
    }

    if (input.ipCountry && input.previousIPCountry && input.ipCountry !== input.previousIPCountry) {
      reasons.push('Geographic location changed significantly');
    }

    if (input.timeOfDay < 3 || input.timeOfDay > 23) {
      reasons.push('Transaction at unusual time of day');
    }

    if (input.transactionFrequency > input.historicalAverage * 3) {
      reasons.push('Unusually high transaction frequency');
    }

    return reasons.length > 0 ? reasons : ['Pattern within normal parameters'];
  }
}
