
pragma solidity ^0.8.20;

interface ILoanCore {
    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Liquidated
    }

    struct Loan {
        bytes32 loanId;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 termDays;
        uint256 createdAt;
        uint256 dueDate;
        uint256 amountRepaid;
        LoanStatus status;
    }

    function createLoan(
        uint256 amount,
        uint256 interestRate,
        uint256 termDays
    ) external returns (bytes32 loanId);

    function activateLoan(bytes32 loanId) external;

    function repay(bytes32 loanId) external payable;

    function markDefaulted(bytes32 loanId) external;

    function liquidate(bytes32 loanId) external;

    function calculateTotalOwed(bytes32 loanId) external view returns (uint256);

    function getLoan(bytes32 loanId) external view returns (Loan memory);

    function getBorrowerLoans(address borrower) external view returns (bytes32[] memory);

    function isOverdue(bytes32 loanId) external view returns (bool);
}
