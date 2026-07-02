import { describe, it, expect, vi } from 'vitest';
import { apiClient } from './apiClient.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { success: true, data: { agentDID: 'did:croo:test', score: 750 }, requestId: 'test', timestamp: Date.now() } }),
    get: vi.fn().mockResolvedValue({ data: { status: 'healthy' } }),
  },
}));

describe('apiClient', () => {
  describe('calculateScore', () => {
    it('should call the score endpoint', async () => {
      const input = {
        agentDID: 'did:croo:test',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };
      const result = await apiClient.calculateScore(input);
      expect(result.success).toBe(true);
    });
  });

  describe('enqueueScore', () => {
    it('should call the enqueue endpoint', async () => {
      const input = {
        agentDID: 'did:croo:test',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };
      const result = await apiClient.enqueueScore(input);
      expect(result.requestId).toBeDefined();
    });
  });

  describe('getJobStatus', () => {
    it('should call the job status endpoint', async () => {
      const result = await apiClient.getJobStatus('job-123');
      expect(result.status).toBe('healthy');
    });
  });

  describe('healthCheck', () => {
    it('should call the health endpoint', async () => {
      const result = await apiClient.healthCheck();
      expect(result.status).toBe('healthy');
    });
  });
});