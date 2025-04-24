// User domain events registry
// Contains definitions for all user-related events

// Interface for event schema definition
interface EventSchema {
  version: string;
  description: string;
  payloadSchema?: Record<string, unknown>; // Optional JSON Schema for payload validation
}

// User events catalog
export const userEvents: Record<string, EventSchema> = {
  'profile.created': {
    version: 'v1',
    description: 'User profile was successfully created',
    payloadSchema: {
      type: 'object',
      required: ['userId', 'email'],
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
        username: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  },
  'profile.updated': {
    version: 'v1',
    description: 'User profile was updated',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        updatedFields: { 
          type: 'array',
          items: { type: 'string' }
        },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  },
  'profile.deleted': {
    version: 'v1',
    description: 'User profile was deleted',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        reason: { type: 'string' },
        deletedAt: { type: 'string', format: 'date-time' }
      }
    }
  },
  'preferences.updated': {
    version: 'v1',
    description: 'User preferences were updated',
    payloadSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string' },
        preferences: { type: 'object' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  },
  'account.status.changed': {
    version: 'v1',
    description: 'User account status was changed',
    payloadSchema: {
      type: 'object',
      required: ['userId', 'newStatus'],
      properties: {
        userId: { type: 'string' },
        previousStatus: { type: 'string' },
        newStatus: { type: 'string' },
        reason: { type: 'string' },
        changedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};