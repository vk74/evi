/**
 * Version: 1.0.0
 *
 * Tests for users list controller
 * This backend file contains Jest tests for the users list controller logic. 
 * Controller should only handle HTTP request/response and delegate business logic to service.
 * Tests verify that controller can receive request, call service, and format response for frontend.
 *
 * File: controller.users.list.test.ts
 */

import { Request, Response } from 'express';

// Import the controller under test
import usersListController from './controller.users.list';

// Mock the service
jest.mock('./service.users.list', () => ({
  getAllUsers: jest.fn()
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { getAllUsers } from './service.users.list';
import type { IUsersResponse } from './types.users.list';

// Type the mock correctly
const mockGetAllUsers = getAllUsers as jest.MockedFunction<typeof getAllUsers>;

describe('Users List Controller', () => {
  // Create mocks for request and response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    // Setup mocks before each test
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      query: {},
      headers: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Request handling', () => {
    it('should call service and format response for frontend', async () => {
      // Prepare test data
      const mockUsers = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          account_status: 'active',
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
          account_status: 'active',
          first_name: 'John',
          middle_name: 'Doe',
          last_name: 'Smith',
          created_at: '2024-01-02T00:00:00.000Z'
        }
      ];

      const serviceResponse: IUsersResponse = {
        users: mockUsers,
        total: 2
      };

      const expectedFormattedResponse = {
        items: mockUsers,
        total: 2
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      const result = await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called
      expect(mockGetAllUsers).toHaveBeenCalledWith(mockRequest);
      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);

      // Verify that controller returns formatted response
      expect(result).toEqual(expectedFormattedResponse);
    });

    it('should handle empty users list', async () => {
      // Prepare test data - empty list
      const serviceResponse: IUsersResponse = {
        users: [],
        total: 0
      };

      const expectedFormattedResponse = {
        items: [],
        total: 0
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      const result = await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called
      expect(mockGetAllUsers).toHaveBeenCalledWith(mockRequest);

      // Verify that controller returns formatted response
      expect(result).toEqual(expectedFormattedResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const expectedErrorResponse = {
        code: 'USERS_FETCH_ERROR',
        message: 'Failed to fetch users list',
        details: 'Database connection failed'
      };

      // Setup service mock to return error
      mockGetAllUsers.mockRejectedValue(expectedErrorResponse);

      // Call the controller and expect error
      await expect(usersListController(
        mockRequest as Request, 
        mockResponse as Response
      )).rejects.toEqual(expectedErrorResponse);

      // Verify that service was called
      expect(mockGetAllUsers).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle large users list', async () => {
      // Prepare test data - large list
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        user_id: `123e4567-e89b-12d3-a456-${i.toString().padStart(12, '0')}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        is_staff: i === 0, // First user is admin
        account_status: 'active',
        first_name: `User${i}`,
        middle_name: null,
        last_name: `Last${i}`,
        created_at: '2024-01-01T00:00:00.000Z'
      }));

      const serviceResponse: IUsersResponse = {
        users: mockUsers,
        total: 100
      };

      const expectedFormattedResponse = {
        items: mockUsers,
        total: 100
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      const result = await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called
      expect(mockGetAllUsers).toHaveBeenCalledWith(mockRequest);

      // Verify that controller returns formatted response
      expect(result).toEqual(expectedFormattedResponse);
      expect(result.items).toHaveLength(100);
      expect(result.total).toBe(100);
    });
  });

  describe('Response formatting', () => {
    it('should format response with items and total properties', async () => {
      // Prepare test data
      const mockUsers = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          email: 'test@example.com',
          is_staff: false,
          account_status: 'active',
          first_name: 'Test',
          middle_name: null,
          last_name: 'User',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      const serviceResponse: IUsersResponse = {
        users: mockUsers,
        total: 1
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      const result = await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify response structure
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should preserve all user properties in items array', async () => {
      // Prepare test data with all user properties
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'completeuser',
        email: 'complete@example.com',
        is_staff: true,
        account_status: 'active',
        first_name: 'Complete',
        middle_name: 'Middle',
        last_name: 'User',
        created_at: '2024-01-01T00:00:00.000Z'
      };

      const serviceResponse: IUsersResponse = {
        users: [mockUser],
        total: 1
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      const result = await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that all user properties are preserved
      expect(result.items[0]).toEqual(mockUser);
      expect(result.items[0]).toHaveProperty('user_id');
      expect(result.items[0]).toHaveProperty('username');
      expect(result.items[0]).toHaveProperty('email');
      expect(result.items[0]).toHaveProperty('is_staff');
      expect(result.items[0]).toHaveProperty('account_status');
      expect(result.items[0]).toHaveProperty('first_name');
      expect(result.items[0]).toHaveProperty('middle_name');
      expect(result.items[0]).toHaveProperty('last_name');
      expect(result.items[0]).toHaveProperty('created_at');
    });
  });

  describe('Service integration', () => {
    it('should pass request object to service', async () => {
      // Prepare test data
      const serviceResponse: IUsersResponse = {
        users: [],
        total: 0
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that request object is passed to service
      expect(mockGetAllUsers).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle service response with null/undefined values', async () => {
      // Prepare test data with null/undefined values
      const mockUsers = [
        {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'nulluser',
          email: null,
          is_staff: false,
          account_status: 'active',
          first_name: null,
          middle_name: null,
          last_name: '',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      const serviceResponse: IUsersResponse = {
        users: mockUsers,
        total: 1
      };

      // Setup service mock
      mockGetAllUsers.mockResolvedValue(serviceResponse);

      // Call the controller
      const result = await usersListController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that null/undefined values are handled
      expect(result.items[0]).toEqual(mockUsers[0]);
      expect(result.items[0].email).toBeNull();
      expect(result.items[0].first_name).toBeNull();
      expect(result.items[0].middle_name).toBeNull();
    });
  });
}); 