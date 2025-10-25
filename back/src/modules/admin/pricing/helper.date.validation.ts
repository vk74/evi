/**
 * version: 1.0.1
 * Helper functions for date validation in pricing module.
 * Backend file that provides timezone-aware date validation for price lists.
 * 
 * Functionality:
 * - Parses GMT±X timezone format from app settings cache
 * - Gets current time with timezone offset applied
 * - Validates price list dates (not in past, valid_to > valid_from)
 * - Includes 60-second margin for clock differences
 * 
 * File: helper.date.validation.ts (backend)
 */

import { getSettingValue } from '@/core/helpers/get.setting.value';
import { isValidDate } from '@/core/validation/date.validator';

/**
 * Parse timezone offset from GMT format (e.g., "GMT+3" -> 3, "GMT-5" -> -5)
 * @param timezoneString - Timezone string in GMT±X format
 * @returns Offset in hours, or 0 if parsing fails
 */
function parseTimezoneOffset(timezoneString: string): number {
  const match = timezoneString.match(/GMT([+-]\d+)/);
  if (!match) {
    console.warn(`Unable to parse timezone: ${timezoneString}, using GMT+0`);
    return 0;
  }
  return parseInt(match[1], 10);
}

/**
 * Get current timezone offset from app settings cache
 * @returns Timezone offset in hours (e.g., 3 for GMT+3)
 */
async function getTimezoneOffsetFromSettings(): Promise<number> {
  try {
    const timezone = await getSettingValue<string>(
      'Application.RegionalSettings',
      'current.timezone',
      'GMT+0'
    );
    
    return parseTimezoneOffset(timezone);
  } catch (error) {
    console.error('Error getting timezone from settings cache:', error);
    return 0;
  }
}

/**
 * Get current date/time with application timezone applied
 * @returns Current date in application timezone
 */
export async function getCurrentDateTimeInAppTimezone(): Promise<Date> {
  const offsetHours = await getTimezoneOffsetFromSettings();
  
  // Get current UTC time
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  
  // Apply application timezone offset
  const appTime = new Date(utcTime + (offsetHours * 3600000));
  
  return appTime;
}

/**
 * Check if date is in the past relative to application timezone
 * @param date - Date to check (as Date object or ISO string)
 * @param marginSeconds - Margin in seconds to allow for clock differences (default: 60)
 * @returns True if date is in the past (considering margin)
 */
export async function isDateInPast(date: Date | string, marginSeconds: number = 60): Promise<boolean> {
  const dateToCheck = typeof date === 'string' ? new Date(date) : date;
  const now = await getCurrentDateTimeInAppTimezone();
  
  // Subtract margin from current time to allow for clock differences
  const nowWithMargin = new Date(now.getTime() - (marginSeconds * 1000));
  
  return dateToCheck < nowWithMargin;
}

/**
 * Validation result interface
 */
export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate dates for price list creation
 * @param validFrom - Valid from date (ISO string)
 * @param validTo - Valid to date (ISO string)
 * @returns Validation result with error message if invalid
 */
export async function validatePriceListDatesForCreate(
  validFrom: string,
  validTo: string
): Promise<DateValidationResult> {
  // Check if dates are provided
  if (!validFrom || !validTo) {
    return {
      isValid: false,
      error: 'Both valid_from and valid_to dates are required'
    };
  }
  
  const fromDate = new Date(validFrom);
  const toDate = new Date(validTo);
  
  // Check date format validity
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format'
    };
  }
  
  // Check that valid_from is not in the past
  if (await isDateInPast(fromDate)) {
    return {
      isValid: false,
      error: 'Valid from date cannot be in the past'
    };
  }
  
  // Check that valid_to is not in the past
  if (await isDateInPast(toDate)) {
    return {
      isValid: false,
      error: 'Valid to date cannot be in the past'
    };
  }
  
  // Check that valid_to is after valid_from
  if (toDate <= fromDate) {
    return {
      isValid: false,
      error: 'Valid to date must be after valid from date'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate dates for price list update
 * @param validFrom - New valid from date (ISO string, optional)
 * @param validTo - New valid to date (ISO string, optional)
 * @param currentValidFrom - Current valid from date (ISO string, if validFrom not provided)
 * @param currentValidTo - Current valid to date (ISO string, if validTo not provided)
 * @returns Validation result with error message if invalid
 */
export async function validatePriceListDatesForUpdate(
  validFrom?: string,
  validTo?: string,
  currentValidFrom?: string,
  currentValidTo?: string
): Promise<DateValidationResult> {
  // If neither date is being updated, validation passes
  if (validFrom === undefined && validTo === undefined) {
    return { isValid: true };
  }
  
  // Determine effective dates (new or current)
  const effectiveValidFrom = validFrom || currentValidFrom;
  const effectiveValidTo = validTo || currentValidTo;
  
  if (!effectiveValidFrom || !effectiveValidTo) {
    return {
      isValid: false,
      error: 'Cannot validate dates: missing current or new date values'
    };
  }
  
  // Use universal date validator to check if values are valid dates
  if (!isValidDate(effectiveValidFrom)) {
    return {
      isValid: false,
      error: 'Invalid valid_from date format'
    };
  }
  
  if (!isValidDate(effectiveValidTo)) {
    return {
      isValid: false,
      error: 'Invalid valid_to date format'
    };
  }
  
  const fromDate = new Date(effectiveValidFrom);
  const toDate = new Date(effectiveValidTo);
  
  // If valid_from is being updated, check it's not in the past
  if (validFrom !== undefined && await isDateInPast(fromDate)) {
    return {
      isValid: false,
      error: 'Valid from date cannot be in the past'
    };
  }
  
  // If valid_to is being updated, check it's not in the past
  if (validTo !== undefined && await isDateInPast(toDate)) {
    return {
      isValid: false,
      error: 'Valid to date cannot be in the past'
    };
  }
  
  // Check that valid_to is after valid_from (regardless of which is being updated)
  if (toDate <= fromDate) {
    return {
      isValid: false,
      error: 'Valid to date must be after valid from date'
    };
  }
  
  return { isValid: true };
}

