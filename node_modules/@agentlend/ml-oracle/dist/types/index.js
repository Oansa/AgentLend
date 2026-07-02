"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookPayloadSchema = exports.MetricsDataSchema = exports.HealthResponseSchema = exports.ScoreResponseSchema = exports.ScoreInputSchema = exports.ACSScoreSchema = exports.AgentDIDSchema = void 0;
const zod_1 = require("zod");
/**
 * Agent DID (Decentralized Identifier) format
 * Example: did:croo:agent123
 */
exports.AgentDIDSchema = zod_1.z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/);
/**
 * Agent Credit Score data structure
 */
exports.ACSScoreSchema = zod_1.z.object({
    agentDID: exports.AgentDIDSchema,
    score: zod_1.z.number().int().min(300).max(900),
    timestamp: zod_1.z.number().int().positive(),
    expiry: zod_1.z.number().int().positive(),
    signature: zod_1.z.string().optional(),
    factors: zod_1.z.record(zod_1.z.number()).optional(),
});
/**
 * Input data for score calculation
 */
exports.ScoreInputSchema = zod_1.z.object({
    agentDID: exports.AgentDIDSchema,
    onChainData: zod_1.z.object({
        walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        transactionCount: zod_1.z.number().int().nonnegative(),
        totalVolumeUSD: zod_1.z.number().nonnegative(),
        uniqueCounterparties: zod_1.z.number().int().nonnegative(),
        avgTransactionSizeUSD: zod_1.z.number().nonnegative(),
        daysActive: zod_1.z.number().int().nonnegative(),
        tokenDiversity: zod_1.z.number().int().nonnegative(),
        defiInteractions: zod_1.z.number().int().nonnegative(),
        lendingHistory: zod_1.z.object({
            loansCount: zod_1.z.number().int().nonnegative(),
            repaidOnTime: zod_1.z.number().int().nonnegative(),
            defaulted: zod_1.z.number().int().nonnegative(),
            totalBorrowedUSD: zod_1.z.number().nonnegative(),
            totalRepaidUSD: zod_1.z.number().nonnegative(),
        }).optional(),
        collateralHistory: zod_1.z.object({
            totalDepositedUSD: zod_1.z.number().nonnegative(),
            liquidationsCount: zod_1.z.number().int().nonnegative(),
            currentCollateralUSD: zod_1.z.number().nonnegative(),
        }).optional(),
    }),
    offChainData: zod_1.z.object({
        reputationScore: zod_1.z.number().min(0).max(100).optional(),
        kycVerified: zod_1.z.boolean().default(false),
        twitterFollowers: zod_1.z.number().int().nonnegative().optional(),
        githubContributions: zod_1.z.number().int().nonnegative().optional(),
        domainExpertise: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
/**
 * Score calculation response
 */
exports.ScoreResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: exports.ACSScoreSchema.optional(),
    error: zod_1.z.string().optional(),
    requestId: zod_1.z.string(),
    timestamp: zod_1.z.number(),
});
/**
 * Health check response
 */
exports.HealthResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: zod_1.z.number(),
    version: zod_1.z.string(),
    uptime: zod_1.z.number(),
    checks: zod_1.z.object({
        redis: zod_1.z.boolean(),
        rpc: zod_1.z.boolean(),
        contracts: zod_1.z.boolean(),
    }),
});
/**
 * Metrics data
 */
exports.MetricsDataSchema = zod_1.z.object({
    scoresGenerated: zod_1.z.number().int().nonnegative(),
    scoresRequested: zod_1.z.number().int().nonnegative(),
    avgScore: zod_1.z.number().nonnegative(),
    avgResponseTimeMs: zod_1.z.number().nonnegative(),
    errors: zod_1.z.number().int().nonnegative(),
    activeAgents: zod_1.z.number().int().nonnegative(),
});
/**
 * Webhook payload for score updates
 */
exports.WebhookPayloadSchema = zod_1.z.object({
    event: zod_1.z.enum(['score_updated', 'score_expired', 'score_invalidated']),
    agentDID: exports.AgentDIDSchema,
    score: exports.ACSScoreSchema.optional(),
    timestamp: zod_1.z.number(),
});
//# sourceMappingURL=index.js.map