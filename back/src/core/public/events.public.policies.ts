/**
 * events.public.policies.ts - backend file
 * version: 1.3.0
 * Event definitions for public API operations (password policies, validation rules, public settings).
 * Contains event types for logging requests, responses, and errors.
 * 
 * Updated: Changed event prefix from 'public.*' to 'publicPolicies.*' to match domain registry
 * 
 * Domain: publicPolicies
 * 
 * Changes in v1.3.0:
 * - Renamed Public UI settings events to Public settings events
 * - Updated event names and sources to use public settings terminology
 */

/**
 * Public Policies Events - Password Policies
 * Events related to public password policies API operations
 */
export const PUBLIC_PASSWORD_POLICIES_EVENTS = {
  
  /**
   * Request received event
   * Triggered when a public password policies request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'publicPolicies.password.request.received',
    eventMessage: 'Public password policies request received',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'publicPolicies.password.response.sent',
    eventMessage: 'Public password policies response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'publicPolicies.password.cache.hit',
    eventMessage: 'Password policies retrieved from settings service',
    eventType: 'performance' as const,
    source: 'core.public.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'publicPolicies.password.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public password policies requests',
    eventType: 'security' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'publicPolicies.password.validation.error',
    eventMessage: 'Request validation error for public password policies',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'publicPolicies.password.service.error',
    eventMessage: 'Service error in public password policies',
    eventType: 'system' as const,
    source: 'core.public.policies',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'publicPolicies.password.http.error',
    eventMessage: 'HTTP error in public password policies endpoint',
    eventType: 'system' as const,
    source: 'core.public.policies',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Public Policies Events - Validation Rules
 * Events related to public validation rules API operations
 */
export const PUBLIC_VALIDATION_RULES_EVENTS = {
  
  /**
   * Request received event
   * Triggered when a public validation rules request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'publicPolicies.validation.request.received',
    eventMessage: 'Public validation rules request received',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'publicPolicies.validation.response.sent',
    eventMessage: 'Public validation rules response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'publicPolicies.validation.cache.hit',
    eventMessage: 'Validation rules retrieved from settings service',
    eventType: 'performance' as const,
    source: 'core.public.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'publicPolicies.validation.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public validation rules requests',
    eventType: 'security' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'publicPolicies.validation.validation.error',
    eventMessage: 'Request validation error for public validation rules',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'publicPolicies.validation.service.error',
    eventMessage: 'Service error in public validation rules',
    eventType: 'system' as const,
    source: 'core.public.policies',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'publicPolicies.validation.http.error',
    eventMessage: 'HTTP error in public validation rules endpoint',
    eventType: 'system' as const,
    source: 'core.public.policies',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for password policies
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

/**
 * Quick access to event names for validation rules
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

/**
 * Public Settings Events
 * Events related to public settings API operations
 */
export const PUBLIC_SETTINGS_EVENTS = {
  
  /**
   * Request received event
   * Triggered when a public settings request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'publicPolicies.settings.request.received',
    eventMessage: 'Public settings request received',
    eventType: 'app' as const,
    source: 'core.public.settings',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'publicPolicies.settings.response.sent',
    eventMessage: 'Public settings response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.settings',
    severity: 'info' as const,
    version: '1.0.0'
  },

  SETTINGS_RETRIEVED: {
    eventName: 'publicPolicies.settings.settings.retrieved',
    eventMessage: 'Public settings retrieved from cache',
    eventType: 'performance' as const,
    source: 'core.public.settings',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'publicPolicies.settings.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public settings requests',
    eventType: 'security' as const,
    source: 'core.public.settings',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'publicPolicies.settings.validation.error',
    eventMessage: 'Request validation error for public settings',
    eventType: 'app' as const,
    source: 'core.public.settings',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'publicPolicies.settings.service.error',
    eventMessage: 'Service error in public settings',
    eventType: 'system' as const,
    source: 'core.public.settings',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'publicPolicies.settings.http.error',
    eventMessage: 'HTTP error in public settings endpoint',
    eventType: 'system' as const,
    source: 'core.public.settings',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for public settings
 */
export const PUBLIC_SETTINGS_EVENT_NAMES = {
  REQUEST_RECEIVED: PUBLIC_SETTINGS_EVENTS.REQUEST_RECEIVED.eventName,
  RESPONSE_SENT: PUBLIC_SETTINGS_EVENTS.RESPONSE_SENT.eventName,
  SETTINGS_RETRIEVED: PUBLIC_SETTINGS_EVENTS.SETTINGS_RETRIEVED.eventName,
  RATE_LIMIT_EXCEEDED: PUBLIC_SETTINGS_EVENTS.RATE_LIMIT_EXCEEDED.eventName,
  VALIDATION_ERROR: PUBLIC_SETTINGS_EVENTS.VALIDATION_ERROR.eventName,
  SERVICE_ERROR: PUBLIC_SETTINGS_EVENTS.SERVICE_ERROR.eventName,
  HTTP_ERROR: PUBLIC_SETTINGS_EVENTS.HTTP_ERROR.eventName
} as const;
