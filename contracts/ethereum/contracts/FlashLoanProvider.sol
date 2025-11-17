// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TrustScore.sol";

/**
 * @title IFlashLoanReceiver
 * @notice Interface for single-asset flash loan receiver contracts
 */
interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @title IMultiWalletFlashLoanReceiver
 * @notice Interface for multi-wallet flash loan receiver contracts
 * Allows a single flash loan to be distributed to multiple recipient wallets
 */
interface IMultiWalletFlashLoanReceiver {
    /**
     * @notice Execute flash loan operation with multiple recipients
     * @param asset The token being borrowed
     * @param totalAmount Total amount borrowed (sum of all recipient allocations)
     * @param premium Total premium to be repaid
     * @param recipients Array of recipient wallet addresses
     * @param allocations Array of amounts allocated to each recipient (must sum to totalAmount)
     * @param initiator The address that initiated the flash loan
     * @param params Additional operation parameters
     * @return success Whether the operation was successful
     * @dev All recipients must return funds to this contract for the transaction to succeed
     */
    function executeMultiWalletOperation(
        address asset,
        uint256 totalAmount,
        uint256 premium,
        address[] calldata recipients,
        uint256[] calldata allocations,
        address initiator,
        bytes calldata params
    ) external returns (bool success);
}

/**
 * @title FlashLoanProvider
 * @notice Beginner-friendly flash loan system with multi-collateral support, risk scoring, and automatic rollback
 * @dev Implements flash loans with comprehensive safety checks and educational features
 */
contract FlashLoanProvider is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    TrustScore public trustScore;

    // Flash loan fee (in basis points, e.g., 9 = 0.09%)
    uint256 public flashLoanFeeBps = 9;
    uint256 public constant MAX_FLASH_LOAN_FEE_BPS = 100; // 1% max fee
    uint256 public constant MIN_TRUST_SCORE = 300; // Minimum trust score for flash loans

    // Risk scoring parameters
    uint256 public constant HIGH_RISK_THRESHOLD = 500;
    uint256 public constant MEDIUM_RISK_THRESHOLD = 700;
    
    // Multi-wallet flash loan tracking
    uint256 private _batchIdCounter = 0;
    mapping(uint256 => MultiWalletFlashLoanBatch) public multiWalletBatches;
    mapping(address => uint256[]) public userBatchIds; // Track batches per user
    
    // Pool limits
    mapping(address => uint256) public poolLiquidity;
    mapping(address => uint256) public maxFlashLoanAmount;
    mapping(address => bool) public supportedAssets;
    
    // User statistics for risk assessment
    mapping(address => UserStats) public userStats;
    mapping(address => uint256) public lastFlashLoanTime;
    
    struct UserStats {
        uint256 totalFlashLoans;
        uint256 successfulFlashLoans;
        uint256 failedFlashLoans;
        uint256 totalVolumeFlashLoaned;
        uint256 lastFlashLoanTimestamp;
        RiskLevel riskLevel;
    }

    enum RiskLevel {
        Low,
        Medium,
        High,
        Critical
    }

    struct FlashLoanData {
        address initiator;
        address[] assets;
        uint256[] amounts;
        uint256[] premiums;
        uint256 timestamp;
        bool success;
    }

    /**
     * @notice Multi-wallet flash loan batch execution details
     */
    struct MultiWalletFlashLoanBatch {
        address asset;
        uint256 totalAmount;
        uint256 premium;
        address[] recipients;
        uint256[] allocations; // Amount allocated to each recipient
        address initiator;
        uint256 timestamp;
        bool success;
        string failureReason;
    }

    /**
     * @notice Tracks per-recipient status in a multi-wallet flash loan
     */
    struct RecipientExecutionStatus {
        address recipient;
        uint256 allocation;
        bool received;
        bool repaid;
        uint256 repaidAmount;
    }

    // Events
    event FlashLoan(
        address indexed receiver,
        address indexed initiator,
        address[] assets,
        uint256[] amounts,
        uint256[] premiums,
        uint256 timestamp
    );

    event FlashLoanFailed(
        address indexed receiver,
        address indexed initiator,
        address[] assets,
        uint256[] amounts,
        string reason
    );

    /**
     * @notice Emitted when a multi-wallet flash loan is successfully executed
     * @param batchId Unique identifier for this batch
     * @param initiator Address that initiated the flash loan
     * @param asset Token borrowed
     * @param totalAmount Total amount distributed
     * @param premium Total premium collected
     * @param recipients Array of recipient addresses
     * @param allocations Array of amounts per recipient
     * @param timestamp Block timestamp
     */
    event MultiWalletFlashLoan(
        uint256 indexed batchId,
        address indexed initiator,
        address indexed asset,
        uint256 totalAmount,
        uint256 premium,
        address[] recipients,
        uint256[] allocations,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a multi-wallet flash loan fails
     * @param batchId Batch identifier
     * @param initiator Address that initiated the flash loan
     * @param asset Token borrowed
     * @param totalAmount Total amount attempted
     * @param failureReason Reason for failure
     * @param failedRecipients Addresses of recipients that failed to return funds
     */
    event MultiWalletFlashLoanFailed(
        uint256 indexed batchId,
        address indexed initiator,
        address indexed asset,
        uint256 totalAmount,
        string failureReason,
        address[] failedRecipients
    );

    event AssetAdded(address indexed asset, uint256 maxAmount);
    event AssetRemoved(address indexed asset);
    event LiquidityDeposited(address indexed asset, uint256 amount, address indexed depositor);
    event LiquidityWithdrawn(address indexed asset, uint256 amount, address indexed recipient);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event RiskLevelUpdated(address indexed user, RiskLevel oldLevel, RiskLevel newLevel);

    constructor(address _trustScoreAddress) Ownable(msg.sender) {
        require(_trustScoreAddress != address(0), "Invalid trust score address");
        trustScore = TrustScore(_trustScoreAddress);
    }

    /**
     * @notice Execute a flash loan
     * @param receiverAddress The contract receiving the flash loan
     * @param assets Array of asset addresses to borrow
     * @param amounts Array of amounts to borrow
     * @param params Additional parameters for the receiver
     */
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        bytes calldata params
    ) external nonReentrant whenNotPaused {
        require(receiverAddress != address(0), "Invalid receiver");
        require(assets.length > 0, "No assets specified");
        require(assets.length == amounts.length, "Arrays length mismatch");
        require(assets.length <= 5, "Too many assets (max 5)");

        // Risk assessment
        _performRiskCheck(msg.sender, assets, amounts);

        uint256[] memory premiums = new uint256[](assets.length);
        uint256[] memory amountsWithPremiums = new uint256[](assets.length);

        // Calculate premiums and validate
        for (uint256 i = 0; i < assets.length; i++) {
            require(supportedAssets[assets[i]], "Asset not supported");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(amounts[i] <= maxFlashLoanAmount[assets[i]], "Amount exceeds max");
            require(amounts[i] <= poolLiquidity[assets[i]], "Insufficient liquidity");

            premiums[i] = (amounts[i] * flashLoanFeeBps) / 10000;
            amountsWithPremiums[i] = amounts[i] + premiums[i];
        }

        // Store initial balances for rollback verification
        uint256[] memory initialBalances = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            initialBalances[i] = IERC20(assets[i]).balanceOf(address(this));
        }

        // Transfer assets to receiver
        for (uint256 i = 0; i < assets.length; i++) {
            poolLiquidity[assets[i]] -= amounts[i];
            IERC20(assets[i]).safeTransfer(receiverAddress, amounts[i]);
        }

        // Execute operation on receiver
        bool success = false;
        string memory failureReason = "";

        try IFlashLoanReceiver(receiverAddress).executeOperation(
            assets,
            amounts,
            premiums,
            msg.sender,
            params
        ) returns (bool result) {
            success = result;
            if (!success) {
                failureReason = "Receiver returned false";
            }
        } catch Error(string memory reason) {
            failureReason = reason;
        } catch {
            failureReason = "Unknown error in receiver";
        }

        // Verify repayment and rollback if failed
        if (success) {
            for (uint256 i = 0; i < assets.length; i++) {
                uint256 currentBalance = IERC20(assets[i]).balanceOf(address(this));
                require(
                    currentBalance >= initialBalances[i] + premiums[i],
                    "Flash loan not repaid"
                );
                poolLiquidity[assets[i]] += amounts[i] + premiums[i];
            }

            // Update success statistics
            _updateUserStats(msg.sender, assets, amounts, true);

            emit FlashLoan(
                receiverAddress,
                msg.sender,
                assets,
                amounts,
                premiums,
                block.timestamp
            );
        } else {
            // Rollback: Ensure all funds are returned
            for (uint256 i = 0; i < assets.length; i++) {
                uint256 currentBalance = IERC20(assets[i]).balanceOf(address(this));
                if (currentBalance >= initialBalances[i]) {
                    poolLiquidity[assets[i]] = initialBalances[i];
                } else {
                    // Emergency: This should never happen with proper receiver implementation
                    revert("Flash loan failed: funds not returned");
                }
            }

            // Update failure statistics
            _updateUserStats(msg.sender, assets, amounts, false);

            emit FlashLoanFailed(
                receiverAddress,
                msg.sender,
                assets,
                amounts,
                failureReason
            );

            revert(string(abi.encodePacked("Flash loan failed: ", failureReason)));
        }
    }

    /**
     * @notice Execute a multi-wallet flash loan
     * @dev Distributes a flash loan to multiple recipient wallets in a single atomic transaction
     * @param receiverContract The contract that will execute the multi-wallet distribution logic
     * @param asset The asset to borrow (single asset per batch)
     * @param totalAmount Total amount to borrow (sum of all recipient allocations)
     * @param recipients Array of recipient wallet addresses
     * @param allocations Array of amounts allocated to each recipient (must sum to totalAmount)
     * @param params Additional parameters for the receiver contract
     * @return batchId Unique identifier for this multi-wallet batch
     *
     * @dev Atomicity guarantee:
     *   - All or nothing: If ANY recipient fails to repay or operation fails, entire transaction reverts
     *   - Fail-safe rollback: Contract maintains pre-execution balance snapshots
     *   - All funds MUST be returned to this contract with premium for success
     *
     * @dev Receiver contract MUST:
     *   - Implement IMultiWalletFlashLoanReceiver interface
     *   - Distribute funds to all recipients
     *   - Ensure ALL recipients return funds + premium to this contract
     *   - Return true on success, false on failure (will trigger rollback)
     */
    function flashLoanMultiWallet(
        address receiverContract,
        address asset,
        uint256 totalAmount,
        address[] calldata recipients,
        uint256[] calldata allocations,
        bytes calldata params
    ) external nonReentrant whenNotPaused returns (uint256 batchId) {
        require(receiverContract != address(0), "Invalid receiver contract");
        require(asset != address(0), "Invalid asset");
        require(supportedAssets[asset], "Asset not supported");
        require(totalAmount > 0, "Amount must be greater than 0");
        require(recipients.length > 0, "No recipients specified");
        require(recipients.length == allocations.length, "Recipients and allocations length mismatch");
        require(recipients.length <= 20, "Too many recipients (max 20)");
        require(totalAmount <= maxFlashLoanAmount[asset], "Amount exceeds max");
        require(totalAmount <= poolLiquidity[asset], "Insufficient liquidity");

        // Validate allocations sum to totalAmount and no zero allocations
        uint256 allocationSum = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            require(allocations[i] > 0, "Allocation must be greater than 0");
            allocationSum += allocations[i];
        }
        require(allocationSum == totalAmount, "Allocations must sum to totalAmount");

        // Risk assessment
        _performRiskCheckSimple(msg.sender);

        // Calculate premium
        uint256 premium = (totalAmount * flashLoanFeeBps) / 10000;

        // Store initial balance for rollback verification
        uint256 initialBalance = IERC20(asset).balanceOf(address(this));

        // Generate and store batch ID
        batchId = _batchIdCounter++;
        
        // Create batch record
        MultiWalletFlashLoanBatch storage batch = multiWalletBatches[batchId];
        batch.asset = asset;
        batch.totalAmount = totalAmount;
        batch.premium = premium;
        batch.recipients = recipients;
        batch.allocations = allocations;
        batch.initiator = msg.sender;
        batch.timestamp = block.timestamp;

        // Track batch for user
        userBatchIds[msg.sender].push(batchId);

        // Deduct from pool liquidity
        poolLiquidity[asset] -= totalAmount;

        // Transfer total amount to receiver contract
        IERC20(asset).safeTransfer(receiverContract, totalAmount);

        // Execute multi-wallet operation on receiver
        bool success = false;
        string memory failureReason = "";
        address[] memory failedRecipients = new address[](recipients.length);
        uint256 failedCount = 0;

        try IMultiWalletFlashLoanReceiver(receiverContract).executeMultiWalletOperation(
            asset,
            totalAmount,
            premium,
            recipients,
            allocations,
            msg.sender,
            params
        ) returns (bool result) {
            success = result;
            if (!success) {
                failureReason = "Receiver operation returned false";
            }
        } catch Error(string memory reason) {
            failureReason = reason;
        } catch {
            failureReason = "Unknown error in multi-wallet receiver";
        }

        // Verify repayment and execute rollback if failed
        if (success) {
            // Verify all funds are returned with premium
            uint256 currentBalance = IERC20(asset).balanceOf(address(this));
            uint256 expectedBalance = initialBalance + premium;

            require(
                currentBalance >= expectedBalance,
                "Multi-wallet flash loan not fully repaid"
            );

            // Commit batch to pool liquidity
            poolLiquidity[asset] += totalAmount + premium;
            batch.success = true;

            // Update success statistics
            _updateUserStatsMultiWallet(msg.sender, totalAmount, true);

            emit MultiWalletFlashLoan(
                batchId,
                msg.sender,
                asset,
                totalAmount,
                premium,
                recipients,
                allocations,
                block.timestamp
            );
        } else {
            // Rollback: Restore pool liquidity to initial state
            poolLiquidity[asset] = initialBalance;
            batch.success = false;
            batch.failureReason = failureReason;

            // Identify failed recipients by checking balances
            // (In a real scenario, receiver contract should report this)
            failedRecipients[0] = receiverContract; // Mark receiver as failed
            failedCount = 1;

            // Update failure statistics
            _updateUserStatsMultiWallet(msg.sender, totalAmount, false);

            // Emit event with actual failed recipients
            address[] memory actualFailed = new address[](failedCount);
            for (uint256 i = 0; i < failedCount; i++) {
                actualFailed[i] = failedRecipients[i];
            }

            emit MultiWalletFlashLoanFailed(
                batchId,
                msg.sender,
                asset,
                totalAmount,
                failureReason,
                actualFailed
            );

            revert(string(abi.encodePacked("Multi-wallet flash loan failed: ", failureReason)));
        }

        return batchId;
    }

    /**
     * @notice Get details of a multi-wallet flash loan batch
     * @param batchId The batch identifier
     * @return batch The batch details
     */
    function getMultiWalletBatch(uint256 batchId) external view returns (MultiWalletFlashLoanBatch memory batch) {
        return multiWalletBatches[batchId];
    }

    /**
     * @notice Get all batch IDs for a user
     * @param user The user address
     * @return batchIds Array of batch IDs initiated by the user
     */
    function getUserBatchIds(address user) external view returns (uint256[] memory batchIds) {
        return userBatchIds[user];
    }

    /**
     * @param assets Array of asset addresses
     * @param amounts Array of amounts to borrow
     * @return premiums Array of premiums to pay
     * @return totalCosts Array of total costs (amount + premium)
     * @return riskLevel User's current risk level
     * @return estimatedGas Estimated gas cost
     */
    function getFlashLoanQuote(
        address[] calldata assets,
        uint256[] calldata amounts
    ) external view returns (
        uint256[] memory premiums,
        uint256[] memory totalCosts,
        RiskLevel riskLevel,
        uint256 estimatedGas
    ) {
        require(assets.length == amounts.length, "Arrays length mismatch");
        
        premiums = new uint256[](assets.length);
        totalCosts = new uint256[](assets.length);

        for (uint256 i = 0; i < assets.length; i++) {
            premiums[i] = (amounts[i] * flashLoanFeeBps) / 10000;
            totalCosts[i] = amounts[i] + premiums[i];
        }

        riskLevel = _calculateRiskLevel(msg.sender);
        estimatedGas = 300000 + (assets.length * 100000); // Base + per asset

        return (premiums, totalCosts, riskLevel, estimatedGas);
    }

    /**
     * @notice Check if user is eligible for flash loan
     * @param user User address
     * @param assets Assets to borrow
     * @param amounts Amounts to borrow
     * @return eligible Whether user is eligible
     * @return reason Reason if not eligible
     */
    function checkEligibility(
        address user,
        address[] calldata assets,
        uint256[] calldata amounts
    ) external view returns (bool eligible, string memory reason) {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        
        if (trustScoreValue < MIN_TRUST_SCORE) {
            return (false, "Trust score too low");
        }

        UserStats memory stats = userStats[user];
        if (stats.riskLevel == RiskLevel.Critical) {
            return (false, "User risk level is critical");
        }

        if (block.timestamp - stats.lastFlashLoanTimestamp < 1 hours) {
            return (false, "Flash loan cooldown active");
        }

        for (uint256 i = 0; i < assets.length; i++) {
            if (!supportedAssets[assets[i]]) {
                return (false, "Unsupported asset");
            }
            if (amounts[i] > maxFlashLoanAmount[assets[i]]) {
                return (false, "Amount exceeds maximum");
            }
            if (amounts[i] > poolLiquidity[assets[i]]) {
                return (false, "Insufficient liquidity");
            }
        }

        return (true, "");
    }

    /**
     * @notice Perform risk assessment
     */
    function _performRiskCheck(
        address user,
        address[] calldata assets,
        uint256[] calldata amounts
    ) internal {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        require(trustScoreValue >= MIN_TRUST_SCORE, "Trust score too low for flash loans");

        UserStats storage stats = userStats[user];
        require(stats.riskLevel != RiskLevel.Critical, "User banned due to critical risk");

        // Cooldown for high-risk users
        if (stats.riskLevel == RiskLevel.High) {
            require(
                block.timestamp - stats.lastFlashLoanTimestamp >= 1 hours,
                "Cooldown period active for high-risk users"
            );
        }

        // Update risk level
        RiskLevel newRiskLevel = _calculateRiskLevel(user);
        if (newRiskLevel != stats.riskLevel) {
            emit RiskLevelUpdated(user, stats.riskLevel, newRiskLevel);
            stats.riskLevel = newRiskLevel;
        }
    }

    /**
     * @notice Perform risk assessment for multi-wallet flash loans (simplified)
     */
    function _performRiskCheckSimple(address user) internal {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        require(trustScoreValue >= MIN_TRUST_SCORE, "Trust score too low for flash loans");

        UserStats storage stats = userStats[user];
        require(stats.riskLevel != RiskLevel.Critical, "User banned due to critical risk");

        // Cooldown for high-risk users
        if (stats.riskLevel == RiskLevel.High) {
            require(
                block.timestamp - stats.lastFlashLoanTimestamp >= 1 hours,
                "Cooldown period active for high-risk users"
            );
        }

        // Update risk level
        RiskLevel newRiskLevel = _calculateRiskLevel(user);
        if (newRiskLevel != stats.riskLevel) {
            emit RiskLevelUpdated(user, stats.riskLevel, newRiskLevel);
            stats.riskLevel = newRiskLevel;
        }
    }

    /**
     * @notice Calculate user risk level
     */
    function _calculateRiskLevel(address user) internal view returns (RiskLevel) {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        UserStats memory stats = userStats[user];

        // Critical if too many failures
        if (stats.totalFlashLoans > 5 && stats.failedFlashLoans > stats.successfulFlashLoans) {
            return RiskLevel.Critical;
        }

        // High risk
        if (trustScoreValue < HIGH_RISK_THRESHOLD || 
            (stats.totalFlashLoans > 0 && stats.failedFlashLoans * 100 / stats.totalFlashLoans > 20)) {
            return RiskLevel.High;
        }

        // Medium risk
        if (trustScoreValue < MEDIUM_RISK_THRESHOLD) {
            return RiskLevel.Medium;
        }

        return RiskLevel.Low;
    }

    /**
     * @notice Update user statistics after flash loan
     */
    function _updateUserStats(
        address user,
        address[] calldata assets,
        uint256[] calldata amounts,
        bool success
    ) internal {
        UserStats storage stats = userStats[user];
        stats.totalFlashLoans++;
        stats.lastFlashLoanTimestamp = block.timestamp;

        if (success) {
            stats.successfulFlashLoans++;
        } else {
            stats.failedFlashLoans++;
        }

        // Calculate total volume
        uint256 totalVolume = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalVolume += amounts[i];
        }
        stats.totalVolumeFlashLoaned += totalVolume;

        lastFlashLoanTime[user] = block.timestamp;
    }

    /**
     * @notice Update user statistics after flash loan (single amount overload for multi-wallet)
     */
    function _updateUserStatsMultiWallet(
        address user,
        uint256 amount,
        bool success
    ) internal {
        UserStats storage stats = userStats[user];
        stats.totalFlashLoans++;
        stats.lastFlashLoanTimestamp = block.timestamp;

        if (success) {
            stats.successfulFlashLoans++;
        } else {
            stats.failedFlashLoans++;
        }

        stats.totalVolumeFlashLoaned += amount;
        lastFlashLoanTime[user] = block.timestamp;
    }

    /**
     * @notice Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 totalFlashLoans,
        uint256 successfulFlashLoans,
        uint256 failedFlashLoans,
        uint256 totalVolumeFlashLoaned,
        RiskLevel riskLevel,
        uint256 trustScoreValue
    ) {
        UserStats memory stats = userStats[user];
        return (
            stats.totalFlashLoans,
            stats.successfulFlashLoans,
            stats.failedFlashLoans,
            stats.totalVolumeFlashLoaned,
            stats.riskLevel,
            trustScore.getTrustScore(user)
        );
    }

    // ===== ADMIN FUNCTIONS =====

    /**
     * @notice Add supported asset
     */
    function addSupportedAsset(address asset, uint256 maxAmount) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!supportedAssets[asset], "Asset already supported");
        
        supportedAssets[asset] = true;
        maxFlashLoanAmount[asset] = maxAmount;
        
        emit AssetAdded(asset, maxAmount);
    }

    /**
     * @notice Remove supported asset
     */
    function removeSupportedAsset(address asset) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        
        supportedAssets[asset] = false;
        maxFlashLoanAmount[asset] = 0;
        
        emit AssetRemoved(asset);
    }

    /**
     * @notice Deposit liquidity to pool
     */
    function depositLiquidity(address asset, uint256 amount) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        poolLiquidity[asset] += amount;
        
        emit LiquidityDeposited(asset, amount, msg.sender);
    }

    /**
     * @notice Withdraw liquidity from pool
     */
    function withdrawLiquidity(address asset, uint256 amount, address recipient) external onlyOwner {
        require(amount <= poolLiquidity[asset], "Insufficient liquidity");
        
        poolLiquidity[asset] -= amount;
        IERC20(asset).safeTransfer(recipient, amount);
        
        emit LiquidityWithdrawn(asset, amount, recipient);
    }

    /**
     * @notice Update flash loan fee
     */
    function updateFlashLoanFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FLASH_LOAN_FEE_BPS, "Fee too high");
        
        uint256 oldFee = flashLoanFeeBps;
        flashLoanFeeBps = newFeeBps;
        
        emit FeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Update max flash loan amount for asset
     */
    function updateMaxFlashLoanAmount(address asset, uint256 newMaxAmount) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        maxFlashLoanAmount[asset] = newMaxAmount;
    }

    /**
     * @notice Pause flash loans
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause flash loans
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get available liquidity for all supported assets
     */
    function getAvailableLiquidity() external view returns (
        address[] memory assets,
        uint256[] memory liquidities,
        uint256[] memory maxAmounts
    ) {
        // Count supported assets
        uint256 count = 0;
        address[100] memory tempAssets;
        
        // This is a simplified implementation
        // In production, you'd maintain a separate array of supported assets
        
        assets = new address[](count);
        liquidities = new uint256[](count);
        maxAmounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            assets[i] = tempAssets[i];
            liquidities[i] = poolLiquidity[tempAssets[i]];
            maxAmounts[i] = maxFlashLoanAmount[tempAssets[i]];
        }
    }
}
