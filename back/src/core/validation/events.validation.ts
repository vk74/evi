/**
 * events.validation.ts - backend file
 * version: 1.0.0
 * Event definitions for validation service operations.
 * Contains event types for validation processes, security checks, and validation errors.
 * 
 * Payload Guidelines:
 * - severity 'info'/'warning'/'error': Only basic validation info
 * - severity 'debug': Internal system details for troubleshooting
 */

/**
 * Validation Service Events
 * Events related to validation service initialization and operations
 */
export const VALIDATION_SERVICE_EVENTS = {
  
  /**
   * Validation service initialization started event
   * Triggered when validation service initialization begins
   * severity: debug - includes initialization details
   */
  SERVICE_INIT_STARTED: {
    eventName: 'validation.service.init.started',
    eventMessage: 'Validation service initialization started',
    eventType: 'system' as const,
    source: 'core.validation.service',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Validation service initialization success event
   * Triggered when validation service is successfully initialized
   * severity: info - includes service status
   */
  SERVICE_INIT_SUCCESS: {
    eventName: 'validation.service.init.success',
    eventMessage: 'Validation service initialized successfully',
    eventType: 'system' as const,
    source: 'core.validation.service',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Validation service initialization failed event
   * Triggered when validation service initialization fails
   * severity: error - includes error details
   */
  SERVICE_INIT_FAILED: {
    eventName: 'validation.service.init.failed',
    eventMessage: 'Validation service initialization failed',
    eventType: 'system' as const,
    source: 'core.validation.service',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Validation Process Events
 * Events related to data validation operations
 */
export const VALIDATION_PROCESS_EVENTS = {
  
  /**
   * Validation started event
   * Triggered when validation process begins
   * severity: debug - includes validation target info
   */
  VALIDATION_STARTED: {
    eventName: 'validation.process.started',
    eventMessage: 'Data validation process started',
    eventType: 'app' as const,
    source: 'core.validation.service',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Validation success event
   * Triggered when validation passes successfully
   * severity: debug - includes validation result
   */
  VALIDATION_SUCCESS: {
    eventName: 'validation.process.success',
    eventMessage: 'Data validation successful',
    eventType: 'app' as const,
    source: 'core.validation.service',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Validation failed event
   * Triggered when validation fails
   * severity: warning - includes validation errors
   */
  VALIDATION_FAILED: {
    eventName: 'validation.process.failed',
    eventMessage: 'Data validation failed',
    eventType: 'app' as const,
    source: 'core.validation.service',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Validation error event
   * Triggered when validation process encounters an error
   * severity: error - includes error details
   */
  VALIDATION_ERROR: {
    eventName: 'validation.process.error',
    eventMessage: 'Validation process error',
    eventType: 'app' as const,
    source: 'core.validation.service',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Security Validation Events
 * Events related to security validation operations
 */
export const VALIDATION_SECURITY_EVENTS = {
  
  /**
   * Security validation started event
   * Triggered when security validation begins
   * severity: debug - includes security check details
   */
  SECURITY_VALIDATION_STARTED: {
    eventName: 'validation.security.started',
    eventMessage: 'Security validation started',
    eventType: 'security' as const,
    source: 'core.validation.security',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Security validation success event
   * Triggered when security validation passes
   * severity: info - includes validation result
   */
  SECURITY_VALIDATION_SUCCESS: {
    eventName: 'validation.security.success',
    eventMessage: 'Security validation successful',
    eventType: 'security' as const,
    source: 'core.validation.security',
    severity: 'info' as const,
    version: '1.0.0'
  },

  /**
   * Security validation failed event
   * Triggered when security validation fails
   * severity: warning - includes security issues
   */
  SECURITY_VALIDATION_FAILED: {
    eventName: 'validation.security.failed',
    eventMessage: 'Security validation failed',
    eventType: 'security' as const,
    source: 'core.validation.security',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  /**
   * Security threat detected event
   * Triggered when potential security threat is detected during validation
   * severity: error - includes threat details
   */
  SECURITY_THREAT_DETECTED: {
    eventName: 'validation.security.threat.detected',
    eventMessage: 'Security threat detected during validation',
    eventType: 'security' as const,
    source: 'core.validation.security',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Validation Cache Events
 * Events related to validation cache operations
 */
export const VALIDATION_CACHE_EVENTS = {
  
  /**
   * Cache initialization event
   * Triggered when validation cache is initialized
   * severity: debug - includes cache details
   */
  CACHE_INIT: {
    eventName: 'validation.cache.init',
    eventMessage: 'Validation cache initialized',
    eventType: 'system' as const,
    source: 'core.validation.cache',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Cache hit event
   * Triggered when validation rule is found in cache
   * severity: debug - includes cache hit details
   */
  CACHE_HIT: {
    eventName: 'validation.cache.hit',
    eventMessage: 'Validation cache hit',
    eventType: 'system' as const,
    source: 'core.validation.cache',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Cache miss event
   * Triggered when validation rule is not found in cache
   * severity: debug - includes cache miss details
   */
  CACHE_MISS: {
    eventName: 'validation.cache.miss',
    eventMessage: 'Validation cache miss',
    eventType: 'system' as const,
    source: 'core.validation.cache',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  /**
   * Cache update event
   * Triggered when validation cache is updated
   * severity: debug - includes update details
   */
  CACHE_UPDATE: {
    eventName: 'validation.cache.update',
    eventMessage: 'Validation cache updated',
    eventType: 'system' as const,
    source: 'core.validation.cache',
    severity: 'debug' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for use in code
 */
export const VALIDATION_EVENT_NAMES = {
  // Service events
  SERVICE_INIT_STARTED: VALIDATION_SERVICE_EVENTS.SERVICE_INIT_STARTED.eventName,
  SERVICE_INIT_SUCCESS: VALIDATION_SERVICE_EVENTS.SERVICE_INIT_SUCCESS.eventName,
  SERVICE_INIT_FAILED: VALIDATION_SERVICE_EVENTS.SERVICE_INIT_FAILED.eventName,
  
  // Process events
  VALIDATION_STARTED: VALIDATION_PROCESS_EVENTS.VALIDATION_STARTED.eventName,
  VALIDATION_SUCCESS: VALIDATION_PROCESS_EVENTS.VALIDATION_SUCCESS.eventName,
  VALIDATION_FAILED: VALIDATION_PROCESS_EVENTS.VALIDATION_FAILED.eventName,
  VALIDATION_ERROR: VALIDATION_PROCESS_EVENTS.VALIDATION_ERROR.eventName,
  
  // Security events
  SECURITY_VALIDATION_STARTED: VALIDATION_SECURITY_EVENTS.SECURITY_VALIDATION_STARTED.eventName,
  SECURITY_VALIDATION_SUCCESS: VALIDATION_SECURITY_EVENTS.SECURITY_VALIDATION_SUCCESS.eventName,
  SECURITY_VALIDATION_FAILED: VALIDATION_SECURITY_EVENTS.SECURITY_VALIDATION_FAILED.eventName,
  SECURITY_THREAT_DETECTED: VALIDATION_SECURITY_EVENTS.SECURITY_THREAT_DETECTED.eventName,
  
  // Cache events
  CACHE_INIT: VALIDATION_CACHE_EVENTS.CACHE_INIT.eventName,
  CACHE_HIT: VALIDATION_CACHE_EVENTS.CACHE_HIT.eventName,
  CACHE_MISS: VALIDATION_CACHE_EVENTS.CACHE_MISS.eventName,
  CACHE_UPDATE: VALIDATION_CACHE_EVENTS.CACHE_UPDATE.eventName
} as const;
