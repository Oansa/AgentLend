import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import type { ScoreJobData, ScoreJobResult } from '../types/index.js';
import { scoringEngine } from './scoringEngine.js';
import { blockchainService } from './blockchainService.js';

let redis: IORedis | null = null;
let scoreQueue: Queue<ScoreJobData> | null = null;
let scoreWorker: Worker<ScoreJobData, ScoreJobResult> | null = null;

export async function initializeQueue(): Promise<void> {
  try {
    redis = new IORedis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      db: config.REDIS_DB,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redis.on('connect', () => logger().info('Redis connected'));
    redis.on('error', (err) => logger().error({ err }, 'Redis error'));

    // Create queue
    scoreQueue = new Queue<ScoreJobData>('score-calculation', { connection: redis });

    // Create worker
    scoreWorker = new Worker<ScoreJobData, ScoreJobResult>(
      'score-calculation',
      async (job: Job<ScoreJobData>) => {
        return await processScoreJob(job);
      },
      {
        connection: redis,
        concurrency: 5,
        limiter: { max: 10, duration: 1000 }, // 10 jobs per second
      }
    );

    scoreWorker.on('completed', (job) => {
      logger().info({ jobId: job.id, agentDID: job.data.agentDID }, 'Score job completed');
    });

    scoreWorker.on('failed', (job, err) => {
      logger().error({ jobId: job?.id, error: err }, 'Score job failed');
    });

    logger().info('Job queue initialized');
  } catch (error) {
    logger().error({ error }, 'Failed to initialize job queue');
    throw error;
  }
}

async function processScoreJob(job: Job<ScoreJobData>): Promise<ScoreJobResult> {
  const { agentDID, walletAddress, requestId, priority } = job.data;

  logger().info({ agentDID, requestId, priority }, 'Processing score calculation job');

  try {
    // Update job progress
    await job.updateProgress(10);

    // Calculate score
    const score = await scoringEngine.calculateScore({
      agentDID,
      walletAddress,
      onChainData: undefined, // Will be fetched in scoring engine
      offChainData: undefined,
    });

    await job.updateProgress(70);

    // Push to blockchain if configured
    let txHash: string | undefined;
    if (blockchainService.isConfigured()) {
      const result = await blockchainService.pushScore(score);
      if (result.success) {
        txHash = result.txHash;
      } else {
        logger().warn({ agentDID, error: result.error }, 'Failed to push score to blockchain');
      }
    }

    await job.updateProgress(100);

    return { success: true, score };
  } catch (error) {
    logger().error({ error, agentDID, requestId }, 'Score calculation failed');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function enqueueScoreCalculation(data: ScoreJobData): Promise<string> {
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

  logger().info({ jobId: job.id, agentDID: data.agentDID }, 'Score calculation enqueued');
  return job.id!;
}

export async function getJobStatus(jobId: string): Promise<{ status: string; progress: number; result?: ScoreJobResult }> {
  if (!scoreQueue) {
    throw new Error('Queue not initialized');
  }

  const job = await scoreQueue.getJob(jobId);
  if (!job) {
    return { status: 'not_found', progress: 0 };
  }

  const state = await job.getState();
  const progress = job.progress as number;
  const result = job.returnvalue as ScoreJobResult | undefined;

  return { status: state, progress, result };
}

export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
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

export async function shutdownQueue(): Promise<void> {
  if (scoreWorker) {
    await scoreWorker.close();
    logger().info('Score worker closed');
  }
  if (scoreQueue) {
    await scoreQueue.close();
    logger().info('Score queue closed');
  }
  if (redis) {
    await redis.quit();
    logger().info('Redis connection closed');
  }
}

export { scoreQueue, scoreWorker };