import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    console.log("\nDeploying LoanCore...");
    const LoanCore = await ethers.getContractFactory("LoanCore");
    const loanCore = await LoanCore.deploy();
    await loanCore.waitForDeployment();
    const loanCoreAddress = await loanCore.getAddress();
    console.log("LoanCore deployed to:", loanCoreAddress);

    console.log("\nDeploying CollateralVault...");
    const CollateralVault = await ethers.getContractFactory("CollateralVault");
    const collateralVault = await CollateralVault.deploy();
    await collateralVault.waitForDeployment();
    const vaultAddress = await collateralVault.getAddress();
    console.log("CollateralVault deployed to:", vaultAddress);

    console.log("\nLinking contracts...");
    await loanCore.setCollateralVault(vaultAddress);
    await collateralVault.setLoanCore(loanCoreAddress);
    console.log("Contracts linked successfully");

    console.log("\n========== Deployment Summary ==========");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Deployer:", deployer.address);
    console.log("LoanCore:", loanCoreAddress);
    console.log("CollateralVault:", vaultAddress);
    console.log("=========================================\n");

    return {
        loanCore: loanCoreAddress,
        collateralVault: vaultAddress,
    };
}

main()
    .then((addresses) => {
        console.log("Deployment completed!");
        console.log("Update your .env with these addresses:");
        console.log(`LOAN_CORE_ADDRESS=${addresses.loanCore}`);
        console.log(`COLLATERAL_VAULT_ADDRESS=${addresses.collateralVault}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
