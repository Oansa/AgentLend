"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = exports.BlockchainService = void 0;
const config_js_1 = require("../config.js");
const logger_js_1 = require("../utils/logger.js");
const ethers_1 = require("ethers");
class BlockchainService {
    provider = null;
    wallet = null;
    acsOracleContract = null;
    // ACS Oracle ABI (minimal for setScore)
    static ACS_ORACLE_ABI = [
        'function setScore(bytes32 agentDID, uint256 score, uint256 timestamp, uint256 expiry, bytes signature) external',
        'function getScore(bytes32 agentDID) external view returns (uint256 score, uint256 timestamp, uint256 expiry)',
        'function hasValidScore(bytes32 agentDID) external view returns (bool)',
        'function oracleSigner() external view returns (address)',
        'event ScoreUpdated(bytes32 indexed agentDID, uint256 score, uint256 timestamp, uint256 expiry)',
    ];
    constructor() {
        this.initialize();
    }
    initialize() {
        if (!config_js_1.config.RPC_URL) {
            (0, logger_js_1.logger)().warn('RPC_URL not configured, blockchain service disabled');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(config_js_1.config.RPC_URL);
            (0, logger_js_1.logger)().info({ rpcUrl: config_js_1.config.RPC_URL }, 'Blockchain provider initialized');
            if (config_js_1.config.PRIVATE_KEY) {
                this.wallet = new ethers_1.ethers.Wallet(config_js_1.config.PRIVATE_KEY, this.provider);
                (0, logger_js_1.logger)().info({ address: this.wallet.address }, 'Oracle wallet initialized');
            }
            if (config_js_1.config.ACS_ORACLE_ADDRESS && this.wallet) {
                this.acsOracleContract = new ethers_1.ethers.Contract(config_js_1.config.ACS_ORACLE_ADDRESS, BlockchainService.ACS_ORACLE_ABI, this.wallet);
                (0, logger_js_1.logger)().info({ address: config_js_1.config.ACS_ORACLE_ADDRESS }, 'ACS Oracle contract connected');
            }
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error }, 'Failed to initialize blockchain service');
        }
    }
    /**
     * Push ACS score to the oracle contract
     */
    async pushScore(score) {
        if (!this.acsOracleContract || !this.wallet) {
            return { success: false, error: 'Blockchain service not configured' };
        }
        try {
            // Convert agentDID to bytes32
            const agentDIDBytes32 = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(score.agentDID));
            // Create digest for signing
            const digest = ethers_1.ethers.keccak256(ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'uint256', 'uint256', 'uint256'], [agentDIDBytes32, score.score, score.timestamp, score.expiry]));
            // Sign with oracle signer
            const signature = await this.wallet.signMessage(ethers_1.ethers.getBytes(digest));
            (0, logger_js_1.logger)().info({ agentDID: score.agentDID, score: score.score, txHash: 'pending' }, 'Submitting score to ACS Oracle');
            // Submit transaction
            const tx = await this.acsOracleContract.setScore(agentDIDBytes32, score.score, score.timestamp, score.expiry, signature);
            const receipt = await tx.wait();
            logger_js_1.logger.info({ agentDID: score.agentDID, txHash: receipt?.hash, blockNumber: receipt?.blockNumber }, 'Score successfully pushed to ACS Oracle');
            return { success: true, txHash: receipt?.hash };
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error, agentDID: score.agentDID }, 'Failed to push score to blockchain');
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Fetch current valid score from oracle
     */
    async getScore(agentDID) {
        if (!this.acsOracleContract) {
            return null;
        }
        try {
            const agentDIDBytes32 = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(agentDID));
            const [score, timestamp, expiry] = await this.acsOracleContract.getScore(agentDIDBytes32);
            if (Number(score) === 0) {
                return null;
            }
            return {
                score: Number(score),
                timestamp: Number(timestamp),
                expiry: Number(expiry),
            };
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error, agentDID }, 'Failed to fetch score from oracle');
            return null;
        }
    }
    /**
     * Check if agent has valid score
     */
    async hasValidScore(agentDID) {
        if (!this.acsOracleContract) {
            return false;
        }
        try {
            const agentDIDBytes32 = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(agentDID));
            return await this.acsOracleContract.hasValidScore(agentDIDBytes32);
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error, agentDID }, 'Failed to check score validity');
            return false;
        }
    }
    /**
     * Get oracle signer address
     */
    async getOracleSigner() {
        if (!this.acsOracleContract) {
            return null;
        }
        try {
            return await this.acsOracleContract.oracleSigner();
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error }, 'Failed to get oracle signer');
            return null;
        }
    }
    /**
     * Health check for blockchain connectivity
     */
    async healthCheck() {
        if (!this.provider) {
            return false;
        }
        try {
            await this.provider.getBlockNumber();
            return true;
        }
        catch (error) {
            (0, logger_js_1.logger)().error({ error }, 'Blockchain health check failed');
            return false;
        }
    }
    /**
     * Check if service is properly configured
     */
    isConfigured() {
        return !!(this.provider && this.wallet && this.acsOracleContract);
    }
}
exports.BlockchainService = BlockchainService;
exports.blockchainService = new BlockchainService();
//# sourceMappingURL=blockchainService.js.map