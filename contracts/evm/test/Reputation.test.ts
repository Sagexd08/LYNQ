import { expect } from "chai";
import { ethers } from "hardhat";
import { LoanCore, ReputationPoints, MockToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Reputation System Integration", function () {
  let loanCore: LoanCore;
  let reputationPoints: ReputationPoints;
  let collateralToken: MockToken;
  let owner: SignerWithAddress;
  let borrower: SignerWithAddress;

  beforeEach(async () => {
    [owner, borrower] = await ethers.getSigners();

    // Deploy Tokens
    const tokenFactory = await ethers.getContractFactory("MockToken");
    collateralToken = await tokenFactory.deploy("Collateral", "COL");
    await collateralToken.mint(borrower.address, ethers.parseUnits("1000", 18));

    // Deploy ReputationPoints
    const repFactory = await ethers.getContractFactory("ReputationPoints");
    reputationPoints = await repFactory.deploy();

    // Deploy LoanCore
    const loanCoreFactory = await ethers.getContractFactory("LoanCore");
    loanCore = await loanCoreFactory.deploy();
    await loanCore.setCollateralVault(owner.address);
    
    // Link ReputationPoints
    await loanCore.setReputationPoints(await reputationPoints.getAddress());
    
    // Grant LoanCore ownership/permission to call recordLoanCompletion
    // ReputationPoints is Ownable, and recordLoanCompletion is onlyOwner.
    // So we need to transfer ownership to LoanCore OR add LoanCore as an authorized caller.
    // The current implementation uses onlyOwner.
    // So we must transfer ownership of ReputationPoints to LoanCore.
    await reputationPoints.transferOwnership(await loanCore.getAddress());

    // Approve collateral
    await collateralToken.connect(borrower).approve(await loanCore.getAddress(), ethers.MaxUint256);
  });

  it("Should award points on timely repayment", async () => {
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
    
    // Repay immediately (on time)
    const repaymentAmount = ethers.parseUnits("100", 18) + (ethers.parseUnits("100", 18) * 500n) / 10000n;
    await loanCore.connect(borrower).repayLoan(loanId, repaymentAmount);

    const rep = await reputationPoints.getReputation(borrower.address);
    expect(rep.points).to.equal(100n);
    expect(rep.onTimePayments).to.equal(1n);
  });

  it("Should NOT award points on liquidation", async () => {
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

    // Make overdue
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await loanCore.liquidateLoan(loanId);

    const rep = await reputationPoints.getReputation(borrower.address);
    expect(rep.points).to.equal(0n);
    expect(rep.loansCompleted).to.equal(1n); // It is recorded as completed
    expect(rep.onTimePayments).to.equal(0n);
  });
});
