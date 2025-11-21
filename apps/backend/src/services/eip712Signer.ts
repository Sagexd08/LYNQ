import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

/**
 * EIP-712 compliant signature service for secure off-chain data signing.
 * Implements structured data hashing and signing according to EIP-712 specification.
 */
@Injectable()
export class EIP712Signer {
  private signingKey: ethers.SigningKey;
  private domainSeparator: string;

  constructor(privateKey: string, chainId: number = 1) {
    this.signingKey = new ethers.SigningKey(privateKey);
    this.domainSeparator = this.calculateDomainSeparator(chainId);
  }

  /**
   * EIP-712 Domain Separator calculation
   * Domain: (CHAINID=1, name="LYNQ", version="1", verifyingContract=0x...)
   */
  private calculateDomainSeparator(chainId: number): string {
    const DOMAIN_TYPEHASH = ethers.TypedDataEncoder.hashStruct('EIP712Domain', {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    }, {
      name: 'LYNQ',
      version: '1',
      chainId,
      verifyingContract: ethers.ZeroAddress, // Updated at runtime by contract
    });
    return DOMAIN_TYPEHASH;
  }

  /**
   * Sign a credit risk assessment struct following EIP-712
   * Used to secure credit scoring and risk parameters
   */
  signCreditScore(
    creditScore: number,
    riskTier: string,
    timestamp: number,
    nonce: number,
  ): {
    signature: string;
    digest: string;
  } {
    const types = {
      CreditAssessment: [
        { name: 'creditScore', type: 'uint256' },
        { name: 'riskTier', type: 'string' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const value = {
      creditScore,
      riskTier,
      timestamp,
      nonce,
    };

    const digest = ethers.TypedDataEncoder.hash(
      { name: 'LYNQ', version: '1', chainId: 1, verifyingContract: ethers.ZeroAddress },
      types,
      value,
    );

    const sig = this.signingKey.sign(digest);
    const signature = ethers.Signature.from(sig).serialized;

    return {
      signature,
      digest,
    };
  }

  /**
   * Sign a loan proposal struct following EIP-712
   * Secures loan parameters: amount, collateral, interest rate, duration
   */
  signLoanProposal(
    borrower: string,
    loanAmount: string,
    collateralAmount: string,
    interestRate: number,
    duration: number,
    timestamp: number,
    nonce: number,
  ): {
    signature: string;
    digest: string;
  } {
    const types = {
      LoanProposal: [
        { name: 'borrower', type: 'address' },
        { name: 'loanAmount', type: 'uint256' },
        { name: 'collateralAmount', type: 'uint256' },
        { name: 'interestRate', type: 'uint256' },
        { name: 'duration', type: 'uint256' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const value = {
      borrower,
      loanAmount,
      collateralAmount,
      interestRate,
      duration,
      timestamp,
      nonce,
    };

    const digest = ethers.TypedDataEncoder.hash(
      { name: 'LYNQ', version: '1', chainId: 1, verifyingContract: ethers.ZeroAddress },
      types,
      value,
    );

    const sig = this.signingKey.sign(digest);
    const signature = ethers.Signature.from(sig).serialized;

    return {
      signature,
      digest,
    };
  }

  /**
   * Verify an EIP-712 signature
   */
  verifySignature(
    signer: string,
    digest: string,
    signature: string,
  ): boolean {
    try {
      const recovered = ethers.recoverAddress(digest, signature);
      return recovered.toLowerCase() === signer.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the signing address for this service
   */
  getSignerAddress(): string {
    return this.signingKey.publicKey;
  }

  /**
   * Sign risk parameters for ML model outputs
   */
  signRiskParameters(
    anomalyScore: number,
    defaultProbability: number,
    recoveryRate: number,
    timestamp: number,
    nonce: number,
  ): {
    signature: string;
    digest: string;
  } {
    const types = {
      RiskParameters: [
        { name: 'anomalyScore', type: 'uint256' },
        { name: 'defaultProbability', type: 'uint256' },
        { name: 'recoveryRate', type: 'uint256' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const value = {
      anomalyScore: Math.floor(anomalyScore * 1000), // Scale to uint256
      defaultProbability: Math.floor(defaultProbability * 1000),
      recoveryRate: Math.floor(recoveryRate * 1000),
      timestamp,
      nonce,
    };

    const digest = ethers.TypedDataEncoder.hash(
      { name: 'LYNQ', version: '1', chainId: 1, verifyingContract: ethers.ZeroAddress },
      types,
      value,
    );

    const sig = this.signingKey.sign(digest);
    const signature = ethers.Signature.from(sig).serialized;

    return {
      signature,
      digest,
    };
  }
}
