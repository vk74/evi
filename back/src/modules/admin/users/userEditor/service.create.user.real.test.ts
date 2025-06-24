/**
 * Version: 1.0.0
 *
 * Real database tests for create user service
 * This backend file contains Jest tests for the user creation service using real database.
 * Tests create actual users in the database and verify the complete creation process.
 * Uses real database operations instead of mocks.
 *
 * File: service.create.user.real.test.ts
 */

import { Request } from 'express';
import { createUser } from './service.create.user';
import { deleteSelectedUsers } from '../usersList/service.delete.selected.users';
import type { CreateUserRequest } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

describe('Create User Service - Real Database Tests', () => {
  let mockRequest: Partial<Request>;
  let createdUserId: string;

  // Test data - using the specified values
  const testUserData: CreateUserRequest = {
    username: 'jest',
    password: 'P@ssw0rd',
    last_name: 'TestUser',
    first_name: 'Jest',
    email: 'testjest@testjest.dev',
    mobile_phone_number: '+1234567890',
    gender: 'm',
    address: 'Test Address',
    company_name: 'Test Company',
    position: 'Test Position',
    middle_name: 'Test',
    is_staff: false,
    account_status: AccountStatus.ACTIVE
  };

  beforeEach(() => {
    // Setup request mock
    mockRequest = {
      headers: {
        'x-requestor-uuid': 'test-integration-uuid'
      },
      body: {}
    };

    // Reset created user ID
    createdUserId = '';
  });

  afterEach(async () => {
    // Cleanup: delete test user if it was created
    if (createdUserId) {
      try {
        await deleteSelectedUsers({ user_ids: [createdUserId] }, mockRequest as Request);
      } catch (error) {
        // Ignore cleanup errors
        console.log('Cleanup warning:', error);
      }
    }
  });

  it('should create user successfully with real database', async () => {
    console.log('Testing real user creation...');

    // Create user
    const result = await createUser(testUserData, mockRequest as Request);
    
    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
    expect(result.username).toBe(testUserData.username);
    expect(result.email).toBe(testUserData.email);
    
    createdUserId = result.userId!;
    console.log(`User created with ID: ${createdUserId}`);

    // Verify user was actually created in database
    // This will be tested in the load user test
  }, 15000);

  it('should fail to create duplicate user', async () => {
    console.log('Testing duplicate user creation...');

    // First, create a user
    const firstResult = await createUser(testUserData, mockRequest as Request);
    expect(firstResult.success).toBe(true);
    createdUserId = firstResult.userId!;

    // Try to create the same user again
    const duplicateResult = await createUser(testUserData, mockRequest as Request);
    
    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.error).toBeDefined();
    expect(duplicateResult.error?.code).toBe('UNIQUE_CONSTRAINT_ERROR');
    console.log('Duplicate creation correctly failed');
  }, 15000);

  it('should handle validation errors with real database', async () => {
    console.log('Testing validation errors...');

    // Test invalid email
    const invalidEmailData: CreateUserRequest = {
      ...testUserData,
      email: 'invalid-email-format'
    };

    await expect(createUser(invalidEmailData, mockRequest as Request))
      .rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        field: 'email'
      });

    // Test invalid username
    const invalidUsernameData: CreateUserRequest = {
      ...testUserData,
      username: 'a' // Too short
    };

    await expect(createUser(invalidUsernameData, mockRequest as Request))
      .rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        field: 'username'
      });

    // Test invalid password
    const invalidPasswordData: CreateUserRequest = {
      ...testUserData,
      password: 'weak' // Too weak
    };

    await expect(createUser(invalidPasswordData, mockRequest as Request))
      .rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        field: 'password'
      });

    console.log('Validation errors handled correctly');
  }, 15000);
}); 