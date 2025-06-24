/**
 * Version: 1.0.0
 *
 * Tests for delete selected users controller
 * This backend file contains Jest tests for the delete selected users controller logic. 
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
  deleteSelectedUsers: jest.fn()
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { deleteSelectedUsers } from './service.delete.selected.users';

// Type the mock correctly
const mockDeleteSelectedUsers = deleteSelectedUsers as jest.MockedFunction<typeof deleteSelectedUsers>;

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
    it('should pass userIds from body to service and return service response', async () => {
      // Prepare test data
      const testUserIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-b789-123456789abc',
        '456defab-78c9-12d3-e456-789abcdef012'
      ];

      const expectedServiceResponse = {
        deletedUserIds: testUserIds
      };

      mockRequest.body = { userIds: testUserIds };

      // Setup service mock
      mockDeleteSelectedUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct data
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: testUserIds }
      );
      expect(mockDeleteSelectedUsers).toHaveBeenCalledTimes(1);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const testUserIds = ['123e4567-e89b-12d3-a456-426614174000'];
      const expectedErrorResponse = {
        code: 'USERS_DELETE_ERROR',
        message: 'Failed to delete users',
        details: 'Database constraint violation'
      };

      mockRequest.body = { userIds: testUserIds };

      // Setup service mock to return error
      mockDeleteSelectedUsers.mockRejectedValue(expectedErrorResponse);

      // Call the controller and expect error
      await expect(deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      )).rejects.toEqual(expectedErrorResponse);

      // Verify that service was called
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: testUserIds }
      );
    });

    it('should handle empty userIds array', async () => {
      // Empty userIds array
      const testUserIds: string[] = [];
      mockRequest.body = { userIds: testUserIds };

      const expectedResponse = {
        deletedUserIds: []
      };

      // Setup service mock
      mockDeleteSelectedUsers.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with empty array
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: [] }
      );

      // Verify that controller returns service response
      expect(result).toEqual(expectedResponse);
    });

    it('should handle missing userIds in request body', async () => {
      // Missing userIds in body
      mockRequest.body = {};

      const expectedErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'User IDs are required',
        details: 'userIds field is missing'
      };

      // Setup service mock to return error
      mockDeleteSelectedUsers.mockRejectedValue(expectedErrorResponse);

      // Call the controller and expect error
      await expect(deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      )).rejects.toEqual(expectedErrorResponse);

      // Verify that service was called with undefined userIds
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: undefined }
      );
    });

    it('should handle single userId in array', async () => {
      // Single userId
      const testUserIds = ['123e4567-e89b-12d3-a456-426614174000'];
      mockRequest.body = { userIds: testUserIds };

      const expectedResponse = {
        deletedUserIds: testUserIds
      };

      // Setup service mock
      mockDeleteSelectedUsers.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with single userId
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: testUserIds }
      );

      // Verify that controller returns service response
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Service integration', () => {
    it('should pass large array of userIds to service', async () => {
      // Large array of userIds
      const testUserIds = Array.from({ length: 10 }, (_, i) => 
        `123e4567-e89b-12d3-a456-${i.toString().padStart(12, '0')}`
      );

      const expectedResponse = {
        deletedUserIds: testUserIds
      };

      mockRequest.body = { userIds: testUserIds };
      mockDeleteSelectedUsers.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that all userIds are passed to service
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: testUserIds }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle partial deletion success', async () => {
      // Some users deleted, some not found
      const requestedUserIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-b789-123456789abc',
        '456defab-78c9-12d3-e456-789abcdef012'
      ];

      const deletedUserIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '456defab-78c9-12d3-e456-789abcdef012'
      ];

      const expectedResponse = {
        deletedUserIds
      };

      mockRequest.body = { userIds: requestedUserIds };
      mockDeleteSelectedUsers.mockResolvedValue(expectedResponse);

      // Call the controller
      const result = await deleteSelectedUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with all requested userIds
      expect(mockDeleteSelectedUsers).toHaveBeenCalledWith(
        mockRequest,
        { userIds: requestedUserIds }
      );

      // Verify that controller returns partial success response
      expect(result).toEqual(expectedResponse);
      expect(result.deletedUserIds).toHaveLength(2);
    });
  });
}); 