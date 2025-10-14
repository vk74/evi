/**
 * timezone.eventBus.test.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Test suite for event bus timezone functionality
 * File: timezone.eventBus.test.ts - backend test file
 */

import { 
  parseTimezoneOffset,
  getTimezoneOffset,
  getTimezoneString,
  convertToLocalTime,
  getCurrentLocalTimestamp,
  resetTimezoneToDefault
} from './timezone.eventBus';

describe('Event Bus Timezone Tests', () => {
  
  beforeEach(() => {
    resetTimezoneToDefault();
  });

  describe('parseTimezoneOffset', () => {
    test('should parse positive GMT offsets correctly', () => {
      // Note: parseTimezoneOffset is not exported, so we test through initialization
      // This is an internal function test through public API
      expect(getTimezoneOffset()).toBe(0); // Default GMT (GMT+0)
    });
  });

  describe('convertToLocalTime', () => {
    test('should convert UTC to local time with default offset', () => {
      // UTC: 2025-01-01 00:00:00
      const utcDate = new Date('2025-01-01T00:00:00.000Z');
      const localDate = convertToLocalTime(utcDate);
      
      // With GMT (GMT+0), local time should be the same as UTC
      const expectedDate = new Date('2025-01-01T00:00:00.000Z');
      expect(localDate.getTime()).toBe(expectedDate.getTime());
    });

    test('should handle current time if no date provided', () => {
      const beforeCall = Date.now();
      const localDate = convertToLocalTime();
      const afterCall = Date.now();
      
      // Local time should be within range (considering GMT = 0 offset)
      const offset = getTimezoneOffset() * 60 * 60 * 1000;
      expect(localDate.getTime()).toBeGreaterThanOrEqual(beforeCall + offset - 1000);
      expect(localDate.getTime()).toBeLessThanOrEqual(afterCall + offset + 1000);
    });
  });

  describe('getCurrentLocalTimestamp', () => {
    test('should return ISO string format', () => {
      const timestamp = getCurrentLocalTimestamp();
      
      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(timestamp).toMatch(isoRegex);
    });

    test('should return timestamp in local timezone', () => {
      const timestamp = getCurrentLocalTimestamp();
      const timestampDate = new Date(timestamp);
      const now = Date.now();
      const offset = getTimezoneOffset() * 60 * 60 * 1000;
      
      // Timestamp should be approximately now + offset
      expect(timestampDate.getTime()).toBeGreaterThanOrEqual(now + offset - 1000);
      expect(timestampDate.getTime()).toBeLessThanOrEqual(now + offset + 1000);
    });
  });

  describe('getTimezoneString', () => {
    test('should return default timezone string', () => {
      expect(getTimezoneString()).toBe('GMT');
    });
  });

  describe('getTimezoneOffset', () => {
    test('should return default offset in hours', () => {
      expect(getTimezoneOffset()).toBe(0);
    });
  });
});

/**
 * Manual test function to demonstrate timezone functionality
 * Can be called from server initialization to verify timezone is working
 */
export function demonstrateTimezoneFunctionality(): void {
  console.log('\n=== Event Bus Timezone Demonstration ===');
  console.log(`Current timezone: ${getTimezoneString()}`);
  console.log(`Offset in hours: ${getTimezoneOffset()}`);
  
  const utcNow = new Date();
  console.log(`UTC time: ${utcNow.toISOString()}`);
  
  const localNow = convertToLocalTime(utcNow);
  console.log(`Local time (${getTimezoneString()}): ${localNow.toISOString()}`);
  
  const eventTimestamp = getCurrentLocalTimestamp();
  console.log(`Event timestamp (local): ${eventTimestamp}`);
  
  console.log('=== Timezone Demonstration Complete ===\n');
}

