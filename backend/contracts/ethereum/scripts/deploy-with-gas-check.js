const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("\n" + "=".repeat(60));
  console.log("🚀 MANTLE SEPOLIA DEPLOYMENT - Gas Optimized");
  console.log("=".repeat(60) + "\n");
  
  console.log("Deploying with account:", deployer.address);
  const initialBalance = await ethers.provider.getBalance(deployer.address);
  console.log("Initial balance:", ethers.formatEther(initialBalance), "MNT");

  // Already deployed contract addresses (if any)
  const trustScoreAddress = "0x15CAaA13e41937178F1B84eDB0193dc54230E27A";
  const collateralManagerAddress = "0x2074C5959f37CbF5fA2b1782E770B04bfbC93ebA";

  let interestRateModelAddress;
  let loanPlatformAddress;

  // Check if we have enough balance for remaining deployments
  const minBalanceRequired = ethers.parseEther("2"); // 2 MNT should be enough
  
  if (initialBalance < minBalanceRequired) {
    console.log("\n⚠️  WARNING: Low balance detected!");
    console.log(`Current: ${ethers.formatEther(initialBalance)} MNT`);
    console.log(`Recommended: ${ethers.formatEther(minBalanceRequired)} MNT`);
    console.log("\nGet more test MNT from: https://faucet.sepolia.mantle.xyz");
    console.log("Wallet address:", deployer.address);
    console.log("\nContinuing with deployment...\n");
  }

  try {
    // Deploy InterestRateModel
    console.log("[1/2] Deploying InterestRateModel...");
    const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
    
    // Estimate gas
    const deployData = InterestRateModel.getDeployTransaction(deployer.address);
    const gasEstimate = await ethers.provider.estimateGas({
      data: deployData.data,
      from: deployer.address
    });
    console.log("Estimated gas:", gasEstimate.toString());
    
    const interestRateModel = await InterestRateModel.deploy(deployer.address);
    await interestRateModel.waitForDeployment();
    interestRateModelAddress = await interestRateModel.getAddress();
    console.log("✓ InterestRateModel deployed to:", interestRateModelAddress);
    
    const balanceAfterIRM = await ethers.provider.getBalance(deployer.address);
    console.log("Balance after InterestRateModel:", ethers.formatEther(balanceAfterIRM), "MNT");

  } catch (error) {
    console.error("\n❌ Failed to deploy InterestRateModel");
    console.error("Error:", error.message);
    throw error;
  }

  try {
    // Deploy LoanPlatform
    console.log("\n[2/2] Deploying LoanPlatform (main contract)...");
    const LoanPlatform = await ethers.getContractFactory("LoanPlatform");
    
    // Estimate gas
    const deployData = LoanPlatform.getDeployTransaction(
      trustScoreAddress,
      collateralManagerAddress,
      interestRateModelAddress
    );
    const gasEstimate = await ethers.provider.estimateGas({
      data: deployData.data,
      from: deployer.address
    });
    console.log("Estimated gas:", gasEstimate.toString());
    
    const loanPlatform = await LoanPlatform.deploy(
      trustScoreAddress,
      collateralManagerAddress,
      interestRateModelAddress
    );
    await loanPlatform.waitForDeployment();
    loanPlatformAddress = await loanPlatform.getAddress();
    console.log("✓ LoanPlatform deployed to:", loanPlatformAddress);

    const balanceAfterLP = await ethers.provider.getBalance(deployer.address);
    console.log("Balance after LoanPlatform:", ethers.formatEther(balanceAfterLP), "MNT");

  } catch (error) {
    console.error("\n❌ Failed to deploy LoanPlatform");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution:");
      console.log("1. Get more test MNT from: https://faucet.sepolia.mantle.xyz");
      console.log("2. Wallet address:", deployer.address);
      console.log("3. Re-run this script after getting more MNT");
      console.log("\nNote: InterestRateModel was deployed successfully at:");
      console.log(interestRateModelAddress);
    }
    throw error;
  }

  // Transfer ownership
  console.log("\n=== Transferring Ownership ===");
  
  try {
    const TrustScore = await ethers.getContractFactory("TrustScore");
    const trustScore = TrustScore.attach(trustScoreAddress);
    
    const CollateralManager = await ethers.getContractFactory("CollateralManager");
    const collateralManager = CollateralManager.attach(collateralManagerAddress);

    console.log("Transferring TrustScore ownership...");
    const tx1 = await trustScore.transferOwnership(loanPlatformAddress);
    await tx1.wait();
    console.log("✓ TrustScore ownership transferred");

    console.log("Transferring CollateralManager ownership...");
    const tx2 = await collateralManager.transferOwnership(loanPlatformAddress);
    await tx2.wait();
    console.log("✓ CollateralManager ownership transferred");

  } catch (error) {
    console.warn("\n⚠️  Warning: Ownership transfer failed (may already be transferred)");
    console.warn("Error:", error.message);
  }

  // Final summary
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const totalCost = initialBalance - finalBalance;

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  
  console.log("\n=== Cost Summary ===");
  console.log("Initial balance: ", ethers.formatEther(initialBalance), "MNT");
  console.log("Final balance:   ", ethers.formatEther(finalBalance), "MNT");
  console.log("Total cost:      ", ethers.formatEther(totalCost), "MNT");

  console.log("\n=== All Contract Addresses ===");
  console.log("TrustScore:          ", trustScoreAddress);
  console.log("CollateralManager:   ", collateralManagerAddress);
  console.log("InterestRateModel:   ", interestRateModelAddress);
  console.log("LoanPlatform (Main): ", loanPlatformAddress);

  console.log("\n=== Add to .env file ===\n");
  console.log(`LOAN_PLATFORM_ADDRESS="${loanPlatformAddress}"`);
  console.log(`TRUST_SCORE_ADDRESS="${trustScoreAddress}"`);
  console.log(`COLLATERAL_MANAGER_ADDRESS="${collateralManagerAddress}"`);
  console.log(`INTEREST_RATE_MODEL_ADDRESS="${interestRateModelAddress}"`);

  console.log("\n=== Block Explorer ===");
  console.log(`View contracts: https://explorer.sepolia.mantle.xyz/address/${loanPlatformAddress}`);

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
    gasUsed: ethers.formatEther(totalCost) + " MNT",
    contracts: {
      LoanPlatform: loanPlatformAddress,
      TrustScore: trustScoreAddress,
      CollateralManager: collateralManagerAddress,
      InterestRateModel: interestRateModelAddress,
    },
  };

  const filename = `${deploymentsDir}/mantleSepolia-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✓ Deployment saved to: ${filename.replace(__dirname + "/../", "")}`);
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n" + "=".repeat(60));
    console.error("❌ DEPLOYMENT FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  });
