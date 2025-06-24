/**
 * Version: 1.0.0
 *
 * Tests for update user controller
 * This backend file contains Jest tests for the user update controller logic. 
 * Controller should only handle HTTP request/response and delegate business logic to service.
 * Tests verify that controller can receive request, pass userId and update data to service, and return service response.
 *
 * File: controller.update.user.test.ts
 */

import { Request, Response } from 'express';

// Import the controller under test
import updateUserController from './controller.update.user';

// Mock the service
jest.mock('./service.update.user', () => ({
  updateUserById: jest.fn()
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { updateUserById } from './service.update.user';

// Type the mock correctly
const mockUpdateUserById = updateUserById as jest.MockedFunction<typeof updateUserById>;

describe('Update User Controller', () => {
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
      params: {},
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
    it('should pass userId from params and update data to service and return service response', async () => {
      // Prepare test data
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      const testUpdateData = {
        username: 'updateduser',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User'
      };

      const expectedServiceResponse = {
        success: true,
        message: 'User data updated successfully'
      };

      mockRequest.params = { userId: testUserId };
      mockRequest.body = testUpdateData;

      // Setup service mock
      mockUpdateUserById.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await updateUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct data (userId added to body)
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        { ...testUpdateData, user_id: testUserId }, 
        mockRequest
      );
      expect(mockUpdateUserById).toHaveBeenCalledTimes(1);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      const testUpdateData = {
        username: 'nonexistentuser'
      };

      const expectedErrorResponse = {
        success: false,
        message: 'User not found'
      };

      mockRequest.params = { userId: testUserId };
      mockRequest.body = testUpdateData;

      // Setup service mock to return error
      mockUpdateUserById.mockResolvedValue(expectedErrorResponse);

      // Call the controller
      const result = await updateUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        { ...testUpdateData, user_id: testUserId }, 
        mockRequest
      );

      // Verify that controller returns service error
      expect(result).toEqual(expectedErrorResponse);
    });

    it('should handle missing userId parameter', async () => {
      // Empty userId parameter
      mockRequest.params = {};
      mockRequest.body = { username: 'testuser' };

      const expectedErrorResponse = {
        success: false,
        message: 'User ID is required'
      };

      // Setup service mock to return error
      mockUpdateUserById.mockResolvedValue(expectedErrorResponse);

      // Call the controller
      const result = await updateUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with undefined userId
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        { username: 'testuser', user_id: undefined }, 
        mockRequest
      );

      // Verify that controller returns error
      expect(result).toEqual(expectedErrorResponse);
    });

    it('should handle empty update data', async () => {
      // Empty update data
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { userId: testUserId };
      mockRequest.body = {};

      const expectedResponse = {
        success: true,
        message: 'User data updated successfully'
      };

      // Setup service mock
      mockUpdateUserById.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await updateUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with only userId
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        { user_id: testUserId }, 
        mockRequest
      );

      // Verify that controller returns success response
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Service integration', () => {
    it('should pass complete update data to service', async () => {
      // Complete update data
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      const completeUpdateData = {
        username: 'adminuser',
        email: 'admin@example.com',
        is_staff: true,
        account_status: 'active',
        first_name: 'Admin',
        middle_name: 'Middle',
        last_name: 'User',
        mobile_phone_number: '+1234567890',
        address: '123 Main St',
        company_name: 'Tech Corp',
        position: 'Manager',
        gender: 'm'
      };

      const expectedResponse = {
        success: true,
        message: 'User data updated successfully'
      };

      mockRequest.params = { userId: testUserId };
      mockRequest.body = completeUpdateData;
      mockUpdateUserById.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await updateUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that all update data is passed to service
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        { ...completeUpdateData, user_id: testUserId }, 
        mockRequest
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle partial update data', async () => {
      // Partial update data - only some fields
      const testUserId = '123e4567-e89b-12d3-a456-426614174000';
      const partialUpdateData = {
        email: 'newemail@example.com',
        mobile_phone_number: '+9876543210'
      };

      const expectedResponse = {
        success: true,
        message: 'User data updated successfully'
      };

      mockRequest.params = { userId: testUserId };
      mockRequest.body = partialUpdateData;
      mockUpdateUserById.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await updateUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that partial update data is passed to service
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        { ...partialUpdateData, user_id: testUserId }, 
        mockRequest
      );
      expect(result).toEqual(expectedResponse);
    });
  });
}); 