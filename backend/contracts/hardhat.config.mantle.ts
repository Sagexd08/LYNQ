import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        // Mantle Sepolia Testnet - PRIMARY TARGET
        mantleSepolia: {
            url: process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz",
            accounts: [PRIVATE_KEY],
            chainId: 5003,
            gasPrice: 1000000000, // 1 gwei
        },
        // Keep others for reference
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "",
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        },
        amoy: {
            url: process.env.BLOCKCHAIN_RPC_URL_POLYGON || "",
            accounts: [PRIVATE_KEY],
            chainId: 80002,
        },
    },
    etherscan: {
        apiKey: {
            mantleSepolia: process.env.MANTLE_EXPLORER_API_KEY || "",
        },
        customChains: [
            {
                network: "mantleSepolia",
                chainId: 5003,
                urls: {
                    apiURL: "https://explorer.sepolia.mantle.xyz/api",
                    browserURL: "https://explorer.sepolia.mantle.xyz",
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
    },
};

export default config;
