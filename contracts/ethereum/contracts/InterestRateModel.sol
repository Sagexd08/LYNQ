// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract InterestRateModel is Ownable {
    uint256 public baseInterestRateBps = 800;
    uint256 public constant MIN_INTEREST_RATE_BPS = 100;
    uint256 public constant MAX_INTEREST_RATE_BPS = 5000;

    event InterestRateUpdated(uint256 newBaseRate);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setBaseInterestRate(uint256 newRate) external onlyOwner {
        require(
            newRate >= MIN_INTEREST_RATE_BPS && newRate <= MAX_INTEREST_RATE_BPS,
            "Interest rate out of bounds"
        );
        baseInterestRateBps = newRate;
        emit InterestRateUpdated(newRate);
    }

    function calculateInterestRate(
        uint256 amount,
        uint256 trustScore
    ) external view returns (uint256) {
        uint256 rate = baseInterestRateBps;

        if (trustScore >= 800) {
            rate = rate - 300;
        } else if (trustScore >= 600) {
            rate = rate - 150;
        } else if (trustScore >= 400) {
            rate = rate;
        } else {
            rate = rate + 200;
        }

        if (amount >= 1e18 * 100) {
            rate = rate - 50;
        } else if (amount >= 1e18 * 10) {
            rate = rate - 20;
        }

        return rate < MIN_INTEREST_RATE_BPS ? MIN_INTEREST_RATE_BPS : (rate > MAX_INTEREST_RATE_BPS ? MAX_INTEREST_RATE_BPS : rate);
    }

    function getInterestRateForTrustScore(
        uint256 trustScore
    ) external view returns (uint256) {
        uint256 rate = baseInterestRateBps;

        if (trustScore >= 800) {
            rate = rate - 300;
        } else if (trustScore >= 600) {
            rate = rate - 150;
        } else if (trustScore >= 400) {
            rate = rate;
        } else {
            rate = rate + 200;
        }

        return rate < MIN_INTEREST_RATE_BPS ? MIN_INTEREST_RATE_BPS : (rate > MAX_INTEREST_RATE_BPS ? MAX_INTEREST_RATE_BPS : rate);
    }
}

