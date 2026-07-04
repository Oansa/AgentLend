"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capService = exports.CAPService = void 0;
const config_js_1 = require("../config.js");
const logger_js_1 = require("../utils/logger.js");
// In-memory mapping for demo (would use PostgreSQL in production)
const orderToLoan = new Map();
class CAPService {
    wsConnection = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    /**
     * Connect to CROO WebSocket for real-time order events
     */
    async connectWebSocket() {
        if (!config_js_1.config.CAP_WS_URL) {
            (0, logger_js_1.logger)().warn('CAP_WS_URL not configured, skipping WebSocket connection');
            return;
        }
        try {
            this.wsConnection = new WebSocket(config_js_1.config.CAP_WS_URL);
            this.wsConnection.onopen = () => {
                (0, logger_js_1.logger)().info('Connected to CROO CAP WebSocket');
                this.reconnectAttempts = 0;
            };
            this.wsConnection.onmessage = (event) => {
                this.handleCAPEvent(JSON.parse(event.data));
            };
            this.wsConnection.onclose = () => {
                (0, logger_js_1.logger)().info('CAP WebSocket disconnected');
                this.attemptReconnect();
            };
            this.wsConnection.onerror = (error) => {
                (0, logger_js_1.logger)().error({ error }, 'CAP WebSocket error');
            };
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error }, 'Failed to connect to CAP WebSocket');
        }
    }
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connectWebSocket(), 5000 * this.reconnectAttempts);
        }
    }
    /**
     * Handle incoming CAP events
     */
    async handleCAPEvent(event) {
        (0, logger_js_1.logger)().info({ event }, 'Received CAP event');
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
    registerLoan(orderId, loanId, borrowerDID, principal, repaymentAmount) {
        orderToLoan.set(orderId, {
            orderId,
            loanId,
            borrowerDID,
            principal,
            repaymentAmount,
        });
        (0, logger_js_1.logger)().info({ orderId, loanId, borrowerDID }, 'Loan registered with CAP');
    }
    /**
     * Handle loan repayment when order is paid
     */
    async handleLoanRepayment(orderId, amount) {
        const loanRelation = orderToLoan.get(orderId);
        if (!loanRelation || !loanRelation.loanId)
            return;
        // In production: call smart contract to process repayment
        // lendingPool.repayFromCAP(loanRelation.loanId, amount)
        (0, logger_js_1.logger)().info({ orderId: loanRelation.orderId, amount }, 'Processing CAP-based loan repayment');
    }
    /**
     * Get order details from CAP
     */
    async getOrder(orderId) {
        if (!config_js_1.config.CAP_API_URL) {
            return null;
        }
        try {
            // const response = await fetch(`${config.CAP_API_URL}/orders/${orderId}`, {
            //   headers: { 'Authorization': `Bearer ${config.CAP_API_KEY}` }
            // });
            // return response.json();
            return null;
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error, orderId }, 'Failed to fetch order from CAP');
            return null;
        }
    }
    /**
     * Register AgentLend as a provider in CROO Agent Store
     */
    async registerAgentLendDID() {
        // Register AgentLend DID with the Agent Store
        // This would use CROO SDK to register the service
        (0, logger_js_1.logger)().info('AgentLend DID registration (placeholder)');
    }
    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }
    }
}
exports.CAPService = CAPService;
exports.capService = new CAPService();
//# sourceMappingURL=capService.js.map