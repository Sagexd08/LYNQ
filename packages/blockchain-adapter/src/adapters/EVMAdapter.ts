import { ethers } from 'ethers';
import { BaseAdapter } from './BaseAdapter';
import { Transaction, TransactionReceipt } from '../types/transaction';

export class EVMAdapter extends BaseAdapter {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    super(rpcUrl);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
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
}
