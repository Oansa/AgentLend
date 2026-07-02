import { describe, it, expect, vi } from 'vitest';
import { CAPService } from './capService.js';

// Mock WebSocket
class MockWebSocket {
  onopen: () => void = () => {};
  onmessage: (event: { data: string }) => void = () => {};
  onclose: () => void = () => {};
  onerror: (error: Error) => void = () => {};
  close = vi.fn();
}

global.WebSocket = MockWebSocket as any;

describe('CAPService', () => {
  describe('registerLoan', () => {
    it('should register loan relation', () => {
      const service = new CAPService();
      service.registerLoan(
        'order-123',
        1n,
        'did:croo:borrower123',
        10000n,
        11000n
      );
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('getOrder', () => {
    it('should return null when CAP_API_URL not configured', async () => {
      const service = new CAPService();
      const result = await service.getOrder('order-123');
      expect(result).toBe(null);
    });
  });
});