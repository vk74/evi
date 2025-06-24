/**
 * Version: 1.0.0
 *
 * Real database tests for load user service
 * This backend file contains Jest tests for the user loading service using real database.
 * Tests load actual users from the database and verify the complete loading process.
 * Uses real database operations instead of mocks.
 *
 * File: service.load.user.real.test.ts
 */

import { Request } from 'express';
import { loadUserById } from './service.load.user';
import { createUser } from './service.create.user';
import { deleteSelectedUsers } from '../usersList/service.delete.selected.users';
import type { CreateUserRequest } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

describe('Load User Service - Real Database Tests', () => {
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

  it('should load user successfully with real database', async () => {
    console.log('Testing real user loading...');

    // First, create a user
    const createResult = await createUser(testUserData, mockRequest as Request);
    expect(createResult.success).toBe(true);
    createdUserId = createResult.userId!;

    // Now load the user
    const loadResult = await loadUserById(createdUserId, mockRequest as Request);
    
    expect(loadResult.success).toBe(true);
    expect(loadResult.user).toBeDefined();
    expect(loadResult.user?.user_id).toBe(createdUserId);
    expect(loadResult.user?.username).toBe(testUserData.username);
    expect(loadResult.user?.email).toBe(testUserData.email);
    expect(loadResult.user?.first_name).toBe(testUserData.first_name);
    expect(loadResult.user?.last_name).toBe(testUserData.last_name);
    expect(loadResult.user?.mobile_phone_number).toBe(testUserData.mobile_phone_number);
    expect(loadResult.user?.address).toBe(testUserData.address);
    expect(loadResult.user?.company_name).toBe(testUserData.company_name);
    expect(loadResult.user?.position).toBe(testUserData.position);
    expect(loadResult.user?.middle_name).toBe(testUserData.middle_name);
    expect(loadResult.user?.gender).toBe(testUserData.gender);
    expect(loadResult.user?.is_staff).toBe(testUserData.is_staff);
    expect(loadResult.user?.account_status).toBe(testUserData.account_status);
    
    console.log('User loaded successfully');
  }, 15000);

  it('should handle user not found with real database', async () => {
    console.log('Testing user not found...');

    // Try to load a non-existent user
    const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    const loadResult = await loadUserById(nonExistentUserId, mockRequest as Request);
    
    expect(loadResult.success).toBe(false);
    expect(loadResult.error).toBeDefined();
    expect(loadResult.error?.code).toBe('USER_NOT_FOUND');
    
    console.log('User not found handled correctly');
  }, 15000);

  it('should handle invalid user ID format', async () => {
    console.log('Testing invalid user ID format...');

    // Try to load with invalid UUID format
    const invalidUserId = 'invalid-uuid-format';
    
    await expect(loadUserById(invalidUserId, mockRequest as Request))
      .rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        field: 'user_id'
      });
    
    console.log('Invalid user ID format handled correctly');
  }, 15000);
}); 