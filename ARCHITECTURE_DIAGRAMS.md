# AI Validation System - Architecture & Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LYNQ AI Validation System                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      Transaction Entry Point                       │  │
│  │  /api/transaction | /api/flashloan | /api/loan | /api/swap       │  │
│  └────────────────────────────┬────────────────────────────────────┘  │
│                               │                                        │
│                               ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │           AIValidationEngine.validateTransaction()                │  │
│  │                    (Main Validation Hub)                          │  │
│  └────┬───────────────────────────────────────────────────────────┬──┘  │
│       │                                                             │     │
│       ├─► ① Anomaly Detection                                    │     │
│       │   ├─ Velocity Anomaly                                     │     │
│       │   ├─ Amount Anomaly                                       │     │
│       │   ├─ Pattern Deviation                                    │     │
│       │   ├─ Unusual Timing                                       │     │
│       │   ├─ New Recipient                                        │     │
│       │   ├─ Gas Anomaly                                          │     │
│       │   └─ Chain Congestion                                     │     │
│       │                                                             │     │
│       ├─► ② Fraud Detection                                      │     │
│       │   ├─ Account Age Check                                    │     │
│       │   ├─ Success Rate Analysis                                │     │
│       │   ├─ Device/IP Tracking                                   │     │
│       │   ├─ Blacklist Check                                      │     │
│       │   ├─ Multi-Anomaly Correlation                            │     │
│       │   └─ Velocity Pattern Check                               │     │
│       │                                                             │     │
│       ├─► ③ Predictive Warnings                                  │     │
│       │   ├─ High Anomaly Score → WARNING                         │     │
│       │   ├─ Fraud Suspicion → CRITICAL                           │     │
│       │   ├─ Network Congestion → WARNING                         │     │
│       │   ├─ Gas Volatility → WARNING                             │     │
│       │   └─ Low Success Prediction → WARNING                     │     │
│       │                                                             │     │
│       └─► ④ Safe Parameters                                      │     │
│           ├─ Gas Price Suggestion                                  │     │
│           ├─ Slippage Optimization                                │     │
│           ├─ Amount Reduction                                      │     │
│           └─ Safety Score                                          │     │
│                                                                     │     │
│  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │              TransactionValidationResult                      │  │  │
│  │  ├─ isValid: boolean                                          │  │  │
│  │  ├─ riskScore: 0-100                                          │  │  │
│  │  ├─ riskLevel: LOW|MEDIUM|HIGH|CRITICAL                       │  │  │
│  │  ├─ recommendation: APPROVE|WARN|BLOCK                        │  │  │
│  │  ├─ confidence: 0-100                                         │  │  │
│  │  ├─ warnings: PredictiveWarning[]                             │  │  │
│  │  ├─ anomalies: AnomalyDetectionResult                         │  │  │
│  │  ├─ fraud: FraudIndicators                                    │  │  │
│  │  ├─ safeParameters: Record<string, Suggestion>                │  │  │
│  │  └─ autoCorrectionSuggestions: AutoCorrection[]               │  │  │
│  └──────────────────────────────────────────────────────────────┘  │  │
│       │                                                             │     │
│       └──────────────────────────────┬──────────────────────────┘     │
│                                      │                              │
│                    ┌─────────────────┴─────────────────┐             │
│                    ▼                                   ▼             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │   Response to Frontend       │  │   Audit Logging              │ │
│  │                              │  │                              │ │
│  │   {                          │  │  logger.audit({              │ │
│  │     success: true,           │  │    action: 'AI_VALIDATION',  │ │
│  │     data: {                  │  │    outcome: recommendation,  │ │
│  │       riskScore: 35,         │  │    resource: type,           │ │
│  │       warnings: [...],       │  │    metadata: {...}           │ │
│  │       ...                    │  │  });                         │ │
│  │     }                        │  │                              │ │
│  │   }                          │  │                              │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
│       │                                   │                         │
│       ├──────────────────┬────────────────┤                         │
│       │                  │                │                         │
│       ▼                  ▼                ▼                         │
│  Frontend          Admin Dashboard    Monitoring                   │
│  Components        Logs               System                       │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │
│  │ RiskMeter   │  │ Alerts Table│  │ SystemHealthMonitor      │   │
│  │ Component   │  │             │  │                          │   │
│  │             │  │ - Risk Score│  │ ┌────────────────────┐   │   │
│  │ Displays:   │  │ - Flags     │  │ │ 10s Health Checks  │   │   │
│  │ - Score     │  │ - Timestamp │  │ │                    │   │   │
│  │ - Level     │  │ - User ID   │  │ │ Services:          │   │   │
│  │ - Color     │  │             │  │ │ ✓ Blockchain       │   │   │
│  │ - Flags     │  │             │  │ │ ✓ Loans            │   │   │
│  │ - Reasons   │  │             │  │ │ ✓ Flash Loans      │   │   │
│  │             │  │             │  │ │ ✓ Risk Engine      │   │   │
│  │ + Safety    │  │             │  │ │ ✓ Database         │   │   │
│  │   Params    │  │             │  │ │ ✓ Redis            │   │   │
│  └─────────────┘  └─────────────┘  │                        │   │   │
│                                     │ Metrics:               │   │   │
│  ┌─────────────┐                    │ - Latency              │   │   │
│  │ AlertsPanel │                    │ - Gas Price            │   │   │
│  │ Component   │                    │ - Congestion           │   │   │
│  │             │                    │ - Success Rate         │   │   │
│  │ Displays:   │                    │ - Error Rates          │   │   │
│  │ - Severity  │                    └────────────────────┘   │   │   │
│  │ - Message   │                                            │   │   │
│  │ - Action    │                    Events:                 │   │   │
│  │ - Timestamp │                    ➜ health-alert          │   │   │
│  │             │                    ➜ health-degraded       │   │   │
│  │ + Dismiss   │                    ➜ service-status-change │   │   │
│  └─────────────┘                    └──────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Transaction Request
         │
         ▼
    ┌─────────────┐
    │ Input Data  │ (transactionData, walletData)
    └──────┬──────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Zod Validation               │
    │ (Input Schema Check)         │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Get User Behavior Profile    │
    │ (Or Create Default)          │
    └──────┬───────────────────────┘
           │
    ┌──────┴─────────┬────────────────┬─────────────────┐
    │                │                │                 │
    ▼                ▼                ▼                 ▼
Anomaly Detection  Fraud Detection  Predictive Warning Safe Parameters
    │                │                │                 │
    ├─► Calculate   ├─► Account Age  ├─► Check Score  ├─► Gas Price
    │   Velocity    │   Success Rate  │   Check Flags  │   Slippage
    ├─► Amount      ├─► Device Change│   Network      │   Amount
    │   Analysis    │   IP Tracking   │   Congestion   │   Limits
    ├─► Pattern     ├─► Blacklist     └─► Gas Vol      │
    │   Check       │   Check             Gas Anomaly  │
    ├─► Timing      └─► Multi-         Alert Gen   │
    │   Analysis        Anomaly                        │
    └─► Recipient       Correlation              ┌─────┴───┐
        Check                                     │         │
        Gas Price                    ┌────────────┘         │
        Chain Con.                   │                      │
                                     ▼                      ▼
                            Warnings & Alerts    Suggestions Map
                            
                                     │                      │
                                     └──────────┬───────────┘
                                               │
                                               ▼
                                    Calculate Risk Score
                                    (40% anomaly + 40% fraud
                                     + 20% warnings)
                                               │
                                               ▼
                                    Determine Risk Level
                                    (LOW|MEDIUM|HIGH|CRITICAL)
                                               │
                                               ▼
                                    Generate Recommendation
                                    (APPROVE|WARN|BLOCK)
                                               │
                                               ▼
                                    Calculate Confidence
                                    (0-100)
                                               │
                                               ▼
                                    Package Result
                                    TransactionValidationResult
                                               │
                                ┌──────────────┼──────────────┐
                                │              │              │
                                ▼              ▼              ▼
                            Log Audit     Send Response   Update Profile
```

## Component Hierarchy

```
Dashboard
│
├── TransactionValidationPanel
│   │
│   ├── RiskMeter
│   │   ├── RiskScaleIndicator
│   │   ├── RiskBar
│   │   │   ├── AnimatedFill
│   │   │   └── GradientBackground
│   │   ├── StatsSection
│   │   │   ├── RiskLevelBadge
│   │   │   └── ConfidenceBadge
│   │   ├── FlagsSection
│   │   │   └── FlagItem (map)
│   │   ├── ReasonsSection
│   │   │   └── ReasonItem (map)
│   │   └── RecommendationBox
│   │       ├── IconApprove|Warn|Block
│   │       └── Message
│   │
│   └── AlertsPanel
│       ├── AlertsSummary
│       │   ├── CriticalBadge
│       │   └── WarningBadge
│       ├── AlertsList (scrollable)
│       │   └── AlertItem (map)
│       │       ├── SeverityIndicator
│       │       ├── AlertTitle
│       │       ├── AlertMessage
│       │       ├── SuggestedAction
│       │       ├── Timestamp
│       │       └── DismissButton
│       └── HiddenAlertsIndicator
│
└── ParameterSuggestionsPanel
    ├── SafeParameterCard (map)
    │   ├── ParameterName
    │   ├── CurrentValue
    │   ├── SuggestedValue
    │   ├── Reason
    │   └── SafetyScore
    │
    └── AutoCorrectionCard (map)
        ├── ParameterName
        ├── Suggestion
        ├── Reason
        └── ImpactEstimate
```

## Service Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      Express Server                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ routes/ai.ts │  │ routes/users │  │ routes/loans │
    │              │  │              │  │              │
    │ POST /ai/    │  │              │  │              │
    │ validate     │  └──────────────┘  └──────────────┘
    │              │         │                  │
    │ GET /ai/     │         │                  │
    │ health       │         └────────┬─────────┘
    │              │                  │
    │ POST /ai/    │                  ▼
    │ risk (exists)│      ┌──────────────────────────┐
    └──────┬───────┘      │   AIValidationEngine     │
           │              │                          │
           └─────────────►│  - validateTransaction  │
                          │  - detectAnomalies      │
                          │  - detectFraud          │
                          │  - generateWarnings     │
                          │  - suggestParameters    │
                          │                          │
                          │  + updateSystemMetrics  │
                          │  + updateUserProfile    │
                          │  + getSystemHealth      │
                          └──────┬──────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────────┐ ┌──────────────┐ ┌───────────────┐
            │ riskEngine   │ │ Logger       │ │ SystemHealth  │
            │ (existing)   │ │ Service      │ │ Monitor       │
            │              │ │              │ │               │
            │ Methods:     │ │ - logger.    │ │ - start()     │
            │ - assessRisk │ │   audit()    │ │ - stop()      │
            │ - assess     │ │ - logger.    │ │ - register    │
            │   CreditRisk │ │   error()    │ │   Service()   │
            │              │ │              │ │ - update      │
            │              │ │              │ │   Status()    │
            │              │ │              │ │ - getSummary()│
            └──────────────┘ └──────────────┘ └───────────────┘
                    │            │                    │
                    ▼            ▼                    ▼
            External Data  Audit Logs        Health History
            & Contracts    Database          & Alerts
```

## Database Schema (Audit Logs)

```sql
-- Audit Log Table (for validation events)
CREATE TABLE ai_validation_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  action VARCHAR(50),           -- 'AI_VALIDATION'
  outcome VARCHAR(20),          -- 'PASS', 'FAIL', 'WARN'
  resource VARCHAR(100),        -- 'transaction:flashloan'
  user_id VARCHAR(255),
  risk_score SMALLINT,          -- 0-100
  risk_level VARCHAR(20),       -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  recommendation VARCHAR(20),   -- 'APPROVE', 'WARN', 'BLOCK'
  confidence SMALLINT,          -- 0-100
  warnings_count SMALLINT,
  anomalies_count SMALLINT,
  fraud_score SMALLINT,
  duration_ms INTEGER,          -- Validation duration
  metadata JSONB,               -- Additional context
  created_at TIMESTAMP DEFAULT NOW(),
  indexed BOOLEAN DEFAULT false
);

-- Health Check History (optional, can also use monitoring system)
CREATE TABLE health_check_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  overall_status VARCHAR(20),   -- 'HEALTHY', 'DEGRADED', 'CRITICAL'
  services_up SMALLINT,
  services_degraded SMALLINT,
  services_down SMALLINT,
  network_latency SMALLINT,
  gas_price SMALLINT,
  chain_congestion SMALLINT,
  success_rate SMALLINT,
  error_count SMALLINT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Event Flow Diagram

```
Transaction Input
       │
       ▼
┌─────────────────────────────────────────┐
│  AIValidationEngine.validateTransaction │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   Success Path          Error Path
        │                     │
        ├─► Result Generated  ├─► Error Logged
        │                     │
        ├─► Audit Log         ├─► Safe Default
        │   Recorded          │   Returned
        │                     │
        ├─► Events Emitted    └──► System Alert
        │   (SystemHealth         (Critical)
        │    Monitor)
        │
        ├─► Warnings Checked
        │   for Severity
        │
        ├─► Profile Updated
        │
        └─► Response Sent
            to Client
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    Frontend       Admin Dashboard
    Display        Analysis
        │                 │
        ├─► RiskMeter    ├─► Metrics
        │   Display      │   Database
        │                │
        └─► AlertsPanel  └─► Historical
            Show             Trends
```

## Monitoring & Alerting Flow

```
SystemHealthMonitor (runs every 10s)
         │
         ▼
    Health Check
         │
    ┌────┴────┬────────┬──────────┬──────────┐
    │          │        │          │          │
    ▼          ▼        ▼          ▼          ▼
  Network   Service  Gas Price  Resource  Error
  Health    Status   Check      Check     Rate
    │          │        │          │        │
    └────┬─────┴────┬───┴──────┬───┴────┬──┘
         │          │          │        │
         ▼          ▼          ▼        ▼
   Collect Alerts (if any)
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
  None         Critical/Warning
    │              │
    │              ├─► Emit Event
    │              │   - health-alert
    │              │   - health-degraded
    │              │
    │              ├─► Log Alert
    │              │
    │              └─► Store in History
    │
    └─► Store Result
        in History
        
Event Listeners Respond:
    │
    ├─► On 'health-alert'
    │   - Update Dashboard
    │   - Notify Monitoring System
    │   - Check If Critical
    │
    └─► On 'service-status-change'
        - Alert Team
        - Trigger Scaling
        - Update Admin UI
```

---

**Diagram Version**: 1.0
**Last Updated**: November 17, 2025

For more details, see `AI_VALIDATION_SYSTEM.md`
