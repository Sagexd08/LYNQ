import { DecimalUtil, Decimal } from '../src/common/utils/decimal.util';

describe('DecimalUtil', () => {
  describe('fromString', () => {
    it('should parse valid decimal strings', () => {
      expect(DecimalUtil.toNumber(DecimalUtil.fromString('100'))).toBe(100);
      expect(DecimalUtil.toNumber(DecimalUtil.fromString('100.50'))).toBe(100.5);
      expect(DecimalUtil.toNumber(DecimalUtil.fromString('0.00000001'))).toBe(0.00000001);
    });

    it('should throw for empty strings', () => {
      expect(() => DecimalUtil.fromString('')).toThrow();
      expect(() => DecimalUtil.fromString('   ')).toThrow();
    });

    it('should throw for invalid strings', () => {
      expect(() => DecimalUtil.fromString('abc')).toThrow();
      expect(() => DecimalUtil.fromString('12.34.56')).toThrow();
    });
  });

  describe('fromNumber', () => {
    it('should convert valid numbers', () => {
      expect(DecimalUtil.toNumber(DecimalUtil.fromNumber(100))).toBe(100);
      expect(DecimalUtil.toNumber(DecimalUtil.fromNumber(0.5))).toBe(0.5);
    });

    it('should throw for Infinity', () => {
      expect(() => DecimalUtil.fromNumber(Infinity)).toThrow();
      expect(() => DecimalUtil.fromNumber(-Infinity)).toThrow();
    });

    it('should throw for NaN', () => {
      expect(() => DecimalUtil.fromNumber(NaN)).toThrow();
    });
  });

  describe('arithmetic operations', () => {
    it('should add correctly', () => {
      const result = DecimalUtil.add('1.00000001', '2.99999999');
      expect(DecimalUtil.toFixed(result, 8)).toBe('4.00000000');
    });

    it('should subtract correctly', () => {
      const result = DecimalUtil.subtract('10.5', '3.3');
      expect(DecimalUtil.toFixed(result, 1)).toBe('7.2');
    });

    it('should multiply correctly', () => {
      const result = DecimalUtil.multiply('0.1', '0.2');
      expect(DecimalUtil.toFixed(result, 2)).toBe('0.02');
    });

    it('should divide correctly', () => {
      const result = DecimalUtil.divide('1', '3');
      expect(DecimalUtil.toFixed(result, 8)).toBe('0.33333333');
    });

    it('should throw on division by zero', () => {
      expect(() => DecimalUtil.divide('10', '0')).toThrow('Division by zero');
    });
  });

  describe('precision handling', () => {
    it('should handle floating point precision issues', () => {
      const a = DecimalUtil.fromString('0.1');
      const b = DecimalUtil.fromString('0.2');
      const sum = DecimalUtil.add(a, b);
      expect(DecimalUtil.toFixed(sum, 1)).toBe('0.3');
    });

    it('should maintain precision for large numbers', () => {
      const large = DecimalUtil.fromString('999999999999999999.99999999');
      expect(DecimalUtil.toFixed(large, 8)).toBe('999999999999999999.99999999');
    });

    it('should maintain precision for small numbers', () => {
      const small = DecimalUtil.fromString('0.00000001');
      expect(DecimalUtil.toFixed(small, 8)).toBe('0.00000001');
    });

    it('should handle interest calculations precisely', () => {
      const principal = '1000';
      const rate = '10';
      const interest = DecimalUtil.calculateInterest(principal, rate);
      expect(DecimalUtil.toFixed(interest, 2)).toBe('100.00');
    });

    it('should handle compound interest precisely', () => {
      const principal = '1000';
      const rate = '10';
      const periods = 12;
      const interest = DecimalUtil.calculateCompoundInterest(principal, rate, periods);
      expect(DecimalUtil.toNumber(interest)).toBeGreaterThan(0);
    });
  });

  describe('comparison operations', () => {
    it('should compare greater than correctly', () => {
      expect(DecimalUtil.greaterThan('10', '5')).toBe(true);
      expect(DecimalUtil.greaterThan('5', '10')).toBe(false);
      expect(DecimalUtil.greaterThan('5', '5')).toBe(false);
    });

    it('should compare greater than or equal correctly', () => {
      expect(DecimalUtil.greaterThanOrEqual('10', '5')).toBe(true);
      expect(DecimalUtil.greaterThanOrEqual('5', '5')).toBe(true);
      expect(DecimalUtil.greaterThanOrEqual('5', '10')).toBe(false);
    });

    it('should compare less than correctly', () => {
      expect(DecimalUtil.lessThan('5', '10')).toBe(true);
      expect(DecimalUtil.lessThan('10', '5')).toBe(false);
      expect(DecimalUtil.lessThan('5', '5')).toBe(false);
    });

    it('should compare less than or equal correctly', () => {
      expect(DecimalUtil.lessThanOrEqual('5', '10')).toBe(true);
      expect(DecimalUtil.lessThanOrEqual('5', '5')).toBe(true);
      expect(DecimalUtil.lessThanOrEqual('10', '5')).toBe(false);
    });

    it('should check equality correctly', () => {
      expect(DecimalUtil.equals('5', '5')).toBe(true);
      expect(DecimalUtil.equals('5.00', '5')).toBe(true);
      expect(DecimalUtil.equals('5', '6')).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should check if zero correctly', () => {
      expect(DecimalUtil.isZero('0')).toBe(true);
      expect(DecimalUtil.isZero('0.00')).toBe(true);
      expect(DecimalUtil.isZero('0.001')).toBe(false);
    });

    it('should check if positive correctly', () => {
      expect(DecimalUtil.isPositive('10')).toBe(true);
      expect(DecimalUtil.isPositive('0')).toBe(false);
      expect(DecimalUtil.isPositive('-10')).toBe(false);
    });

    it('should check if negative correctly', () => {
      expect(DecimalUtil.isNegative('-10')).toBe(true);
      expect(DecimalUtil.isNegative('0')).toBe(false);
      expect(DecimalUtil.isNegative('10')).toBe(false);
    });

    it('should calculate absolute value correctly', () => {
      expect(DecimalUtil.toNumber(DecimalUtil.abs('-10'))).toBe(10);
      expect(DecimalUtil.toNumber(DecimalUtil.abs('10'))).toBe(10);
    });

    it('should find max correctly', () => {
      const max = DecimalUtil.max('5', '10', '3');
      expect(DecimalUtil.toNumber(max)).toBe(10);
    });

    it('should find min correctly', () => {
      const min = DecimalUtil.min('5', '10', '3');
      expect(DecimalUtil.toNumber(min)).toBe(3);
    });
  });

  describe('financial calculations', () => {
    it('should calculate collateral ratio correctly', () => {
      const ratio = DecimalUtil.calculateCollateralRatio('2000', '1000');
      expect(DecimalUtil.toNumber(ratio)).toBe(2);
    });

    it('should handle zero loan in collateral ratio', () => {
      const ratio = DecimalUtil.calculateCollateralRatio('2000', '0');
      expect(ratio.isFinite()).toBe(false);
    });

    it('should calculate LTV correctly', () => {
      const ltv = DecimalUtil.calculateLTV('800', '1000');
      expect(DecimalUtil.toNumber(ltv)).toBe(80);
    });

    it('should handle zero collateral in LTV', () => {
      const ltv = DecimalUtil.calculateLTV('800', '0');
      expect(DecimalUtil.toNumber(ltv)).toBe(100);
    });

    it('should calculate percentage correctly', () => {
      const result = DecimalUtil.percentage('1000', '10');
      expect(DecimalUtil.toNumber(result)).toBe(100);
    });
  });

  describe('aggregation functions', () => {
    it('should sum values correctly', () => {
      const sum = DecimalUtil.sum(['10', '20', '30']);
      expect(DecimalUtil.toNumber(sum)).toBe(60);
    });

    it('should handle empty array in sum', () => {
      const sum = DecimalUtil.sum([]);
      expect(DecimalUtil.toNumber(sum)).toBe(0);
    });

    it('should calculate average correctly', () => {
      const avg = DecimalUtil.average(['10', '20', '30']);
      expect(DecimalUtil.toNumber(avg)).toBe(20);
    });

    it('should handle empty array in average', () => {
      const avg = DecimalUtil.average([]);
      expect(DecimalUtil.toNumber(avg)).toBe(0);
    });

    it('should calculate median correctly for odd count', () => {
      const median = DecimalUtil.median(['10', '20', '30']);
      expect(DecimalUtil.toNumber(median)).toBe(20);
    });

    it('should calculate median correctly for even count', () => {
      const median = DecimalUtil.median(['10', '20', '30', '40']);
      expect(DecimalUtil.toNumber(median)).toBe(25);
    });
  });

  describe('validation', () => {
    it('should validate numeric strings correctly', () => {
      expect(DecimalUtil.isValidNumericString('100')).toBe(true);
      expect(DecimalUtil.isValidNumericString('100.50')).toBe(true);
      expect(DecimalUtil.isValidNumericString('-100')).toBe(true);
      expect(DecimalUtil.isValidNumericString('abc')).toBe(false);
      expect(DecimalUtil.isValidNumericString('')).toBe(false);
    });
  });

  describe('real-world loan scenarios', () => {
    it('should calculate outstanding amount with interest correctly', () => {
      const principal = '1000';
      const interestRate = '10';
      const interestMultiplier = DecimalUtil.add('1', DecimalUtil.divide(interestRate, '100'));
      const outstanding = DecimalUtil.multiply(principal, interestMultiplier);
      expect(DecimalUtil.toFixed(outstanding, 2)).toBe('1100.00');
    });

    it('should calculate repayment correctly', () => {
      const outstanding = '1100';
      const repayment = '500';
      const remaining = DecimalUtil.subtract(outstanding, repayment);
      expect(DecimalUtil.toFixed(remaining, 2)).toBe('600.00');
    });

    it('should detect full repayment correctly', () => {
      const outstanding = '1100';
      const repayment = '1100';
      const remaining = DecimalUtil.subtract(outstanding, repayment);
      expect(DecimalUtil.isZero(remaining)).toBe(true);
    });

    it('should validate collateral ratio for loan creation', () => {
      const collateral = '2000';
      const loan = '1000';
      const minRatio = '1.5';
      const ratio = DecimalUtil.calculateCollateralRatio(collateral, loan);
      expect(DecimalUtil.greaterThanOrEqual(ratio, minRatio)).toBe(true);
    });

    it('should detect undercollateralized position', () => {
      const collateral = '1200';
      const loan = '1000';
      const minRatio = '1.5';
      const ratio = DecimalUtil.calculateCollateralRatio(collateral, loan);
      expect(DecimalUtil.greaterThanOrEqual(ratio, minRatio)).toBe(false);
    });
  });
});
