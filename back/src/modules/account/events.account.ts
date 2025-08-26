/**
 * events.account.ts - backend file
 * version: 1.0.0
 * Event definitions for account module operations.
 * Contains event types for user registration, profile management, and account-related security events.
 * 
 * Payload Guidelines:
 * - severity 'info'/'warning'/'error': Only user UUID and basic info
 * - severity 'debug': Internal system details for troubleshooting
 */

/**
 * Account Registration Events
 * Events related to user registration operations
 */
export const ACCOUNT_REGISTRATION_EVENTS = {
  
  /**
   * Registration attempt event
   * Triggered when user attempts to register
   * severity: debug - includes full request details
   */
  REGISTRATION_ATTEMPT: {
    eventName: 'account.registration.attempt',
    eventMessage: 'User registration attempt initiated',
    eventType: 'security' as const,
    source: 'modules.account.registration',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Registration blocked event
   * Triggered when registration is blocked due to disabled setting
   * severity: warning - includes IP and block reason
   */
  REGISTRATION_BLOCKED: {
    eventName: 'account.registration.blocked',
    eventMessage: 'Registration blocked - registration is disabled',
    eventType: 'security' as const,
    source: 'modules.account.registration',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Registration success event
   * Triggered when user registration is successful
   * severity: info - includes user UUID and basic success info
   */
  REGISTRATION_SUCCESS: {
    eventName: 'account.registration.success',
    eventMessage: 'User registration successful',
    eventType: 'security' as const,
    source: 'modules.account.registration',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Registration failed event
   * Triggered when registration attempt fails
   * severity: warning - includes failure reason
   */
  REGISTRATION_FAILED: {
    eventName: 'account.registration.failed',
    eventMessage: 'User registration failed',
    eventType: 'security' as const,
    source: 'modules.account.registration',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Settings check event
   * Triggered when checking registration settings
   * severity: debug - includes setting details
   */
  REGISTRATION_SETTINGS_CHECK: {
    eventName: 'account.registration.settings.check',
    eventMessage: 'Checking registration settings',
    eventType: 'security' as const,
    source: 'modules.account.registration',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Settings not found event
   * Triggered when registration settings are not found in cache
   * severity: warning - includes setting details
   */
  REGISTRATION_SETTINGS_NOT_FOUND: {
    eventName: 'account.registration.settings.not.found',
    eventMessage: 'Registration settings not found in cache',
    eventType: 'security' as const,
    source: 'modules.account.registration',
    severity: 'warning' as const,
    version: '1.0.0'
  }
};

/**
 * Account Profile Events
 * Events related to user profile operations
 */
export const ACCOUNT_PROFILE_EVENTS = {
  
  /**
   * Profile update attempt event
   * Triggered when user attempts to update profile
   * severity: debug - includes user UUID
   */
  PROFILE_UPDATE_ATTEMPT: {
    eventName: 'account.profile.update.attempt',
    eventMessage: 'User profile update attempt initiated',
    eventType: 'security' as const,
    source: 'modules.account.profile',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Profile update success event
   * Triggered when profile update is successful
   * severity: info - includes user UUID
   */
  PROFILE_UPDATE_SUCCESS: {
    eventName: 'account.profile.update.success',
    eventMessage: 'User profile update successful',
    eventType: 'security' as const,
    source: 'modules.account.profile',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Profile update failed event
   * Triggered when profile update fails
   * severity: warning - includes user UUID and failure reason
   */
  PROFILE_UPDATE_FAILED: {
    eventName: 'account.profile.update.failed',
    eventMessage: 'User profile update failed',
    eventType: 'security' as const,
    source: 'modules.account.profile',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Profile fetch attempt event
   * Triggered when attempting to fetch user profile
   * severity: debug - includes user UUID
   */
  PROFILE_FETCH_ATTEMPT: {
    eventName: 'account.profile.fetch.attempt',
    eventMessage: 'User profile fetch attempt initiated',
    eventType: 'security' as const,
    source: 'modules.account.profile',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Profile fetch success event
   * Triggered when profile fetch is successful
   * severity: info - includes user UUID
   */
  PROFILE_FETCH_SUCCESS: {
    eventName: 'account.profile.fetch.success',
    eventMessage: 'User profile fetch successful',
    eventType: 'security' as const,
    source: 'modules.account.profile',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Profile fetch failed event
   * Triggered when profile fetch fails
   * severity: warning - includes user UUID and failure reason
   */
  PROFILE_FETCH_FAILED: {
    eventName: 'account.profile.fetch.failed',
    eventMessage: 'User profile fetch failed',
    eventType: 'security' as const,
    source: 'modules.account.profile',
    severity: 'warning' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for use in code
 */
export const ACCOUNT_EVENT_NAMES = {
  // Registration events
  REGISTRATION_ATTEMPT: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_ATTEMPT.eventName,
  REGISTRATION_BLOCKED: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_BLOCKED.eventName,
  REGISTRATION_SUCCESS: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_SUCCESS.eventName,
  REGISTRATION_FAILED: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
  REGISTRATION_SETTINGS_CHECK: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_SETTINGS_CHECK.eventName,
  REGISTRATION_SETTINGS_NOT_FOUND: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_SETTINGS_NOT_FOUND.eventName,
  
  // Profile events
  PROFILE_UPDATE_ATTEMPT: ACCOUNT_PROFILE_EVENTS.PROFILE_UPDATE_ATTEMPT.eventName,
  PROFILE_UPDATE_SUCCESS: ACCOUNT_PROFILE_EVENTS.PROFILE_UPDATE_SUCCESS.eventName,
  PROFILE_UPDATE_FAILED: ACCOUNT_PROFILE_EVENTS.PROFILE_UPDATE_FAILED.eventName,
  PROFILE_FETCH_ATTEMPT: ACCOUNT_PROFILE_EVENTS.PROFILE_FETCH_ATTEMPT.eventName,
  PROFILE_FETCH_SUCCESS: ACCOUNT_PROFILE_EVENTS.PROFILE_FETCH_SUCCESS.eventName,
  PROFILE_FETCH_FAILED: ACCOUNT_PROFILE_EVENTS.PROFILE_FETCH_FAILED.eventName
} as const;
