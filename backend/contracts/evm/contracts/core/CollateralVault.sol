// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CollateralVault is Ownable, ReentrancyGuard {
    mapping(uint256 => CollateralInfo) public collaterals;
    mapping(address => mapping(address => uint256)) public userTokenBalance;
    mapping(address => uint256) public userNonce;
    address public loanCore; // Allow LoanCore to unlock collateral

    struct CollateralInfo {
        address owner;
        address token;
        uint256 amount;
        uint256 loanId;
        bool locked;
    }

    event CollateralLocked(
        uint256 indexed collateralId,
        address indexed owner,
        address token,
        uint256 amount,
        uint256 loanId
    );
    
    event CollateralUnlocked(uint256 indexed collateralId);
    event CollateralSeized(uint256 indexed collateralId, address indexed recipient);

    constructor() Ownable(msg.sender) {}

    function setLoanCore(address _loanCore) external onlyOwner {
        loanCore = _loanCore;
    }

    function lockCollateral(
        address token,
        uint256 amount,
        uint256 loanId
    ) external nonReentrant returns (uint256) {
        return lockCollateralFor(msg.sender, token, amount, loanId);
    }

    function lockCollateralFor(
        address owner,
        address token,
        uint256 amount,
        uint256 loanId
    ) public nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        // Only allow LoanCore or the owner themselves to lock collateral
        require(
            msg.sender == loanCore || msg.sender == owner,
            "Not authorized"
        );

        // Transfer from owner (who must have approved this contract)
        IERC20(token).transferFrom(owner, address(this), amount);

        // Add nonce to prevent collisions when same user locks same token/amount in same block
        uint256 nonce = userNonce[owner]++;
        uint256 collateralId = uint256(
            keccak256(abi.encodePacked(owner, token, amount, block.timestamp, nonce))
        );

        collaterals[collateralId] = CollateralInfo({
            owner: owner,
            token: token,
            amount: amount,
            loanId: loanId,
            locked: true
        });

        userTokenBalance[owner][token] += amount;

        emit CollateralLocked(collateralId, owner, token, amount, loanId);
        
        return collateralId;
    }

    function unlockCollateral(uint256 collateralId) external nonReentrant {
        CollateralInfo storage collateral = collaterals[collateralId];
        require(collateral.locked, "Already unlocked");
        // Allow owner or LoanCore to unlock
        require(
            collateral.owner == msg.sender || msg.sender == loanCore,
            "Not authorized to unlock"
        );

        collateral.locked = false;
        userTokenBalance[collateral.owner][collateral.token] -= collateral.amount;

        IERC20(collateral.token).transfer(collateral.owner, collateral.amount);

        emit CollateralUnlocked(collateralId);
    }

    function getCollateralValue(
        uint256 collateralId
    ) external view returns (uint256) {
        return collaterals[collateralId].amount;
    }

    function seizeCollateral(uint256 collateralId, address recipient) external nonReentrant {
        CollateralInfo storage collateral = collaterals[collateralId];
        require(collateral.locked, "Already unlocked/seized");
        require(msg.sender == loanCore, "Not authorized");

        collateral.locked = false;
        userTokenBalance[collateral.owner][collateral.token] -= collateral.amount;

        IERC20(collateral.token).transfer(recipient, collateral.amount);

        emit CollateralSeized(collateralId, recipient);
    }
}
