import { createContext, useContext, useState, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  formatAddress: (addr: string) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Try MetaMask first
      await connectAsync({ connector: injected() });
    } catch (error) {
      console.error('Failed to connect:', error);
      try {
        // Fallback to WalletConnect
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
        if (projectId) {
          await connectAsync({ connector: walletConnect({ projectId, showQrModal: true }) });
        } else {
          alert('Please install MetaMask or configure WalletConnect project ID');
        }
      } catch (wcError) {
        console.error('WalletConnect failed:', wcError);
        alert('Failed to connect wallet. Please install MetaMask.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectAsync();
  };

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      await switchChainAsync({ chainId: targetChainId });
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  const formatAddr = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <WalletContext.Provider
      value={{
        address: address ?? null,
        isConnected,
        isConnecting,
        chainId: chainId ?? null,
        balance: balance ? (balance.value / 10n ** BigInt(balance.decimals)).toString() : null,
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchChain: handleSwitchChain,
        formatAddress: formatAddr,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}