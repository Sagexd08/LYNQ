
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../reputation/SocialStaking.sol";
import "../reputation/ReputationPoints.sol";
import "./CreditScoreVerifier.sol";

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
    mapping(address => address) public tokenPriceFeed; 
    uint256 public loanCounter;
    
    address public collateralVault;
    SocialStaking public socialStaking;
    CreditScoreVerifier public creditScoreVerifier;
    ReputationPoints public reputationPoints;
    uint256 public constant LIQUIDATION_THRESHOLD = 120; 

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 collateralAmount
    );
    
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanLiquidated(uint256 indexed loanId);
    event LoanRefinanced(uint256 indexed loanId, uint256 newAmount, uint256 newInterestRate, uint256 newDuration);
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);

    constructor() Ownable(msg.sender) {}

    function setCollateralVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Invalid vault");
        collateralVault = _vault;
    }

    function setSocialStaking(address _socialStaking) external onlyOwner {
        socialStaking = SocialStaking(_socialStaking);
    }

    function setCreditScoreVerifier(address _verifier) external onlyOwner {
        creditScoreVerifier = CreditScoreVerifier(_verifier);
    }

    function setReputationPoints(address _reputationPoints) external onlyOwner {
        reputationPoints = ReputationPoints(_reputationPoints);
    }

    function setPriceFeed(address token, address priceFeed) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(priceFeed != address(0), "Invalid price feed");
        tokenPriceFeed[token] = priceFeed;
        emit PriceFeedUpdated(token, priceFeed);
    }

    function getLatestPrice(address token) public view returns (uint256) {
        address priceFeed = tokenPriceFeed[token];
        require(priceFeed != address(0), "Price feed not found for token");
        
        AggregatorV3Interface aggregator = AggregatorV3Interface(priceFeed);
        (
            ,
            int256 answer,
            ,
            ,
            
        ) = aggregator.latestRoundData();
        
        require(answer > 0, "Invalid price data");
        return uint256(answer);
    }

    function getCollateralValue(address token, uint256 amount) public view returns (uint256) {
        uint256 price = getLatestPrice(token);
        return (amount * price) / 1e8; 
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
        require(collateralToken != address(0), "Invalid collateral token");
        require(duration > 0, "Duration must be > 0");
        require(collateralVault != address(0), "Collateral vault not set");

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

        require(
            IERC20(collateralToken).transferFrom(msg.sender, collateralVault, collateralAmount),
            "Collateral transfer failed"
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
            if (address(socialStaking) != address(0)) {
                socialStaking.notifyRepayment(loanId);
            }
            if (address(reputationPoints) != address(0)) {
                bool onTime = block.timestamp <= loan.startTime + loan.duration;
                reputationPoints.recordLoanCompletion(msg.sender, onTime);
            }
        }

        emit LoanRepaid(loanId, amount);
    }

    function liquidateLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        
        
        bool isOverdue = block.timestamp > loan.startTime + loan.duration;
        bool isUndercollateralized = false;
        
        if (tokenPriceFeed[loan.collateralToken] != address(0)) {
            uint256 collateralValue = getCollateralValue(loan.collateralToken, loan.collateralAmount);
            uint256 loanValueWithMargin = (loan.outstandingAmount * LIQUIDATION_THRESHOLD) / 100;
            isUndercollateralized = collateralValue < loanValueWithMargin;
        }
        
        require(isOverdue || isUndercollateralized, "Loan cannot be liquidated");

        loan.status = LoanStatus.LIQUIDATED;
        
        if (address(socialStaking) != address(0)) {
            socialStaking.notifyDefault(loanId);
        }
        
        if (address(reputationPoints) != address(0)) {
            reputationPoints.recordLoanCompletion(loan.borrower, false);
        }

        emit LoanLiquidated(loanId);
    }

    function isLoanUndercollateralized(uint256 loanId) external view returns (bool) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.ACTIVE) return false;
        if (tokenPriceFeed[loan.collateralToken] == address(0)) return false;
        
        uint256 collateralValue = getCollateralValue(loan.collateralToken, loan.collateralAmount);
        uint256 loanValueWithMargin = (loan.outstandingAmount * LIQUIDATION_THRESHOLD) / 100;
        return collateralValue < loanValueWithMargin;
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    function refinanceLoan(
        uint256 loanId,
        uint256 newInterestRate,
        uint256 newDuration,
        uint256 timestamp,
        bytes calldata signature
    ) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.borrower == msg.sender, "Not loan owner");
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(address(creditScoreVerifier) != address(0), "Verifier not set");

        
        require(
            creditScoreVerifier.verifyRefinanceProposal(
                msg.sender,
                loanId,
                newInterestRate,
                newDuration,
                timestamp,
                signature
            ),
            "Invalid refinance signature"
        );

        
        uint256 timePassed = block.timestamp - loan.startTime;
        if (timePassed > loan.duration) timePassed = loan.duration;
        
        uint256 oldTotalInterest = (loan.amount * loan.interestRate) / 10000;
        uint256 accruedInterest = (oldTotalInterest * timePassed) / loan.duration;
        
        
        loan.amount += accruedInterest;
        
        
        loan.interestRate = newInterestRate;
        loan.duration = newDuration;
        loan.startTime = block.timestamp;
        
        
        uint256 newTotalInterest = (loan.amount * newInterestRate) / 10000;
        loan.outstandingAmount = loan.amount + newTotalInterest;
        
        emit LoanRefinanced(loanId, loan.amount, newInterestRate, newDuration);
    }
}
