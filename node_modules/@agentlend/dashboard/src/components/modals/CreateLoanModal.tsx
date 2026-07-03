import { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { useWallet } from '../../context/WalletContext';
import { ethers } from 'ethers';

// Contract ABI for loan creation
const LENDING_POOL_ABI = [
  'function createLoan(bytes32 borrowerDID, uint256 principalAmount, uint256 interestRateBps, uint256 duration, address collateralToken) returns (uint256)',
  'event LoanCreated(uint256 indexed loanId, bytes32 indexed borrowerDID, address indexed lender, uint256 principalAmount, uint256 interestRateBps, uint256 duration, address collateralToken)',
];

// Common collateral tokens on Sepolia
const COLLATERAL_TOKENS = [
  { symbol: 'WETH', address: '0x7b79995e5f793A07Bc00c21412e50EcA099E0e5E', decimals: 18 },
  { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
  { symbol: 'DAI', address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', decimals: 18 },
];

interface LoanFormData {
  borrowerDID: string;
  principalAmount: string;
  interestRate: string;
  durationDays: string;
  collateralToken: string;
}

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (loanId: string) => void;
}

export function CreateLoanModal({ isOpen, onClose, onSuccess }: CreateLoanModalProps) {
  const { address, chainId, switchChain } = useWallet();
  const [formData, setFormData] = useState<LoanFormData>({
    borrowerDID: '',
    principalAmount: '',
    interestRate: '',
    durationDays: '90',
    collateralToken: COLLATERAL_TOKENS[0].address,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);

  const handleChange = (field: keyof LoanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.borrowerDID.match(/^did:croo:[a-zA-Z0-9_-]+$/)) {
      setError('Invalid Agent DID format. Must be: did:croo:agentname');
      return false;
    }
    const principal = parseFloat(formData.principalAmount);
    if (isNaN(principal) || principal <= 0) {
      setError('Principal amount must be a positive number');
      return false;
    }
    const rate = parseFloat(formData.interestRate);
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      setError('Interest rate must be between 0 and 100%');
      return false;
    }
    const duration = parseInt(formData.durationDays);
    if (isNaN(duration) || duration <= 0) {
      setError('Duration must be a positive number of days');
      return false;
    }
    if (!address) {
      setError('Please connect your wallet first');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check chain
      const targetChainId = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111');
      if (chainId !== targetChainId) {
        await switchChain(targetChainId);
        // Wait for chain switch
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get provider and signer
      if (!window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get contract address from env
      const lendingPoolAddress = import.meta.env.VITE_LENDING_POOL_ADDRESS;
      if (!lendingPoolAddress || lendingPoolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Lending pool contract address not configured. Set VITE_LENDING_POOL_ADDRESS in .env');
      }

      const contract = new ethers.Contract(lendingPoolAddress, LENDING_POOL_ABI, signer);

      // Convert values
      const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(formData.borrowerDID));
      const principalAmount = ethers.parseEther(formData.principalAmount); // Assuming ETH denomination
      const interestRateBps = BigInt(Math.round(parseFloat(formData.interestRate) * 100)); // Convert % to basis points
      const duration = BigInt(parseInt(formData.durationDays) * 24 * 60 * 60); // Convert days to seconds
      const collateralToken = formData.collateralToken;

      // Send transaction
      const tx = await contract.createLoan(
        didBytes32,
        principalAmount,
        interestRateBps,
        duration,
        collateralToken
      );

      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Parse LoanCreated event to get loan ID
      const loanCreatedEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'LoanCreated');

      const newLoanId = loanCreatedEvent?.args?.loanId?.toString() || receipt.hash;
      setLoanId(newLoanId);

      if (onSuccess) {
        onSuccess(newLoanId);
      }

      // Close after short delay to show success
      setTimeout(() => onClose(), 2000);

    } catch (err: any) {
      console.error('Loan creation failed:', err);
      setError(err.message || 'Failed to create loan. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-background rounded-xl border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Loan</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className={cn('p-3 rounded-lg text-sm flex items-center gap-2', 'bg-destructive/10 text-destructive border border-destructive/20')}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {txHash && !loanId && (
            <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-primary/10 text-primary border border-primary/20">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              <span>Transaction submitted: {txHash.slice(0, 10)}... waiting for confirmation...</span>
            </div>
          )}

          {loanId && (
            <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-green-100 text-green-700 border border-green-200">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Loan created! ID: {loanId}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Agent DID (Borrower)
            </label>
            <input
              type="text"
              value={formData.borrowerDID}
              onChange={(e) => handleChange('borrowerDID', e.target.value)}
              placeholder="did:croo:agent001"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">Format: did:croo:agentname</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Principal Amount (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.principalAmount}
              onChange={(e) => handleChange('principalAmount', e.target.value)}
              placeholder="1.5"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Interest Rate (% APR)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={formData.interestRate}
              onChange={(e) => handleChange('interestRate', e.target.value)}
              placeholder="12.5"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.durationDays}
              onChange={(e) => handleChange('durationDays', e.target.value)}
              placeholder="90"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Collateral Token
            </label>
            <select
              value={formData.collateralToken}
              onChange={(e) => handleChange('collateralToken', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            >
              {COLLATERAL_TOKENS.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol} ({token.address.slice(0, 10)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !address}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {txHash ? 'Confirming...' : 'Creating Loan...'}
                </>
              ) : (
                'Create Loan'
              )}
            </Button>
          </div>
        </form>

        {!address && (
          <div className="p-4 bg-muted/50 rounded-lg border text-center text-sm text-muted-foreground">
            <p>Connect your wallet to create a loan</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}