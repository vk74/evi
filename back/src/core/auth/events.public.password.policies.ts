/**
 * events.public.password.policies.ts - backend file
 * version: 1.0.0
 * Event definitions for public password policies API operations.
 * Contains event types for logging requests, responses, cache hits, rate limiting, and errors.
 */

import { EventObject } from '../eventBus/types.events';

/**
 * Event definitions for public password policies operations
 */
export const PUBLIC_PASSWORD_POLICIES_EVENTS: Record<string, EventObject> = {
  
  /**
   * Request received event
   * Triggered when a public password policies request is received
   */
  REQUEST_RECEIVED: {
    eventName: 'public.password.policies.request.received',
    eventMessage: 'Public password policies request received',
    eventType: 'app',
    source: 'core.auth.public.password.policies',
    severity: 'info',
    version: '1.0.0'
  },

  RESPONSE_SENT: {
    eventName: 'public.password.policies.response.sent',
    eventMessage: 'Public password policies response sent successfully',
    eventType: 'app',
    source: 'core.auth.public.password.policies',
    severity: 'info',
    version: '1.0.0'
  },

  CACHE_HIT: {
    eventName: 'public.password.policies.cache.hit',
    eventMessage: 'Password policies retrieved from cache',
    eventType: 'performance',
    source: 'core.auth.public.password.policies',
    severity: 'debug',
    version: '1.0.0'
  },

  CACHE_MISS: {
    eventName: 'public.password.policies.cache.miss',
    eventMessage: 'Password policies not found in cache',
    eventType: 'performance',
    source: 'core.auth.public.password.policies',
    severity: 'warning',
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'public.password.policies.rate.limit.exceeded',
    eventMessage: 'Rate limit exceeded for public password policies requests',
    eventType: 'security',
    source: 'core.auth.public.password.policies',
    severity: 'warning',
    version: '1.0.0'
  },

  VALIDATION_ERROR: {
    eventName: 'public.password.policies.validation.error',
    eventMessage: 'Request validation error for public password policies',
    eventType: 'app',
    source: 'core.auth.public.password.policies',
    severity: 'warning',
    version: '1.0.0'
  },

  SERVICE_ERROR: {
    eventName: 'public.password.policies.service.error',
    eventMessage: 'Service error in public password policies',
    eventType: 'system',
    source: 'core.auth.public.password.policies',
    severity: 'error',
    version: '1.0.0'
  },

  HTTP_ERROR: {
    eventName: 'public.password.policies.http.error',
    eventMessage: 'HTTP error in public password policies endpoint',
    eventType: 'system',
    source: 'core.auth.public.password.policies',
    severity: 'error',
    version: '1.0.0'
  },

  FALLBACK_DB_QUERY: {
    eventName: 'public.password.policies.fallback.db.query',
    eventMessage: 'Fallback to database query for password policies',
    eventType: 'app',
    source: 'core.auth.public.password.policies',
    severity: 'info',
    version: '1.0.0'
  }
};

/**
 * Quick access to event names for use in code
 */
export const PUBLIC_PASSWORD_POLICIES_EVENT_NAMES = {
  REQUEST_RECEIVED: PUBLIC_PASSWORD_POLICIES_EVENTS.REQUEST_RECEIVED.eventName,
  RESPONSE_SENT: PUBLIC_PASSWORD_POLICIES_EVENTS.RESPONSE_SENT.eventName,
  CACHE_HIT: PUBLIC_PASSWORD_POLICIES_EVENTS.CACHE_HIT.eventName,
  CACHE_MISS: PUBLIC_PASSWORD_POLICIES_EVENTS.CACHE_MISS.eventName,
  RATE_LIMIT_EXCEEDED: PUBLIC_PASSWORD_POLICIES_EVENTS.RATE_LIMIT_EXCEEDED.eventName,
  VALIDATION_ERROR: PUBLIC_PASSWORD_POLICIES_EVENTS.VALIDATION_ERROR.eventName,
  SERVICE_ERROR: PUBLIC_PASSWORD_POLICIES_EVENTS.SERVICE_ERROR.eventName,
  HTTP_ERROR: PUBLIC_PASSWORD_POLICIES_EVENTS.HTTP_ERROR.eventName,
  FALLBACK_DB_QUERY: PUBLIC_PASSWORD_POLICIES_EVENTS.FALLBACK_DB_QUERY.eventName
} as const; 