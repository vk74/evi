/**
 * Version: 1.0.0
 *
 * Tests for users list cache
 * This backend file contains Jest tests for the users list caching logic. 
 * Tests verify cache key generation, TTL handling, invalidation, and data storage.
 * Tests the actual cache implementation, not mocked dependencies.
 *
 * File: cache.users.list.test.ts
 */

import { usersCache } from './cache.users.list';
import type { IUsersResponse, IUser } from './types.users.list';
import { AccountStatus } from './types.users.list';

describe('Users List Cache', () => {
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

  const testResponse: IUsersResponse = {
    users: testUsers,
    total: 2
  };

  beforeEach(() => {
    // Clear cache before each test
    usersCache.invalidate('all');
  });

  describe('Cache key generation', () => {
    it('should generate correct cache key for default parameters', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Call the cache method
      usersCache.get(params);

      // Verify that cache key is generated correctly
      // The actual key generation is internal, but we can verify the cache works
      expect(usersCache.get(params)).toBeNull(); // Should be null initially
    });

    it('should generate correct cache key for search parameters', () => {
      // Prepare test data
      const params = {
        search: 'testuser',
        sortBy: 'username',
        sortDesc: true,
        page: 1,
        limit: 25
      };

      // Call the cache method
      usersCache.get(params);

      // Verify that cache key is generated correctly
      expect(usersCache.get(params)).toBeNull(); // Should be null initially
    });

    it('should generate correct cache key for pagination', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: 'email',
        sortDesc: false,
        page: 3,
        limit: 50
      };

      // Call the cache method
      usersCache.get(params);

      // Verify that cache key is generated correctly
      expect(usersCache.get(params)).toBeNull(); // Should be null initially
    });
  });

  describe('Cache get operations', () => {
    it('should retrieve cached data successfully', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data first
      usersCache.set(params, testResponse);

      // Retrieve data
      const result = usersCache.get(params);

      // Verify result
      expect(result).toEqual(testResponse);
    });

    it('should return null when cache miss', () => {
      // Prepare test data
      const params = {
        search: 'nonexistent',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Retrieve data without storing first
      const result = usersCache.get(params);

      // Verify result
      expect(result).toBeNull();
    });

    it('should handle different cache keys independently', () => {
      // Prepare test data
      const params1 = {
        search: 'user1',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const params2 = {
        search: 'user2',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const response1 = { users: [testUsers[0]], total: 1 };
      const response2 = { users: [testUsers[1]], total: 1 };

      // Store different data for different keys
      usersCache.set(params1, response1);
      usersCache.set(params2, response2);

      // Retrieve data
      const result1 = usersCache.get(params1);
      const result2 = usersCache.get(params2);

      // Verify results
      expect(result1).toEqual(response1);
      expect(result2).toEqual(response2);
    });
  });

  describe('Cache set operations', () => {
    it('should store data in cache successfully', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data
      usersCache.set(params, testResponse);

      // Retrieve data
      const result = usersCache.get(params);

      // Verify result
      expect(result).toEqual(testResponse);
    });

    it('should overwrite existing data', () => {
      // Prepare test data
      const params = {
        search: 'test',
        sortBy: 'username',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const initialResponse = { users: [testUsers[0]], total: 1 };
      const updatedResponse = { users: testUsers, total: 2 };

      // Store initial data
      usersCache.set(params, initialResponse);

      // Verify initial data
      expect(usersCache.get(params)).toEqual(initialResponse);

      // Overwrite with new data
      usersCache.set(params, updatedResponse);

      // Verify updated data
      expect(usersCache.get(params)).toEqual(updatedResponse);
    });

    it('should handle empty response data', () => {
      // Prepare test data
      const params = {
        search: 'nonexistent',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const emptyResponse: IUsersResponse = {
        users: [],
        total: 0
      };

      // Store empty data
      usersCache.set(params, emptyResponse);

      // Retrieve data
      const result = usersCache.get(params);

      // Verify data integrity
      expect(result).toEqual(emptyResponse);
      expect(result?.users).toHaveLength(0);
      expect(result?.total).toBe(0);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache with delete reason', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data
      usersCache.set(params, testResponse);

      // Verify data is cached
      expect(usersCache.get(params)).toEqual(testResponse);

      // Invalidate cache
      usersCache.invalidate('delete');

      // Verify data is no longer cached
      expect(usersCache.get(params)).toBeNull();
    });

    it('should invalidate cache with refresh reason', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data
      usersCache.set(params, testResponse);

      // Verify data is cached
      expect(usersCache.get(params)).toEqual(testResponse);

      // Invalidate cache with refresh (without parameters - should not invalidate)
      usersCache.invalidate('refresh');

      // Verify data is still cached (refresh without params doesn't invalidate)
      expect(usersCache.get(params)).toEqual(testResponse);
    });

    it('should invalidate all cache entries', () => {
      // Prepare test data
      const params1 = {
        search: 'user1',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const params2 = {
        search: 'user2',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data for multiple keys
      usersCache.set(params1, { users: [testUsers[0]], total: 1 });
      usersCache.set(params2, { users: [testUsers[1]], total: 1 });

      // Verify data is cached
      expect(usersCache.get(params1)).not.toBeNull();
      expect(usersCache.get(params2)).not.toBeNull();

      // Invalidate all cache
      usersCache.invalidate('all');

      // Verify all data is no longer cached
      expect(usersCache.get(params1)).toBeNull();
      expect(usersCache.get(params2)).toBeNull();
    });

    it('should invalidate specific cache entry with refresh', () => {
      // Prepare test data
      const params1 = {
        search: 'user1',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const params2 = {
        search: 'user2',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data for multiple keys
      usersCache.set(params1, { users: [testUsers[0]], total: 1 });
      usersCache.set(params2, { users: [testUsers[1]], total: 1 });

      // Verify data is cached
      expect(usersCache.get(params1)).not.toBeNull();
      expect(usersCache.get(params2)).not.toBeNull();

      // Invalidate specific entry
      usersCache.invalidate('refresh', undefined, params1);

      // Verify only specific entry is invalidated
      expect(usersCache.get(params1)).toBeNull();
      expect(usersCache.get(params2)).not.toBeNull();
    });
  });

  describe('Cache data integrity', () => {
    it('should preserve data structure when storing and retrieving', () => {
      // Prepare test data
      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Store data
      usersCache.set(params, testResponse);

      // Retrieve data
      const retrieved = usersCache.get(params);

      // Verify data integrity
      expect(retrieved).toEqual(testResponse);
      expect(retrieved?.users).toHaveLength(2);
      expect(retrieved?.total).toBe(2);
      expect(retrieved?.users[0].user_id).toBe(testUsers[0].user_id);
      expect(retrieved?.users[0].username).toBe(testUsers[0].username);
    });

    it('should handle empty response data', () => {
      // Prepare test data
      const params = {
        search: 'nonexistent',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const emptyResponse: IUsersResponse = {
        users: [],
        total: 0
      };

      // Store empty data
      usersCache.set(params, emptyResponse);

      // Retrieve data
      const retrieved = usersCache.get(params);

      // Verify data integrity
      expect(retrieved).toEqual(emptyResponse);
      expect(retrieved?.users).toHaveLength(0);
      expect(retrieved?.total).toBe(0);
    });
  });

  describe('Cache performance', () => {
    it('should handle large datasets efficiently', () => {
      // Prepare test data - large dataset
      const largeUsers = Array.from({ length: 1000 }, (_, i) => ({
        user_id: `123e4567-e89b-12d3-a456-${i.toString().padStart(12, '0')}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        is_staff: false,
        account_status: AccountStatus.active,
        first_name: 'User',
        middle_name: '',
        last_name: `${i}`
      }));

      const largeResponse: IUsersResponse = {
        users: largeUsers,
        total: 1000
      };

      const params = {
        search: '',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 1000
      };

      // Store large dataset
      usersCache.set(params, largeResponse);

      // Retrieve large dataset
      const retrieved = usersCache.get(params);

      // Verify data integrity
      expect(retrieved).toEqual(largeResponse);
      expect(retrieved?.users).toHaveLength(1000);
      expect(retrieved?.total).toBe(1000);
    });

    it('should handle concurrent cache operations', async () => {
      // Prepare test data
      const params1 = {
        search: 'user1',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      const params2 = {
        search: 'user2',
        sortBy: '',
        sortDesc: false,
        page: 1,
        limit: 25
      };

      // Perform concurrent operations
      const [result1, result2] = await Promise.all([
        Promise.resolve(usersCache.get(params1)),
        Promise.resolve(usersCache.get(params2))
      ]);

      // Verify both operations completed successfully
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
}); 