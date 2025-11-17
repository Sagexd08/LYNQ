import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import logger from '../../../backend/src/utils/logger';

interface Recipient {
  address: string;
  amount: string;
}

interface MultiWalletFlashLoanFormProps {
  userAddress: string;
  onSuccess?: (result: { batchId: string; txHash: string }) => void;
  onError?: (error: string) => void;
}

/**
 * Multi-Wallet Flash Loan Form Component
 * Allows users to execute flash loans distributed to multiple recipients
 */
export const MultiWalletFlashLoanForm: React.FC<MultiWalletFlashLoanFormProps> = ({
  userAddress,
  onSuccess,
  onError,
}) => {
  // Form state
  const [asset, setAsset] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', amount: '' },
    { address: '', amount: '' },
  ]);
  const [receiverContract, setReceiverContract] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);

  /**
   * Add a new recipient input field
   */
  const addRecipient = useCallback(() => {
    if (recipients.length < 20) {
      setRecipients([...recipients, { address: '', amount: '' }]);
    }
  }, [recipients]);

  /**
   * Remove a recipient by index
   */
  const removeRecipient = useCallback((index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  }, [recipients]);

  /**
   * Update recipient address
   */
  const updateRecipientAddress = useCallback(
    (index: number, address: string) => {
      const updated = [...recipients];
      updated[index].address = address;
      setRecipients(updated);
    },
    [recipients]
  );

  /**
   * Update recipient amount
   */
  const updateRecipientAmount = useCallback(
    (index: number, amount: string) => {
      const updated = [...recipients];
      updated[index].amount = amount;
      setRecipients(updated);

      // Recalculate total if all amounts are provided
      calculateTotal(updated);
    },
    [recipients]
  );

  /**
   * Calculate total from recipient amounts
   */
  const calculateTotal = (recipientList: Recipient[]) => {
    try {
      const total = recipientList.reduce((sum, r) => {
        if (r.amount) {
          return sum + BigInt(ethers.parseEther(r.amount));
        }
        return sum;
      }, 0n);
      setTotalAmount(ethers.formatEther(total));
    } catch (err) {
      // Ignore parsing errors
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    setError(null);

    if (!asset) {
      setError('Asset address is required');
      return false;
    }

    if (!ethers.getAddress(asset)) {
      setError('Invalid asset address');
      return false;
    }

    if (!totalAmount || BigInt(ethers.parseEther(totalAmount)) <= 0n) {
      setError('Total amount must be greater than 0');
      return false;
    }

    if (recipients.length === 0 || recipients.length > 20) {
      setError('You must have between 1 and 20 recipients');
      return false;
    }

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.address) {
        setError(`Recipient ${i + 1} address is required`);
        return false;
      }
      if (!ethers.getAddress(r.address)) {
        setError(`Recipient ${i + 1} has invalid address`);
        return false;
      }
      if (!r.amount || BigInt(ethers.parseEther(r.amount)) <= 0n) {
        setError(`Recipient ${i + 1} amount must be greater than 0`);
        return false;
      }
    }

    if (!receiverContract) {
      setError('Receiver contract address is required');
      return false;
    }

    if (!ethers.getAddress(receiverContract)) {
      setError('Invalid receiver contract address');
      return false;
    }

    // Validate allocations sum to total
    const allocationSum = recipients.reduce((sum, r) => {
      return sum + BigInt(ethers.parseEther(r.amount));
    }, 0n);

    if (allocationSum !== BigInt(ethers.parseEther(totalAmount))) {
      setError('Allocations must sum to total amount');
      return false;
    }

    return true;
  };

  /**
   * Assess risk before getting quote
   */
  const handleAssessRisk = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/flashloans/multi/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiator: userAddress,
          asset,
          totalAmount: ethers.parseEther(totalAmount).toString(),
          recipients: recipients.map(r => r.address),
          allocations: recipients.map(r => ethers.parseEther(r.amount).toString()),
          receiverContract,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assess risk');
      }

      const data = await response.json();
      setRiskScore(data.data.riskScore);

      // Show risk level warning if needed
      if (data.data.recommendation === 'BLOCK') {
        setError(`⚠️ Transaction blocked: ${data.data.reasons?.[0] || 'High risk detected'}`);
      } else if (data.data.recommendation === 'WARN') {
        setError(`⚠️ Warning: ${data.data.reasons?.[0] || 'Medium risk detected'}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [asset, totalAmount, recipients, receiverContract, userAddress, onError]);

  /**
   * Fetch quote for the flash loan
   */
  const handleGetQuote = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/flashloans/multi/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset,
          totalAmount: ethers.parseEther(totalAmount).toString(),
          recipientCount: recipients.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get quote');
      }

      const data = await response.json();
      setQuote(data.data);
      setRiskScore(Math.floor(Math.random() * 100)); // Placeholder - would come from risk engine
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [asset, totalAmount, recipients, onError]);

  /**
   * Execute the multi-wallet flash loan
   */
  const handleExecute = useCallback(async () => {
    if (!validateForm() || !quote) {
      setError('Please get a quote first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/flashloans/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiator: userAddress,
          asset,
          totalAmount: ethers.parseEther(totalAmount).toString(),
          recipients: recipients.map(r => r.address),
          allocations: recipients.map(r => ethers.parseEther(r.amount).toString()),
          receiverContract,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to execute flash loan');
      }

      const data = await response.json();
      onSuccess?.(data.data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, asset, totalAmount, recipients, receiverContract, quote, onSuccess, onError]);

  return (
    <div className="multi-wallet-flash-loan-form">
      <h2>Multi-Wallet Flash Loan</h2>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Risk Score Display */}
      {riskScore !== null && (
        <div className="risk-score">
          <label>Risk Score:</label>
          <div className="score">{riskScore}/100</div>
        </div>
      )}

      {/* Asset Input */}
      <div className="form-group">
        <label htmlFor="asset">Asset Address *</label>
        <input
          id="asset"
          type="text"
          placeholder="0x..."
          value={asset}
          onChange={e => setAsset(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Total Amount Display */}
      <div className="form-group">
        <label>Total Amount</label>
        <div className="total-amount">{totalAmount || '0'}</div>
      </div>

      {/* Recipients */}
      <div className="recipients-section">
        <h3>Recipients ({recipients.length}/20)</h3>
        {recipients.map((recipient, index) => (
          <div key={index} className="recipient-row">
            <input
              type="text"
              placeholder="Recipient address 0x..."
              value={recipient.address}
              onChange={e => updateRecipientAddress(index, e.target.value)}
              disabled={isLoading}
              className="recipient-address"
            />
            <input
              type="number"
              placeholder="Amount"
              value={recipient.amount}
              onChange={e => updateRecipientAmount(index, e.target.value)}
              disabled={isLoading}
              step="0.01"
              className="recipient-amount"
            />
            <button
              onClick={() => removeRecipient(index)}
              disabled={isLoading || recipients.length === 1}
              className="remove-btn"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addRecipient}
          disabled={isLoading || recipients.length >= 20}
          className="add-recipient-btn"
        >
          + Add Recipient
        </button>
      </div>

      {/* Receiver Contract */}
      <div className="form-group">
        <label htmlFor="receiver">Receiver Contract *</label>
        <input
          id="receiver"
          type="text"
          placeholder="0x..."
          value={receiverContract}
          onChange={e => setReceiverContract(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Quote Display */}
      {quote && (
        <div className="quote-display">
          <h3>Quote</h3>
          <p>Premium: {ethers.formatEther(quote.premium)} ({quote.feeBps} bps)</p>
          <p>Estimated Gas: {quote.estimatedGas} gas</p>
          <p>Est. Gas Cost: {ethers.formatEther(quote.estimatedGasCost)}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleAssessRisk}
          disabled={isLoading}
          className="assess-risk-btn"
        >
          {isLoading ? 'Assessing...' : 'Assess Risk'}
        </button>
        <button
          onClick={handleGetQuote}
          disabled={isLoading}
          className="get-quote-btn"
        >
          {isLoading ? 'Loading...' : 'Get Quote'}
        </button>
        <button
          onClick={handleExecute}
          disabled={isLoading || !quote}
          className="execute-btn"
        >
          {isLoading ? 'Executing...' : 'Execute Flash Loan'}
        </button>
      </div>
    </div>
  );
};

export default MultiWalletFlashLoanForm;
