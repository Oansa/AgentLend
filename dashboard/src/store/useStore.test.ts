import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore.js';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      isSidebarOpen: true,
      theme: 'light',
      network: 'testnet',
    });
  });

  describe('sidebar', () => {
    it('should have isSidebarOpen true by default', () => {
      expect(useStore.getState().isSidebarOpen).toBe(true);
    });

    it('should toggle sidebar', () => {
      useStore.getState().toggleSidebar();
      expect(useStore.getState().isSidebarOpen).toBe(false);
      useStore.getState().toggleSidebar();
      expect(useStore.getState().isSidebarOpen).toBe(true);
    });

    it('should set sidebar open', () => {
      useStore.getState().setSidebarOpen(false);
      expect(useStore.getState().isSidebarOpen).toBe(false);
    });
  });

  describe('theme', () => {
    it('should have light theme by default', () => {
      expect(useStore.getState().theme).toBe('light');
    });

    it('should toggle theme', () => {
      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe('dark');
      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe('light');
    });
  });

  describe('network', () => {
    it('should have testnet by default', () => {
      expect(useStore.getState().network).toBe('testnet');
    });

    it('should set network', () => {
      useStore.getState().setNetwork('mainnet');
      expect(useStore.getState().network).toBe('mainnet');
    });
  });
});