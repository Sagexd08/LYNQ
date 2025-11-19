export const FLOW_NETWORKS = {
  MAINNET: {
    name: 'Flow Mainnet',
    accessApi: 'https://rest-mainnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
    network: 'mainnet' as const,
  },
  TESTNET: {
    name: 'Flow Testnet',
    accessApi: 'https://rest-testnet.onflow.org',
    discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
    network: 'testnet' as const,
  }
};

export const FLOW_CONTRACTS = {
  
  LOAN_PLATFORM: '0x0000000000000000',
};

export const FLOW_TOKENS = {
  FLOW: {
    symbol: 'FLOW',
    name: 'Flow',
    decimals: 8,
  }
};


