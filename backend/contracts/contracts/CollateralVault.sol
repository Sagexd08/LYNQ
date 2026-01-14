
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CollateralVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Collateral {
        bytes32 loanId;
        address depositor;
        address token;
        uint256 amount;
        bool isLocked;
    }

    mapping(bytes32 => Collateral[]) public loanCollaterals;
    mapping(bytes32 => uint256) public collateralCount;
    
    address public loanCore;
    
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;

    event CollateralLocked(
        bytes32 indexed loanId,
        address indexed depositor,
        address indexed token,
        uint256 amount,
        uint256 index
    );
    
    event CollateralUnlocked(
        bytes32 indexed loanId,
        address indexed recipient,
        address indexed token,
        uint256 amount
    );
    
    event CollateralSeized(
        bytes32 indexed loanId,
        address indexed token,
        uint256 amount,
        address recipient
    );
    
    event TokenSupported(address indexed token, bool supported);
    
    event LoanCoreUpdated(address oldCore, address newCore);

    error TokenNotSupported();
    error InvalidAmount();
    error LoanNotFound();
    error NotDepositor();
    error CollateralStillLocked();
    error NoCollateralFound();
    error TransferFailed();
    error LoanCoreNotSet();

    constructor() Ownable(msg.sender) {}

    function lockCollateral(
        bytes32 loanId,
        address token,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (amount == 0) revert InvalidAmount();
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 index = collateralCount[loanId];
        
        loanCollaterals[loanId].push(Collateral({
            loanId: loanId,
            depositor: msg.sender,
            token: token,
            amount: amount,
            isLocked: true
        }));
        
        collateralCount[loanId]++;
        
        emit CollateralLocked(loanId, msg.sender, token, amount, index);
    }

    function unlockCollateral(bytes32 loanId) external whenNotPaused nonReentrant {
        Collateral[] storage collaterals = loanCollaterals[loanId];
        if (collaterals.length == 0) revert NoCollateralFound();
        
        for (uint256 i = 0; i < collaterals.length; i++) {
            Collateral storage col = collaterals[i];
            if (col.isLocked && col.depositor == msg.sender) {
                col.isLocked = false;
                
                IERC20(col.token).safeTransfer(msg.sender, col.amount);
                
                emit CollateralUnlocked(loanId, msg.sender, col.token, col.amount);
            }
        }
    }

    function seizeCollateral(
        bytes32 loanId,
        address recipient
    ) external onlyOwner nonReentrant {
        Collateral[] storage collaterals = loanCollaterals[loanId];
        if (collaterals.length == 0) revert NoCollateralFound();
        
        for (uint256 i = 0; i < collaterals.length; i++) {
            Collateral storage col = collaterals[i];
            if (col.isLocked) {
                col.isLocked = false;
                
                IERC20(col.token).safeTransfer(recipient, col.amount);
                
                emit CollateralSeized(loanId, col.token, col.amount, recipient);
            }
        }
    }

    function getCollateral(bytes32 loanId) external view returns (Collateral[] memory) {
        return loanCollaterals[loanId];
    }

    function getLockedAmount(bytes32 loanId, address token) external view returns (uint256) {
        Collateral[] storage collaterals = loanCollaterals[loanId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < collaterals.length; i++) {
            if (collaterals[i].isLocked && collaterals[i].token == token) {
                total += collaterals[i].amount;
            }
        }
        
        return total;
    }

    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    function setTokenSupported(address token, bool supported) external onlyOwner {
        if (supported && !supportedTokens[token]) {
            tokenList.push(token);
        }
        supportedTokens[token] = supported;
        
        emit TokenSupported(token, supported);
    }

    function setLoanCore(address _loanCore) external onlyOwner {
        emit LoanCoreUpdated(loanCore, _loanCore);
        loanCore = _loanCore;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
}
