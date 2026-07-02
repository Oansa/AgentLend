import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { scoringEngine } from './scoringEngine.js';
import { blockchainService } from './blockchainService.js';
import { enqueueScoreCalculation, getJobStatus, getQueueStats, initializeQueue, shutdownQueue } from './queueService.js';
import type { ScoreInput, ACSScore, AgentDID, ScoreResponse, HealthResponse, MetricsData, WebhookPayload } from '../types/index.js';

class MetricsCollector {
  private scoresGenerated = 0;
  private scoresRequested = 0;
  private totalResponseTime = 0;
  private errors = 0;
  private activeAgents = new Set<string>();
  private startTime = Date.now();

  recordRequest(responseTimeMs: number): void {
    this.scoresRequested++;
    this.totalResponseTime += responseTimeMs;
  }

  recordSuccess(agentDID: AgentDID): void {
    this.scoresGenerated++;
    this.activeAgents.add(agentDID);
  }

  recordError(): void {
    this.errors++;
  }

  getMetrics(): MetricsData {
    return {
      scoresGenerated: this.scoresGenerated,
      scoresRequested: this.scoresRequested,
      avgScore: 0, // Would need to track scores for average
      avgResponseTimeMs: this.scoresRequested > 0 ? this.totalResponseTime / this.scoresRequested : 0,
      errors: this.errors,
      activeAgents: this.activeAgents.size,
    };
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

const metrics = new MetricsCollector();

export class OracleService {
  async calculateScore(input: ScoreInput): Promise<ScoreResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    metrics.recordRequest(0); // Will update after

    try {
      logger().info({ agentDID: input.agentDID, requestId }, 'Score calculation requested');

      const score = await scoringEngine.calculateScore(input);

      metrics.recordSuccess(input.agentDID);
      metrics.recordRequest(Date.now() - startTime);

      const response: ScoreResponse = {
        success: true,
        data: score,
        requestId,
        timestamp: Date.now(),
      };

      logger().info({ agentDID: input.agentDID, score: score.score, requestId }, 'Score calculated successfully');
      return response;
    } catch (error) {
      metrics.recordError();
      metrics.recordRequest(Date.now() - startTime);

      logger().error({ error, agentDID: input.agentDID, requestId }, 'Score calculation failed');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: Date.now(),
      };
    }
  }

  async enqueueScore(input: ScoreInput, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<{ requestId: string; jobId: string }> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const jobId = await enqueueScoreCalculation({
      agentDID: input.agentDID,
      walletAddress: input.walletAddress,
      requestId,
      priority,
    });

    metrics.recordRequest(0);

    return { requestId, jobId };
  }

  async getJobStatus(jobId: string) {
    return await getJobStatus(jobId);
  }

  async getHealth(): Promise<HealthResponse> {
    const redisHealthy = true; // Would check Redis connection
    const rpcHealthy = await blockchainService.healthCheck();
    const contractsHealthy = blockchainService.isConfigured();

    const status = redisHealthy && rpcHealthy && contractsHealthy
      ? 'healthy'
      : redisHealthy && rpcHealthy
      ? 'degraded'
      : 'unhealthy';

    return {
      status,
      timestamp: Date.now(),
      version: '1.0.0',
      uptime: metrics.getUptime(),
      checks: {
        redis: redisHealthy,
        rpc: rpcHealthy,
        contracts: contractsHealthy,
      },
    };
  }

  async getMetrics(): Promise<MetricsData> {
    return metrics.getMetrics();
  }

  async getQueueStats() {
    return await getQueueStats();
  }
}

export const oracleService = new OracleService();