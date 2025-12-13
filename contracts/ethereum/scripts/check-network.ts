import { ethers } from 'ethers';

async function main() {
  console.log('🔍 Validating Network Connection...\n');

  try {
    // Get network info
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const network = await provider.getNetwork();
    console.log(`✅ Network: ${network.name}`);
    console.log(`✅ Chain ID: ${network.chainId}`);
    const rpcUrl = process.env.RPC_URL || 'Unknown';
    console.log(`✅ RPC URL: ${rpcUrl}\n`);

    // Optional: check a specific account balance (no Hardhat runtime required)
    const privateKey = process.env.PRIVATE_KEY;
    const signerAddressEnv = process.env.SIGNER_ADDRESS;

    const address = privateKey
      ? new ethers.Wallet(privateKey).address
      : signerAddressEnv || null;

    if (address) {
      const balance = await provider.getBalance(address);
      console.log(`👤 Address: ${address}`);
      console.log(`💰 Account Balance: ${ethers.formatEther(balance)} ETH\n`);

      if (balance < ethers.parseEther('0.1')) {
        console.warn('⚠️  WARNING: Low balance. You may not have enough ETH for deployment.');
        console.log('Get testnet ETH from: https://sepoliafaucet.com\n');
      }
    } else {
      console.log('ℹ️  No PRIVATE_KEY or SIGNER_ADDRESS provided; skipping balance check.');
      console.log('   Set PRIVATE_KEY (preferred) or SIGNER_ADDRESS to validate funds.\n');
    }
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    console.log(`⛽ Current Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei\n`);
    const expectedChainId = process.env.EXPECTED_CHAIN_ID || '11155111';
    if (network.chainId.toString() !== expectedChainId) {
      console.warn(`⚠️  WARNING: Expected chain ID ${expectedChainId}, but got ${network.chainId}`);
      console.log('Check your RPC_URL configuration\n');
    }

    console.log('✨ Network validation complete!\n');
    
  } catch (error: any) {
    console.error('❌ Network validation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
