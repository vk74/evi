/**
 * Version: 1.0.0
 *
 * Tests for users list service
 * This backend file contains Jest tests for the users list service logic. 
 * Tests verify business logic, database interactions, cache management, error handling, and event generation.
 * Uses mocks for database, repository, and event bus dependencies.
 *
 * File: service.users.list.test.ts
 */

import { Request } from 'express';
import { getAllUsers } from './service.users.list';
import type { IUser, IUsersResponse, UserError } from './types.users.list';
import { AccountStatus } from './types.users.list';

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
    hasValidCache: jest.fn(),
    getCachedData: jest.fn(),
    setCacheData: jest.fn(),
    invalidateCache: jest.fn()
  }
}));

// Import mocks
import { pool } from '@/core/db/maindb';
import fabricEvents from '@/core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import usersRepository from './repository.users.list';
import { USERS_FETCH_EVENTS } from './events.users.list';

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;
const mockUsersRepository = usersRepository as jest.Mocked<typeof usersRepository>;

describe('Users List Service', () => {
  let mockRequest: Partial<Request>;
  let mockUsers: IUser[];

  beforeEach(() => {
    // Setup mocks before each test
    mockRequest = {
      query: {},
      headers: {}
    };

    // Clear mocks
    jest.clearAllMocks();
    
    // Setup default values
    mockGetRequestorUuid.mockReturnValue('requestor-uuid-123');
    mockFabricEvents.createAndPublishEvent.mockResolvedValue(undefined);
    mockUsersRepository.hasValidCache.mockReturnValue(false);
    mockUsersRepository.getCachedData.mockImplementation(() => {
      throw new Error('Cache is empty');
    });
    mockUsersRepository.setCacheData.mockReturnValue(undefined);
    mockUsersRepository.invalidateCache.mockReturnValue(undefined);

    // Default mock users
    mockUsers = [
      {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'admin',
        email: 'admin@example.com',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Admin',
        middle_name: null,
        last_name: 'User',
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        user_id: '987fcdeb-51a2-43d1-b789-123456789abc',
        username: 'user1',
        email: 'user1@example.com',
        is_staff: false,
        account_status: AccountStatus.ACTIVE,
        first_name: 'John',
        middle_name: 'Doe',
        last_name: 'Smith',
        created_at: '2024-01-02T00:00:00.000Z'
      }
    ];
  });

  describe('Cache-first strategy', () => {
    it('should return cached data when cache is valid', async () => {
      // Prepare test data
      const cachedResponse: IUsersResponse = {
        users: mockUsers,
        total: 2
      };
      const requestorUuid = 'admin-uuid-456';

      // Setup mocks - cache is valid
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockUsersRepository.hasValidCache.mockReturnValue(true);
      mockUsersRepository.getCachedData.mockReturnValue(cachedResponse);

      // Call the service
      const result = await getAllUsers(mockRequest as Request);

      // Verify result
      expect(result).toEqual(cachedResponse);

      // Verify cache was checked
      expect(mockUsersRepository.hasValidCache).toHaveBeenCalledTimes(1);
      expect(mockUsersRepository.getCachedData).toHaveBeenCalledTimes(1);

      // Verify database was not queried
      expect(mockPool.query).not.toHaveBeenCalled();

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
      
      // CACHE_HIT event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_HIT.eventName,
        payload: {
          requestorUuid
        }
      });
    });

    it('should query database when cache is invalid', async () => {
      // Prepare test data
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      const expectedResponse: IUsersResponse = {
        users: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: AccountStatus.ACTIVE,
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: '2024-01-01T00:00:00.000Z'
        }],
        total: 1
      };

      // Setup mocks - cache is invalid
      mockUsersRepository.hasValidCache.mockReturnValue(false);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      const result = await getAllUsers(mockRequest as Request);

      // Verify result
      expect(result).toEqual(expectedResponse);

      // Verify database was queried
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String));

      // Verify cache was updated
      expect(mockUsersRepository.setCacheData).toHaveBeenCalledWith(expectedResponse);

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(3);
      
      // CACHE_MISS event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: {
          requestorUuid: 'requestor-uuid-123'
        }
      });

      // CACHE_UPDATE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_UPDATE.eventName,
        payload: {
          count: 1
        }
      });

      // COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(3, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.COMPLETE.eventName,
        payload: {
          count: 1,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });
  });

  describe('Refresh parameter handling', () => {
    it('should invalidate cache when refresh=true', async () => {
      // Prepare test data
      const requestorUuid = 'user-uuid-789';
      mockRequest.query = { refresh: 'true' };

      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      const expectedResponse: IUsersResponse = {
        users: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: AccountStatus.ACTIVE,
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: '2024-01-01T00:00:00.000Z'
        }],
        total: 1
      };

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      const result = await getAllUsers(mockRequest as Request);

      // Verify result
      expect(result).toEqual(expectedResponse);

      // Verify cache was invalidated
      expect(mockUsersRepository.invalidateCache).toHaveBeenCalledTimes(1);

      // Verify database was queried (not cache)
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String));
      expect(mockUsersRepository.hasValidCache).not.toHaveBeenCalled();

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(4);
      
      // CACHE_INVALIDATE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_INVALIDATE.eventName,
        payload: {
          reason: 'manual_refresh',
          requestorUuid
        }
      });
    });

    it('should not invalidate cache when refresh=false', async () => {
      // Prepare test data
      mockRequest.query = { refresh: 'false' };

      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify cache was not invalidated
      expect(mockUsersRepository.invalidateCache).not.toHaveBeenCalled();

      // Verify CACHE_INVALIDATE event was not published
      expect(mockFabricEvents.createAndPublishEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: USERS_FETCH_EVENTS.CACHE_INVALIDATE.eventName
        })
      );
    });

    it('should not invalidate cache when refresh parameter is missing', async () => {
      // Prepare test data
      mockRequest.query = {};

      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify cache was not invalidated
      expect(mockUsersRepository.invalidateCache).not.toHaveBeenCalled();
    });
  });

  describe('Database interactions', () => {
    it('should transform database rows to API format', async () => {
      // Prepare test data with various field values
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'completeuser',
          email: 'complete@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Complete',
          middle_name: 'Middle',
          last_name: 'User',
          created_at: new Date('2024-01-01T12:30:45.000Z')
        },
        {
          user_id: '987fcdeb-51a2-43d1-b789-123456789abc',
          username: 'minimaluser',
          email: null,
          is_staff: false,
          account_status: 'disabled',
          first_name: null,
          middle_name: null,
          last_name: '',
          created_at: null
        }
      ];

      const expectedResponse: IUsersResponse = {
        users: [
          {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            username: 'completeuser',
            email: 'complete@example.com',
            is_staff: true,
            account_status: AccountStatus.ACTIVE,
            first_name: 'Complete',
            middle_name: 'Middle',
            last_name: 'User',
            created_at: '2024-01-01T12:30:45.000Z'
          },
          {
            user_id: '987fcdeb-51a2-43d1-b789-123456789abc',
            username: 'minimaluser',
            email: '',
            is_staff: false,
            account_status: AccountStatus.DISABLED,
            first_name: '',
            middle_name: null,
            last_name: '',
            created_at: expect.any(String) // Current date when null
          }
        ],
        total: 2
      };

      // Setup mocks
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 2
      });

      // Call the service
      const result = await getAllUsers(mockRequest as Request);

      // Verify result
      expect(result).toEqual(expectedResponse);
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle empty database result', async () => {
      // Prepare test data - empty result
      const dbRows: any[] = [];

      const expectedResponse: IUsersResponse = {
        users: [],
        total: 0
      };

      // Setup mocks
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 0
      });

      // Call the service
      const result = await getAllUsers(mockRequest as Request);

      // Verify result
      expect(result).toEqual(expectedResponse);
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database errors', async () => {
      // Prepare test data
      const dbError = new Error('Database connection failed');

      // Setup database mock - database error
      mockPool.query.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(getAllUsers(mockRequest as Request))
        .rejects.toEqual({
          code: 'USERS_FETCH_ERROR',
          message: 'Database connection failed',
          details: dbError
        });

      // Verify events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // CACHE_MISS event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: {
          requestorUuid: 'requestor-uuid-123'
        }
      });

      // FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'USERS_FETCH_ERROR',
            message: 'Database connection failed',
            details: dbError
          }
        },
        errorData: JSON.stringify({
          code: 'USERS_FETCH_ERROR',
          message: 'Database connection failed',
          details: dbError
        })
      });
    });

    it('should handle null database result', async () => {
      // Setup database mock - null result
      mockPool.query.mockResolvedValue(null);

      // Call the service and expect error
      await expect(getAllUsers(mockRequest as Request))
        .rejects.toEqual({
          code: 'DB_ERROR',
          message: 'Database returned empty result',
          details: {
            code: 'DB_ERROR',
            message: 'Database returned empty result'
          }
        });
    });

    it('should handle database result without rows', async () => {
      // Setup database mock - result without rows
      mockPool.query.mockResolvedValue({
        rows: null,
        rowCount: 0
      });

      // Call the service and expect error
      await expect(getAllUsers(mockRequest as Request))
        .rejects.toEqual({
          code: 'DB_ERROR',
          message: 'Database returned empty result',
          details: {
            code: 'DB_ERROR',
            message: 'Database returned empty result'
          }
        });
    });
  });

  describe('Event generation', () => {
    it('should generate cache hit event when using cached data', async () => {
      // Prepare test data
      const cachedResponse: IUsersResponse = {
        users: mockUsers,
        total: 2
      };
      const requestorUuid = 'cache-user-123';

      // Setup mocks - cache is valid
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockUsersRepository.hasValidCache.mockReturnValue(true);
      mockUsersRepository.getCachedData.mockReturnValue(cachedResponse);

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify CACHE_HIT event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_HIT.eventName,
        payload: {
          requestorUuid
        }
      });
    });

    it('should generate cache miss event when cache is invalid', async () => {
      // Prepare test data
      const requestorUuid = 'db-user-456';
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks - cache is invalid
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockUsersRepository.hasValidCache.mockReturnValue(false);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify CACHE_MISS event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: {
          requestorUuid
        }
      });
    });

    it('should generate cache update event after successful database query', async () => {
      // Prepare test data
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks
      mockUsersRepository.hasValidCache.mockReturnValue(false);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify CACHE_UPDATE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_UPDATE.eventName,
        payload: {
          count: 1
        }
      });
    });

    it('should generate complete event after successful operation', async () => {
      // Prepare test data
      const requestorUuid = 'complete-user-789';
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockUsersRepository.hasValidCache.mockReturnValue(false);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(3, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.COMPLETE.eventName,
        payload: {
          count: 1,
          requestorUuid
        }
      });
    });

    it('should generate failed event on errors', async () => {
      // Prepare test data
      const dbError = new Error('Query timeout');

      // Setup mocks - database error
      mockPool.query.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(getAllUsers(mockRequest as Request))
        .rejects.toMatchObject({
          code: 'USERS_FETCH_ERROR',
          message: 'Query timeout'
        });

      // Verify FAILED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'USERS_FETCH_ERROR',
            message: 'Query timeout',
            details: dbError
          }
        },
        errorData: JSON.stringify({
          code: 'USERS_FETCH_ERROR',
          message: 'Query timeout',
          details: dbError
        })
      });
    });
  });

  describe('Requestor UUID handling', () => {
    it('should get requestor UUID from request', async () => {
      // Prepare test data
      const requestorUuid = 'custom-requestor-uuid';
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(requestorUuid);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify that getRequestorUuidFromReq was called
      expect(mockGetRequestorUuid).toHaveBeenCalledWith(mockRequest);
      expect(mockGetRequestorUuid).toHaveBeenCalledTimes(2); // Called twice in the service

      // Verify that requestorUuid is used in events
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: {
          requestorUuid
        }
      });
    });

    it('should handle missing requestor UUID', async () => {
      // Prepare test data
      const dbRows = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
          first_name: 'Admin',
          middle_name: null,
          last_name: 'User',
          created_at: new Date('2024-01-01T00:00:00.000Z')
        }
      ];

      // Setup mocks
      mockGetRequestorUuid.mockReturnValue(null);
      mockPool.query.mockResolvedValue({
        rows: dbRows,
        rowCount: 1
      });

      // Call the service
      await getAllUsers(mockRequest as Request);

      // Verify that 'unknown' is used when requestorUuid is null
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(3, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.COMPLETE.eventName,
        payload: {
          count: 1,
          requestorUuid: 'unknown'
        }
      });
    });
  });
}); 