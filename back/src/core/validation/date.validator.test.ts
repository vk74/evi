/**
 * version: 1.0.0
 * Tests for date validator
 * 
 * File: date.validator.test.ts (backend)
 */

import { isValidDate } from './date.validator';

describe('Date Validator', () => {
  describe('isValidDate', () => {
    it('should return false for null and undefined', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('   ')).toBe(false);
    });

    it('should return false for special string values', () => {
      expect(isValidDate('null')).toBe(false);
      expect(isValidDate('undefined')).toBe(false);
      expect(isValidDate('nan')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('NULL')).toBe(false);
      expect(isValidDate('UNDEFINED')).toBe(false);
    });

    it('should return true for valid date strings', () => {
      expect(isValidDate('2023-12-25')).toBe(true);
      expect(isValidDate('2023-12-25T10:30:00Z')).toBe(true);
      expect(isValidDate('2023-12-25T10:30:00.000Z')).toBe(true);
      expect(isValidDate('Dec 25, 2023')).toBe(true);
      expect(isValidDate('12/25/2023')).toBe(true);
    });

    it('should return true for valid Date objects', () => {
      expect(isValidDate(new Date('2023-12-25'))).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return true for valid timestamps', () => {
      expect(isValidDate(1703520000000)).toBe(true); // Valid timestamp
      expect(isValidDate(0)).toBe(true); // Unix epoch
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('32/13/2023')).toBe(false);
      expect(isValidDate('2023-13-32')).toBe(false);
    });

    it('should return false for invalid Date objects', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate(new Date(NaN))).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isValidDate({})).toBe(false);
      expect(isValidDate([])).toBe(false);
      expect(isValidDate(true)).toBe(false);
      expect(isValidDate(false)).toBe(false);
    });
  });
});
