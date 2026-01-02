import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";
import "./tasks/health";


dotenv.config();

dotenv.config({ path: path.join(__dirname, "../../.env") });

type HardhatAccounts = string[] | { mnemonic: string } | undefined;

const getAccounts = (): HardhatAccounts => {
  const selectedNetwork = process.env.HARDHAT_NETWORK ?? "hardhat";
  const hasMnemonic = typeof process.env.MNEMONIC === "string" && process.env.MNEMONIC.trim().length > 0;
  const hasPrivateKey = typeof process.env.PRIVATE_KEY === "string" && process.env.PRIVATE_KEY.trim().length > 0;
  const allowMnemonic = process.env.USE_MNEMONIC === "1" || process.env.USE_MNEMONIC === "true";

  
  
  if (selectedNetwork !== "hardhat" && !hasMnemonic && !hasPrivateKey) {
    throw new Error(
      `Missing deployer credentials. Set PRIVATE_KEY (preferred) or MNEMONIC before deploying to '${selectedNetwork}'.`
    );
  }

  if (hasPrivateKey) return [process.env.PRIVATE_KEY!.trim()];

  if (hasMnemonic) {
    if (!allowMnemonic) {
      throw new Error(
        "MNEMONIC is set but disabled by default. Set PRIVATE_KEY instead, or set USE_MNEMONIC=1 to explicitly allow mnemonic-based deployments."
      );
    }
    return { mnemonic: process.env.MNEMONIC!.trim() };
  }

  
  return undefined;
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
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
      mantle: process.env.ETHERSCAN_API_KEY || "",
      mantleSepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
    ],
  },
};

export default config;
