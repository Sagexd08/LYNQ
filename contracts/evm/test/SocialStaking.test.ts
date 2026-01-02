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

    
    const tokenFactory = await ethers.getContractFactory("MockToken");
    stakingToken = await tokenFactory.deploy("Staking Token", "STK");
    collateralToken = await tokenFactory.deploy("Collateral Token", "COL");

    
    const loanCoreFactory = await ethers.getContractFactory("LoanCore");
    loanCore = await loanCoreFactory.deploy();
    await loanCore.setCollateralVault(owner.address); 

    
    const socialStakingFactory = await ethers.getContractFactory("SocialStaking");
    socialStaking = await socialStakingFactory.deploy(await stakingToken.getAddress());
    await socialStaking.setLoanCore(await loanCore.getAddress());

    
    await loanCore.setSocialStaking(await socialStaking.getAddress());

    
    await stakingToken.mint(staker.address, ethers.parseUnits("1000", 18));
    await collateralToken.mint(borrower.address, ethers.parseUnits("1000", 18));

    
    await stakingToken.connect(staker).approve(await socialStaking.getAddress(), ethers.MaxUint256);
    await collateralToken.connect(borrower).approve(await loanCore.getAddress(), ethers.MaxUint256);
  });

  it("Should allow staking on a loan", async () => {
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

    
    
    
    const repaymentAmount = ethers.parseUnits("105", 18);
    await loanCore.connect(borrower).repayLoan(loanId, repaymentAmount);

    
    await socialStaking.connect(staker).withdrawStake(loanId);

    const stake = await socialStaking.stakes(loanId, staker.address);
    expect(stake.amount).to.equal(0);
    
    const balance = await stakingToken.balanceOf(staker.address);
    expect(balance).to.equal(ethers.parseUnits("1000", 18)); 
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

    
    
    
    
    
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    
    await loanCore.liquidateLoan(loanId);

    
    const isDefaulted = await socialStaking.loanDefaulted(loanId);
    expect(isDefaulted).to.be.true;

    
    await expect(
        socialStaking.connect(staker).withdrawStake(loanId)
    ).to.be.revertedWith("Loan defaulted, stake slashed");
  });
});
