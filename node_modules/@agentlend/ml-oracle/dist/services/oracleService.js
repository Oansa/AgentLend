"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oracleService = exports.OracleService = void 0;
const logger_js_1 = require("../utils/logger.js");
const scoringEngine_js_1 = require("./scoringEngine.js");
const blockchainService_js_1 = require("./blockchainService.js");
const queueService_js_1 = require("./queueService.js");
class MetricsCollector {
    scoresGenerated = 0;
    scoresRequested = 0;
    totalResponseTime = 0;
    errors = 0;
    activeAgents = new Set();
    startTime = Date.now();
    recordRequest(responseTimeMs) {
        this.scoresRequested++;
        this.totalResponseTime += responseTimeMs;
    }
    recordSuccess(agentDID) {
        this.scoresGenerated++;
        this.activeAgents.add(agentDID);
    }
    recordError() {
        this.errors++;
    }
    getMetrics() {
        return {
            scoresGenerated: this.scoresGenerated,
            scoresRequested: this.scoresRequested,
            avgScore: 0, // Would need to track scores for average
            avgResponseTimeMs: this.scoresRequested > 0 ? this.totalResponseTime / this.scoresRequested : 0,
            errors: this.errors,
            activeAgents: this.activeAgents.size,
        };
    }
    getUptime() {
        return Date.now() - this.startTime;
    }
}
const metrics = new MetricsCollector();
class OracleService {
    async calculateScore(input) {
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        metrics.recordRequest(0); // Will update after
        try {
            (0, logger_js_1.logger)().info({ agentDID: input.agentDID, requestId }, 'Score calculation requested');
            const score = await scoringEngine_js_1.scoringEngine.calculateScore(input);
            metrics.recordSuccess(input.agentDID);
            metrics.recordRequest(Date.now() - startTime);
            const response = {
                success: true,
                data: score,
                requestId,
                timestamp: Date.now(),
            };
            (0, logger_js_1.logger)().info({ agentDID: input.agentDID, score: score.score, requestId }, 'Score calculated successfully');
            return response;
        }
        catch (error) {
            metrics.recordError();
            metrics.recordRequest(Date.now() - startTime);
            (0, logger_js_1.logger)().error({ error, agentDID: input.agentDID, requestId }, 'Score calculation failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId,
                timestamp: Date.now(),
            };
        }
    }
    async enqueueScore(input, priority = 'normal') {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const jobId = await (0, queueService_js_1.enqueueScoreCalculation)({
            agentDID: input.agentDID,
            walletAddress: input.walletAddress,
            requestId,
            priority,
        });
        metrics.recordRequest(0);
        return { requestId, jobId };
    }
    async getJobStatus(jobId) {
        return await (0, queueService_js_1.getJobStatus)(jobId);
    }
    async getHealth() {
        const redisHealthy = true; // Would check Redis connection
        const rpcHealthy = await blockchainService_js_1.blockchainService.healthCheck();
        const contractsHealthy = blockchainService_js_1.blockchainService.isConfigured();
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
    async getMetrics() {
        return metrics.getMetrics();
    }
    async getQueueStats() {
        return await (0, queueService_js_1.getQueueStats)();
    }
}
exports.OracleService = OracleService;
exports.oracleService = new OracleService();
//# sourceMappingURL=oracleService.js.map