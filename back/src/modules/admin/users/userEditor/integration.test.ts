/**
 * integration.test.ts - backend file
 * version: 1.0.0
 * 
 * Integration test for complete user lifecycle operations.
 * Tests real API endpoints with actual database operations.
 * 
 * Test flow:
 * 1. Create user - verify API is accessible and user is created
 * 2. Attempt duplicate creation - verify error handling
 * 3. Load user data - verify user can be retrieved
 * 4. Update user data - verify updates work
 * 5. Verify changes - reload and check updates persisted
 * 6. Delete user - verify cleanup
 * 
 * File: integration.test.ts
 */

import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { getUuidByUsername } from '../../../../core/helpers/get.uuid.by.username';

// Test configuration
const TIMESTAMP = Date.now();
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  auth: {
    username: 'jest',
    password: 'P@ssw0rd'
  },
  testUser: {
    username: 'testjest',
    password: 'P@ssw0rd',
    email: `testjest+${TIMESTAMP}@ev2.dev`,
    account_status: 'active',
    is_staff: false,
    first_name: 'test',
    middle_name: 'Integration',
    last_name: 'jest',
    gender: 'm',
    mobile_phone_number: `+1234567${TIMESTAMP.toString().slice(-6)}`,
    address: '123 Test Street',
    company_name: 'Test Company',
    position: 'Test Position'
  },
  serverStartTimeout: 10000, // 10 seconds
  serverStopTimeout: 5000    // 5 seconds
};

interface TestUser {
  user_id: string;
  username: string;
  email: string;
  [key: string]: any;
}

class IntegrationTestManager {
  private serverProcess: ChildProcess | null = null;
  private jwtToken: string | null = null;
  private createdUserId: string | null = null;
  private pool: Pool;

  constructor() {
    this.pool = pgPool as Pool;
  }

  /**
   * Start backend server if not running
   */
  async startServer(): Promise<void> {
    console.log('🔧 Checking if backend server is running...');
    
    try {
      await axios.get(`${TEST_CONFIG.baseURL}/`);
      console.log('✅ Backend server is already running');
      return;
    } catch (error) {
      console.log('⚠️  Backend server not running, starting...');
    }

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server startup timeout'));
        }
      }, TEST_CONFIG.serverStartTimeout);

      this.serverProcess!.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[SERVER] ${output.trim()}`);
        
        // Check for server ready indicators
        if (output.includes('Backend server is running') || 
            output.includes('Server is ready') ||
            output.includes('All routes registered successfully')) {
          serverReady = true;
          clearTimeout(timeout);
          setTimeout(() => resolve(), 2000); // Wait 2 seconds for full initialization
        }
      });

      this.serverProcess!.stderr?.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data.toString()}`);
      });

      this.serverProcess!.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.serverProcess!.on('exit', (code) => {
        if (code !== 0 && !serverReady) {
          clearTimeout(timeout);
          reject(new Error(`Server exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Stop backend server if started by test
   */
  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      console.log('🛑 Stopping backend server...');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⚠️  Force killing server process...');
          this.serverProcess?.kill('SIGKILL');
          resolve();
        }, TEST_CONFIG.serverStopTimeout);

        this.serverProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.serverProcess?.kill('SIGTERM');
      });
    }
  }

  /**
   * Authenticate and get JWT token
   */
  async authenticate(): Promise<void> {
    console.log('🔐 Authenticating...');
    
    try {
      const response = await axios.post(`${TEST_CONFIG.baseURL}/login`, {
        username: TEST_CONFIG.auth.username,
        password: TEST_CONFIG.auth.password
      });

      if (response.data.token) {
        this.jwtToken = response.data.token;
        console.log('✅ Authentication successful');
      } else {
        throw new Error('No token in response');
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Create axios instance with auth headers
   */
  private getAuthenticatedAxios() {
    return axios.create({
      baseURL: TEST_CONFIG.baseURL,
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Step 1: Create user
   */
  async createUser(): Promise<void> {
    console.log('📝 Step 1: Creating test user...');
    
    try {
      const api = this.getAuthenticatedAxios();
      const response = await api.post('/api/admin/users/create-new-user', TEST_CONFIG.testUser);

      if (response.data.success) {
        console.log('✅ User created successfully');
        
        // Get UUID using helper
        this.createdUserId = await getUuidByUsername(TEST_CONFIG.testUser.username);
        
        if (this.createdUserId) {
          console.log(`✅ User UUID retrieved: ${this.createdUserId}`);
        } else {
          throw new Error('Failed to get user UUID after creation');
        }
      } else {
        throw new Error('User creation failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ User creation failed:', error);
      throw error;
    }
  }

  /**
   * Step 2: Attempt duplicate creation
   */
  async attemptDuplicateCreation(): Promise<void> {
    console.log('🔄 Step 2: Attempting duplicate user creation...');
    
    try {
      const api = this.getAuthenticatedAxios();
      await api.post('/api/admin/users/create-new-user', TEST_CONFIG.testUser);
      
      // If we reach here, it means no error was thrown - this is a problem
      throw new Error('Duplicate creation should have failed');
    } catch (error: any) {
      if (error.response?.status >= 400) {
        console.log(`✅ Duplicate creation correctly rejected with status ${error.response.status}`);
        if (error.response.data?.message) {
          console.log(`   Error message: ${error.response.data.message}`);
        }
      } else {
        console.error('❌ Unexpected error during duplicate creation:', error);
        throw error;
      }
    }
  }

  /**
   * Step 3: Load user data
   */
  async loadUser(): Promise<TestUser> {
    console.log('📖 Step 3: Loading user data...');
    
    if (!this.createdUserId) {
      throw new Error('No user ID available for loading');
    }

    try {
      const api = this.getAuthenticatedAxios();
      const response = await api.get(`/api/admin/users/fetch-user-by-userid/${this.createdUserId}`);

      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        console.log('✅ User data loaded successfully');
        console.log('Loaded user data:', JSON.stringify(userData, null, 2));
        return userData;
      } else {
        throw new Error('User loading failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ User loading failed:', error);
      throw error;
    }
  }

  /**
   * Step 4: Update user data
   */
  async updateUser(): Promise<void> {
    console.log('✏️  Step 4: Updating user data...');
    
    if (!this.createdUserId) {
      throw new Error('No user ID available for updating');
    }

    const updateData = {
      email: `updated.testjest+${TIMESTAMP}@ev2.dev`,
      account_status: 'active',
      is_staff: true,
      first_name: 'Updated',
      middle_name: 'Integration',
      last_name: 'jest',
      gender: 'f',
      mobile_phone_number: `+987654${TIMESTAMP.toString().slice(-6)}`,
      address: '456 Updated Street',
      company_name: 'Updated Company',
      position: 'Updated Position'
    };

    try {
      const api = this.getAuthenticatedAxios();
      const response = await api.post(`/api/admin/users/update-user-by-userid/${this.createdUserId}`, updateData);

      if (response.data.success) {
        console.log('✅ User updated successfully');
      } else {
        throw new Error('User update failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ User update failed:', error);
      throw error;
    }
  }

  /**
   * Step 5: Verify changes
   */
  async verifyChanges(): Promise<void> {
    console.log('🔍 Step 5: Verifying changes...');
    
    const updatedUser = await this.loadUser();
    
    const expectedChanges = {
      email: `updated.testjest+${TIMESTAMP}@ev2.dev`,
      is_staff: true,
      first_name: 'Updated',
      gender: 'f',
      mobile_phone_number: `+987654${TIMESTAMP.toString().slice(-6)}`,
      address: '456 Updated Street',
      company_name: 'Updated Company',
      position: 'Updated Position'
    };

    let allChangesVerified = true;
    const verificationResults: string[] = [];

    for (const [field, expectedValue] of Object.entries(expectedChanges)) {
      // Check in user object first, then in profile object
      let actualValue = updatedUser.user?.[field] || updatedUser.profile?.[field];
      
      if (actualValue === expectedValue) {
        verificationResults.push(`✅ ${field}: ${actualValue}`);
      } else {
        verificationResults.push(`❌ ${field}: expected ${expectedValue}, got ${actualValue}`);
        allChangesVerified = false;
      }
    }

    console.log('Verification results:');
    verificationResults.forEach(result => console.log(result));

    if (!allChangesVerified) {
      const errorDetails = verificationResults.join('\n');
      const userDataDump = JSON.stringify(updatedUser, null, 2);
      throw new Error('Not all changes were verified successfully:\n' + errorDetails + '\nLoaded user data:\n' + userDataDump);
    }

    console.log('✅ All changes verified successfully');
  }

  /**
   * Step 6: Delete user
   */
  async deleteUser(): Promise<void> {
    console.log('🗑️  Step 6: Deleting user...');
    
    if (!this.createdUserId) {
      console.log('⚠️  No user ID available for deletion');
      return;
    }

    try {
      const api = this.getAuthenticatedAxios();
      const response = await api.post('/api/admin/users/delete-selected-users', {
        userIds: [this.createdUserId]
      });

      if (response.data === 1 || response.data > 0) {
        console.log('✅ User deleted successfully');
      } else {
        console.error('❌ User deletion failed. Full response:', response.data);
        throw new Error('User deletion failed: ' + JSON.stringify(response.data));
      }
    } catch (error: any) {
      if (error.response) {
        console.error('❌ User deletion failed. Status:', error.response.status, 'Data:', error.response.data);
        throw new Error('User deletion failed. Status: ' + error.response.status + ' Data: ' + JSON.stringify(error.response.data));
      } else {
        console.error('❌ User deletion failed:', error);
        throw error;
      }
    }
  }

  /**
   * Cleanup: Force delete user from database if needed
   */
  async forceCleanup(): Promise<void> {
    if (!this.createdUserId) {
      return;
    }

    console.log('🧹 Force cleanup: Removing test user from database...');
    
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete from user_profiles first (foreign key constraint)
        await client.query(
          'DELETE FROM app.user_profiles WHERE user_id = $1',
          [this.createdUserId]
        );
        
        // Delete from users
        await client.query(
          'DELETE FROM app.users WHERE user_id = $1',
          [this.createdUserId]
        );
        
        await client.query('COMMIT');
        console.log('✅ Force cleanup completed');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Force cleanup failed:', error);
    }
  }

  /**
   * Cleanup: Remove existing test user by username before starting tests
   */
  async cleanupExistingUser(): Promise<void> {
    console.log('🧹 Pre-test cleanup: Removing existing test user...');
    
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Find user by username
        const userResult = await client.query(
          'SELECT user_id FROM app.users WHERE username = $1',
          [TEST_CONFIG.testUser.username]
        );
        
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].user_id;
          console.log(`Found existing test user with ID: ${userId}`);
          
          // Delete from user_profiles first (foreign key constraint)
          await client.query(
            'DELETE FROM app.user_profiles WHERE user_id = $1',
            [userId]
          );
          
          // Delete from users
          await client.query(
            'DELETE FROM app.users WHERE user_id = $1',
            [userId]
          );
          
          await client.query('COMMIT');
          console.log('✅ Existing test user removed');
        } else {
          await client.query('COMMIT');
          console.log('✅ No existing test user found');
        }
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Pre-test cleanup failed:', error);
    }
  }

  /**
   * Run complete integration test
   */
  async runIntegrationTest(): Promise<void> {
    console.log('🚀 Starting User Integration Test');
    console.log('=====================================');

    try {
      // Setup
      await this.startServer();
      await this.authenticate();

      // Pre-test cleanup
      await this.cleanupExistingUser();

      // Test steps
      await this.createUser();
      await this.attemptDuplicateCreation();
      await this.loadUser();
      await this.updateUser();
      await this.verifyChanges();
      await this.deleteUser();

      console.log('=====================================');
      console.log('🎉 All integration tests passed!');
      
    } catch (error) {
      console.error('=====================================');
      console.error('💥 Integration test failed:', error);
      
      // Cleanup on failure
      await this.forceCleanup();
      
      throw error;
    } finally {
      // Cleanup
      await this.stopServer();
    }
  }
}

// Test execution
describe('User Integration Test', () => {
  const testManager = new IntegrationTestManager();

  it('should complete full user lifecycle', async () => {
    await testManager.runIntegrationTest();
  }, 60000); // 60 second timeout
}); 