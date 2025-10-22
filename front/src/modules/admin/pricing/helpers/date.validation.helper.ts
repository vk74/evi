/**
 * version: 1.0.0
 * Helper functions for date validation in pricing module.
 * Frontend file that provides timezone-aware date validation for price lists.
 * 
 * Functionality:
 * - Parses GMT±X timezone format from app settings
 * - Gets current time with timezone offset applied
 * - Validates price list dates (not in past, valid_to > valid_from)
 * 
 * File: date.validation.helper.ts (frontend)
 */

import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings'

/**
 * Parse timezone offset from GMT format (e.g., "GMT+3" -> 3, "GMT-5" -> -5)
 * @param timezoneString - Timezone string in GMT±X format
 * @returns Offset in hours, or 0 if parsing fails
 */
function parseTimezoneOffset(timezoneString: string): number {
  const match = timezoneString.match(/GMT([+-]\d+)/)
  if (!match) {
    console.warn(`Unable to parse timezone: ${timezoneString}, using GMT+0`)
    return 0
  }
  return parseInt(match[1], 10)
}

/**
 * Get current timezone from app settings
 * @returns Timezone offset in hours (e.g., 3 for GMT+3)
 */
function getTimezoneOffset(): number {
  try {
    const settingsStore = useAppSettingsStore()
    const uiSettings = settingsStore.getUiSettings()
    
    // Find current.timezone setting
    const timezoneSetting = uiSettings.find(
      setting => setting.setting_name === 'current.timezone' && 
                 setting.section_path === 'Application.RegionalSettings'
    )
    
    if (timezoneSetting && typeof timezoneSetting.value === 'string') {
      return parseTimezoneOffset(timezoneSetting.value)
    }
    
    console.warn('Timezone setting not found, using GMT+0')
    return 0
  } catch (error) {
    console.error('Error getting timezone from settings:', error)
    return 0
  }
}

/**
 * Get current date/time with application timezone applied
 * @returns Current date in application timezone
 */
export function getCurrentDateTimeInAppTimezone(): Date {
  const now = new Date()
  const offsetHours = getTimezoneOffset()
  
  // Get UTC time in milliseconds
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  
  // Apply application timezone offset
  const appTime = new Date(utcTime + (offsetHours * 3600000))
  
  return appTime
}

/**
 * Check if date is in the past relative to application timezone
 * @param date - Date to check (as Date object or ISO string)
 * @returns True if date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const dateToCheck = typeof date === 'string' ? new Date(date) : date
  const now = getCurrentDateTimeInAppTimezone()
  
  return dateToCheck < now
}

/**
 * Validation result interface
 */
export interface DateValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate dates for price list creation
 * @param validFrom - Valid from date (ISO string)
 * @param validTo - Valid to date (ISO string)
 * @returns Validation result with error message if invalid
 */
export function validatePriceListDatesForCreate(
  validFrom: string,
  validTo: string
): DateValidationResult {
  // Check if dates are provided
  if (!validFrom || !validTo) {
    return {
      isValid: false,
      error: 'Both valid_from and valid_to dates are required'
    }
  }
  
  const fromDate = new Date(validFrom)
  const toDate = new Date(validTo)
  
  // Check date format validity
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format'
    }
  }
  
  // Check that valid_from is not in the past
  if (isDateInPast(fromDate)) {
    return {
      isValid: false,
      error: 'Valid from date cannot be in the past'
    }
  }
  
  // Check that valid_to is not in the past
  if (isDateInPast(toDate)) {
    return {
      isValid: false,
      error: 'Valid to date cannot be in the past'
    }
  }
  
  // Check that valid_to is after valid_from
  if (toDate <= fromDate) {
    return {
      isValid: false,
      error: 'Valid to date must be after valid from date'
    }
  }
  
  return { isValid: true }
}

/**
 * Validate dates for price list update
 * @param validFrom - New valid from date (ISO string, optional)
 * @param validTo - New valid to date (ISO string, optional)
 * @param currentValidFrom - Current valid from date (ISO string, if validFrom not provided)
 * @param currentValidTo - Current valid to date (ISO string, if validTo not provided)
 * @returns Validation result with error message if invalid
 */
export function validatePriceListDatesForUpdate(
  validFrom?: string,
  validTo?: string,
  currentValidFrom?: string,
  currentValidTo?: string
): DateValidationResult {
  // If neither date is being updated, validation passes
  if (validFrom === undefined && validTo === undefined) {
    return { isValid: true }
  }
  
  // Determine effective dates (new or current)
  const effectiveValidFrom = validFrom || currentValidFrom
  const effectiveValidTo = validTo || currentValidTo
  
  if (!effectiveValidFrom || !effectiveValidTo) {
    return {
      isValid: false,
      error: 'Cannot validate dates: missing current or new date values'
    }
  }
  
  const fromDate = new Date(effectiveValidFrom)
  const toDate = new Date(effectiveValidTo)
  
  // Check date format validity
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format'
    }
  }
  
  // If valid_from is being updated, check it's not in the past
  if (validFrom !== undefined && isDateInPast(fromDate)) {
    return {
      isValid: false,
      error: 'Valid from date cannot be in the past'
    }
  }
  
  // If valid_to is being updated, check it's not in the past
  if (validTo !== undefined && isDateInPast(toDate)) {
    return {
      isValid: false,
      error: 'Valid to date cannot be in the past'
    }
  }
  
  // Check that valid_to is after valid_from (regardless of which is being updated)
  if (toDate <= fromDate) {
    return {
      isValid: false,
      error: 'Valid to date must be after valid from date'
    }
  }
  
  return { isValid: true }
}

