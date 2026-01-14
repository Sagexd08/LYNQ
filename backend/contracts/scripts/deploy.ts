import hre from "hardhat";
const ethers = hre.ethers;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH/MNT");
    const loanTokenAddress = process.env.LOAN_TOKEN_ADDRESS || "";
    console.log("\n[1/2] Deploying CollateralVault...");
    const CollateralVault = await ethers.getContractFactory("CollateralVault");
    const collateralVault = await CollateralVault.deploy();
    await collateralVault.waitForDeployment();
    const vaultAddress = await collateralVault.getAddress();
    console.log("✓ CollateralVault deployed to:", vaultAddress);

    console.log("\n[2/2] Deploying LoanCore...");
    const LoanCore = await ethers.getContractFactory("LoanCore");
    const loanCore = await LoanCore.deploy();
    await loanCore.waitForDeployment();
    const loanCoreAddress = await loanCore.getAddress();
    console.log("✓ LoanCore deployed to:", loanCoreAddress);

    console.log("\n[3/3] Configuring contracts...");
    
    // Set LoanCore address in CollateralVault
    console.log("Setting LoanCore address in CollateralVault...");
    const tx1 = await collateralVault.setLoanCore(loanCoreAddress);
    await tx1.wait();
    console.log("✓ CollateralVault configured");

    // Set CollateralVault address in LoanCore
    console.log("Setting CollateralVault address in LoanCore...");
    const tx2 = await loanCore.setCollateralVault(vaultAddress);
    await tx2.wait();
    console.log("✓ LoanCore collateral vault configured");

    // Set loan token if provided
    if (loanTokenAddress) {
        console.log("Setting loan token address in LoanCore...");
        const tx3 = await loanCore.setLoanToken(loanTokenAddress);
        await tx3.wait();
        console.log("✓ Loan token configured:", loanTokenAddress);
    } else {
        console.log("⚠ Loan token not set. Call setLoanToken() on LoanCore after deployment.");
    }

    console.log("\n========== Deployment Summary ==========");
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
    console.log("Deployer:", deployer.address);
    console.log("LoanCore:", loanCoreAddress);
    console.log("CollateralVault:", vaultAddress);
    if (loanTokenAddress) {
        console.log("LoanToken:", loanTokenAddress);
    }
    console.log("=========================================\n");

    // Save deployment info
    const fs = require("fs");
    const deploymentsDir = __dirname + "/../deployments";
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentInfo = {
        network: network.name,
        chainId: Number(network.chainId),
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            LoanCore: loanCoreAddress,
            CollateralVault: vaultAddress,
            LoanToken: loanTokenAddress || null,
        },
    };

    const filename = `${deploymentsDir}/${network.name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✓ Deployment info saved to: ${filename.replace(__dirname + "/../", "")}`);

    console.log("\n=== Environment Variables ===");
    console.log("Add these to your backend .env file:\n");
    console.log(`LOAN_CORE_ADDRESS="${loanCoreAddress}"`);
    console.log(`COLLATERAL_VAULT_ADDRESS="${vaultAddress}"`);
    if (loanTokenAddress) {
        console.log(`LOAN_TOKEN_ADDRESS="${loanTokenAddress}"`);
    }
    console.log("\n");

    return {
        loanCore: loanCoreAddress,
        collateralVault: vaultAddress,
        loanToken: loanTokenAddress,
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
