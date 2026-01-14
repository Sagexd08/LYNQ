# 🚀 Mantle Sepolia Deployment Guide

## Overview
This guide covers deploying LYNQ smart contracts to Mantle Sepolia testnet and configuring the backend.

## Prerequisites

### 1. Get Mantle Sepolia MNT (Testnet Tokens)
```bash
# Visit the Mantle Sepolia Faucet
https://faucet.sepolia.mantle.xyz/

# Or use the bridge
https://bridge.sepolia.mantle.xyz/
```

**Alternative Faucets:**
- ChainLink Faucet: https://faucets.chain.link/
- Alchemy Faucet: https://mantlesepolia-faucet.alchemy.com/

**Required Amount:**
- Minimum: 0.5 MNT for contract deployment
- Recommended: 1-2 MNT for testing

### 2. Wallet Setup
```bash
# Create a new wallet or use existing
# Get your private key from MetaMask:
# MetaMask → Account Details → Export Private Key

# Add to .env (NEVER commit this!)
PRIVATE_KEY=your-actual-private-key-here
```

### 3. RPC Configuration
Update `.env`:
```env
# Mantle Sepolia RPC URLs
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
BLOCKCHAIN_RPC_URL=https://rpc.sepolia.mantle.xyz

# Alternative RPC endpoints:
# https://rpc-sepolia.mantlechain.io
# wss://ws.sepolia.mantle.xyz
```

---

## 📝 Contract Deployment Steps

### Step 1: Install Dependencies
```bash
cd backend/contracts
pnpm install
```

### Step 2: Compile Contracts
```bash
pnpm run compile
# or
npx hardhat compile
```

**Expected Output:**
```
Compiled 5 Solidity files successfully
```

### Step 3: Verify Configuration
Check [hardhat.config.ts](backend/contracts/hardhat.config.ts):
```typescript
mantleSepolia: {
    url: process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz",
    accounts: [PRIVATE_KEY],
    chainId: 5003,
    gasPrice: 1000000000, // 1 gwei
},
```

### Step 4: Deploy Contracts
```bash
# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

**Expected Output:**
```
Deploying contracts to Mantle Sepolia...
CollateralVault deployed to: 0xAbC1234567890aBcDeF1234567890aBcDeF1234
LoanCore deployed to: 0xDeF1234567890aBcDeF1234567890aBcDeF5678
Deployment successful!
```

### Step 5: Update Environment Variables
Copy the deployed addresses to `.env`:
```env
LOAN_CORE_ADDRESS=0xDeF1234567890aBcDeF1234567890aBcDeF5678
COLLATERAL_VAULT_ADDRESS=0xAbC1234567890aBcDeF1234567890aBcDeF1234
```

### Step 6: Verify Contracts (Optional but Recommended)
```bash
# Verify CollateralVault
npx hardhat verify --network mantleSepolia <VAULT_ADDRESS>

# Verify LoanCore
npx hardhat verify --network mantleSepolia <LOAN_CORE_ADDRESS> <VAULT_ADDRESS>
```

**Check on Mantle Explorer:**
https://explorer.sepolia.mantle.xyz/

---

## 🔧 Backend Configuration

### Step 1: Update Environment Variables
Ensure your `.env` has:
```env
# Blockchain Configuration
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
BLOCKCHAIN_RPC_URL=https://rpc.sepolia.mantle.xyz

# Wallet
PRIVATE_KEY=your-actual-private-key

# Deployed Contracts
LOAN_CORE_ADDRESS=0x...  # From deployment
COLLATERAL_VAULT_ADDRESS=0x...  # From deployment
```

### Step 2: Test Blockchain Connection
```bash
cd backend
pnpm run start:dev
```

Check logs for:
```
[BlockchainService] Connected to network: mantle-sepolia (chainId: 5003)
```

### Step 3: Verify Contract Interaction
```bash
# Test in your application or use Postman
curl -X POST http://localhost:3000/api/v1/blockchain/test-connection
```

---

## 🧪 Testing

### Unit Tests
```bash
cd backend/contracts
npx hardhat test
```

### Integration Tests
```bash
# Test contract deployment
npx hardhat run scripts/deploy.ts --network mantleSepolia

# Test loan creation
npx hardhat run scripts/test-loan.ts --network mantleSepolia
```

### Manual Testing with Hardhat Console
```bash
npx hardhat console --network mantleSepolia
```

```javascript
// Get contract instance
const LoanCore = await ethers.getContractFactory("LoanCore");
const loanCore = await LoanCore.attach("0xYourLoanCoreAddress");

// Create a test loan
const tx = await loanCore.createLoan(
    ethers.parseEther("1.0"),  // 1 MNT
    500,  // 5% interest (500 basis points)
    30    // 30 days
);
await tx.wait();
console.log("Loan created:", tx.hash);
```

---

## 📊 Network Information

### Mantle Sepolia Testnet Details
- **Chain ID:** 5003
- **RPC URL:** https://rpc.sepolia.mantle.xyz
- **WebSocket:** wss://ws.sepolia.mantle.xyz
- **Explorer:** https://explorer.sepolia.mantle.xyz
- **Faucet:** https://faucet.sepolia.mantle.xyz

### Add to MetaMask
1. Open MetaMask → Networks → Add Network
2. Fill in:
   - **Network Name:** Mantle Sepolia
   - **RPC URL:** https://rpc.sepolia.mantle.xyz
   - **Chain ID:** 5003
   - **Currency Symbol:** MNT
   - **Block Explorer:** https://explorer.sepolia.mantle.xyz

---

## 🐛 Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:**
```bash
# Check your wallet balance
npx hardhat run scripts/check-balance.ts --network mantleSepolia

# Get more testnet MNT
# Visit: https://faucet.sepolia.mantle.xyz/
```

### Issue: "Contract already deployed"
**Solution:**
```bash
# Deploy with force flag or clean artifacts
rm -rf artifacts cache
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

### Issue: "Invalid nonce"
**Solution:**
```bash
# Reset account nonce
npx hardhat run scripts/reset-nonce.ts --network mantleSepolia
```

### Issue: "Connection timeout"
**Solution:**
```bash
# Try alternative RPC
MANTLE_SEPOLIA_RPC_URL=https://rpc-sepolia.mantlechain.io

# Or increase timeout in hardhat.config.ts
mantleSepolia: {
    url: process.env.MANTLE_SEPOLIA_RPC_URL,
    accounts: [PRIVATE_KEY],
    chainId: 5003,
    timeout: 60000, // 60 seconds
}
```

### Issue: Backend can't connect to blockchain
**Check:**
1. RPC URL is correct in `.env`
2. Private key is valid
3. Contract addresses are correct
4. Network has testnet MNT

```bash
# Test RPC connection
curl -X POST https://rpc.sepolia.mantle.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 📋 Post-Deployment Checklist

- [ ] Contracts deployed to Mantle Sepolia
- [ ] Contract addresses updated in `.env`
- [ ] Contracts verified on Mantle Explorer
- [ ] Backend successfully connects to contracts
- [ ] Test loan creation works
- [ ] Test collateral locking works
- [ ] Test repayment works
- [ ] Frontend can interact with contracts
- [ ] All environment variables configured
- [ ] Documentation updated with contract addresses

---

## 🔐 Security Reminders

1. **Never commit `.env` file with real private keys**
2. **Use separate wallets for testing and production**
3. **Regularly rotate API keys and secrets**
4. **Monitor deployed contracts for unusual activity**
5. **Keep deployment private keys in secure key management system**

---

## 📚 Additional Resources

- **Mantle Docs:** https://docs.mantle.xyz
- **Mantle Sepolia Faucet:** https://faucet.sepolia.mantle.xyz
- **Mantle Explorer:** https://explorer.sepolia.mantle.xyz
- **Hardhat Docs:** https://hardhat.org/docs
- **Ethers.js Docs:** https://docs.ethers.org

---

## 🎯 Quick Deploy Script

Save as `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 LYNQ Mantle Sepolia Deployment"
echo "================================="

# Check prerequisites
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$MANTLE_SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: MANTLE_SEPOLIA_RPC_URL not set in .env"
    exit 1
fi

echo "✅ Environment variables configured"

# Navigate to contracts directory
cd backend/contracts

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat clean
npx hardhat compile

# Deploy contracts
echo "🚀 Deploying to Mantle Sepolia..."
npx hardhat run scripts/deploy.ts --network mantleSepolia

echo "================================="
echo "✅ Deployment complete!"
echo "📝 Update your .env file with the contract addresses above"
```

Make executable and run:
```bash
chmod +x deploy.sh
./deploy.sh
```
