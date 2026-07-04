#!/usr/bin/env node
/**
 * CROO Agent Store Provider - AgentLend ML Oracle
 *
 * This script starts the provider service that:
 * 1. Connects to CROO CAP WebSocket for real-time negotiations
 * 2. Listens for negotiation requests for your services
 * 3. Auto-accepts negotiations and handles order fulfillment
 *
 * Prerequisites:
 * - Agent registered in CROO Dashboard (Step 1)
 * - Services published in CROO Dashboard (Step 1)
 * - API key configured in .env (Step 2)
 *
 * Run: npx tsx examples/croo-provider.ts
 */

import { config } from '../src/config.js';
import { logger } from '../src/utils/logger.js';
import { capService } from '../src/services/capService.js';
import { oracleService } from '../src/services/oracleService.js';
import { initializeQueue, shutdownQueue } from '../src/services/queueService.js';
import { AgentClient } from '@croo-network/sdk';

// CROO Provider configuration
interface ProviderConfig {
  agentDID: string;
  apiKey: string;
  apiUrl: string;
  wsUrl: string;
  services: ServiceDefinition[];
}

interface ServiceDefinition {
  id: string;           // Service ID from CROO Dashboard
  name: string;
  handler: (requirements: string) => Promise<ServiceResult>;
}

interface ServiceResult {
  success: boolean;
  deliverableType: 'text' | 'schema';
  deliverableText?: string;
  deliverableSchema?: string;
  error?: string;
}

class CROOProvider {
  private config: ProviderConfig;
  private agentClient: AgentClient;
  private isRunning = false;
  private wsConnected = false;

  constructor() {
    // Validate required config
    const agentDID = config.CROO_AGENT_DID;
    const apiKey = config.CROO_API_KEY;
    const apiUrl = config.CROO_API_URL;
    const wsUrl = config.CROO_WS_URL;

    if (!agentDID) throw new Error('CROO_AGENT_DID not set in .env');
    if (!apiKey) throw new Error('CROO_API_KEY not set in .env');
    if (!apiUrl) throw new Error('CROO_API_URL not set in .env');
    if (!wsUrl) throw new Error('CROO_WS_URL not set in .env');

    this.config = {
      agentDID,
      apiKey,
      apiUrl,
      wsUrl,
      services: this.getServiceDefinitions(),
    };

    // Initialize CROO SDK AgentClient
    this.agentClient = new AgentClient(
      { baseURL: apiUrl, wsURL: wsUrl },
      apiKey
    );
  }

  private getServiceDefinitions(): ServiceDefinition[] {
    return [
      {
        id: 'calculate-credit-score',  // Must match Service ID in CROO Dashboard
        name: 'Calculate Agent Credit Score (ACS)',
        handler: async (requirements: string) => {
          try {
            const req = JSON.parse(requirements || '{}');
            const input = {
              agentDID: req.agentDID || this.config.agentDID,
              walletAddress: req.walletAddress,
              onChainData: req.onChainData,
              offChainData: req.offChainData,
            };
            const result = await oracleService.calculateScore(input);
            return {
              success: true,
              deliverableType: 'text',
              deliverableText: JSON.stringify(result, null, 2),
            };
          } catch (error: any) {
            return { success: false, deliverableType: 'text', error: error.message };
          }
        },
      },
      {
        id: 'enqueue-score-calculation',
        name: 'Enqueue Async Credit Score Calculation',
        handler: async (requirements: string) => {
          try {
            const req = JSON.parse(requirements || '{}');
            const result = await oracleService.enqueueScore({
              agentDID: req.agentDID,
              walletAddress: req.walletAddress,
              onChainData: req.onChainData,
              offChainData: req.offChainData,
            }, req.priority || 'normal');
            return {
              success: true,
              deliverableType: 'text',
              deliverableText: JSON.stringify(result, null, 2),
            };
          } catch (error: any) {
            return { success: false, deliverableType: 'text', error: error.message };
          }
        },
      },
      {
        id: 'get-credit-score',
        name: 'Get Existing Credit Score',
        handler: async (requirements: string) => {
          try {
            const req = JSON.parse(requirements || '{}');
            const scores = await oracleService.getDemoScores();
            const score = scores.find(s => s.agentDID === req.agentDID);
            return {
              success: !!score,
              deliverableType: 'text',
              deliverableText: score ? JSON.stringify(score, null, 2) : 'Score not found',
            };
          } catch (error: any) {
            return { success: false, deliverableType: 'text', error: error.message };
          }
        },
      },
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger().warn('Provider already running');
      return;
    }

    logger().info({ agentDID: this.config.agentDID }, '🚀 Starting CROO Provider...');

    try {
      // 1. Initialize ML Oracle services
      await initializeQueue();
      await capService.connectWebSocket();
      await capService.registerAgentLendDID();

      // 2. Connect to CROO WebSocket for real-time events
      await this.connectWebSocket();

      // 3. Start polling for negotiations (fallback)
      this.startNegotiationPolling();

      this.isRunning = true;
      logger().info('✅ CROO Provider started successfully!');
      logger().info({
        services: this.config.services.map(s => s.id)
      }, 'Registered services');

      // Keep running
      await this.runForever();
    } catch (error) {
      logger().error({ error }, 'Failed to start provider');
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    try {
      logger().info('Connecting to CROO WebSocket...');
      const eventStream = await this.agentClient.connectWebSocket();

      this.wsConnected = true;
      logger().info('📡 CROO WebSocket connected');

      // Handle incoming events
      for await (const event of eventStream) {
        await this.handleEvent(event);
      }
    } catch (error) {
      logger().error({ error }, 'WebSocket connection failed, will retry...');
      this.wsConnected = false;
      // Retry in 10 seconds
      setTimeout(() => this.connectWebSocket(), 10000);
    }
  }

  private async handleEvent(event: any): Promise<void> {
    logger().debug({ eventType: event.type }, 'Received CROO event');

    switch (event.type) {
      case 'order_negotiation_created':
        await this.handleNegotiationCreated(event);
        break;
      case 'order_paid':
        await this.handleOrderPaid(event);
        break;
      case 'order_completed':
        logger().info({ orderId: event.order_id }, 'Order completed');
        break;
      default:
        logger().debug({ eventType: event.type }, 'Unhandled event type');
    }
  }

  private async handleNegotiationCreated(event: any): Promise<void> {
    const { negotiation_id, service_id, requirements, requester_agent_id } = event;

    logger().info({
      negotiationId: negotiation_id,
      serviceId: service_id,
      requester: requester_agent_id
    }, '📥 New negotiation received');

    // Find matching service
    const service = this.config.services.find(s => s.id === service_id);
    if (!service) {
      logger().warn({ serviceId: service_id }, 'Service not found, rejecting');
      await this.agentClient.rejectNegotiation(negotiation_id, 'Service not supported');
      return;
    }

    try {
      // Execute service
      const result = await service.handler(requirements || '{}');

      // Accept negotiation
      const acceptResult = await this.agentClient.acceptNegotiation(negotiation_id);
      logger().info({ negotiationId: negotiation_id, orderId: acceptResult.order?.orderId }, '✅ Negotiation accepted');

      // If order created, deliver result
      if (acceptResult.order?.orderId) {
        await this.deliverOrder(acceptResult.order.orderId, result);
      }
    } catch (error: any) {
      logger().error({ error, negotiationId: negotiation_id }, 'Failed to handle negotiation');
      await this.agentClient.rejectNegotiation(negotiation_id, error.message);
    }
  }

  private async handleOrderPaid(event: any): Promise<void> {
    const { order_id } = event;
    logger().info({ orderId: order_id }, '💰 Order paid, checking for pending delivery');

    // The delivery is typically handled in handleNegotiationCreated after accept
    // But we can also check if there's pending delivery here
    await capService.handleLoanRepayment(order_id, 0n);
  }

  private async deliverOrder(orderId: string, result: ServiceResult): Promise<void> {
    try {
      const deliverReq = {
        deliverableType: result.deliverableType,
        deliverableSchema: result.deliverableSchema,
        deliverableText: result.success ? result.deliverableText : `Error: ${result.error}`,
      };

      await this.agentClient.deliverOrder(orderId, deliverReq);
      logger().info({ orderId }, '📦 Order delivered successfully');
    } catch (error: any) {
      logger().error({ error, orderId }, 'Failed to deliver order');
    }
  }

  private startNegotiationPolling(): void {
    // Poll every 30 seconds as fallback
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const negotiations = await this.agentClient.listNegotiations({
          status: 'pending',
          agentId: this.config.agentDID,
        });

        for (const neg of negotiations) {
          if (neg.status === 'pending') {
            // Check if we already handled this
            logger().debug({ negotiationId: neg.negotiationId }, 'Polling: found pending negotiation');
            await this.handleNegotiationCreated({
              negotiation_id: neg.negotiationId,
              service_id: neg.serviceId,
              requirements: neg.requirements,
              requester_agent_id: neg.requesterAgentId,
            });
          }
        }
      } catch (error) {
        logger().error({ error }, 'Negotiation polling failed');
      }
    }, 30000);
  }

  private async runForever(): Promise<void> {
    return new Promise(() => {}); // Run forever
  }

  async stop(): Promise<void> {
    logger().info('Stopping CROO Provider...');
    this.isRunning = false;
    await shutdownQueue();
    capService.disconnect();
    logger().info('✅ CROO Provider stopped');
  }
}

// Main entry point
async function main() {
  const provider = new CROOProvider();

  // Graceful shutdown
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
  } catch (error) {
    logger().error({ error }, 'Provider failed to start');
    process.exit(1);
  }
}

main();