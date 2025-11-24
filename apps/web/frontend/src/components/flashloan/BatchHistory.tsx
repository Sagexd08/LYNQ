import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useFlashLoanMultiWalletStore } from '../../store/useFlashLoanMultiWalletStore';

interface BatchHistoryProps {
  userAddress: string;
  refreshInterval?: number;
}

/**
 * Batch History Component
 * Displays user's multi-wallet flash loan batch execution history
 */
export const BatchHistory: React.FC<BatchHistoryProps> = ({
  userAddress,
  refreshInterval = 30000,
}) => {
  const {
    userBatches,
    isLoadingHistory,
    fetchUserBatches,
  } = useFlashLoanMultiWalletStore();

  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  // Fetch batches on mount and set up refresh interval
  useEffect(() => {
    fetchUserBatches(userAddress);
    const interval = setInterval(() => {
      fetchUserBatches(userAddress);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [userAddress, refreshInterval, fetchUserBatches]);

  /**
   * Format timestamp to readable format
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  /**
   * Format amount to readable format
   */
  const formatAmount = (amount: string): string => {
    try {
      return ethers.formatEther(amount);
    } catch {
      return amount;
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (success: boolean): string => {
    return success ? 'status-success' : 'status-failed';
  };

  return (
    <div className="batch-history">
      <div className="history-header">
        <h3>Batch Execution History</h3>
        <button
          onClick={() => fetchUserBatches(userAddress)}
          disabled={isLoadingHistory}
          className="refresh-btn"
        >
          {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoadingHistory && userBatches.length === 0 && (
        <div className="loading">Loading batches...</div>
      )}

      {!isLoadingHistory && userBatches.length === 0 && (
        <div className="empty-state">No batches found</div>
      )}

      {userBatches.length > 0 && (
        <div className="batch-list">
          {userBatches.map((batch) => (
            <div key={batch.batchId} className="batch-item">
              <div className="batch-row-main">
                <div className="batch-info">
                  <div className="batch-id">
                    <strong>Batch ID:</strong> {batch.batchId.slice(0, 10)}...
                  </div>
                  <div className="batch-time">
                    {formatTimestamp(batch.timestamp)}
                  </div>
                </div>

                <div className="batch-amount">
                  <strong>{formatAmount(batch.totalAmount)}</strong>
                  <span className="asset-symbol">
                    ({batch.asset.slice(0, 6)}...)
                  </span>
                </div>

                <div className={`batch-status ${getStatusColor(batch.success)}`}>
                  {batch.success ? 'Success' : 'Failed'}
                </div>

                <button
                  onClick={() =>
                    setExpandedBatch(
                      expandedBatch === batch.batchId ? null : batch.batchId
                    )
                  }
                  className="expand-btn"
                >
                  {expandedBatch === batch.batchId ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedBatch === batch.batchId && (
                <div className="batch-details">
                  <div className="detail-section">
                    <h4>Batch Information</h4>
                    <div className="detail-item">
                      <span className="label">Batch ID:</span>
                      <span className="value">{batch.batchId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Asset:</span>
                      <span className="value">{batch.asset}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Total Amount:</span>
                      <span className="value">{formatAmount(batch.totalAmount)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Premium:</span>
                      <span className="value">{formatAmount(batch.premium)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className={`value ${getStatusColor(batch.success)}`}>
                        {batch.success ? '✓ Success' : '✗ Failed'}
                      </span>
                    </div>
                    {batch.failureReason && (
                      <div className="detail-item">
                        <span className="label">Failure Reason:</span>
                        <span className="value error">{batch.failureReason}</span>
                      </div>
                    )}
                    {batch.txHash && (
                      <div className="detail-item">
                        <span className="label">Tx Hash:</span>
                        <a
                          href={`https://etherscan.io/tx/${batch.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="value tx-link"
                        >
                          {batch.txHash.slice(0, 10)}...
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h4>Recipients ({batch.recipients.length})</h4>
                    <div className="recipients-table">
                      <div className="table-header">
                        <span className="col-address">Address</span>
                        <span className="col-amount">Amount</span>
                      </div>
                      {batch.recipients.map((recipient, index) => (
                        <div key={index} className="table-row">
                          <span className="col-address">
                            {recipient.slice(0, 6)}...{recipient.slice(-4)}
                          </span>
                          <span className="col-amount">
                            {batch.allocations[index] ? formatAmount(batch.allocations[index]) : '0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchHistory;
