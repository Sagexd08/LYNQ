// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CollateralVault.sol";

contract LoanCore is Ownable, ReentrancyGuard {
    enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED, LIQUIDATED }

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 collateralAmount;
        address collateralToken;
        uint256 collateralId;
        uint256 interestRate;
        uint256 startTime;
        uint256 duration;
        uint256 outstandingAmount;
        LoanStatus status;
    }

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    uint256 public loanCounter;
    
    address public collateralVault;
    address public loanToken;
    uint256 public constant LIQUIDATION_THRESHOLD = 120;

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 collateralAmount
    );
    
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanLiquidated(uint256 indexed loanId);

    constructor() Ownable(msg.sender) {}

    function setCollateralVault(address _vault) external onlyOwner {
        collateralVault = _vault;
    }

    function setLoanToken(address _loanToken) external onlyOwner {
        loanToken = _loanToken;
    }

    function createLoan(
        uint256 amount,
        uint256 collateralAmount,
        address collateralToken,
        uint256 interestRate,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(collateralAmount > 0, "Collateral must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(loanToken != address(0), "Loan token not set");
        require(collateralVault != address(0), "Collateral vault not set");

        uint256 loanId = loanCounter++;
        uint256 interest = (amount * interestRate) / 10000;
        
        // Use CollateralVault.lockCollateralFor() instead of direct transfer
        // Note: Borrower must approve CollateralVault (not LoanCore) for the collateral token
        CollateralVault vault = CollateralVault(collateralVault);
        uint256 collateralId = vault.lockCollateralFor(msg.sender, collateralToken, collateralAmount, loanId);
        
        loans[loanId] = Loan({
            borrower: msg.sender,
            amount: amount,
            collateralAmount: collateralAmount,
            collateralToken: collateralToken,
            collateralId: collateralId,
            interestRate: interestRate,
            startTime: block.timestamp,
            duration: duration,
            outstandingAmount: amount + interest,
            status: LoanStatus.ACTIVE
        });

        userLoans[msg.sender].push(loanId);

        // Transfer loan principal to borrower
        require(
            IERC20(loanToken).transfer(msg.sender, amount),
            "Loan transfer failed"
        );

        emit LoanCreated(loanId, msg.sender, amount, collateralAmount);
        
        return loanId;
    }

    function repayLoan(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.borrower == msg.sender, "Not loan owner");
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(amount <= loan.outstandingAmount, "Amount too high");
        require(loanToken != address(0), "Loan token not set");

        // Transfer repayment tokens from borrower
        require(
            IERC20(loanToken).transferFrom(msg.sender, address(this), amount),
            "Repayment transfer failed"
        );

        loan.outstandingAmount -= amount;

        if (loan.outstandingAmount == 0) {
            loan.status = LoanStatus.REPAID;
            // Unlock collateral when loan is fully repaid
            CollateralVault vault = CollateralVault(collateralVault);
            vault.unlockCollateral(loan.collateralId);
        }

        emit LoanRepaid(loanId, amount);
    }

    function liquidateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(
            block.timestamp > loan.startTime + loan.duration,
            "Loan not overdue"
        );

        loan.status = LoanStatus.LIQUIDATED;
        
        // Seize collateral to the contract owner (Protocol)
        CollateralVault(collateralVault).seizeCollateral(loan.collateralId, owner());
        
        emit LoanLiquidated(loanId);
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }
}
