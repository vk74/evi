/**
 * queries.public.password.policies.ts - backend file
 * version: 1.0.0
 * SQL queries for fetching public password policy settings.
 * Used as fallback when cache is not available.
 */

/**
 * Query to fetch all password policy settings from the database
 * Used as fallback when settings cache is not available
 */
export const passwordPoliciesQueries = {
  
  /**
   * Get all password policy settings from a specific section
   * Returns only non-confidential settings for public consumption
   */
  fetchPasswordPoliciesBySection: {
    text: `
      SELECT 
        setting_name,
        value,
        default_value,
        confidentiality,
        section_path,
        description
      FROM app.app_settings 
      WHERE section_path = $1 
        AND confidentiality = false
        AND setting_name IN (
          'password.min.length',
          'password.max.length',
          'password.require.lowercase',
          'password.require.uppercase',
          'password.require.numbers',
          'password.require.special.chars',
          'password.allowed.special.chars'
        )
      ORDER BY setting_name ASC
    `,
    description: 'Fetch public password policy settings by section path'
  },

  /**
   * Get specific password policy setting by name
   * Used for individual setting queries with security check
   */
  fetchPasswordPolicyByName: {
    text: `
      SELECT 
        setting_name,
        value,
        default_value,
        confidentiality,
        section_path,
        description
      FROM app.app_settings 
      WHERE section_path = $1 
        AND setting_name = $2
        AND confidentiality = false
        AND setting_name IN (
          'password.min.length',
          'password.max.length',
          'password.require.lowercase',
          'password.require.uppercase',
          'password.require.numbers',
          'password.require.special.chars',
          'password.allowed.special.chars'
        )
      LIMIT 1
    `,
    description: 'Fetch specific public password policy setting by name'
  },

  /**
   * Check if password policies section exists
   * Used for validation before attempting to fetch settings
   */
  validatePasswordPoliciesSection: {
    text: `
      SELECT COUNT(*) as count
      FROM app.app_settings 
      WHERE section_path = $1
        AND setting_name LIKE 'password.%'
        AND confidentiality = false
    `,
    description: 'Validate that password policies section exists and has public settings'
  }
};

/**
 * List of allowed public password policy setting names
 * Used for security validation to ensure only allowed settings are returned
 */
export const ALLOWED_PUBLIC_PASSWORD_POLICY_SETTINGS = [
  'password.min.length',
  'password.max.length', 
  'password.require.lowercase',
  'password.require.uppercase',
  'password.require.numbers',
  'password.require.special.chars',
  'password.allowed.special.chars'
];

/**
 * Default password policy values
 * Used as fallback if no settings are found in database
 */
export const DEFAULT_PASSWORD_POLICIES = {
  'password.min.length': 8,
  'password.max.length': 40,
  'password.require.lowercase': true,
  'password.require.uppercase': true, 
  'password.require.numbers': true,
  'password.require.special.chars': false,
  'password.allowed.special.chars': '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/**
 * Password policies section path constant
 */
export const PASSWORD_POLICIES_SECTION_PATH = 'Application.Security.PasswordPolicies'; 