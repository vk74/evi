/**
 * timezone.eventBus.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: Manages timezone configuration for event bus
 * Logic: Loads timezone from application settings on initialization and provides
 *        access to current timezone offset for timestamp generation
 * Architecture: Caches timezone setting to avoid repeated database queries
 */

import { getSettingValue } from '../helpers/get.setting.value';

// Cached timezone offset in hours
let cachedTimezoneOffset: number = 0; // Default GMT (GMT+0)
let cachedTimezoneString: string = 'GMT';

/**
 * Parse timezone string (e.g., "GMT+3", "GMT-5", "GMT") to offset in hours
 * @param timezoneStr - Timezone string from settings
 * @returns Offset in hours (positive for east, negative for west)
 */
function parseTimezoneOffset(timezoneStr: string): number {
  // Handle GMT without offset (GMT+0)
  if (timezoneStr === 'GMT') {
    return 0;
  }
  
  // Remove GMT prefix and parse the offset
  const match = timezoneStr.match(/GMT([+-]?\d+)/);
  
  if (!match) {
    console.error(`Invalid timezone format: ${timezoneStr}, using default GMT`);
    return 0;
  }
  
  const offset = parseInt(match[1], 10);
  
  // Validate offset range (-12 to +14)
  if (offset < -12 || offset > 14) {
    console.error(`Timezone offset out of range: ${offset}, using default GMT`);
    return 0;
  }
  
  return offset;
}

/**
 * Initialize timezone from application settings
 * Should be called once during event bus initialization
 */
export async function initializeTimezone(): Promise<void> {
  try {
    const timezone = await getSettingValue<string>(
      'Application.RegionalSettings',
      'current.timezone',
      'GMT'
    );
    
    cachedTimezoneString = timezone;
    cachedTimezoneOffset = parseTimezoneOffset(timezone);
    
    console.log(`Event Bus timezone initialized: ${timezone} (offset: ${cachedTimezoneOffset > 0 ? '+' : ''}${cachedTimezoneOffset})`);
  } catch (error) {
    console.error('Failed to initialize Event Bus timezone, using default GMT:', error);
    cachedTimezoneString = 'GMT';
    cachedTimezoneOffset = 0;
  }
}

/**
 * Get current timezone offset in hours
 * @returns Offset in hours (positive for east, negative for west)
 */
export function getTimezoneOffset(): number {
  return cachedTimezoneOffset;
}

/**
 * Get current timezone string
 * @returns Timezone string (e.g., "GMT+3")
 */
export function getTimezoneString(): string {
  return cachedTimezoneString;
}

/**
 * Convert UTC Date to local time with current timezone offset
 * @param utcDate - Date object in UTC
 * @returns Date object adjusted to local timezone
 */
export function convertToLocalTime(utcDate: Date = new Date()): Date {
  const localDate = new Date(utcDate.getTime() + cachedTimezoneOffset * 60 * 60 * 1000);
  return localDate;
}

/**
 * Get current local timestamp in ISO format with timezone offset
 * This is the main function used by event fabric for timestamp generation
 * @returns ISO timestamp string in local timezone
 */
export function getCurrentLocalTimestamp(): string {
  const localDate = convertToLocalTime();
  return localDate.toISOString();
}

/**
 * Reset timezone to default (used for testing)
 */
export function resetTimezoneToDefault(): void {
  cachedTimezoneString = 'GMT';
  cachedTimezoneOffset = 0;
  console.log('Event Bus timezone reset to default GMT');
}

export default {
  initializeTimezone,
  getTimezoneOffset,
  getTimezoneString,
  convertToLocalTime,
  getCurrentLocalTimestamp,
  resetTimezoneToDefault
};

