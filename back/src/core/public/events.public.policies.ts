/**
 * events.public.policies.ts - backend file
 * version: 1.1.0
 * Event definitions for public API operations (password policies, validation rules, UI settings).
 * Contains event types for logging requests, responses, and errors.
 * Domain: public
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
    eventName: 'public.password.request.received',
    eventMessage: 'Public password policies request received',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'public.password.response.sent',
    eventMessage: 'Public password policies response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'public.password.cache.hit',
    eventMessage: 'Password policies retrieved from settings service',
    eventType: 'performance' as const,
    source: 'core.public.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'public.password.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public password policies requests',
    eventType: 'security' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'public.password.validation.error',
    eventMessage: 'Request validation error for public password policies',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'public.password.service.error',
    eventMessage: 'Service error in public password policies',
    eventType: 'system' as const,
    source: 'core.public.policies',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'public.password.http.error',
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
    eventName: 'public.validation.request.received',
    eventMessage: 'Public validation rules request received',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'public.validation.response.sent',
    eventMessage: 'Public validation rules response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'info' as const,
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'public.validation.cache.hit',
    eventMessage: 'Validation rules retrieved from settings service',
    eventType: 'performance' as const,
    source: 'core.public.policies',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'public.validation.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public validation rules requests',
    eventType: 'security' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'public.validation.validation.error',
    eventMessage: 'Request validation error for public validation rules',
    eventType: 'app' as const,
    source: 'core.public.policies',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'public.validation.service.error',
    eventMessage: 'Service error in public validation rules',
    eventType: 'system' as const,
    source: 'core.public.policies',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'public.validation.http.error',
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
 * Public UI Settings Events
 * Events related to public UI settings API operations
 */
export const PUBLIC_UI_SETTINGS_EVENTS = {
  
  /**
   * Request received event
   * Triggered when a public UI settings request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'public.uiSettings.request.received',
    eventMessage: 'Public UI settings request received',
    eventType: 'app' as const,
    source: 'core.public.ui.settings',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'public.uiSettings.response.sent',
    eventMessage: 'Public UI settings response sent successfully',
    eventType: 'app' as const,
    source: 'core.public.ui.settings',
    severity: 'info' as const,
    version: '1.0.0'
  },

  SETTINGS_RETRIEVED: {
    eventName: 'public.uiSettings.settings.retrieved',
    eventMessage: 'UI settings retrieved from cache',
    eventType: 'performance' as const,
    source: 'core.public.ui.settings',
    severity: 'debug' as const,
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'public.uiSettings.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public UI settings requests',
    eventType: 'security' as const,
    source: 'core.public.ui.settings',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'public.uiSettings.validation.error',
    eventMessage: 'Request validation error for public UI settings',
    eventType: 'app' as const,
    source: 'core.public.ui.settings',
    severity: 'warning' as const,
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'public.uiSettings.service.error',
    eventMessage: 'Service error in public UI settings',
    eventType: 'system' as const,
    source: 'core.public.ui.settings',
    severity: 'error' as const,
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'public.uiSettings.http.error',
    eventMessage: 'HTTP error in public UI settings endpoint',
    eventType: 'system' as const,
    source: 'core.public.ui.settings',
    severity: 'error' as const,
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for public UI settings
 */
export const PUBLIC_UI_SETTINGS_EVENT_NAMES = {
  REQUEST_RECEIVED: PUBLIC_UI_SETTINGS_EVENTS.REQUEST_RECEIVED.eventName,
  RESPONSE_SENT: PUBLIC_UI_SETTINGS_EVENTS.RESPONSE_SENT.eventName,
  SETTINGS_RETRIEVED: PUBLIC_UI_SETTINGS_EVENTS.SETTINGS_RETRIEVED.eventName,
  RATE_LIMIT_EXCEEDED: PUBLIC_UI_SETTINGS_EVENTS.RATE_LIMIT_EXCEEDED.eventName,
  VALIDATION_ERROR: PUBLIC_UI_SETTINGS_EVENTS.VALIDATION_ERROR.eventName,
  SERVICE_ERROR: PUBLIC_UI_SETTINGS_EVENTS.SERVICE_ERROR.eventName,
  HTTP_ERROR: PUBLIC_UI_SETTINGS_EVENTS.HTTP_ERROR.eventName
} as const;
