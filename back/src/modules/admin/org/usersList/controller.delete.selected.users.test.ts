/**
 * Version: 1.0.0
 *
 * Tests for delete selected users controller
 * This backend file contains Jest tests for the users deletion controller logic. 
 * Controller should only handle HTTP request/response and delegate business logic to service.
 * Tests verify that controller can receive request, pass userIds to service, and return service response.
 *
 * File: controller.delete.selected.users.test.ts
 */

import { Request, Response } from 'express';

// Import the controller under test
import deleteSelectedUsersController from './controller.delete.selected.users';

// Mock the service
jest.mock('./service.delete.selected.users', () => ({
  usersDeleteService: {
    deleteSelectedUsers: jest.fn()
  }
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { usersDeleteService } from './service.delete.selected.users';

// Type the mock correctly
const mockUsersDeleteService = usersDeleteService as jest.Mocked<typeof usersDeleteService>;

describe('Delete Selected Users Controller', () => {
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
      body: {},
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
    it('should pass userIds from body to service and return service response', async () => {
      // Prepare test data
      const testUserIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '456e7890-e89b-12d3-a456-426614174000'
      ];

      const expectedServiceResponse = 2; // Number of deleted users

      mockRequest.body = { userIds: testUserIds };

      // Setup service mock
      mockUsersDeleteService.deleteSelectedUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct userIds
      expect(mockUsersDeleteService.deleteSelectedUsers).toHaveBeenCalledWith(testUserIds, mockRequest);
      expect(mockUsersDeleteService.deleteSelectedUsers).toHaveBeenCalledTimes(1);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const testUserIds = ['123e4567-e89b-12d3-a456-426614174000'];

      const expectedErrorResponse = {
        code: 'DATABASE_ERROR',
        message: 'Error deleting users'
      };

      mockRequest.body = { userIds: testUserIds };

      // Setup service mock to throw error
      mockUsersDeleteService.deleteSelectedUsers.mockRejectedValue(expectedErrorResponse);

      // Call the controller and expect error
      await expect(deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      )).rejects.toEqual(expectedErrorResponse);

      // Verify that service was called
      expect(mockUsersDeleteService.deleteSelectedUsers).toHaveBeenCalledWith(testUserIds, mockRequest);
    });
  });

  describe('Data passing', () => {
    it('should pass request object to service for context', async () => {
      // Prepare test data
      const testUserIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const expectedServiceResponse = 1;

      mockRequest.body = { userIds: testUserIds };

      // Setup service mock
      mockUsersDeleteService.deleteSelectedUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with request object
      expect(mockUsersDeleteService.deleteSelectedUsers).toHaveBeenCalledWith(testUserIds, mockRequest);
    });
  });
}); 