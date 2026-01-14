
pragma solidity ^0.8.20;

interface ICollateralVault {
    struct Collateral {
        bytes32 loanId;
        address depositor;
        address token;
        uint256 amount;
        bool isLocked;
    }

    function lockCollateral(
        bytes32 loanId,
        address token,
        uint256 amount
    ) external;

    function unlockCollateral(bytes32 loanId) external;

    function seizeCollateral(bytes32 loanId, address recipient) external;

    function getCollateral(bytes32 loanId) external view returns (Collateral[] memory);

    function getLockedAmount(bytes32 loanId, address token) external view returns (uint256);

    function isTokenSupported(address token) external view returns (bool);

    function getSupportedTokens() external view returns (address[] memory);
}
