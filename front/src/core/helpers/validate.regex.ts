/**
 * @file validate.regex.ts
 * Version: 1.0.0
 * Helper for validating regex strings safely without causing client crashes.
 * Frontend file that provides regex validation functionality for settings.
 * Uses the same validation logic as backend to ensure consistency.
 */

/**
 * Validates if a string is a valid regular expression
 * 
 * @param regexString - The string to validate as regex
 * @returns Object with validation result and error message if invalid
 */
export function validateRegexString(regexString: string): { isValid: boolean; error?: string } {
  try {
    // Check if string is not empty
    if (!regexString || regexString.trim() === '') {
      return {
        isValid: false,
        error: 'Regular expression cannot be empty'
      };
    }

    // Try to create RegExp object
    new RegExp(regexString);
    
    return {
      isValid: true
    };
  } catch (error) {
    // Extract meaningful error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      isValid: false,
      error: `Invalid regular expression: ${errorMessage}`
    };
  }
}

/**
 * Validates regex string with additional checks for common issues
 * 
 * @param regexString - The string to validate as regex
 * @returns Object with validation result and detailed error message if invalid
 */
export function validateRegexStringDetailed(regexString: string): { isValid: boolean; error?: string; warnings?: string[] } {
  const basicValidation = validateRegexString(regexString);
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const warnings: string[] = [];
  
  // Check for common regex issues
  if (regexString.includes('**')) {
    warnings.push('Double asterisk (**) may cause performance issues');
  }
  
  if (regexString.includes('++')) {
    warnings.push('Double plus (++) may cause performance issues');
  }
  
  if (regexString.includes('??')) {
    warnings.push('Double question mark (??) may cause performance issues');
  }
  
  // Check for potentially dangerous patterns
  if (regexString.includes('.*.*')) {
    warnings.push('Multiple .* patterns may cause performance issues');
  }
  
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Tests if a regex string matches a test string
 * 
 * @param regexString - The regex string to test
 * @param testString - The string to test against
 * @returns Object with match result and error if regex is invalid
 */
export function testRegexMatch(regexString: string, testString: string): { matches: boolean; error?: string } {
  const validation = validateRegexString(regexString);
  
  if (!validation.isValid) {
    return {
      matches: false,
      error: validation.error
    };
  }
  
  try {
    const regex = new RegExp(regexString);
    return {
      matches: regex.test(testString)
    };
  } catch (error) {
    return {
      matches: false,
      error: `Error testing regex: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
