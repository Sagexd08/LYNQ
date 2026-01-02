
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SocialStaking is Ownable, ReentrancyGuard {
    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }

    
    mapping(uint256 => mapping(address => Stake)) public stakes;
    
    mapping(uint256 => uint256) public totalStaked;
    
    address public loanCore;
    IERC20 public stakingToken;

    event Staked(uint256 indexed loanId, address indexed staker, uint256 amount);
    event Unstaked(uint256 indexed loanId, address indexed staker, uint256 amount);
    event Slashed(uint256 indexed loanId, uint256 amount);

    modifier onlyLoanCore() {
        require(msg.sender == loanCore, "Caller is not LoanCore");
        _;
    }

    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
    }

    function setLoanCore(address _loanCore) external onlyOwner {
        loanCore = _loanCore;
    }

    function stake(uint256 loanId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(loanCore != address(0), "LoanCore not set");
        
        
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        stakes[loanId][msg.sender].amount += amount;
        stakes[loanId][msg.sender].timestamp = block.timestamp;
        totalStaked[loanId] += amount;
        
        emit Staked(loanId, msg.sender, amount);
    }

    function unstake(uint256 loanId) external nonReentrant {
        Stake storage userStake = stakes[loanId][msg.sender];
        require(userStake.amount > 0, "No stake found");
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
    }

    
    mapping(uint256 => bool) public loanRepaid;
    
    mapping(uint256 => bool) public loanDefaulted;

    function notifyRepayment(uint256 loanId) external onlyLoanCore {
        loanRepaid[loanId] = true;
    }

    function notifyDefault(uint256 loanId) external onlyLoanCore {
        loanDefaulted[loanId] = true;
        uint256 amountToSlash = totalStaked[loanId];
        if (amountToSlash > 0) {
            
            
            
            require(stakingToken.transfer(owner(), amountToSlash), "Transfer failed");
            emit Slashed(loanId, amountToSlash);
        }
    }

    function withdrawStake(uint256 loanId) external nonReentrant {
        require(!loanDefaulted[loanId], "Loan defaulted, stake slashed");
        require(loanRepaid[loanId], "Loan not repaid yet");
        
        Stake storage userStake = stakes[loanId][msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No stake to withdraw");
        
        userStake.amount = 0;
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(loanId, msg.sender, amount);
    }
}
