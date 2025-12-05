import { ethers } from 'ethers';
import { BaseAdapter } from './BaseAdapter';
import { Transaction, TransactionReceipt } from '../types/transaction';

export class LiquidatorEVMAdapter extends BaseAdapter {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor(rpcUrl: string, privateKey?: string) {
    super(rpcUrl);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
  }

  async registerLiquidator(
    protocolAddress: string,
    stablecoinAddress: string,
    bondAmount: string,
    abi: any[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const contract = new ethers.Contract(protocolAddress, abi, this.wallet);

    const stablecoin = new ethers.Contract(
      stablecoinAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.wallet
    );

    const approveTx = await stablecoin.approve(
      protocolAddress,
      ethers.parseEther(bondAmount)
    );
    await approveTx.wait();

    const registerTx = await contract.registerLiquidator(
      ethers.parseEther(bondAmount)
    );

    return registerTx.hash;
  }

  async createAuction(
    protocolAddress: string,
    loanId: number,
    collateralToken: string,
    collateralAmount: string,
    startPrice: string,
    minimumPrice: string,
    platformFee: number,
    abi: any[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const contract = new ethers.Contract(protocolAddress, abi, this.wallet);

    const tx = await contract.createAuction(
      loanId,
      collateralToken,
      ethers.parseEther(collateralAmount),
      ethers.parseEther(startPrice),
      ethers.parseEther(minimumPrice),
      platformFee
    );

    return tx.hash;
  }

  async activateAuction(
    protocolAddress: string,
    auctionId: number,
    abi: any[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const contract = new ethers.Contract(protocolAddress, abi, this.wallet);
    const tx = await contract.activateAuction(auctionId);

    return tx.hash;
  }

  async placeBid(
    protocolAddress: string,
    stablecoinAddress: string,
    auctionId: number,
    bidAmount: string,
    executionPlan: any,
    abi: any[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const contract = new ethers.Contract(protocolAddress, abi, this.wallet);

    const stablecoin = new ethers.Contract(
      stablecoinAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.wallet
    );

    const approveTx = await stablecoin.approve(
      protocolAddress,
      ethers.parseEther(bidAmount)
    );
    await approveTx.wait();

    const executionPlanEncoded = ethers.toBeHex(
      JSON.stringify(executionPlan)
    );

    const tx = await contract.placeBid(
      auctionId,
      ethers.parseEther(bidAmount),
      executionPlanEncoded
    );

    return tx.hash;
  }

  async executeAuction(
    protocolAddress: string,
    auctionId: number,
    transactionHash: string,
    abi: any[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const contract = new ethers.Contract(protocolAddress, abi, this.wallet);

    const hashBytes = ethers.getBytes(transactionHash);
    const tx = await contract.executeAuction(auctionId, hashBytes);

    return tx.hash;
  }

  async calculateCurrentPrice(
    protocolAddress: string,
    auctionId: number,
    abi: any[]
  ): Promise<string> {
    const contract = new ethers.Contract(protocolAddress, abi, this.provider);
    const price = await contract.calculateCurrentPrice(auctionId);

    return ethers.formatEther(price);
  }

  async getAuctionDetails(
    protocolAddress: string,
    auctionId: number,
    abi: any[]
  ): Promise<any> {
    const contract = new ethers.Contract(protocolAddress, abi, this.provider);
    const auction = await contract.auctions(auctionId);

    return {
      auctionId: auction.auctionId.toString(),
      loanId: auction.loanId.toString(),
      collateralToken: auction.collateralToken,
      collateralAmount: ethers.formatEther(auction.collateralAmount),
      startPrice: ethers.formatEther(auction.startPrice),
      minimumPrice: ethers.formatEther(auction.minimumPrice),
      currentPrice: ethers.formatEther(auction.currentPrice),
      status: auction.status,
      auctionStartTime: auction.auctionStartTime.toString(),
      auctionEndTime: auction.auctionEndTime.toString(),
      winnerAddress: auction.winnerAddress,
    };
  }

  async getLiquidatorStats(
    protocolAddress: string,
    liquidatorAddress: string,
    abi: any[]
  ): Promise<any> {
    const contract = new ethers.Contract(protocolAddress, abi, this.provider);
    const stats = await contract.getLiquidatorStats(liquidatorAddress);

    return {
      wallet: stats.wallet,
      status: stats.status,
      bondAmount: ethers.formatEther(stats.bondAmount),
      successfulLiquidations: stats.successfulLiquidations.toString(),
      totalLiquidations: stats.totalLiquidations.toString(),
      failureCount: stats.failureCount.toString(),
      suspensionScore: stats.suspensionScore.toString(),
      totalVolumeProcessed: ethers.formatEther(stats.totalVolumeProcessed),
      tier: stats.tier,
    };
  }

  async getActiveAuctions(
    protocolAddress: string,
    abi: any[]
  ): Promise<any[]> {
    const contract = new ethers.Contract(protocolAddress, abi, this.provider);
    const auctions = await contract.getActiveAuctions();

    return auctions.map((auction: any) => ({
      auctionId: auction.auctionId.toString(),
      loanId: auction.loanId.toString(),
      collateralAmount: ethers.formatEther(auction.collateralAmount),
      startPrice: ethers.formatEther(auction.startPrice),
      minimumPrice: ethers.formatEther(auction.minimumPrice),
      currentPrice: ethers.formatEther(auction.currentPrice),
      auctionEndTime: auction.auctionEndTime.toString(),
    }));
  }

  async getAuctionBids(
    protocolAddress: string,
    auctionId: number,
    abi: any[]
  ): Promise<any[]> {
    const contract = new ethers.Contract(protocolAddress, abi, this.provider);
    const bids = await contract.getAuctionBids(auctionId);

    return bids.map((bid: any) => ({
      bidId: bid.bidId.toString(),
      auctionId: bid.auctionId.toString(),
      liquidatorAddress: bid.liquidatorAddress,
      bidAmount: ethers.formatEther(bid.bidAmount),
      bidRound: bid.bidRound.toString(),
      status: bid.status,
      createdAt: bid.createdAt.toString(),
    }));
  }

  async markLiquidationFailed(
    protocolAddress: string,
    auctionId: number,
    liquidatorAddress: string,
    reason: string,
    abi: any[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const contract = new ethers.Contract(protocolAddress, abi, this.wallet);
    const tx = await contract.markLiquidationFailed(
      auctionId,
      liquidatorAddress,
      reason
    );

    return tx.hash;
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(tx: Partial<Transaction>): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    const transaction = await this.wallet.sendTransaction({
      to: tx.to,
      value: ethers.parseEther(tx.value || '0'),
      data: tx.data,
    });
    return transaction.hash;
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const tx = await this.provider.getTransaction(hash);
    if (!tx) return null;

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: ethers.formatEther(tx.value),
      data: tx.data,
      chainId: Number(tx.chainId),
      timestamp: new Date(),
    };
  }

  async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
    const receipt = await this.provider.getTransactionReceipt(hash);
    if (!receipt) return null;

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  async getTransactionCount(address: string): Promise<number> {
    return this.provider.getTransactionCount(address);
  }

  async getCode(address: string): Promise<string> {
    return this.provider.getCode(address);
  }

  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async callContract(contractAddress: string, abi: any[], method: string, params: any[]): Promise<any> {
    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    return contract[method](...params);
  }

  async estimateGas(to: string, value: string, data?: string): Promise<string> {
    const gasEstimate = await this.provider.estimateGas({
      to,
      value: ethers.parseEther(value),
      data,
    });
    return gasEstimate.toString();
  }

  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    if (!feeData.gasPrice) {
      throw new Error('Unable to fetch gas price');
    }
    return ethers.formatEther(feeData.gasPrice);
  }

  async validateNetwork(expectedChainId: number): Promise<boolean> {
    const network = await this.provider.getNetwork();
    return Number(network.chainId) === expectedChainId;
  }
}

