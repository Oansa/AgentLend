import type { AgentDID } from '../types/index.js';
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
export declare class CAPService {
    private wsConnection;
    private reconnectAttempts;
    private maxReconnectAttempts;
    /**
     * Connect to CROO WebSocket for real-time order events
     */
    connectWebSocket(): Promise<void>;
    private attemptReconnect;
    /**
     * Handle incoming CAP events
     */
    private handleCAPEvent;
    /**
     * Register a loan with its originating order
     */
    registerLoan(orderId: string, loanId: bigint, borrowerDID: AgentDID, principal: bigint, repaymentAmount: bigint): void;
    /**
     * Handle loan repayment when order is paid
     */
    handleLoanRepayment(orderId: string, amount: bigint): Promise<void>;
    /**
     * Get order details from CAP
     */
    getOrder(orderId: string): Promise<CAPOrder | null>;
    /**
     * Register AgentLend as a provider in CROO Agent Store
     */
    registerAgentLendDID(): Promise<void>;
    /**
     * Disconnect WebSocket
     */
    disconnect(): void;
}
export declare const capService: CAPService;
//# sourceMappingURL=capService.d.ts.map