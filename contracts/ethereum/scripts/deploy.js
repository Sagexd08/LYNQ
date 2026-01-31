const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TrustScore
  console.log("\nDeploying TrustScore...");
  const TrustScore = await ethers.getContractFactory("TrustScore");
  const trustScore = await TrustScore.deploy(deployer.address);
  await trustScore.waitForDeployment();
  const trustScoreAddress = await trustScore.getAddress();
  console.log("TrustScore deployed to:", trustScoreAddress);

  // Deploy CollateralManager
  console.log("\nDeploying CollateralManager...");
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(deployer.address);
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("CollateralManager deployed to:", collateralManagerAddress);

  // Deploy InterestRateModel
  console.log("\nDeploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy(deployer.address);
  await interestRateModel.waitForDeployment();
  const interestRateModelAddress = await interestRateModel.getAddress();
  console.log("InterestRateModel deployed to:", interestRateModelAddress);

  // Deploy LoanPlatform
  console.log("\nDeploying LoanPlatform...");
  const LoanPlatform = await ethers.getContractFactory("LoanPlatform");
  const loanPlatform = await LoanPlatform.deploy(
    trustScoreAddress,
    collateralManagerAddress,
    interestRateModelAddress
  );
  await loanPlatform.waitForDeployment();
  const loanPlatformAddress = await loanPlatform.getAddress();
  console.log("LoanPlatform deployed to:", loanPlatformAddress);

  // Transfer ownership of supporting contracts to LoanPlatform
  console.log("\nTransferring ownership...");
  await trustScore.transferOwnership(loanPlatformAddress);
  await collateralManager.transferOwnership(loanPlatformAddress);
  console.log("Ownership transferred to LoanPlatform");

  console.log("\n=== Deployment Summary ===");
  console.log("TrustScore:", trustScoreAddress);
  console.log("CollateralManager:", collateralManagerAddress);
  console.log("InterestRateModel:", interestRateModelAddress);
  console.log("LoanPlatform:", loanPlatformAddress);
  console.log("\nSet these addresses in your frontend .env file:");
  console.log(`VITE_LOAN_PLATFORM_ADDRESS=${loanPlatformAddress}`);
  console.log(`VITE_TRUST_SCORE_ADDRESS=${trustScoreAddress}`);
  console.log(`VITE_COLLATERAL_MANAGER_ADDRESS=${collateralManagerAddress}`);
  console.log(`VITE_INTEREST_RATE_MODEL_ADDRESS=${interestRateModelAddress}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentsDir = __dirname + "/../deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    contracts: {
      LoanPlatform: loanPlatformAddress,
      TrustScore: trustScoreAddress,
      CollateralManager: collateralManagerAddress,
      InterestRateModel: interestRateModelAddress,
    },
  };

  const filename = `deployments/${network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

