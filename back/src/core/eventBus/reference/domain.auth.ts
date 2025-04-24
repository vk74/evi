// Auth domain events registry
// Contains definitions for all authentication-related events

// Interface for event schema definition
interface EventSchema {
  version: string;
  description: string;
  payloadSchema?: Record<string, unknown>; // Optional JSON Schema for payload validation
}

// Auth events catalog
export const authEvents: Record<string, EventSchema> = {
  'login.success': {
    version: 'v1',
    description: 'User successfully authenticated',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        method: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        ipAddress: { type: 'string' }
      }
    }
  },
  'login.failed': {
    version: 'v1',
    description: 'Authentication attempt failed',
    payloadSchema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        reason: { type: 'string' },
        attemptCount: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
        ipAddress: { type: 'string' }
      }
    }
  },
  'logout': {
    version: 'v1',
    description: 'User logged out',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        sessionId: { type: 'string' }
      }
    }
  },
  'password.reset.requested': {
    version: 'v1',
    description: 'Password reset was requested',
    payloadSchema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        ipAddress: { type: 'string' }
      }
    }
  },
  'password.reset.completed': {
    version: 'v1',
    description: 'Password was successfully reset',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  },
  'token.refreshed': {
    version: 'v1',
    description: 'Auth token was refreshed',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' }
      }
    }
  },
  'token.revoked': {
    version: 'v1',
    description: 'Auth token was revoked',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        tokenId: { type: 'string' },
        reason: { type: 'string' }
      }
    }
  }
};