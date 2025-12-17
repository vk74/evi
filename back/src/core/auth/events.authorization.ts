/**
 * @file events.authorization.ts
 * Version: 1.3.0
 * Event definitions for authorization operations (RBAC/ABAC).
 * Backend file.
 * 
 * Changes in v1.1.0:
 * - Removed redundant load events (start/success)
 * - Updated eventType to 'authorization'
 * - Enhanced error event payload
 * 
 * Changes in v1.2.0:
 * - Converted PERMISSION_SERVICE_EVENTS and PERMISSION_CHECK_EVENTS to EventCollection format
 * - Changed structure to use string keys matching event name parts for proper registration
 * 
 * Changes in v1.3.0:
 * - Fixed event names to use 'auth' domain prefix instead of 'authorization' to match domain registration
 * - Event names now correctly match the event reference system's domain-based naming (auth.*)
 */

import { EventCollection } from '../eventBus/types.events';

/**
 * Permission Service Events
 */
export const PERMISSION_SERVICE_EVENTS: EventCollection = {
  'permissions.load.error': {
    eventName: 'auth.permissions.load.error',
    source: 'permission service',
    eventType: 'authorization' as const,
    severity: 'error' as const,
    eventMessage: 'Error loading system permissions',
    version: '1.0.0'
  }
};

/**
 * Permission Check Events (Guard)
 */
export const PERMISSION_CHECK_EVENTS: EventCollection = {
  'check.denied': {
    eventName: 'auth.check.denied',
    source: 'permission guard',
    eventType: 'authorization' as const,
    severity: 'warning' as const,
    eventMessage: 'Access denied: insufficient permissions',
    // Payload should answer: WHO tried to do WHAT on WHICH resource and WHY it failed
    version: '1.1.0'
  },

  'check.granted': {
    eventName: 'auth.check.granted',
    source: 'permission guard',
    eventType: 'authorization' as const,
    severity: 'debug' as const, // Debug severity as this is a high-volume event
    eventMessage: 'Access granted',
    // Payload should answer: WHO was granted access to WHAT on WHICH resource
    version: '1.1.0'
  },
  
  'check.error': {
    eventName: 'auth.check.error',
    source: 'permission guard',
    eventType: 'authorization' as const,
    severity: 'error' as const,
    eventMessage: 'Error checking permissions',
    version: '1.1.0'
  }
};
