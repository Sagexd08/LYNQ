import { expect } from "chai";
import { ethers } from "hardhat";
import { LoanCore, SocialStaking, MockToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SocialStaking Integration", function () {
  let loanCore: LoanCore;
  let socialStaking: SocialStaking;
  let stakingToken: MockToken;
  let collateralToken: MockToken;
  let owner: SignerWithAddress;
  let borrower: SignerWithAddress;
  let staker: SignerWithAddress;

  beforeEach(async () => {
    [owner, borrower, staker] = await ethers.getSigners();

    // Deploy Tokens
    const tokenFactory = await ethers.getContractFactory("MockToken");
    stakingToken = await tokenFactory.deploy("Staking Token", "STK");
    collateralToken = await tokenFactory.deploy("Collateral Token", "COL");

    // Deploy LoanCore
    const loanCoreFactory = await ethers.getContractFactory("LoanCore");
    loanCore = await loanCoreFactory.deploy();
    await loanCore.setCollateralVault(owner.address); // Mock vault

    // Deploy SocialStaking
    const socialStakingFactory = await ethers.getContractFactory("SocialStaking");
    socialStaking = await socialStakingFactory.deploy(await stakingToken.getAddress());
    await socialStaking.setLoanCore(await loanCore.getAddress());

    // Link SocialStaking to LoanCore
    await loanCore.setSocialStaking(await socialStaking.getAddress());

    // Setup balances
    await stakingToken.mint(staker.address, ethers.parseUnits("1000", 18));
    await collateralToken.mint(borrower.address, ethers.parseUnits("1000", 18));

    // Approvals
    await stakingToken.connect(staker).approve(await socialStaking.getAddress(), ethers.MaxUint256);
    await collateralToken.connect(borrower).approve(await loanCore.getAddress(), ethers.MaxUint256);
  });

  it("Should allow staking on a loan", async () => {
    const loanAmount = ethers.parseUnits("100", 18);
    const collateralAmount = ethers.parseUnits("150", 18);
    
    // Create Loan
    await loanCore.connect(borrower).createLoan(
        loanAmount,
        collateralAmount,
        await collateralToken.getAddress(),
        500, // 5% interest
        30 * 24 * 60 * 60 // 30 days
    );

    const loanId = 0;
    const stakeAmount = ethers.parseUnits("50", 18);

    // Stake
    await socialStaking.connect(staker).stake(loanId, stakeAmount);

    const stake = await socialStaking.stakes(loanId, staker.address);
    expect(stake.amount).to.equal(stakeAmount);
  });

  it("Should unlock stake when loan is repaid", async () => {
    const loanAmount = ethers.parseUnits("100", 18);
    const collateralAmount = ethers.parseUnits("150", 18);
    
    await loanCore.connect(borrower).createLoan(
        loanAmount,
        collateralAmount,
        await collateralToken.getAddress(),
        500,
        30 * 24 * 60 * 60
    );

    const loanId = 0;
    const stakeAmount = ethers.parseUnits("50", 18);
    await socialStaking.connect(staker).stake(loanId, stakeAmount);

    // Repay Loan
    // Calculate interest: 100 * 500 / 10000 = 5
    // Total repayment = 105
    const repaymentAmount = ethers.parseUnits("105", 18);
    await loanCore.connect(borrower).repayLoan(loanId, repaymentAmount);

    // Withdraw Stake
    await socialStaking.connect(staker).withdrawStake(loanId);

    const stake = await socialStaking.stakes(loanId, staker.address);
    expect(stake.amount).to.equal(0);
    
    const balance = await stakingToken.balanceOf(staker.address);
    expect(balance).to.equal(ethers.parseUnits("1000", 18)); // Initial balance
  });

  it("Should slash stake when loan is liquidated", async () => {
    const loanAmount = ethers.parseUnits("100", 18);
    const collateralAmount = ethers.parseUnits("150", 18);
    
    await loanCore.connect(borrower).createLoan(
        loanAmount,
        collateralAmount,
        await collateralToken.getAddress(),
        500,
        30 * 24 * 60 * 60
    );

    const loanId = 0;
    const stakeAmount = ethers.parseUnits("50", 18);
    await socialStaking.connect(staker).stake(loanId, stakeAmount);

    // Mock price feed or force liquidation condition
    // Since we can't easily mock the internal price feed check without setting it up,
    // we can rely on the "overdue" condition for liquidation.
    
    // Increase time to make it overdue
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // Liquidate
    await loanCore.liquidateLoan(loanId);

    // Check slash
    const isDefaulted = await socialStaking.loanDefaulted(loanId);
    expect(isDefaulted).to.be.true;

    // Try to withdraw (should fail)
    await expect(
        socialStaking.connect(staker).withdrawStake(loanId)
    ).to.be.revertedWith("Loan defaulted, stake slashed");
  });
});
