/**
 * @file validate.phone.mask.ts
 * Version: 1.0.0
 * Helper for validating phone input mask strings.
 * Frontend file that provides phone mask validation functionality.
 * Validates that mask contains only allowed characters: digits, +, spaces, parentheses, commas.
 */

/**
 * Validates if a string is a valid phone input mask
 * 
 * @param maskString - The string to validate as phone mask
 * @returns Object with validation result and error message if invalid
 */
export function validatePhoneMask(maskString: string): { isValid: boolean; error?: string } {
  try {
    // Check if string is not empty
    if (!maskString || maskString.trim() === '') {
      return {
        isValid: false,
        error: 'Phone mask cannot be empty'
      };
    }

    // Allowed characters: digits (0-9), +, spaces, parentheses (), commas, hyphens, # (placeholder for digits)
    const allowedPattern = /^[0-9+\s(),#-]+$/;
    
    if (!allowedPattern.test(maskString)) {
      // Find invalid characters
      const invalidChars = maskString.split('').filter(char => !/[0-9+\s(),#-]/.test(char));
      const uniqueInvalidChars = [...new Set(invalidChars)];
      
      return {
        isValid: false,
        error: `Phone mask contains invalid characters: ${uniqueInvalidChars.join(', ')}. Only digits, +, spaces, parentheses, commas, hyphens, and # (digit placeholder) are allowed.`
      };
    }

    // Check for balanced parentheses
    const parenthesesValidation = validateBalancedParentheses(maskString);
    if (!parenthesesValidation.isValid) {
      return parenthesesValidation;
    }

    // Check for reasonable mask structure
    const structureValidation = validateMaskStructure(maskString);
    if (!structureValidation.isValid) {
      return structureValidation;
    }

    return {
      isValid: true
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      isValid: false,
      error: `Invalid phone mask: ${errorMessage}`
    };
  }
}

/**
 * Validates balanced parentheses in mask string
 * 
 * @param maskString - The mask string to check
 * @returns Object with validation result and error message if invalid
 */
function validateBalancedParentheses(maskString: string): { isValid: boolean; error?: string } {
  let openCount = 0;
  
  for (let i = 0; i < maskString.length; i++) {
    const char = maskString[i];
    
    if (char === '(') {
      openCount++;
    } else if (char === ')') {
      openCount--;
      if (openCount < 0) {
        return {
          isValid: false,
          error: `Unmatched closing parenthesis at position ${i}`
        };
      }
    }
  }
  
  if (openCount > 0) {
    return {
      isValid: false,
      error: `${openCount} unclosed parentheses found`
    };
  }
  
  return { isValid: true };
}

/**
 * Validates mask structure for reasonable phone number patterns
 * 
 * @param maskString - The mask string to check
 * @returns Object with validation result and error message if invalid
 */
function validateMaskStructure(maskString: string): { isValid: boolean; error?: string } {
  // Check if mask has at least some digits or digit placeholders
  if (!/[0-9#]/.test(maskString)) {
    return {
      isValid: false,
      error: 'Phone mask must contain at least one digit or digit placeholder (#)'
    };
  }

  // Check for reasonable length (not too short, not too long)
  if (maskString.length < 3) {
    return {
      isValid: false,
      error: 'Phone mask is too short (minimum 3 characters)'
    };
  }

  if (maskString.length > 50) {
    return {
      isValid: false,
      error: 'Phone mask is too long (maximum 50 characters)'
    };
  }

  // Check for consecutive special characters (might indicate malformed mask)
  if (/[+\s(),-]{3,}/.test(maskString)) {
    return {
      isValid: false,
      error: 'Phone mask contains too many consecutive special characters'
    };
  }

  return { isValid: true };
}

/**
 * Generates a regex pattern from a phone mask
 * 
 * @param maskString - The phone mask string
 * @returns Object with generated regex and any warnings
 */
export function generateRegexFromMask(maskString: string): { regex: string; warnings?: string[] } {
  const warnings: string[] = [];
  
  // Escape special regex characters and replace # with \d
  let regex = maskString
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/#/g, '\\d'); // Replace # with digit pattern
  
  // Add anchors
  regex = '^' + regex + '$';
  
  // Check for potential issues
  if (maskString.includes(' ')) {
    warnings.push('Mask contains spaces - ensure your regex handles them correctly');
  }
  
  if (maskString.includes('(') || maskString.includes(')')) {
    warnings.push('Mask contains parentheses - ensure your regex handles them correctly');
  }
  
  if (maskString.includes('-')) {
    warnings.push('Mask contains hyphens - ensure your regex handles them correctly');
  }
  
  return {
    regex,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Tests if a phone number matches a mask pattern
 * 
 * @param phoneNumber - The phone number to test
 * @param maskString - The mask pattern to match against
 * @returns Object with match result and error if mask is invalid
 */
export function testPhoneMaskMatch(phoneNumber: string, maskString: string): { matches: boolean; error?: string } {
  const maskValidation = validatePhoneMask(maskString);
  
  if (!maskValidation.isValid) {
    return {
      matches: false,
      error: maskValidation.error
    };
  }
  
  try {
    const { regex } = generateRegexFromMask(maskString);
    const pattern = new RegExp(regex);
    return {
      matches: pattern.test(phoneNumber)
    };
  } catch (error) {
    return {
      matches: false,
      error: `Error testing phone mask: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
