/**
 * Version: 1.0.0
 *
 * Real database tests for update user service
 * This backend file contains Jest tests for the user update service using real database.
 * Tests update actual users in the database and verify the complete update process.
 * Uses real database operations instead of mocks.
 *
 * File: service.update.user.real.test.ts
 */

import { Request } from 'express';
import { updateUserById } from './service.update.user';
import { createUser } from './service.create.user';
import { loadUserById } from './service.load.user';
import { deleteSelectedUsers } from '../usersList/service.delete.selected.users';
import type { CreateUserRequest, UpdateUserRequest } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

describe('Update User Service - Real Database Tests', () => {
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

  const updateUserData: UpdateUserRequest = {
    user_id: '', // Will be set after creation
    username: 'jest_updated',
    email: 'testjest_updated@testjest.dev',
    first_name: 'JestUpdated',
    last_name: 'TestUserUpdated',
    mobile_phone_number: '+0987654321',
    address: 'Updated Test Address',
    company_name: 'Updated Test Company',
    position: 'Updated Test Position'
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

  it('should update user successfully with real database', async () => {
    console.log('Testing real user update...');

    // First, create a user
    const createResult = await createUser(testUserData, mockRequest as Request);
    expect(createResult.success).toBe(true);
    createdUserId = createResult.userId!;

    // Set the user ID for update
    updateUserData.user_id = createdUserId;

    // Update the user
    const updateResult = await updateUserById(updateUserData, mockRequest as Request);
    
    expect(updateResult.success).toBe(true);
    expect(updateResult.userId).toBe(createdUserId);
    expect(updateResult.updatedFields).toContain('username');
    expect(updateResult.updatedFields).toContain('email');
    expect(updateResult.updatedFields).toContain('first_name');
    expect(updateResult.updatedFields).toContain('last_name');
    expect(updateResult.updatedFields).toContain('mobile_phone_number');
    expect(updateResult.updatedFields).toContain('address');
    expect(updateResult.updatedFields).toContain('company_name');
    expect(updateResult.updatedFields).toContain('position');
    
    console.log('User updated successfully');

    // Verify the update by loading the user
    const loadResult = await loadUserById(createdUserId, mockRequest as Request);
    expect(loadResult.success).toBe(true);
    expect(loadResult.user?.username).toBe(updateUserData.username);
    expect(loadResult.user?.email).toBe(updateUserData.email);
    expect(loadResult.user?.first_name).toBe(updateUserData.first_name);
    expect(loadResult.user?.last_name).toBe(updateUserData.last_name);
    expect(loadResult.user?.mobile_phone_number).toBe(updateUserData.mobile_phone_number);
    expect(loadResult.user?.address).toBe(updateUserData.address);
    expect(loadResult.user?.company_name).toBe(updateUserData.company_name);
    expect(loadResult.user?.position).toBe(updateUserData.position);
    
    console.log('Update verification completed');
  }, 15000);

  it('should handle partial updates correctly', async () => {
    console.log('Testing partial user update...');

    // First, create a user
    const createResult = await createUser(testUserData, mockRequest as Request);
    expect(createResult.success).toBe(true);
    createdUserId = createResult.userId!;

    // Partial update - only email
    const partialUpdateData: UpdateUserRequest = {
      user_id: createdUserId,
      email: 'partial_update@testjest.dev'
    };

    const updateResult = await updateUserById(partialUpdateData, mockRequest as Request);
    expect(updateResult.success).toBe(true);
    expect(updateResult.updatedFields).toEqual(['email']);

    // Verify only email was updated
    const loadResult = await loadUserById(createdUserId, mockRequest as Request);
    expect(loadResult.success).toBe(true);
    expect(loadResult.user?.email).toBe('partial_update@testjest.dev');
    expect(loadResult.user?.username).toBe(testUserData.username); // Should remain unchanged
    expect(loadResult.user?.first_name).toBe(testUserData.first_name); // Should remain unchanged
    
    console.log('Partial update completed successfully');
  }, 15000);

  it('should handle user not found during update', async () => {
    console.log('Testing update of non-existent user...');

    // Try to update a non-existent user
    const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData: UpdateUserRequest = {
      user_id: nonExistentUserId,
      email: 'test@example.com'
    };

    await expect(updateUserById(updateData, mockRequest as Request))
      .rejects.toMatchObject({
        code: 'USER_NOT_FOUND'
      });
    
    console.log('User not found during update handled correctly');
  }, 15000);

  it('should handle invalid user ID format during update', async () => {
    console.log('Testing update with invalid user ID format...');

    // Try to update with invalid UUID format
    const invalidUserId = 'invalid-uuid-format';
    const updateData: UpdateUserRequest = {
      user_id: invalidUserId,
      email: 'test@example.com'
    };

    await expect(updateUserById(updateData, mockRequest as Request))
      .rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        field: 'user_id'
      });
    
    console.log('Invalid user ID format during update handled correctly');
  }, 15000);
}); 