/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_LOAN_CORE_ADDRESS?: string;
  readonly VITE_COLLATERAL_VAULT_ADDRESS?: string;
  readonly VITE_BLOCKCHAIN_RPC_URL?: string;
  readonly VITE_CHAIN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
