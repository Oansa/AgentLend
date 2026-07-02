import { describe, it, expect } from 'vitest';
import { scoringEngine, ScoringEngine, SCORE_THRESHOLDS } from './scoringEngine.js';

describe('ScoringEngine', () => {
  const mockAgentDID = 'did:croo:testagent123';
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';

  const mockInput = {
    agentDID: mockAgentDID,
    walletAddress: mockWalletAddress,
    onChainData: {
      walletAddress: mockWalletAddress,
      transactionCount: 200,
      totalVolumeUSD: 500000,
      uniqueCounterparties: 50,
      avgTransactionSizeUSD: 2500,
      daysActive: 500,
      tokenDiversity: 10,
      defiInteractions: 80,
      lendingHistory: {
        loansCount: 10,
        repaidOnTime: 9,
        defaulted: 0,
        totalBorrowedUSD: 200000,
        totalRepaidUSD: 210000,
      },
      collateralHistory: {
        totalDepositedUSD: 300000,
        liquidationsCount: 0,
        currentCollateralUSD: 100000,
      },
    },
    offChainData: {
      reputationScore: 85,
      kycVerified: true,
      twitterFollowers: 5000,
      githubContributions: 200,
      domainExpertise: ['DeFi', 'Smart Contracts'],
    },
  };

  it('should calculate a valid score within bounds', async () => {
    const score = await scoringEngine.calculateScore(mockInput);

    expect(score.agentDID).toBe(mockAgentDID);
    expect(score.score).toBeGreaterThanOrEqual(300);
    expect(score.score).toBeLessThanOrEqual(900);
    expect(score.timestamp).toBeGreaterThan(0);
    expect(score.expiry).toBeGreaterThan(score.timestamp);
    expect(score.factors).toBeDefined();
  });

  it('should return higher score for better on-chain metrics', async () => {
    const goodInput = { ...mockInput, onChainData: { ...mockInput.onChainData, transactionCount: 500, totalVolumeUSD: 1000000 } };
    const poorInput = { ...mockInput, onChainData: { ...mockInput.onChainData, transactionCount: 10, totalVolumeUSD: 1000 } };

    const goodScore = await scoringEngine.calculateScore(goodInput);
    const poorScore = await scoringEngine.calculateScore(poorInput);

    expect(goodScore.score).toBeGreaterThan(poorScore.score);
  });

  it('should return higher score with good lending history', async () => {
    const goodLendingInput = {
      ...mockInput,
      onChainData: {
        ...mockInput.onChainData,
        lendingHistory: { loansCount: 20, repaidOnTime: 20, defaulted: 0, totalBorrowedUSD: 500000, totalRepaidUSD: 525000 },
      },
    };

    const badLendingInput = {
      ...mockInput,
      onChainData: {
        ...mockInput.onChainData,
        lendingHistory: { loansCount: 5, repaidOnTime: 2, defaulted: 3, totalBorrowedUSD: 100000, totalRepaidUSD: 40000 },
      },
    };

    const goodScore = await scoringEngine.calculateScore(goodLendingInput);
    const badScore = await scoringEngine.calculateScore(badLendingInput);

    expect(goodScore.score).toBeGreaterThan(badScore.score);
  });

  it('should return higher score with KYC verification', async () => {
    const kycInput = { ...mockInput, offChainData: { ...mockInput.offChainData, kycVerified: true } };
    const noKycInput = { ...mockInput, offChainData: { ...mockInput.offChainData, kycVerified: false } };

    const kycScore = await scoringEngine.calculateScore(kycInput);
    const noKycScore = await scoringEngine.calculateScore(noKycInput);

    expect(kycScore.score).toBeGreaterThan(noKycScore.score);
  });

  it('should categorize scores correctly', () => {
    expect(ScoringEngine.getScoreCategory(850)).toBe('Excellent');
    expect(ScoringEngine.getScoreCategory(750)).toBe('Good');
    expect(ScoringEngine.getScoreCategory(650)).toBe('Fair');
    expect(ScoringEngine.getScoreCategory(550)).toBe('Poor');
    expect(ScoringEngine.getScoreCategory(400)).toBe('Very Poor');
  });

  it('should return correct collateral ratios', () => {
    expect(ScoringEngine.getCollateralRatio(900)).toBe(1000); // 10%
    expect(ScoringEngine.getCollateralRatio(800)).toBe(1500); // 15%
    expect(ScoringEngine.getCollateralRatio(600)).toBe(2500); // 25%
    expect(ScoringEngine.getCollateralRatio(400)).toBe(4000); // 40%
  });
});