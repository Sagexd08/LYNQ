import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateLoanDto, SupportedChain, MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT, MIN_COLLATERAL_RATIO } from '../src/modules/loan/dto/create-loan.dto';

describe('CreateLoanDto Validation', () => {
  const validDto = {
    amount: '1000',
    chain: SupportedChain.EVM,
    collateralTokenAddress: '0x1234567890123456789012345678901234567890',
    collateralAmount: '2000',
    durationDays: 30,
  };

  describe('amount validation', () => {
    it('should accept valid amount', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors).toHaveLength(0);
    });

    it('should reject non-numeric amount', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, amount: 'abc' });
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should reject negative amount', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, amount: '-100' });
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should reject amount below minimum', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, amount: '1', collateralAmount: '2' });
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should reject amount above maximum', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        amount: '10000000',
        collateralAmount: '20000000'
      });
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should accept decimal amounts', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, amount: '1000.50' });
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors).toHaveLength(0);
    });

    it('should reject scientific notation', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, amount: '1e3' });
      const errors = await validate(dto);
      const amountErrors = errors.filter(e => e.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });
  });

  describe('chain validation', () => {
    it('should accept valid chain', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const chainErrors = errors.filter(e => e.property === 'chain');
      expect(chainErrors).toHaveLength(0);
    });

    it('should accept all supported chains', async () => {
      for (const chain of Object.values(SupportedChain)) {
        const dto = plainToInstance(CreateLoanDto, { ...validDto, chain });
        const errors = await validate(dto);
        const chainErrors = errors.filter(e => e.property === 'chain');
        expect(chainErrors).toHaveLength(0);
      }
    });

    it('should reject invalid chain', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, chain: 'invalid-chain' });
      const errors = await validate(dto);
      const chainErrors = errors.filter(e => e.property === 'chain');
      expect(chainErrors.length).toBeGreaterThan(0);
    });
  });

  describe('collateralTokenAddress validation', () => {
    it('should accept valid Ethereum address', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const addressErrors = errors.filter(e => e.property === 'collateralTokenAddress');
      expect(addressErrors).toHaveLength(0);
    });

    it('should reject address without 0x prefix', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        collateralTokenAddress: '1234567890123456789012345678901234567890' 
      });
      const errors = await validate(dto);
      const addressErrors = errors.filter(e => e.property === 'collateralTokenAddress');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('should reject address with wrong length', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        collateralTokenAddress: '0x123456' 
      });
      const errors = await validate(dto);
      const addressErrors = errors.filter(e => e.property === 'collateralTokenAddress');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('should reject address with invalid characters', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        collateralTokenAddress: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG' 
      });
      const errors = await validate(dto);
      const addressErrors = errors.filter(e => e.property === 'collateralTokenAddress');
      expect(addressErrors.length).toBeGreaterThan(0);
    });
  });

  describe('collateralAmount validation', () => {
    it('should accept valid collateral amount', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const collateralErrors = errors.filter(e => e.property === 'collateralAmount');
      expect(collateralErrors).toHaveLength(0);
    });

    it('should reject insufficient collateral ratio', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        amount: '1000',
        collateralAmount: '1000'
      });
      const errors = await validate(dto);
      const collateralErrors = errors.filter(e => e.property === 'collateralAmount');
      expect(collateralErrors.length).toBeGreaterThan(0);
    });

    it('should accept exact minimum collateral ratio', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        amount: '1000',
        collateralAmount: '1500'
      });
      const errors = await validate(dto);
      const collateralErrors = errors.filter(e => e.property === 'collateralAmount');
      expect(collateralErrors).toHaveLength(0);
    });

    it('should accept higher than minimum collateral ratio', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        amount: '1000',
        collateralAmount: '3000'
      });
      const errors = await validate(dto);
      const collateralErrors = errors.filter(e => e.property === 'collateralAmount');
      expect(collateralErrors).toHaveLength(0);
    });
  });

  describe('durationDays validation', () => {
    it('should accept valid duration', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const durationErrors = errors.filter(e => e.property === 'durationDays');
      expect(durationErrors).toHaveLength(0);
    });

    it('should reject duration below minimum', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, durationDays: 3 });
      const errors = await validate(dto);
      const durationErrors = errors.filter(e => e.property === 'durationDays');
      expect(durationErrors.length).toBeGreaterThan(0);
    });

    it('should reject duration above maximum', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, durationDays: 400 });
      const errors = await validate(dto);
      const durationErrors = errors.filter(e => e.property === 'durationDays');
      expect(durationErrors.length).toBeGreaterThan(0);
    });

    it('should accept minimum duration', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, durationDays: 7 });
      const errors = await validate(dto);
      const durationErrors = errors.filter(e => e.property === 'durationDays');
      expect(durationErrors).toHaveLength(0);
    });

    it('should accept maximum duration', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, durationDays: 365 });
      const errors = await validate(dto);
      const durationErrors = errors.filter(e => e.property === 'durationDays');
      expect(durationErrors).toHaveLength(0);
    });

    it('should reject non-positive duration', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, durationDays: 0 });
      const errors = await validate(dto);
      const durationErrors = errors.filter(e => e.property === 'durationDays');
      expect(durationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('transactionHash validation', () => {
    it('should accept valid transaction hash', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234' 
      });
      const errors = await validate(dto);
      const hashErrors = errors.filter(e => e.property === 'transactionHash');
      expect(hashErrors).toHaveLength(0);
    });

    it('should accept undefined transaction hash', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const hashErrors = errors.filter(e => e.property === 'transactionHash');
      expect(hashErrors).toHaveLength(0);
    });

    it('should reject invalid transaction hash format', async () => {
      const dto = plainToInstance(CreateLoanDto, { 
        ...validDto, 
        transactionHash: '0x123' 
      });
      const errors = await validate(dto);
      const hashErrors = errors.filter(e => e.property === 'transactionHash');
      expect(hashErrors.length).toBeGreaterThan(0);
    });
  });

  describe('onChainId validation', () => {
    it('should accept valid onChainId', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, onChainId: '123' });
      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'onChainId');
      expect(idErrors).toHaveLength(0);
    });

    it('should accept undefined onChainId', async () => {
      const dto = plainToInstance(CreateLoanDto, validDto);
      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'onChainId');
      expect(idErrors).toHaveLength(0);
    });

    it('should reject non-numeric onChainId', async () => {
      const dto = plainToInstance(CreateLoanDto, { ...validDto, onChainId: 'abc' });
      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'onChainId');
      expect(idErrors.length).toBeGreaterThan(0);
    });
  });

  describe('complete DTO validation', () => {
    it('should pass validation for complete valid DTO', async () => {
      const dto = plainToInstance(CreateLoanDto, {
        amount: '1000',
        chain: SupportedChain.MANTLE,
        collateralTokenAddress: '0xAbCdEf1234567890123456789012345678901234',
        collateralAmount: '2000',
        durationDays: 30,
        transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        onChainId: '42',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for empty DTO', async () => {
      const dto = plainToInstance(CreateLoanDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
