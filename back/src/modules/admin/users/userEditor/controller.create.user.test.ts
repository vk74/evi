/**
 * Version: 1.0.1
 *
 * Tests for create user controller
 * This backend file contains Jest tests for the user creation controller logic. 
 * Controller should only handle HTTP request/response and delegate business logic to service.
 * Tests verify that controller can receive request, pass it to service, and return service response.
 *
 * File: controller.create.user.test.ts
 */

import { Request, Response } from 'express';

// Import the controller under test
import createUserController from './controller.create.user';

// Mock the service
jest.mock('./service.create.user', () => ({
  createUser: jest.fn()
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { createUser } from './service.create.user';

// Type the mock correctly
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

describe('Create User Controller', () => {
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
      body: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Request handling', () => {
    it('should pass request body to service and return service response', async () => {
      // Prepare test data
      const testUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const expectedServiceResponse = {
        success: true,
        message: 'User account created successfully',
        userId: '123',
        username: 'testuser',
        email: 'test@example.com'
      };

      mockRequest.body = testUserData;

      // Setup service mock
      mockCreateUser.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct data
      expect(mockCreateUser).toHaveBeenCalledWith(testUserData, mockRequest);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const testUserData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const expectedErrorResponse = {
        success: false,
        message: 'validation failed',
        userId: '',
        username: '',
        email: ''
      };

      mockRequest.body = testUserData;

      // Setup service mock to return error
      mockCreateUser.mockResolvedValue(expectedErrorResponse);

      // Call the controller
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called
      expect(mockCreateUser).toHaveBeenCalledWith(testUserData, mockRequest);

      // Verify that controller returns service error
      expect(result).toEqual(expectedErrorResponse);
    });

    it('should handle empty request body', async () => {
      // Empty request body
      mockRequest.body = {};

      const expectedErrorResponse = {
        success: false,
        message: 'validation failed',
        userId: '',
        username: '',
        email: ''
      };

      // Setup service mock to return validation error
      mockCreateUser.mockResolvedValue(expectedErrorResponse);

      // Call the controller
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with empty object
      expect(mockCreateUser).toHaveBeenCalledWith({}, mockRequest);

      // Verify that controller returns validation error
      expect(result).toEqual(expectedErrorResponse);
    });
  });

  describe('Service integration', () => {
    it('should pass complete user data to service', async () => {
      // Complete user data
      const completeUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        middle_name: 'Middle',
        mobile_phone_number: '+1234567890',
        gender: 'male',
        account_status: 'active',
        is_staff: true
      };

      const expectedResponse = {
        success: true,
        message: 'User account created successfully',
        userId: '123',
        username: 'testuser',
        email: 'test@example.com'
      };

      mockRequest.body = completeUserData;
      mockCreateUser.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that all data is passed to service
      expect(mockCreateUser).toHaveBeenCalledWith(completeUserData, mockRequest);
      expect(result).toEqual(expectedResponse);
    });
  });
}); 