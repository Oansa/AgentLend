/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_LENDING_POOL_ADDRESS: string;
  readonly VITE_ACS_ORACLE_ADDRESS: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_CHAIN_NAME: string;
  readonly VITE_RPC_URL: string;
  readonly VITE_BLOCK_EXPLORER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}