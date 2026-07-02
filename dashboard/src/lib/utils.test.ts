import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatAddress,
  formatPercent,
  getScoreColor,
  getScoreLabel,
  getCollateralRatio,
  truncate,
  cn,
} from './utils.js';

describe('Utils', () => {
  describe('formatNumber', () => {
    it('should format billions correctly', () => {
      expect(formatNumber(1500000000)).toBe('2B'); // 1.5 rounds to 2
      expect(formatNumber(1500000000, 1)).toBe('1.5B');
    });

    it('should format millions correctly', () => {
      expect(formatNumber(1500000)).toBe('2M'); // 1.5 rounds to 2
      expect(formatNumber(1500000, 1)).toBe('1.5M');
    });

    it('should format thousands correctly', () => {
      expect(formatNumber(1500)).toBe('2K'); // 1.5 rounds to 2
      expect(formatNumber(1500, 1)).toBe('1.5K');
    });

    it('should format small numbers without suffix', () => {
      expect(formatNumber(150)).toBe('150');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56, 'USD', 2)).toBe('$1,234.56');
    });

    it('should format with custom decimals', () => {
      expect(formatCurrency(1000, 'USD', 0)).toBe('$1,000');
    });
  });

  describe('formatAddress', () => {
    it('should truncate address correctly', () => {
      const addr = '0x1234567890123456789012345678901234567890';
      expect(formatAddress(addr)).toBe('0x1234...7890'); // default chars=4, shows 4+2=6 chars
    });

    it('should handle short address', () => {
      expect(formatAddress('')).toBe('');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(50)).toBe('50.00%');
      expect(formatPercent(99.9)).toBe('99.90%');
    });
  });

  describe('getScoreColor', () => {
    it('should return green for excellent scores', () => {
      expect(getScoreColor(850)).toContain('green');
    });

    it('should return blue for good scores', () => {
      expect(getScoreColor(750)).toContain('blue');
    });

    it('should return yellow for fair scores', () => {
      expect(getScoreColor(650)).toContain('yellow');
    });

    it('should return orange for poor scores', () => {
      expect(getScoreColor(550)).toContain('orange');
    });

    it('should return red for very poor scores', () => {
      expect(getScoreColor(400)).toContain('red');
    });
  });

  describe('getScoreLabel', () => {
    it('should return Excellent for high scores', () => {
      expect(getScoreLabel(850)).toBe('Excellent');
    });

    it('should return Good for scores >= 700', () => {
      expect(getScoreLabel(750)).toBe('Good');
    });

    it('should return Fair for scores >= 600', () => {
      expect(getScoreLabel(650)).toBe('Fair');
    });

    it('should return Poor for scores >= 500', () => {
      expect(getScoreLabel(550)).toBe('Poor');
    });

    it('should return Very Poor for low scores', () => {
      expect(getScoreLabel(400)).toBe('Very Poor');
    });
  });

  describe('getCollateralRatio', () => {
    it('should return 10% for scores >= 900', () => {
      expect(getCollateralRatio(900)).toBe(10);
    });

    it('should return 15% for scores >= 700', () => {
      expect(getCollateralRatio(800)).toBe(15);
    });

    it('should return 25% for scores >= 500', () => {
      expect(getCollateralRatio(600)).toBe(25);
    });

    it('should return 40% for low scores', () => {
      expect(getCollateralRatio(400)).toBe(40);
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long strings', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
    });
  });

  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      expect(cn('text-red-500', false && 'hidden', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });
  });
});