"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const config_js_1 = require("./config.js");
const logger_js_1 = require("./utils/logger.js");
const oracleService_js_1 = require("./services/oracleService.js");
const queueService_js_1 = require("./services/queueService.js");
const zod_1 = require("zod");
// Request schemas for validation
const ScoreRequestSchema = zod_1.z.object({
    agentDID: zod_1.z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    onChainData: zod_1.z.object({
        walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        transactionCount: zod_1.z.number().int().nonnegative().optional(),
        totalVolumeUSD: zod_1.z.number().nonnegative().optional(),
        uniqueCounterparties: zod_1.z.number().int().nonnegative().optional(),
        avgTransactionSizeUSD: zod_1.z.number().nonnegative().optional(),
        daysActive: zod_1.z.number().int().nonnegative().optional(),
        tokenDiversity: zod_1.z.number().int().nonnegative().optional(),
        defiInteractions: zod_1.z.number().int().nonnegative().optional(),
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
    }).optional(),
    offChainData: zod_1.z.object({
        reputationScore: zod_1.z.number().min(0).max(100).optional(),
        kycVerified: zod_1.z.boolean().default(false),
        twitterFollowers: zod_1.z.number().int().nonnegative().optional(),
        githubContributions: zod_1.z.number().int().nonnegative().optional(),
        domainExpertise: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
const EnqueueScoreSchema = zod_1.z.object({
    agentDID: zod_1.z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    priority: zod_1.z.enum(['low', 'normal', 'high']).default('normal'),
}).merge(ScoreRequestSchema.shape);
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: logger_js_1.logger,
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
        origin: config_js_1.config.NODE_ENV === 'production' ? false : true,
        credentials: true,
    });
    // Rate limiting
    await app.register(import('@fastify/rate-limit'), {
        max: config_js_1.config.RATE_LIMIT_MAX,
        timeWindow: config_js_1.config.RATE_LIMIT_WINDOW_MS,
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
            servers: [{ url: `http://${config_js_1.config.HOST}:${config_js_1.config.PORT}`, description: 'Development server' }],
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
    app.get('/health', async (request, reply) => {
        const health = await oracleService_js_1.oracleService.getHealth();
        const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
        return reply.code(statusCode).send(health);
    });
    // Metrics endpoint
    app.get('/metrics', async (request, reply) => {
        const metrics = await oracleService_js_1.oracleService.getMetrics();
        return reply.send(metrics);
    });
    // Queue stats endpoint
    app.get('/queue/stats', async (request, reply) => {
        const stats = await oracleService_js_1.oracleService.getQueueStats();
        return reply.send(stats);
    });
    // Calculate score synchronously
    app.post('/score', {
        schema: {
            body: ScoreRequestSchema,
            response: { 200: { $ref: 'ScoreResponse#' } },
        },
    }, async (request, reply) => {
        const input = request.body;
        const result = await oracleService_js_1.oracleService.calculateScore(input);
        return reply.send(result);
    });
    // Enqueue score calculation (async)
    app.post('/score/enqueue', {
        schema: {
            body: EnqueueScoreSchema,
        },
    }, async (request, reply) => {
        const { agentDID, walletAddress, priority, onChainData, offChainData } = request.body;
        const jobData = {
            agentDID: agentDID,
            walletAddress,
            onChainData,
            offChainData,
        };
        const result = await oracleService_js_1.oracleService.enqueueScore(jobData, priority);
        return reply.code(202).send(result);
    });
    // Get job status
    app.get('/score/job/:jobId', async (request, reply) => {
        const { jobId } = request.params;
        const status = await oracleService_js_1.oracleService.getJobStatus(jobId);
        if (status.status === 'not_found') {
            return reply.code(404).send({ error: 'Job not found' });
        }
        return reply.send(status);
    });
    // Get score by agent DID (from blockchain)
    app.get('/score/:agentDID', async (request, reply) => {
        const { agentDID } = request.params;
        if (!zod_1.z.string().regex(/^did:croo:[a-zA-Z0-9_-]+$/).safeParse(agentDID).success) {
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
    app.post('/webhook/score-update', async (request, reply) => {
        const { event, agentDID, score } = request.body;
        logger_js_1.logger.info({ event, agentDID }, 'Received score update webhook');
        // Process webhook (notify downstream services, update cache, etc.)
        return reply.send({ received: true });
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_js_1.logger.info({ signal }, 'Shutting down...');
        await (0, queueService_js_1.shutdownQueue)();
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
        await (0, queueService_js_1.initializeQueue)();
        const app = await buildApp();
        await app.listen({ port: config_js_1.config.PORT, host: config_js_1.config.HOST });
        logger_js_1.logger.info({ port: config_js_1.config.PORT, host: config_js_1.config.HOST, env: config_js_1.config.NODE_ENV }, '🚀 AgentLend ML Oracle started');
        logger_js_1.logger.info(`📚 API Documentation: http://${config_js_1.config.HOST}:${config_js_1.config.PORT}/docs`);
        logger_js_1.logger.info(`💚 Health Check: http://${config_js_1.config.HOST}:${config_js_1.config.PORT}/health`);
        logger_js_1.logger.info(`📊 Metrics: http://${config_js_1.config.HOST}:${config_js_1.config.PORT}/metrics`);
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map