import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { ethers } from 'ethers';
import type { ACSScore, AgentDID } from '../types/index.js';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private acsOracleContract: ethers.Contract | null = null;

  // ACS Oracle ABI (minimal for setScore)
  private static readonly ACS_ORACLE_ABI = [
    'function setScore(bytes32 agentDID, uint256 score, uint256 timestamp, uint256 expiry, bytes signature) external',
    'function getScore(bytes32 agentDID) external view returns (uint256 score, uint256 timestamp, uint256 expiry)',
    'function hasValidScore(bytes32 agentDID) external view returns (bool)',
    'function oracleSigner() external view returns (address)',
    'event ScoreUpdated(bytes32 indexed agentDID, uint256 score, uint256 timestamp, uint256 expiry)',
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!config.RPC_URL) {
      logger().warn('RPC_URL not configured, blockchain service disabled');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
      logger().info({ rpcUrl: config.RPC_URL }, 'Blockchain provider initialized');

      if (config.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
        logger().info({ address: this.wallet.address }, 'Oracle wallet initialized');
      }

      if (config.ACS_ORACLE_ADDRESS && this.wallet) {
        this.acsOracleContract = new ethers.Contract(
          config.ACS_ORACLE_ADDRESS,
          BlockchainService.ACS_ORACLE_ABI,
          this.wallet
        );
        logger().info({ address: config.ACS_ORACLE_ADDRESS }, 'ACS Oracle contract connected');
      }
    } catch (error) {
      logger().error({ error }, 'Failed to initialize blockchain service');
    }
  }

  /**
   * Push ACS score to the oracle contract
   */
  async pushScore(score: ACSScore): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.acsOracleContract || !this.wallet) {
      return { success: false, error: 'Blockchain service not configured' };
    }

    try {
      // Convert agentDID to bytes32
      const agentDIDBytes32 = ethers.keccak256(ethers.toUtf8Bytes(score.agentDID));

      // Create digest for signing
      const digest = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'uint256', 'uint256', 'uint256'],
          [agentDIDBytes32, score.score, score.timestamp, score.expiry]
        )
      );

      // Sign with oracle signer
      const signature = await this.wallet.signMessage(ethers.getBytes(digest));

      logger().info(
        { agentDID: score.agentDID, score: score.score, txHash: 'pending' },
        'Submitting score to ACS Oracle'
      );

      // Submit transaction
      const tx = await this.acsOracleContract.setScore(
        agentDIDBytes32,
        score.score,
        score.timestamp,
        score.expiry,
        signature
      );

      const receipt = await tx.wait();

      logger.info(
        { agentDID: score.agentDID, txHash: receipt?.hash, blockNumber: receipt?.blockNumber },
        'Score successfully pushed to ACS Oracle'
      );

      return { success: true, txHash: receipt?.hash };
    } catch (error) {
      logger().error({ error, agentDID: score.agentDID }, 'Failed to push score to blockchain');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetch current valid score from oracle
   */
  async getScore(agentDID: AgentDID): Promise<{ score: number; timestamp: number; expiry: number } | null> {
    if (!this.acsOracleContract) {
      return null;
    }

    try {
      const agentDIDBytes32 = ethers.keccak256(ethers.toUtf8Bytes(agentDID));
      const [score, timestamp, expiry] = await this.acsOracleContract.getScore(agentDIDBytes32);

      if (Number(score) === 0) {
        return null;
      }

      return {
        score: Number(score),
        timestamp: Number(timestamp),
        expiry: Number(expiry),
      };
    } catch (error) {
      logger().error({ error, agentDID }, 'Failed to fetch score from oracle');
      return null;
    }
  }

  /**
   * Check if agent has valid score
   */
  async hasValidScore(agentDID: AgentDID): Promise<boolean> {
    if (!this.acsOracleContract) {
      return false;
    }

    try {
      const agentDIDBytes32 = ethers.keccak256(ethers.toUtf8Bytes(agentDID));
      return await this.acsOracleContract.hasValidScore(agentDIDBytes32);
    } catch (error) {
      logger().error({ error, agentDID }, 'Failed to check score validity');
      return false;
    }
  }

  /**
   * Get oracle signer address
   */
  async getOracleSigner(): Promise<string | null> {
    if (!this.acsOracleContract) {
      return null;
    }

    try {
      return await this.acsOracleContract.oracleSigner();
    } catch (error) {
      logger().error({ error }, 'Failed to get oracle signer');
      return null;
    }
  }

  /**
   * Health check for blockchain connectivity
   */
  async healthCheck(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      logger().error({ error }, 'Blockchain health check failed');
      return false;
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.provider && this.wallet && this.acsOracleContract);
  }
}

export const blockchainService = new BlockchainService();