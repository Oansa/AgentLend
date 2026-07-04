"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreWorker = exports.scoreQueue = void 0;
exports.initializeQueue = initializeQueue;
exports.enqueueScoreCalculation = enqueueScoreCalculation;
exports.getJobStatus = getJobStatus;
exports.getQueueStats = getQueueStats;
exports.shutdownQueue = shutdownQueue;
const config_js_1 = require("../config.js");
const logger_js_1 = require("../utils/logger.js");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const scoringEngine_js_1 = require("./scoringEngine.js");
const blockchainService_js_1 = require("./blockchainService.js");
let redis = null;
let scoreQueue = null;
exports.scoreQueue = scoreQueue;
let scoreWorker = null;
exports.scoreWorker = scoreWorker;
async function initializeQueue() {
    try {
        redis = new ioredis_1.default({
            host: config_js_1.config.REDIS_HOST,
            port: config_js_1.config.REDIS_PORT,
            password: config_js_1.config.REDIS_PASSWORD || undefined,
            db: config_js_1.config.REDIS_DB,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        redis.on('connect', () => (0, logger_js_1.logger)().info('Redis connected'));
        redis.on('error', (err) => (0, logger_js_1.logger)().error({ err }, 'Redis error'));
        // Create queue
        exports.scoreQueue = scoreQueue = new bullmq_1.Queue('score-calculation', { connection: redis });
        // Create worker
        exports.scoreWorker = scoreWorker = new bullmq_1.Worker('score-calculation', async (job) => {
            return await processScoreJob(job);
        }, {
            connection: redis,
            concurrency: 5,
            limiter: { max: 10, duration: 1000 }, // 10 jobs per second
        });
        scoreWorker.on('completed', (job) => {
            (0, logger_js_1.logger)().info({ jobId: job.id, agentDID: job.data.agentDID }, 'Score job completed');
        });
        scoreWorker.on('failed', (job, err) => {
            (0, logger_js_1.logger)().error({ jobId: job?.id, error: err }, 'Score job failed');
        });
        (0, logger_js_1.logger)().info('Job queue initialized');
    }
    catch (error) {
        (0, logger_js_1.logger)().error({ error }, 'Failed to initialize job queue');
        throw error;
    }
}
async function processScoreJob(job) {
    const { agentDID, walletAddress, requestId, priority } = job.data;
    (0, logger_js_1.logger)().info({ agentDID, requestId, priority }, 'Processing score calculation job');
    try {
        // Update job progress
        await job.updateProgress(10);
        // Calculate score
        const score = await scoringEngine_js_1.scoringEngine.calculateScore({
            agentDID,
            walletAddress,
            onChainData: undefined, // Will be fetched in scoring engine
            offChainData: undefined,
        });
        await job.updateProgress(70);
        // Push to blockchain if configured
        let txHash;
        if (blockchainService_js_1.blockchainService.isConfigured()) {
            const result = await blockchainService_js_1.blockchainService.pushScore(score);
            if (result.success) {
                txHash = result.txHash;
            }
            else {
                (0, logger_js_1.logger)().warn({ agentDID, error: result.error }, 'Failed to push score to blockchain');
            }
        }
        await job.updateProgress(100);
        return { success: true, score };
    }
    catch (error) {
        (0, logger_js_1.logger)().error({ error, agentDID, requestId }, 'Score calculation failed');
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
async function enqueueScoreCalculation(data) {
    if (!scoreQueue) {
        throw new Error('Queue not initialized');
    }
    const job = await scoreQueue.add('calculate-score', data, {
        priority: data.priority === 'high' ? 10 : data.priority === 'low' ? 1 : 5,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    });
    (0, logger_js_1.logger)().info({ jobId: job.id, agentDID: data.agentDID }, 'Score calculation enqueued');
    return job.id;
}
async function getJobStatus(jobId) {
    if (!scoreQueue) {
        throw new Error('Queue not initialized');
    }
    const job = await scoreQueue.getJob(jobId);
    if (!job) {
        return { status: 'not_found', progress: 0 };
    }
    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    return { status: state, progress, result };
}
async function getQueueStats() {
    if (!scoreQueue) {
        return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        scoreQueue.getWaitingCount(),
        scoreQueue.getActiveCount(),
        scoreQueue.getCompletedCount(),
        scoreQueue.getFailedCount(),
        scoreQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
}
async function shutdownQueue() {
    if (scoreWorker) {
        await scoreWorker.close();
        (0, logger_js_1.logger)().info('Score worker closed');
    }
    if (scoreQueue) {
        await scoreQueue.close();
        (0, logger_js_1.logger)().info('Score queue closed');
    }
    if (redis) {
        await redis.quit();
        (0, logger_js_1.logger)().info('Redis connection closed');
    }
}
//# sourceMappingURL=queueService.js.map