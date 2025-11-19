import { ethers } from "hardhat";

async function main() {
  console.log("Deploying LYNQ contracts...");

  const LoanCore = await ethers.getContractFactory("LoanCore");
  const loanCore = await LoanCore.deploy();
  await loanCore.waitForDeployment();
  console.log("LoanCore deployed to:", await loanCore.getAddress());

  const CollateralVault = await ethers.getContractFactory("CollateralVault");
  const collateralVault = await CollateralVault.deploy();
  await collateralVault.waitForDeployment();
  console.log("CollateralVault deployed to:", await collateralVault.getAddress());

  const ReputationPoints = await ethers.getContractFactory("ReputationPoints");
  const reputationPoints = await ReputationPoints.deploy();
  await reputationPoints.waitForDeployment();
  console.log("ReputationPoints deployed to:", await reputationPoints.getAddress());

  await loanCore.setCollateralVault(await collateralVault.getAddress());
  console.log("Contracts linked successfully");

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("LoanCore:", await loanCore.getAddress());
  console.log("CollateralVault:", await collateralVault.getAddress());
  console.log("ReputationPoints:", await reputationPoints.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
