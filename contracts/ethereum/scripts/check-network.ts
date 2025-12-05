import { ethers } from 'hardhat';

async function main() {
  console.log('🔍 Validating Network Connection...\n');

  try {

    const network = await ethers.provider.getNetwork();
    console.log(`✅ Network: ${network.name}`);
    console.log(`✅ Chain ID: ${network.chainId}`);
    console.log(`✅ RPC URL: ${ethers.provider._getConnection().url}\n`);

    const [signer] = await ethers.getSigners();
    const address = signer.address;
    const balance = await ethers.provider.getBalance(address);

    console.log(`👤 Signer Address: ${address}`);
    console.log(`💰 Account Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance < ethers.parseEther('0.1')) {
      console.warn('⚠️  WARNING: Low balance. You may not have enough ETH for deployment.');
      console.log('Get testnet ETH from: https://sepoliafaucet.com\n');
    }

    const gasPrice = await ethers.provider.getGasPrice();
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
