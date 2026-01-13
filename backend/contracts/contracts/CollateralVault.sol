// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CollateralVault
 * @notice Vault contract for managing collateral for LYNQ loans
 * @dev Handles locking, unlocking, and seizure of ERC20 token collateral
 */
contract CollateralVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============
    
    struct Collateral {
        bytes32 loanId;
        address depositor;
        address token;
        uint256 amount;
        bool isLocked;
    }

    // ============ State Variables ============
    
    mapping(bytes32 => Collateral[]) public loanCollaterals;
    mapping(bytes32 => uint256) public collateralCount;
    
    address public loanCore;
    
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;

    // ============ Events ============
    
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

    // ============ Errors ============
    
    error TokenNotSupported();
    error InvalidAmount();
    error LoanNotFound();
    error NotDepositor();
    error CollateralStillLocked();
    error NoCollateralFound();
    error TransferFailed();
    error LoanCoreNotSet();

    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============
    
    /**
     * @notice Lock collateral for a loan
     * @param loanId The loan identifier
     * @param token The ERC20 token address
     * @param amount The amount to lock
     */
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
    
    /**
     * @notice Unlock and return collateral to depositor
     * @param loanId The loan identifier
     */
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
    
    /**
     * @notice Seize collateral for a defaulted loan
     * @param loanId The loan identifier
     * @param recipient Address to receive seized collateral
     */
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

    // ============ View Functions ============
    
    /**
     * @notice Get all collateral for a loan
     * @param loanId The loan identifier
     * @return Array of Collateral structs
     */
    function getCollateral(bytes32 loanId) external view returns (Collateral[] memory) {
        return loanCollaterals[loanId];
    }
    
    /**
     * @notice Get total locked collateral value for a loan (in token amounts)
     * @param loanId The loan identifier
     * @param token The token address
     * @return Total amount locked
     */
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
    
    /**
     * @notice Check if token is supported
     * @param token The token address
     * @return True if supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }
    
    /**
     * @notice Get all supported tokens
     * @return Array of token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Add or remove token support
     * @param token The token address
     * @param supported Whether to support the token
     */
    function setTokenSupported(address token, bool supported) external onlyOwner {
        if (supported && !supportedTokens[token]) {
            tokenList.push(token);
        }
        supportedTokens[token] = supported;
        
        emit TokenSupported(token, supported);
    }
    
    /**
     * @notice Set the LoanCore contract address
     * @param _loanCore The LoanCore address
     */
    function setLoanCore(address _loanCore) external onlyOwner {
        emit LoanCoreUpdated(loanCore, _loanCore);
        loanCore = _loanCore;
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
     * @notice Emergency withdrawal of stuck tokens
     * @param token The token address
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
}
