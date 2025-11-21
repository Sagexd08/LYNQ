// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CreditScoreVerifier
 * @notice Verifies EIP-712 signed credit assessments and risk parameters
 */
contract CreditScoreVerifier is EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant CREDIT_ASSESSMENT_TYPEHASH =
        keccak256(
            "CreditAssessment(uint256 creditScore,string riskTier,uint256 timestamp,uint256 nonce)"
        );

    bytes32 public constant LOAN_PROPOSAL_TYPEHASH =
        keccak256(
            "LoanProposal(address borrower,uint256 loanAmount,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 timestamp,uint256 nonce)"
        );

    bytes32 public constant RISK_PARAMETERS_TYPEHASH =
        keccak256(
            "RiskParameters(uint256 anomalyScore,uint256 defaultProbability,uint256 recoveryRate,uint256 timestamp,uint256 nonce)"
        );

    address public trustedSigner;
    mapping(address => uint256) public nonces;

    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event CreditAssessmentVerified(
        address indexed user,
        uint256 creditScore,
        string riskTier,
        uint256 timestamp
    );
    event LoanProposalVerified(
        address indexed borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    constructor(address _trustedSigner) EIP712("LYNQ", "1") {
        require(_trustedSigner != address(0), "Invalid signer");
        trustedSigner = _trustedSigner;
    }

    function setTrustedSigner(address _newSigner) external {
        require(msg.sender == trustedSigner, "Only current signer can update");
        require(_newSigner != address(0), "Invalid signer");
        address oldSigner = trustedSigner;
        trustedSigner = _newSigner;
        emit TrustedSignerUpdated(oldSigner, _newSigner);
    }

    /**
     * Verify a signed credit assessment
     */
    function verifyCreditAssessment(
        address user,
        uint256 creditScore,
        string memory riskTier,
        uint256 timestamp,
        bytes calldata signature
    ) external returns (bool) {
        require(block.timestamp <= timestamp + 1 hours, "Signature expired");

        bytes32 structHash = keccak256(
            abi.encode(
                CREDIT_ASSESSMENT_TYPEHASH,
                creditScore,
                keccak256(abi.encodePacked(riskTier)),
                timestamp,
                nonces[user]
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        require(recovered == trustedSigner, "Invalid signature");

        nonces[user]++;
        emit CreditAssessmentVerified(user, creditScore, riskTier, timestamp);

        return true;
    }

    /**
     * Verify a signed loan proposal
     */
    function verifyLoanProposal(
        address borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 timestamp,
        bytes calldata signature
    ) external returns (bool) {
        require(block.timestamp <= timestamp + 1 hours, "Signature expired");

        bytes32 structHash = keccak256(
            abi.encode(
                LOAN_PROPOSAL_TYPEHASH,
                borrower,
                loanAmount,
                collateralAmount,
                interestRate,
                duration,
                timestamp,
                nonces[borrower]
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        require(recovered == trustedSigner, "Invalid signature");

        nonces[borrower]++;
        emit LoanProposalVerified(borrower, loanAmount, collateralAmount, timestamp);

        return true;
    }

    /**
     * Verify signed risk parameters from ML engine
     */
    function verifyRiskParameters(
        address user,
        uint256 anomalyScore,
        uint256 defaultProbability,
        uint256 recoveryRate,
        uint256 timestamp,
        bytes calldata signature
    ) external returns (bool) {
        require(block.timestamp <= timestamp + 1 hours, "Signature expired");

        bytes32 structHash = keccak256(
            abi.encode(
                RISK_PARAMETERS_TYPEHASH,
                anomalyScore,
                defaultProbability,
                recoveryRate,
                timestamp,
                nonces[user]
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        require(recovered == trustedSigner, "Invalid signature");

        nonces[user]++;
        return true;
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}
