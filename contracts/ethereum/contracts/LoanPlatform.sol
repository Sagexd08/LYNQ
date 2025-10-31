// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./TrustScore.sol";
import "./CollateralManager.sol";
import "./InterestRateModel.sol";

contract LoanPlatform is Ownable, ReentrancyGuard, Pausable {
    uint256 private _loanIdCounter;

    TrustScore public trustScore;
    CollateralManager public collateralManager;
    InterestRateModel public interestRateModel;

    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Cancelled
    }

    enum RepaymentType {
        Principal,
        Interest,
        LateFee
    }

    struct Loan {
        uint256 id;
        address borrower;
        uint256 principalAmount;
        uint256 remainingPrincipal;
        uint256 interestAccrued;
        uint256 lateFee;
        uint256 interestRateBps;
        uint256 createdAt;
        uint256 dueDate;
        LoanStatus status;
        address collateralToken;
        uint256 collateralAmount;
        RepaymentSchedule[] repayments;
    }

    struct RepaymentSchedule {
        uint256 paymentNumber;
        uint256 dueDate;
        uint256 amount;
        uint256 principal;
        uint256 interest;
        RepaymentStatus status;
        uint256 paidDate;
    }

    enum RepaymentStatus {
        Pending,
        Paid,
        Overdue
    }

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRateBps,
        uint256 dueDate,
        string purpose
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principalPaid,
        uint256 interestPaid,
        uint256 lateFeePaid,
        bool fullyRepaid
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 remainingAmount
    );

    event RepaymentApplied(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 lateFeePayment,
        uint256 interestPayment,
        uint256 principalPayment,
        bool loanClosed
    );

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(uint256 => mapping(uint256 => RepaymentSchedule)) public repaymentSchedules;

    uint256 public constant GRACE_PERIOD = 3 days;
    uint256 public constant LATE_FEE_BPS = 1000;
    uint256 public constant MAX_LATE_FEE_BPS = 1000;

    uint256 public totalLoansIssued;
    uint256 public totalAmountLent;
    uint256 public totalRepaid;
    uint256 public totalDefaulted;

    constructor(
        address _trustScoreAddress,
        address _collateralManagerAddress,
        address _interestRateModelAddress
    ) Ownable(msg.sender) {
        trustScore = TrustScore(_trustScoreAddress);
        collateralManager = CollateralManager(_collateralManagerAddress);
        interestRateModel = InterestRateModel(_interestRateModelAddress);
    }

    function createLoan(
        uint256 amount,
        uint256 duration,
        address collateralToken,
        uint256 collateralAmount,
        string memory purpose
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralAmount > 0, "Collateral amount must be greater than 0");
        require(
            collateralManager.isAcceptableCollateral(collateralToken),
            "Unacceptable collateral token"
        );

        uint256 trustScoreValue = trustScore.getTrustScore(msg.sender);
        uint256 interestRate = interestRateModel.calculateInterestRate(amount, trustScoreValue);
        uint256 requiredCollateral = _calculateRequiredCollateral(amount, trustScoreValue);

        require(
            collateralAmount >= requiredCollateral,
            "Insufficient collateral"
        );

        collateralManager.lockCollateral(
            msg.sender,
            collateralToken,
            collateralAmount
        );

        uint256 loanId = ++_loanIdCounter;

        uint256 dueDate = block.timestamp + duration;

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            principalAmount: amount,
            remainingPrincipal: amount,
            interestAccrued: 0,
            lateFee: 0,
            interestRateBps: interestRate,
            createdAt: block.timestamp,
            dueDate: dueDate,
            status: LoanStatus.Active,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            repayments: new RepaymentSchedule[](0)
        });

        borrowerLoans[msg.sender].push(loanId);

        totalLoansIssued++;
        totalAmountLent += amount;

        emit LoanCreated(loanId, msg.sender, amount, interestRate, dueDate, purpose);

        return loanId;
    }

    function repayLoan(
        uint256 loanId,
        uint256 amount
    ) external payable nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(loan.borrower == msg.sender, "Not the borrower");

        _updateInterestAndLateFee(loanId);

        uint256 totalOwed = _calculateTotalOwed(loanId);
        require(amount <= totalOwed, "Amount exceeds total owed");

        uint256 remainingAmount = amount;
        uint256 lateFeePayment = 0;
        uint256 interestPayment = 0;
        uint256 principalPayment = 0;

        if (loan.lateFee > 0 && remainingAmount > 0) {
            lateFeePayment = remainingAmount >= loan.lateFee ? loan.lateFee : remainingAmount;
            remainingAmount -= lateFeePayment;
            loan.lateFee -= lateFeePayment;
        }

        if (loan.interestAccrued > 0 && remainingAmount > 0) {
            interestPayment = remainingAmount >= loan.interestAccrued ? loan.interestAccrued : remainingAmount;
            remainingAmount -= interestPayment;
            loan.interestAccrued -= interestPayment;
        }

        if (loan.remainingPrincipal > 0 && remainingAmount > 0) {
            principalPayment = remainingAmount >= loan.remainingPrincipal ? loan.remainingPrincipal : remainingAmount;
            remainingAmount -= principalPayment;
            loan.remainingPrincipal -= principalPayment;
        }

        require(remainingAmount == 0, "Invalid payment amount");

        bool fullyRepaid = loan.remainingPrincipal == 0 && loan.interestAccrued == 0 && loan.lateFee == 0;

        if (fullyRepaid) {
            loan.status = LoanStatus.Repaid;
            collateralManager.releaseCollateral(
                loan.borrower,
                loan.collateralToken,
                loan.collateralAmount
            );
        }

        totalRepaid += amount;

        emit RepaymentApplied(
            loanId,
            msg.sender,
            amount,
            lateFeePayment,
            interestPayment,
            principalPayment,
            fullyRepaid
        );

        emit LoanRepaid(
            loanId,
            msg.sender,
            principalPayment,
            interestPayment,
            lateFeePayment,
            fullyRepaid
        );
    }

    function repayLoanFull(uint256 loanId) external payable nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(loan.borrower == msg.sender, "Not the borrower");

        _updateInterestAndLateFee(loanId);

        uint256 totalOwed = _calculateTotalOwed(loanId);
        uint256 amount = totalOwed;

        uint256 remainingAmount = amount;
        uint256 lateFeePayment = 0;
        uint256 interestPayment = 0;
        uint256 principalPayment = 0;

        if (loan.lateFee > 0 && remainingAmount > 0) {
            lateFeePayment = remainingAmount >= loan.lateFee ? loan.lateFee : remainingAmount;
            remainingAmount -= lateFeePayment;
            loan.lateFee -= lateFeePayment;
        }

        if (loan.interestAccrued > 0 && remainingAmount > 0) {
            interestPayment = remainingAmount >= loan.interestAccrued ? loan.interestAccrued : remainingAmount;
            remainingAmount -= interestPayment;
            loan.interestAccrued -= interestPayment;
        }

        if (loan.remainingPrincipal > 0 && remainingAmount > 0) {
            principalPayment = remainingAmount >= loan.remainingPrincipal ? loan.remainingPrincipal : remainingAmount;
            remainingAmount -= principalPayment;
            loan.remainingPrincipal -= principalPayment;
        }

        require(remainingAmount == 0, "Invalid payment amount");

        bool fullyRepaid = loan.remainingPrincipal == 0 && loan.interestAccrued == 0 && loan.lateFee == 0;

        if (fullyRepaid) {
            loan.status = LoanStatus.Repaid;
            collateralManager.releaseCollateral(
                loan.borrower,
                loan.collateralToken,
                loan.collateralAmount
            );
        }

        totalRepaid += amount;

        emit RepaymentApplied(
            loanId,
            msg.sender,
            amount,
            lateFeePayment,
            interestPayment,
            principalPayment,
            fullyRepaid
        );

        emit LoanRepaid(
            loanId,
            msg.sender,
            principalPayment,
            interestPayment,
            lateFeePayment,
            fullyRepaid
        );
    }

    function liquidateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");

        _updateInterestAndLateFee(loanId);

        require(
            block.timestamp > loan.dueDate + GRACE_PERIOD,
            "Loan not yet overdue for liquidation"
        );

        loan.status = LoanStatus.Defaulted;
        totalDefaulted++;

        collateralManager.liquidateCollateral(
            loan.borrower,
            loan.collateralToken,
            loan.collateralAmount
        );

        emit LoanDefaulted(loanId, loan.borrower, loan.remainingPrincipal);
    }

    function getLoanDetails(
        uint256 loanId
    )
        external
        view
        returns (
            address borrower,
            uint256 principalAmount,
            uint256 remainingPrincipal,
            uint256 interestAccrued,
            uint256 lateFee,
            uint256 dueDate,
            bool isOverdue,
            LoanStatus status,
            address collateralToken
        )
    {
        Loan storage loan = loans[loanId];
        isOverdue = block.timestamp > loan.dueDate;
        return (
            loan.borrower,
            loan.principalAmount,
            loan.remainingPrincipal,
            loan.interestAccrued,
            loan.lateFee,
            loan.dueDate,
            isOverdue,
            loan.status,
            loan.collateralToken
        );
    }

    function calculateRepaymentAmount(
        uint256 loanId
    )
        external
        view
        returns (
            uint256 totalPayable,
            uint256 lateFee,
            uint256 interestAccrued,
            uint256 principalRemaining
        )
    {
        Loan storage loan = loans[loanId];
        uint256 accruedInterest = _calculateAccruedInterest(loanId);
        uint256 accruedLateFee = _calculateLateFee(loanId);

        totalPayable = loan.remainingPrincipal + accruedInterest + accruedLateFee;
        return (totalPayable, accruedLateFee, accruedInterest, loan.remainingPrincipal);
    }

    function isLoanOverdue(uint256 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        return block.timestamp > loan.dueDate;
    }

    function getMaxLateFee(uint256 loanId) external view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 maxLateFee = (loan.principalAmount * MAX_LATE_FEE_BPS) / 10000;
        return maxLateFee;
    }

    function _updateInterestAndLateFee(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) return;

        uint256 newAccruedInterest = _calculateAccruedInterest(loanId);
        uint256 newLateFee = _calculateLateFee(loanId);

        loan.interestAccrued += newAccruedInterest;
        loan.lateFee = newLateFee;
    }

    function _calculateAccruedInterest(uint256 loanId) internal view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 timeElapsed = block.timestamp - loan.createdAt;
        uint256 interest = (loan.principalAmount * loan.interestRateBps * timeElapsed) / (10000 * 365 days);
        return interest;
    }

    function _calculateLateFee(uint256 loanId) internal view returns (uint256) {
        Loan storage loan = loans[loanId];
        if (block.timestamp <= loan.dueDate) return 0;

        uint256 overdueDays = (block.timestamp - loan.dueDate) / 1 days;
        uint256 maxLateFee = (loan.principalAmount * MAX_LATE_FEE_BPS) / 10000;

        uint256 calculatedLateFee = (loan.principalAmount * LATE_FEE_BPS * overdueDays) / (10000 * 30);
        
        return calculatedLateFee > maxLateFee ? maxLateFee : calculatedLateFee;
    }

    function _calculateTotalOwed(uint256 loanId) internal view returns (uint256) {
        Loan storage loan = loans[loanId];
        uint256 accruedInterest = _calculateAccruedInterest(loanId);
        uint256 accruedLateFee = _calculateLateFee(loanId);
        return loan.remainingPrincipal + loan.interestAccrued + accruedInterest + loan.lateFee + accruedLateFee;
    }

    function _calculateRequiredCollateral(
        uint256 amount,
        uint256 trustScoreValue
    ) internal pure returns (uint256) {
        if (trustScoreValue >= 800) {
            return (amount * 120) / 100;
        } else if (trustScoreValue >= 600) {
            return (amount * 130) / 100;
        } else if (trustScoreValue >= 400) {
            return (amount * 150) / 100;
        } else {
            return (amount * 200) / 100;
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

