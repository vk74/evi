/**
 * integration.user-lifecycle.test.ts
 * Version: 1.0.0
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

// Конфиг теста
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

// Вспомогательные функции и переменные будут добавлены далее 

/**
 * Получить актуальные настройки политики паролей через публичный API
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
  // Преобразуем массив настроек в объект {setting_name: value}
  const settings: Record<string, any> = {};
  for (const s of response.data.settings) {
    settings[s.setting_name] = s.value;
  }
  return settings;
}

/**
 * Генерирует валидный пароль по политике
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
  // Заполняем до минимальной длины
  while (chars.length < minLength) chars += 'b';
  // Ограничим длину
  if (chars.length > maxLength) chars = chars.slice(0, maxLength);
  return chars;
}

/**
 * Генерирует невалидный пароль по одному из критериев
 * @param policy политика паролей
 * @param violation тип нарушения: min, max, upper, lower, number, special
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
      // Без заглавных
      return 'a'.repeat(minLength);
    case 'lower':
      // Без строчных
      return 'A'.repeat(minLength);
    case 'number':
      // Без цифр
      let base = '';
      if (requireLowercase) base += 'a';
      if (requireUppercase) base += 'A';
      if (requireSpecialChars) base += allowedSpecialChars[0];
      if (!base) base = 'a';
      while (base.length < minLength) base += 'b';
      return base;
    case 'special':
      // Без спецсимволов
      let base2 = '';
      if (requireLowercase) base2 += 'a';
      if (requireUppercase) base2 += 'A';
      if (requireNumbers) base2 += '1';
      if (!base2) base2 = 'a';
      while (base2.length < minLength) base2 += 'b';
      // Удаляем все спецсимволы
      return base2.replace(new RegExp(`[${allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g'), '');
    default:
      return 'a'.repeat(minLength);
  }
}

function makeShortUsername(prefix: string): string {
  // Только латинские буквы и цифры, максимум 20 символов
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const randomPart = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 10);
  return (cleanPrefix + randomPart).slice(0, 20);
}

function makeShortEmail(prefix: string): string {
  return `${prefix}${Math.random().toString(36).slice(2, 6)}@ev2.dev`;
}

describe('User Lifecycle Integration Test: Password Policy', () => {
  let adminToken: string;
  let passwordPolicy: Record<string, any>;
  let api: AxiosInstance;
  let httpAgent: any;
  let httpsAgent: any;

  beforeAll(async () => {
    // Аутентификация администратора
    const response = await axios.post(`${TEST_CONFIG.baseURL}/login`, {
      username: TEST_CONFIG.admin.username,
      password: TEST_CONFIG.admin.password
    });
    adminToken = response.data.token;
    // Получаем актуальную политику паролей
    passwordPolicy = await fetchPasswordPolicySettings(adminToken);
    // Создаем один экземпляр axios для всех тестов с отключенным keep-alive
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
    // Закрываем агенты
    if (httpAgent) {
      httpAgent.destroy();
    }
    if (httpsAgent) {
      httpsAgent.destroy();
    }
  });

  it('should allow user creation with valid password', async () => {
    const validPassword = generateValidPassword(passwordPolicy);
    const userData = {
      ...TEST_CONFIG.testUser,
      username: makeShortUsername(`test_valid_`),
      email: makeShortEmail(`test_valid_`),
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
      const userData = {
        ...TEST_CONFIG.testUser,
        username: makeShortUsername(`test_invalid_${v.type}_`),
        email: makeShortEmail(`test_invalid_${v.type}_`),
        password: invalidPassword
      };
      try {
        await api.post('/api/admin/users/create-new-user', userData);
        throw new Error('Should have failed password policy');
      } catch (error: any) {
        expect(error.response?.data?.success).not.toBe(true);
        expect(error.response?.data?.message).toMatch(/password/i);
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
    // Prepare user data for all tests
    userData = {
      ...TEST_CONFIG.testUser,
      username: makeShortUsername(`test_lifecycle_${uniqueSuffix}`),
      email: makeShortEmail(`test_lifecycle_${uniqueSuffix}`),
      password: generateValidPassword(passwordPolicy)
    };
    // Создаем один экземпляр axios для всех тестов с отключенным keep-alive
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
      await api.post('/api/admin/users/delete-selected-users', { userIds: [testUserId] });
    }
    // Закрываем агенты
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
    try {
      await api.post('/api/admin/users/create-new-user', userData);
      throw new Error('Duplicate user creation should fail');
    } catch (error: any) {
      expect(error.response?.data?.success).not.toBe(true);
      expect(error.response?.data?.message).toMatch(/user|email|duplicate|exists/i);
    }
  });

  it('should read user via public API', async () => {
    const fetchResp = await api.get(`/api/admin/users/fetch-user-by-userid/${testUserId}`);
    expect(fetchResp.data.success).toBe(true);
    expect(fetchResp.data.data?.user?.username).toBe(userData.username);
  });

  it('should update user via public API', async () => {
    const updateData = {
      email: `updated_${userData.email}`,
      account_status: 'active',
      is_staff: true,
      first_name: 'Updated',
      middle_name: 'Integration',
      last_name: 'jest',
      gender: 'f',
      mobile_phone_number: `+987654${uniqueSuffix.toString().slice(-6)}`,
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
    const deleteResp = await api.post('/api/admin/users/delete-selected-users', { userIds: [testUserId] });
    expect(deleteResp.data === 1 || deleteResp.data > 0).toBe(true);
    testUserId = null;
  });
});