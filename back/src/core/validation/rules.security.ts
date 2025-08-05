/**
 * version: 1.0.0
 * Security validation rules and threat patterns
 * 
 * This file contains security patterns for detecting various types of attacks.
 * Backend file: security.rules.ts
 */

import { SecurityPattern } from './types.validation';

// Security threat patterns for detecting attacks
export const SECURITY_PATTERNS: SecurityPattern[] = [
  // SQL Injection patterns
  {
    name: 'SQL Injection - Basic',
    pattern: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    threatLevel: 'high',
    description: 'Basic SQL injection attempt detected'
  },
  {
    name: 'SQL Injection - Comments',
    pattern: /(--|\/\*|\*\/|#)/,
    threatLevel: 'medium',
    description: 'SQL comment syntax detected'
  },
  {
    name: 'SQL Injection - Quotes',
    pattern: /(['"])(\s*)(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
    threatLevel: 'high',
    description: 'SQL injection with quoted statements detected'
  },

  // XSS patterns
  {
    name: 'XSS - Script Tags',
    pattern: /<script[^>]*>.*?<\/script>/i,
    threatLevel: 'critical',
    description: 'Script tag injection detected'
  },
  {
    name: 'XSS - Event Handlers',
    pattern: /on\w+\s*=/i,
    threatLevel: 'high',
    description: 'Event handler injection detected'
  },
  {
    name: 'XSS - JavaScript Protocol',
    pattern: /javascript:/i,
    threatLevel: 'high',
    description: 'JavaScript protocol injection detected'
  },

  // Command Injection patterns
  {
    name: 'Command Injection - Basic',
    pattern: /[;&|`$(){}[\]]/,
    threatLevel: 'medium',
    description: 'Command injection characters detected'
  },
  {
    name: 'Command Injection - System Commands',
    pattern: /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ipconfig)\b/i,
    threatLevel: 'high',
    description: 'System command injection attempt detected'
  },

  // Path Traversal patterns
  {
    name: 'Path Traversal',
    pattern: /\.\.\/|\.\.\\/,
    threatLevel: 'high',
    description: 'Path traversal attempt detected'
  },

  // NoSQL Injection patterns
  {
    name: 'NoSQL Injection',
    pattern: /(\$where|\$ne|\$gt|\$lt|\$regex)/i,
    threatLevel: 'high',
    description: 'NoSQL injection attempt detected'
  },

  // LDAP Injection patterns - more specific to avoid false positives
  {
    name: 'LDAP Injection',
    pattern: /[()&|*]/,
    threatLevel: 'medium',
    description: 'LDAP injection characters detected'
  }
];

/**
 * Get security pattern by name
 * @param name - Pattern name
 * @returns Security pattern or undefined
 */
export function getSecurityPattern(name: string): SecurityPattern | undefined {
  return SECURITY_PATTERNS.find(pattern => pattern.name === name);
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