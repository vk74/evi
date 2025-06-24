/**
 * Version: 1.0.0
 *
 * Tests for fetch users service
 * This backend file contains Jest tests for the users list fetch service logic. 
 * Tests verify business logic, database interactions, caching, error handling, and event generation.
 * Uses mocks for database, cache, and event bus dependencies.
 *
 * File: service.fetch.users.test.ts
 */

import { Request } from 'express';
import { usersFetchService } from './service.fetch.users';
import type { IUsersFetchParams, IUsersResponse, IUser } from './types.users.list';
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

jest.mock('./cache.users.list', () => ({
  usersCache: {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn()
  }
}));

jest.mock('./queries.users.list', () => ({
  queries: {
    fetchUsers: 'SELECT * FROM users'
  },
  buildSortClause: jest.fn()
}));

// Import mocks
import { pool } from '@/core/db/maindb';
import fabricEvents from '@/core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '@/core/helpers/get.requestor.uuid.from.req';
import { usersCache } from './cache.users.list';
import { buildSortClause } from './queries.users.list';
import { USERS_FETCH_EVENTS } from './events.users.list';

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;
const mockUsersCache = usersCache as jest.Mocked<typeof usersCache>;
const mockBuildSortClause = buildSortClause as jest.MockedFunction<typeof buildSortClause>;

describe('Fetch Users Service', () => {
  let mockRequest: Partial<Request>;
  let mockQuery: jest.Mock;

  // Test data
  const testUsers: IUser[] = [
    {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser1',
      email: 'test1@example.com',
      is_staff: true,
      account_status: AccountStatus.active,
      first_name: 'Test',
      middle_name: '',
      last_name: 'User1'
    },
    {
      user_id: '456e7890-e89b-12d3-a456-426614174000',
      username: 'testuser2',
      email: 'test2@example.com',
      is_staff: false,
      account_status: AccountStatus.active,
      first_name: 'Test',
      middle_name: 'Middle',
      last_name: 'User2'
    }
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
    mockBuildSortClause.mockReturnValue('username ASC');
  });

  describe('Successful user fetching', () => {
    it('should fetch users with default parameters', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: '',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      };

      const requestorUuid = 'requestor-uuid-123';

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [
          { ...testUsers[0], total: 2 },
          { ...testUsers[1], total: 2 }
        ]
      });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result
      expect(result).toEqual({
        users: testUsers,
        total: 2
      });

      // Verify database call
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['', 'username ASC', 25, 0]
      );

      // Verify cache was set
      expect(mockUsersCache.set).toHaveBeenCalledWith(
        expect.objectContaining({
          search: '',
          sortBy: '',
          sortDesc: false,
          page: 1,
          limit: 25
        }),
        expect.objectContaining({
          users: testUsers,
          total: 2
        })
      );

      // Verify events (3 events: initial cache miss, cache miss, complete)
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(3);
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: {
          requestorUuid,
          search: '(empty)',
          page: 1,
          itemsPerPage: 25
        }
      });
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_MISS.eventName,
        payload: {
          params,
          requestorUuid
        }
      });
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(3, {
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.COMPLETE.eventName,
        payload: {
          count: 2,
          total: 2,
          search: false,
          requestorUuid
        }
      });
    });

    it('should use cached data when available', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: 'test',
        page: 1,
        itemsPerPage: 25,
        sortBy: 'username',
        sortDesc: false
      };

      const cachedResponse: IUsersResponse = {
        users: [testUsers[0]],
        total: 1
      };

      // Setup cache mock - return cached data
      mockUsersCache.get.mockReturnValue(cachedResponse);

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result from cache
      expect(result).toEqual(cachedResponse);

      // Verify no database call was made
      expect(mockQuery).not.toHaveBeenCalled();

      // Verify cache hit event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.CACHE_HIT.eventName,
        payload: {
          cacheHit: true,
          params,
          requestorUuid: 'requestor-uuid-123'
        }
      });
    });

    it('should handle search functionality', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: 'testuser1',
        page: 1,
        itemsPerPage: 25,
        sortBy: 'username',
        sortDesc: false
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [{ ...testUsers[0], total: 1 }]
      });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result
      expect(result).toEqual({
        users: [testUsers[0]],
        total: 1
      });

      // Verify database call with search parameter
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['testuser1', 'username ASC', 25, 0]
      );
    });

    it('should handle pagination correctly', async () => {
      // Prepare test data - page 2
      const params: IUsersFetchParams = {
        search: '',
        page: 2,
        itemsPerPage: 10,
        sortBy: 'email',
        sortDesc: true
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [{ ...testUsers[1], total: 2 }]
      });

      // Setup sort clause mock
      mockBuildSortClause.mockReturnValue('email DESC');

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result
      expect(result).toEqual({
        users: [testUsers[1]],
        total: 2
      });

      // Verify database call with correct offset (page 2, 10 items per page = offset 10)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['', 'email DESC', 10, 10]
      );
    });

    it('should handle empty result set', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: 'nonexistent',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock - empty result
      mockQuery.mockResolvedValue({ rows: [] });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result
      expect(result).toEqual({
        users: [],
        total: 0
      });

      // Verify database call was made
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Caching behavior', () => {
    it('should force refresh when forceRefresh is true', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: '',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false,
        forceRefresh: true
      };

      const cachedResponse: IUsersResponse = {
        users: testUsers,
        total: 2
      };

      // Setup cache mock - return cached data
      mockUsersCache.get.mockReturnValue(cachedResponse);

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [{ ...testUsers[0], total: 1 }]
      });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result from database, not cache
      expect(result).toEqual({
        users: [testUsers[0]],
        total: 1
      });

      // Verify cache was invalidated
      expect(mockUsersCache.invalidate).toHaveBeenCalledWith('refresh', undefined, expect.any(Object));

      // Verify database call was made despite cache hit
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should cache results with correct key', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: 'test',
        page: 2,
        itemsPerPage: 50,
        sortBy: 'username',
        sortDesc: true
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [{ ...testUsers[0], total: 1 }]
      });

      // Call the service
      await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify cache was set with correct key
      expect(mockUsersCache.set).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
          sortBy: 'username',
          sortDesc: true,
          page: 2,
          limit: 50
        }),
        expect.objectContaining({
          users: [testUsers[0]],
          total: 1
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: '',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock to throw error
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValue(dbError);

      // Call the service and expect error
      await expect(usersFetchService.fetchUsers(params, mockRequest as Request))
        .rejects.toEqual({
          code: 'DATABASE_ERROR',
          message: 'Error retrieving user data',
          details: undefined // In production, details are not exposed
        });

      // Verify error event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: USERS_FETCH_EVENTS.FAILED.eventName,
        payload: {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error retrieving user data'
          }
        },
        errorData: 'Database connection failed'
      });
    });

    it('should handle malformed database response', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: '',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock with malformed response
      mockQuery.mockResolvedValue({
        rows: [{ invalid_field: 'data' }] // Missing total field
      });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result handles malformed data gracefully
      expect(result).toEqual({
        users: [{
          user_id: undefined,
          username: undefined,
          email: undefined,
          is_staff: undefined,
          account_status: undefined,
          first_name: undefined,
          middle_name: '',
          last_name: undefined
        }],
        total: NaN
      });
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large result sets', async () => {
      // Prepare test data
      const params: IUsersFetchParams = {
        search: '',
        page: 1,
        itemsPerPage: 200, // Maximum allowed
        sortBy: '',
        sortDesc: false
      };

      // Create large result set
      const largeUsers = Array.from({ length: 200 }, (_, i) => ({
        user_id: `123e4567-e89b-12d3-a456-${i.toString().padStart(12, '0')}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        is_staff: false,
        account_status: AccountStatus.active,
        first_name: 'User',
        middle_name: '',
        last_name: `${i}`,
        total: 200
      }));

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock
      mockQuery.mockResolvedValue({ rows: largeUsers });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify result
      expect(result.users).toHaveLength(200);
      expect(result.total).toBe(200);
    });

    it('should handle special characters in search', async () => {
      // Prepare test data with special characters
      const params: IUsersFetchParams = {
        search: 'test@example.com', // Email with special characters
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      };

      // Setup cache mock - no cached data
      mockUsersCache.get.mockReturnValue(null);

      // Setup database mock
      mockQuery.mockResolvedValue({
        rows: [{ ...testUsers[0], total: 1 }]
      });

      // Call the service
      const result = await usersFetchService.fetchUsers(params, mockRequest as Request);

      // Verify database call with special characters
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['test@example.com', 'username ASC', 25, 0]
      );

      expect(result).toEqual({
        users: [testUsers[0]],
        total: 1
      });
    });
  });
}); 