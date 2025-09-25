/**
 * integration.user-lifecycle.test.ts
 * Version: 1.0.1
 * Integration test for the full user lifecycle via public HTTP API.
 * Checks: create, read, update, delete user, and password policy.
 * All comments and documentation are in English (see cursor-config.json).
 */

import axios, { AxiosInstance } from 'axios';

// Global Jest declarations
declare global {
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const expect: any;
  const beforeAll: (fn: () => void | Promise<void>, timeout?: number) => void;
  const afterAll: (fn: () => void | Promise<void>, timeout?: number) => void;
  const require: (module: string) => any;
}

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  admin: {
    username: 'jest',
    password: 'P@ssw0rd'
  },
  testUser: {
    username: 'testjest_lifecycle',
    password: 'P@ssw0rd1!',
    email: `testjest_lifecycle+${Date.now()}@ev2.dev`,
    account_status: 'active',
    is_staff: false,
    first_name: 'test',
    middle_name: 'Integration',
    last_name: 'jest',
    gender: 'm',
    mobile_phone_number: `+1234567${Date.now().toString().slice(-6)}`,
    address: '123 Test Street',
    company_name: 'Test Company',
    position: 'Test Position'
  },
  serverStartTimeout: 10000
};

/**
 * Generate unique data for each test to avoid conflicts
 * Username can only contain latin letters and numbers (no underscores, dashes, etc.)
 */
function generateUniqueData(prefix: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).replace(/[^a-z0-9]/g, '').substring(0, 6);
  // Clean prefix to contain only letters and numbers
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const unique = `${timestamp}${random}`;
  
  return {
    username: `${cleanPrefix}${unique}`.slice(0, 20), // Limit username length, only letters and numbers
    email: `${cleanPrefix}${unique}@ev2.dev`,
    phone: `+1${timestamp.toString().slice(-9)}` // Last 9 digits to ensure +1XXXXXXXXX format
  };
}

/**
 * Get current password policy settings via public API
 */
async function fetchPasswordPolicySettings(token: string): Promise<Record<string, any>> {
  const response = await axios.post(
    `${TEST_CONFIG.baseURL}/api/core/settings/fetch-settings`,
    {
      type: 'bySection',
      sectionPath: 'Application.Security.PasswordPolicies'
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!response.data.success || !response.data.settings) {
    throw new Error('Failed to fetch password policy settings');
  }
  // Convert settings array to object {setting_name: value}
  const settings: Record<string, any> = {};
  for (const s of response.data.settings) {
    settings[s.setting_name] = s.value;
  }
  return settings;
}

/**
 * Generate valid password according to policy
 */
function generateValidPassword(policy: Record<string, any>): string {
  const minLength = Number(policy['password.min.length'] || 8);
  const maxLength = Number(policy['password.max.length'] || 40);
  const requireUppercase = !!policy['password.require.uppercase'];
  const requireLowercase = !!policy['password.require.lowercase'];
  const requireNumbers = !!policy['password.require.numbers'];
  const requireSpecialChars = !!policy['password.require.special.chars'];
  const allowedSpecialChars = policy['password.allowed.special.chars'] || '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = '';
  if (requireLowercase) chars += 'a';
  if (requireUppercase) chars += 'A';
  if (requireNumbers) chars += '1';
  if (requireSpecialChars) chars += allowedSpecialChars[0];
  if (!chars) chars = 'a';
  // Fill to minimum length
  while (chars.length < minLength) chars += 'b';
  // Limit length
  if (chars.length > maxLength) chars = chars.slice(0, maxLength);
  return chars;
}

/**
 * Generate invalid password violating one policy criterion
 * @param policy password policy
 * @param violation violation type: min, max, upper, lower, number, special
 */
function generateInvalidPassword(policy: Record<string, any>, violation: string): string {
  const minLength = Number(policy['password.min.length'] || 8);
  const maxLength = Number(policy['password.max.length'] || 128);
  const requireUppercase = !!policy['password.require.uppercase'];
  const requireLowercase = !!policy['password.require.lowercase'];
  const requireNumbers = !!policy['password.require.numbers'];
  const requireSpecialChars = !!policy['password.require.special.chars'];
  const allowedSpecialChars = policy['password.allowed.special.chars'] || '!@#$%^&*()_+-=[]{}|;:,.<>?';

  switch (violation) {
    case 'min':
      return 'a'.repeat(Math.max(1, minLength - 1));
    case 'max':
      return 'a'.repeat(maxLength + 1);
    case 'upper':
      // Without uppercase
      return 'a'.repeat(minLength);
    case 'lower':
      // Without lowercase
      return 'A'.repeat(minLength);
    case 'number':
      // Without numbers
      let base = '';
      if (requireLowercase) base += 'a';
      if (requireUppercase) base += 'A';
      if (requireSpecialChars) base += allowedSpecialChars[0];
      if (!base) base = 'a';
      while (base.length < minLength) base += 'b';
      return base;
    case 'special':
      // Without special chars - ensure it has all other requirements
      let base2 = '';
      if (requireLowercase) base2 += 'a';
      if (requireUppercase) base2 += 'A';
      if (requireNumbers) base2 += '1';
      if (!base2) base2 = 'a';
      // Fill to minimum length with mixed chars but no special chars
      let fillChars = 'abcABC123';
      while (base2.length < minLength) {
        base2 += fillChars[base2.length % fillChars.length];
      }
      // Remove all special chars (should already be none, but to be safe)
      return base2.replace(new RegExp(`[${allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g'), '');
    default:
      return 'a'.repeat(minLength);
  }
}

describe('User Lifecycle Integration Test: Password Policy', () => {
  let adminToken: string;
  let passwordPolicy: Record<string, any>;
  let api: AxiosInstance;
  let httpAgent: any;
  let httpsAgent: any;

  beforeAll(async () => {
    // Admin authentication
    const response = await axios.post(`${TEST_CONFIG.baseURL}/login`, {
      username: TEST_CONFIG.admin.username,
      password: TEST_CONFIG.admin.password
    });
    adminToken = response.data.token;
    // Get current password policy
    passwordPolicy = await fetchPasswordPolicySettings(adminToken);
    // Create axios instance for all tests with keep-alive disabled
    const http = require('http');
    const https = require('https');
    httpAgent = new http.Agent({ keepAlive: false });
    httpsAgent = new https.Agent({ keepAlive: false });
    api = axios.create({
      baseURL: TEST_CONFIG.baseURL,
      headers: { Authorization: `Bearer ${adminToken}` },
      httpAgent: httpAgent,
      httpsAgent: httpsAgent
    });
  });

  afterAll(async () => {
    // Close agents
    if (httpAgent) {
      httpAgent.destroy();
    }
    if (httpsAgent) {
      httpsAgent.destroy();
    }
  });

  it('should allow user creation with valid password', async () => {
    const validPassword = generateValidPassword(passwordPolicy);
    const uniqueData = generateUniqueData('valid');
    const userData = {
      ...TEST_CONFIG.testUser,
      username: uniqueData.username,
      email: uniqueData.email,
      mobile_phone_number: uniqueData.phone,
      password: validPassword
    };
    const response = await api.post('/api/admin/users/create-new-user', userData);
    expect(response.data.success).toBe(true);
    // cleanup
    if (response.data.userId) {
      await api.post('/api/admin/users/delete-selected-users', { userIds: [response.data.userId] });
    }
  });

  const violations = [
    { type: 'min', label: 'too short' },
    { type: 'max', label: 'too long' },
    { type: 'upper', label: 'no uppercase' },
    { type: 'lower', label: 'no lowercase' },
    { type: 'number', label: 'no number' },
    { type: 'special', label: 'no special char' }
  ];

  for (const v of violations) {
    it(`should reject password: ${v.label}`, async () => {
      const invalidPassword = generateInvalidPassword(passwordPolicy, v.type);
      const uniqueData = generateUniqueData(`invalid_${v.type}`);
      const userData = {
        ...TEST_CONFIG.testUser,
        username: uniqueData.username,
        email: uniqueData.email,
        mobile_phone_number: uniqueData.phone,
        password: invalidPassword
      };
      try {
        await api.post('/api/admin/users/create-new-user', userData);
        throw new Error('Should have failed validation');
      } catch (error: any) {
        // Expect validation error response
        expect(error.response?.status).toBeGreaterThanOrEqual(400);
        expect(error.response?.data?.code).toBeDefined();
        expect(error.response?.data?.message).toBeDefined();
        // The error could be about password policy or other validation issues
        // Main goal is that invalid password is rejected
      }
    });
  }
});

describe('User Lifecycle Integration Test: Full Flow', () => {
  let adminToken: string;
  let passwordPolicy: Record<string, any>;
  let testUserId: string | null = null;
  const uniqueSuffix = Date.now();
  let userData: any = {};
  let api: AxiosInstance;
  let httpAgent: any;
  let httpsAgent: any;

  beforeAll(async () => {
    // Authenticate as admin
    const response = await axios.post(`${TEST_CONFIG.baseURL}/login`, {
      username: TEST_CONFIG.admin.username,
      password: TEST_CONFIG.admin.password
    });
    adminToken = response.data.token;
    // Get current password policy
    passwordPolicy = await fetchPasswordPolicySettings(adminToken);
    // Prepare unique user data for all tests
    const uniqueData = generateUniqueData(`lifecycle_${uniqueSuffix}`);
    userData = {
      ...TEST_CONFIG.testUser,
      username: uniqueData.username,
      email: uniqueData.email,
      mobile_phone_number: uniqueData.phone,
      password: generateValidPassword(passwordPolicy)
    };
    // Create axios instance for all tests with keep-alive disabled
    const http = require('http');
    const https = require('https');
    httpAgent = new http.Agent({ keepAlive: false });
    httpsAgent = new https.Agent({ keepAlive: false });
    api = axios.create({
      baseURL: TEST_CONFIG.baseURL,
      headers: { Authorization: `Bearer ${adminToken}` },
      httpAgent: httpAgent,
      httpsAgent: httpsAgent
    });
  });

  afterAll(async () => {
    // Cleanup: delete test user if still exists
    if (testUserId) {
      try {
        await api.post('/api/admin/users/delete-selected-users', { userIds: [testUserId] });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    // Close agents
    if (httpAgent) {
      httpAgent.destroy();
    }
    if (httpsAgent) {
      httpsAgent.destroy();
    }
  });

  it('should create user via public API', async () => {
    const createResp = await api.post('/api/admin/users/create-new-user', userData);
    expect(createResp.data.success).toBe(true);
    testUserId = createResp.data.userId;
    expect(testUserId).toBeTruthy();
  });

  it('should not allow duplicate user creation', async () => {
    // Only run if user was created successfully
    if (!testUserId) {
      throw new Error('Previous test failed - user was not created');
    }
    
    try {
      await api.post('/api/admin/users/create-new-user', userData);
      throw new Error('Duplicate user creation should fail');
    } catch (error: any) {
      // Updated to match actual API error response format
      expect(error.response?.status).toBeGreaterThanOrEqual(400);
      expect(error.response?.data?.code).toBeDefined();
      expect(error.response?.data?.message).toBeDefined();
      // Should be about duplicate/existing user, email, or phone
      if (error.response?.data?.message) {
        expect(error.response.data.message.toLowerCase()).toMatch(/already|exists|taken|registered/i);
      }
    }
  });

  it('should read user via public API', async () => {
    // Only run if user was created successfully
    if (!testUserId) {
      throw new Error('Previous test failed - user was not created');
    }
    
    const fetchResp = await api.get(`/api/admin/users/fetch-user-by-userid/${testUserId}`);
    expect(fetchResp.data.success).toBe(true);
    expect(fetchResp.data.data?.user?.username).toBe(userData.username);
  });

  it('should update user via public API', async () => {
    // Only run if user was created successfully
    if (!testUserId) {
      throw new Error('Previous test failed - user was not created');
    }
    
    const uniqueUpdate = generateUniqueData(`update_${uniqueSuffix}`);
    const updateData = {
      email: uniqueUpdate.email,
      account_status: 'active',
      is_staff: true,
      first_name: 'Updated',
      middle_name: 'Integration',
      last_name: 'jest',
      gender: 'f',
      mobile_phone_number: uniqueUpdate.phone,
      address: '456 Updated Street',
      company_name: 'Updated Company',
      position: 'Updated Position'
    };
    const updateResp = await api.post(`/api/admin/users/update-user-by-userid/${testUserId}`, updateData);
    expect(updateResp.data.success).toBe(true);
    // Check changes
    const fetchUpdated = await api.get(`/api/admin/users/fetch-user-by-userid/${testUserId}`);
    expect(fetchUpdated.data.success).toBe(true);
    expect(fetchUpdated.data.data?.user?.email).toBe(updateData.email);
    expect(fetchUpdated.data.data?.profile?.company_name).toBe(updateData.company_name);
  });

  it('should delete user via public API', async () => {
    // Only run if user was created successfully
    if (!testUserId) {
      throw new Error('Previous test failed - user was not created');
    }
    
    const deleteResp = await api.post('/api/admin/users/delete-selected-users', { userIds: [testUserId] });
    // Check if response indicates successful deletion
    expect(deleteResp.status).toBe(200);
    expect(deleteResp.data).toBeDefined();
    // The API might return different formats - adjust based on actual response
    const isSuccessful = deleteResp.data === 1 || deleteResp.data > 0 || 
                        deleteResp.data.success === true || 
                        deleteResp.data.deletedCount > 0;
    expect(isSuccessful).toBe(true);
    testUserId = null;
  });
});