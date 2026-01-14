import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';

export interface RiskApprovalData {
  loanId: string;
  walletAddress: string;
  amount: number;
  interestRate: number;
  termDays: number;
  riskLevel: string;
  creditScore: number;
}

export interface SignedApproval {
  approvalHash: string;
  signature: string;
  expiresAt: Date;
  message: string;
}

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);
  private wallet: ethers.Wallet | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeWallet();
  }

  private initializeWallet() {
    const privateKey =
      this.configService.get<string>('RISK_SIGNER_PRIVATE_KEY') ||
      this.configService.get<string>('PRIVATE_KEY');

    if (privateKey) {
      try {
        this.wallet = new ethers.Wallet(privateKey);
        this.logger.log(`Risk signer initialized: ${this.wallet.address}`);
      } catch (error) {
        this.logger.warn(`Failed to initialize risk signer: ${error.message}`);
      }
    } else {
      this.logger.warn('No private key configured for risk signatures');
    }
  }

  async generateApprovalSignature(
    data: RiskApprovalData,
  ): Promise<SignedApproval | null> {
    if (!this.wallet) {
      this.logger.warn('Cannot generate signature: wallet not initialized');
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const message = this.constructApprovalMessage(data, expiresAt);
    const approvalHash = ethers.keccak256(ethers.toUtf8Bytes(message));

    try {
      const signature = await this.wallet.signMessage(
        ethers.getBytes(approvalHash),
      );

      await this.prisma.riskApprovalSignature.create({
        data: {
          loanId: data.loanId,
          walletAddress: data.walletAddress.toLowerCase(),
          approvalHash,
          signature,
          expiresAt,
        },
      });

      this.logger.log(
        `Generated risk approval signature for loan ${data.loanId}`,
      );

      return {
        approvalHash,
        signature,
        expiresAt,
        message,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate approval signature: ${error.message}`,
      );
      return null;
    }
  }

  private constructApprovalMessage(
    data: RiskApprovalData,
    expiresAt: Date,
  ): string {
    return JSON.stringify({
      type: 'LYNQ_LOAN_APPROVAL',
      loanId: data.loanId,
      walletAddress: data.walletAddress.toLowerCase(),
      amount: data.amount.toString(),
      interestRate: data.interestRate.toString(),
      termDays: data.termDays.toString(),
      riskLevel: data.riskLevel,
      creditScore: data.creditScore.toString(),
      expiresAt: expiresAt.toISOString(),
    });
  }

  async verifyApprovalSignature(
    approvalHash: string,
    signature: string,
  ): Promise<boolean> {
    if (!this.wallet) {
      return false;
    }

    try {
      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(approvalHash),
        signature,
      );

      return (
        recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase()
      );
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  async markSignatureUsed(approvalHash: string): Promise<void> {
    try {
      await this.prisma.riskApprovalSignature.updateMany({
        where: { approvalHash },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to mark signature as used: ${error.message}`);
    }
  }

  async isSignatureValid(approvalHash: string): Promise<boolean> {
    const record = await this.prisma.riskApprovalSignature.findFirst({
      where: { approvalHash },
    });

    if (!record) {
      return false;
    }

    if (record.used) {
      return false;
    }

    if (new Date() > record.expiresAt) {
      return false;
    }

    return true;
  }

  getSignerAddress(): string | null {
    return this.wallet?.address || null;
  }
}
