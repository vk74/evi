/**
 * Version: 1.0.0
 *
 * Performance tests for create user service
 * This backend file contains Jest performance tests for the user creation service.
 * Tests verify response times, concurrent request handling, and load testing scenarios.
 * Uses mocks for database, event bus, and bcrypt dependencies.
 *
 * File: service.create.user.performance.test.ts
 */

import { Request } from 'express';
import bcrypt from 'bcrypt';
import { createUser } from './service.create.user';
import type { CreateUserRequest } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

// Mock all external dependencies
jest.mock('../../../../core/db/maindb', () => ({
  pool: {
    connect: jest.fn()
  }
}));

jest.mock('../../../../core/eventBus/fabric.events', () => ({
  createAndPublishEvent: jest.fn()
}));

jest.mock('../../../../core/helpers/get.requestor.uuid.from.req', () => ({
  getRequestorUuidFromReq: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));

// Import mocked modules
import { pool } from '../../../../core/db/maindb';
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

describe('Create User Service Performance Tests', () => {
  // Mocks for testing
  let mockClient: any;
  let mockRequest: Partial<Request>;

  // Generate unique test data
  const generateTestData = (): CreateUserRequest => {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(now.getMilliseconds()).padStart(3, '0');

    return {
      username: `perftest${timestamp}`,
      password: 'P@ssw0rd123',
      last_name: 'lastname',
      first_name: 'firstname',
      email: `perf${timestamp}@jesttest.dev`,
      mobile_phone_number: '+98765432111',
      gender: 'm',
      address: '',
      company_name: '',
      position: '',
      middle_name: '',
      is_staff: false,
      account_status: AccountStatus.ACTIVE
    };
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup database client mock
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Setup database pool mock
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    // Setup request mock
    mockRequest = {
      headers: {},
      body: {}
    };

    // Setup requestor UUID mock
    (getRequestorUuidFromReq as jest.Mock).mockReturnValue('test-requestor-uuid');

    // Setup bcrypt mock
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123');

    // Setup events mock
    (createAndPublishEvent as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Response Time Tests', () => {
    it('should complete user creation within acceptable time limit', async () => {
      // Prepare test data
      const userData = generateTestData();
      const startTime = Date.now();

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Check username uniqueness
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Check email uniqueness
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Check phone uniqueness
        .mockResolvedValueOnce({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 }) // Insert user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert profile
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Call the service
      const result = await createUser(userData, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - should complete within 200ms (with mocks)
      expect(executionTime).toBeLessThan(200);
      
      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(7);
    });

    it('should handle bcrypt hashing delays gracefully', async () => {
      // Prepare test data
      const userData = generateTestData();
      const startTime = Date.now();

      // Setup database mocks
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Check username uniqueness
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Check email uniqueness
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Check phone uniqueness
        .mockResolvedValueOnce({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 }) // Insert user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert profile
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      // Setup bcrypt mock with simulated delay
      (bcrypt.hash as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('hashed_password_123'), 50))
      );

      // Call the service
      const result = await createUser(userData, mockRequest as Request);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify result
      expect(result.success).toBe(true);
      
      // Performance assertion - should complete within reasonable time
      expect(executionTime).toBeLessThan(300);
      
      // Verify bcrypt was called
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent user creation requests', async () => {
      // Prepare test data for multiple users
      const concurrentRequests = 5;
      const userDataArray = Array.from({ length: concurrentRequests }, () => generateTestData());

      // Setup database mocks to handle multiple calls
      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      // Create concurrent requests
      const startTime = Date.now();
      const results = await Promise.all(userDataArray.map(userData =>
        createUser(userData, mockRequest as Request)
      ));
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls (7 queries per request)
      expect(mockClient.query).toHaveBeenCalledTimes(concurrentRequests * 7);
      
      // Performance assertion - concurrent requests should be faster than sequential
      expect(totalTime).toBeLessThan(concurrentRequests * 100); // Should be much faster than sequential
    });

    it('should handle concurrent requests with unique constraints', async () => {
      // Prepare test data with guaranteed unique values
      const concurrentRequests = 3;
      const userDataArray = Array.from({ length: concurrentRequests }, (_, index) => {
        const timestamp = Date.now() + index;
        return {
          username: `uniqueuser${timestamp}`,
          password: 'P@ssw0rd123',
          last_name: 'lastname',
          first_name: 'firstname',
          email: `unique${timestamp}@jesttest.dev`,
          mobile_phone_number: `+9876543211${index}`,
          gender: 'm',
          address: '',
          company_name: '',
          position: '',
          middle_name: '',
          is_staff: false,
          account_status: AccountStatus.ACTIVE
        } as CreateUserRequest;
      });

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      // Create concurrent requests
      const startTime = Date.now();
      const results = await Promise.all(userDataArray.map(userData =>
        createUser(userData, mockRequest as Request)
      ));
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(concurrentRequests * 7);
      
      // Performance assertion
      expect(totalTime).toBeLessThan(concurrentRequests * 150);
    });
  });

  describe('Load Testing', () => {
    it('should handle high load of sequential user creation requests', async () => {
      // Prepare test data
      const requestCount = 20;
      const userDataArray = Array.from({ length: requestCount }, () => generateTestData());

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      // Execute sequential requests
      const startTime = Date.now();
      const results = [];
      
      for (let i = 0; i < requestCount; i++) {
        const result = await createUser(userDataArray[i], mockRequest as Request);
        results.push(result);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database calls
      expect(mockClient.query).toHaveBeenCalledTimes(requestCount * 7);
      
      // Performance assertion - should handle load efficiently
      expect(totalTime).toBeLessThan(requestCount * 50); // 50ms per request max
    });

    it('should maintain consistent performance under sustained load', async () => {
      // Prepare test data
      const batchSize = 5;
      const batchCount = 4;

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      const batchTimes: number[] = [];

      // Execute multiple batches
      for (let batch = 0; batch < batchCount; batch++) {
        const batchStartTime = Date.now();
        
        const batchPromises = Array.from({ length: batchSize }, () => {
          const userData = generateTestData();
          return createUser(userData, mockRequest as Request);
        });
        
        await Promise.all(batchPromises);
        
        const batchEndTime = Date.now();
        batchTimes.push(batchEndTime - batchStartTime);
      }

      // Verify all batches completed successfully
      expect(mockClient.query).toHaveBeenCalledTimes(batchCount * batchSize * 7);
      
      // Performance assertion - each batch should complete within reasonable time
      batchTimes.forEach(time => {
        expect(time).toBeLessThan(batchSize * 100); // 100ms per request max
      });
    });
  });

  describe('Database Connection Pool Tests', () => {
    it('should handle database connection pool exhaustion gracefully', async () => {
      // Prepare test data
      const userData = generateTestData();
      const concurrentRequests = 10;

      // Setup database pool mock to simulate connection delays
      let connectionCount = 0;
      (pool.connect as jest.Mock).mockImplementation(() => {
        connectionCount++;
        return new Promise(resolve => {
          // Simulate connection pool delay when many connections are active
          const delay = connectionCount > 5 ? 100 : 10;
          setTimeout(() => {
            resolve(mockClient);
          }, delay);
        });
      });

      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      // Create concurrent requests to test connection pool
      const promises = Array.from({ length: concurrentRequests }, () =>
        createUser(userData, mockRequest as Request)
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
      expect(pool.connect).toHaveBeenCalledTimes(concurrentRequests);
      expect(mockClient.release).toHaveBeenCalledTimes(concurrentRequests);
      
      // Performance assertion - should handle connection pool delays
      expect(totalTime).toBeLessThan(concurrentRequests * 200);
    });

    it('should release database connections properly under load', async () => {
      // Prepare test data
      const userData = generateTestData();
      const requestCount = 15;

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      // Execute multiple requests
      const promises = Array.from({ length: requestCount }, () =>
        createUser(userData, mockRequest as Request)
      );

      await Promise.all(promises);

      // Verify all connections were released
      expect(pool.connect).toHaveBeenCalledTimes(requestCount);
      expect(mockClient.release).toHaveBeenCalledTimes(requestCount);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated user creation operations', async () => {
      // Prepare test data
      const iterations = 30;

      // Setup database mocks
      mockClient.query
        .mockResolvedValue({ rows: [{ user_id: 'test-user-id' }], rowCount: 1 });

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute repeated operations
      for (let i = 0; i < iterations; i++) {
        const userData = generateTestData();
        await createUser(userData, mockRequest as Request);
      }

      // Get final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Verify operations completed
      expect(mockClient.query).toHaveBeenCalledTimes(iterations * 7);
      
      // Memory assertion - should not increase significantly
      // Allow for some increase due to Jest mocks and test data
      expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024); // 15MB max increase
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors quickly', async () => {
      // Prepare invalid test data
      const invalidUserData = {
        username: '', // Invalid empty username
        password: 'weak', // Invalid weak password
        last_name: 'lastname',
        first_name: 'firstname',
        email: 'invalid-email', // Invalid email
        mobile_phone_number: '+98765432111',
        gender: 'm',
        address: '',
        company_name: '',
        position: '',
        middle_name: '',
        is_staff: false,
        account_status: AccountStatus.ACTIVE
      } as CreateUserRequest;

      const startTime = Date.now();

      // Call the service and expect validation error
      await expect(createUser(invalidUserData, mockRequest as Request))
        .rejects.toMatchObject({
          code: 'REQUIRED_FIELD_ERROR'
        });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance assertion - validation errors should be fast
      expect(executionTime).toBeLessThan(50);
      
      // Verify database calls were made (validation happens after database connection)
      // The service connects to DB first, then validates
      expect(mockClient.query).toHaveBeenCalled();
    });
  });
}); 