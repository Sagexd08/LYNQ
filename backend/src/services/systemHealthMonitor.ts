import { EventEmitter } from 'events';
import logger from '../utils/logger';
import AIValidationEngine, { SystemHealthMetrics, AlertSeverity } from './aiValidationEngine';

/**
 * System Health Monitor
 * Continuously monitors platform health and alerts on degradation
 */

export interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: number;
  metrics: SystemHealthMetrics;
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  suggestedAction: string;
  timestamp: number;
}

export interface ServiceStatus {
  service: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  latency: number; // ms
  errorRate: number; // 0-100
  lastCheck: number;
  details?: string;
}

export class SystemHealthMonitor extends EventEmitter {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthHistory: HealthCheckResult[] = [];
  private maxHistorySize: number = 100;
  private serviceStatuses = new Map<string, ServiceStatus>();

  // Thresholds
  private readonly LATENCY_WARNING_MS = 200;
  private readonly LATENCY_CRITICAL_MS = 1000;
  private readonly GAS_VOLATILITY_WARNING = 70;
  private readonly CHAIN_CONGESTION_WARNING = 75;
  private readonly ERROR_RATE_WARNING = 5;
  private readonly ERROR_RATE_CRITICAL = 15;

  constructor() {
    super();
    this.initializeServices();
  }

  /**
   * Start health monitoring
   */
  start(intervalMs: number = 10000): void {
    if (this.healthCheckInterval) {
      logger.warn('Health monitor already running');
      return;
    }

    logger.info('Starting system health monitor', { interval: intervalMs });

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    // Perform initial check
    this.performHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health monitor stopped');
    }
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = Date.now();
    const alerts: HealthAlert[] = [];

    try {
      // Get current metrics
      const metrics = AIValidationEngine.getSystemHealth();

      // Check service statuses
      const serviceIssues = this.checkServiceStatuses();
      alerts.push(...serviceIssues);

      // Check network health
      const networkAlerts = this.checkNetworkHealth(metrics);
      alerts.push(...networkAlerts);

      // Check gas conditions
      const gasAlerts = this.checkGasConditions(metrics);
      alerts.push(...gasAlerts);

      // Check system resources
      const resourceAlerts = this.checkSystemResources();
      alerts.push(...resourceAlerts);

      // Check error rates
      const errorAlerts = this.checkErrorRates();
      alerts.push(...errorAlerts);

      // Determine overall status
      const status = this.determineOverallStatus(alerts, metrics);

      const result: HealthCheckResult = {
        status,
        timestamp,
        metrics,
        alerts,
      };

      // Store in history
      this.healthHistory.push(result);
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory.shift();
      }

      // Emit events for significant issues
      if (alerts.length > 0) {
        this.emit('health-alert', {
          status,
          alertCount: alerts.length,
          criticalCount: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL)
            .length,
          alerts,
        });

        // Log critical issues
        const criticalAlerts = alerts.filter(
          (a) => a.severity === AlertSeverity.CRITICAL
        );
        if (criticalAlerts.length > 0) {
          logger.error('System health critical alerts', {
            count: criticalAlerts.length,
            alerts: criticalAlerts.map((a) => ({
              type: a.type,
              message: a.message,
            })),
          });
        }
      }

      // Emit status change
      if (status !== 'HEALTHY') {
        this.emit('health-degraded', result);
      }

      return result;
    } catch (error: any) {
      logger.error('Health check error', { error: error?.message });

      return {
        status: 'CRITICAL',
        timestamp,
        metrics: AIValidationEngine.getSystemHealth(),
        alerts: [
          {
            id: `health_error_${timestamp}`,
            severity: AlertSeverity.CRITICAL,
            type: 'HEALTH_CHECK_ERROR',
            message: 'Failed to complete health check',
            suggestedAction: 'Check system logs for details',
            timestamp,
          },
        ],
      };
    }
  }

  /**
   * Check individual service statuses
   */
  private checkServiceStatuses(): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    for (const [serviceName, status] of this.serviceStatuses) {
      if (status.status === 'DOWN') {
        alerts.push({
          id: `service_down_${Date.now()}_${serviceName}`,
          severity: AlertSeverity.CRITICAL,
          type: 'SERVICE_DOWN',
          message: `Service '${serviceName}' is down`,
          suggestedAction: `Restart ${serviceName} or check system logs`,
          timestamp: Date.now(),
        });
      } else if (status.status === 'DEGRADED') {
        alerts.push({
          id: `service_degraded_${Date.now()}_${serviceName}`,
          severity: AlertSeverity.WARNING,
          type: 'SERVICE_DEGRADED',
          message: `Service '${serviceName}' is degraded (latency: ${status.latency}ms, error rate: ${status.errorRate}%)`,
          suggestedAction: `Monitor or restart ${serviceName}`,
          timestamp: Date.now(),
        });
      }
    }

    return alerts;
  }

  /**
   * Check network health
   */
  private checkNetworkHealth(metrics: SystemHealthMetrics): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // High latency check
    if (metrics.networkLatency > this.LATENCY_CRITICAL_MS) {
      alerts.push({
        id: `network_latency_critical_${Date.now()}`,
        severity: AlertSeverity.CRITICAL,
        type: 'HIGH_NETWORK_LATENCY',
        message: `Network latency is critical: ${metrics.networkLatency}ms`,
        suggestedAction: 'Check network connectivity, may experience transaction delays',
        timestamp: Date.now(),
      });
    } else if (metrics.networkLatency > this.LATENCY_WARNING_MS) {
      alerts.push({
        id: `network_latency_warning_${Date.now()}`,
        severity: AlertSeverity.WARNING,
        type: 'ELEVATED_NETWORK_LATENCY',
        message: `Network latency elevated: ${metrics.networkLatency}ms`,
        suggestedAction: 'Monitor network conditions',
        timestamp: Date.now(),
      });
    }

    // Block time check
    if (metrics.avgBlockTime > 15000) {
      // > 15 seconds is concerning
      alerts.push({
        id: `block_time_alert_${Date.now()}`,
        severity: AlertSeverity.WARNING,
        type: 'SLOW_BLOCK_TIME',
        message: `Average block time is slow: ${metrics.avgBlockTime}ms`,
        suggestedAction: 'Chain may be congested, consider higher gas prices',
        timestamp: Date.now(),
      });
    }

    return alerts;
  }

  /**
   * Check gas conditions
   */
  private checkGasConditions(metrics: SystemHealthMetrics): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // High gas volatility
    if (metrics.gasVolatilityIndex > this.GAS_VOLATILITY_WARNING) {
      alerts.push({
        id: `gas_volatility_alert_${Date.now()}`,
        severity: AlertSeverity.WARNING,
        type: 'HIGH_GAS_VOLATILITY',
        message: `Gas price volatility is high: ${metrics.gasVolatilityIndex}/100`,
        suggestedAction: 'Use gas optimization strategies or wait for stabilization',
        timestamp: Date.now(),
      });
    }

    // Chain congestion
    if (
      metrics.chainCongestion > this.CHAIN_CONGESTION_WARNING
    ) {
      alerts.push({
        id: `chain_congestion_alert_${Date.now()}`,
        severity: AlertSeverity.WARNING,
        type: 'CHAIN_CONGESTION',
        message: `Chain congestion level: ${metrics.chainCongestion}%`,
        suggestedAction: 'Consider scheduling non-urgent transactions for off-peak times',
        timestamp: Date.now(),
      });
    }

    return alerts;
  }

  /**
   * Check system resources
   */
  private checkSystemResources(): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // This would integrate with OS/container metrics in production
    // For now, placeholder for future implementation

    return alerts;
  }

  /**
   * Check error rates
   */
  private checkErrorRates(): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // Calculate average error rate from service statuses
    let totalErrorRate = 0;
    let count = 0;

    for (const status of this.serviceStatuses.values()) {
      totalErrorRate += status.errorRate;
      count++;
    }

    const avgErrorRate = count > 0 ? totalErrorRate / count : 0;

    if (avgErrorRate > this.ERROR_RATE_CRITICAL) {
      alerts.push({
        id: `error_rate_critical_${Date.now()}`,
        severity: AlertSeverity.CRITICAL,
        type: 'HIGH_ERROR_RATE',
        message: `Average system error rate is critical: ${avgErrorRate.toFixed(1)}%`,
        suggestedAction: 'Investigate service failures immediately',
        timestamp: Date.now(),
      });
    } else if (avgErrorRate > this.ERROR_RATE_WARNING) {
      alerts.push({
        id: `error_rate_warning_${Date.now()}`,
        severity: AlertSeverity.WARNING,
        type: 'ELEVATED_ERROR_RATE',
        message: `Average system error rate elevated: ${avgErrorRate.toFixed(1)}%`,
        suggestedAction: 'Monitor and investigate service health',
        timestamp: Date.now(),
      });
    }

    return alerts;
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(
    alerts: HealthAlert[],
    _metrics: SystemHealthMetrics
  ): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    const criticalAlerts = alerts.filter(
      (a) => a.severity === AlertSeverity.CRITICAL
    );
    const warningAlerts = alerts.filter(
      (a) => a.severity === AlertSeverity.WARNING
    );

    if (criticalAlerts.length > 0) {
      return 'CRITICAL';
    }

    if (warningAlerts.length >= 2 || criticalAlerts.length > 0) {
      return 'DEGRADED';
    }

    return 'HEALTHY';
  }

  /**
   * Get latest health check result
   */
  getLatestHealth(): HealthCheckResult | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit: number = 10): HealthCheckResult[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Register service for monitoring
   */
  registerService(serviceName: string): void {
    if (!this.serviceStatuses.has(serviceName)) {
      this.serviceStatuses.set(serviceName, {
        service: serviceName,
        status: 'UP',
        latency: 0,
        errorRate: 0,
        lastCheck: Date.now(),
      });
    }
  }

  /**
   * Update service status
   */
  updateServiceStatus(
    serviceName: string,
    status: ServiceStatus
  ): void {
    this.serviceStatuses.set(serviceName, {
      ...status,
      service: serviceName,
      lastCheck: Date.now(),
    });

    // Check for degradation
    if (status.status !== 'UP') {
      this.emit('service-status-change', { serviceName, status });
    }
  }

  /**
   * Get all service statuses
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Initialize monitored services
   */
  private initializeServices(): void {
    this.registerService('blockchain-indexer');
    this.registerService('loan-service');
    this.registerService('flash-loan-service');
    this.registerService('risk-engine');
    this.registerService('database');
    this.registerService('redis');
  }

  /**
   * Get health status summary
   */
  getSummary(): {
    overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    servicesUp: number;
    servicesDegraded: number;
    servicesDown: number;
    recentAlerts: number;
    metrics: SystemHealthMetrics;
  } {
    const latest = this.getLatestHealth();
    const services = this.getServiceStatuses();

    return {
      overall: latest?.status || 'HEALTHY',
      servicesUp: services.filter((s) => s.status === 'UP').length,
      servicesDegraded: services.filter((s) => s.status === 'DEGRADED').length,
      servicesDown: services.filter((s) => s.status === 'DOWN').length,
      recentAlerts: latest?.alerts.length || 0,
      metrics: latest?.metrics || AIValidationEngine.getSystemHealth(),
    };
  }
}

// Singleton instance
let monitorInstance: SystemHealthMonitor | null = null;

export function getSystemHealthMonitor(): SystemHealthMonitor {
  if (!monitorInstance) {
    monitorInstance = new SystemHealthMonitor();
  }
  return monitorInstance;
}

export default SystemHealthMonitor;
