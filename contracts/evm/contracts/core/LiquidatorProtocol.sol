// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LiquidatorProtocol
 * @dev Advanced liquidation system with Dutch auction and competitive bidding
 */
contract LiquidatorProtocol is Ownable, ReentrancyGuard, Pausable {
    
    // ============ Enums ============
    enum LiquidatorStatus {
        INACTIVE,
        ACTIVE,
        SUSPENDED,
        DEACTIVATED
    }

    enum AuctionStatus {
        PENDING,
        ACTIVE,
        SOLD,
        FAILED,
        CANCELLED
    }

    enum BidStatus {
        PENDING,
        ACTIVE,
        ACCEPTED,
        REJECTED,
        EXECUTED
    }

    enum LiquidationEventType {
        LIQUIDATOR_REGISTERED,
        LIQUIDATOR_SUSPENDED,
        AUCTION_CREATED,
        AUCTION_ACTIVATED,
        AUCTION_COMPLETED,
        BID_PLACED,
        BID_UPDATED,
        LIQUIDATION_EXECUTED,
        LIQUIDATION_FAILED
    }

    // ============ Structs ============
    
    struct Liquidator {
        address wallet;
        LiquidatorStatus status;
        uint256 bondAmount;
        uint256 successfulLiquidations;
        uint256 totalLiquidations;
        uint256 failureCount;
        uint256 suspensionScore;
        uint256 totalVolumeProcessed;
        uint256 registeredAt;
        string tier;
    }

    struct LiquidationAuction {
        uint256 auctionId;
        uint256 loanId;
        address collateralToken;
        uint256 collateralAmount;
        uint256 startPrice;
        uint256 minimumPrice;
        uint256 currentPrice;
        uint256 priceDecayPercentPerHour;
        uint256 platformFeePercentage;
        uint256 auctionStartTime;
        uint256 auctionEndTime;
        AuctionStatus status;
        address winnerAddress;
        uint256 winningBidId;
        uint256 executedAt;
        bytes32 transactionHash;
    }

    struct LiquidatorBid {
        uint256 bidId;
        uint256 auctionId;
        address liquidatorAddress;
        uint256 bidAmount;
        uint256 bidRound;
        BidStatus status;
        uint256 createdAt;
        uint256 executedAt;
        bytes32 transactionHash;
    }

    struct LiquidationEventLog {
        uint256 eventId;
        uint256 loanId;
        uint256 auctionId;
        address liquidatorAddress;
        LiquidationEventType eventType;
        uint256 amount;
        bytes32 transactionHash;
        uint256 timestamp;
    }

    // ============ Constants ============
    
    uint256 private constant AUCTION_DURATION_HOURS = 24;
    uint256 private constant MIN_LIQUIDATOR_BOND = 10 ether; // 10 tokens minimum
    uint256 private constant MAX_SUSPENSION_SCORE = 100;
    uint256 private constant SUSPENSION_THRESHOLD = 70;
    uint256 private constant MAX_FAILURES_BEFORE_SUSPENSION = 3;
    uint256 private constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5% (in basis points)

    // ============ State Variables ============
    
    mapping(address => Liquidator) public liquidators;
    mapping(uint256 => LiquidationAuction) public auctions;
    mapping(uint256 => LiquidatorBid) public bids;
    mapping(uint256 => LiquidationEventLog) public events;
    mapping(uint256 => uint256[]) public auctionBids;
    mapping(address => uint256[]) public liquidatorAuctions;

    uint256 private _liquidatorCount;
    uint256 private _auctionIdCounter;
    uint256 private _bidIdCounter;
    uint256 private _eventIdCounter;

    address public platformTreasury;
    IERC20 public stablecoin;

    // Auction configuration
    // Stored as basis points per hour (e.g., 200 = 2% per hour)
    uint256 public defaultPriceDecayBpsPerHour = 200;

    // ============ Events ============
    
    event LiquidatorRegistered(
        address indexed liquidator,
        uint256 bondAmount,
        uint256 timestamp
    );

    event LiquidatorSuspended(
        address indexed liquidator,
        uint256 suspensionScore,
        string reason,
        uint256 timestamp
    );

    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed loanId,
        uint256 startPrice,
        uint256 minimumPrice,
        uint256 auctionEndTime,
        uint256 timestamp
    );

    event AuctionActivated(
        uint256 indexed auctionId,
        uint256 auctionStartTime,
        uint256 auctionEndTime,
        uint256 timestamp
    );

    event BidPlaced(
        uint256 indexed bidId,
        uint256 indexed auctionId,
        address indexed liquidator,
        uint256 bidAmount,
        uint256 timestamp
    );

    event LiquidationExecuted(
        uint256 indexed auctionId,
        uint256 indexed bidId,
        address indexed winner,
        uint256 finalPrice,
        uint256 timestamp
    );

    event LiquidationFailed(
        uint256 indexed auctionId,
        string reason,
        uint256 timestamp
    );

    // ============ Modifiers ============
    
    modifier onlyActiveLiquidator() {
        require(
            liquidators[msg.sender].status == LiquidatorStatus.ACTIVE,
            "Not an active liquidator"
        );
        _;
    }

    modifier liquidatorExists(address liquidator) {
        require(
            liquidators[liquidator].wallet != address(0),
            "Liquidator not found"
        );
        _;
    }

    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].auctionId != 0, "Auction not found");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _stablecoin, address _treasury) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        require(_treasury != address(0), "Invalid treasury address");
        
        stablecoin = IERC20(_stablecoin);
        platformTreasury = _treasury;
    }

    function setDefaultPriceDecayBpsPerHour(uint256 bpsPerHour) external onlyOwner {
        // sanity bounds: (0, 5000] => at most 50% decay per hour
        require(bpsPerHour > 0 && bpsPerHour <= 5000, "Invalid decay");
        defaultPriceDecayBpsPerHour = bpsPerHour;
    }

    // ============ Liquidator Management ============
    
    /**
     * Register a new liquidator
     */
    function registerLiquidator(uint256 bondAmount) external nonReentrant {
        require(
            liquidators[msg.sender].wallet == address(0),
            "Liquidator already registered"
        );
        require(bondAmount >= MIN_LIQUIDATOR_BOND, "Bond amount too low");

        // Transfer bond from liquidator
        require(
            stablecoin.transferFrom(msg.sender, address(this), bondAmount),
            "Bond transfer failed"
        );

        Liquidator memory liquidator = Liquidator({
            wallet: msg.sender,
            status: LiquidatorStatus.ACTIVE,
            bondAmount: bondAmount,
            successfulLiquidations: 0,
            totalLiquidations: 0,
            failureCount: 0,
            suspensionScore: 0,
            totalVolumeProcessed: 0,
            registeredAt: block.timestamp,
            tier: "BRONZE"
        });

        liquidators[msg.sender] = liquidator;
        _liquidatorCount++;

        emit LiquidatorRegistered(msg.sender, bondAmount, block.timestamp);
    }

    /**
     * Deactivate a liquidator (enables bond withdrawal)
     */
    function deactivateLiquidator(address liquidator)
        external
        onlyOwner
        liquidatorExists(liquidator)
        nonReentrant
    {
        Liquidator storage liq = liquidators[liquidator];
        liq.status = LiquidatorStatus.DEACTIVATED;
    }

    /**
     * Suspend a liquidator for poor performance
     */
    function suspendLiquidator(address liquidator, string memory reason)
        external
        onlyOwner
        liquidatorExists(liquidator)
        nonReentrant
    {
        Liquidator storage liq = liquidators[liquidator];
        liq.status = LiquidatorStatus.SUSPENDED;

        emit LiquidatorSuspended(
            liquidator,
            liq.suspensionScore,
            reason,
            block.timestamp
        );
    }

    /**
     * Reinstate a suspended liquidator
     */
    function reinstateLiquidator(address liquidator)
        external
        onlyOwner
        liquidatorExists(liquidator)
    {
        Liquidator storage liq = liquidators[liquidator];
        require(liq.status == LiquidatorStatus.SUSPENDED, "Not suspended");
        
        liq.status = LiquidatorStatus.ACTIVE;
        liq.suspensionScore = 0;
        liq.failureCount = 0;
    }

    /**
     * Get liquidator statistics
     */
    function getLiquidatorStats(address liquidator)
        external
        view
        liquidatorExists(liquidator)
        returns (Liquidator memory)
    {
        return liquidators[liquidator];
    }

    // ============ Auction Management ============
    
    /**
     * Create a new liquidation auction
     */
    function createAuction(
        uint256 loanId,
        address collateralToken,
        uint256 collateralAmount,
        uint256 startPrice,
        uint256 minimumPrice,
        uint256 platformFeePercentage
    ) external onlyOwner nonReentrant returns (uint256) {
        require(startPrice > minimumPrice, "Invalid price range");
        require(minimumPrice > 0, "Minimum price must be > 0");
        require(collateralAmount > 0, "Collateral amount must be > 0");
        require(collateralToken != address(0), "Invalid collateral token");
        require(platformFeePercentage <= 10000, "Invalid platform fee");
        require(defaultPriceDecayBpsPerHour > 0 && defaultPriceDecayBpsPerHour <= 5000, "Invalid decay");

        uint256 auctionId = ++_auctionIdCounter;

        LiquidationAuction memory auction = LiquidationAuction({
            auctionId: auctionId,
            loanId: loanId,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            startPrice: startPrice,
            minimumPrice: minimumPrice,
            currentPrice: startPrice,
            priceDecayPercentPerHour: defaultPriceDecayBpsPerHour,
            platformFeePercentage: platformFeePercentage,
            auctionStartTime: 0,
            auctionEndTime: 0,
            status: AuctionStatus.PENDING,
            winnerAddress: address(0),
            winningBidId: 0,
            executedAt: 0,
            transactionHash: bytes32(0)
        });

        auctions[auctionId] = auction;

        emit AuctionCreated(
            auctionId,
            loanId,
            startPrice,
            minimumPrice,
            block.timestamp + (AUCTION_DURATION_HOURS * 1 hours),
            block.timestamp
        );

        return auctionId;
    }

    /**
     * Calculate current price with Dutch auction decay
     */
    function calculateCurrentPrice(uint256 auctionId)
        public
        view
        auctionExists(auctionId)
        returns (uint256)
    {
        LiquidationAuction memory auction = auctions[auctionId];

        if (auction.status != AuctionStatus.ACTIVE) {
            return auction.startPrice;
        }

        uint256 hoursElapsed = (block.timestamp - auction.auctionStartTime) / 1 hours;
        
        // Prevent underflow
        if (hoursElapsed >= AUCTION_DURATION_HOURS) {
            return auction.minimumPrice;
        }

        // Calculate decay (bps per hour): startPrice * (1 - bps/10000)^hoursElapsed
        // e.g. 200 bps => 2% per hour
        require(auction.priceDecayPercentPerHour > 0 && auction.priceDecayPercentPerHour <= 9900, "Invalid decay");
        uint256 decayFactorBps = 10000 - auction.priceDecayPercentPerHour;
        uint256 decayedPrice = auction.startPrice;

        for (uint256 i = 0; i < hoursElapsed; i++) {
            decayedPrice = (decayedPrice * decayFactorBps) / 10000;
        }

        // Price should not go below minimum
        if (decayedPrice < auction.minimumPrice) {
            return auction.minimumPrice;
        }

        return decayedPrice;
    }

    /**
     * Activate an auction to start receiving bids
     */
    function activateAuction(uint256 auctionId)
        external
        onlyOwner
        auctionExists(auctionId)
        nonReentrant
    {
        LiquidationAuction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.PENDING, "Auction not in PENDING status");

        auction.status = AuctionStatus.ACTIVE;
        auction.auctionStartTime = block.timestamp;
        auction.auctionEndTime = block.timestamp + (AUCTION_DURATION_HOURS * 1 hours);
        auction.currentPrice = auction.startPrice;

        emit AuctionActivated(
            auctionId,
            auction.auctionStartTime,
            auction.auctionEndTime,
            block.timestamp
        );
    }

    /**
     * Place a bid on an active auction
     */
    function placeBid(
        uint256 auctionId,
        uint256 bidAmount
    ) external onlyActiveLiquidator auctionExists(auctionId) nonReentrant returns (uint256) {
        LiquidationAuction storage auction = auctions[auctionId];

        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(block.timestamp <= auction.auctionEndTime, "Auction has ended");
        require(bidAmount > 0, "Bid amount must be > 0");

        uint256 currentPrice = calculateCurrentPrice(auctionId);
        require(
            bidAmount >= currentPrice,
            "Bid must be at least current price"
        );

        // Check for existing bid from this liquidator
        bool hasExistingBid = false;
        uint256 existingBidIdValue = 0;

        for (uint256 i = 0; i < auctionBids[auctionId].length; i++) {
            uint256 currentBidId = auctionBids[auctionId][i];
            if (bids[currentBidId].liquidatorAddress == msg.sender && 
                bids[currentBidId].status == BidStatus.ACTIVE) {
                hasExistingBid = true;
                existingBidIdValue = currentBidId;
                break;
            }
        }

        if (hasExistingBid) {
            // Update existing bid if higher
            LiquidatorBid storage existingBid = bids[existingBidIdValue];
            require(
                bidAmount > existingBid.bidAmount,
                "New bid must be higher than existing bid"
            );
            existingBid.bidAmount = bidAmount;
            existingBid.bidRound++;

            return existingBidIdValue;
        }

        // Create new bid
        uint256 newBidId = ++_bidIdCounter;
        
        LiquidatorBid memory bid = LiquidatorBid({
            bidId: newBidId,
            auctionId: auctionId,
            liquidatorAddress: msg.sender,
            bidAmount: bidAmount,
            bidRound: 1,
            status: BidStatus.ACTIVE,
            createdAt: block.timestamp,
            executedAt: 0,
            transactionHash: bytes32(0)
        });

        bids[newBidId] = bid;
        auctionBids[auctionId].push(newBidId);

        // Update current price if this is the highest bid
        if (bidAmount > auction.currentPrice) {
            auction.currentPrice = bidAmount;
        }

        emit BidPlaced(newBidId, auctionId, msg.sender, bidAmount, block.timestamp);

        return newBidId;
    }

    /**
     * Execute an auction after bidding period ends
     */
    function executeAuction(uint256 auctionId, bytes32 transactionHash)
        external
        onlyOwner
        auctionExists(auctionId)
        nonReentrant
    {
        LiquidationAuction storage auction = auctions[auctionId];

        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(
            block.timestamp >= auction.auctionEndTime,
            "Auction still ongoing"
        );

        // Find winning bid
        uint256 winningBidId = 0;
        uint256 winningBidAmount = 0;

        for (uint256 i = 0; i < auctionBids[auctionId].length; i++) {
            uint256 bidId = auctionBids[auctionId][i];
            LiquidatorBid storage bid = bids[bidId];
            
            if (bid.status == BidStatus.ACTIVE && bid.bidAmount >= winningBidAmount) {
                winningBidAmount = bid.bidAmount;
                winningBidId = bidId;
            }
        }

        if (winningBidId == 0) {
            // No bids received
            auction.status = AuctionStatus.FAILED;
            emit LiquidationFailed(auctionId, "No valid bids received", block.timestamp);
            return;
        }

        LiquidatorBid storage winningBid = bids[winningBidId];

        // Validate bid meets reserve price
        if (winningBidAmount < auction.minimumPrice) {
            auction.status = AuctionStatus.FAILED;
            emit LiquidationFailed(
                auctionId,
                "Winning bid below reserve price",
                block.timestamp
            );
            return;
        }

        // Execute auction
        auction.status = AuctionStatus.SOLD;
        auction.winningBidId = winningBidId;
        auction.winnerAddress = winningBid.liquidatorAddress;
        auction.executedAt = block.timestamp;
        auction.transactionHash = transactionHash;

        winningBid.status = BidStatus.EXECUTED;
        winningBid.executedAt = block.timestamp;
        winningBid.transactionHash = transactionHash;

        // Update liquidator stats
        Liquidator storage liquidator = liquidators[winningBid.liquidatorAddress];
        liquidator.successfulLiquidations++;
        liquidator.totalLiquidations++;
        liquidator.totalVolumeProcessed += winningBidAmount;
        liquidator.failureCount = 0;

        // Calculate platform fee
        uint256 platformFee = (winningBidAmount * auction.platformFeePercentage) / 10000;

        // Ensure winner can actually pay (avoid reverting the whole settlement)
        uint256 allowance = stablecoin.allowance(winningBid.liquidatorAddress, address(this));
        uint256 balance = stablecoin.balanceOf(winningBid.liquidatorAddress);
        if (allowance < winningBidAmount || balance < winningBidAmount) {
            auction.status = AuctionStatus.FAILED;
            emit LiquidationFailed(auctionId, "Winner cannot pay", block.timestamp);

            Liquidator storage liq = liquidators[winningBid.liquidatorAddress];
            liq.totalLiquidations++;
            liq.failureCount++;
            if (liq.failureCount >= MAX_FAILURES_BEFORE_SUSPENSION) {
                liq.suspensionScore = MAX_SUSPENSION_SCORE;
                liq.status = LiquidatorStatus.SUSPENDED;
            } else {
                liq.suspensionScore = (liq.failureCount * 100) / MAX_FAILURES_BEFORE_SUSPENSION;
            }

            return;
        }

        // Transfer winning bid amount
        require(
            stablecoin.transferFrom(winningBid.liquidatorAddress, address(this), winningBidAmount),
            "Bid transfer failed"
        );

        // Transfer platform fee to treasury
        if (platformFee > 0) {
            require(
                stablecoin.transfer(platformTreasury, platformFee),
                "Treasury transfer failed"
            );
        }

        emit LiquidationExecuted(
            auctionId,
            winningBidId,
            winningBid.liquidatorAddress,
            winningBidAmount,
            block.timestamp
        );
    }

    /**
     * Mark liquidation as failed and penalize liquidator
     */
    function markLiquidationFailed(
        uint256 auctionId,
        address liquidator,
        string memory reason
    ) external onlyOwner auctionExists(auctionId) liquidatorExists(liquidator) nonReentrant {
        LiquidationAuction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");

        auction.status = AuctionStatus.FAILED;

        Liquidator storage liq = liquidators[liquidator];
        liq.totalLiquidations++;
        liq.failureCount++;
        
        // Increase suspension score
        if (liq.failureCount >= MAX_FAILURES_BEFORE_SUSPENSION) {
            liq.suspensionScore = MAX_SUSPENSION_SCORE;
            liq.status = LiquidatorStatus.SUSPENDED;
        } else {
            liq.suspensionScore = (liq.failureCount * 100) / MAX_FAILURES_BEFORE_SUSPENSION;
        }

        emit LiquidationFailed(auctionId, reason, block.timestamp);
    }

    /**
     * Get auction bids
     */
    function getAuctionBids(uint256 auctionId)
        external
        view
        auctionExists(auctionId)
        returns (LiquidatorBid[] memory)
    {
        uint256[] memory bidIds = auctionBids[auctionId];
        LiquidatorBid[] memory bidList = new LiquidatorBid[](bidIds.length);

        for (uint256 i = 0; i < bidIds.length; i++) {
            bidList[i] = bids[bidIds[i]];
        }

        return bidList;
    }

    /**
     * Get active auctions
     */
    function getActiveAuctions() external view returns (LiquidationAuction[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= _auctionIdCounter; i++) {
            if (auctions[i].status == AuctionStatus.ACTIVE) {
                activeCount++;
            }
        }

        LiquidationAuction[] memory activeAuctions = new LiquidationAuction[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= _auctionIdCounter; i++) {
            if (auctions[i].status == AuctionStatus.ACTIVE) {
                activeAuctions[index] = auctions[i];
                index++;
            }
        }

        return activeAuctions;
    }

    /**
     * Withdraw bond (only for inactive liquidators)
     */
    function withdrawBond() external nonReentrant {
        Liquidator storage liq = liquidators[msg.sender];
        require(liq.wallet != address(0), "Liquidator not found");
        require(
            liq.status == LiquidatorStatus.DEACTIVATED,
            "Liquidator must be deactivated"
        );

        uint256 bondAmount = liq.bondAmount;
        liq.bondAmount = 0;

        require(
            stablecoin.transfer(msg.sender, bondAmount),
            "Bond withdrawal failed"
        );
    }

    /**
     * Set platform treasury address
     */
    function setPlatformTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        platformTreasury = _treasury;
    }

    /**
     * Recover accidentally sent native funds (ETH/MNT)
     */
    function recoverStuckNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        (bool ok, ) = to.call{value: amount}('');
        require(ok, "Native transfer failed");
    }

    /**
     * Emergency pause/unpause
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * Recover stuck funds
     */
    function recoverStuckTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "Recovery failed");
    }
}
