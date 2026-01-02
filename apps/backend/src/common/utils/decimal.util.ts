import Decimal from 'decimal.js';

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 21,
});

export class DecimalUtil {
  static fromString(value: string): Decimal {
    if (!value || value.trim() === '') {
      throw new Error('Invalid decimal value: empty string');
    }
    try {
      return new Decimal(value);
    } catch {
      throw new Error(`Invalid decimal value: ${value}`);
    }
  }

  static fromNumber(value: number): Decimal {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid decimal value: ${value}`);
    }
    return new Decimal(value);
  }

  static add(a: string | Decimal, b: string | Decimal): Decimal {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.plus(decB);
  }

  static subtract(a: string | Decimal, b: string | Decimal): Decimal {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.minus(decB);
  }

  static multiply(a: string | Decimal, b: string | Decimal): Decimal {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.times(decB);
  }

  static divide(a: string | Decimal, b: string | Decimal): Decimal {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    if (decB.isZero()) {
      throw new Error('Division by zero');
    }
    return decA.dividedBy(decB);
  }

  static isZero(value: string | Decimal): boolean {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.isZero();
  }

  static isPositive(value: string | Decimal): boolean {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.isPositive() && !dec.isZero();
  }

  static isNegative(value: string | Decimal): boolean {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.isNegative();
  }

  static greaterThan(a: string | Decimal, b: string | Decimal): boolean {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.greaterThan(decB);
  }

  static greaterThanOrEqual(a: string | Decimal, b: string | Decimal): boolean {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.greaterThanOrEqualTo(decB);
  }

  static lessThan(a: string | Decimal, b: string | Decimal): boolean {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.lessThan(decB);
  }

  static lessThanOrEqual(a: string | Decimal, b: string | Decimal): boolean {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.lessThanOrEqualTo(decB);
  }

  static equals(a: string | Decimal, b: string | Decimal): boolean {
    const decA = a instanceof Decimal ? a : this.fromString(a);
    const decB = b instanceof Decimal ? b : this.fromString(b);
    return decA.equals(decB);
  }

  static toFixed(value: string | Decimal, decimals: number = 8): string {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.toFixed(decimals);
  }

  static toString(value: Decimal): string {
    return value.toString();
  }

  static toNumber(value: string | Decimal): number {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.toNumber();
  }

  static max(...values: (string | Decimal)[]): Decimal {
    const decimals = values.map(v => v instanceof Decimal ? v : this.fromString(v));
    return Decimal.max(...decimals);
  }

  static min(...values: (string | Decimal)[]): Decimal {
    const decimals = values.map(v => v instanceof Decimal ? v : this.fromString(v));
    return Decimal.min(...decimals);
  }

  static abs(value: string | Decimal): Decimal {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.abs();
  }

  static round(value: string | Decimal, decimals: number = 0): Decimal {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    return dec.toDecimalPlaces(decimals);
  }

  static percentage(value: string | Decimal, percentage: string | Decimal): Decimal {
    const dec = value instanceof Decimal ? value : this.fromString(value);
    const pct = percentage instanceof Decimal ? percentage : this.fromString(percentage);
    return dec.times(pct).dividedBy(100);
  }

  static calculateInterest(principal: string, rate: string, periods: number = 1): Decimal {
    const p = this.fromString(principal);
    const r = this.fromString(rate).dividedBy(100);
    return p.times(r).times(periods);
  }

  static calculateCompoundInterest(principal: string, rate: string, periods: number): Decimal {
    const p = this.fromString(principal);
    const r = this.fromString(rate).dividedBy(100);
    const base = new Decimal(1).plus(r);
    return p.times(base.pow(periods)).minus(p);
  }

  static calculateCollateralRatio(collateral: string, loan: string): Decimal {
    const c = this.fromString(collateral);
    const l = this.fromString(loan);
    if (l.isZero()) {
      return new Decimal(Infinity);
    }
    return c.dividedBy(l);
  }

  static calculateLTV(loan: string, collateral: string): Decimal {
    const l = this.fromString(loan);
    const c = this.fromString(collateral);
    if (c.isZero()) {
      return new Decimal(100);
    }
    return l.dividedBy(c).times(100);
  }

  static isValidNumericString(value: string): boolean {
    if (!value || value.trim() === '') {
      return false;
    }
    try {
      const dec = new Decimal(value);
      return dec.isFinite();
    } catch {
      return false;
    }
  }

  static sum(values: (string | Decimal)[]): Decimal {
    let acc = new Decimal(0);
    for (const val of values) {
      const dec = val instanceof Decimal ? val : this.fromString(val);
      acc = acc.plus(dec);
    }
    return acc;
  }

  static average(values: (string | Decimal)[]): Decimal {
    if (values.length === 0) {
      return new Decimal(0);
    }
    const total = this.sum(values);
    return total.dividedBy(values.length);
  }

  static median(values: (string | Decimal)[]): Decimal {
    if (values.length === 0) {
      return new Decimal(0);
    }
    const sorted = values
      .map(v => v instanceof Decimal ? v : this.fromString(v))
      .sort((a, b) => a.comparedTo(b));
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return sorted[mid - 1].plus(sorted[mid]).dividedBy(2);
    }
    return sorted[mid];
  }
}

export { Decimal };
