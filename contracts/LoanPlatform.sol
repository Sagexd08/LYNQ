// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title LoanPlatform
 * @dev A decentralized lending platform on Ethereum
 * @notice This contract allows users to create loans, repay them, and build on-chain reputation
 */
contract LoanPlatform is ReentrancyGuard, Ownable, Pausable {
    
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate; // In basis points (e.g., 1000 = 10%)
        uint256 duration; // In seconds
        uint256 createdAt;
        uint256 dueDate;
        uint256 repaidAmount;
        bool isActive;
        bool isRepaid;
        string purpose;
    }
    
    struct UserReputation {
        uint256 totalLoans;
        uint256 repaidLoans;
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 reputationScore; // 0-1000 scale
        bool isDefaulter;
    }
    
    // State variables
    uint256 public nextLoanId = 1;
    uint256 public constant REPUTATION_SCALE = 1000;
    uint256 public constant BASE_INTEREST_RATE = 500; // 5% in basis points
    uint256 public constant MAX_INTEREST_RATE = 2000; // 20% in basis points
    uint256 public constant PLATFORM_FEE = 100; // 1% in basis points
    
    mapping(uint256 => Loan) public loans;
    mapping(address => UserReputation) public userReputations;
    mapping(address => uint256[]) public userLoans;
    
    // Events
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        string purpose
    );
    
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 repaidAmount,
        bool isFullyRepaid
    );
    
    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        uint256 totalLoans,
        uint256 repaidLoans
    );
    
    // Modifiers
    modifier onlyBorrower(uint256 loanId) {
        require(loans[loanId].borrower == msg.sender, "Not the borrower");
        _;
    }
    
    modifier loanExists(uint256 loanId) {
        require(loans[loanId].borrower != address(0), "Loan does not exist");
        _;
    }
    
    modifier loanActive(uint256 loanId) {
        require(loans[loanId].isActive, "Loan is not active");
        require(!loans[loanId].isRepaid, "Loan already repaid");
        _;
    }
    
    constructor() {
        // Initialize contract
    }
    
    /**
     * @dev Create a new loan
     * @param amount The loan amount in wei
     * @param duration The loan duration in seconds
     * @param purpose The purpose of the loan
     */
    function createLoan(
        uint256 amount,
        uint256 duration,
        string memory purpose
    ) external payable nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(duration <= 365 days, "Duration cannot exceed 365 days");
        require(bytes(purpose).length > 0, "Purpose cannot be empty");
        
        // Calculate interest rate based on user reputation
        uint256 interestRate = calculateInterestRate(msg.sender);
        
        // Create loan
        Loan memory newLoan = Loan({
            id: nextLoanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: interestRate,
            duration: duration,
            createdAt: block.timestamp,
            dueDate: block.timestamp + duration,
            repaidAmount: 0,
            isActive: true,
            isRepaid: false,
            purpose: purpose
        });
        
        loans[nextLoanId] = newLoan;
        userLoans[msg.sender].push(nextLoanId);
        
        // Update user statistics
        UserReputation storage reputation = userReputations[msg.sender];
        reputation.totalLoans++;
        reputation.totalBorrowed += amount;
        
        // Transfer loan amount to borrower (minus platform fee)
        uint256 platformFee = (amount * PLATFORM_FEE) / 10000;
        uint256 loanAmount = amount - platformFee;
        
        payable(msg.sender).transfer(loanAmount);
        
        emit LoanCreated(
            nextLoanId,
            msg.sender,
            amount,
            interestRate,
            duration,
            purpose
        );
        
        nextLoanId++;
    }
    
    /**
     * @dev Repay a loan (partial or full)
     * @param loanId The ID of the loan to repay
     */
    function repayLoan(uint256 loanId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        loanExists(loanId) 
        loanActive(loanId) 
        onlyBorrower(loanId) 
    {
        require(msg.value > 0, "Repayment amount must be greater than 0");
        
        Loan storage loan = loans[loanId];
        uint256 totalOwed = calculateTotalOwed(loanId);
        
        require(msg.value <= totalOwed - loan.repaidAmount, "Repayment exceeds owed amount");
        
        loan.repaidAmount += msg.value;
        
        // Check if loan is fully repaid
        bool isFullyRepaid = loan.repaidAmount >= totalOwed;
        if (isFullyRepaid) {
            loan.isActive = false;
            loan.isRepaid = true;
            
            // Update user reputation
            UserReputation storage reputation = userReputations[msg.sender];
            reputation.repaidLoans++;
            reputation.totalRepaid += loan.repaidAmount;
            
            // Update reputation score
            updateReputationScore(msg.sender);
        }
        
        emit LoanRepaid(loanId, msg.sender, msg.value, isFullyRepaid);
    }
    
    /**
     * @dev Calculate the total amount owed for a loan including interest
     * @param loanId The ID of the loan
     * @return The total amount owed in wei
     */
    function calculateTotalOwed(uint256 loanId) public view loanExists(loanId) returns (uint256) {
        Loan memory loan = loans[loanId];
        uint256 interest = (loan.amount * loan.interestRate * loan.duration) / (10000 * 365 days);
        return loan.amount + interest;
    }
    
    /**
     * @dev Calculate interest rate for a user based on their reputation
     * @param user The address of the user
     * @return The interest rate in basis points
     */
    function calculateInterestRate(address user) public view returns (uint256) {
        UserReputation memory reputation = userReputations[user];
        
        if (reputation.totalLoans == 0) {
            // New user gets base rate
            return BASE_INTEREST_RATE;
        }
        
        if (reputation.isDefaulter) {
            // Defaulters get maximum rate
            return MAX_INTEREST_RATE;
        }
        
        // Calculate rate based on reputation score
        // Higher reputation = lower interest rate
        uint256 rateReduction = (reputation.reputationScore * (MAX_INTEREST_RATE - BASE_INTEREST_RATE)) / REPUTATION_SCALE;
        return MAX_INTEREST_RATE - rateReduction;
    }
    
    /**
     * @dev Update the reputation score for a user
     * @param user The address of the user
     */
    function updateReputationScore(address user) internal {
        UserReputation storage reputation = userReputations[user];
        
        if (reputation.totalLoans == 0) {
            reputation.reputationScore = 0;
            return;
        }
        
        // Calculate reputation score based on repayment history
        uint256 repaymentRate = (reputation.repaidLoans * REPUTATION_SCALE) / reputation.totalLoans;
        
        // Additional factors can be added here (e.g., timeliness, amount consistency)
        reputation.reputationScore = repaymentRate;
        
        emit ReputationUpdated(
            user,
            reputation.reputationScore,
            reputation.totalLoans,
            reputation.repaidLoans
        );
    }
    
    /**
     * @dev Get user's loans
     * @param user The address of the user
     * @return Array of loan IDs belonging to the user
     */
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }
    
    /**
     * @dev Get loan details
     * @param loanId The ID of the loan
     * @return The loan struct
     */
    function getLoan(uint256 loanId) external view loanExists(loanId) returns (Loan memory) {
        return loans[loanId];
    }
    
    /**
     * @dev Get user reputation
     * @param user The address of the user
     * @return The user's reputation struct
     */
    function getUserReputation(address user) external view returns (UserReputation memory) {
        return userReputations[user];
    }
    
    /**
     * @dev Mark a user as defaulter (only owner can call this)
     * @param user The address of the user
     * @param isDefaulter Whether the user is a defaulter
     */
    function setDefaulter(address user, bool isDefaulter) external onlyOwner {
        userReputations[user].isDefaulter = isDefaulter;
        if (isDefaulter) {
            userReputations[user].reputationScore = 0;
        }
        updateReputationScore(user);
    }
    
    /**
     * @dev Withdraw platform fees (only owner can call this)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Pause the contract (only owner can call this)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner can call this)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency function to allow contract to receive ETH
     */
    receive() external payable {
        // Allow contract to receive ETH for loan funding
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function does not exist");
    }
}
