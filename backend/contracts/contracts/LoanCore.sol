
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract LoanCore is Ownable, ReentrancyGuard, Pausable {

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

    mapping(bytes32 => Loan) public loans;
    mapping(address => bytes32[]) public borrowerLoans;
    
    address public collateralVault;
    uint256 public loanCount;
    
    uint256 public constant MAX_INTEREST_RATE = 5000; 
    uint256 public constant MIN_LOAN_AMOUNT = 1e16; 
    uint256 public constant MAX_TERM_DAYS = 365;

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

    constructor() Ownable(msg.sender) {}

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

    function activateLoan(bytes32 loanId) external onlyOwner whenNotPaused {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Pending) revert LoanNotPending();
        
        loan.status = LoanStatus.Active;
        loan.dueDate = block.timestamp + (loan.termDays * 1 days);
        
        emit LoanActivated(loanId, block.timestamp);
    }

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

        if (msg.value > payment) {
            payable(msg.sender).transfer(msg.value - payment);
        }
    }

    function markDefaulted(bytes32 loanId) external onlyOwner {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (block.timestamp <= loan.dueDate) revert LoanNotOverdue();
        
        loan.status = LoanStatus.Defaulted;
        
        emit LoanDefaulted(loanId, block.timestamp);
    }

    function liquidate(bytes32 loanId) external onlyOwner {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Defaulted) revert AlreadyDefaulted();
        
        loan.status = LoanStatus.Liquidated;
        
        emit LoanLiquidated(loanId, block.timestamp);
    }

    function calculateTotalOwed(bytes32 loanId) public view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 interest = (loan.amount * loan.interestRate) / 10000;
        return loan.amount + interest;
    }

    function getLoan(bytes32 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getBorrowerLoans(address borrower) external view returns (bytes32[] memory) {
        return borrowerLoans[borrower];
    }

    function isOverdue(bytes32 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        return loan.status == LoanStatus.Active && block.timestamp > loan.dueDate;
    }

    function setCollateralVault(address _vault) external onlyOwner {
        emit CollateralVaultUpdated(collateralVault, _vault);
        collateralVault = _vault;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        to.transfer(balance);
    }
    
    receive() external payable {}
}
