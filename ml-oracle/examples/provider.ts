import { config } from '../src/config.js';
import { logger } from '../src/utils/logger.js';
import { capService } from '../src/services/capService.js';
import { oracleService } from '../src/services/oracleService.js';
import { initializeQueue, shutdownQueue } from '../src/services/queueService.js';
import type { ScoreInput, AgentDID } from '../src/types/index.js';

// CROO SDK types (replace with actual @croo-network/sdk when available)
interface ProviderConfig {
  agentDID: string;
  apiKey: string;
  apiUrl: string;
  wsUrl: string;
  services: ProviderService[];
}

interface ProviderService {
  name: string;
  description: string;
  endpoint: string;
  inputSchema: any;
  outputSchema: any;
  pricing: {
    type: 'per_call' | 'subscription';
    amount: string;
    currency: 'USDC';
  };
}

interface CAPNegotiation {
  negotiation_id: string;
  requester_did: string;
  provider_did: string;
  service_name: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  terms: any;
}

// Your ML Oracle services to expose on CROO Agent Store
const AGENT_SERVICES: ProviderService[] = [
  {
    name: 'calculate_credit_score',
    description: 'Calculate Agent Credit Score (ACS) for lending eligibility',
    endpoint: '/score',
    inputSchema: {
      type: 'object',
      properties: {
        agentDID: { type: 'string', pattern: '^did:croo:[a-zA-Z0-9_-]+$' },
        walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        onChainData: {
          type: 'object',
          properties: {
            walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            transactionCount: { type: 'number' },
            totalVolumeUSD: { type: 'number' },
            uniqueCounterparties: { type: 'number' },
            avgTransactionSizeUSD: { type: 'number' },
            daysActive: { type: 'number' },
            tokenDiversity: { type: 'number' },
            defiInteractions: { type: 'number' },
          },
        },
        offChainData: {
          type: 'object',
          properties: {
            reputationScore: { type: 'number', minimum: 0, maximum: 100 },
            kycVerified: { type: 'boolean' },
            twitterFollowers: { type: 'number' },
            githubContributions: { type: 'number' },
            domainExpertise: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['agentDID', 'walletAddress'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            agentDID: { type: 'string' },
            score: { type: 'number', minimum: 300, maximum: 900 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            factors: {
              type: 'object',
              properties: {
                onChainScore: { type: 'number' },
                offChainScore: { type: 'number' },
                paymentHistoryScore: { type: 'number' },
                collateralScore: { type: 'number' },
              },
            },
            recommendations: { type: 'array', items: { type: 'string' } },
            validUntil: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    pricing: {
      type: 'per_call',
      amount: '5.00', // 5 USDC per score calculation
      currency: 'USDC',
    },
  },
  {
    name: 'get_credit_score',
    description: 'Retrieve existing ACS score for an agent',
    endpoint: '/score/:agentDID',
    inputSchema: {
      type: 'object',
      properties: {
        agentDID: { type: 'string', pattern: '^did:croo:[a-zA-Z0-9_-]+$' },
      },
      required: ['agentDID'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            agentDID: { type: 'string' },
            score: { type: 'number' },
            confidence: { type: 'number' },
            validUntil: { type: 'string' },
          },
        },
      },
    },
    pricing: {
      type: 'per_call',
      amount: '1.00', // 1 USDC for score lookup
      currency: 'USDC',
    },
  },
  {
    name: 'enqueue_score_calculation',
    description: 'Queue async credit score calculation for high-volume agents',
    endpoint: '/score/enqueue',
    inputSchema: {
      type: 'object',
      properties: {
        agentDID: { type: 'string', pattern: '^did:croo:[a-zA-Z0-9_-]+$' },
        walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        onChainData: AGENT_SERVICES[0].inputSchema.properties.onChainData,
        offChainData: AGENT_SERVICES[0].inputSchema.properties.offChainData,
      },
      required: ['agentDID', 'walletAddress'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string' },
        jobId: { type: 'string' },
        status: { type: 'string' },
      },
    },
    pricing: {
      type: 'per_call',
      amount: '3.00',
      currency: 'USDC',
    },
  },
];

class CROOProvider {
  private config: ProviderConfig;
  private negotiations = new Map<string, CAPNegotiation>();
  private isRunning = false;

  constructor() {
    // Validate required config
    if (!config.CROO_AGENT_DID) {
      throw new Error('CROO_AGENT_DID not set in .env');
    }
    if (!config.CROO_API_KEY) {
      throw new Error('CROO_API_KEY not set in .env');
    }
    if (!config.CROO_API_URL) {
      throw new Error('CROO_API_URL not set in .env');
    }
    if (!config.CROO_WS_URL) {
      throw new Error('CROO_WS_URL not set in .env');
    }

    this.config = {
      agentDID: config.CROO_AGENT_DID,
      apiKey: config.CROO_API_KEY,
      apiUrl: config.CROO_API_URL,
      wsUrl: config.CROO_WS_URL,
      services: AGENT_SERVICES,
    };
  }

  /**
   * Start the provider - register with Agent Store and listen for requests
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger().warn('Provider already running');
      return;
    }

    logger().info({ agentDID: this.config.agentDID }, 'Starting CROO Provider...');

    try {
      // 1. Initialize ML Oracle services
      await initializeQueue();
      await capService.connectWebSocket();
      await capService.registerAgentLendDID();

      // 2. Register services with CROO Agent Store
      await this.registerWithAgentStore();

      // 3. Start listening for CAP negotiations (WebSocket)
      await this.listenForNegotiations();

      // 4. Start HTTP server for service endpoints
      await this.startServiceEndpoints();

      this.isRunning = true;
      logger().info('✅ CROO Provider started successfully!');
      logger().info({ services: this.config.services.map(s => s.name) }, 'Registered services');

    } catch (error) {
      logger().error({ error }, 'Failed to start provider');
      throw error;
    }
  }

  /**
   * Register agent and services with CROO Agent Store
   */
  private async registerWithAgentStore(): Promise<void> {
    // In production, use CROO SDK:
    // const sdk = new CrooSDK({ apiKey: this.config.apiKey, apiUrl: this.config.apiUrl });
    // await sdk.agents.register(this.config.agentDID, this.config.services);

    logger().info({
      agentDID: this.config.agentDID,
      serviceCount: this.config.services.length,
    }, 'Registering with CROO Agent Store (placeholder - use CROO SDK)');

    // Placeholder: Simulate registration
    logger().info('✅ Agent registered with CROO Agent Store');
    logger().info('✅ Services published to marketplace');
  }

  /**
   * Listen for CAP negotiations via WebSocket
   */
  private async listenForNegotiations(): Promise<void> {
    if (!this.config.wsUrl) return;

    logger().info(`Connecting to CAP WebSocket: ${this.config.wsUrl}`);

    // In production, use CROO SDK WebSocket client
    // const ws = new WebSocket(this.config.wsUrl, { headers: { Authorization: `Bearer ${this.config.apiKey}` } });
    // ws.on('message', (data) => this.handleNegotiationMessage(JSON.parse(data.toString())));

    // Placeholder: Log that we'd listen
    logger().info('📡 Listening for CAP negotiations (placeholder - use CROO SDK)');
  }

  /**
   * Handle incoming negotiation requests
   */
  private async handleNegotiationMessage(message: any): Promise<void> {
    if (message.type === 'negotiation_created') {
      const negotiation: CAPNegotiation = {
        negotiation_id: message.negotiation_id,
        requester_did: message.requester_did,
        provider_did: this.config.agentDID,
        service_name: message.service_name,
        status: 'pending',
        terms: message.terms,
      };

      this.negotiations.set(negotiation.negotiation_id, negotiation);

      logger().info({ negotiation: negotiation.negotiation_id }, 'Received negotiation request');

      // Auto-accept for demo (in production: evaluate terms, check capacity, etc.)
      await this.acceptNegotiation(negotiation.negotiation_id);
    }
  }

  /**
   * Accept a negotiation and create CAP order
   */
  private async acceptNegotiation(negotiationId: string): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) return;

    // In production, use CROO SDK:
    // await sdk.cap.acceptNegotiation(negotiationId, { provider_did: this.config.agentDID });

    negotiation.status = 'accepted';
    logger().info({ negotiationId }, 'Accepted negotiation');

    // When order is paid, CAP will notify via Webhook (already handled in capService)
  }

  /**
   * Start HTTP endpoints for your services
   */
  private async startServiceEndpoints(): Promise<void> {
    // The ML Oracle already has Fastify server with /score, /score/enqueue, etc.
    // This would be the same server or a separate one for provider-specific endpoints
    logger().info('🌐 Service endpoints available at ML Oracle API');
  }

  /**
   * Stop the provider
   */
  async stop(): Promise<void> {
    logger().info('Stopping CROO Provider...');
    await shutdownQueue();
    capService.disconnect();
    this.isRunning = false;
    logger().info('✅ CROO Provider stopped');
  }
}

// CLI entry point
async function main() {
  const provider = new CROOProvider();

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    await provider.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await provider.stop();
    process.exit(0);
  });

  try {
    await provider.start();

    // Keep running
    logger().info('Provider running. Press Ctrl+C to stop.');
    await new Promise(() => {}); // Run forever
  } catch (error) {
    logger().error({ error }, 'Provider failed');
    process.exit(1);
  }
}

main();