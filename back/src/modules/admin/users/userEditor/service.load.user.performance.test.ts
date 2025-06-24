/**
 * Version: 1.0.0
 *
 * Performance tests for load user service
 * This backend file contains Jest performance tests for the user loading service.
 * Tests verify response times, concurrent request handling, and load testing scenarios.
 * Uses mocks for database and event bus dependencies.
 *
 * File: service.load.user.performance.test.ts
 */

import { Request } from 'express';
import { loadUserById } from './service.load.user';
import type { DbUser, DbUserProfile } from './types.user.editor';
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

// Type the mocks
const mockPool = pool as jest.Mocked<typeof pool>;
const mockFabricEvents = fabricEvents as jest.Mocked<typeof fabricEvents>;
const mockGetRequestorUuid = getRequestorUuidFromReq as jest.MockedFunction<typeof getRequestorUuidFromReq>;

describe('Load User Service Performance Tests', () => {
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

  describe('Response Time Tests', () => {
    it('should complete user load within acceptable time limit', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const startTime = Date.now();

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

      // Setup database mocks with minimal delay
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockProfile] });

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - should complete within 100ms (with mocks)
      expect(executionTime).toBeLessThan(100);
      
      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle database delays gracefully', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const startTime = Date.now();

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

      // Setup database mocks with simulated delay
      mockQuery
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ rows: [mockUser] }), 50)
        ))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ rows: [mockProfile] }), 30)
        ));

      // Call the service
      const result = await loadUserById(userId, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - should complete within reasonable time
      expect(executionTime).toBeLessThan(200);
      
      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent requests for same user', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const concurrentRequests = 10;

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

      // Setup database mocks to handle multiple calls
      mockQuery
        .mockResolvedValue({ rows: [mockUser] })
        .mockResolvedValue({ rows: [mockProfile] });

      // Create concurrent requests
      const promises = Array.from({ length: concurrentRequests }, () =>
        loadUserById(userId, mockRequest as Request)
      );

      // Execute all requests concurrently
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.user.user_id).toBe(userId);
        expect(result.data.profile.user_id).toBe(userId);
      });

      // Verify database calls (2 queries per request)
      expect(mockQuery).toHaveBeenCalledTimes(concurrentRequests * 2);
      
      // Performance assertion - concurrent requests should be faster than sequential
      expect(totalTime).toBeLessThan(concurrentRequests * 50); // Should be much faster than sequential
    });

    it('should handle concurrent requests for different users', async () => {
      // Prepare test data for multiple users
      const userIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '456e7890-e89b-12d3-a456-426614174000',
        '789e0123-e89b-12d3-a456-426614174000'
      ];

      const mockUsers = userIds.map((userId, index) => ({
        user_id: userId,
        username: `testuser${index}`,
        email: `test${index}@example.com`,
        hashed_password: 'hashed_password',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: `Test${index}`,
        middle_name: null,
        last_name: 'User',
        created_at: new Date('2024-01-01')
      }));

      const mockProfiles = userIds.map((userId, index) => ({
        profile_id: `profile-${userId}`,
        user_id: userId,
        mobile_phone_number: `+123456789${index}`,
        address: null,
        company_name: null,
        position: null,
        gender: 'm'
      }));

      // Setup database mocks to return different data for different users
      mockQuery.mockImplementation((query: string, params: string[]) => {
        const userId = params[0];
        const userIndex = userIds.indexOf(userId);
        
        if (query.includes('user_id')) {
          return Promise.resolve({ rows: [mockUsers[userIndex]] });
        } else {
          return Promise.resolve({ rows: [mockProfiles[userIndex]] });
        }
      });

      // Create concurrent requests for different users
      const promises = userIds.map(userId =>
        loadUserById(userId, mockRequest as Request)
      );

      // Execute all requests concurrently
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded with correct data
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.user.user_id).toBe(userIds[index]);
        expect(result.data.profile.user_id).toBe(userIds[index]);
      });

      // Verify database calls (2 queries per user)
      expect(mockQuery).toHaveBeenCalledTimes(userIds.length * 2);
      
      // Performance assertion
      expect(totalTime).toBeLessThan(userIds.length * 100);
    });
  });

  describe('Load Testing', () => {
    it('should handle high load of sequential requests', async () => {
      // Prepare test data
      const requestCount = 50;
      const userIds = Array.from({ length: requestCount }, (_, i) => 
        `user-${i.toString().padStart(3, '0')}-e89b-12d3-a456-426614174000`
      );

      const mockUser: DbUser = {
        user_id: 'test-user-id',
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
        profile_id: 'test-profile-id',
        user_id: 'test-user-id',
        mobile_phone_number: '+1234567890',
        address: null,
        company_name: null,
        position: null,
        gender: 'm'
      };

      // Setup database mocks
      mockQuery
        .mockResolvedValue({ rows: [mockUser] })
        .mockResolvedValue({ rows: [mockProfile] });

      // Execute sequential requests
      const startTime = Date.now();
      const results = [];
      
      for (let i = 0; i < requestCount; i++) {
        const result = await loadUserById(userIds[i], mockRequest as Request);
        results.push(result);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls
      expect(mockQuery).toHaveBeenCalledTimes(requestCount * 2);
      
      // Performance assertion - should handle load efficiently
      expect(totalTime).toBeLessThan(requestCount * 20); // 20ms per request max
    });

    it('should maintain consistent performance under sustained load', async () => {
      // Prepare test data
      const batchSize = 10;
      const batchCount = 5;
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
        .mockResolvedValue({ rows: [mockUser] })
        .mockResolvedValue({ rows: [mockProfile] });

      const batchTimes: number[] = [];

      // Execute multiple batches
      for (let batch = 0; batch < batchCount; batch++) {
        const batchStartTime = Date.now();
        
        const batchPromises = Array.from({ length: batchSize }, () =>
          loadUserById(userId, mockRequest as Request)
        );
        
        await Promise.all(batchPromises);
        
        const batchEndTime = Date.now();
        batchTimes.push(batchEndTime - batchStartTime);
      }

      // Verify all batches completed successfully
      expect(mockQuery).toHaveBeenCalledTimes(batchCount * batchSize * 2);
      
      // Performance assertion - each batch should complete within reasonable time
      batchTimes.forEach(time => {
        expect(time).toBeLessThan(batchSize * 50); // 50ms per request max
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated operations', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const iterations = 100;

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
        .mockResolvedValue({ rows: [mockUser] })
        .mockResolvedValue({ rows: [mockProfile] });

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute repeated operations
      for (let i = 0; i < iterations; i++) {
        await loadUserById(userId, mockRequest as Request);
      }

      // Get final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Verify operations completed
      expect(mockQuery).toHaveBeenCalledTimes(iterations * 2);
      
      // Memory assertion - should not increase significantly
      // Allow for some increase due to Jest mocks and test data
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max increase
    });
  });
}); 