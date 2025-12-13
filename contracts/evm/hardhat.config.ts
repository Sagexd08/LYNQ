import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";
import "./tasks/health";

// Load environment variables from local .env file
dotenv.config();
// Load environment variables from root .env file (if not found locally)
dotenv.config({ path: path.join(__dirname, "../../.env") });

type HardhatAccounts = string[] | { mnemonic: string } | undefined;

const getAccounts = (): HardhatAccounts => {
  const selectedNetwork = process.env.HARDHAT_NETWORK ?? "hardhat";
  const hasMnemonic = typeof process.env.MNEMONIC === "string" && process.env.MNEMONIC.trim().length > 0;
  const hasPrivateKey = typeof process.env.PRIVATE_KEY === "string" && process.env.PRIVATE_KEY.trim().length > 0;

  // Never silently deploy from a known fallback key.
  // If a non-local network is selected, require explicit credentials.
  if (selectedNetwork !== "hardhat" && !hasMnemonic && !hasPrivateKey) {
    throw new Error(
      `Missing deployer credentials. Set PRIVATE_KEY (preferred) or MNEMONIC before deploying to '${selectedNetwork}'.`
    );
  }

  if (hasMnemonic) return { mnemonic: process.env.MNEMONIC!.trim() };
  if (hasPrivateKey) return [process.env.PRIVATE_KEY!.trim()];

  // Local hardhat network can use its default generated accounts.
  return undefined;
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    root: "./",
  },
  networks: {
    hardhat: {},
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || "",
      accounts: getAccounts(),
      chainId: 1,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "",
      accounts: getAccounts(),
      chainId: 137,
    },
    bsc: {
      url: process.env.BSC_RPC_URL || "",
      accounts: getAccounts(),
      chainId: 56,
    },
    mantle: {
      url: process.env.MANTLE_RPC_URL || "https://rpc.mantle.xyz",
      accounts: getAccounts(),
      chainId: 5000,
    },
    mantleSepolia: {
      url: process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz",
      accounts: getAccounts(),
      chainId: 5003,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
    },
  },
};

export default config;
