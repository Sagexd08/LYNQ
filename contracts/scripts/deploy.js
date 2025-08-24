// SPDX-License-Identifier: MIT
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying LYNQ Loan Platform to Ethereum...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy the LoanPlatform contract
  const LoanPlatform = await ethers.getContractFactory("LoanPlatform");
  console.log("Deploying LoanPlatform...");

  const loanPlatform = await LoanPlatform.deploy();
  await loanPlatform.deployed();

  console.log("LoanPlatform deployed to:", loanPlatform.address);
  console.log("Transaction hash:", loanPlatform.deployTransaction.hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await loanPlatform.deployTransaction.wait(5);

  // Verify contract on Etherscan (if not localhost)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: loanPlatform.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: loanPlatform.address,
    deployerAddress: deployer.address,
    transactionHash: loanPlatform.deployTransaction.hash,
    blockNumber: loanPlatform.deployTransaction.blockNumber,
    deployedAt: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\nDeployment info saved to: ${deploymentFile}`);
  console.log("\nDeployment completed successfully!");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
