/**
 * Version: 1.0.0
 *
 * Integration tests for load user service with real database
 * This backend file contains Jest integration tests for the user loading service.
 * Tests verify real database operations, edge cases, and database error scenarios.
 * Uses real database connections and test data cleanup.
 *
 * File: service.load.user.integration.test.ts
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { loadUserById } from './service.load.user';
import type { DbUser, DbUserProfile } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

// Import real database pool
import { pool as pgPool } from '../../../../core/db/maindb';

// Mock event bus to avoid side effects during testing
jest.mock('../../../../core/eventBus/fabric.events', () => ({
  createAndPublishEvent: jest.fn()
}));

jest.mock('../../../../core/helpers/get.requestor.uuid.from.req', () => ({
  getRequestorUuidFromReq: jest.fn()
}));

// Import mocked modules
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Type the mocks
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;

describe('Load User Service Integration Tests', () => {
  let pool: Pool;
  let mockRequest: Partial<Request>;
  let testUserIds: string[] = [];

  beforeAll(async () => {
    // Use real database pool
    pool = pgPool as Pool;
    
    // Setup request mock
    mockRequest = {
      headers: {},
      body: {}
    };

    // Setup mocks
    mockGetRequestorUuid.mockReturnValue('integration-test-uuid');
    mockFabricEvents.createAndPublishEvent.mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    // Clear test data from previous tests
    await cleanupTestData();
    
    // Clear mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup all test data
    await cleanupTestData();
    
    // Close database pool
    await pool.end();
  });

  // Helper function to create test user
  async function createTestUser(userData: Partial<DbUser> = {}): Promise<string> {
    const userId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultUser: DbUser = {
      user_id: userId,
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@integration.test`,
      hashed_password: 'hashed_test_password',
      is_staff: false,
      account_status: AccountStatus.ACTIVE,
      first_name: 'Test',
      middle_name: null,
      last_name: 'User',
      created_at: new Date()
    };

    const user = { ...defaultUser, ...userData, user_id: userId };

    // Insert user
    await pool.query(`
      INSERT INTO app.users (
        user_id, username, email, hashed_password, is_staff, 
        account_status, first_name, middle_name, last_name, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      user.user_id, user.username, user.email, user.hashed_password, user.is_staff,
      user.account_status, user.first_name, user.middle_name, user.last_name, user.created_at
    ]);

    // Insert profile
    await pool.query(`
      INSERT INTO app.user_profiles (
        user_id, mobile_phone_number, address, company_name, position, gender
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      user.user_id, null, null, null, null, null
    ]);

    testUserIds.push(userId);
    return userId;
  }

  // Helper function to cleanup test data
  async function cleanupTestData(): Promise<void> {
    if (testUserIds.length > 0) {
      // Delete profiles first (foreign key constraint)
      await pool.query(`
        DELETE FROM app.user_profiles 
        WHERE user_id = ANY($1)
      `, [testUserIds]);

      // Delete users
      await pool.query(`
        DELETE FROM app.users 
        WHERE user_id = ANY($1)
      `, [testUserIds]);

      testUserIds = [];
    }
  }

  describe('Real Database Operations', () => {
    it('should load user data from real database successfully', async () => {
      // Create test user in database
      const userId = await createTestUser({
        username: 'integration_test_user',
        email: 'integration@test.com',
        first_name: 'Integration',
        last_name: 'Test',
        is_staff: true
      });

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.data.user.user_id).toBe(userId);
      expect(result.data.user.username).toBe('integration_test_user');
      expect(result.data.user.email).toBe('integration@test.com');
      expect(result.data.user.first_name).toBe('Integration');
      expect(result.data.user.last_name).toBe('Test');
      expect(result.data.user.is_staff).toBe(true);
      expect(result.data.profile.user_id).toBe(userId);

      // Verify events were published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
    });

    it('should load user with complete profile data', async () => {
      // Create test user with profile data
      const userId = await createTestUser({
        username: 'profile_test_user',
        email: 'profile@test.com'
      });

      // Update profile with data
      await pool.query(`
        UPDATE app.user_profiles 
        SET mobile_phone_number = $1, address = $2, company_name = $3, position = $4, gender = $5
        WHERE user_id = $6
      `, [
        '+1234567890', '123 Test St', 'Test Company', 'Developer', 'm', userId
      ]);

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.data.user.user_id).toBe(userId);
      expect(result.data.profile.mobile_phone_number).toBe('+1234567890');
      expect(result.data.profile.address).toBe('123 Test St');
      expect(result.data.profile.company_name).toBe('Test Company');
      expect(result.data.profile.position).toBe('Developer');
      expect(result.data.profile.gender).toBe('m');
    });

    it('should handle user with minimal profile data', async () => {
      // Create test user (profile will be created with null values)
      const userId = await createTestUser({
        username: 'minimal_profile_user',
        email: 'minimal@test.com'
      });

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.data.user.user_id).toBe(userId);
      expect(result.data.profile.user_id).toBe(userId);
      expect(result.data.profile.mobile_phone_number).toBeNull();
      expect(result.data.profile.address).toBeNull();
      expect(result.data.profile.company_name).toBeNull();
      expect(result.data.profile.position).toBeNull();
      expect(result.data.profile.gender).toBeNull();
    });
  });

  describe('Database Error Scenarios', () => {
    it('should handle user not found in real database', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      // Call the service and expect error
      await expect(loadUserById(nonExistentUserId, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'User not found'
        });

      // Verify NOT_FOUND event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
    });

    it('should handle profile not found in real database', async () => {
      // Create user but delete profile
      const userId = await createTestUser({
        username: 'no_profile_user',
        email: 'noprofile@test.com'
      });

      // Delete profile
      await pool.query(`
        DELETE FROM app.user_profiles 
        WHERE user_id = $1
      `, [userId]);

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toEqual({
          code: 'NOT_FOUND',
          message: 'User profile not found'
        });

      // Verify NOT_FOUND event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection errors gracefully', async () => {
      // Create test user
      const userId = await createTestUser({
        username: 'connection_test_user',
        email: 'connection@test.com'
      });

      // Temporarily close pool to simulate connection error
      const originalPool = pgPool;
      (pgPool as any) = null;

      // Call the service and expect error
      await expect(loadUserById(userId, mockRequest as Request))
        .rejects.toThrow();

      // Restore pool
      (pgPool as any) = originalPool;

      // Verify FAILED event was published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with special characters in data', async () => {
      // Create test user with special characters
      const userId = await createTestUser({
        username: 'special_chars_user',
        email: 'special+chars@test.com',
        first_name: 'José',
        last_name: 'O\'Connor',
        middle_name: 'van der Berg'
      });

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.data.user.username).toBe('special_chars_user');
      expect(result.data.user.email).toBe('special+chars@test.com');
      expect(result.data.user.first_name).toBe('José');
      expect(result.data.user.last_name).toBe('O\'Connor');
      expect(result.data.user.middle_name).toBe('van der Berg');
    });

    it('should handle user with very long data fields', async () => {
      // Create test user with long data
      const longString = 'a'.repeat(100);
      const userId = await createTestUser({
        username: 'long_data_user',
        email: 'long@test.com',
        first_name: longString,
        last_name: longString
      });

      // Update profile with long data
      await pool.query(`
        UPDATE app.user_profiles 
        SET address = $1, company_name = $2, position = $3
        WHERE user_id = $4
      `, [longString, longString, longString, userId]);

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.data.user.first_name).toBe(longString);
      expect(result.data.user.last_name).toBe(longString);
      expect(result.data.profile.address).toBe(longString);
      expect(result.data.profile.company_name).toBe(longString);
      expect(result.data.profile.position).toBe(longString);
    });

    it('should handle user with different account statuses', async () => {
      // Test different account statuses
      const statuses = [AccountStatus.ACTIVE, AccountStatus.INACTIVE, AccountStatus.SUSPENDED];

      for (const status of statuses) {
        const userId = await createTestUser({
          username: `status_${status}_user`,
          email: `status_${status}@test.com`,
          account_status: status
        });

        // Call the service
        const result = await loadUserById(userId, mockRequest as Request);

        // Verify result
        expect(result.success).toBe(true);
        expect(result.data.user.account_status).toBe(status);
      }
    });

    it('should handle user with different gender values', async () => {
      // Test different gender values
      const genders = ['m', 'f', null];

      for (const gender of genders) {
        const userId = await createTestUser({
          username: `gender_${gender}_user`,
          email: `gender_${gender}@test.com`
        });

        // Update profile with gender
        await pool.query(`
          UPDATE app.user_profiles 
          SET gender = $1
          WHERE user_id = $2
        `, [gender, userId]);

        // Call the service
        const result = await loadUserById(userId, mockRequest as Request);

        // Verify result
        expect(result.success).toBe(true);
        expect(result.data.profile.gender).toBe(gender);
      }
    });
  });

  describe('Concurrent Database Operations', () => {
    it('should handle concurrent loads of the same user', async () => {
      // Create test user
      const userId = await createTestUser({
        username: 'concurrent_test_user',
        email: 'concurrent@test.com'
      });

      const concurrentRequests = 5;

      // Create concurrent requests
      const promises = Array.from({ length: concurrentRequests }, () =>
        loadUserById(userId, mockRequest as Request)
      );

      // Execute all requests concurrently
      const results = await Promise.all(promises);

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.user.user_id).toBe(userId);
      });

      // Verify events were published for each request
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should handle concurrent loads of different users', async () => {
      // Create multiple test users
      const userIds = await Promise.all([
        createTestUser({ username: 'concurrent_user_1', email: 'concurrent1@test.com' }),
        createTestUser({ username: 'concurrent_user_2', email: 'concurrent2@test.com' }),
        createTestUser({ username: 'concurrent_user_3', email: 'concurrent3@test.com' })
      ]);

      // Create concurrent requests for different users
      const promises = userIds.map(userId =>
        loadUserById(userId, mockRequest as Request)
      );

      // Execute all requests concurrently
      const results = await Promise.all(promises);

      // Verify all requests succeeded with correct data
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.user.user_id).toBe(userIds[index]);
      });

      // Verify events were published for each request
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(userIds.length);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data integrity during concurrent operations', async () => {
      // Create test user
      const userId = await createTestUser({
        username: 'integrity_test_user',
        email: 'integrity@test.com'
      });

      const concurrentRequests = 10;

      // Create concurrent requests
      const promises = Array.from({ length: concurrentRequests }, () =>
        loadUserById(userId, mockRequest as Request)
      );

      // Execute all requests concurrently
      const results = await Promise.all(promises);

      // Verify all results are identical (data integrity)
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.data.user).toEqual(firstResult.data.user);
        expect(result.data.profile).toEqual(firstResult.data.profile);
      });
    });

    it('should handle database transaction isolation', async () => {
      // Create test user
      const userId = await createTestUser({
        username: 'transaction_test_user',
        email: 'transaction@test.com'
      });

      // Start a transaction and update user data
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Update user data in transaction
        await client.query(`
          UPDATE app.users 
          SET first_name = $1
          WHERE user_id = $2
        `, ['Transaction Test', userId]);

        // Load user data in another connection (should see old data)
        const result = await loadUserById(userId, mockRequest as Request);
        expect(result.data.user.first_name).toBe('Test'); // Should see original data

        // Commit transaction
        await client.query('COMMIT');

        // Load user data again (should see new data)
        const updatedResult = await loadUserById(userId, mockRequest as Request);
        expect(updatedResult.data.user.first_name).toBe('Transaction Test');

      } finally {
        client.release();
      }
    });
  });
}); 