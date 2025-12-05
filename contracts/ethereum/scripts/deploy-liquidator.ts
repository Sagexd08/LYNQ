import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying LYNQ Liquidator Protocol to Testnet...\n');

  const [deployer] = await ethers.getSigners();
  console.log(`📦 Deploying contracts with account: ${deployer.address}\n`);

  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance < ethers.parseEther('0.1')) {
    throw new Error('Insufficient balance to deploy contracts');
  }

  console.log('📋 Deploying USDC Stablecoin...');
  const USDCFactory = await ethers.getContractFactory('USDC');
  const usdc = await USDCFactory.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`✅ USDC deployed to: ${usdcAddress}\n`);

  console.log('🏛️  Deploying LiquidatorProtocol...');
  const LiquidatorProtocolFactory = await ethers.getContractFactory('LiquidatorProtocol');

  const treasuryAddress = deployer.address;

  const liquidatorProtocol = await LiquidatorProtocolFactory.deploy(
    usdcAddress,
    treasuryAddress
  );
  await liquidatorProtocol.waitForDeployment();
  const protocolAddress = await liquidatorProtocol.getAddress();
  console.log(`✅ LiquidatorProtocol deployed to: ${protocolAddress}\n`);

  console.log('💵 Minting test USDC...');
  const mintTx = await usdc.mint(deployer.address, ethers.parseUnits('100000', 6));
  await mintTx.wait();
  console.log('✅ Minted 100,000 USDC to deployer\n');

  console.log('📋 Deploying supporting contracts...');

  const TrustScoreFactory = await ethers.getContractFactory('TrustScore');
  const trustScore = await TrustScoreFactory.deploy();
  await trustScore.waitForDeployment();
  const trustScoreAddress = await trustScore.getAddress();
  console.log(`✅ TrustScore deployed to: ${trustScoreAddress}`);

  const CollateralManagerFactory = await ethers.getContractFactory('CollateralManager');
  const collateralManager = await CollateralManagerFactory.deploy();
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log(`✅ CollateralManager deployed to: ${collateralManagerAddress}`);

  const InterestRateModelFactory = await ethers.getContractFactory('InterestRateModel');
  const interestRateModel = await InterestRateModelFactory.deploy();
  await interestRateModel.waitForDeployment();
  const interestRateModelAddress = await interestRateModel.getAddress();
  console.log(`✅ InterestRateModel deployed to: ${interestRateModelAddress}\n`);

  console.log('🏦 Deploying LoanPlatform...');
  const LoanPlatformFactory = await ethers.getContractFactory('LoanPlatform');
  const loanPlatform = await LoanPlatformFactory.deploy(
    trustScoreAddress,
    collateralManagerAddress,
    interestRateModelAddress
  );
  await loanPlatform.waitForDeployment();
  const loanPlatformAddress = await loanPlatform.getAddress();
  console.log(`✅ LoanPlatform deployed to: ${loanPlatformAddress}\n`);

  console.log('⚡ Deploying FlashLoanProvider...');
  const FlashLoanProviderFactory = await ethers.getContractFactory('FlashLoanProvider');
  const flashLoanProvider = await FlashLoanProviderFactory.deploy(usdcAddress);
  await flashLoanProvider.waitForDeployment();
  const flashLoanProviderAddress = await flashLoanProvider.getAddress();
  console.log(`✅ FlashLoanProvider deployed to: ${flashLoanProviderAddress}\n`);

  console.log('📊 ═════════════════════════════════════════');
  console.log('   DEPLOYMENT SUMMARY');
  console.log('═════════════════════════════════════════');
  console.log(`\n🔗 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`\n📄 Contract Addresses:`);
  console.log(`   • LiquidatorProtocol: ${protocolAddress}`);
  console.log(`   • USDC Stablecoin:    ${usdcAddress}`);
  console.log(`   • LoanPlatform:       ${loanPlatformAddress}`);
  console.log(`   • TrustScore:         ${trustScoreAddress}`);
  console.log(`   • CollateralManager:  ${collateralManagerAddress}`);
  console.log(`   • InterestRateModel:  ${interestRateModelAddress}`);
  console.log(`   • FlashLoanProvider:  ${flashLoanProviderAddress}`);
  console.log(`   • Treasury:           ${treasuryAddress}`);
  console.log('\n═════════════════════════════════════════\n');

  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      liquidatorProtocol: protocolAddress,
      usdc: usdcAddress,
      loanPlatform: loanPlatformAddress,
      trustScore: trustScoreAddress,
      collateralManager: collateralManagerAddress,
      interestRateModel: interestRateModelAddress,
      flashLoanProvider: flashLoanProviderAddress,
      treasury: treasuryAddress,
    },
  };

  const fs = await import('fs');
  const path = await import('path');

  const deploymentsDir = path.resolve('./deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${deploymentsDir}/${network.name}-${new Date().getTime()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${filename}\n`);

  console.log('🧪 Testing Liquidator Registration...');
  try {

    const approveTx = await usdc.approve(protocolAddress, ethers.parseUnits('100000', 6));
    await approveTx.wait();
    console.log('   ✅ USDC approval successful');

    const registerTx = await liquidatorProtocol.registerLiquidator(ethers.parseEther('10'));
    const registerReceipt = await registerTx.wait();
    console.log(`   ✅ Liquidator registration successful (tx: ${registerReceipt?.hash})\n`);

    const stats = await liquidatorProtocol.getLiquidatorStats(deployer.address);
    console.log('📊 Liquidator Stats:');
    console.log(`   • Status: ${stats.status === 0 ? 'INACTIVE' : stats.status === 1 ? 'ACTIVE' : 'SUSPENDED'}`);
    console.log(`   • Bond Amount: ${ethers.formatEther(stats.bondAmount)} ETH`);
    console.log(`   • Successful Liquidations: ${stats.successfulLiquidations}`);
    console.log(`   • Total Liquidations: ${stats.totalLiquidations}\n`);
  } catch (error) {
    console.error('❌ Registration test failed:', error);
  }

  console.log('✨ Deployment complete!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
