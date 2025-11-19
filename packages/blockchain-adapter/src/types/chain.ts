export enum ChainType {
  EVM = 'evm',
  APTOS = 'aptos',
  FLOW = 'flow',
}

export interface ChainConfig {
  rpcUrl: string;
  chainId: number | string;
  type: ChainType;
}
