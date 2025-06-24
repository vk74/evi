/**
 * Version: 1.0.0
 *
 * Tests for create user service
 * This backend file contains Jest tests for the user creation service logic. It covers validation, error handling, database interaction, password hashing, and event publishing for user creation. All external dependencies (database, event bus, helpers, bcrypt) are mocked. The file works with CreateUserRequest objects and simulates service behavior in isolation.
 *
 * File: service.create.user.test.ts
 */

import { Request } from 'express';
import bcrypt from 'bcrypt';
import { createUser } from './service.create.user';
import type { CreateUserRequest } from './types.user.editor';
import { AccountStatus, Gender } from './types.user.editor';

// Мокируем все внешние зависимости
jest.mock('../../../../core/db/maindb', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn()
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

// Импортируем мокированные модули
import { pool } from '../../../../core/db/maindb';
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

describe('Create User Service', () => {
  // Моки для тестирования
  let mockClient: any;
  let mockRequest: Partial<Request>;
  let mockUserData: CreateUserRequest;

  // Генерируем уникальные данные для теста
  const generateTestData = (): CreateUserRequest => {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    return {
      username: `test${timestamp}`,
      password: 'P@ssw0rd',
      last_name: 'lastname',
      first_name: 'firstname',
      email: `${timestamp}@jesttest.dev`,
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
    // Очищаем все моки перед каждым тестом
    jest.clearAllMocks();

    // Настраиваем мок клиента БД
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Настраиваем мок пула БД
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    // Настраиваем мок request
    mockRequest = {
      headers: {},
      body: {}
    };

    // Настраиваем мок UUID запрашивающего
    (getRequestorUuidFromReq as jest.Mock).mockReturnValue('test-requestor-uuid');

    // Настраиваем мок bcrypt
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123');

    // Настраиваем мок событий
    (createAndPublishEvent as jest.Mock).mockResolvedValue(undefined);

    // Генерируем тестовые данные
    mockUserData = generateTestData();
  });

  describe('Validation errors', () => {
    it('should throw error when username is missing', async () => {
      const invalidData: Partial<CreateUserRequest> = { ...mockUserData };
      delete invalidData.username;

      await expect(createUser(invalidData as CreateUserRequest, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'REQUIRED_FIELD_ERROR',
          message: expect.stringContaining('Username')
        });
    });

    it('should throw error when email is missing', async () => {
      const invalidData: Partial<CreateUserRequest> = { ...mockUserData };
      delete invalidData.email;

      await expect(createUser(invalidData as CreateUserRequest, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'REQUIRED_FIELD_ERROR',
          message: expect.stringContaining('Email')
        });
    });

    it('should throw error when password is missing', async () => {
      const invalidData: Partial<CreateUserRequest> = { ...mockUserData };
      delete invalidData.password;

      await expect(createUser(invalidData as CreateUserRequest, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'REQUIRED_FIELD_ERROR',
          message: expect.stringContaining('Password')
        });
    });

    it('should throw error when first_name is missing', async () => {
      const invalidData: Partial<CreateUserRequest> = { ...mockUserData };
      delete invalidData.first_name;

      await expect(createUser(invalidData as CreateUserRequest, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'REQUIRED_FIELD_ERROR',
          message: expect.stringContaining('First name')
        });
    });

    it('should throw error when last_name is missing', async () => {
      const invalidData: Partial<CreateUserRequest> = { ...mockUserData };
      delete invalidData.last_name;

      await expect(createUser(invalidData as CreateUserRequest, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'REQUIRED_FIELD_ERROR',
          message: expect.stringContaining('Last name')
        });
    });

    it('should throw error when username is too short', async () => {
      const invalidData = { ...mockUserData, username: 'ab' };

      await expect(createUser(invalidData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'VALIDATION_ERROR',
          field: 'username'
        });
    });

    it('should throw error when password is too weak', async () => {
      const invalidData = { ...mockUserData, password: 'weak' };

      await expect(createUser(invalidData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'VALIDATION_ERROR',
          field: 'password'
        });
    });

    it('should throw error when email is invalid', async () => {
      const invalidData = { ...mockUserData, email: 'invalid-email' };

      await expect(createUser(invalidData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'VALIDATION_ERROR',
          field: 'email'
        });
    });

    it('should throw error when phone number is invalid', async () => {
      const invalidData = { ...mockUserData, mobile_phone_number: 'invalid-phone' };

      await expect(createUser(invalidData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'VALIDATION_ERROR',
          field: 'mobile_phone_number'
        });
    });
  });

  describe('Data preparation', () => {
    it('should trim whitespace from input data', async () => {
      const dataWithWhitespace: CreateUserRequest = {
        ...mockUserData,
        username: '  testuser  ',
        email: '  test@example.com  ',
        mobile_phone_number: '  +1234567890  '
      };

      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await createUser(dataWithWhitespace, mockRequest as Request);

      expect(result.success).toBe(true);

      // Проверяем, что данные были обрезаны
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO app.users'),
        [
          'testuser', // обрезанный username
          'hashed_password_123',
          'test@example.com', // обрезанный email
          mockUserData.first_name,
          mockUserData.last_name,
          null, // middle_name
          false, // is_staff
          'active' // account_status
        ]
      );
    });
  });

  describe('Optional fields handling', () => {
    it('should handle user creation without optional fields', async () => {
      const minimalData: CreateUserRequest = {
        username: mockUserData.username,
        password: mockUserData.password,
        email: mockUserData.email,
        first_name: mockUserData.first_name,
        last_name: mockUserData.last_name
        // Без mobile_phone_number и других опциональных полей
      };

      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await createUser(minimalData, mockRequest as Request);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('test-user-uuid');
    });

    it('should handle user creation with all optional fields', async () => {
      const fullData: CreateUserRequest = {
        ...mockUserData,
        middle_name: 'middlename',
        is_staff: true,
        account_status: AccountStatus.ACTIVE,
        gender: Gender.MALE,
        address: 'Test Address',
        company_name: 'Test Company',
        position: 'Developer'
      };

      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await createUser(fullData, mockRequest as Request);

      expect(result.success).toBe(true);

      // Проверяем, что все опциональные поля были переданы
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO app.users'),
        [
          fullData.username,
          'hashed_password_123',
          fullData.email,
          fullData.first_name,
          fullData.last_name,
          fullData.middle_name,
          fullData.is_staff,
          fullData.account_status
        ]
      );
    });
  });

  describe('Password hashing', () => {
    it('should hash password with bcrypt', async () => {
      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      await createUser(mockUserData, mockRequest as Request);

      // Проверяем, что хэширование пароля было вызвано
      expect(bcrypt.hash).toHaveBeenCalledWith('P@ssw0rd', 10);
    });
  });

  describe('Event publishing', () => {
    it('should publish validation passed event on successful validation', async () => {
      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      await createUser(mockUserData, mockRequest as Request);

      // Проверяем, что событие валидации было отправлено (событие генерируется в коде, не в тесте)
      expect(createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: expect.stringContaining('validation.passed'),
        payload: {
          username: mockUserData.username,
          email: mockUserData.email
        }
      });
    });

    it('should publish validation failed event on validation error', async () => {
      const invalidData = { ...mockUserData, username: 'ab' }; // слишком короткий username

      await expect(createUser(invalidData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'VALIDATION_ERROR'
        });

      // Проверяем, что событие валидации было отправлено (событие генерируется в коде, не в тесте)
      expect(createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: expect.stringContaining('validation.failed'),
        payload: {
          field: 'username',
          message: expect.any(String)
        },
        errorData: expect.any(String)
      });
    });

    it('should publish completion event on successful user creation', async () => {
      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      await createUser(mockUserData, mockRequest as Request);

      // Проверяем, что событие завершения создания пользователя было отправлено
      expect(createAndPublishEvent).toHaveBeenCalledWith({
        req: mockRequest,
        eventName: expect.stringContaining('complete'),
        payload: {
          userId: 'test-user-uuid',
          username: mockUserData.username,
          email: mockUserData.email
        }
      });
    });

    it('should publish failed event on database error', async () => {
      // Настраиваем моки для успешной валидации, но неудачного создания
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // checkUsername
        .mockResolvedValueOnce({ rows: [] }) // checkEmail
        .mockResolvedValueOnce({ rows: [] }) // checkPhone
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database connection failed')); // insertUser

      await expect(createUser(mockUserData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user account'
        });

      // Проверяем, что событие ошибки было отправлено (последний вызов)
      const lastCall = (createAndPublishEvent as jest.Mock).mock.calls.slice(-1)[0];
      expect(lastCall[0]).toMatchObject({
        req: mockRequest,
        eventName: expect.stringContaining('failed'),
        payload: {
          username: mockUserData.username,
          error: {
            code: 'INTERNAL_SERVER_ERROR'
          }
        },
        errorData: expect.any(String)
      });
    });
  });

  describe('Database transaction handling', () => {
    it('should rollback transaction on database error', async () => {
      // Настраиваем моки для успешной валидации, но неудачного создания
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // checkUsername
        .mockResolvedValueOnce({ rows: [] }) // checkEmail
        .mockResolvedValueOnce({ rows: [] }) // checkPhone (так как mobile_phone_number есть в mockUserData)
        .mockResolvedValueOnce({ rows: [] })    // BEGIN
        .mockRejectedValueOnce(new Error('Database connection failed')); // insertUser

      await expect(createUser(mockUserData, mockRequest as Request))
        .rejects
        .toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user account'
        });

      // Проверяем, что был выполнен rollback
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should release database client after operation', async () => {
      // Умный мок для всех вызовов query
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('INSERT INTO app.users')) {
          return Promise.resolve({ rows: [{ user_id: 'test-user-uuid' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      await createUser(mockUserData, mockRequest as Request);

      // Проверяем, что клиент был освобожден
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 