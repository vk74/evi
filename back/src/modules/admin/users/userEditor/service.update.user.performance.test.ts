/**
 * Version: 1.0.0
 *
 * Performance tests for update user service
 * This backend file contains Jest performance tests for the user update service.
 * Tests verify response times, concurrent request handling, and load testing scenarios.
 * Uses mocks for database and event bus dependencies.
 *
 * File: service.update.user.performance.test.ts
 */

import { Request } from 'express';
import { updateUserById } from './service.update.user';
import type { UpdateUserRequest } from './types.user.editor';
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

describe('Update User Service Performance Tests', () => {
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

  describe('Response Time Tests', () => {
    it('should complete user update within acceptable time limit', async () => {
      // Prepare test data
      const updateData: UpdateUserRequest = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'updateduser',
        email: 'updated@example.com',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        first_name: 'Updated',
        middle_name: 'Middle',
        last_name: 'User',
        mobile_phone_number: '+1234567890',
        address: '123 Main St',
        company_name: 'Tech Corp',
        position: 'Manager',
        gender: Gender.MALE
      };

      const startTime = Date.now();

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - should complete within 200ms (with mocks)
      expect(executionTime).toBeLessThan(200);
      
      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4);
    });

    it('should handle minimal updates efficiently', async () => {
      // Prepare test data - only email update
      const updateData: UpdateUserRequest = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newemail@example.com'
      };

      const startTime = Date.now();

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - minimal updates should be fast
      expect(executionTime).toBeLessThan(150);
      
      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4);
    });

    it('should handle database transaction delays gracefully', async () => {
      // Prepare test data
      const updateData: UpdateUserRequest = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const startTime = Date.now();

      // Setup database mocks with simulated delays
      mockClient.query
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ rows: [], rowCount: 1 }), 30) // BEGIN
        ))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ rows: [], rowCount: 1 }), 40) // updateUserById
        ))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ rows: [], rowCount: 1 }), 20) // updateUserProfileById
        ))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ rows: [], rowCount: 1 }), 25) // COMMIT
        ));

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - should complete within reasonable time
      expect(executionTime).toBeLessThan(200);
      
      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent updates for same user', async () => {
      // Prepare test data
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const concurrentRequests = 5;

      const updateDataArray = Array.from({ length: concurrentRequests }, (_, index) => ({
        user_id: userId,
        username: `updateduser${index}`,
        email: `updated${index}@example.com`,
        first_name: `Updated${index}`,
        last_name: 'User'
      }));

      // Setup database mocks to handle multiple calls
      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      // Create concurrent requests
      const startTime = Date.now();
      const results = await Promise.all(updateDataArray.map(updateData =>
        updateUserById(updateData, mockRequest as Request)
      ));
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls (4 queries per request)
      expect(mockClient.query).toHaveBeenCalledTimes(concurrentRequests * 4);
      
      // Performance assertion - concurrent requests should be faster than sequential
      expect(totalTime).toBeLessThan(concurrentRequests * 100); // Should be much faster than sequential
    });

    it('should handle concurrent updates for different users', async () => {
      // Prepare test data for multiple users
      const userIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '456e7890-e89b-12d3-a456-426614174000',
        '789e0123-e89b-12d3-a456-426614174000'
      ];

      const updateDataArray = userIds.map((userId, index) => ({
        user_id: userId,
        username: `updateduser${index}`,
        email: `updated${index}@example.com`,
        first_name: `Updated${index}`,
        last_name: 'User'
      }));

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      // Create concurrent requests for different users
      const startTime = Date.now();
      const results = await Promise.all(updateDataArray.map(updateData =>
        updateUserById(updateData, mockRequest as Request)
      ));
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls (4 queries per user)
      expect(mockClient.query).toHaveBeenCalledTimes(userIds.length * 4);
      
      // Performance assertion
      expect(totalTime).toBeLessThan(userIds.length * 150);
    });
  });

  describe('Load Testing', () => {
    it('should handle high load of sequential update requests', async () => {
      // Prepare test data
      const requestCount = 25;
      const userIds = Array.from({ length: requestCount }, (_, i) => 
        `user-${i.toString().padStart(3, '0')}-e89b-12d3-a456-426614174000`
      );

      const updateDataArray = userIds.map((userId, index) => ({
        user_id: userId,
        username: `updateduser${index}`,
        email: `updated${index}@example.com`,
        first_name: `Updated${index}`,
        last_name: 'User'
      }));

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      // Execute sequential requests
      const startTime = Date.now();
      const results = [];
      
      for (let i = 0; i < requestCount; i++) {
        const result = await updateUserById(updateDataArray[i], mockRequest as Request);
        results.push(result);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(requestCount * 4);
      
      // Performance assertion - should handle load efficiently
      expect(totalTime).toBeLessThan(requestCount * 30); // 30ms per request max
    });

    it('should maintain consistent performance under sustained load', async () => {
      // Prepare test data
      const batchSize = 8;
      const batchCount = 4;
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const updateData = {
        user_id: userId,
        username: 'updateduser',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User'
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      const batchTimes: number[] = [];

      // Execute multiple batches
      for (let batch = 0; batch < batchCount; batch++) {
        const batchStartTime = Date.now();
        
        const batchPromises = Array.from({ length: batchSize }, () =>
          updateUserById(updateData, mockRequest as Request)
        );
        
        await Promise.all(batchPromises);
        
        const batchEndTime = Date.now();
        batchTimes.push(batchEndTime - batchStartTime);
      }

      // Verify all batches completed successfully
      expect(mockClient.query).toHaveBeenCalledTimes(batchCount * batchSize * 4);
      
      // Performance assertion - each batch should complete within reasonable time
      batchTimes.forEach(time => {
        expect(time).toBeLessThan(batchSize * 50); // 50ms per request max
      });
    });
  });

  describe('Database Connection Pool Tests', () => {
    it('should handle database connection pool exhaustion gracefully', async () => {
      // Prepare test data
      const updateData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'updateduser',
        email: 'updated@example.com'
      };
      const concurrentRequests = 8;

      // Setup database pool mock to simulate connection delays
      let connectionCount = 0;
      mockPool.connect.mockImplementation(() => {
        connectionCount++;
        return new Promise(resolve => {
          // Simulate connection pool delay when many connections are active
          const delay = connectionCount > 4 ? 80 : 15;
          setTimeout(() => {
            resolve(mockClient);
          }, delay);
        });
      });

      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      // Create concurrent requests to test connection pool
      const promises = Array.from({ length: concurrentRequests }, () =>
        updateUserById(updateData, mockRequest as Request)
      );

      // Execute all requests concurrently
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database connections were managed properly
      expect(mockPool.connect).toHaveBeenCalledTimes(concurrentRequests);
      expect(mockClient.release).toHaveBeenCalledTimes(concurrentRequests);
      
      // Performance assertion - should handle connection pool delays
      expect(totalTime).toBeLessThan(concurrentRequests * 150);
    });

    it('should release database connections properly under load', async () => {
      // Prepare test data
      const updateData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'updateduser',
        email: 'updated@example.com'
      };
      const requestCount = 12;

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      // Execute multiple requests
      const promises = Array.from({ length: requestCount }, () =>
        updateUserById(updateData, mockRequest as Request)
      );

      await Promise.all(promises);

      // Verify all connections were released
      expect(mockPool.connect).toHaveBeenCalledTimes(requestCount);
      expect(mockClient.release).toHaveBeenCalledTimes(requestCount);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated update operations', async () => {
      // Prepare test data
      const iterations = 40;
      const updateData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'updateduser',
        email: 'updated@example.com'
      };

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [], rowCount: 1 });

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute repeated operations
      for (let i = 0; i < iterations; i++) {
        await updateUserById(updateData, mockRequest as Request);
      }

      // Get final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Verify operations completed
      expect(mockClient.query).toHaveBeenCalledTimes(iterations * 4);
      
      // Memory assertion - should not increase significantly
      // Allow for some increase due to Jest mocks and test data
      expect(memoryIncrease).toBeLessThan(12 * 1024 * 1024); // 12MB max increase
    });
  });

  describe('Event Publishing Performance', () => {
    it('should publish events efficiently during updates', async () => {
      // Prepare test data
      const updateData: UpdateUserRequest = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'updateduser',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User'
      };

      const startTime = Date.now();

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // updateUserProfileById
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await updateUserById(updateData, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - event publishing should not slow down significantly
      expect(executionTime).toBeLessThan(200);
      
      // Verify events were published
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenCalledTimes(2);
      
      // Verify VALIDATION_PASSED event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(1, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: expect.objectContaining({
          userId: updateData.user_id,
          requestorUuid: 'requestor-uuid-123',
          updatedFields: ['username', 'email', 'first_name', 'last_name']
        })
      });

      // Verify COMPLETE event
      expect(mockFabricEvents.createAndPublishEvent).toHaveBeenNthCalledWith(2, {
        req: mockRequest,
        eventName: USER_UPDATE_EVENTS.COMPLETE.eventName,
        payload: expect.objectContaining({
          userId: updateData.user_id,
          updatedFields: ['username', 'email', 'first_name', 'last_name'],
          requestorUuid: 'requestor-uuid-123'
        })
      });
    });
  });
}); 