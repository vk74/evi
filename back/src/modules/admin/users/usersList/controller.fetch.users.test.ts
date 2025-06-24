/**
 * Version: 1.0.0
 *
 * Tests for fetch users controller
 * This backend file contains Jest tests for the users list fetch controller logic. 
 * Controller should only handle HTTP request/response and delegate business logic to service.
 * Tests verify that controller can receive request, pass parameters to service, and return service response.
 *
 * File: controller.fetch.users.test.ts
 */

import { Request, Response } from 'express';

// Import the controller under test
import fetchUsersController from './controller.fetch.users';

// Mock the service
jest.mock('./service.fetch.users', () => ({
  usersFetchService: {
    fetchUsers: jest.fn()
  }
}));

// Mock the connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Import the mocked service
import { usersFetchService } from './service.fetch.users';

// Type the mock correctly
const mockUsersFetchService = usersFetchService as jest.Mocked<typeof usersFetchService>;

describe('Fetch Users Controller', () => {
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
    it('should pass query parameters to service and return service response', async () => {
      // Prepare test data
      const testParams = {
        search: 'test',
        page: '1',
        itemsPerPage: '25',
        sortBy: 'username',
        sortDesc: 'false'
      };

      const expectedServiceResponse = {
        users: [
          {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            username: 'testuser',
            email: 'test@example.com',
            is_staff: true,
            account_status: 'active',
            first_name: 'Test',
            middle_name: '',
            last_name: 'User'
          }
        ],
        total: 1
      };

      mockRequest.query = testParams;

      // Setup service mock
      mockUsersFetchService.fetchUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct parameters
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledWith({
        search: 'test',
        page: 1,
        itemsPerPage: 25,
        sortBy: 'username',
        sortDesc: false
      }, mockRequest);
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledTimes(1);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle empty query parameters with defaults', async () => {
      // Empty query parameters
      mockRequest.query = {};

      const expectedServiceResponse = {
        users: [],
        total: 0
      };

      // Setup service mock
      mockUsersFetchService.fetchUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with default parameters
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledWith({
        search: '',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      }, mockRequest);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle pagination parameters correctly', async () => {
      // Pagination parameters
      const testParams = {
        page: '2',
        itemsPerPage: '50',
        sortBy: 'email',
        sortDesc: 'true'
      };

      const expectedServiceResponse = {
        users: [],
        total: 0
      };

      mockRequest.query = testParams;

      // Setup service mock
      mockUsersFetchService.fetchUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that service was called with correct pagination parameters
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledWith({
        search: '',
        page: 2,
        itemsPerPage: 50,
        sortBy: 'email',
        sortDesc: true
      }, mockRequest);

      // Verify that controller returns service response
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Prepare test data
      const testParams = {
        search: 'invalid',
        page: '1',
        itemsPerPage: '25'
      };

      const expectedErrorResponse = {
        code: 'INVALID_SEARCH',
        message: 'Search term must be at least 2 characters long'
      };

      mockRequest.query = testParams;

      // Setup service mock to throw error
      mockUsersFetchService.fetchUsers.mockRejectedValue(expectedErrorResponse);

      // Call the controller and expect error
      await expect(fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      )).rejects.toEqual(expectedErrorResponse);

      // Verify that service was called
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledWith({
        search: 'invalid',
        page: 1,
        itemsPerPage: 25,
        sortBy: '',
        sortDesc: false
      }, mockRequest);
    });
  });

  describe('Parameter validation', () => {
    it('should validate search parameter minimum length', async () => {
      // Search parameter too short
      const testParams = {
        search: 'a', // Only 1 character
        page: '1',
        itemsPerPage: '25'
      };

      const expectedErrorResponse = {
        code: 'INVALID_SEARCH',
        message: 'Search term must be at least 2 characters long'
      };

      mockRequest.query = testParams;

      // Setup service mock to throw validation error
      mockUsersFetchService.fetchUsers.mockRejectedValue(expectedErrorResponse);

      // Call the controller and expect validation error
      await expect(fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      )).rejects.toEqual(expectedErrorResponse);
    });

    it('should handle string to number conversion for pagination', async () => {
      // String parameters that need conversion
      const testParams = {
        page: '3',
        itemsPerPage: '100',
        sortDesc: 'true'
      };

      const expectedServiceResponse = {
        users: [],
        total: 0
      };

      mockRequest.query = testParams;

      // Setup service mock
      mockUsersFetchService.fetchUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that string parameters were converted to numbers/booleans
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledWith({
        search: '',
        page: 3,
        itemsPerPage: 100,
        sortBy: '',
        sortDesc: true
      }, mockRequest);

      expect(result).toEqual(expectedServiceResponse);
    });
  });

  describe('Service integration', () => {
    it('should pass request object to service for context', async () => {
      // Prepare test data
      const testParams = {
        search: 'test',
        page: '1'
      };

      const expectedServiceResponse = {
        users: [],
        total: 0
      };

      mockRequest.query = testParams;
      mockRequest.headers = { 'authorization': 'Bearer token123' };

      // Setup service mock
      mockUsersFetchService.fetchUsers.mockResolvedValue(expectedServiceResponse);

      // Call the controller
      const result = await fetchUsersController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Verify that full request object was passed to service
      expect(mockUsersFetchService.fetchUsers).toHaveBeenCalledWith(
        expect.any(Object), // parameters
        mockRequest // full request object
      );

      expect(result).toEqual(expectedServiceResponse);
    });
  });
}); 