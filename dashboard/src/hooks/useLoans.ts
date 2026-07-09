import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

// Lending Pool ABI with events
const LENDING_POOL_ABI = [
  'function getLoan(uint256 loanId) view returns (tuple(uint256 id, bytes32 borrowerDID, address lender, address principalToken, uint256 principalAmount, uint256 interestRateBps, uint256 startTime, uint256 maturity, address collateralToken, uint256 collateralAmount, uint8 status, uint256 repaidAmount, uint256 liquidatedAmount))',
  'function getBorrowerLoans(bytes32 borrowerDID) view returns (uint256[])',
  'function getLenderLoans(address lender) view returns (uint256[])',
  'function loanCounter() view returns (uint256)',
  'function getOutstanding(uint256 loanId) view returns (uint256)',
  'event LoanCreated(uint256 indexed loanId, bytes32 indexed borrowerDID, address indexed lender, uint256 principalAmount, uint256 interestRateBps, uint256 maturity, address collateralToken)',
];

// ERC20 ABI for token info
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

interface FormattedLoan {
  id: string;
  borrower: string;
  borrowerDID: string;
  lender: string;
  principal: number;
  interestRate: number;
  outstanding: number;
  collateralToken: string;
  collateralAmount: number;
  collateralValueUSD: number;
  status: 'Active' | 'Repaid' | 'Liquidated' | 'Defaulted' | 'Pending';
  score: number;
  maturity: string;
  startDate: string;
  healthFactor: number;
  txHash?: string; // Transaction hash for block explorer link
}

const LENDING_POOL_ADDRESS = import.meta.env.VITE_LENDING_POOL_ADDRESS || '';
const BASE_TOKEN_ADDRESS = import.meta.env.VITE_BASE_TOKEN_ADDRESS || '';
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111');

const STATUS_MAP = ['Active', 'Repaid', 'Liquidated', 'Defaulted'] as const;

export function useLoans() {
  const { address, chainId } = useWallet();
  const [loans, setLoans] = useState<FormattedLoan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    if (!address || chainId !== CHAIN_ID || !LENDING_POOL_ADDRESS || !window.ethereum) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider);

      // Query LoanCreated events to get transaction hashes for all loans
      const loanCreatedFilter = lendingPool.filters.LoanCreated();
      const events = await lendingPool.queryFilter(loanCreatedFilter, 0, 'latest');

      // Build map of loanId -> txHash
      const loanTxHashMap = new Map<number, string>();
      for (const event of events) {
        const parsedEvent = lendingPool.interface.parseLog(event);
        if (parsedEvent && parsedEvent.args) {
          const loanId = Number(parsedEvent.args.loanId);
          if (loanId > 0) {
            loanTxHashMap.set(loanId, event.transactionHash);
          }
        }
      }

      // Get loan counter to know how many loans exist
      const loanCounter = await lendingPool.loanCounter();
      const totalLoans = Number(loanCounter);

      if (totalLoans === 0) {
        setLoans([]);
        return;
      }

      // Get loans where user is lender
      const lenderLoanIds = await lendingPool.getLenderLoans(address);

      // Also check borrower loans if we have a DID
      // For now, fetch all loans by iterating (in production, use events/indexer)
      const allLoans: FormattedLoan[] = [];

      for (let i = 1; i <= totalLoans; i++) {
        try {
          const loan = await lendingPool.getLoan(i);

          if (loan.id === 0) continue;

          // Filter for loans where user is lender or borrower
          const isLender = loan.lender.toLowerCase() === address.toLowerCase();
          // Note: borrower is DID, not address - would need mapping

          if (!isLender && lenderLoanIds.length > 0) {
            const isInLenderLoans = lenderLoanIds.some((id: bigint) => Number(id) === i);
            if (!isInLenderLoans) continue;
          }

          const outstanding = await lendingPool.getOutstanding(i);

          // Fetch token info
          const principalToken = new ethers.Contract(loan.principalToken, ERC20_ABI, provider);
          const collateralToken = new ethers.Contract(loan.collateralToken, ERC20_ABI, provider);

          const [principalDecimals, collateralSymbol, collateralDecimals] = await Promise.all([
            principalToken.decimals(),
            collateralToken.symbol(),
            collateralToken.decimals(),
          ]);

          // Format loan
          const principal = Number(loan.principalAmount) / Math.pow(10, Number(principalDecimals));
          const outstandingFormatted = Number(outstanding) / Math.pow(10, Number(principalDecimals));
          const collateralAmount = Number(loan.collateralAmount) / Math.pow(10, Number(collateralDecimals));

          // Estimate collateral value (simplified - in production use price oracle)
          const collateralValueUSD = collateralAmount * 2000; // Assume $2000/ETH

          // Calculate health factor
          const healthFactor = outstandingFormatted > 0 ? (collateralValueUSD * 0.8) / outstandingFormatted : 999;

          // Calculate ACS score from collateral ratio (reverse engineer)
          // Score 900+ = 10%, 700+ = 15%, 500+ = 25%, <500 = 40%
          const ratio = (principal > 0) ? (collateralValueUSD / principal) * 100 : 0;
          let score = 750;
          if (ratio >= 40) score = 300;
          else if (ratio >= 25) score = 500;
          else if (ratio >= 15) score = 700;
          else score = 900;

          const formattedLoan: FormattedLoan = {
            id: `LN-${loan.id.toString().padStart(3, '0')}`,
            borrower: loan.lender, // We don't have borrower address from DID
            borrowerDID: ethers.hexlify(loan.borrowerDID),
            lender: loan.lender,
            principal,
            interestRate: Number(loan.interestRateBps) / 100,
            outstanding: outstandingFormatted,
            collateralToken: collateralSymbol,
            collateralAmount,
            collateralValueUSD,
            status: STATUS_MAP[loan.status] || 'Active',
            score,
            maturity: new Date(Number(loan.maturity) * 1000).toISOString().split('T')[0],
            startDate: new Date(Number(loan.startTime) * 1000).toISOString().split('T')[0],
            healthFactor: Math.round(healthFactor * 100) / 100,
            txHash: loanTxHashMap.get(Number(loan.id)),
          };

          allLoans.push(formattedLoan);
        } catch (e) {
          console.error(`Error fetching loan ${i}:`, e);
        }
      }

      setLoans(allLoans.sort((a, b) => b.principal - a.principal));
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to fetch loans from blockchain');
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchLoans();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLoans, 30000);
    return () => clearInterval(interval);
  }, [fetchLoans]);

  return { loans, isLoading, error, refetch: fetchLoans };
}

// Hook for creating loans with toast notifications
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CREATE_LOAN_ABI = [
  'function createLoan(bytes32 borrowerDID, address borrowerAddress, uint256 principalAmount, uint256 interestRateBps, uint256 duration, address collateralToken) returns (uint256)',
];

const ERC20_APPROVE_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
];

export function useCreateLoan() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      borrowerDID: string;
      principalAmount: string; // USDC amount as string
      interestRate: number; // percentage
      durationDays: number;
      collateralToken: string;
    }) => {
      if (!window.ethereum) throw new Error('No wallet detected');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, CREATE_LOAN_ABI, signer);
      const baseToken = new ethers.Contract(BASE_TOKEN_ADDRESS, ERC20_APPROVE_ABI, signer);

      const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(params.borrowerDID));
      const principalAmount = ethers.parseUnits(params.principalAmount, 6); // USDC 6 decimals
      const interestRateBps = BigInt(Math.round(params.interestRate * 100));
      const duration = BigInt(params.durationDays * 24 * 60 * 60);

      // 1. Approve USDC spending
      const currentAllowance = await baseToken.allowance(address, LENDING_POOL_ADDRESS);
      if (currentAllowance < principalAmount) {
        const approveTx = await baseToken.approve(LENDING_POOL_ADDRESS, principalAmount);
        await approveTx.wait();
      }

      // 2. Create loan
      const tx = await lendingPool.createLoan(
        didBytes32,
        address, // borrowerAddress - the caller's wallet address
        principalAmount,
        interestRateBps,
        duration,
        params.collateralToken
      );

      const receipt = await tx.wait();

      // Parse loan ID from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return lendingPool.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === 'LoanCreated');

      return {
        loanId: event?.args?.loanId?.toString() || receipt.hash,
        txHash: receipt.hash,
      };
    },
    onSuccess: (data) => {
      toast.success(`Loan created successfully! Loan ID: ${data.loanId}`, {
        duration: 5000,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${data.txHash}`, '_blank'),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create loan: ${error.message}`, {
        duration: 8000,
      });
    },
  });
}