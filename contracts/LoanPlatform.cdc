pub contract LoanPlatform {

    pub struct Loan {
        pub let id: UInt64
        pub let borrower: Address
        pub let amount: UFix64
        pub let interestBps: UInt64
        pub let durationSeconds: UFix64
        pub let createdAt: UFix64
        pub let dueDate: UFix64
        pub var repaidAmount: UFix64
        pub var isActive: Bool
        pub var isRepaid: Bool
        pub let purpose: String

        init(
            id: UInt64,
            borrower: Address,
            amount: UFix64,
            interestBps: UInt64,
            durationSeconds: UFix64,
            createdAt: UFix64,
            dueDate: UFix64,
            purpose: String
        ) {
            self.id = id
            self.borrower = borrower
            self.amount = amount
            self.interestBps = interestBps
            self.durationSeconds = durationSeconds
            self.createdAt = createdAt
            self.dueDate = dueDate
            self.repaidAmount = 0.0
            self.isActive = true
            self.isRepaid = false
            self.purpose = purpose
        }
    }

    pub event LoanCreated(id: UInt64, borrower: Address, amount: UFix64, interestBps: UInt64, durationSeconds: UFix64, purpose: String)
    pub event LoanRepaid(id: UInt64, borrower: Address, amount: UFix64, fullyRepaid: Bool)

    pub var nextLoanId: UInt64
    access(self) var loans: {UInt64: Loan}

    pub fun getLoan(id: UInt64): Loan? {
        return self.loans[id]
    }

    pub fun calculateTotalOwed(id: UInt64): UFix64 {
        let loan = self.loans[id] ?? panic("loan missing")
        let interest: UFix64 = loan.amount * UFix64(loan.interestBps) / 10000.0
        return loan.amount + interest
    }

    pub fun createLoan(borrower: Address, amount: UFix64, interestBps: UInt64, durationSeconds: UFix64, purpose: String) {
        let id = self.nextLoanId
        self.nextLoanId = id + 1

        let now: UFix64 = getCurrentBlock().timestamp
        let due: UFix64 = now + durationSeconds

        let loan = Loan(
            id: id,
            borrower: borrower,
            amount: amount,
            interestBps: interestBps,
            durationSeconds: durationSeconds,
            createdAt: now,
            dueDate: due,
            purpose: purpose
        )
        self.loans[id] = loan
        emit LoanCreated(id: id, borrower: loan.borrower, amount: amount, interestBps: interestBps, durationSeconds: durationSeconds, purpose: purpose)
    }

    pub fun applyRepayment(id: UInt64, amount: UFix64) {
        let loanRef = &self.loans[id] as &Loan?
        if loanRef == nil { panic("loan missing") }
        let loan = loanRef!
        if !loan.isActive || loan.isRepaid { panic("inactive") }

        loan.repaidAmount = loan.repaidAmount + amount
        let total = self.calculateTotalOwed(id: id)
        let fully = loan.repaidAmount >= total
        if fully {
            loan.isActive = false
            loan.isRepaid = true
        }
        emit LoanRepaid(id: id, borrower: loan.borrower, amount: amount, fullyRepaid: fully)
    }

    init() {
        self.nextLoanId = 1
        self.loans = {}
    }
}


