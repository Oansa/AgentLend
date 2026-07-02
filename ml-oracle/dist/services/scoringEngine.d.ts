import type { ScoreInput, ACSScore } from '../types/index.js';
export declare const SCORE_THRESHOLDS: {
    readonly EXCELLENT: 800;
    readonly GOOD: 700;
    readonly FAIR: 600;
    readonly POOR: 500;
};
export declare const SCORING_WEIGHTS: {
    readonly transactionActivity: 0.15;
    readonly volume: 0.2;
    readonly counterpartyDiversity: 0.1;
    readonly accountAge: 0.1;
    readonly tokenDiversity: 0.05;
    readonly defiEngagement: 0.1;
    readonly lendingHistory: 0.15;
    readonly reputation: 0.1;
    readonly kyc: 0.05;
    readonly socialProof: 0.1;
};
export declare class ScoringEngine {
    private provider;
    constructor();
    /**
     * Calculate ACS score for an agent based on on-chain and off-chain data
     */
    calculateScore(input: ScoreInput): Promise<ACSScore>;
    /**
     * Fetch on-chain data for a wallet address
     */
    private fetchOnChainData;
    private getMockOnChainData;
    /**
     * Calculate individual factor scores (0-100)
     */
    private calculateFactors;
    /**
     * Compute weighted final score from factors
     */
    private computeWeightedScore;
    private factorsToRecord;
    /**
     * Get score category label
     */
    static getScoreCategory(score: number): string;
    /**
     * Get collateral ratio for a score (basis points)
     */
    static getCollateralRatio(score: number): number;
}
export declare const scoringEngine: ScoringEngine;
//# sourceMappingURL=scoringEngine.d.ts.map