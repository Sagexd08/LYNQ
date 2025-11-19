// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LoanCore is Ownable, ReentrancyGuard {
    enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED, LIQUIDATED }

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 collateralAmount;
        address collateralToken;
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

        uint256 loanId = loanCounter++;
        uint256 interest = (amount * interestRate) / 10000;
        
        loans[loanId] = Loan({
            borrower: msg.sender,
            amount: amount,
            collateralAmount: collateralAmount,
            collateralToken: collateralToken,
            interestRate: interestRate,
            startTime: block.timestamp,
            duration: duration,
            outstandingAmount: amount + interest,
            status: LoanStatus.ACTIVE
        });

        userLoans[msg.sender].push(loanId);

        IERC20(collateralToken).transferFrom(
            msg.sender,
            collateralVault,
            collateralAmount
        );

        emit LoanCreated(loanId, msg.sender, amount, collateralAmount);
        
        return loanId;
    }

    function repayLoan(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.borrower == msg.sender, "Not loan owner");
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(amount <= loan.outstandingAmount, "Amount too high");

        loan.outstandingAmount -= amount;

        if (loan.outstandingAmount == 0) {
            loan.status = LoanStatus.REPAID;
        }

        emit LoanRepaid(loanId, amount);
    }

    function liquidateLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(
            block.timestamp > loan.startTime + loan.duration,
            "Loan not overdue"
        );

        loan.status = LoanStatus.LIQUIDATED;
        
        emit LoanLiquidated(loanId);
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }
}
