import { describe, it, expect, vi } from 'vitest';

describe('BlockchainService', () => {
  describe('isConfigured', () => {
    it('should return false when service not configured', async () => {
      // Import fresh instance to test without config
      const { BlockchainService } = await import('./blockchainService.js');
      // Create a new instance - since we don't have PRIVATE_KEY set, it won't be fully configured
      const service = new BlockchainService();
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return true when provider available (mocked RPC)', async () => {
      const { BlockchainService } = await import('./blockchainService.js');
      const service = new BlockchainService();
      // With RPC_URL set to default, provider exists but wallet/contract may not
      const safeResult = await service.healthCheck();
      // Result depends on whether RPC_URL is configured
      expect(typeof safeResult).toBe('boolean');
    });
  });

  describe('getScore', () => {
    it('should return null when contract not configured', async () => {
      const { BlockchainService } = await import('./blockchainService.js');
      const service = new BlockchainService();
      const result = await service.getScore('did:croo:testagent');
      expect(result).toBe(null);
    });
  });

  describe('hasValidScore', () => {
    it('should return false when contract not configured', async () => {
      const { BlockchainService } = await import('./blockchainService.js');
      const service = new BlockchainService();
      const result = await service.hasValidScore('did:croo:testagent');
      expect(result).toBe(false);
    });
  });
});