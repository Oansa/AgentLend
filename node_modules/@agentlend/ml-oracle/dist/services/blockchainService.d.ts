import type { ACSScore, AgentDID } from '../types/index.js';
export declare class BlockchainService {
    private provider;
    private wallet;
    private acsOracleContract;
    private static readonly ACS_ORACLE_ABI;
    constructor();
    private initialize;
    /**
     * Push ACS score to the oracle contract
     */
    pushScore(score: ACSScore): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    /**
     * Fetch current valid score from oracle
     */
    getScore(agentDID: AgentDID): Promise<{
        score: number;
        timestamp: number;
        expiry: number;
    } | null>;
    /**
     * Check if agent has valid score
     */
    hasValidScore(agentDID: AgentDID): Promise<boolean>;
    /**
     * Get oracle signer address
     */
    getOracleSigner(): Promise<string | null>;
    /**
     * Health check for blockchain connectivity
     */
    healthCheck(): Promise<boolean>;
    /**
     * Check if service is properly configured
     */
    isConfigured(): boolean;
}
export declare const blockchainService: BlockchainService;
//# sourceMappingURL=blockchainService.d.ts.map