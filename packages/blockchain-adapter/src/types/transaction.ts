export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  chainId: number | string;
  timestamp: Date;
}

export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  status: boolean;
  gasUsed: string;
}
