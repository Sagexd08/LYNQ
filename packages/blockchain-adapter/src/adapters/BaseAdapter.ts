import { Transaction, TransactionReceipt } from '../types/transaction';

export abstract class BaseAdapter {
  protected rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  abstract getBalance(address: string): Promise<string>;
  abstract sendTransaction(tx: Partial<Transaction>): Promise<string>;
  abstract getTransaction(hash: string): Promise<Transaction | null>;
  abstract getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;
  abstract getBlockNumber(): Promise<number>;
}
