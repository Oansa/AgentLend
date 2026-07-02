import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { oracleService } from './services/oracleService.js';
import { initializeQueue, shutdownQueue } from './services/queueService.js';
import type { ScoreInput, AgentDID, ScoreResponse, HealthResponse, MetricsData } from './types/index.js';
import { z } from 'zod';

// Request schemas for validation
const ScoreRequestSchema = z.object({
  agentDID: z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  onChainData: z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    transactionCount: z.number().int().nonnegative().optional(),
    totalVolumeUSD: z.number().nonnegative().optional(),
    uniqueCounterparties: z.number().int().nonnegative().optional(),
    avgTransactionSizeUSD: z.number().nonnegative().optional(),
    daysActive: z.number().int().nonnegative().optional(),
    tokenDiversity: z.number().int().nonnegative().optional(),
    defiInteractions: z.number().int().nonnegative().optional(),
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
  }).optional(),
  offChainData: z.object({
    reputationScore: z.number().min(0).max(100).optional(),
    kycVerified: z.boolean().default(false),
    twitterFollowers: z.number().int().nonnegative().optional(),
    githubContributions: z.number().int().nonnegative().optional(),
    domainExpertise: z.array(z.string()).optional(),
  }).optional(),
});

const EnqueueScoreSchema = z.object({
  agentDID: z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
}).merge(ScoreRequestSchema.shape);

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger,
    ajv: {
      customOptions: { strict: false },
    },
  });

  // Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false, // Disable for API
  });

  // CORS
  await app.register(import('@fastify/cors'), {
    origin: config.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  // Rate limiting
  await app.register(import('@fastify/rate-limit'), {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    hook: 'onRequest',
  });

  // Swagger documentation
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'AgentLend ML Oracle API',
        description: 'Agent Credit Score (ACS) Generation Service for CROO Network',
        version: '1.0.0',
      },
      servers: [{ url: `http://${config.HOST}:${config.PORT}`, description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    },
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  // Health check endpoint
  app.get<{ Reply: HealthResponse }>('/health', async (request, reply) => {
    const health = await oracleService.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    return reply.code(statusCode).send(health);
  });

  // Metrics endpoint
  app.get<{ Reply: MetricsData }>('/metrics', async (request, reply) => {
    const metrics = await oracleService.getMetrics();
    return reply.send(metrics);
  });

  // Queue stats endpoint
  app.get('/queue/stats', async (request, reply) => {
    const stats = await oracleService.getQueueStats();
    return reply.send(stats);
  });

  // Calculate score synchronously
  app.post<{ Body: ScoreInput; Reply: ScoreResponse }>('/score', {
    schema: {
      body: ScoreRequestSchema,
      response: { 200: { $ref: 'ScoreResponse#' } },
    },
  }, async (request, reply) => {
    const input = request.body as ScoreInput;
    const result = await oracleService.calculateScore(input);
    return reply.send(result);
  });

  // Enqueue score calculation (async)
  app.post<{ Body: z.infer<typeof EnqueueScoreSchema>; Reply: { requestId: string; jobId: string } }>('/score/enqueue', {
    schema: {
      body: EnqueueScoreSchema,
    },
  }, async (request, reply) => {
    const { agentDID, walletAddress, priority, onChainData, offChainData } = request.body;

    const jobData = {
      agentDID: agentDID as AgentDID,
      walletAddress,
      onChainData,
      offChainData,
    };

    const result = await oracleService.enqueueScore(jobData, priority);
    return reply.code(202).send(result);
  });

  // Get job status
  app.get<{ Params: { jobId: string } }>('/score/job/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const status = await oracleService.getJobStatus(jobId);

    if (status.status === 'not_found') {
      return reply.code(404).send({ error: 'Job not found' });
    }

    return reply.send(status);
  });

  // Get score by agent DID (from blockchain)
  app.get<{ Params: { agentDID: string } }>('/score/:agentDID', async (request, reply) => {
    const { agentDID } = request.params;

    if (!z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/).safeParse(agentDID).success) {
      return reply.code(400).send({ error: 'Invalid agent DID format' });
    }

    // This would typically query the blockchain
    // For now, return a placeholder
    return reply.send({
      message: 'Use /score endpoint to calculate new scores',
      agentDID,
      note: 'Blockchain query not implemented in this endpoint',
    });
  });

  // Webhook endpoint for score updates
  app.post<{ Body: { event: string; agentDID: string; score?: any } }>('/webhook/score-update', async (request, reply) => {
    const { event, agentDID, score } = request.body;
    logger.info({ event, agentDID }, 'Received score update webhook');
    // Process webhook (notify downstream services, update cache, etc.)
    return reply.send({ received: true });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    await shutdownQueue();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

async function start() {
  try {
    // Initialize job queue
    await initializeQueue();

    const app = await buildApp();

    await app.listen({ port: config.PORT, host: config.HOST });

    logger.info(
      { port: config.PORT, host: config.HOST, env: config.NODE_ENV },
      '🚀 AgentLend ML Oracle started'
    );
    logger.info(`📚 API Documentation: http://${config.HOST}:${config.PORT}/docs`);
    logger.info(`💚 Health Check: http://${config.HOST}:${config.PORT}/health`);
    logger.info(`📊 Metrics: http://${config.HOST}:${config.PORT}/metrics`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();