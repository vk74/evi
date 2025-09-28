/**
 * events.public.password.policies.ts - backend file
 * version: 1.0.3
 * Event definitions for public password policies API operations.
 * Contains event types for logging requests, responses, and errors.
 */

/**
 * Public Password Policies Events
 * Events related to public password policies API operations
 */
export const PUBLIC_PASSWORD_POLICIES_EVENTS = {
  
  /**
   * Request received event
   * Triggered when a public password policies request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'publicPasswordPolicies.request.received',
    eventMessage: 'Public password policies request received',
    eventType: 'app' as const,
    source: 'core.public.password.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'publicPasswordPolicies.response.sent',
    eventMessage: 'Public password policies response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.password.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'publicPasswordPolicies.cache.hit',
    eventMessage: 'Password policies retrieved from settings service',
    eventType: 'performance' as const,
    source: 'core.public.password.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'publicPasswordPolicies.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public password policies requests',
    eventType: 'security' as const,
    source: 'core.public.password.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'publicPasswordPolicies.validation.error',
    eventMessage: 'Request validation error for public password policies',
    eventType: 'app' as const,
    source: 'core.public.password.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'publicPasswordPolicies.service.error',
    eventMessage: 'Service error in public password policies',
    eventType: 'system' as const,
    source: 'core.public.password.policies',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'publicPasswordPolicies.http.error',
    eventMessage: 'HTTP error in public password policies endpoint',
    eventType: 'system' as const,
    source: 'core.public.password.policies',
    severity: 'error' as const,
    version: '1.0.0'
  },

};

/**
 * Quick access to event names for use in code
 */
export const PUBLIC_PASSWORD_POLICIES_EVENT_NAMES = {
  REQUEST_RECEIVED: PUBLIC_PASSWORD_POLICIES_EVENTS.REQUEST_RECEIVED.eventName,
  RESPONSE_SENT: PUBLIC_PASSWORD_POLICIES_EVENTS.RESPONSE_SENT.eventName,
  CACHE_HIT: PUBLIC_PASSWORD_POLICIES_EVENTS.CACHE_HIT.eventName,
  RATE_LIMIT_EXCEEDED: PUBLIC_PASSWORD_POLICIES_EVENTS.RATE_LIMIT_EXCEEDED.eventName,
  VALIDATION_ERROR: PUBLIC_PASSWORD_POLICIES_EVENTS.VALIDATION_ERROR.eventName,
  SERVICE_ERROR: PUBLIC_PASSWORD_POLICIES_EVENTS.SERVICE_ERROR.eventName,
  HTTP_ERROR: PUBLIC_PASSWORD_POLICIES_EVENTS.HTTP_ERROR.eventName
} as const; 