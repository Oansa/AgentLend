import { z } from 'zod';
/**
 * Agent DID (Decentralized Identifier) format
 * Example: did:croo:agent123
 */
export declare const AgentDIDSchema: z.ZodString;
export type AgentDID = z.infer<typeof AgentDIDSchema>;
/**
 * Agent Credit Score data structure
 */
export declare const ACSScoreSchema: z.ZodObject<{
    agentDID: z.ZodString;
    score: z.ZodNumber;
    timestamp: z.ZodNumber;
    expiry: z.ZodNumber;
    signature: z.ZodOptional<z.ZodString>;
    factors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    agentDID: string;
    score: number;
    timestamp: number;
    expiry: number;
    signature?: string | undefined;
    factors?: Record<string, number> | undefined;
}, {
    agentDID: string;
    score: number;
    timestamp: number;
    expiry: number;
    signature?: string | undefined;
    factors?: Record<string, number> | undefined;
}>;
export type ACSScore = z.infer<typeof ACSScoreSchema>;
/**
 * Input data for score calculation
 */
export declare const ScoreInputSchema: z.ZodObject<{
    agentDID: z.ZodString;
    onChainData: z.ZodObject<{
        walletAddress: z.ZodString;
        transactionCount: z.ZodNumber;
        totalVolumeUSD: z.ZodNumber;
        uniqueCounterparties: z.ZodNumber;
        avgTransactionSizeUSD: z.ZodNumber;
        daysActive: z.ZodNumber;
        tokenDiversity: z.ZodNumber;
        defiInteractions: z.ZodNumber;
        lendingHistory: z.ZodOptional<z.ZodObject<{
            loansCount: z.ZodNumber;
            repaidOnTime: z.ZodNumber;
            defaulted: z.ZodNumber;
            totalBorrowedUSD: z.ZodNumber;
            totalRepaidUSD: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            loansCount: number;
            repaidOnTime: number;
            defaulted: number;
            totalBorrowedUSD: number;
            totalRepaidUSD: number;
        }, {
            loansCount: number;
            repaidOnTime: number;
            defaulted: number;
            totalBorrowedUSD: number;
            totalRepaidUSD: number;
        }>>;
        collateralHistory: z.ZodOptional<z.ZodObject<{
            totalDepositedUSD: z.ZodNumber;
            liquidationsCount: z.ZodNumber;
            currentCollateralUSD: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalDepositedUSD: number;
            liquidationsCount: number;
            currentCollateralUSD: number;
        }, {
            totalDepositedUSD: number;
            liquidationsCount: number;
            currentCollateralUSD: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        walletAddress: string;
        transactionCount: number;
        totalVolumeUSD: number;
        uniqueCounterparties: number;
        avgTransactionSizeUSD: number;
        daysActive: number;
        tokenDiversity: number;
        defiInteractions: number;
        lendingHistory?: {
            loansCount: number;
            repaidOnTime: number;
            defaulted: number;
            totalBorrowedUSD: number;
            totalRepaidUSD: number;
        } | undefined;
        collateralHistory?: {
            totalDepositedUSD: number;
            liquidationsCount: number;
            currentCollateralUSD: number;
        } | undefined;
    }, {
        walletAddress: string;
        transactionCount: number;
        totalVolumeUSD: number;
        uniqueCounterparties: number;
        avgTransactionSizeUSD: number;
        daysActive: number;
        tokenDiversity: number;
        defiInteractions: number;
        lendingHistory?: {
            loansCount: number;
            repaidOnTime: number;
            defaulted: number;
            totalBorrowedUSD: number;
            totalRepaidUSD: number;
        } | undefined;
        collateralHistory?: {
            totalDepositedUSD: number;
            liquidationsCount: number;
            currentCollateralUSD: number;
        } | undefined;
    }>;
    offChainData: z.ZodOptional<z.ZodObject<{
        reputationScore: z.ZodOptional<z.ZodNumber>;
        kycVerified: z.ZodDefault<z.ZodBoolean>;
        twitterFollowers: z.ZodOptional<z.ZodNumber>;
        githubContributions: z.ZodOptional<z.ZodNumber>;
        domainExpertise: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        kycVerified: boolean;
        reputationScore?: number | undefined;
        twitterFollowers?: number | undefined;
        githubContributions?: number | undefined;
        domainExpertise?: string[] | undefined;
    }, {
        reputationScore?: number | undefined;
        kycVerified?: boolean | undefined;
        twitterFollowers?: number | undefined;
        githubContributions?: number | undefined;
        domainExpertise?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    agentDID: string;
    onChainData: {
        walletAddress: string;
        transactionCount: number;
        totalVolumeUSD: number;
        uniqueCounterparties: number;
        avgTransactionSizeUSD: number;
        daysActive: number;
        tokenDiversity: number;
        defiInteractions: number;
        lendingHistory?: {
            loansCount: number;
            repaidOnTime: number;
            defaulted: number;
            totalBorrowedUSD: number;
            totalRepaidUSD: number;
        } | undefined;
        collateralHistory?: {
            totalDepositedUSD: number;
            liquidationsCount: number;
            currentCollateralUSD: number;
        } | undefined;
    };
    offChainData?: {
        kycVerified: boolean;
        reputationScore?: number | undefined;
        twitterFollowers?: number | undefined;
        githubContributions?: number | undefined;
        domainExpertise?: string[] | undefined;
    } | undefined;
}, {
    agentDID: string;
    onChainData: {
        walletAddress: string;
        transactionCount: number;
        totalVolumeUSD: number;
        uniqueCounterparties: number;
        avgTransactionSizeUSD: number;
        daysActive: number;
        tokenDiversity: number;
        defiInteractions: number;
        lendingHistory?: {
            loansCount: number;
            repaidOnTime: number;
            defaulted: number;
            totalBorrowedUSD: number;
            totalRepaidUSD: number;
        } | undefined;
        collateralHistory?: {
            totalDepositedUSD: number;
            liquidationsCount: number;
            currentCollateralUSD: number;
        } | undefined;
    };
    offChainData?: {
        reputationScore?: number | undefined;
        kycVerified?: boolean | undefined;
        twitterFollowers?: number | undefined;
        githubContributions?: number | undefined;
        domainExpertise?: string[] | undefined;
    } | undefined;
}>;
export type ScoreInput = z.infer<typeof ScoreInputSchema>;
/**
 * Score calculation response
 */
export declare const ScoreResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodObject<{
        agentDID: z.ZodString;
        score: z.ZodNumber;
        timestamp: z.ZodNumber;
        expiry: z.ZodNumber;
        signature: z.ZodOptional<z.ZodString>;
        factors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    }, {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    success: boolean;
    requestId: string;
    error?: string | undefined;
    data?: {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    } | undefined;
}, {
    timestamp: number;
    success: boolean;
    requestId: string;
    error?: string | undefined;
    data?: {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    } | undefined;
}>;
export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;
/**
 * Health check response
 */
export declare const HealthResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    timestamp: z.ZodNumber;
    version: z.ZodString;
    uptime: z.ZodNumber;
    checks: z.ZodObject<{
        redis: z.ZodBoolean;
        rpc: z.ZodBoolean;
        contracts: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        redis: boolean;
        rpc: boolean;
        contracts: boolean;
    }, {
        redis: boolean;
        rpc: boolean;
        contracts: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    version: string;
    timestamp: number;
    uptime: number;
    checks: {
        redis: boolean;
        rpc: boolean;
        contracts: boolean;
    };
}, {
    status: "healthy" | "degraded" | "unhealthy";
    version: string;
    timestamp: number;
    uptime: number;
    checks: {
        redis: boolean;
        rpc: boolean;
        contracts: boolean;
    };
}>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
/**
 * Metrics data
 */
export declare const MetricsDataSchema: z.ZodObject<{
    scoresGenerated: z.ZodNumber;
    scoresRequested: z.ZodNumber;
    avgScore: z.ZodNumber;
    avgResponseTimeMs: z.ZodNumber;
    errors: z.ZodNumber;
    activeAgents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    scoresGenerated: number;
    scoresRequested: number;
    avgScore: number;
    avgResponseTimeMs: number;
    errors: number;
    activeAgents: number;
}, {
    scoresGenerated: number;
    scoresRequested: number;
    avgScore: number;
    avgResponseTimeMs: number;
    errors: number;
    activeAgents: number;
}>;
export type MetricsData = z.infer<typeof MetricsDataSchema>;
/**
 * Job queue types for background score calculation
 */
export interface ScoreJobData {
    agentDID: AgentDID;
    walletAddress: string;
    requestId: string;
    priority: 'low' | 'normal' | 'high';
}
export interface ScoreJobResult {
    success: boolean;
    score?: ACSScore;
    error?: string;
}
/**
 * Webhook payload for score updates
 */
export declare const WebhookPayloadSchema: z.ZodObject<{
    event: z.ZodEnum<["score_updated", "score_expired", "score_invalidated"]>;
    agentDID: z.ZodString;
    score: z.ZodOptional<z.ZodObject<{
        agentDID: z.ZodString;
        score: z.ZodNumber;
        timestamp: z.ZodNumber;
        expiry: z.ZodNumber;
        signature: z.ZodOptional<z.ZodString>;
        factors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    }, {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    }>>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    agentDID: string;
    timestamp: number;
    event: "score_updated" | "score_expired" | "score_invalidated";
    score?: {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    } | undefined;
}, {
    agentDID: string;
    timestamp: number;
    event: "score_updated" | "score_expired" | "score_invalidated";
    score?: {
        agentDID: string;
        score: number;
        timestamp: number;
        expiry: number;
        signature?: string | undefined;
        factors?: Record<string, number> | undefined;
    } | undefined;
}>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
//# sourceMappingURL=index.d.ts.map