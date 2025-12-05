import { ethers } from 'ethers';
import { BaseAdapter } from './BaseAdapter';
import { Transaction, TransactionReceipt } from '../types/transaction';
import { NETWORKS, getMantleRpcUrl, isMantleNetwork } from '../config/networks';

export class MantleAdapter extends BaseAdapter {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;

  constructor(rpcUrl?: string, isTestnet: boolean = false) {
    const url = rpcUrl || getMantleRpcUrl(isTestnet);
    super(url);
    this.provider = new ethers.JsonRpcProvider(url);
    this.chainId = isTestnet ? 5003 : 5000;
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(tx: Partial<Transaction>): Promise<string> {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);

    const transaction = await wallet.sendTransaction({
      to: tx.to,
      value: ethers.parseEther(tx.value || '0'),
      data: tx.data,
      type: 2,
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
      chainId: this.chainId,
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

  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  async estimateGas(tx: { to: string; data?: string; value?: string }): Promise<bigint> {
    return this.provider.estimateGas({
      to: tx.to,
      data: tx.data,
      value: tx.value ? ethers.parseEther(tx.value) : undefined,
    });
  }

  async waitForTransaction(hash: string, confirmations: number = 1): Promise<TransactionReceipt | null> {
    const receipt = await this.provider.waitForTransaction(hash, confirmations);
    if (!receipt) return null;

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  getChainId(): number {
    return this.chainId;
  }

  isTestnet(): boolean {
    return this.chainId === 5003;
  }

  getNetworkConfig() {
    return this.isTestnet() ? NETWORKS.mantleSepolia : NETWORKS.mantle;
  }

  getExplorerTxUrl(txHash: string): string {
    const config = this.getNetworkConfig();
    return `${config.explorerUrl}/tx/${txHash}`;
  }

  getExplorerAddressUrl(address: string): string {
    const config = this.getNetworkConfig();
    return `${config.explorerUrl}/address/${address}`;
  }
}

export function createMantleAdapter(isTestnet: boolean = false): MantleAdapter {
  return new MantleAdapter(undefined, isTestnet);
}
