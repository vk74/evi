/**
 * Version: 1.0.0
 *
 * Tests for delete selected users service
 * This backend file contains Jest tests for the delete selected users service logic. 
 * Tests verify business logic, database interactions, error handling, cache invalidation, and event generation.
 * Uses mocks for database, repository, and event bus dependencies.
 *
 * File: service.delete.selected.users.test.ts
 */

import { Request } from 'express';
import { deleteSelectedUsers } from './service.delete.selected.users';
import type { DeleteUsersPayload, UserError } from './types.users.list';

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

jest.mock('./repository.users.list', () => ({
  __esModule: true,
  default: {
    invalidateCache: jest.fn()
  }
}));

// Import mocks
import { pool } from '@/core/db/maindb';
import fabricEvents from '@/core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import usersRepository from './repository.users.list';
import { USERS_DELETE_EVENTS } from './events.users.list';

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;
const mockUsersRepository = usersRepository as jest.Mocked<typeof usersRepository>;

describe('Delete Selected Users Service', () => {
  let mockRequest: Partial<Request>;
  let mockPayload: DeleteUsersPayload;

  beforeEach(() => {
    // Setup mocks before each test
    mockRequest = {
      headers: {},
      body: {}
    };

    // Clear mocks
    jest.clearAllMocks();
    
    // Setup default values
    mockGetRequestorUuid.mockReturnValue('requestor-uuid-123');
    mockFabricEvents.createAndPublishEvent.mockResolvedValue(undefined);
    mockUsersRepository.invalidateCache.mockReturnValue(undefined);

    // Default payload
    mockPayload = {
      userIds: [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-b789-123456789abc'
      ]
    };
  });

  describe('Successful user deletions', () => {
    it('should delete multiple users successfully', async () => {
      // Prepare test data
      const userIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-b789-123456789abc',
        '456defab-78c9-12d3-e456-789abcdef012'
      ];
      const requestorUuid = 'admin-uuid-456';

      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup database mock - successful deletion
      mockPool.query.mockResolvedValue({
        rows: userIds.map(id => ({ user_id: id })),
        rowCount: userIds.length
      });

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);

      // Call the service
      const result = await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify result
      expect(result).toEqual({
        deletedUserIds: userIds
      });

      // Verify database call
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String), // SQL query
        [userIds]
      );

      // Verify cache invalidation
      expect(mockUsersRepository.invalidateCache).toHaveBeenCalledTimes(1);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // CACHE_INVALIDATE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATE.eventName,
        payload: null
      });

      // COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: userIds.length,
          requestorUuid
        }
      });
    });

    it('should handle single user deletion', async () => {
      // Prepare test data - single user
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup database mock
      mockPool.query.mockResolvedValue({
        rows: [{ user_id: userIds[0] }],
        rowCount: 1
      });

      // Call the service
      const result = await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify result
      expect(result).toEqual({
        deletedUserIds: userIds
      });

      // Verify database call
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [userIds]
      );

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: 1,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });

    it('should handle empty userIds array', async () => {
      // Prepare test data - empty array
      const payload: DeleteUsersPayload = {
        userIds: []
      };

      // Setup database mock - no users to delete
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      // Call the service
      const result = await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify result
      expect(result).toEqual({
        deletedUserIds: []
      });

      // Verify database call
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [[]]
      );

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: 0,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });

    it('should handle partial deletion when some users not found', async () => {
      // Prepare test data
      const requestedUserIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-b789-123456789abc',
        '456defab-78c9-12d3-e456-789abcdef012'
      ];

      const deletedUserIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '456defab-78c9-12d3-e456-789abcdef012'
      ];

      const payload: DeleteUsersPayload = {
        userIds: requestedUserIds
      };

      // Setup database mock - only 2 users found and deleted
      mockPool.query.mockResolvedValue({
        rows: deletedUserIds.map(id => ({ user_id: id })),
        rowCount: deletedUserIds.length
      });

      // Call the service
      const result = await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify result
      expect(result).toEqual({
        deletedUserIds
      });

      // Verify database call
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [requestedUserIds]
      );

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: 2,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      const dbError = new Error('Database connection failed');

      // Setup database mock - database error
      mockPool.query.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(deleteSelectedUsers(mockRequest as Request, payload))
        .rejects.toEqual({
          code: 'USERS_DELETE_ERROR',
          message: 'Database connection failed',
          details: dbError
        });

      // Verify database call
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [userIds]
      );

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      
      // FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'USERS_DELETE_ERROR',
            message: 'Database connection failed',
            details: dbError
          }
        },
        errorData: JSON.stringify({
          code: 'USERS_DELETE_ERROR',
          message: 'Database connection failed',
          details: dbError
        })
      });
    });

    it('should handle constraint violation errors', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      const constraintError = new Error('foreign key constraint violation');
      (constraintError as any).code = '23503'; // PostgreSQL foreign key error code

      // Setup database mock - constraint error
      mockPool.query.mockRejectedValue(constraintError);

      // Call the service and expect error
      await expect(deleteSelectedUsers(mockRequest as Request, payload))
        .rejects.toEqual({
          code: '23503',
          message: 'foreign key constraint violation',
          details: constraintError
        });

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: '23503',
            message: 'foreign key constraint violation',
            details: constraintError
          }
        },
        errorData: JSON.stringify({
          code: '23503',
          message: 'foreign key constraint violation',
          details: constraintError
        })
      });
    });

    it('should handle unknown errors', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      const unknownError = 'Unknown error occurred';

      // Setup database mock - unknown error
      mockPool.query.mockRejectedValue(unknownError);

      // Call the service and expect error
      await expect(deleteSelectedUsers(mockRequest as Request, payload))
        .rejects.toEqual({
          code: 'USERS_DELETE_ERROR',
          message: 'Failed to delete users',
          details: unknownError
        });

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'USERS_DELETE_ERROR',
            message: 'Failed to delete users',
            details: unknownError
          }
        },
        errorData: JSON.stringify({
          code: 'USERS_DELETE_ERROR',
          message: 'Failed to delete users',
          details: unknownError
        })
      });
    });

    it('should generate failed event on errors', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      const dbError = new Error('Connection timeout');

      // Setup database mock - error
      mockPool.query.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(deleteSelectedUsers(mockRequest as Request, payload))
        .rejects.toMatchObject({
          code: 'USERS_DELETE_ERROR',
          message: 'Connection timeout'
        });

      // Verify FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'USERS_DELETE_ERROR',
            message: 'Connection timeout',
            details: dbError
          }
        },
        errorData: JSON.stringify({
          code: 'USERS_DELETE_ERROR',
          message: 'Connection timeout',
          details: dbError
        })
      });
    });
  });

  describe('Event generation', () => {
    it('should generate cache invalidate event after successful deletion', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup database mock
      mockPool.query.mockResolvedValue({
        rows: [{ user_id: userIds[0] }],
        rowCount: 1
      });

      // Call the service
      await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify CACHE_INVALIDATE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATE.eventName,
        payload: null
      });
    });

    it('should generate complete event with correct payload', async () => {
      // Prepare test data
      const userIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-b789-123456789abc'
      ];
      const requestorUuid = 'user-uuid-789';
      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockPool.query.mockResolvedValue({
        rows: userIds.map(id => ({ user_id: id })),
        rowCount: userIds.length
      });

      // Call the service
      await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: userIds.length,
          requestorUuid
        }
      });
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache after successful deletion', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup database mock
      mockPool.query.mockResolvedValue({
        rows: [{ user_id: userIds[0] }],
        rowCount: 1
      });

      // Call the service
      await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify cache invalidation
      expect(mockUsersRepository.invalidateCache).toHaveBeenCalledTimes(1);
    });

    it('should not invalidate cache on errors', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      const dbError = new Error('Database error');

      // Setup database mock - error
      mockPool.query.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(deleteSelectedUsers(mockRequest as Request, payload))
        .rejects.toMatchObject({
          code: 'USERS_DELETE_ERROR'
        });

      // Verify cache was not invalidated
      expect(mockUsersRepository.invalidateCache).not.toHaveBeenCalled();
    });
  });

  describe('Requestor UUID handling', () => {
    it('should get requestor UUID from request', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const requestorUuid = 'custom-requestor-uuid';
      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockPool.query.mockResolvedValue({
        rows: [{ user_id: userIds[0] }],
        rowCount: 1
      });

      // Call the service
      await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify that getRequestorUuidFromReq was called
      expect(mockGetRequestorUuid).toHaveBeenCalledWith(mockRequest);
      expect(mockGetRequestorUuid).toHaveBeenCalledTimes(2); // Called twice in the service

      // Verify that requestorUuid is used in COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: 1,
          requestorUuid
        }
      });
    });

    it('should handle missing requestor UUID', async () => {
      // Prepare test data
      const userIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const payload: DeleteUsersPayload = {
        userIds
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(null);
      mockPool.query.mockResolvedValue({
        rows: [{ user_id: userIds[0] }],
        rowCount: 1
      });

      // Call the service
      await deleteSelectedUsers(mockRequest as Request, payload);

      // Verify that 'unknown' is used when requestorUuid is null
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount: 1,
          requestorUuid: 'unknown'
        }
      });
    });
  });
}); 