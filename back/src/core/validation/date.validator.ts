/**
 * version: 1.0.0
 * Simple date validator
 * 
 * Checks if a value represents a valid date.
 * Returns true/false only.
 * 
 * File: date.validator.ts (backend)
 */

/**
 * Simple date validator
 * @param value - Any value to check
 * @returns true if value is a valid date, false otherwise
 */
export function isValidDate(value: any): boolean {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return false;
  }

  // Handle empty string
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }

  // Handle special string values
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (['null', 'undefined', 'nan', 'invalid'].includes(trimmed)) {
      return false;
    }
  }

  // Try to parse as date
  const date = new Date(value);
  
  // Check if parsing resulted in a valid date
  return !isNaN(date.getTime());
}
