// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CollateralManager is Ownable, ReentrancyGuard, Pausable {
    enum CollateralType {
        None,
        ERC20,
        ERC721,
        ERC1155
    }

    struct Collateral {
        CollateralType collateralType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    mapping(address => mapping(address => uint256)) public lockedCollateral;
    mapping(address => bool) public acceptableCollaterals;

    event CollateralLocked(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event CollateralReleased(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event CollateralLiquidated(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    constructor(address initialOwner) Ownable(initialOwner) {
        acceptableCollaterals[address(0)] = true;
    }

    function setAcceptableCollateral(address token, bool acceptable) external onlyOwner {
        acceptableCollaterals[token] = acceptable;
    }

    function isAcceptableCollateral(address token) external view returns (bool) {
        return acceptableCollaterals[token];
    }

    function lockCollateral(
        address user,
        address collateralToken,
        uint256 amount
    ) external payable whenNotPaused nonReentrant {
        require(acceptableCollaterals[collateralToken], "Unacceptable collateral");
        require(msg.sender == user, "Can only lock own collateral");

        if (collateralToken == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
            payable(address(this)).transfer(amount);
        } else {
            IERC20 token = IERC20(collateralToken);
            require(
                token.transferFrom(user, address(this), amount),
                "Collateral transfer failed"
            );
        }

        lockedCollateral[user][collateralToken] += amount;

        emit CollateralLocked(user, collateralToken, amount);
    }

    function releaseCollateral(
        address user,
        address collateralToken,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(lockedCollateral[user][collateralToken] >= amount, "Insufficient locked collateral");

        lockedCollateral[user][collateralToken] -= amount;

        if (collateralToken == address(0)) {
            payable(user).transfer(amount);
        } else {
            IERC20 token = IERC20(collateralToken);
            require(
                token.transfer(user, amount),
                "Collateral release failed"
            );
        }

        emit CollateralReleased(user, collateralToken, amount);
    }

    function liquidateCollateral(
        address user,
        address collateralToken,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(lockedCollateral[user][collateralToken] >= amount, "Insufficient locked collateral");

        lockedCollateral[user][collateralToken] -= amount;

        if (collateralToken == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20 token = IERC20(collateralToken);
            require(
                token.transfer(owner(), amount),
                "Collateral liquidation failed"
            );
        }

        emit CollateralLiquidated(user, collateralToken, amount);
    }

    function getLockedCollateral(
        address user,
        address collateralToken
    ) external view returns (uint256) {
        return lockedCollateral[user][collateralToken];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

