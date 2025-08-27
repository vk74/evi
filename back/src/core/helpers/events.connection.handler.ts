/**
 * @file events.connection.handler.ts
 * @version 1.0.0
 * @description Backend file. Contains event definitions for the connection handler domain.
 * These events track HTTP connection handling operations including request processing,
 * business logic execution, response generation, and error handling.
 */

/**
 * Connection Handler Events
 * Events for tracking HTTP connection handling operations
 */
export const CONNECTION_HANDLER_EVENTS = {
  // Request lifecycle events
  REQUEST_RECEIVED: {
    eventName: 'connectionHandler.request.received',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received by connection handler',
    payload: null, // Will contain: { method, url, controllerName, requestId, userAgent, ipAddress }
    version: '1.0.0'
  },

  REQUEST_VALIDATED: {
    eventName: 'connectionHandler.request.validated',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'Request validation completed',
    payload: null, // Will contain: { controllerName, requestId, validationResult }
    version: '1.0.0'
  },

  REQUEST_AUTHENTICATED: {
    eventName: 'connectionHandler.request.authenticated',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authentication completed',
    payload: null, // Will contain: { controllerName, requestId, userId, authMethod }
    version: '1.0.0'
  },

  REQUEST_AUTHORIZED: {
    eventName: 'connectionHandler.request.authorized',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authorization completed',
    payload: null, // Will contain: { controllerName, requestId, userId, permissions }
    version: '1.0.0'
  },

  // HTTP method specific events
  REQUEST_GET: {
    eventName: 'connectionHandler.request.get',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'GET request processed',
    payload: null, // Will contain: { url, controllerName, requestId, queryParams }
    version: '1.0.0'
  },

  REQUEST_POST: {
    eventName: 'connectionHandler.request.post',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'POST request processed',
    payload: null, // Will contain: { url, controllerName, requestId, bodySize }
    version: '1.0.0'
  },

  REQUEST_PUT: {
    eventName: 'connectionHandler.request.put',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'PUT request processed',
    payload: null, // Will contain: { url, controllerName, requestId, bodySize }
    version: '1.0.0'
  },

  REQUEST_DELETE: {
    eventName: 'connectionHandler.request.delete',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'DELETE request processed',
    payload: null, // Will contain: { url, controllerName, requestId }
    version: '1.0.0'
  },

  // Business logic events
  BUSINESS_LOGIC_START: {
    eventName: 'connectionHandler.businessLogic.start',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Business logic execution started',
    payload: null, // Will contain: { controllerName, requestId }
    version: '1.0.0'
  },

  BUSINESS_LOGIC_COMPLETE: {
    eventName: 'connectionHandler.businessLogic.complete',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Business logic completed successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration }
    version: '1.0.0'
  },

  BUSINESS_LOGIC_ERROR: {
    eventName: 'connectionHandler.businessLogic.error',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'error' as const,
    eventMessage: 'Business logic execution failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  // Response events by status code
  RESPONSE_SENT_200: {
    eventName: 'connectionHandler.response.sent.200',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 200 response sent successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_201: {
    eventName: 'connectionHandler.response.sent.201',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 201 response sent successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration, resourceId }
    version: '1.0.0'
  },

  RESPONSE_SENT_400: {
    eventName: 'connectionHandler.response.sent.400',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 400 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_401: {
    eventName: 'connectionHandler.response.sent.401',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 401 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_403: {
    eventName: 'connectionHandler.response.sent.403',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 403 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_404: {
    eventName: 'connectionHandler.response.sent.404',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP 404 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  RESPONSE_SENT_500: {
    eventName: 'connectionHandler.response.sent.500',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP 500 response sent',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration }
    version: '1.0.0'
  },

  // Error handling events
  VALIDATION_ERROR: {
    eventName: 'connectionHandler.validation.error',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Request validation failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration, validationErrors }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  AUTHENTICATION_ERROR: {
    eventName: 'connectionHandler.authentication.error',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authentication failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration, authMethod }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  AUTHORIZATION_ERROR: {
    eventName: 'connectionHandler.authorization.error',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Request authorization failed',
    payload: null, // Will contain: { controllerName, errorCode, errorType, duration, requiredPermissions }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  // Security events
  SUSPICIOUS_REQUEST: {
    eventName: 'connectionHandler.suspicious.request',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Suspicious request detected',
    payload: null, // Will contain: { controllerName, requestId, suspiciousPattern, ipAddress }
    version: '1.0.0'
  },

  RATE_LIMIT_EXCEEDED: {
    eventName: 'connectionHandler.rate.limit.exceeded',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Rate limit exceeded',
    payload: null, // Will contain: { controllerName, requestId, ipAddress, limit, window, reason }
    version: '1.0.0'
  },

  RATE_LIMIT_CHECK: {
    eventName: 'connectionHandler.rate.limit.check',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Rate limit check performed',
    payload: null, // Will contain: { controllerName, requestId, ipAddress, allowed, remainingRequests }
    version: '1.0.0'
  },

  RATE_LIMIT_TEMPORARY_BLOCK: {
    eventName: 'connectionHandler.rate.limit.temporary.block',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'warning' as const,
    eventMessage: 'Client temporarily blocked due to rate limit violations',
    payload: null, // Will contain: { controllerName, requestId, ipAddress, blockDuration, reason }
    version: '1.0.0'
  },

  RATE_LIMIT_CONFIG_LOADED: {
    eventName: 'connectionHandler.rate.limit.config.loaded',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Rate limiting configuration loaded from cache',
    payload: null, // Will contain: { source, enabled, maxRequestsPerMinute, maxRequestsPerHour, blockDurationMinutes }
    version: '1.0.0'
  },

  RATE_LIMIT_CONFIG_REFRESHED: {
    eventName: 'connectionHandler.rate.limit.config.refreshed',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'debug' as const,
    eventMessage: 'Rate limiting configuration refreshed from cache',
    payload: null, // Will contain: { source, enabled, maxRequestsPerMinute, maxRequestsPerHour, blockDurationMinutes, refreshTime }
    version: '1.0.0'
  },

  RATE_LIMIT_CONFIG_REFRESH_ERROR: {
    eventName: 'connectionHandler.rate.limit.config.refresh.error',
    source: 'connection handler',
    eventType: 'security' as const,
    severity: 'error' as const,
    eventMessage: 'Failed to refresh rate limiting configuration from cache',
    payload: null, // Will contain: { error, operation }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  VALIDATION_STARTED: {
    eventName: 'connectionHandler.validation.started',
    source: 'connection handler',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Connection handler validation started',
    payload: null, // Will contain: { validationType }
    version: '1.0.0'
  },

  VALIDATION_SUCCESS: {
    eventName: 'connectionHandler.validation.success',
    source: 'connection handler',
    eventType: 'system' as const,
    severity: 'debug' as const,
    eventMessage: 'Connection handler validation successful',
    payload: null, // Will contain: { enabled, maxRequestsPerMinute, maxRequestsPerHour, blockDurationMinutes }
    version: '1.0.0'
  },

  VALIDATION_FAILED: {
    eventName: 'connectionHandler.validation.failed',
    source: 'connection handler',
    eventType: 'system' as const,
    severity: 'error' as const,
    eventMessage: 'Connection handler validation failed',
    payload: null, // Will contain: { missingSettings, error }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  // Legacy events for backward compatibility
  RESPONSE_SENT: {
    eventName: 'connectionHandler.response.sent',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent successfully',
    payload: null, // Will contain: { statusCode, responseSize, duration }
    version: '1.0.0'
  },

  ERROR_RESPONSE_SENT: {
    eventName: 'connectionHandler.errorResponse.sent',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'error' as const,
    eventMessage: 'HTTP error response sent',
    payload: null, // Will contain: { statusCode, errorCode, errorType, duration }
    errorData: null, // Will contain error details
    version: '1.0.0'
  },

  REQUEST_TIMEOUT: {
    eventName: 'connectionHandler.request.timeout',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'warn' as const,
    eventMessage: 'Request processing timeout',
    payload: null, // Will contain: { controllerName, duration, timeout }
    version: '1.0.0'
  }
};
