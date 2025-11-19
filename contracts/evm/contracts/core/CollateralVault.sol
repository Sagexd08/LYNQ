// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CollateralVault is Ownable, ReentrancyGuard {
    mapping(uint256 => CollateralInfo) public collaterals;
    mapping(address => mapping(address => uint256)) public userTokenBalance;

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

    constructor() Ownable(msg.sender) {}

    function lockCollateral(
        address token,
        uint256 amount,
        uint256 loanId
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 collateralId = uint256(
            keccak256(abi.encodePacked(msg.sender, token, amount, block.timestamp))
        );

        collaterals[collateralId] = CollateralInfo({
            owner: msg.sender,
            token: token,
            amount: amount,
            loanId: loanId,
            locked: true
        });

        userTokenBalance[msg.sender][token] += amount;

        emit CollateralLocked(collateralId, msg.sender, token, amount, loanId);
        
        return collateralId;
    }

    function unlockCollateral(uint256 collateralId) external nonReentrant {
        CollateralInfo storage collateral = collaterals[collateralId];
        require(collateral.owner == msg.sender, "Not collateral owner");
        require(collateral.locked, "Already unlocked");

        collateral.locked = false;
        userTokenBalance[msg.sender][collateral.token] -= collateral.amount;

        IERC20(collateral.token).transfer(msg.sender, collateral.amount);

        emit CollateralUnlocked(collateralId);
    }

    function getCollateralValue(
        uint256 collateralId
    ) external view returns (uint256) {
        return collaterals[collateralId].amount;
    }
}
