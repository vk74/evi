/**
 * Version: 1.0.0
 *
 * Tests for load user controller
 * This backend file contains Jest tests for the user loading controller logic. 
 * Controller should only handle HTTP request/response and delegate business logic to service.
 * Tests verify that controller can receive request, pass userId to service, and return service response.
 *
 * File: controller.load.user.test.ts
 */

import { Request, Response } from 'express';

// Import the controller under test
import loadUserController from './controller.load.user';

// Mock the service
jest.mock('./service.load.user', () => ({
  loadUserById: jest.fn()
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { loadUserById } from './service.load.user';

// Type the mock correctly
const mockLoadUserById = loadUserById as jest.MockedFunction<typeof loadUserById>;

describe('Load User Controller', () => {
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
      params: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Request handling', () => {
    it('should pass userId from params to service and return service response', async () => {
      // Prepare test data
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';

      const expectedServiceResponse = {
        success: true,
        message: 'User data loaded successfully',
        data: {
          user: {
            user_id: testUserId,
            username: 'testuser',
            email: 'test@example.com',
            hashed_password: 'hashed_password',
            is_staff: true,
            account_status: 'active',
            first_name: 'Test',
            middle_name: null,
            last_name: 'User',
            created_at: new Date()
          },
          profile: {
            profile_id: '456e7890-e89b-12d3-a456-426614174000',
            user_id: testUserId,
            mobile_phone_number: '+1234567890',
            gender: 'm'
          }
        }
      };

      mockRequest.params = { userId: testUserId };

      // Setup service mock
      mockLoadUserById.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await loadUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct data
      expect(mockLoadUserById).toHaveBeenCalledWith(testUserId, mockRequest);
      expect(mockLoadUserById).toHaveBeenCalledTimes(1);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';

      const expectedErrorResponse = {
        success: false,
        message: 'User not found',
        data: null
      };

      mockRequest.params = { userId: testUserId };

      // Setup service mock to return error
      mockLoadUserById.mockResolvedValue(expectedErrorResponse);

      // Call the controller
      const result = await loadUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called
      expect(mockLoadUserById).toHaveBeenCalledWith(testUserId, mockRequest);

      // Verify that controller returns service error
      expect(result).toEqual(expectedErrorResponse);
    });

    it('should handle missing userId parameter', async () => {
      // Empty userId parameter
      mockRequest.params = {};

      const expectedErrorResponse = {
        success: false,
        message: 'User ID is required',
        data: null
      };

      // Setup service mock to return error
      mockLoadUserById.mockResolvedValue(expectedErrorResponse);

      // Call the controller
      const result = await loadUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with undefined
      expect(mockLoadUserById).toHaveBeenCalledWith(undefined, mockRequest);

      // Verify that controller returns error
      expect(result).toEqual(expectedErrorResponse);
    });
  });

  describe('Service integration', () => {
    it('should pass valid UUID to service', async () => {
      // Valid UUID
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';

      const expectedResponse = {
        success: true,
        message: 'User data loaded successfully',
        data: {
          user: {
            user_id: validUserId,
            username: 'adminuser',
            email: 'admin@example.com',
            hashed_password: 'hashed_password',
            is_staff: true,
            account_status: 'active',
            first_name: 'Admin',
            middle_name: null,
            last_name: 'User',
            created_at: new Date()
          },
          profile: {
            profile_id: '660e8400-e29b-41d4-a716-446655440000',
            user_id: validUserId,
            mobile_phone_number: null,
            gender: null
          }
        }
      };

      mockRequest.params = { userId: validUserId };
      mockLoadUserById.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await loadUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that valid UUID is passed to service
      expect(mockLoadUserById).toHaveBeenCalledWith(validUserId, mockRequest);
      expect(result).toEqual(expectedResponse);
    });
  });
}); 