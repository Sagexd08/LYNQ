const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying remaining contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  // Already deployed contract addresses
  const trustScoreAddress = "0x15CAaA13e41937178F1B84eDB0193dc54230E27A";
  const collateralManagerAddress = "0x2074C5959f37CbF5fA2b1782E770B04bfbC93ebA";

  console.log("\n=== Using Previously Deployed Contracts ===");
  console.log("TrustScore:", trustScoreAddress);
  console.log("CollateralManager:", collateralManagerAddress);

  // Deploy InterestRateModel
  console.log("\n[1/2] Deploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy(deployer.address);
  await interestRateModel.waitForDeployment();
  const interestRateModelAddress = await interestRateModel.getAddress();
  console.log("✓ InterestRateModel deployed to:", interestRateModelAddress);

  // Check balance before LoanPlatform deployment
  const balanceBeforeLoanPlatform = await ethers.provider.getBalance(deployer.address);
  console.log("\nBalance before LoanPlatform deployment:", ethers.formatEther(balanceBeforeLoanPlatform), "MNT");

  // Deploy LoanPlatform
  console.log("\n[2/2] Deploying LoanPlatform (main contract)...");
  const LoanPlatform = await ethers.getContractFactory("LoanPlatform");
  const loanPlatform = await LoanPlatform.deploy(
    trustScoreAddress,
    collateralManagerAddress,
    interestRateModelAddress
  );
  await loanPlatform.waitForDeployment();
  const loanPlatformAddress = await loanPlatform.getAddress();
  console.log("✓ LoanPlatform deployed to:", loanPlatformAddress);

  // Transfer ownership of supporting contracts to LoanPlatform
  console.log("\n=== Transferring Ownership ===");
  
  // Get contract instances
  const TrustScore = await ethers.getContractFactory("TrustScore");
  const trustScore = TrustScore.attach(trustScoreAddress);
  
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = CollateralManager.attach(collateralManagerAddress);

  console.log("Transferring TrustScore ownership to LoanPlatform...");
  const tx1 = await trustScore.transferOwnership(loanPlatformAddress);
  await tx1.wait();
  console.log("✓ TrustScore ownership transferred");

  console.log("Transferring CollateralManager ownership to LoanPlatform...");
  const tx2 = await collateralManager.transferOwnership(loanPlatformAddress);
  await tx2.wait();
  console.log("✓ CollateralManager ownership transferred");

  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\nFinal balance:", ethers.formatEther(finalBalance), "MNT");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n=== All Contract Addresses ===");
  console.log("TrustScore:          ", trustScoreAddress);
  console.log("CollateralManager:   ", collateralManagerAddress);
  console.log("InterestRateModel:   ", interestRateModelAddress);
  console.log("LoanPlatform (Main): ", loanPlatformAddress);

  console.log("\n=== Backend Environment Variables ===");
  console.log("Add these to your .env file:\n");
  console.log(`LOAN_PLATFORM_ADDRESS="${loanPlatformAddress}"`);
  console.log(`TRUST_SCORE_ADDRESS="${trustScoreAddress}"`);
  console.log(`COLLATERAL_MANAGER_ADDRESS="${collateralManagerAddress}"`);
  console.log(`INTEREST_RATE_MODEL_ADDRESS="${interestRateModelAddress}"`);

  console.log("\n=== Frontend Environment Variables ===");
  console.log("Add these to your frontend .env:\n");
  console.log(`VITE_LOAN_PLATFORM_ADDRESS=${loanPlatformAddress}`);
  console.log(`VITE_TRUST_SCORE_ADDRESS=${trustScoreAddress}`);
  console.log(`VITE_COLLATERAL_MANAGER_ADDRESS=${collateralManagerAddress}`);
  console.log(`VITE_INTEREST_RATE_MODEL_ADDRESS=${interestRateModelAddress}`);

  console.log("\n=== Block Explorer Links ===");
  console.log("View on Mantle Sepolia Explorer:\n");
  console.log(`TrustScore:          https://explorer.sepolia.mantle.xyz/address/${trustScoreAddress}`);
  console.log(`CollateralManager:   https://explorer.sepolia.mantle.xyz/address/${collateralManagerAddress}`);
  console.log(`InterestRateModel:   https://explorer.sepolia.mantle.xyz/address/${interestRateModelAddress}`);
  console.log(`LoanPlatform:        https://explorer.sepolia.mantle.xyz/address/${loanPlatformAddress}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentsDir = __dirname + "/../deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: "mantleSepolia",
    chainId: 5003,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      LoanPlatform: loanPlatformAddress,
      TrustScore: trustScoreAddress,
      CollateralManager: collateralManagerAddress,
      InterestRateModel: interestRateModelAddress,
    },
    transactions: {
      interestRateModel: interestRateModel.deploymentTransaction()?.hash,
      loanPlatform: loanPlatform.deploymentTransaction()?.hash,
    }
  };

  const filename = `${deploymentsDir}/mantleSepolia-complete-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✓ Deployment info saved to: ${filename}`);
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
