import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

type DeploymentFile = {
  chainId?: number;
  deployer?: string;
  contracts?: Record<string, string>;
};

async function main() {
  const networkName = hre.network.name;
  const deploymentsPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployment file not found: ${deploymentsPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentsPath, "utf8")) as DeploymentFile;
  const contracts = deployment.contracts || {};
  const deployer = deployment.deployer;

  // Minimal, explicit list to avoid accidental verifies.
  const verifyTargets: Array<{ name: string; address?: string; args: any[] }> = [
    { name: "LoanCore", address: contracts.LoanCore, args: [] },
    { name: "CollateralVault", address: contracts.CollateralVault, args: [] },
    { name: "ReputationPoints", address: contracts.ReputationPoints, args: [] },
    { name: "MockToken", address: contracts.MockToken, args: ["Mock Stablecoin", "mUSD"] },
    { name: "LiquidatorProtocol", address: contracts.LiquidatorProtocol, args: [contracts.MockToken, deployer].filter(Boolean) },
    { name: "CreditScoreVerifier", address: contracts.CreditScoreVerifier, args: [deployer].filter(Boolean) },
    { name: "SocialStaking", address: contracts.SocialStaking, args: [contracts.MockToken].filter(Boolean) }
  ];

  for (const target of verifyTargets) {
    if (!target.address) {
      console.log(`Skipping ${target.name}: missing address in deployment file`);
      continue;
    }

    console.log(`Verifying ${target.name} at ${target.address}...`);
    try {
      await hre.run("verify:verify", {
        address: target.address,
        constructorArguments: target.args
      });
      console.log(`Verified ${target.name}`);
    } catch (err: any) {
      const message = err?.message || String(err);
      // Common case: already verified.
      if (message.toLowerCase().includes("already verified")) {
        console.log(`${target.name} already verified`);
        continue;
      }
      console.log(`Failed to verify ${target.name}: ${message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
