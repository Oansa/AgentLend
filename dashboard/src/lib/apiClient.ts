import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ACSScoreResponse {
  success: boolean;
  data?: {
    agentDID: string;
    score: number;
    timestamp: number;
    expiry: number;
    factors?: Record<string, number>;
  };
  error?: string;
  requestId: string;
  timestamp: number;
}

export interface ScoreRequest {
  agentDID: string;
  walletAddress: string;
  onChainData?: {
    walletAddress: string;
    transactionCount?: number;
    totalVolumeUSD?: number;
    uniqueCounterparties?: number;
    avgTransactionSizeUSD?: number;
    daysActive?: number;
    tokenDiversity?: number;
    defiInteractions?: number;
    lendingHistory?: {
      loansCount: number;
      repaidOnTime: number;
      defaulted: number;
      totalBorrowedUSD: number;
      totalRepaidUSD: number;
    };
    collateralHistory?: {
      totalDepositedUSD: number;
      liquidationsCount: number;
      currentCollateralUSD: number;
    };
  };
  offChainData?: {
    reputationScore?: number;
    kycVerified?: boolean;
    twitterFollowers?: number;
    githubContributions?: number;
    domainExpertise?: string[];
  };
}

export const apiClient = {
  /**
   * Calculate ACS score
   */
  async calculateScore(input: ScoreRequest): Promise<ACSScoreResponse> {
    const response = await axios.post<ACSScoreResponse>(`${API_BASE_URL}/score`, input);
    return response.data;
  },

  /**
   * Enqueue score calculation (async)
   */
  async enqueueScore(input: ScoreRequest & { priority?: 'low' | 'normal' | 'high' }): Promise<{ requestId: string; jobId: string }> {
    const response = await axios.post<{ requestId: string; jobId: string }>(`${API_BASE_URL}/score/enqueue`, input);
    return response.data;
  },

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{ status: string; progress: number; result?: any }> {
    const response = await axios.get<{ status: string; progress: number; result?: any }>(`${API_BASE_URL}/score/job/${jobId}`);
    return response.data;
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  /**
   * Get protocol metrics
   */
  async getMetrics(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/metrics`);
    return response.data;
  },
};