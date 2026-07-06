import { ethers } from 'ethers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollateralRatio, getScoreLabel } from './utils';

// Contract ABIs (simplified for demo)
const LENDING_POOL_ABI = [
  'function loanCounter() view returns (uint256)',
  'function getLoan(uint256 loanId) view returns (tuple)',
  'function createLoan(bytes32 borrowerDID, uint256 principalAmount, uint256 interestRateBps, uint256 duration, address collateralToken)',
  'function repayLoan(uint256 loanId)',
];

const ACS_ORACLE_ABI = [
  'function getScore(bytes32 agentDID) view returns (uint256 score, uint256 timestamp, uint256 expiry)',
  'function hasValidScore(bytes32 agentDID) view returns (bool)',
  'function getCollateralRatio(uint256 score) view returns (uint256)',
];

// Hook for fetching loan details from blockchain
export function useLoan(loanId: bigint | string, lendingPoolAddress?: string) {
  const loanIdBigInt = typeof loanId === 'string' ? BigInt(loanId) : loanId;

  return useQuery({
    queryKey: ['loan', loanId?.toString()],
    queryFn: async () => {
      if (!lendingPoolAddress || !window.ethereum) {
        // Return mock data for demo
        return {
          id: loanIdBigInt,
          borrowerDID: 'did:croo:agent001',
          lender: '0x1234...5678',
          principalAmount: 100000n,
          interestRateBps: 1000n,
          status: 0,
          collateralAmount: 15000n,
        };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(lendingPoolAddress, LENDING_POOL_ABI, provider);
      const loan = await contract.getLoan(loanIdBigInt);

      return {
        id: loan.id,
        borrowerDID: loan.borrowerDID,
        lender: loan.lender,
        principalAmount: loan.principalAmount,
        interestRateBps: loan.interestRateBps,
        status: loan.status,
        collateralAmount: loan.collateralAmount,
      };
    },
    enabled: !!loanId,
  });
}

// Hook for fetching ACS score
export function useACSScore(agentDID: string, acsOracleAddress?: string) {
  return useQuery({
    queryKey: ['acs-score', agentDID],
    queryFn: async () => {
      if (!acsOracleAddress || !window.ethereum) {
        // Return mock score for demo
        return {
          score: 750,
          timestamp: Math.floor(Date.now() / 1000),
          expiry: Math.floor(Date.now() / 1000) + 600,
          collateralRatio: getCollateralRatio(750),
          label: getScoreLabel(750),
        };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(acsOracleAddress, ACS_ORACLE_ABI, provider);
      const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(agentDID));
      const [score, timestamp, expiry] = await contract.getScore(didBytes32);

      return {
        score: Number(score),
        timestamp: Number(timestamp),
        expiry: Number(expiry),
        collateralRatio: getCollateralRatio(Number(score)),
        label: getScoreLabel(Number(score)),
      };
    },
    enabled: !!agentDID,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Hook for creating a loan
export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      borrowerDID,
      principalAmount,
      interestRateBps,
      duration,
      collateralToken,
      lendingPoolAddress,
    }: {
      borrowerDID: string;
      principalAmount: bigint;
      interestRateBps: bigint;
      duration: bigint;
      collateralToken: string;
      lendingPoolAddress: string;
    }) => {
      if (!window.ethereum) {
        throw new Error('No wallet connected');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(lendingPoolAddress, LENDING_POOL_ABI, signer);

      const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(borrowerDID));
      const tx = await contract.createLoan(
        didBytes32,
        principalAmount,
        interestRateBps,
        duration,
        collateralToken
      );

      return tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

// Hook for fetching protocol statistics
export function useProtocolStats() {
  return useQuery({
    queryKey: ['protocol-stats'],
    queryFn: async () => {
      // In production, this would aggregate from smart contracts
      return {
        totalValueLocked: 2400000,
        activeLoans: 1234,
        uniqueAgents: 567,
        avgScore: 742,
        defaultRate: 0.8,
      };
    },
    refetchInterval: 30000,
  });
}

// Hook for fetching recent loans
export function useRecentLoans(limit = 10) {
  return useQuery({
    queryKey: ['recent-loans', limit],
    queryFn: async () => {
      // In production, this would fetch from contracts or subgraph
      return Array.from({ length: limit }, (_, i) => ({
        id: i + 1,
        borrowerDID: `did:croo:agent${String(i + 1).padStart(3, '0')}`,
        amount: 50000 + Math.random() * 50000,
        rate: 10 + Math.random() * 10,
        status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Repaid' : 'Liquidated',
        score: 400 + Math.random() * 500,
        collateralRatio: 15,
      }));
    },
    staleTime: 60000,
  });
}