import { AptosClient, AptosAccount, Types } from 'aptos';
import { BaseAdapter } from './BaseAdapter';
import { Transaction, TransactionReceipt } from '../types/transaction';

export class AptosAdapter extends BaseAdapter {
  private client: AptosClient;

  constructor(rpcUrl: string) {
    super(rpcUrl);
    this.client = new AptosClient(rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    const resources = await this.client.getAccountResources(address);
    const accountResource = resources.find(
      (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    );
    const balance = (accountResource?.data as any)?.coin?.value || '0';
    return (parseInt(balance) / 100000000).toString();
  }

  async sendTransaction(tx: Partial<Transaction>): Promise<string> {
    const account = AptosAccount.fromAptosAccountObject({
      privateKeyHex: process.env.APTOS_PRIVATE_KEY!,
    });

    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: '0x1::coin::transfer',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [tx.to, Math.floor(parseFloat(tx.value || '0') * 100000000)],
    };

    const txnRequest = await this.client.generateTransaction(account.address(), payload);
    const signedTxn = await this.client.signTransaction(account, txnRequest);
    const transactionRes = await this.client.submitTransaction(signedTxn);

    return transactionRes.hash;
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const tx = await this.client.getTransactionByHash(hash);
      return {
        hash: tx.hash,
        from: (tx as any).sender || '',
        to: '',
        value: '0',
        chainId: 'aptos-mainnet',
        timestamp: new Date(parseInt((tx as any).timestamp) / 1000),
      };
    } catch {
      return null;
    }
  }

  async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
    try {
      const tx = await this.client.getTransactionByHash(hash);
      return {
        hash: tx.hash,
        blockNumber: parseInt((tx as any).version),
        status: (tx as any).success || false,
        gasUsed: (tx as any).gas_used || '0',
      };
    } catch {
      return null;
    }
  }

  async getBlockNumber(): Promise<number> {
    const ledgerInfo = await this.client.getLedgerInfo();
    return parseInt(ledgerInfo.block_height);
  }
}
