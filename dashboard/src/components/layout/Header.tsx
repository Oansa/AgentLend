import { Menu, Sun, Moon, Bell, LogOut, Wallet, ExternalLink } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useWallet } from '../../context/WalletContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme, network, setNetwork } = useStore();
  const { address, isConnected, isConnecting, chainId, balance, connect, disconnect, switchChain, formatAddress } = useWallet();

  const targetChainId = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111');
  const isWrongChain = isConnected && chainId !== targetChainId;

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchChain = async () => {
    await switchChain(targetChainId);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur border-b">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold hidden sm:block">AgentLend Protocol</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'testnet')}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="testnet">Base Sepolia</option>
            <option value="mainnet">Base Mainnet</option>
          </select>

          <button className="relative p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l">
            {isConnected ? (
              <div className="flex items-center gap-3">
                {isWrongChain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwitchChain}
                    className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                  >
                    <span className="text-xs">Wrong Chain</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}

                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium font-mono">{formatAddress(address || '')}</p>
                  {balance && (
                    <p className="text-xs text-muted-foreground">{parseFloat(balance).toFixed(4)} ETH</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="h-8"
                  aria-label="Disconnect wallet"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}