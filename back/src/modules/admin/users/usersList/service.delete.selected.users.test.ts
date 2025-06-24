/**
 * Version: 1.0.0
 *
 * Tests for delete selected users service
 * This backend file contains Jest tests for the users deletion service logic. 
 * Tests verify business logic, database interactions, cache invalidation, error handling, and event generation.
 * Uses mocks for database, cache, and event bus dependencies.
 *
 * File: service.delete.selected.users.test.ts
 */

import { Request } from 'express';
import { usersDeleteService } from './service.delete.selected.users';

// Mock dependencies
jest.mock('@/core/db/maindb', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('@/core/eventBus/fabric.events', () => ({
  createAndPublishEvent: jest.fn()
}));

jest.mock('@/core/helpers/get.requestor.uuid.from.req', () => ({
  getRequestorUuidFromReq: jest.fn()
}));

jest.mock('./cache.users.list', () => ({
  usersCache: {
    invalidate: jest.fn()
  }
}));

jest.mock('./queries.users.list', () => ({
  queries: {
    deleteSelectedUsers: 'DELETE FROM users WHERE user_id = ANY($1)'
  }
}));

// Import mocks
import { pool } from '@/core/db/maindb';
import fabricEvents from '@/core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { usersCache } from './cache.users.list';
import { USERS_DELETE_EVENTS } from './events.users.list';

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;
const mockUsersCache = usersCache as jest.Mocked<typeof usersCache>;

describe('Delete Selected Users Service', () => {
  let mockRequest: Partial<Request>;
  let mockQuery: jest.Mock;

  // Test data
  const testUserIds = [
    '123e4567-e89b-12d3-a456-426614174000',
    '456e7890-e89b-12d3-a456-426614174000',
    '789e0123-e89b-12d3-a456-426614174000'
  ];

  beforeEach(() => {
    // Setup mocks before each test
    mockQuery = jest.fn();
    mockPool.query = mockQuery;
    
    mockRequest = {
      headers: {},
      body: {}
    };

    // Clear mocks
    jest.clearAllMocks();
    
    // Setup default values
    mockGetRequestorUuid.mockReturnValue('requestor-uuid-123');
    mockFabricEvents.createAndPublishEvent.mockResolvedValue(undefined);
  });

  describe('Successful user deletion', () => {
    it('should delete multiple users successfully', async () => {
      // Prepare test data
      const userIds = testUserIds;
      const requestorUuid = 'requestor-uuid-123';

      // Setup database mock - return deleted user IDs
      mockQuery.mockResolvedValue({
        rows: [
          { user_id: userIds[0] },
          { user_id: userIds[1] },
          { user_id: userIds[2] }
        ]
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(3);

      // Verify database call
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [userIds]
      );

      // Verify cache was invalidated
      expect(mockUsersCache.invalidate).toHaveBeenCalledWith('delete');

      // Verify events (3 events: start, cache invalidation, complete)
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(3);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          groupIds: userIds,
          requestorUuid
        }
      });
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
        payload: { deletedCount: 3, requestorUuid }
      });
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(3, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          requested: 3,
          deleted: 3,
          requestorUuid
        }
      });
    });

    it('should delete single user successfully', async () => {
      // Prepare test data
      const userIds = [testUserIds[0]];

      // Setup database mock - return single deleted user ID
      mockQuery.mockResolvedValue({
        rows: [{ user_id: userIds[0] }]
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(1);

      // Verify database call
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [userIds]
      );

      // Verify cache was invalidated
      expect(mockUsersCache.invalidate).toHaveBeenCalledWith('delete');
    });

    it('should handle empty userIds array', async () => {
      // Prepare test data
      const userIds: string[] = [];

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(0);

      // Verify no database call was made
      expect(mockQuery).not.toHaveBeenCalled();

      // Verify no cache invalidation
      expect(mockUsersCache.invalidate).not.toHaveBeenCalled();

      // Verify only start event was published (no completion events)
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          groupIds: [],
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });

    it('should handle partial deletion success', async () => {
      // Prepare test data
      const userIds = testUserIds;

      // Setup database mock - only 2 out of 3 users deleted
      mockQuery.mockResolvedValue({
        rows: [
          { user_id: userIds[0] },
          { user_id: userIds[1] }
        ]
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(2);

      // Verify database call
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [userIds]
      );

      // Verify cache was invalidated
      expect(mockUsersCache.invalidate).toHaveBeenCalledWith('delete');

      // Verify events (3 events: start, cache invalidation, complete)
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(3);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
        payload: { deletedCount: 2, requestorUuid: 'requestor-uuid-123' }
      });
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when users are deleted', async () => {
      // Prepare test data
      const userIds = [testUserIds[0]];

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [{ user_id: userIds[0] }]
      });

      // Call the service
      await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify cache was invalidated
      expect(mockUsersCache.invalidate).toHaveBeenCalledWith('delete');
    });

    it('should not invalidate cache when no users are deleted', async () => {
      // Prepare test data
      const userIds = testUserIds;

      // Setup database mock - no users deleted
      mockQuery.mockResolvedValue({
        rows: []
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(0);

      // Verify cache was not invalidated
      expect(mockUsersCache.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      // Prepare test data
      const userIds = testUserIds;

      // Setup database mock to throw error
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request))
        .rejects.toEqual({
          code: 'DATABASE_ERROR',
          message: 'Error deleting users',
          details: undefined // In production, details are not exposed
        });

      // Verify error event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          userIds: 3,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error occurred while deleting users'
          }
        },
        errorData: 'Database connection failed'
      });
    });

    it('should handle foreign key constraint violations', async () => {
      // Prepare test data
      const userIds = testUserIds;

      // Setup database mock to throw constraint error
      const constraintError = new Error('violates foreign key constraint');
      mockQuery.mockRejectedValue(constraintError);

      // Call the service and expect error
      await expect(usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request))
        .rejects.toEqual({
          code: 'DATABASE_ERROR',
          message: 'Error deleting users',
          details: undefined // In production, details are not exposed
        });

      // Verify error event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          userIds: 3,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error occurred while deleting users'
          }
        },
        errorData: 'violates foreign key constraint'
      });
    });

    it('should handle malformed database response', async () => {
      // Prepare test data
      const userIds = testUserIds;

      // Setup database mock with malformed response
      mockQuery.mockResolvedValue({
        rows: null // Malformed response
      });

      // Call the service and expect error
      await expect(usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request))
        .rejects.toEqual({
          code: 'DATABASE_ERROR',
          message: 'Error deleting users',
          details: undefined
        });

      // Verify error event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          userIds: 3,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error occurred while deleting users'
          }
        },
        errorData: expect.any(String)
      });
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large array of userIds', async () => {
      // Prepare test data - large array
      const largeUserIds = Array.from({ length: 100 }, (_, i) => 
        `123e4567-e89b-12d3-a456-${i.toString().padStart(12, '0')}`
      );

      // Setup database mock - all users deleted
      mockQuery.mockResolvedValue({
        rows: largeUserIds.map(id => ({ user_id: id }))
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(largeUserIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(100);

      // Verify database call was made with large array
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [largeUserIds]
      );

      // Verify cache was invalidated
      expect(mockUsersCache.invalidate).toHaveBeenCalledWith('delete');
    });

    it('should handle duplicate userIds', async () => {
      // Prepare test data with duplicates
      const userIdsWithDuplicates = [
        testUserIds[0],
        testUserIds[0], // Duplicate
        testUserIds[1],
        testUserIds[0]  // Another duplicate
      ];

      // Setup database mock - return unique deleted user IDs
      mockQuery.mockResolvedValue({
        rows: [
          { user_id: testUserIds[0] },
          { user_id: testUserIds[1] }
        ]
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(userIdsWithDuplicates, mockRequest as Request);

      // Verify result
      expect(result).toBe(2);

      // Verify database call was made with duplicates (database handles deduplication)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [userIdsWithDuplicates]
      );
    });

    it('should handle invalid UUIDs gracefully', async () => {
      // Prepare test data with invalid UUIDs
      const invalidUserIds = [
        'invalid-uuid-1',
        '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        'another-invalid-uuid'
      ];

      // Setup database mock - only valid UUID was processed
      mockQuery.mockResolvedValue({
        rows: [{ user_id: '123e4567-e89b-12d3-a456-426614174000' }]
      });

      // Call the service
      const result = await usersDeleteService.deleteSelectedUsers(invalidUserIds, mockRequest as Request);

      // Verify result
      expect(result).toBe(1);

      // Verify database call was made with all userIds (database handles validation)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [invalidUserIds]
      );
    });
  });

  describe('Event generation', () => {
    it('should generate correct events for successful deletion', async () => {
      // Prepare test data
      const userIds = testUserIds;
      const requestorUuid = 'requestor-uuid-123';

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: userIds.map(id => ({ user_id: id }))
      });

      // Call the service
      await usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request);

      // Verify events were published in correct order
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(3);

      // First event - operation start
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          groupIds: userIds,
          requestorUuid
        }
      });

      // Second event - cache invalidation
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
        payload: { deletedCount: 3, requestorUuid }
      });

      // Third event - completion
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(3, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          requested: 3,
          deleted: 3,
          requestorUuid
        }
      });
    });

    it('should generate error events for failed deletion', async () => {
      // Prepare test data
      const userIds = testUserIds;

      // Setup database mock to throw error
      const dbError = new Error('Database error');
      mockQuery.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(usersDeleteService.deleteSelectedUsers(userIds, mockRequest as Request))
        .rejects.toEqual({
          code: 'DATABASE_ERROR',
          message: 'Error deleting users',
          details: undefined
        });

      // Verify error event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          userIds: 3,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error occurred while deleting users'
          }
        },
        errorData: 'Database error'
      });
    });
  });
}); 