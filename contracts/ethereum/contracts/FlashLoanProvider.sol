
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TrustScore.sol";


interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}


interface IMultiWalletFlashLoanReceiver {
    
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


contract FlashLoanProvider is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    TrustScore public trustScore;

    
    uint256 public flashLoanFeeBps = 9;
    uint256 public constant MAX_FLASH_LOAN_FEE_BPS = 100; 
    uint256 public constant MIN_TRUST_SCORE = 300; 

    
    uint256 public constant HIGH_RISK_THRESHOLD = 500;
    uint256 public constant MEDIUM_RISK_THRESHOLD = 700;
    
    
    uint256 private _batchIdCounter = 0;
    mapping(uint256 => MultiWalletFlashLoanBatch) public multiWalletBatches;
    mapping(address => uint256[]) public userBatchIds; 
    
    
    mapping(address => uint256) public poolLiquidity;
    mapping(address => uint256) public maxFlashLoanAmount;
    mapping(address => bool) public supportedAssets;
    
    
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

    
    struct MultiWalletFlashLoanBatch {
        address asset;
        uint256 totalAmount;
        uint256 premium;
        address[] recipients;
        uint256[] allocations; 
        address initiator;
        uint256 timestamp;
        bool success;
        string failureReason;
    }

    
    struct RecipientExecutionStatus {
        address recipient;
        uint256 allocation;
        bool received;
        bool repaid;
        uint256 repaidAmount;
    }

    
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

        
        _performRiskCheck(msg.sender, assets, amounts);

        uint256[] memory premiums = new uint256[](assets.length);
        uint256[] memory amountsWithPremiums = new uint256[](assets.length);

        
        for (uint256 i = 0; i < assets.length; i++) {
            require(supportedAssets[assets[i]], "Asset not supported");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(amounts[i] <= maxFlashLoanAmount[assets[i]], "Amount exceeds max");
            require(amounts[i] <= poolLiquidity[assets[i]], "Insufficient liquidity");

            premiums[i] = (amounts[i] * flashLoanFeeBps) / 10000;
            amountsWithPremiums[i] = amounts[i] + premiums[i];
        }

        
        uint256[] memory initialBalances = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            initialBalances[i] = IERC20(assets[i]).balanceOf(address(this));
        }

        
        for (uint256 i = 0; i < assets.length; i++) {
            poolLiquidity[assets[i]] -= amounts[i];
            IERC20(assets[i]).safeTransfer(receiverAddress, amounts[i]);
        }

        
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

        
        if (success) {
            for (uint256 i = 0; i < assets.length; i++) {
                uint256 currentBalance = IERC20(assets[i]).balanceOf(address(this));
                require(
                    currentBalance >= initialBalances[i] + premiums[i],
                    "Flash loan not repaid"
                );
                poolLiquidity[assets[i]] += amounts[i] + premiums[i];
            }

            
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
            
            for (uint256 i = 0; i < assets.length; i++) {
                uint256 currentBalance = IERC20(assets[i]).balanceOf(address(this));
                if (currentBalance >= initialBalances[i]) {
                    poolLiquidity[assets[i]] = initialBalances[i];
                } else {
                    
                    revert("Flash loan failed: funds not returned");
                }
            }

            
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

        
        uint256 allocationSum = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            require(allocations[i] > 0, "Allocation must be greater than 0");
            allocationSum += allocations[i];
        }
        require(allocationSum == totalAmount, "Allocations must sum to totalAmount");

        
        _performRiskCheckSimple(msg.sender);

        
        uint256 premium = (totalAmount * flashLoanFeeBps) / 10000;

        
        uint256 initialBalance = IERC20(asset).balanceOf(address(this));

        
        batchId = _batchIdCounter++;
        
        
        MultiWalletFlashLoanBatch storage batch = multiWalletBatches[batchId];
        batch.asset = asset;
        batch.totalAmount = totalAmount;
        batch.premium = premium;
        batch.recipients = recipients;
        batch.allocations = allocations;
        batch.initiator = msg.sender;
        batch.timestamp = block.timestamp;

        
        userBatchIds[msg.sender].push(batchId);

        
        poolLiquidity[asset] -= totalAmount;

        
        IERC20(asset).safeTransfer(receiverContract, totalAmount);

        
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

        
        if (success) {
            
            uint256 currentBalance = IERC20(asset).balanceOf(address(this));
            uint256 expectedBalance = initialBalance + premium;

            require(
                currentBalance >= expectedBalance,
                "Multi-wallet flash loan not fully repaid"
            );

            
            poolLiquidity[asset] += totalAmount + premium;
            batch.success = true;

            
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
            
            poolLiquidity[asset] = initialBalance;
            batch.success = false;
            batch.failureReason = failureReason;

            
            
            failedRecipients[0] = receiverContract; 
            failedCount = 1;

            
            _updateUserStatsMultiWallet(msg.sender, totalAmount, false);

            
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

    
    function getMultiWalletBatch(uint256 batchId) external view returns (MultiWalletFlashLoanBatch memory batch) {
        return multiWalletBatches[batchId];
    }

    
    function getUserBatchIds(address user) external view returns (uint256[] memory batchIds) {
        return userBatchIds[user];
    }

    
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
        estimatedGas = 300000 + (assets.length * 100000); 

        return (premiums, totalCosts, riskLevel, estimatedGas);
    }

    
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

    
    function _performRiskCheck(
        address user,
        address[] calldata assets,
        uint256[] calldata amounts
    ) internal {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        require(trustScoreValue >= MIN_TRUST_SCORE, "Trust score too low for flash loans");

        UserStats storage stats = userStats[user];
        require(stats.riskLevel != RiskLevel.Critical, "User banned due to critical risk");

        
        if (stats.riskLevel == RiskLevel.High) {
            require(
                block.timestamp - stats.lastFlashLoanTimestamp >= 1 hours,
                "Cooldown period active for high-risk users"
            );
        }

        
        RiskLevel newRiskLevel = _calculateRiskLevel(user);
        if (newRiskLevel != stats.riskLevel) {
            emit RiskLevelUpdated(user, stats.riskLevel, newRiskLevel);
            stats.riskLevel = newRiskLevel;
        }
    }

    
    function _performRiskCheckSimple(address user) internal {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        require(trustScoreValue >= MIN_TRUST_SCORE, "Trust score too low for flash loans");

        UserStats storage stats = userStats[user];
        require(stats.riskLevel != RiskLevel.Critical, "User banned due to critical risk");

        
        if (stats.riskLevel == RiskLevel.High) {
            require(
                block.timestamp - stats.lastFlashLoanTimestamp >= 1 hours,
                "Cooldown period active for high-risk users"
            );
        }

        
        RiskLevel newRiskLevel = _calculateRiskLevel(user);
        if (newRiskLevel != stats.riskLevel) {
            emit RiskLevelUpdated(user, stats.riskLevel, newRiskLevel);
            stats.riskLevel = newRiskLevel;
        }
    }

    
    function _calculateRiskLevel(address user) internal view returns (RiskLevel) {
        uint256 trustScoreValue = trustScore.getTrustScore(user);
        UserStats memory stats = userStats[user];

        
        if (stats.totalFlashLoans > 5 && stats.failedFlashLoans > stats.successfulFlashLoans) {
            return RiskLevel.Critical;
        }

        
        if (trustScoreValue < HIGH_RISK_THRESHOLD || 
            (stats.totalFlashLoans > 0 && stats.failedFlashLoans * 100 / stats.totalFlashLoans > 20)) {
            return RiskLevel.High;
        }

        
        if (trustScoreValue < MEDIUM_RISK_THRESHOLD) {
            return RiskLevel.Medium;
        }

        return RiskLevel.Low;
    }

    
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

        
        uint256 totalVolume = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalVolume += amounts[i];
        }
        stats.totalVolumeFlashLoaned += totalVolume;

        lastFlashLoanTime[user] = block.timestamp;
    }

    
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

    

    
    function addSupportedAsset(address asset, uint256 maxAmount) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!supportedAssets[asset], "Asset already supported");
        
        supportedAssets[asset] = true;
        maxFlashLoanAmount[asset] = maxAmount;
        
        emit AssetAdded(asset, maxAmount);
    }

    
    function removeSupportedAsset(address asset) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        
        supportedAssets[asset] = false;
        maxFlashLoanAmount[asset] = 0;
        
        emit AssetRemoved(asset);
    }

    
    function depositLiquidity(address asset, uint256 amount) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        poolLiquidity[asset] += amount;
        
        emit LiquidityDeposited(asset, amount, msg.sender);
    }

    
    function withdrawLiquidity(address asset, uint256 amount, address recipient) external onlyOwner {
        require(amount <= poolLiquidity[asset], "Insufficient liquidity");
        
        poolLiquidity[asset] -= amount;
        IERC20(asset).safeTransfer(recipient, amount);
        
        emit LiquidityWithdrawn(asset, amount, recipient);
    }

    
    function updateFlashLoanFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FLASH_LOAN_FEE_BPS, "Fee too high");
        
        uint256 oldFee = flashLoanFeeBps;
        flashLoanFeeBps = newFeeBps;
        
        emit FeeUpdated(oldFee, newFeeBps);
    }

    
    function updateMaxFlashLoanAmount(address asset, uint256 newMaxAmount) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        maxFlashLoanAmount[asset] = newMaxAmount;
    }

    
    function pause() external onlyOwner {
        _pause();
    }

    
    function unpause() external onlyOwner {
        _unpause();
    }

    
    function getAvailableLiquidity() external view returns (
        address[] memory assets,
        uint256[] memory liquidities,
        uint256[] memory maxAmounts
    ) {
        
        uint256 count = 0;
        address[100] memory tempAssets;
        
        
        
        
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
