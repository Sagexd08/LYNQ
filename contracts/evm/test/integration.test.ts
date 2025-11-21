import { expect } from "chai";
import { ethers } from "hardhat";
import { LoanCore, CreditScoreVerifier } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LoanCore - Chainlink Price Feed Integration", function () {
  let loanCore: LoanCore;
  let owner: SignerWithAddress;
  let borrower: SignerWithAddress;

  beforeEach(async () => {
    [owner, borrower] = await ethers.getSigners();

    const loanCoreFactory = await ethers.getContractFactory("LoanCore");
    loanCore = await loanCoreFactory.deploy();

    await loanCore.setCollateralVault(owner.address);
  });

  describe("Core Functionality", () => {
    it("Should set collateral vault correctly", async () => {
      const vault = await loanCore.collateralVault();
      expect(vault).to.equal(owner.address);
    });

    it("Should have LIQUIDATION_THRESHOLD set to 120", async () => {
      const threshold = await loanCore.LIQUIDATION_THRESHOLD();
      expect(threshold).to.equal(120n);
    });

    it("Should allow owner to set price feeds", async () => {
      const mockFeedAddress = ethers.getAddress("0x0000000000000000000000000000000000000001");
      const mockTokenAddress = ethers.getAddress("0x0000000000000000000000000000000000000002");

      const tx = await loanCore.setPriceFeed(mockTokenAddress, mockFeedAddress);
      expect(tx.hash).to.exist;
    });
  });

  describe("Loan Management", () => {
    it("Should return empty user loans initially", async () => {
      const userLoans = await loanCore.getUserLoans(borrower.address);
      expect(userLoans).to.have.lengthOf(0);
    });
  });
});

describe("CreditScoreVerifier - EIP-712 Signatures", function () {
  let verifier: CreditScoreVerifier;
  let trustedSigner: SignerWithAddress;
  let user: SignerWithAddress;
  let attacker: SignerWithAddress;

  beforeEach(async () => {
    [trustedSigner, user, attacker] = await ethers.getSigners();

    const verifierFactory = await ethers.getContractFactory("CreditScoreVerifier");
    verifier = await verifierFactory.deploy(trustedSigner.address);
  });

  describe("Deployment", () => {
    it("Should deploy with correct trusted signer", async () => {
      expect(await verifier.trustedSigner()).to.equal(trustedSigner.address);
    });
  });

  describe("Credit Assessment Verification", () => {
    it("Should verify valid credit assessment signature", async () => {
      const creditScore = 750;
      const riskTier = "A";
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = 0;

      const domain = {
        name: "LYNQ",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await verifier.getAddress(),
      };

      const types = {
        CreditAssessment: [
          { name: "creditScore", type: "uint256" },
          { name: "riskTier", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const value = {
        creditScore,
        riskTier,
        timestamp,
        nonce,
      };

      const signature = await trustedSigner.signTypedData(domain, types, value);
      const tx = await verifier.verifyCreditAssessment(user.address, creditScore, riskTier, timestamp, signature);
      expect(tx.hash).to.exist;
    });

    it("Should increment nonce after verification", async () => {
      const creditScore = 750;
      const riskTier = "A";
      const timestamp = Math.floor(Date.now() / 1000);

      const domain = {
        name: "LYNQ",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await verifier.getAddress(),
      };

      const types = {
        CreditAssessment: [
          { name: "creditScore", type: "uint256" },
          { name: "riskTier", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const value = {
        creditScore,
        riskTier,
        timestamp,
        nonce: 0,
      };

      const signature = await trustedSigner.signTypedData(domain, types, value);

      const nonceBefore = await verifier.getNonce(user.address);
      expect(nonceBefore).to.equal(0n);

      await verifier.verifyCreditAssessment(user.address, creditScore, riskTier, timestamp, signature);

      const nonceAfter = await verifier.getNonce(user.address);
      expect(nonceAfter).to.equal(1n);
    });
  });

  describe("Loan Proposal Verification", () => {
    it("Should verify valid loan proposal signature", async () => {
      const borrower = user.address;
      const loanAmount = ethers.parseUnits("100", 18);
      const collateralAmount = ethers.parseUnits("1", 18);
      const interestRate = 500;
      const duration = 30 * 24 * 60 * 60;
      const timestamp = Math.floor(Date.now() / 1000);

      const domain = {
        name: "LYNQ",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await verifier.getAddress(),
      };

      const types = {
        LoanProposal: [
          { name: "borrower", type: "address" },
          { name: "loanAmount", type: "uint256" },
          { name: "collateralAmount", type: "uint256" },
          { name: "interestRate", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const value = {
        borrower,
        loanAmount,
        collateralAmount,
        interestRate,
        duration,
        timestamp,
        nonce: 0,
      };

      const signature = await trustedSigner.signTypedData(domain, types, value);

      const tx = await verifier.verifyLoanProposal(
        borrower,
        loanAmount,
        collateralAmount,
        interestRate,
        duration,
        timestamp,
        signature
      );
      expect(tx.hash).to.exist;
    });
  });

  describe("Trusted Signer Management", () => {
    it("Should allow current signer to update to new signer", async () => {
      const newSigner = attacker;

      const tx = await verifier.setTrustedSigner(newSigner.address);
      expect(tx.hash).to.exist;

      expect(await verifier.trustedSigner()).to.equal(newSigner.address);
    });

    it("Should prevent unauthorized signer update", async () => {
      try {
        await verifier.connect(user).setTrustedSigner(user.address);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Only current signer can update");
      }
    });

    it("Should reject invalid signer address", async () => {
      try {
        await verifier.setTrustedSigner(ethers.ZeroAddress);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Invalid signer");
      }
    });
  });
});
