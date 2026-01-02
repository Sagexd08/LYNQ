import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class TransactionValidator {
  private readonly logger = new Logger(TransactionValidator.name);

  validateTransactionHash(hash: string, chain: string): boolean {
    if (!hash.startsWith('0x')) {
      this.logger.warn(`Invalid transaction hash: missing 0x prefix: ${hash}`);
      throw new BadRequestException(`Transaction hash must start with 0x`);
    }
    const hashWithoutPrefix = hash.slice(2);
    if (!/^[0-9a-fA-F]+$/.test(hashWithoutPrefix)) {
      this.logger.warn(`Invalid transaction hash: non-hex characters: ${hash}`);
      throw new BadRequestException(`Transaction hash contains invalid characters`);
    }
    const validLengths = [64];
    if (!validLengths.includes(hashWithoutPrefix.length)) {
      this.logger.warn(`Invalid transaction hash length for ${chain}: ${hash.length}`);
      throw new BadRequestException(
        `Transaction hash must be 32 bytes (64 hex chars). Got: ${hashWithoutPrefix.length}`
      );
    }
    return true;
  }

  validateAddress(address: string, chain?: string): boolean {
    if (!address.startsWith('0x')) {
      this.logger.warn(`Invalid address: missing 0x prefix: ${address}`);
      throw new BadRequestException(`Address must start with 0x`);
    }
    const addressWithoutPrefix = address.slice(2);
    if (!/^[0-9a-fA-F]+$/.test(addressWithoutPrefix)) {
      this.logger.warn(`Invalid address: non-hex characters: ${address}`);
      throw new BadRequestException(`Address contains invalid characters`);
    }
    if (addressWithoutPrefix.length !== 40) {
      this.logger.warn(`Invalid address length: ${address.length}`);
      throw new BadRequestException(
        `Address must be 20 bytes (40 hex chars). Got: ${addressWithoutPrefix.length}`
      );
    }
    try {
      ethers.getAddress(address);
    } catch (error) {
      this.logger.warn(`Invalid address checksum: ${address}`);
      throw new BadRequestException(`Invalid address checksum`);
    }
    return true;
  }

  validateCollateralAmount(
    collateralAmount: string,
    loanAmount: string,
    minCollateralizationRatio: number = 1.5
  ): boolean {
    if (!DecimalUtil.isValidNumericString(collateralAmount)) {
      throw new BadRequestException(`Invalid collateral amount`);
    }
    if (!DecimalUtil.isValidNumericString(loanAmount)) {
      throw new BadRequestException(`Invalid loan amount`);
    }
    const collateral = DecimalUtil.fromString(collateralAmount);
    const loan = DecimalUtil.fromString(loanAmount);
    if (!DecimalUtil.isPositive(collateral) || !DecimalUtil.isPositive(loan)) {
      throw new BadRequestException(`Amounts must be positive`);
    }
    const ratio = DecimalUtil.divide(collateral, loan);
    const minRatio = DecimalUtil.fromNumber(minCollateralizationRatio);
    if (DecimalUtil.lessThan(ratio, minRatio)) {
      this.logger.warn(
        `Insufficient collateral: ${collateralAmount} for loan ${loanAmount} (ratio: ${DecimalUtil.toFixed(ratio, 2)})`
      );
      throw new BadRequestException(
        `Insufficient collateral. Required ratio: ${minCollateralizationRatio}x, got: ${DecimalUtil.toFixed(ratio, 2)}x`
      );
    }
    return true;
  }

  validateNumericString(value: string, fieldName: string): boolean {
    if (!DecimalUtil.isValidNumericString(value)) {
      throw new BadRequestException(`${fieldName} must be a valid number string`);
    }
    const dec = DecimalUtil.fromString(value);
    if (!DecimalUtil.isPositive(dec)) {
      throw new BadRequestException(`${fieldName} must be positive`);
    }
    const maxSafeValue = DecimalUtil.fromNumber(Number.MAX_SAFE_INTEGER);
    if (DecimalUtil.greaterThan(dec, maxSafeValue)) {
      throw new BadRequestException(`${fieldName} exceeds maximum safe value`);
    }
    return true;
  }

  validateAmountRange(
    amount: string,
    fieldName: string,
    min?: string,
    max?: string
  ): boolean {
    if (!DecimalUtil.isValidNumericString(amount)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    const amountDec = DecimalUtil.fromString(amount);
    if (min !== undefined) {
      const minDec = DecimalUtil.fromString(min);
      if (DecimalUtil.lessThan(amountDec, minDec)) {
        throw new BadRequestException(`${fieldName} must be at least ${min}`);
      }
    }
    if (max !== undefined) {
      const maxDec = DecimalUtil.fromString(max);
      if (DecimalUtil.greaterThan(amountDec, maxDec)) {
        throw new BadRequestException(`${fieldName} must be at most ${max}`);
      }
    }
    return true;
  }

  validateCollateralRatio(
    collateralValue: string,
    loanValue: string,
    minRatio: string = '1.5'
  ): { isValid: boolean; currentRatio: string; requiredRatio: string } {
    const ratio = DecimalUtil.calculateCollateralRatio(collateralValue, loanValue);
    const minRatioDec = DecimalUtil.fromString(minRatio);
    const isValid = DecimalUtil.greaterThanOrEqual(ratio, minRatioDec);
    return {
      isValid,
      currentRatio: DecimalUtil.toFixed(ratio, 4),
      requiredRatio: minRatio
    };
  }

  validateLTV(
    loanValue: string,
    collateralValue: string,
    maxLTV: string = '80'
  ): { isValid: boolean; currentLTV: string; maxAllowedLTV: string } {
    const ltv = DecimalUtil.calculateLTV(loanValue, collateralValue);
    const maxLTVDec = DecimalUtil.fromString(maxLTV);
    const isValid = DecimalUtil.lessThanOrEqual(ltv, maxLTVDec);
    return {
      isValid,
      currentLTV: DecimalUtil.toFixed(ltv, 2),
      maxAllowedLTV: maxLTV
    };
  }
}
