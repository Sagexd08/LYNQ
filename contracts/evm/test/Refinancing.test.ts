import { expect } from "chai";
import { ethers } from "hardhat";
import { LoanCore, CreditScoreVerifier, MockToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Loan Refinancing", function () {
  let loanCore: LoanCore;
  let verifier: CreditScoreVerifier;
  let collateralToken: MockToken;
  let owner: SignerWithAddress;
  let borrower: SignerWithAddress;
  let trustedSigner: SignerWithAddress;

  beforeEach(async () => {
    [owner, borrower, trustedSigner] = await ethers.getSigners();

    
    const tokenFactory = await ethers.getContractFactory("MockToken");
    collateralToken = await tokenFactory.deploy("Collateral", "COL");
    await collateralToken.mint(borrower.address, ethers.parseUnits("1000", 18));

    
    const verifierFactory = await ethers.getContractFactory("CreditScoreVerifier");
    verifier = await verifierFactory.deploy(trustedSigner.address);

    
    const loanCoreFactory = await ethers.getContractFactory("LoanCore");
    loanCore = await loanCoreFactory.deploy();
    await loanCore.setCollateralVault(owner.address);
    await loanCore.setCreditScoreVerifier(await verifier.getAddress());

    
    await collateralToken.connect(borrower).approve(await loanCore.getAddress(), ethers.MaxUint256);
  });

  it("Should allow refinancing with valid signature", async () => {
    const loanAmount = ethers.parseUnits("100", 18);
    const collateralAmount = ethers.parseUnits("150", 18);
    const initialRate = 1000; 
    const duration = 30 * 24 * 60 * 60; 

    await loanCore.connect(borrower).createLoan(
        loanAmount,
        collateralAmount,
        await collateralToken.getAddress(),
        initialRate,
        duration
    );

    const loanId = 0;

    
    await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    
    const block = await ethers.provider.getBlock("latest");
    const timestamp = block!.timestamp;

    
    const newRate = 500; 
    const newDuration = 60 * 24 * 60 * 60; 

    const domain = {
        name: "LYNQ",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await verifier.getAddress(),
    };

    const types = {
        RefinanceProposal: [
            { name: "loanId", type: "uint256" },
            { name: "newInterestRate", type: "uint256" },
            { name: "newDuration", type: "uint256" },
            { name: "timestamp", type: "uint256" },
            { name: "nonce", type: "uint256" },
        ],
    };

    const value = {
        loanId,
        newInterestRate: newRate,
        newDuration,
        timestamp,
        nonce: 0,
    };

    const signature = await trustedSigner.signTypedData(domain, types, value);

    
    await loanCore.connect(borrower).refinanceLoan(
        loanId,
        newRate,
        newDuration,
        timestamp,
        signature
    );

    const loan = await loanCore.getLoan(loanId);
    
    
    expect(loan.interestRate).to.equal(newRate);
    expect(loan.duration).to.equal(newDuration);
    
    
    
    
    
    
    expect(loan.amount).to.be.closeTo(ethers.parseUnits("105", 18), ethers.parseUnits("0.1", 18));
  });
});
