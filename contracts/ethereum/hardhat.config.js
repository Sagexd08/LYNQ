require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const getAccounts = () => {
  const selectedNetwork = process.env.HARDHAT_NETWORK || "hardhat";
  const hasPrivateKey = typeof process.env.PRIVATE_KEY === "string" && process.env.PRIVATE_KEY.trim().length > 0;
  const hasMnemonic = typeof process.env.MNEMONIC === "string" && process.env.MNEMONIC.trim().length > 0;
  const allowMnemonic = process.env.USE_MNEMONIC === "1" || process.env.USE_MNEMONIC === "true";
  if (selectedNetwork !== "hardhat" && selectedNetwork !== "localhost" && !hasPrivateKey && !hasMnemonic) {
    throw new Error(
      `Missing deployer credentials. Set PRIVATE_KEY (preferred) or MNEMONIC before deploying to '${selectedNetwork}'.`
    );
  }
  if (hasPrivateKey) return [process.env.PRIVATE_KEY.trim()];
  if (hasMnemonic) {
    if (!allowMnemonic) {
      throw new Error(
        "MNEMONIC is set but disabled by default. Set PRIVATE_KEY instead, or set USE_MNEMONIC=1 to explicitly allow mnemonic-based deployments."
      );
    }
    return { mnemonic: process.env.MNEMONIC.trim() };
  }
  return undefined;
};
module.exports = {
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
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http:
      chainId: 1337,
    },
    alfajores: {
      url:
        process.env.CELO_ALFAJORES_RPC_URL ||
        process.env.ALFAJORES_RPC_URL ||
        "https:
      accounts: getAccounts(),
      chainId: 44787,
    },
    celo: {
      url: process.env.CELO_RPC_URL || "https:
      accounts: getAccounts(),
      chainId: 42220,
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "",
      accounts: getAccounts(),
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL || process.env.MAINNET_RPC_URL || "",
      accounts: getAccounts(),
      chainId: 1,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000,
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      alfajores: process.env.CELOSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "",
      celo: process.env.CELOSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https:
          browserURL: "https:
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https:
          browserURL: "https:
        },
      },
    ],
  },
};
