
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidatorProtocol is Ownable, ReentrancyGuard, Pausable {

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

    uint256 private constant AUCTION_DURATION_HOURS = 24;
    uint256 private constant MIN_LIQUIDATOR_BOND = 10 ether;
    uint256 private constant MAX_SUSPENSION_SCORE = 100;
    uint256 private constant SUSPENSION_THRESHOLD = 70;
    uint256 private constant MAX_FAILURES_BEFORE_SUSPENSION = 3;
    uint256 private constant PLATFORM_FEE_PERCENTAGE = 250;

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

    constructor(address _stablecoin, address _treasury) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        require(_treasury != address(0), "Invalid treasury address");

        stablecoin = IERC20(_stablecoin);
        platformTreasury = _treasury;
    }

    function registerLiquidator(uint256 bondAmount) external payable nonReentrant {
        require(
            liquidators[msg.sender].wallet == address(0),
            "Liquidator already registered"
        );
        require(bondAmount >= MIN_LIQUIDATOR_BOND, "Bond amount too low");

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

    function getLiquidatorStats(address liquidator)
        external
        view
        liquidatorExists(liquidator)
        returns (Liquidator memory)
    {
        return liquidators[liquidator];
    }

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

        uint256 auctionId = ++_auctionIdCounter;

        LiquidationAuction memory auction = LiquidationAuction({
            auctionId: auctionId,
            loanId: loanId,
            collateralToken: collateralToken,
            collateralAmount: collateralAmount,
            startPrice: startPrice,
            minimumPrice: minimumPrice,
            currentPrice: startPrice,
            priceDecayPercentPerHour: 200,
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

        if (hoursElapsed >= AUCTION_DURATION_HOURS) {
            return auction.minimumPrice;
        }

        uint256 decayFactor = 100 - auction.priceDecayPercentPerHour / 100;
        uint256 decayedPrice = auction.startPrice;

        for (uint256 i = 0; i < hoursElapsed; i++) {
            decayedPrice = (decayedPrice * decayFactor) / 100;
        }

        if (decayedPrice < auction.minimumPrice) {
            return auction.minimumPrice;
        }

        return decayedPrice;
    }

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

    function placeBid(
        uint256 auctionId,
        uint256 bidAmount,
        bytes calldata executionPlan
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

            LiquidatorBid storage existingBid = bids[existingBidIdValue];
            require(
                bidAmount > existingBid.bidAmount,
                "New bid must be higher than existing bid"
            );
            existingBid.bidAmount = bidAmount;
            existingBid.bidRound++;

            return existingBidIdValue;
        }

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

        if (bidAmount > auction.currentPrice) {
            auction.currentPrice = bidAmount;
        }

        emit BidPlaced(newBidId, auctionId, msg.sender, bidAmount, block.timestamp);

        return newBidId;
    }

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

            auction.status = AuctionStatus.FAILED;
            emit LiquidationFailed(auctionId, "No valid bids received", block.timestamp);
            return;
        }

        LiquidatorBid storage winningBid = bids[winningBidId];

        if (winningBidAmount < auction.minimumPrice) {
            auction.status = AuctionStatus.FAILED;
            emit LiquidationFailed(
                auctionId,
                "Winning bid below reserve price",
                block.timestamp
            );
            return;
        }

        auction.status = AuctionStatus.SOLD;
        auction.winningBidId = winningBidId;
        auction.winnerAddress = winningBid.liquidatorAddress;
        auction.executedAt = block.timestamp;
        auction.transactionHash = transactionHash;

        winningBid.status = BidStatus.EXECUTED;
        winningBid.executedAt = block.timestamp;
        winningBid.transactionHash = transactionHash;

        Liquidator storage liquidator = liquidators[winningBid.liquidatorAddress];
        liquidator.successfulLiquidations++;
        liquidator.totalLiquidations++;
        liquidator.totalVolumeProcessed += winningBidAmount;
        liquidator.failureCount = 0;

        uint256 platformFee = (winningBidAmount * auction.platformFeePercentage) / 10000;

        require(
            stablecoin.transferFrom(winningBid.liquidatorAddress, address(this), winningBidAmount),
            "Bid transfer failed"
        );

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

        if (liq.failureCount >= MAX_FAILURES_BEFORE_SUSPENSION) {
            liq.suspensionScore = MAX_SUSPENSION_SCORE;
            liq.status = LiquidatorStatus.SUSPENDED;
        } else {
            liq.suspensionScore = (liq.failureCount * 100) / MAX_FAILURES_BEFORE_SUSPENSION;
        }

        emit LiquidationFailed(auctionId, reason, block.timestamp);
    }

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

    function setPlatformTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        platformTreasury = _treasury;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function recoverStuckTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "Recovery failed");
    }
}
