// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TrustScore is Ownable, ReentrancyGuard {
    struct TrustScoreData {
        uint256 score;
        uint256 creditHistory;
        uint256 repaymentRecord;
        uint256 collateralValue;
        uint256 lastUpdated;
    }

    mapping(address => TrustScoreData) public trustScores;
    mapping(address => uint256[]) public loanHistory;

    uint256 public constant MAX_TRUST_SCORE = 1000;
    uint256 public constant BASE_SCORE = 500;
    uint256 public constant MAX_CREDIT_HISTORY = 100;
    uint256 public constant MAX_REPAYMENT_RECORD = 100;

    constructor(address initialOwner) Ownable(initialOwner) {}

    event TrustScoreUpdated(
        address indexed user,
        uint256 newScore,
        uint256 creditHistory,
        uint256 repaymentRecord,
        uint256 collateralValue
    );

    function getTrustScore(address user) external view returns (uint256) {
        return trustScores[user].score;
    }

    function getTrustScoreData(
        address user
    )
        external
        view
        returns (
            uint256 score,
            uint256 creditHistory,
            uint256 repaymentRecord,
            uint256 collateralValue,
            uint256 lastUpdated
        )
    {
        TrustScoreData storage data = trustScores[user];
        return (data.score, data.creditHistory, data.repaymentRecord, data.collateralValue, data.lastUpdated);
    }

    function updateTrustScore(
        address user,
        uint256 creditHistoryPoints,
        uint256 repaymentPoints,
        uint256 collateralValuePoints
    ) external onlyOwner nonReentrant {
        TrustScoreData storage data = trustScores[user];

        if (data.lastUpdated == 0) {
            data.score = BASE_SCORE;
            data.lastUpdated = block.timestamp;
        }

        if (creditHistoryPoints > 0) {
            data.creditHistory = data.creditHistory + creditHistoryPoints > MAX_CREDIT_HISTORY
                ? MAX_CREDIT_HISTORY
                : data.creditHistory + creditHistoryPoints;
        }

        if (repaymentPoints > 0) {
            data.repaymentRecord = data.repaymentRecord + repaymentPoints > MAX_REPAYMENT_RECORD
                ? MAX_REPAYMENT_RECORD
                : data.repaymentRecord + repaymentPoints;
        }

        if (collateralValuePoints > 0) {
            data.collateralValue += collateralValuePoints;
        }

        data.score = _calculateTrustScore(data);
        data.lastUpdated = block.timestamp;

        emit TrustScoreUpdated(
            user,
            data.score,
            data.creditHistory,
            data.repaymentRecord,
            data.collateralValue
        );
    }

    function recordLoanCompletion(
        address user,
        bool repaidOnTime,
        bool fullyRepaid
    ) external onlyOwner nonReentrant {
        if (fullyRepaid) {
            TrustScoreData storage data = trustScores[user];
            
            if (data.lastUpdated == 0) {
                data.score = BASE_SCORE;
                data.lastUpdated = block.timestamp;
            }
            
            if (repaidOnTime) {
                data.creditHistory = data.creditHistory + 5 > MAX_CREDIT_HISTORY
                    ? MAX_CREDIT_HISTORY
                    : data.creditHistory + 5;
                data.repaymentRecord = data.repaymentRecord + 10 > MAX_REPAYMENT_RECORD
                    ? MAX_REPAYMENT_RECORD
                    : data.repaymentRecord + 10;
            } else {
                data.creditHistory = data.creditHistory + 2 > MAX_CREDIT_HISTORY
                    ? MAX_CREDIT_HISTORY
                    : data.creditHistory + 2;
                data.repaymentRecord = data.repaymentRecord + 5 > MAX_REPAYMENT_RECORD
                    ? MAX_REPAYMENT_RECORD
                    : data.repaymentRecord + 5;
            }
            
            data.score = _calculateTrustScore(data);
            data.lastUpdated = block.timestamp;
            
            emit TrustScoreUpdated(
                user,
                data.score,
                data.creditHistory,
                data.repaymentRecord,
                data.collateralValue
            );
        }
    }

    function recordLoanDefault(address user) external onlyOwner nonReentrant {
        TrustScoreData storage data = trustScores[user];

        if (data.repaymentRecord >= 10) {
            data.repaymentRecord -= 10;
        } else {
            data.repaymentRecord = 0;
        }

        if (data.creditHistory >= 5) {
            data.creditHistory -= 5;
        } else {
            data.creditHistory = 0;
        }

        data.score = _calculateTrustScore(data);
        data.lastUpdated = block.timestamp;

        emit TrustScoreUpdated(
            user,
            data.score,
            data.creditHistory,
            data.repaymentRecord,
            data.collateralValue
        );
    }

    function _calculateTrustScore(
        TrustScoreData memory data
    ) internal pure returns (uint256) {
        uint256 calculatedScore = BASE_SCORE;
        calculatedScore += (data.creditHistory * 3);
        calculatedScore += (data.repaymentRecord * 2);
        calculatedScore += (data.collateralValue / 1e18);

        return calculatedScore > MAX_TRUST_SCORE ? MAX_TRUST_SCORE : calculatedScore;
    }
}

