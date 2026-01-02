
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";


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

    struct LoanProposal {
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 interestRate;
        uint256 duration;
        uint256 timestamp;
    }

    bytes32 public constant RISK_PARAMETERS_TYPEHASH =
        keccak256(
            "RiskParameters(uint256 anomalyScore,uint256 defaultProbability,uint256 recoveryRate,uint256 timestamp,uint256 nonce)"
        );

    bytes32 public constant REFINANCE_PROPOSAL_TYPEHASH =
        keccak256(
            "RefinanceProposal(uint256 loanId,uint256 newInterestRate,uint256 newDuration,uint256 timestamp,uint256 nonce)"
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
    event RefinanceProposalVerified(
        uint256 indexed loanId,
        uint256 newInterestRate,
        uint256 newDuration,
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

    
    function verifyLoanProposal(
        address borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 timestamp,
        bytes calldata signature
    ) external returns (bool) {
        LoanProposal memory proposal = LoanProposal({
            borrower: borrower,
            loanAmount: loanAmount,
            collateralAmount: collateralAmount,
            interestRate: interestRate,
            duration: duration,
            timestamp: timestamp
        });

        return _verifyLoanProposal(proposal, signature);
    }

    function _verifyLoanProposal(LoanProposal memory proposal, bytes calldata signature)
        internal
        returns (bool)
    {
        require(block.timestamp <= proposal.timestamp + 1 hours, "Signature expired");

        uint256 nonce = nonces[proposal.borrower];
        bytes32 structHash = keccak256(
            abi.encode(
                LOAN_PROPOSAL_TYPEHASH,
                proposal.borrower,
                proposal.loanAmount,
                proposal.collateralAmount,
                proposal.interestRate,
                proposal.duration,
                proposal.timestamp,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == trustedSigner, "Invalid signature");

        nonces[proposal.borrower] = nonce + 1;
        emit LoanProposalVerified(proposal.borrower, proposal.loanAmount, proposal.collateralAmount, proposal.timestamp);
        return true;
    }

    
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

    
    function verifyRefinanceProposal(
        address borrower,
        uint256 loanId,
        uint256 newInterestRate,
        uint256 newDuration,
        uint256 timestamp,
        bytes calldata signature
    ) external returns (bool) {
        require(block.timestamp <= timestamp + 1 hours, "Signature expired");

        bytes32 structHash = keccak256(
            abi.encode(
                REFINANCE_PROPOSAL_TYPEHASH,
                loanId,
                newInterestRate,
                newDuration,
                timestamp,
                nonces[borrower]
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        require(recovered == trustedSigner, "Invalid signature");

        nonces[borrower]++;
        emit RefinanceProposalVerified(loanId, newInterestRate, newDuration, timestamp);

        return true;
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}
