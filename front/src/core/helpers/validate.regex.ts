/**
 * @file validate.regex.ts
 * Version: 1.1.0
 * Helper for validating regex strings safely without causing client crashes.
 * Frontend file that provides regex validation functionality for settings.
 * Uses the same validation logic as backend to ensure consistency.
 * Enhanced with semantic validation to catch problematic regex patterns.
 */

/**
 * Validates if a string is a valid regular expression with semantic checks
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
    const regex = new RegExp(regexString);
    
    // Additional semantic validation
    const semanticValidation = validateRegexSemantics(regexString, regex);
    if (!semanticValidation.isValid) {
      return semanticValidation;
    }
    
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
 * Performs semantic validation of regex patterns
 * 
 * @param regexString - The regex string to validate
 * @param regex - The created RegExp object
 * @returns Object with validation result and error message if invalid
 */
function validateRegexSemantics(regexString: string, regex: RegExp): { isValid: boolean; error?: string } {
  // Check for unclosed brackets, parentheses, and braces
  const bracketValidation = validateBrackets(regexString);
  if (!bracketValidation.isValid) {
    return bracketValidation;
  }

  // Check for problematic quantifier patterns
  const quantifierValidation = validateQuantifiers(regexString);
  if (!quantifierValidation.isValid) {
    return quantifierValidation;
  }

  // Check if regex can actually match anything
  const matchabilityValidation = validateMatchability(regex, regexString);
  if (!matchabilityValidation.isValid) {
    return matchabilityValidation;
  }

  return { isValid: true };
}

/**
 * Validates bracket matching in regex string
 * 
 * @param regexString - The regex string to check
 * @returns Object with validation result and error message if invalid
 */
function validateBrackets(regexString: string): { isValid: boolean; error?: string } {
  const stack: string[] = [];
  const bracketPairs: { [key: string]: string } = {
    '[': ']',
    '(': ')',
    '{': '}'
  };
  const closingBrackets = new Set(Object.values(bracketPairs));

  for (let i = 0; i < regexString.length; i++) {
    const char = regexString[i];
    
    // Skip escaped characters
    if (char === '\\' && i + 1 < regexString.length) {
      i++; // Skip next character
      continue;
    }

    if (bracketPairs[char]) {
      // Opening bracket
      stack.push(char);
    } else if (closingBrackets.has(char)) {
      // Closing bracket
      if (stack.length === 0) {
        return {
          isValid: false,
          error: `Unmatched closing bracket '${char}' at position ${i}`
        };
      }
      
      const lastOpening = stack.pop()!;
      if (bracketPairs[lastOpening] !== char) {
        return {
          isValid: false,
          error: `Mismatched brackets: '${lastOpening}' and '${char}' at position ${i}`
        };
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      isValid: false,
      error: `Unclosed bracket '${unclosed}' - missing closing bracket`
    };
  }

  return { isValid: true };
}

/**
 * Validates quantifier patterns in regex string
 * 
 * @param regexString - The regex string to check
 * @returns Object with validation result and error message if invalid
 */
function validateQuantifiers(regexString: string): { isValid: boolean; error?: string } {
  // Check for problematic quantifier patterns
  const problematicPatterns = [
    { pattern: /\{\s*,\s*\}/, message: 'Empty quantifier {} is invalid' },
    { pattern: /\{\s*,\s*\d+\s*,\s*\}/, message: 'Quantifier with empty minimum is invalid' },
    { pattern: /\{\s*\d+\s*,\s*,\s*\}/, message: 'Quantifier with empty maximum is invalid' }
  ];

  for (const { pattern, message } of problematicPatterns) {
    if (pattern.test(regexString)) {
      return {
        isValid: false,
        error: message
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates if regex can actually match anything
 * 
 * @param regex - The RegExp object to test
 * @param regexString - The original regex string
 * @returns Object with validation result and error message if invalid
 */
function validateMatchability(regex: RegExp, regexString: string): { isValid: boolean; error?: string } {
  // Test strings to check if regex can match anything
  const testStrings = [
    'a', '1', 'test', 'Test123', 'hello', 'world',
    '123', 'abc', 'ABC', 'a1b2c3', 'test@example.com',
    'simple', 'complex', 'regex', 'pattern', 'match'
  ];

  // If regex never matches any test string, it's likely problematic
  const hasMatches = testStrings.some(testStr => {
    try {
      return regex.test(testStr);
    } catch (e) {
      return false;
    }
  });

  // Special case: if regex is just problematic quantifier patterns, it's invalid
  if (!hasMatches && /^[\{\}\d,\s]+$/.test(regexString)) {
    return {
      isValid: false,
      error: 'Regex pattern appears to be malformed quantifier syntax'
    };
  }

  return { isValid: true };
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
