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

// Импортируем тестируемый контроллер
import createUserController from './controller.create.user';

// Мокируем сервис
jest.mock('./service.create.user', () => ({
  createUser: jest.fn()
}));

// Мокируем connection handler
jest.mock('../../../../core/helpers/connection.handler', () => ({
  connectionHandler: jest.fn((logic) => logic)
}));

// Импортируем мок сервиса
import { createUser } from './service.create.user';

// Типизируем мок правильно
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

describe('Create User Controller', () => {
  // Создаем моки для request и response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    // Настраиваем моки перед каждым тестом
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Очищаем моки
    jest.clearAllMocks();
  });

  describe('Request handling', () => {
    it('should pass request body to service and return service response', async () => {
      // Подготавливаем тестовые данные
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

      // Настраиваем мок сервиса
      mockCreateUser.mockResolvedValue(expectedServiceResponse);

      // Вызываем контроллер
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Проверяем что сервис был вызван с правильными данными
      expect(mockCreateUser).toHaveBeenCalledWith(testUserData, mockRequest);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);

      // Проверяем что контроллер возвращает ответ сервиса
      expect(result).toEqual(expectedServiceResponse);
    });

    it('should handle service errors and return error response', async () => {
      // Подготавливаем тестовые данные
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

      // Настраиваем мок сервиса для возврата ошибки
      mockCreateUser.mockResolvedValue(expectedErrorResponse);

      // Вызываем контроллер
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Проверяем что сервис был вызван
      expect(mockCreateUser).toHaveBeenCalledWith(testUserData, mockRequest);

      // Проверяем что контроллер возвращает ошибку сервиса
      expect(result).toEqual(expectedErrorResponse);
    });

    it('should handle empty request body', async () => {
      // Пустое тело запроса
      mockRequest.body = {};

      const expectedErrorResponse = {
        success: false,
        message: 'validation failed',
        userId: '',
        username: '',
        email: ''
      };

      // Настраиваем мок сервиса для возврата ошибки валидации
      mockCreateUser.mockResolvedValue(expectedErrorResponse);

      // Вызываем контроллер
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Проверяем что сервис был вызван с пустым объектом
      expect(mockCreateUser).toHaveBeenCalledWith({}, mockRequest);

      // Проверяем что контроллер возвращает ошибку валидации
      expect(result).toEqual(expectedErrorResponse);
    });
  });

  describe('Service integration', () => {
    it('should pass complete user data to service', async () => {
      // Полные данные пользователя
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

      // Вызываем контроллер
      const result = await createUserController(
        mockRequest as Request, 
        mockResponse as Response
      );

      // Проверяем что все данные переданы в сервис
      expect(mockCreateUser).toHaveBeenCalledWith(completeUserData, mockRequest);
      expect(result).toEqual(expectedResponse);
    });
  });
}); 