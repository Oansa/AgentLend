"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoringEngine = exports.ScoringEngine = exports.SCORING_WEIGHTS = exports.SCORE_THRESHOLDS = void 0;
const config_js_1 = require("../config.js");
const logger_js_1 = require("../utils/logger.js");
const ethers_1 = require("ethers");
exports.SCORE_THRESHOLDS = {
    EXCELLENT: 800,
    GOOD: 700,
    FAIR: 600,
    POOR: 500,
};
exports.SCORING_WEIGHTS = {
    transactionActivity: 0.15,
    volume: 0.20,
    counterpartyDiversity: 0.10,
    accountAge: 0.10,
    tokenDiversity: 0.05,
    defiEngagement: 0.10,
    lendingHistory: 0.15,
    reputation: 0.10,
    kyc: 0.05,
    socialProof: 0.10,
};
class ScoringEngine {
    provider = null;
    constructor() {
        if (config_js_1.config.RPC_URL) {
            try {
                this.provider = new ethers_1.ethers.JsonRpcProvider(config_js_1.config.RPC_URL);
                (0, logger_js_1.logger)().info({ rpcUrl: config_js_1.config.RPC_URL }, 'RPC provider initialized');
            }
            catch (error) {
                (0, logger_js_1.logger)().error({ error }, 'Failed to initialize RPC provider');
            }
        }
    }
    /**
     * Calculate ACS score for an agent based on on-chain and off-chain data
     */
    async calculateScore(input) {
        const startTime = Date.now();
        const requestId = `score_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        (0, logger_js_1.logger)().info({ agentDID: input.agentDID, requestId }, 'Starting ACS score calculation');
        try {
            // 1. Fetch on-chain data if not provided
            const onChainData = input.onChainData || await this.fetchOnChainData(input.walletAddress);
            // 2. Calculate individual factor scores (0-100 each)
            const factors = this.calculateFactors(onChainData, input.offChainData);
            // 3. Compute weighted score
            const rawScore = this.computeWeightedScore(factors);
            // 4. Apply bounds and rounding
            const finalScore = Math.round(Math.max(config_js_1.config.MIN_SCORE, Math.min(config_js_1.config.MAX_SCORE, rawScore)));
            // 5. Generate timestamp and expiry
            const timestamp = Math.floor(Date.now() / 1000);
            const expiry = timestamp + config_js_1.config.SCORE_VALIDITY_SECONDS;
            // 6. Create score object
            const score = {
                agentDID: input.agentDID,
                score: finalScore,
                timestamp,
                expiry,
                factors: this.factorsToRecord(factors),
            };
            const duration = Date.now() - startTime;
            (0, logger_js_1.logger)().info({ agentDID: input.agentDID, score: finalScore, duration, requestId }, 'ACS score calculated successfully');
            return score;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, logger_js_1.logger)().error({ agentDID: input.agentDID, error, duration, requestId }, 'ACS score calculation failed');
            throw error;
        }
    }
    /**
     * Fetch on-chain data for a wallet address
     */
    async fetchOnChainData(walletAddress) {
        if (!this.provider) {
            (0, logger_js_1.logger)().warn('No RPC provider available, using mock data');
            return this.getMockOnChainData(walletAddress);
        }
        try {
            // Get transaction count
            const txCount = await this.provider.getTransactionCount(walletAddress);
            // Get balance
            const balance = await this.provider.getBalance(walletAddress);
            // In production, you would use Alchemy/Moralis/Graph Protocol
            // to fetch comprehensive transaction history
            // For now, return mock data with real tx count
            return {
                walletAddress,
                transactionCount: txCount,
                totalVolumeUSD: Number(ethers_1.ethers.formatEther(balance)) * 2000, // Rough ETH price
                uniqueCounterparties: Math.min(txCount, 50),
                avgTransactionSizeUSD: 1000,
                daysActive: 365,
                tokenDiversity: 5,
                defiInteractions: Math.floor(txCount * 0.3),
                lendingHistory: {
                    loansCount: 3,
                    repaidOnTime: 3,
                    defaulted: 0,
                    totalBorrowedUSD: 50000,
                    totalRepaidUSD: 52000,
                },
                collateralHistory: {
                    totalDepositedUSD: 75000,
                    liquidationsCount: 0,
                    currentCollateralUSD: 25000,
                },
            };
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error, walletAddress }, 'Failed to fetch on-chain data, using mock');
            return this.getMockOnChainData(walletAddress);
        }
    }
    getMockOnChainData(walletAddress) {
        return {
            walletAddress,
            transactionCount: 150,
            totalVolumeUSD: 250000,
            uniqueCounterparties: 45,
            avgTransactionSizeUSD: 1667,
            daysActive: 400,
            tokenDiversity: 8,
            defiInteractions: 50,
            lendingHistory: {
                loansCount: 5,
                repaidOnTime: 5,
                defaulted: 0,
                totalBorrowedUSD: 100000,
                totalRepaidUSD: 105000,
            },
            collateralHistory: {
                totalDepositedUSD: 150000,
                liquidationsCount: 0,
                currentCollateralUSD: 50000,
            },
        };
    }
    /**
     * Calculate individual factor scores (0-100)
     */
    calculateFactors(onChain, offChain) {
        // Transaction Activity Score (0-100)
        // Based on transaction count and frequency
        const txScore = Math.min(100, (onChain.transactionCount / 500) * 100);
        // Volume Score (0-100)
        // Based on total USD volume
        const volumeScore = Math.min(100, (onChain.totalVolumeUSD / 1_000_000) * 100);
        // Counterparty Diversity Score (0-100)
        const counterpartyScore = Math.min(100, (onChain.uniqueCounterparties / 100) * 100);
        // Account Age Score (0-100)
        const ageScore = Math.min(100, (onChain.daysActive / 730) * 100); // 2 years = max
        // Token Diversity Score (0-100)
        const tokenScore = Math.min(100, (onChain.tokenDiversity / 20) * 100);
        // DeFi Engagement Score (0-100)
        const defiScore = Math.min(100, (onChain.defiInteractions / 200) * 100);
        // Lending History Score (0-100)
        let lendingScore = 50; // Neutral default
        if (onChain.lendingHistory && onChain.lendingHistory.loansCount > 0) {
            const { loansCount, repaidOnTime, defaulted } = onChain.lendingHistory;
            const repaymentRate = repaidOnTime / loansCount;
            const defaultRate = defaulted / loansCount;
            lendingScore = Math.max(0, Math.min(100, (repaymentRate * 100) - (defaultRate * 50)));
        }
        // Reputation Score (0-100) - from off-chain
        const reputationScore = offChain?.reputationScore ?? 50;
        // KYC Score (0-100)
        const kycScore = offChain?.kycVerified ? 100 : 0;
        // Social Proof Score (0-100)
        let socialScore = 0;
        if (offChain) {
            if (offChain.twitterFollowers && offChain.twitterFollowers > 1000)
                socialScore += 30;
            if (offChain.githubContributions && offChain.githubContributions > 100)
                socialScore += 40;
            if (offChain.domainExpertise && offChain.domainExpertise.length > 0)
                socialScore += 30;
        }
        socialScore = Math.min(100, socialScore);
        return {
            transactionActivity: txScore,
            volume: volumeScore,
            counterpartyDiversity: counterpartyScore,
            accountAge: ageScore,
            tokenDiversity: tokenScore,
            defiEngagement: defiScore,
            lendingHistory: lendingScore,
            reputation: reputationScore,
            kyc: kycScore,
            socialProof: socialScore,
        };
    }
    /**
     * Compute weighted final score from factors
     */
    computeWeightedScore(factors) {
        const weightedSum = factors.transactionActivity * exports.SCORING_WEIGHTS.transactionActivity +
            factors.volume * exports.SCORING_WEIGHTS.volume +
            factors.counterpartyDiversity * exports.SCORING_WEIGHTS.counterpartyDiversity +
            factors.accountAge * exports.SCORING_WEIGHTS.accountAge +
            factors.tokenDiversity * exports.SCORING_WEIGHTS.tokenDiversity +
            factors.defiEngagement * exports.SCORING_WEIGHTS.defiEngagement +
            factors.lendingHistory * exports.SCORING_WEIGHTS.lendingHistory +
            factors.reputation * exports.SCORING_WEIGHTS.reputation +
            factors.kyc * exports.SCORING_WEIGHTS.kyc +
            factors.socialProof * exports.SCORING_WEIGHTS.socialProof;
        // Scale from 0-100 to 300-900 range
        return 300 + (weightedSum * 6); // 300 + 600 * (weightedSum / 100)
    }
    factorsToRecord(factors) {
        return {
            transactionActivity: Math.round(factors.transactionActivity * 100) / 100,
            volume: Math.round(factors.volume * 100) / 100,
            counterpartyDiversity: Math.round(factors.counterpartyDiversity * 100) / 100,
            accountAge: Math.round(factors.accountAge * 100) / 100,
            tokenDiversity: Math.round(factors.tokenDiversity * 100) / 100,
            defiEngagement: Math.round(factors.defiEngagement * 100) / 100,
            lendingHistory: Math.round(factors.lendingHistory * 100) / 100,
            reputation: Math.round(factors.reputation * 100) / 100,
            kyc: Math.round(factors.kyc * 100) / 100,
            socialProof: Math.round(factors.socialProof * 100) / 100,
        };
    }
    /**
     * Get score category label
     */
    static getScoreCategory(score) {
        if (score >= exports.SCORE_THRESHOLDS.EXCELLENT)
            return 'Excellent';
        if (score >= exports.SCORE_THRESHOLDS.GOOD)
            return 'Good';
        if (score >= exports.SCORE_THRESHOLDS.FAIR)
            return 'Fair';
        if (score >= exports.SCORE_THRESHOLDS.POOR)
            return 'Poor';
        return 'Very Poor';
    }
    /**
     * Get collateral ratio for a score (basis points)
     */
    static getCollateralRatio(score) {
        if (score >= 900)
            return 1000; // 10%
        if (score >= 700)
            return 1500; // 15%
        if (score >= 500)
            return 2500; // 25%
        return 4000; // 40%
    }
}
exports.ScoringEngine = ScoringEngine;
exports.scoringEngine = new ScoringEngine();
//# sourceMappingURL=scoringEngine.js.map