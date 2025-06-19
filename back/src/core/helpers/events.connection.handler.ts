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
  // When a request enters the connection handler
  REQUEST_RECEIVED: {
    eventName: 'connectionHandler.request.received',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP request received by connection handler',
    payload: null, // Will contain: { method, url, controllerName, requestId }
    version: '1.0.0'
  },

  // When business logic execution starts
  BUSINESS_LOGIC_START: {
    eventName: 'connectionHandler.businessLogic.start',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Business logic execution started',
    payload: null, // Will contain: { controllerName, requestId }
    version: '1.0.0'
  },

  // When business logic completes successfully
  BUSINESS_LOGIC_COMPLETE: {
    eventName: 'connectionHandler.businessLogic.complete',
    source: 'connection handler',
    eventType: 'app' as const,
    severity: 'debug' as const,
    eventMessage: 'Business logic completed successfully',
    payload: null, // Will contain: { controllerName, responseSize, duration }
    version: '1.0.0'
  },

  // When business logic throws an error
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

  // When HTTP response is sent successfully
  RESPONSE_SENT: {
    eventName: 'connectionHandler.response.sent',
    source: 'connection handler',
    eventType: 'http' as const,
    severity: 'debug' as const,
    eventMessage: 'HTTP response sent successfully',
    payload: null, // Will contain: { statusCode, responseSize, duration }
    version: '1.0.0'
  },

  // When error response is sent
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

  // When request processing times out
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