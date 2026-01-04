export enum RepaymentClassification {
    PARTIAL = 'PARTIAL',
    EARLY = 'EARLY',
    ON_TIME = 'ON_TIME',
    LATE = 'LATE',
}

export interface RepaymentOutcome {
    classification: RepaymentClassification;
    lateDays: number;
    isFullyRepaid: boolean;
}

export interface LoanForClassification {
    amount: number;
    dueAt: Date;
    repayments: { amount: number }[];
    partialExtensionUsed: boolean;
}

const HOURS_24_MS = 24 * 60 * 60 * 1000;

export function classifyRepayment(
    loan: LoanForClassification,
    paymentAmount: number,
    paidAt: Date = new Date()
): RepaymentOutcome {
    const totalPreviouslyRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const outstandingAmount = loan.amount - totalPreviouslyRepaid;
    const totalAfterPayment = totalPreviouslyRepaid + paymentAmount;
    const isFullyRepaid = totalAfterPayment >= loan.amount;

    if (paymentAmount < outstandingAmount) {
        return {
            classification: RepaymentClassification.PARTIAL,
            lateDays: 0,
            isFullyRepaid: false,
        };
    }

    const earlyThreshold = new Date(loan.dueAt.getTime() - HOURS_24_MS);

    if (paidAt <= earlyThreshold) {
        return {
            classification: RepaymentClassification.EARLY,
            lateDays: 0,
            isFullyRepaid,
        };
    }

    if (paidAt <= loan.dueAt) {
        return {
            classification: RepaymentClassification.ON_TIME,
            lateDays: 0,
            isFullyRepaid,
        };
    }

    const lateDays = Math.ceil((paidAt.getTime() - loan.dueAt.getTime()) / (24 * 60 * 60 * 1000));

    return {
        classification: RepaymentClassification.LATE,
        lateDays,
        isFullyRepaid,
    };
}
