/**
 * events.public.validation.rules.ts - backend file
 * version: 1.0.0
 * Event definitions for public validation rules API operations.
 * Contains event types for logging requests, responses, and errors.
 */

/**
 * Public Validation Rules Events
 * Events related to public validation rules API operations
 */
export const PUBLIC_VALIDATION_RULES_EVENTS = {
  
  /**
   * Request received event
   * Triggered when a public validation rules request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'publicValidationRules.request.received',
    eventMessage: 'Public validation rules request received',
    eventType: 'app' as const,
    source: 'core.public.validation.rules',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'publicValidationRules.response.sent',
    eventMessage: 'Public validation rules response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.validation.rules',
    severity: 'info' as const,
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'publicValidationRules.cache.hit',
    eventMessage: 'Validation rules retrieved from settings service',
    eventType: 'performance' as const,
    source: 'core.public.validation.rules',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'publicValidationRules.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public validation rules requests',
    eventType: 'security' as const,
    source: 'core.public.validation.rules',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'publicValidationRules.validation.error',
    eventMessage: 'Request validation error for public validation rules',
    eventType: 'app' as const,
    source: 'core.public.validation.rules',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'publicValidationRules.service.error',
    eventMessage: 'Service error in public validation rules',
    eventType: 'system' as const,
    source: 'core.public.validation.rules',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'publicValidationRules.http.error',
    eventMessage: 'HTTP error in public validation rules endpoint',
    eventType: 'system' as const,
    source: 'core.public.validation.rules',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for use in code
 */
export const PUBLIC_VALIDATION_RULES_EVENT_NAMES = {
  REQUEST_RECEIVED: PUBLIC_VALIDATION_RULES_EVENTS.REQUEST_RECEIVED.eventName,
  RESPONSE_SENT: PUBLIC_VALIDATION_RULES_EVENTS.RESPONSE_SENT.eventName,
  CACHE_HIT: PUBLIC_VALIDATION_RULES_EVENTS.CACHE_HIT.eventName,
  RATE_LIMIT_EXCEEDED: PUBLIC_VALIDATION_RULES_EVENTS.RATE_LIMIT_EXCEEDED.eventName,
  VALIDATION_ERROR: PUBLIC_VALIDATION_RULES_EVENTS.VALIDATION_ERROR.eventName,
  SERVICE_ERROR: PUBLIC_VALIDATION_RULES_EVENTS.SERVICE_ERROR.eventName,
  HTTP_ERROR: PUBLIC_VALIDATION_RULES_EVENTS.HTTP_ERROR.eventName
} as const;
