import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type { ACSScore, AgentDID } from '../types/index.js';

// CROO SDK types (would be imported from @croo-network/sdk)
export interface CAPOrder {
  order_id: string;
  requester_did: AgentDID;
  provider_did?: AgentDID;
  status: 'negotiating' | 'locked' | 'delivering' | 'delivered' | 'completed' | 'cancelled';
  amount_usdc: bigint;
  description: string;
}

export interface CAPEvent {
  type: 'order_paid' | 'order_delivered' | 'order_completed' | 'negotiation_created';
  order_id?: string;
  negotiation_id?: string;
  amount_usdc?: bigint;
  requester_did?: AgentDID;
}

export interface LoanRelation {
  orderId: string;
  loanId?: bigint;
  borrowerDID: AgentDID;
  principal: bigint;
  repaymentAmount: bigint;
}

// In-memory mapping for demo (would use PostgreSQL in production)
const orderToLoan = new Map<string, LoanRelation>();

export class CAPService {
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to CROO WebSocket for real-time order events
   */
  async connectWebSocket(): Promise<void> {
    if (!config.CAP_WS_URL) {
      logger().warn('CAP_WS_URL not configured, skipping WebSocket connection');
      return;
    }

    try {
      this.wsConnection = new WebSocket(config.CAP_WS_URL);

      this.wsConnection.onopen = () => {
        logger().info('Connected to CROO CAP WebSocket');
        this.reconnectAttempts = 0;
      };

      this.wsConnection.onmessage = (event) => {
        this.handleCAPEvent(JSON.parse(event.data));
      };

      this.wsConnection.onclose = () => {
        logger().info('CAP WebSocket disconnected');
        this.attemptReconnect();
      };

      this.wsConnection.onerror = (error) => {
        logger().error({ error }, 'CAP WebSocket error');
      };
    } catch (error) {
      logger().error({ error }, 'Failed to connect to CAP WebSocket');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connectWebSocket(), 5000 * this.reconnectAttempts);
    }
  }

  /**
   * Handle incoming CAP events
   */
  private async handleCAPEvent(event: CAPEvent): Promise<void> {
    logger().info({ event }, 'Received CAP event');

    switch (event.type) {
      case 'order_paid':
        // When an order is paid, check if it's a loan repayment
        if (event.order_id) {
          await this.handleLoanRepayment(event.order_id, event.amount_usdc || 0n);
        }
        break;
      case 'order_completed':
        // When an order completes, could trigger loan disbursement for orchestrator
        break;
    }
  }

  /**
   * Register a loan with its originating order
   */
  registerLoan(orderId: string, loanId: bigint, borrowerDID: AgentDID, principal: bigint, repaymentAmount: bigint): void {
    orderToLoan.set(orderId, {
      orderId,
      loanId,
      borrowerDID,
      principal,
      repaymentAmount,
    });
    logger().info({ orderId, loanId, borrowerDID }, 'Loan registered with CAP');
  }

  /**
   * Handle loan repayment when order is paid
   */
  async handleLoanRepayment(orderId: string, amount: bigint): Promise<void> {
    const loanRelation = orderToLoan.get(orderId);
    if (!loanRelation || !loanRelation.loanId) return;

    // In production: call smart contract to process repayment
    // lendingPool.repayFromCAP(loanRelation.loanId, amount)

    logger().info({ orderId: loanRelation.orderId, amount }, 'Processing CAP-based loan repayment');
  }

  /**
   * Get order details from CAP
   */
  async getOrder(orderId: string): Promise<CAPOrder | null> {
    if (!config.CAP_API_URL) {
      return null;
    }

    try {
      // const response = await fetch(`${config.CAP_API_URL}/orders/${orderId}`, {
      //   headers: { 'Authorization': `Bearer ${config.CAP_API_KEY}` }
      // });
      // return response.json();
      return null;
    } catch (error) {
      logger().error({ error, orderId }, 'Failed to fetch order from CAP');
      return null;
    }
  }

  /**
   * Register AgentLend as a provider in CROO Agent Store
   */
  async registerAgentLendDID(): Promise<void> {
    // Register AgentLend DID with the Agent Store
    // This would use CROO SDK to register the service
    logger().info('AgentLend DID registration (placeholder)');
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

export const capService = new CAPService();