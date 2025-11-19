import * as fcl from '@onflow/fcl';
import { BaseAdapter } from './BaseAdapter';
import { Transaction, TransactionReceipt } from '../types/transaction';

export class FlowAdapter extends BaseAdapter {
  constructor(rpcUrl: string) {
    super(rpcUrl);
    fcl.config().put('accessNode.api', rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    const account = await fcl.account(address);
    return (account.balance / 100000000).toString();
  }

  async sendTransaction(tx: Partial<Transaction>): Promise<string> {
    const transactionId = await fcl.mutate({
      cadence: `
        import FungibleToken from 0x9a0766d93b6608b7
        import FlowToken from 0x7e60df042a9c0868
        
        transaction(amount: UFix64, to: Address) {
          prepare(signer: AuthAccount) {
            let vault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            let receiver = getAccount(to)
              .getCapability(/public/flowTokenReceiver)
              .borrow<&{FungibleToken.Receiver}>()
            vault!.withdraw(amount: amount)
            receiver!.deposit(from: <-vault)
          }
        }
      `,
      args: (arg: any, t: any) => [
        arg(tx.value, t.UFix64),
        arg(tx.to, t.Address),
      ],
      proposer: fcl.currentUser,
      payer: fcl.currentUser,
      authorizations: [fcl.currentUser],
      limit: 100,
    });

    await fcl.tx(transactionId).onceSealed();
    return transactionId;
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const tx = await fcl.tx(hash).onceSealed();
      return {
        hash,
        from: '',
        to: '',
        value: '0',
        chainId: 'flow-mainnet',
        timestamp: new Date(),
      };
    } catch {
      return null;
    }
  }

  async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
    try {
      const tx = await fcl.tx(hash).onceSealed();
      return {
        hash,
        blockNumber: 0,
        status: tx.status === 4,
        gasUsed: '0',
      };
    } catch {
      return null;
    }
  }

  async getBlockNumber(): Promise<number> {
    const block = await fcl.block();
    return block.height;
  }
}
