/**
 * version: 1.0.0
 * Security validation service
 * 
 * This file provides security validation with priority threat detection.
 * Backend file: security.validation.ts
 */

import { SecurityError, SecurityPattern } from './types.validation';
import { SECURITY_PATTERNS } from './rules.security';
import { getSecurityRule } from './cache.security.validation';

/**
 * Security check for a single value
 * @param value - Value to check for security threats
 * @returns Security check result
 */
export function securityCheck(value: string | number): { isSecure: boolean; error?: SecurityError } {
  const stringValue = String(value);
  
  // Check against all security patterns
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.pattern.test(stringValue)) {
      const securityError: SecurityError = {
        type: 'security',
        message: `Security threat detected: ${pattern.description}`,
        threatLevel: pattern.threatLevel,
        pattern: pattern.name,
        value: value
      };
      
      // Log security threat
      console.log(`SECURITY THREAT DETECTED: ${pattern.name}`, {
        threatLevel: pattern.threatLevel,
        pattern: pattern.name,
        description: pattern.description,
        value: stringValue.substring(0, 100) // Log first 100 chars for safety
      });
      
      return { isSecure: false, error: securityError };
    }
  }
  
  return { isSecure: true };
}

/**
 * Check value against specific security pattern
 * @param value - Value to check
 * @param patternName - Name of security pattern to check against
 * @returns Security check result
 */
export function checkSpecificPattern(value: string | number, patternName: string): { isSecure: boolean; error?: SecurityError } {
  const pattern = getSecurityRule(patternName);
  
  if (!pattern) {
    console.log(`Security pattern not found: ${patternName}`);
    return { isSecure: true }; // If pattern not found, assume secure
  }
  
  const stringValue = String(value);
  
  if (pattern.pattern.test(stringValue)) {
    const securityError: SecurityError = {
      type: 'security',
      message: `Security threat detected: ${pattern.description}`,
      threatLevel: pattern.threatLevel,
      pattern: pattern.name,
      value: value
    };
    
    console.log(`SECURITY THREAT DETECTED: ${pattern.name}`, {
      threatLevel: pattern.threatLevel,
      pattern: pattern.name,
      description: pattern.description,
      value: stringValue.substring(0, 100)
    });
    
    return { isSecure: false, error: securityError };
  }
  
  return { isSecure: true };
}

/**
 * Get all security patterns
 * @returns Array of all security patterns
 */
export function getAllSecurityPatterns(): SecurityPattern[] {
  return SECURITY_PATTERNS;
}

/**
 * Get security patterns by threat level
 * @param level - Threat level to filter by
 * @returns Array of security patterns with specified threat level
 */
export function getSecurityPatternsByLevel(level: 'low' | 'medium' | 'high' | 'critical'): SecurityPattern[] {
  return SECURITY_PATTERNS.filter(pattern => pattern.threatLevel === level);
} 