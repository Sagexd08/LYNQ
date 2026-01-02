import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

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

  
  
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Mock Stablecoin", "mUSD");
  await mockToken.waitForDeployment();
  console.log("MockToken (Stablecoin) deployed to:", await mockToken.getAddress());

  const LiquidatorProtocol = await ethers.getContractFactory("LiquidatorProtocol");
  
  const liquidatorProtocol = await LiquidatorProtocol.deploy(
    await mockToken.getAddress(),
    deployer.address
  );
  await liquidatorProtocol.waitForDeployment();
  console.log("LiquidatorProtocol deployed to:", await liquidatorProtocol.getAddress());

  
  const CreditScoreVerifier = await ethers.getContractFactory("CreditScoreVerifier");
  const creditScoreVerifier = await CreditScoreVerifier.deploy(deployer.address);
  await creditScoreVerifier.waitForDeployment();
  console.log("CreditScoreVerifier deployed to:", await creditScoreVerifier.getAddress());

  
  const SocialStaking = await ethers.getContractFactory("SocialStaking");
  const socialStaking = await SocialStaking.deploy(await mockToken.getAddress());
  await socialStaking.waitForDeployment();
  console.log("SocialStaking deployed to:", await socialStaking.getAddress());

  
  await (await loanCore.setCollateralVault(await collateralVault.getAddress())).wait();
  await (await loanCore.setReputationPoints(await reputationPoints.getAddress())).wait();
  await (await loanCore.setSocialStaking(await socialStaking.getAddress())).wait();
  await (await loanCore.setCreditScoreVerifier(await creditScoreVerifier.getAddress())).wait();
  await (await socialStaking.setLoanCore(await loanCore.getAddress())).wait();

  
  await (await reputationPoints.transferOwnership(await loanCore.getAddress())).wait();

  console.log("Contracts wired successfully");

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("LoanCore:", await loanCore.getAddress());
  console.log("CollateralVault:", await collateralVault.getAddress());
  console.log("ReputationPoints:", await reputationPoints.getAddress());
  console.log("MockToken:", await mockToken.getAddress());
  console.log("LiquidatorProtocol:", await liquidatorProtocol.getAddress());
  console.log("CreditScoreVerifier:", await creditScoreVerifier.getAddress());
  console.log("SocialStaking:", await socialStaking.getAddress());

  const net = await ethers.provider.getNetwork();
  const deployment = {
    network: network.name,
    chainId: Number(net.chainId),
    deployer: deployer.address,
    contracts: {
      LoanCore: await loanCore.getAddress(),
      CollateralVault: await collateralVault.getAddress(),
      ReputationPoints: await reputationPoints.getAddress(),
      MockToken: await mockToken.getAddress(),
      LiquidatorProtocol: await liquidatorProtocol.getAddress(),
      CreditScoreVerifier: await creditScoreVerifier.getAddress(),
      SocialStaking: await socialStaking.getAddress(),
    },
    timestamp: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("\nWrote deployment file:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
