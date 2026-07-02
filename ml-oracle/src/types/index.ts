import { z } from 'zod';

/**
 * Agent DID (Decentralized Identifier) format
 * Example: did:croo:agent123
 */
export const AgentDIDSchema = z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/);
export type AgentDID = z.infer<typeof AgentDIDSchema>;

/**
 * Agent Credit Score data structure
 */
export const ACSScoreSchema = z.object({
  agentDID: AgentDIDSchema,
  score: z.number().int().min(300).max(900),
  timestamp: z.number().int().positive(),
  expiry: z.number().int().positive(),
  signature: z.string().optional(),
  factors: z.record(z.number()).optional(),
});

export type ACSScore = z.infer<typeof ACSScoreSchema>;

/**
 * Input data for score calculation
 */
export const ScoreInputSchema = z.object({
  agentDID: AgentDIDSchema,
  onChainData: z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    transactionCount: z.number().int().nonnegative(),
    totalVolumeUSD: z.number().nonnegative(),
    uniqueCounterparties: z.number().int().nonnegative(),
    avgTransactionSizeUSD: z.number().nonnegative(),
    daysActive: z.number().int().nonnegative(),
    tokenDiversity: z.number().int().nonnegative(),
    defiInteractions: z.number().int().nonnegative(),
    lendingHistory: z.object({
      loansCount: z.number().int().nonnegative(),
      repaidOnTime: z.number().int().nonnegative(),
      defaulted: z.number().int().nonnegative(),
      totalBorrowedUSD: z.number().nonnegative(),
      totalRepaidUSD: z.number().nonnegative(),
    }).optional(),
    collateralHistory: z.object({
      totalDepositedUSD: z.number().nonnegative(),
      liquidationsCount: z.number().int().nonnegative(),
      currentCollateralUSD: z.number().nonnegative(),
    }).optional(),
  }),
  offChainData: z.object({
    reputationScore: z.number().min(0).max(100).optional(),
    kycVerified: z.boolean().default(false),
    twitterFollowers: z.number().int().nonnegative().optional(),
    githubContributions: z.number().int().nonnegative().optional(),
    domainExpertise: z.array(z.string()).optional(),
  }).optional(),
});

export type ScoreInput = z.infer<typeof ScoreInputSchema>;

/**
 * Score calculation response
 */
export const ScoreResponseSchema = z.object({
  success: z.boolean(),
  data: ACSScoreSchema.optional(),
  error: z.string().optional(),
  requestId: z.string(),
  timestamp: z.number(),
});

export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;

/**
 * Health check response
 */
export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.number(),
  version: z.string(),
  uptime: z.number(),
  checks: z.object({
    redis: z.boolean(),
    rpc: z.boolean(),
    contracts: z.boolean(),
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * Metrics data
 */
export const MetricsDataSchema = z.object({
  scoresGenerated: z.number().int().nonnegative(),
  scoresRequested: z.number().int().nonnegative(),
  avgScore: z.number().nonnegative(),
  avgResponseTimeMs: z.number().nonnegative(),
  errors: z.number().int().nonnegative(),
  activeAgents: z.number().int().nonnegative(),
});

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
export const WebhookPayloadSchema = z.object({
  event: z.enum(['score_updated', 'score_expired', 'score_invalidated']),
  agentDID: AgentDIDSchema,
  score: ACSScoreSchema.optional(),
  timestamp: z.number(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;