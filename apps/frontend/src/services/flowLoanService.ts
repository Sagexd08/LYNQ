import { fcl } from '../config/flow';

export interface FlowLoanCreateParams {
  amount: string; 
  interestBps: number;
  durationSeconds: number; 
  purpose: string;
}

export const FlowLoanService = {
  async createLoan(params: FlowLoanCreateParams) {
    
    const { amount, interestBps, durationSeconds, purpose } = params;
    const tx = await fcl.mutate({
      cadence: `transaction(amount: UFix64, interestBps: UInt64, durationSeconds: UFix64, purpose: String) {
        prepare(acct: AuthAccount) {}
        execute {
          LoanPlatform.createLoan(borrower: acct.address, amount: amount, interestBps: interestBps, durationSeconds: durationSeconds, purpose: purpose)
        }
      }`,
      args: (arg: any, t: any) => [
        arg(amount, t.UFix64),
        arg(String(interestBps), t.UInt64),
        arg(String(durationSeconds) + ".0", t.UFix64),
        arg(purpose, t.String),
      ],
      limit: 200,
    });
    return tx;
  },

  async repayLoan(loanId: number, amount: string) {
    const tx = await fcl.mutate({
      cadence: `transaction(loanId: UInt64, amount: UFix64) { prepare(acct: AuthAccount) { } execute { } }`,
      args: (arg: any, t: any) => [
        arg(String(loanId), t.UInt64),
        arg(amount, t.UFix64),
      ],
      limit: 200,
    });
    return tx;
  },
};


