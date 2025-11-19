import React, { useEffect, useState } from 'react';
import './AlertsPanel.css';

/**
 * Alerts & Warnings Panel Component
 * Displays real-time transaction warnings and system alerts
 */

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  suggestedAction?: string;
  timestamp: number;
  dismissible?: boolean;
}

export interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  maxVisibleAlerts?: number;
  autoHideDuration?: number; // ms, 0 = never auto-hide
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onDismiss,
  maxVisibleAlerts = 5,
  autoHideDuration = 8000,
}) => {
  const [visibleAlerts, setVisibleAlerts] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show new alerts
    const newAlerts = new Set(visibleAlerts);
    alerts.forEach((alert) => {
      if (!dismissedAlerts.has(alert.id)) {
        newAlerts.add(alert.id);
      }
    });
    setVisibleAlerts(newAlerts);

    // Auto-hide info alerts
    if (autoHideDuration > 0) {
      const timers = alerts
        .filter((a) => a.severity === AlertSeverity.INFO && visibleAlerts.has(a.id))
        .map((alert) =>
          setTimeout(() => {
            handleDismiss(alert.id);
          }, autoHideDuration)
        );

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
  }, [alerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
    setVisibleAlerts((prev) => {
      const next = new Set(prev);
      next.delete(alertId);
      return next;
    });
    onDismiss?.(alertId);
  };

  const visibleAlertsList = alerts
    .filter((a) => !dismissedAlerts.has(a.id))
    .slice(0, maxVisibleAlerts);

  const hiddenCount = alerts.filter((a) => !dismissedAlerts.has(a.id)).length - visibleAlertsList.length;

  const criticalCount = visibleAlertsList.filter(
    (a) => a.severity === AlertSeverity.CRITICAL
  ).length;
  const warningCount = visibleAlertsList.filter(
    (a) => a.severity === AlertSeverity.WARNING
  ).length;

  return (
    <div className="alerts-panel">
      {visibleAlertsList.length === 0 ? (
        <div className="alerts-empty">
          <span className="empty-icon">✓</span>
          <p>No alerts</p>
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          <div className="alerts-summary">
            {criticalCount > 0 && (
              <div className="summary-badge critical">
                <span className="badge-icon">🔴</span>
                <span className="badge-text">{criticalCount} Critical</span>
              </div>
            )}
            {warningCount > 0 && (
              <div className="summary-badge warning">
                <span className="badge-icon">🟡</span>
                <span className="badge-text">{warningCount} Warning</span>
              </div>
            )}
          </div>

          {/* Alerts List */}
          <div className="alerts-list">
            {visibleAlertsList.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
              />
            ))}
          </div>

          {/* Hidden Alerts Count */}
          {hiddenCount > 0 && (
            <div className="alerts-hidden">
              <p>+{hiddenCount} more alerts (scroll or check logs)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface AlertItemProps {
  alert: Alert;
  onDismiss: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onDismiss }) => {
  const getSeverityClass = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'critical';
      case AlertSeverity.WARNING:
        return 'warning';
      case AlertSeverity.INFO:
        return 'info';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '🔴';
      case AlertSeverity.WARNING:
        return '⚠️';
      case AlertSeverity.INFO:
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`alert-item ${getSeverityClass(alert.severity)}`}>
      <div className="alert-header">
        <div className="alert-title-group">
          <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
          <div className="alert-title-content">
            <h4 className="alert-title">{alert.type}</h4>
            <p className="alert-message">{alert.message}</p>
          </div>
        </div>
        {(alert.dismissible !== false) && (
          <button
            className="alert-close"
            onClick={() => onDismiss(alert.id)}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>

      {alert.suggestedAction && (
        <div className="alert-action">
          <span className="action-label">Suggested Action:</span>
          <p className="action-text">{alert.suggestedAction}</p>
        </div>
      )}

      <div className="alert-timestamp">
        {formatTime(alert.timestamp)}
      </div>
    </div>
  );
};

export default AlertsPanel;
