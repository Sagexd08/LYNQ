// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationPoints is ERC721, Ownable {
    enum Tier { BRONZE, SILVER, GOLD, PLATINUM }

    struct UserReputation {
        uint256 points;
        Tier tier;
        uint256 loansCompleted;
        uint256 onTimePayments;
    }

    mapping(address => UserReputation) public reputations;
    uint256 public tokenCounter;

    event PointsAwarded(address indexed user, uint256 points);
    event TierUpgraded(address indexed user, Tier newTier);
    event BadgeMinted(address indexed user, uint256 tokenId, Tier tier);

    constructor() ERC721("LYNQ Reputation", "LREP") Ownable(msg.sender) {}

    function awardPoints(address user, uint256 points) public onlyOwner {
        UserReputation storage rep = reputations[user];
        rep.points += points;

        Tier newTier = calculateTier(rep.points);
        if (newTier != rep.tier) {
            rep.tier = newTier;
            emit TierUpgraded(user, newTier);
            _mintBadge(user, newTier);
        }

        emit PointsAwarded(user, points);
    }

    function recordLoanCompletion(address user, bool onTime) external onlyOwner {
        UserReputation storage rep = reputations[user];
        rep.loansCompleted++;
        
        if (onTime) {
            rep.onTimePayments++;
            awardPoints(user, 100);
        }
    }

    function calculateTier(uint256 points) public pure returns (Tier) {
        if (points >= 15000) return Tier.PLATINUM;
        if (points >= 5000) return Tier.GOLD;
        if (points >= 1000) return Tier.SILVER;
        return Tier.BRONZE;
    }

    function _mintBadge(address user, Tier tier) internal {
        uint256 tokenId = tokenCounter++;
        _safeMint(user, tokenId);
        emit BadgeMinted(user, tokenId, tier);
    }

    function getReputation(address user) external view returns (UserReputation memory) {
        return reputations[user];
    }
}
