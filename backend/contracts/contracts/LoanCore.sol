// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LoanCore
 * @notice Core lending contract for LYNQ DeFi lending platform
 * @dev Manages loan lifecycle: creation, repayment, default, and liquidation
 */
contract LoanCore is Ownable, ReentrancyGuard, Pausable {
    // ============ Enums ============
    
    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Liquidated
    }

    // ============ Structs ============
    
    struct Loan {
        bytes32 loanId;
        address borrower;
        uint256 amount;
        uint256 interestRate; // Basis points (e.g., 500 = 5%)
        uint256 termDays;
        uint256 createdAt;
        uint256 dueDate;
        uint256 amountRepaid;
        LoanStatus status;
    }

    // ============ State Variables ============
    
    mapping(bytes32 => Loan) public loans;
    mapping(address => bytes32[]) public borrowerLoans;
    
    address public collateralVault;
    uint256 public loanCount;
    
    uint256 public constant MAX_INTEREST_RATE = 5000; // 50% max
    uint256 public constant MIN_LOAN_AMOUNT = 1e16; // 0.01 ETH
    uint256 public constant MAX_TERM_DAYS = 365;

    // ============ Events ============
    
    event LoanCreated(
        bytes32 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 termDays,
        uint256 dueDate
    );
    
    event LoanActivated(bytes32 indexed loanId, uint256 timestamp);
    
    event LoanRepayment(
        bytes32 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 totalRepaid,
        bool isFullyRepaid
    );
    
    event LoanRepaid(bytes32 indexed loanId, uint256 timestamp);
    
    event LoanDefaulted(bytes32 indexed loanId, uint256 timestamp);
    
    event LoanLiquidated(bytes32 indexed loanId, uint256 timestamp);
    
    event CollateralVaultUpdated(address oldVault, address newVault);

    // ============ Errors ============
    
    error InvalidAmount();
    error InvalidInterestRate();
    error InvalidTermDays();
    error LoanNotFound();
    error LoanNotActive();
    error LoanNotPending();
    error NotBorrower();
    error InsufficientRepayment();
    error LoanNotOverdue();
    error AlreadyDefaulted();
    error CollateralVaultNotSet();

    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============
    
    /**
     * @notice Create a new loan request
     * @param amount Loan amount in wei
     * @param interestRate Interest rate in basis points
     * @param termDays Loan term in days
     * @return loanId The unique identifier for the loan
     */
    function createLoan(
        uint256 amount,
        uint256 interestRate,
        uint256 termDays
    ) external whenNotPaused nonReentrant returns (bytes32 loanId) {
        if (amount < MIN_LOAN_AMOUNT) revert InvalidAmount();
        if (interestRate > MAX_INTEREST_RATE) revert InvalidInterestRate();
        if (termDays == 0 || termDays > MAX_TERM_DAYS) revert InvalidTermDays();
        
        loanId = keccak256(
            abi.encodePacked(
                msg.sender,
                amount,
                block.timestamp,
                loanCount
            )
        );
        
        uint256 dueDate = block.timestamp + (termDays * 1 days);
        
        loans[loanId] = Loan({
            loanId: loanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: interestRate,
            termDays: termDays,
            createdAt: block.timestamp,
            dueDate: dueDate,
            amountRepaid: 0,
            status: LoanStatus.Pending
        });
        
        borrowerLoans[msg.sender].push(loanId);
        loanCount++;
        
        emit LoanCreated(
            loanId,
            msg.sender,
            amount,
            interestRate,
            termDays,
            dueDate
        );
        
        return loanId;
    }
    
    /**
     * @notice Activate a pending loan (called after collateral is locked)
     * @param loanId The loan identifier
     */
    function activateLoan(bytes32 loanId) external onlyOwner whenNotPaused {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Pending) revert LoanNotPending();
        
        loan.status = LoanStatus.Active;
        loan.dueDate = block.timestamp + (loan.termDays * 1 days);
        
        emit LoanActivated(loanId, block.timestamp);
    }
    
    /**
     * @notice Repay part or all of a loan
     * @param loanId The loan identifier
     */
    function repay(bytes32 loanId) external payable whenNotPaused nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (msg.sender != loan.borrower) revert NotBorrower();
        if (msg.value == 0) revert InsufficientRepayment();
        
        uint256 totalOwed = calculateTotalOwed(loanId);
        uint256 remaining = totalOwed - loan.amountRepaid;
        uint256 payment = msg.value > remaining ? remaining : msg.value;
        
        loan.amountRepaid += payment;
        
        bool isFullyRepaid = loan.amountRepaid >= totalOwed;
        
        emit LoanRepayment(
            loanId,
            msg.sender,
            payment,
            loan.amountRepaid,
            isFullyRepaid
        );
        
        if (isFullyRepaid) {
            loan.status = LoanStatus.Repaid;
            emit LoanRepaid(loanId, block.timestamp);
        }
        
        // Refund excess payment
        if (msg.value > payment) {
            payable(msg.sender).transfer(msg.value - payment);
        }
    }
    
    /**
     * @notice Mark a loan as defaulted if overdue
     * @param loanId The loan identifier
     */
    function markDefaulted(bytes32 loanId) external onlyOwner {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (block.timestamp <= loan.dueDate) revert LoanNotOverdue();
        
        loan.status = LoanStatus.Defaulted;
        
        emit LoanDefaulted(loanId, block.timestamp);
    }
    
    /**
     * @notice Liquidate a defaulted loan
     * @param loanId The loan identifier
     */
    function liquidate(bytes32 loanId) external onlyOwner {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Defaulted) revert AlreadyDefaulted();
        
        loan.status = LoanStatus.Liquidated;
        
        emit LoanLiquidated(loanId, block.timestamp);
    }

    // ============ View Functions ============
    
    /**
     * @notice Calculate total amount owed including interest
     * @param loanId The loan identifier
     * @return Total amount owed
     */
    function calculateTotalOwed(bytes32 loanId) public view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 interest = (loan.amount * loan.interestRate) / 10000;
        return loan.amount + interest;
    }
    
    /**
     * @notice Get loan details
     * @param loanId The loan identifier
     * @return Loan struct
     */
    function getLoan(bytes32 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
    
    /**
     * @notice Get all loans for a borrower
     * @param borrower The borrower address
     * @return Array of loan IDs
     */
    function getBorrowerLoans(address borrower) external view returns (bytes32[] memory) {
        return borrowerLoans[borrower];
    }
    
    /**
     * @notice Check if a loan is overdue
     * @param loanId The loan identifier
     * @return True if overdue
     */
    function isOverdue(bytes32 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        return loan.status == LoanStatus.Active && block.timestamp > loan.dueDate;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Set the collateral vault address
     * @param _vault The vault address
     */
    function setCollateralVault(address _vault) external onlyOwner {
        emit CollateralVaultUpdated(collateralVault, _vault);
        collateralVault = _vault;
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw contract ETH balance
     * @param to Recipient address
     */
    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        to.transfer(balance);
    }
    
    receive() external payable {}
}
