/**
 * Version: 1.0.0
 *
 * Tests for update user service
 * This backend file contains Jest tests for the user update service logic. 
 * Tests verify business logic, database interactions, error handling, and event generation.
 * Uses mocks for database and event bus dependencies.
 *
 * File: service.update.user.test.ts
 */

import { Request } from 'express';
import { updateUserById } from './service.update.user';
import type { UpdateUserRequest, ApiResponse } from './types.user.editor';
import { AccountStatus, Gender } from './types.user.editor';

// Mock dependencies
jest.mock('@/core/db/maindb', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn()
  }
}));

jest.mock('@/core/eventBus/fabric.events', () => ({
  createAndPublishEvent: jest.fn()
}));

jest.mock('@/core/helpers/get.requestor.uuid.from.req', () => ({
  getRequestorUuidFromReq: jest.fn()
}));

// Import mocks
import { pool } from '@/core/db/maindb';
import fabricEvents from '@/core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { USER_UPDATE_EVENTS } from './events.user.editor';

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;

describe('Update User Service', () => {
  let mockClient: any;
  let mockRequest: Partial<Request>;
  let mockUpdateData: UpdateUserRequest;

  beforeEach(() => {
    // Setup mocks before each test
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    mockPool.connect.mockResolvedValue(mockClient);
    
    mockRequest = {
      headers: {},
      body: {}
    };

    // Clear mocks
    jest.clearAllMocks();
    
    // Setup default values
    mockGetRequestorUuid.mockReturnValue('requestor-uuid-123');
    mockFabricEvents.createAndPublishEvent.mockResolvedValue(undefined);

    // Default update data
    mockUpdateData = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'updateduser',
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'User'
    };
  });

  describe('Successful user updates', () => {
    it('should update user and profile data successfully', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'requestor-uuid-123';

      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'updateduser',
        email: 'updated@example.com',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Updated',
        middle_name: 'Middle',
        last_name: 'User',
        mobile_phone_number: '+1234567890',
        gender: Gender.MALE
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);

      // Verify result
      expect(result).toEqual({
        success: true,
        message: 'User data updated successfully'
      });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, expect.any(String), [
        userId, 'updateduser', 'updated@example.com', true, 'active', 
        'Updated', 'Middle', 'User'
      ]);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, expect.any(String), [
        userId, '+1234567890', 'm'
      ]);
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // VALIDATION_PASSED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid,
          updatedFields: [
            'username', 'email', 'is_staff', 'account_status', 'first_name', 
            'middle_name', 'last_name', 'mobile_phone_number', 'gender'
          ]
        }
      });

      // COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          updatedFields: [
            'username', 'email', 'is_staff', 'account_status', 'first_name', 
            'middle_name', 'last_name', 'mobile_phone_number', 'gender'
          ],
          requestorUuid
        }
      });
    });

    it('should handle update with only user_id (no-op update)', async () => {
      // Prepare test data - only user_id, no other fields
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId
        // No other fields provided
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById (no changes)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById (no changes)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);

      // Verify result - should still succeed even with no changes
      expect(result.success).toBe(true);
      expect(result.message).toBe('User data updated successfully');

      // Verify database calls - should still execute queries
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockClient.query).toHaveBeenNthCalledWith(2, expect.any(String), [
        userId, undefined, undefined, undefined, undefined, 
        undefined, undefined, undefined
      ]);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, expect.any(String), [
        userId, undefined, undefined, undefined, undefined, undefined
      ]);
      expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');

      // Verify events - should still publish events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // VALIDATION_PASSED event with empty updatedFields
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid: 'requestor-uuid-123',
          updatedFields: [] // No fields to update
        }
      });

      // COMPLETE event with empty updatedFields
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          updatedFields: [], // No fields were updated
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });

    it('should handle partial update with minimal data', async () => {
      // Prepare test data - only email update
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        email: 'newemail@example.com'
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.message).toBe('User data updated successfully');

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.query).toHaveBeenNthCalledWith(2, expect.any(String), [
        userId, undefined, 'newemail@example.com', undefined, undefined, 
        undefined, undefined, undefined
      ]);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // VALIDATION_PASSED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid: 'requestor-uuid-123',
          updatedFields: ['email']
        }
      });
    });

    it('should handle update with only profile fields', async () => {
      // Prepare test data - only profile fields
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        mobile_phone_number: '+9876543210',
        gender: Gender.FEMALE
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.query).toHaveBeenNthCalledWith(3, expect.any(String), [
        userId, '+9876543210', '456 Oak Ave', undefined, undefined, 'f'
      ]);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid: 'requestor-uuid-123',
          updatedFields: ['mobile_phone_number', 'gender']
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle user not found', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'nonexistentuser'
      };

      // Setup database mocks - user not found
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // updateUserById - no rows affected

      // Call the service and expect error
      await expect(updateUserById(updateData, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'Failed to update user data',
          details: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, updateUserById, ROLLBACK
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // VALIDATION_PASSED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid: 'requestor-uuid-123',
          updatedFields: ['username']
        }
      });

      // FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          userId,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        },
        errorData: 'User not found'
      });
    });

    it('should handle profile not found', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'testuser',
        mobile_phone_number: '+1234567890'
      };

      // Setup database mocks - user found, profile not found
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById - success
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // updateUserProfileById - no rows affected

      // Call the service and expect error
      await expect(updateUserById(updateData, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'Failed to update user data',
          details: {
            code: 'NOT_FOUND',
            message: 'User profile not found'
          }
        });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, updateUserById, updateUserProfileById, ROLLBACK
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // FAILED event for profile not found
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          userId,
          error: {
            code: 'NOT_FOUND',
            message: 'User profile not found'
          }
        },
        errorData: 'User profile not found'
      });
    });

    it('should handle database errors', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'testuser'
      };

      const dbError = new Error('Database connection failed');

      // Setup database mocks - database error
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockRejectedValueOnce(dbError); // updateUserById - error

      // Call the service and expect error
      await expect(updateUserById(updateData, mockRequest as Request))
        .rejects.toMatchObject({
          code: 'UPDATE_FAILED',
          message: 'Database connection failed'
        });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, updateUserById, ROLLBACK
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // FAILED event for database error
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          userId,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Database connection failed'
          }
        },
        errorData: 'Database connection failed'
      });
    });
  });

  describe('Event generation', () => {
    it('should generate validation passed event immediately', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'admin-uuid-456';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'adminuser',
        email: 'admin@example.com'
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      await updateUserById(updateData, mockRequest as Request);

      // Verify VALIDATION_PASSED event is generated first
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid,
          updatedFields: ['username', 'email']
        }
      });
    });

    it('should generate complete event on successful update', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'user-uuid-789';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        first_name: 'John',
        last_name: 'Doe'
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      await updateUserById(updateData, mockRequest as Request);

      // Verify COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          updatedFields: ['first_name', 'last_name'],
          requestorUuid
        }
      });
    });

    it('should generate failed event on errors', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'testuser'
      };

      const dbError = new Error('Constraint violation');

      // Setup mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockRejectedValueOnce(dbError); // updateUserById - error

      // Call the service and expect error
      await expect(updateUserById(updateData, mockRequest as Request))
        .rejects.toMatchObject({
          code: 'UPDATE_FAILED',
          message: 'Constraint violation'
        });

      // Verify FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          userId,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Constraint violation'
          }
        },
        errorData: 'Constraint violation'
      });
    });
  });

  describe('Database transaction handling', () => {
    it('should rollback transaction on database errors', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'testuser'
      };

      const dbError = new Error('Connection timeout');

      // Setup database mocks - error during update
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockRejectedValueOnce(dbError); // updateUserById - error

      // Call the service and expect error
      await expect(updateUserById(updateData, mockRequest as Request))
        .rejects.toMatchObject({
          code: 'UPDATE_FAILED',
          message: 'Connection timeout'
        });

      // Verify rollback was called
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should release database client after operation', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        email: 'test@example.com'
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      await updateUserById(updateData, mockRequest as Request);

      // Verify that client was released
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Requestor UUID handling', () => {
    it('should get requestor UUID from request', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'custom-requestor-uuid';
      const updateData: UpdateUserRequest = {
        user_id: userId,
        username: 'testuser'
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      await updateUserById(updateData, mockRequest as Request);

      // Verify that getRequestorUuidFromReq was called
      expect(mockGetRequestorUuid).toHaveBeenCalledWith(mockRequest);
      expect(mockGetRequestorUuid).toHaveBeenCalledTimes(1);

      // Verify that requestorUuid is used in events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId,
          requestorUuid,
          updatedFields: ['username']
        }
      });
    });
  });
}); 