import {
    classifyRepayment,
    RepaymentClassification,
    LoanForClassification,
} from './classification';

describe('classifyRepayment', () => {
    const baseLoan: LoanForClassification = {
        amount: 1000,
        dueAt: new Date('2026-01-15T12:00:00Z'),
        repayments: [],
        partialExtensionUsed: false,
    };

    describe('PARTIAL classification', () => {
        it('should classify as PARTIAL when payment is less than outstanding', () => {
            const result = classifyRepayment(baseLoan, 500, new Date('2026-01-10T12:00:00Z'));

            expect(result.classification).toBe(RepaymentClassification.PARTIAL);
            expect(result.isFullyRepaid).toBe(false);
            expect(result.lateDays).toBe(0);
        });

        it('should classify as PARTIAL even if paid before due date', () => {
            const result = classifyRepayment(baseLoan, 100, new Date('2026-01-01T12:00:00Z'));

            expect(result.classification).toBe(RepaymentClassification.PARTIAL);
        });
    });

    describe('EARLY classification', () => {
        it('should classify as EARLY when paid >= 24h before due date', () => {
            const earlyDate = new Date('2026-01-14T11:00:00Z');
            const result = classifyRepayment(baseLoan, 1000, earlyDate);

            expect(result.classification).toBe(RepaymentClassification.EARLY);
            expect(result.isFullyRepaid).toBe(true);
            expect(result.lateDays).toBe(0);
        });

        it('should classify as EARLY when paid 5 days before due date', () => {
            const earlyDate = new Date('2026-01-10T12:00:00Z');
            const result = classifyRepayment(baseLoan, 1000, earlyDate);

            expect(result.classification).toBe(RepaymentClassification.EARLY);
        });
    });

    describe('ON_TIME classification', () => {
        it('should classify as ON_TIME when paid exactly at due date', () => {
            const result = classifyRepayment(baseLoan, 1000, baseLoan.dueAt);

            expect(result.classification).toBe(RepaymentClassification.ON_TIME);
            expect(result.isFullyRepaid).toBe(true);
        });

        it('should classify as ON_TIME when paid 23h before due date (less than 24h)', () => {
            const onTimeDate = new Date('2026-01-14T13:00:00Z');
            const result = classifyRepayment(baseLoan, 1000, onTimeDate);

            expect(result.classification).toBe(RepaymentClassification.ON_TIME);
        });
    });

    describe('LATE classification', () => {
        it('should classify as LATE when paid after due date', () => {
            const lateDate = new Date('2026-01-16T12:00:00Z');
            const result = classifyRepayment(baseLoan, 1000, lateDate);

            expect(result.classification).toBe(RepaymentClassification.LATE);
            expect(result.lateDays).toBe(1);
            expect(result.isFullyRepaid).toBe(true);
        });

        it('should calculate correct lateDays for multiple days late', () => {
            const lateDate = new Date('2026-01-20T12:00:00Z');
            const result = classifyRepayment(baseLoan, 1000, lateDate);

            expect(result.classification).toBe(RepaymentClassification.LATE);
            expect(result.lateDays).toBe(5);
        });
    });

    describe('with existing repayments', () => {
        it('should account for previous repayments when determining if fully repaid', () => {
            const loanWithPartial: LoanForClassification = {
                ...baseLoan,
                repayments: [{ amount: 800 }],
            };

            const result = classifyRepayment(loanWithPartial, 200, new Date('2026-01-10T12:00:00Z'));

            expect(result.classification).toBe(RepaymentClassification.EARLY);
            expect(result.isFullyRepaid).toBe(true);
        });

        it('should still be PARTIAL if payment does not cover remaining', () => {
            const loanWithPartial: LoanForClassification = {
                ...baseLoan,
                repayments: [{ amount: 500 }],
            };

            const result = classifyRepayment(loanWithPartial, 100, new Date('2026-01-10T12:00:00Z'));

            expect(result.classification).toBe(RepaymentClassification.PARTIAL);
            expect(result.isFullyRepaid).toBe(false);
        });
    });
});
