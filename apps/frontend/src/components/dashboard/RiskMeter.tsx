import React, { useMemo } from 'react';
import './RiskMeter.css';

/**
 * Risk Meter Visualization Component
 * Displays transaction risk scoring with visual feedback
 */

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface RiskMeterProps {
  score: number; // 0-100
  level: RiskLevel;
  recommendation: 'APPROVE' | 'WARN' | 'BLOCK';
  confidence: number; // 0-100
  flags?: string[];
  reasons?: string[];
  showDetails?: boolean;
  compact?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  level,
  recommendation,
  confidence,
  flags = [],
  reasons = [],
  showDetails = true,
  compact = false,
}) => {
  const riskColor = useMemo(() => {
    switch (level) {
      case RiskLevel.LOW:
        return '#10b981'; // Green
      case RiskLevel.MEDIUM:
        return '#f59e0b'; // Amber
      case RiskLevel.HIGH:
        return '#ef4444'; // Red
      case RiskLevel.CRITICAL:
        return '#7c2d12'; // Dark red
      default:
        return '#6b7280'; // Gray
    }
  }, [level]);

  const recommendationColor = useMemo(() => {
    switch (recommendation) {
      case 'APPROVE':
        return '#10b981';
      case 'WARN':
        return '#f59e0b';
      case 'BLOCK':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }, [recommendation]);

  const getRecommendationText = (): string => {
    switch (recommendation) {
      case 'APPROVE':
        return 'Proceed';
      case 'WARN':
        return 'Proceed with Caution';
      case 'BLOCK':
        return 'Blocked';
      default:
        return 'Unknown';
    }
  };

  if (compact) {
    return (
      <div className="risk-meter-compact">
        <div
          className="risk-meter-bar-compact"
          style={{
            width: `${score}%`,
            backgroundColor: riskColor,
          }}
        />
        <div className="risk-meter-label-compact">
          <span className="risk-score-compact">{score}</span>
          <span className="risk-level-compact">{level}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-meter-container">
      <div className="risk-meter-header">
        <h3 className="risk-meter-title">Risk Assessment</h3>
        <div className="risk-meter-recommendation" style={{ borderColor: recommendationColor }}>
          <span className="recommendation-dot" style={{ backgroundColor: recommendationColor }} />
          <span className="recommendation-text">{getRecommendationText()}</span>
        </div>
      </div>

      {/* Visual Meter */}
      <div className="risk-meter-visual">
        <div className="risk-meter-scale">
          <div className="risk-scale-label">Low</div>
          <div className="risk-scale-label">Medium</div>
          <div className="risk-scale-label">High</div>
          <div className="risk-scale-label">Critical</div>
        </div>

        <div className="risk-meter-bar-container">
          <div
            className="risk-meter-bar"
            style={{
              width: `${score}%`,
              backgroundColor: riskColor,
              transition: 'width 0.3s ease-out, background-color 0.3s ease-out',
            }}
          />
        </div>

        <div className="risk-meter-score">
          <span className="score-value">{score}</span>
          <span className="score-label">/100</span>
        </div>
      </div>

      {/* Risk Level and Confidence */}
      <div className="risk-meter-stats">
        <div className="stat-item">
          <span className="stat-label">Risk Level</span>
          <span className="stat-value" style={{ color: riskColor }}>
            {level}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Confidence</span>
          <span className="stat-value">{confidence}%</span>
        </div>
      </div>

      {/* Flags */}
      {showDetails && flags.length > 0 && (
        <div className="risk-meter-flags">
          <h4 className="flags-title">Alerts</h4>
          <div className="flags-list">
            {flags.map((flag, idx) => (
              <div key={idx} className="flag-item">
                <span className="flag-icon">⚠️</span>
                <span className="flag-text">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasons */}
      {showDetails && reasons.length > 0 && (
        <div className="risk-meter-reasons">
          <h4 className="reasons-title">Factors</h4>
          <ul className="reasons-list">
            {reasons.slice(0, 5).map((reason, idx) => (
              <li key={idx} className="reason-item">
                {reason}
              </li>
            ))}
            {reasons.length > 5 && (
              <li className="reason-item more">
                +{reasons.length - 5} more factors
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Recommendation Details */}
      {showDetails && (
        <div className="risk-meter-action">
          {recommendation === 'APPROVE' && (
            <div className="action-box approve">
              <span className="action-icon">✓</span>
              <p>This transaction appears safe to proceed.</p>
            </div>
          )}
          {recommendation === 'WARN' && (
            <div className="action-box warn">
              <span className="action-icon">⚠</span>
              <p>Review transaction details before proceeding.</p>
            </div>
          )}
          {recommendation === 'BLOCK' && (
            <div className="action-box block">
              <span className="action-icon">✕</span>
              <p>Transaction is too risky and has been blocked.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskMeter;
