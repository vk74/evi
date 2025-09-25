/**
 * Version: 1.0.0
 *
 * Tests for load user service
 * This backend file contains Jest tests for the user loading service logic. 
 * Tests verify business logic, database interactions, error handling, and event generation.
 * Uses mocks for database and event bus dependencies.
 *
 * File: service.load.user.test.ts
 */

import { Request } from 'express';
import { loadUserById } from './service.load.user';
import type { DbUser, DbUserProfile, LoadUserResponse } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

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

// Import mocks
import { pool } from '@/core/db/maindb';
import fabricEvents from '@/core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { USER_LOAD_EVENTS } from './events.user.editor';

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;

describe('Load User Service', () => {
  let mockRequest: Partial<Request>;
  let mockQuery: jest.Mock;

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

  describe('Successful user loading', () => {
    it('should load user and profile data successfully', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'requestor-uuid-123';

      const mockUser: DbUser = {
        user_id: userId,
        username: 'testuser',
        email: 'test@example.com',
        hashed_password: 'hashed_password',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Test',
        middle_name: null,
        last_name: 'User',
        created_at: new Date('2024-01-01')
      };

      const mockProfile: DbUserProfile = {
        profile_id: '456e7890-e89b-12d3-a456-426614174000',
        user_id: userId,
        mobile_phone_number: '+1234567890',
        address: null,
        company_name: null,
        position: null,
        gender: 'm'
      };

      // Setup database mocks
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] }) // getUserById
        .mockResolvedValueOnce({ rows: [mockProfile] }); // getUserProfileById

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result).toEqual({
        success: true,
        message: 'User data loaded successfully',
        data: {
          user: mockUser,
          profile: mockProfile
        }
      });

      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.any(String), [userId]);
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), [userId]);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          username: mockUser.username,
          requestorUuid
        }
      });
    });

    it('should handle user with minimal profile data', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockUser: DbUser = {
        user_id: userId,
        username: 'minimaluser',
        email: 'minimal@example.com',
        hashed_password: 'hashed_password',
        is_staff: false,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Minimal',
        middle_name: null,
        last_name: 'User',
        created_at: new Date('2024-01-01')
      };

      const mockProfile: DbUserProfile = {
        profile_id: '456e7890-e89b-12d3-a456-426614174000',
        user_id: userId,
        mobile_phone_number: null,
        address: null,
        company_name: null,
        position: null,
        gender: null
      };

      // Setup database mocks
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockProfile] });

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.profile).toEqual(mockProfile);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          username: mockUser.username,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle user not found', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Setup database mock - user not found
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'User not found'
        });

      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [userId]);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.NOT_FOUND.eventName,
        payload: {
          userId,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });

    it('should handle profile not found', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const mockUser: DbUser = {
        user_id: userId,
        username: 'testuser',
        email: 'test@example.com',
        hashed_password: 'hashed_password',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Test',
        middle_name: null,
        last_name: 'User',
        created_at: new Date('2024-01-01')
      };

      // Setup database mocks - user found, profile not found
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] });

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'User profile not found'
        });

      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(2);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.NOT_FOUND.eventName,
        payload: {
          userId,
          requestorUuid: 'requestor-uuid-123',
          detail: 'User profile not found'
        }
      });
    });

    it('should handle database errors', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const dbError = new Error('Database connection failed');

      // Setup database mock to throw error
      mockQuery.mockRejectedValueOnce(dbError);

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toThrow('Database connection failed');

      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.FAILED.eventName,
        payload: {
          userId,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          }
        },
        errorData: 'Database connection failed'
      });
    });
  });

  describe('Event generation', () => {
    it('should generate complete event on successful load', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'admin-uuid-456';

      const mockUser: DbUser = {
        user_id: userId,
        username: 'adminuser',
        email: 'admin@example.com',
        hashed_password: 'hashed_password',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Admin',
        middle_name: null,
        last_name: 'User',
        created_at: new Date('2024-01-01')
      };

      const mockProfile: DbUserProfile = {
        profile_id: '456e7890-e89b-12d3-a456-426614174000',
        user_id: userId,
        mobile_phone_number: null,
        address: null,
        company_name: null,
        position: null,
        gender: null
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockProfile] });

      // Call the service
      await loadUserById(userId, mockRequest as Request);

      // Verify COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          username: mockUser.username,
          requestorUuid
        }
      });
    });

    it('should generate not found event when user not found', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'user-uuid-789';

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'User not found'
        });

      // Verify NOT_FOUND event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.NOT_FOUND.eventName,
        payload: {
          userId,
          requestorUuid
        }
      });
    });

    it('should generate failed event on database errors', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const dbError = new Error('Connection timeout');

      // Setup mocks
      mockQuery.mockRejectedValueOnce(dbError);

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toThrow('Connection timeout');

      // Verify FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.FAILED.eventName,
        payload: {
          userId,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Connection timeout'
          }
        },
        errorData: 'Connection timeout'
      });
    });
  });

  describe('Requestor UUID handling', () => {
    it('should get requestor UUID from request', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const requestorUuid = 'custom-requestor-uuid';

      const mockUser: DbUser = {
        user_id: userId,
        username: 'testuser',
        email: 'test@example.com',
        hashed_password: 'hashed_password',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Test',
        middle_name: null,
        last_name: 'User',
        created_at: new Date('2024-01-01')
      };

      const mockProfile: DbUserProfile = {
        profile_id: '456e7890-e89b-12d3-a456-426614174000',
        user_id: userId,
        mobile_phone_number: null,
        address: null,
        company_name: null,
        position: null,
        gender: null
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockProfile] });

      // Call the service
      await loadUserById(userId, mockRequest as Request);

      // Verify that getRequestorUuidFromReq was called
      expect(mockGetRequestorUuid).toHaveBeenCalledWith(mockRequest);
      expect(mockGetRequestorUuid).toHaveBeenCalledTimes(1);

      // Verify that requestorUuid is used in events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USER_LOAD_EVENTS.COMPLETE.eventName,
        payload: {
          userId,
          username: mockUser.username,
          requestorUuid
        }
      });
    });
  });
}); 