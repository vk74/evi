/**
 * Version: 1.0.0
 *
 * Real database tests for delete user service
 * This backend file contains Jest tests for the user deletion service using real database.
 * Tests delete actual users from the database and verify the complete deletion process.
 * Uses real database operations instead of mocks.
 *
 * File: service.delete.user.real.test.ts
 */

import { Request } from 'express';
import { deleteSelectedUsers } from '../usersList/service.delete.selected.users';
import { createUser } from './service.create.user';
import { loadUserById } from './service.load.user';
import type { CreateUserRequest } from './types.user.editor';
import { AccountStatus } from './types.user.editor';

describe('Delete User Service - Real Database Tests', () => {
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
    // Cleanup: delete test user if it was created but not deleted
    if (createdUserId) {
      try {
        await deleteSelectedUsers({ user_ids: [createdUserId] }, mockRequest as Request);
      } catch (error) {
        // Ignore cleanup errors
        console.log('Cleanup warning:', error);
      }
    }
  });

  it('should delete user successfully with real database', async () => {
    console.log('Testing real user deletion...');

    // First, create a user
    const createResult = await createUser(testUserData, mockRequest as Request);
    expect(createResult.success).toBe(true);
    createdUserId = createResult.userId!;

    // Verify user exists
    const loadBeforeDelete = await loadUserById(createdUserId, mockRequest as Request);
    expect(loadBeforeDelete.success).toBe(true);
    expect(loadBeforeDelete.user?.user_id).toBe(createdUserId);

    // Delete the user
    const deleteResult = await deleteSelectedUsers({ user_ids: [createdUserId] }, mockRequest as Request);
    
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedCount).toBe(1);
    expect(deleteResult.deletedUserIds).toContain(createdUserId);
    
    console.log('User deleted successfully');

    // Verify user is deleted
    const loadAfterDelete = await loadUserById(createdUserId, mockRequest as Request);
    expect(loadAfterDelete.success).toBe(false);
    expect(loadAfterDelete.error?.code).toBe('USER_NOT_FOUND');
    
    // Reset createdUserId to prevent cleanup
    createdUserId = '';
    
    console.log('User deletion verification completed');
  }, 15000);

  it('should handle deletion of non-existent user', async () => {
    console.log('Testing deletion of non-existent user...');

    // Try to delete a non-existent user
    const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    const deleteResult = await deleteSelectedUsers({ user_ids: [nonExistentUserId] }, mockRequest as Request);
    
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedCount).toBe(0);
    expect(deleteResult.deletedUserIds).toEqual([]);
    
    console.log('Non-existent user deletion handled correctly');
  }, 15000);

  it('should handle deletion of multiple users', async () => {
    console.log('Testing deletion of multiple users...');

    // Create two users
    const user1Data = { ...testUserData, username: 'jest1', email: 'testjest1@testjest.dev' };
    const user2Data = { ...testUserData, username: 'jest2', email: 'testjest2@testjest.dev' };

    const createResult1 = await createUser(user1Data, mockRequest as Request);
    const createResult2 = await createUser(user2Data, mockRequest as Request);
    
    expect(createResult1.success).toBe(true);
    expect(createResult2.success).toBe(true);
    
    const userId1 = createResult1.userId!;
    const userId2 = createResult2.userId!;

    // Delete both users
    const deleteResult = await deleteSelectedUsers({ user_ids: [userId1, userId2] }, mockRequest as Request);
    
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedCount).toBe(2);
    expect(deleteResult.deletedUserIds).toContain(userId1);
    expect(deleteResult.deletedUserIds).toContain(userId2);
    
    console.log('Multiple users deleted successfully');

    // Verify both users are deleted
    const loadUser1 = await loadUserById(userId1, mockRequest as Request);
    const loadUser2 = await loadUserById(userId2, mockRequest as Request);
    
    expect(loadUser1.success).toBe(false);
    expect(loadUser1.error?.code).toBe('USER_NOT_FOUND');
    expect(loadUser2.success).toBe(false);
    expect(loadUser2.error?.code).toBe('USER_NOT_FOUND');
    
    // Reset createdUserId to prevent cleanup
    createdUserId = '';
    
    console.log('Multiple users deletion verification completed');
  }, 15000);

  it('should handle deletion with empty user IDs array', async () => {
    console.log('Testing deletion with empty user IDs array...');

    const deleteResult = await deleteSelectedUsers({ user_ids: [] }, mockRequest as Request);
    
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedCount).toBe(0);
    expect(deleteResult.deletedUserIds).toEqual([]);
    
    console.log('Empty user IDs array deletion handled correctly');
  }, 15000);
}); 