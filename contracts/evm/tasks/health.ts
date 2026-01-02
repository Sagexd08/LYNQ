import { task } from "hardhat/config";

task("health", "Reports Hardhat environment health")
  .setAction(async (_, hre) => {
    console.log("🔧 Hardhat Health Check");
    console.log("Node:", process.version);
    console.log("Solidity:", hre.config.solidity?.version);

    
    await hre.run("compile");

    const accounts = await hre.ethers.getSigners();
    console.log("Accounts available:", accounts.length);
    console.log("First account:", accounts[0]?.address || "n/a");

    console.log("✅ EVM toolchain healthy");
  });