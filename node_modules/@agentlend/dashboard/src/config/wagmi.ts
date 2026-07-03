import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, type Chain } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Define local Hardhat chain
const hardhat = defineChain({
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '31337');
const isLocal = chainId === 31337;

const chains = (isLocal ? [hardhat, sepolia, mainnet] : [sepolia, mainnet]) as [Chain, ...Chain[]];
const defaultChain = isLocal ? hardhat : sepolia;

const transports: Record<number, ReturnType<typeof http>> = {
  [hardhat.id]: http(import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'),
  [sepolia.id]: http(import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org'),
  [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
};

export const config = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    ...(projectId ? [walletConnect({ projectId, showQrModal: true })] : []),
  ],
  transports,
});

export const supportedChains = chains;
export const defaultChainConfig = defaultChain;