import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock ioredis and bullmq
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJob: vi.fn().mockResolvedValue(null),
    getWaitingCount: vi.fn().mockResolvedValue(0),
    getActiveCount: vi.fn().mockResolvedValue(0),
    getCompletedCount: vi.fn().mockResolvedValue(0),
    getFailedCount: vi.fn().mockResolvedValue(0),
    getDelayedCount: vi.fn().mockResolvedValue(0),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('QueueService', () => {
  describe('getQueueStats', () => {
    it('should return zero counts before initialization', async () => {
      // Clear module cache to get fresh state
      vi.resetModules();
      const { getQueueStats } = await import('./queueService.js');
      const stats = await getQueueStats();
      expect(stats.waiting).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.delayed).toBe(0);
    });
  });

  describe('initializeQueue', () => {
    it('should initialize queue without throwing', async () => {
      vi.resetModules();
      const { initializeQueue } = await import('./queueService.js');
      await expect(initializeQueue()).resolves.not.toThrow();
    });
  });
});