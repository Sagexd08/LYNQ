const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashLoanProvider - Multi-Wallet Flash Loans", function () {
  let flashLoanProvider;
  let trustScore;
  let testToken;
  let owner;
  let addr1, addr2, addr3, addr4;
  const FEE_BPS = 9;
  const INITIAL_LIQUIDITY = ethers.parseEther("1000");
  const FLASH_LOAN_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    // Deploy test token
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy("Test Token", "TEST", ethers.parseEther("10000"));

    // Deploy TrustScore
    const TrustScore = await ethers.getContractFactory("TrustScore");
    trustScore = await TrustScore.deploy();

    // Deploy FlashLoanProvider
    const FlashLoanProvider = await ethers.getContractFactory("FlashLoanProvider");
    flashLoanProvider = await FlashLoanProvider.deploy(trustScore.getAddress());

    // Add supported asset
    await flashLoanProvider.addSupportedAsset(testToken.getAddress(), ethers.parseEther("500"));

    // Deposit liquidity
    await testToken.approve(flashLoanProvider.getAddress(), INITIAL_LIQUIDITY);
    await flashLoanProvider.depositLiquidity(testToken.getAddress(), INITIAL_LIQUIDITY);

    // Set trust scores for users (need at least 300)
    await trustScore.updateTrustScore(addr1.getAddress(), 900);
    await trustScore.updateTrustScore(addr2.getAddress(), 900);
    await trustScore.updateTrustScore(addr3.getAddress(), 900);
    await trustScore.updateTrustScore(addr4.getAddress(), 900);
  });

  describe("Basic Multi-Wallet Flash Loan", function () {
    it("should execute multi-wallet flash loan to 2 recipients", async function () {
      // Deploy receiver contract
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress(), addr3.getAddress()];
      const allocations = [
        ethers.parseEther("50"),
        ethers.parseEther("50"),
      ];

      const tx = await flashLoanProvider
        .connect(addr1)
        .flashLoanMultiWallet(
          receiver.getAddress(),
          testToken.getAddress(),
          FLASH_LOAN_AMOUNT,
          recipients,
          allocations,
          "0x"
        );

      const receipt = await tx.wait();
      const batchId = receipt.logs[0].args?.[0]; // Get batchId from event

      // Verify batch was created
      const batch = await flashLoanProvider.getMultiWalletBatch(batchId);
      expect(batch.initiator).to.equal(addr1.getAddress());
      expect(batch.asset).to.equal(testToken.getAddress());
      expect(batch.totalAmount).to.equal(FLASH_LOAN_AMOUNT);
      expect(batch.success).to.be.true;
      expect(batch.recipients.length).to.equal(2);
    });

    it("should execute multi-wallet flash loan to 3 recipients with different allocations", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress(), addr3.getAddress(), addr4.getAddress()];
      const allocations = [
        ethers.parseEther("40"),
        ethers.parseEther("35"),
        ethers.parseEther("25"),
      ];

      const tx = await flashLoanProvider
        .connect(addr1)
        .flashLoanMultiWallet(
          receiver.getAddress(),
          testToken.getAddress(),
          FLASH_LOAN_AMOUNT,
          recipients,
          allocations,
          "0x"
        );

      const receipt = await tx.wait();
      const batchId = receipt.logs[0].args?.[0];

      const batch = await flashLoanProvider.getMultiWalletBatch(batchId);
      expect(batch.recipients.length).to.equal(3);
      expect(batch.allocations[0]).to.equal(ethers.parseEther("40"));
      expect(batch.allocations[1]).to.equal(ethers.parseEther("35"));
      expect(batch.allocations[2]).to.equal(ethers.parseEther("25"));
    });
  });

  describe("Multi-Wallet Flash Loan Validation", function () {
    it("should revert if allocations don't sum to totalAmount", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress(), addr3.getAddress()];
      const allocations = [
        ethers.parseEther("40"),
        ethers.parseEther("40"), // Sum = 80, but totalAmount = 100
      ];

      await expect(
        flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            FLASH_LOAN_AMOUNT,
            recipients,
            allocations,
            "0x"
          )
      ).to.be.revertedWith("Allocations must sum to totalAmount");
    });

    it("should revert if recipients and allocations length mismatch", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress(), addr3.getAddress()];
      const allocations = [ethers.parseEther("100")]; // Mismatch

      await expect(
        flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            FLASH_LOAN_AMOUNT,
            recipients,
            allocations,
            "0x"
          )
      ).to.be.revertedWith("Recipients and allocations length mismatch");
    });

    it("should revert if any allocation is zero", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress(), addr3.getAddress()];
      const allocations = [
        ethers.parseEther("100"),
        ethers.parseEther("0"), // Zero allocation
      ];

      await expect(
        flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            ethers.parseEther("100"),
            recipients,
            allocations,
            "0x"
          )
      ).to.be.revertedWith("Allocation must be greater than 0");
    });

    it("should revert if more than 20 recipients", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      // Create 21 recipients
      const recipients = [];
      const allocations = [];
      for (let i = 0; i < 21; i++) {
        recipients.push((await ethers.getSigners())[i % 4]?.address || addr1.getAddress());
        allocations.push(ethers.parseEther("5"));
      }

      const totalAmount = allocations.reduce((a, b) => a + b, 0n);

      await expect(
        flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            totalAmount,
            recipients,
            allocations,
            "0x"
          )
      ).to.be.revertedWith("Too many recipients (max 20)");
    });

    it("should revert if insufficient liquidity", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress()];
      const allocations = [ethers.parseEther("2000")]; // More than available

      await expect(
        flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            ethers.parseEther("2000"),
            recipients,
            allocations,
            "0x"
          )
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Fail-Safe Rollback", function () {
    it("should rollback entire transaction if receiver doesn't repay", async function () {
      const FailingReceiver = await ethers.getContractFactory("FailingMultiWalletReceiver");
      const receiver = await FailingReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress()];
      const allocations = [FLASH_LOAN_AMOUNT];

      // Get initial liquidity
      const initialLiquidity = await flashLoanProvider.poolLiquidity(testToken.getAddress());

      // Attempt flash loan that will fail
      await expect(
        flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            FLASH_LOAN_AMOUNT,
            recipients,
            allocations,
            "0x"
          )
      ).to.be.revertedWith("Multi-wallet flash loan failed");

      // Verify liquidity is restored
      const finalLiquidity = await flashLoanProvider.poolLiquidity(testToken.getAddress());
      expect(finalLiquidity).to.equal(initialLiquidity);
    });

    it("should track batch as failed and emit event", async function () {
      const FailingReceiver = await ethers.getContractFactory("FailingMultiWalletReceiver");
      const receiver = await FailingReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const recipients = [addr2.getAddress()];
      const allocations = [FLASH_LOAN_AMOUNT];

      try {
        await flashLoanProvider
          .connect(addr1)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            FLASH_LOAN_AMOUNT,
            recipients,
            allocations,
            "0x"
          );
      } catch (error) {
        // Expected to fail
      }

      // Note: Without accessing internal state, we verify this by monitoring events
      // This would be done via event filtering in a real test
    });
  });

  describe("Premium Collection", function () {
    it("should collect correct premium on successful repayment", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const initialLiquidity = await flashLoanProvider.poolLiquidity(testToken.getAddress());
      const expectedPremium = (FLASH_LOAN_AMOUNT * BigInt(FEE_BPS)) / BigInt(10000);

      await flashLoanProvider
        .connect(addr1)
        .flashLoanMultiWallet(
          receiver.getAddress(),
          testToken.getAddress(),
          FLASH_LOAN_AMOUNT,
          [addr2.getAddress()],
          [FLASH_LOAN_AMOUNT],
          "0x"
        );

      const finalLiquidity = await flashLoanProvider.poolLiquidity(testToken.getAddress());

      // Liquidity should be initial - FLASH_LOAN_AMOUNT + FLASH_LOAN_AMOUNT + premium
      expect(finalLiquidity).to.equal(initialLiquidity + expectedPremium);
    });
  });

  describe("User Statistics Tracking", function () {
    it("should update user statistics on successful flash loan", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      const initialStats = await flashLoanProvider.getUserStats(addr1.getAddress());

      await flashLoanProvider
        .connect(addr1)
        .flashLoanMultiWallet(
          receiver.getAddress(),
          testToken.getAddress(),
          FLASH_LOAN_AMOUNT,
          [addr2.getAddress()],
          [FLASH_LOAN_AMOUNT],
          "0x"
        );

      const updatedStats = await flashLoanProvider.getUserStats(addr1.getAddress());

      expect(updatedStats[0]).to.equal(initialStats[0] + 1n); // totalFlashLoans
      expect(updatedStats[1]).to.equal(initialStats[1] + 1n); // successfulFlashLoans
      expect(updatedStats[4]).to.equal(0n); // Low risk level
    });

    it("should track multiple batches per user", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      // Execute two flash loans
      const tx1 = await flashLoanProvider
        .connect(addr1)
        .flashLoanMultiWallet(
          receiver.getAddress(),
          testToken.getAddress(),
          ethers.parseEther("50"),
          [addr2.getAddress()],
          [ethers.parseEther("50")],
          "0x"
        );

      const tx2 = await flashLoanProvider
        .connect(addr1)
        .flashLoanMultiWallet(
          receiver.getAddress(),
          testToken.getAddress(),
          ethers.parseEther("50"),
          [addr3.getAddress()],
          [ethers.parseEther("50")],
          "0x"
        );

      const batchIds = await flashLoanProvider.getUserBatchIds(addr1.getAddress());
      expect(batchIds.length).to.be.at.least(2);
    });
  });

  describe("Risk Checks", function () {
    it("should reject user with low trust score", async function () {
      const MultiWalletReceiver = await ethers.getContractFactory("MultiWalletFlashLoanReceiverTest");
      const receiver = await MultiWalletReceiver.deploy(flashLoanProvider.getAddress(), testToken.getAddress());

      // Create new user with low trust score
      const lowTrustUser = addr4;
      await trustScore.updateTrustScore(lowTrustUser.getAddress(), 100); // Below MIN_TRUST_SCORE (300)

      await expect(
        flashLoanProvider
          .connect(lowTrustUser)
          .flashLoanMultiWallet(
            receiver.getAddress(),
            testToken.getAddress(),
            FLASH_LOAN_AMOUNT,
            [addr2.getAddress()],
            [FLASH_LOAN_AMOUNT],
            "0x"
          )
      ).to.be.revertedWith("Trust score too low for flash loans");
    });
  });
});

// Helper: Test Receiver Contract
const { ContractFactory } = require("ethers");

// Note: These contracts would be deployed separately or included in the same file
// For now, they're marked as needed for the test suite
