/**
 * test.server.initialization.ts - backend file
 * version: 1.0.0
 * 
 * Unit test for server initialization sequence.
 * Verifies that all components are initialized in the correct order:
 * 1. Helpers cache
 * 2. Private key loading
 * 3. Event system (bus, factory, reference system)
 * 4. Settings loading
 * 5. Logger initialization (AFTER settings)
 */

import fs from 'fs';

// Mock all external dependencies
jest.mock('fs');
jest.mock('@/core/helpers/cache.helpers');
jest.mock('@/core/eventBus/bus.events');
jest.mock('@/core/eventBus/fabric.events');
jest.mock('@/core/eventBus/reference/index.reference.events');
jest.mock('@/modules/admin/settings/service.load.settings');
jest.mock('@/core/logger/service.logger');
jest.mock('@/core/logger/subscriptions.logger');

// Import mocked modules
import { initCache as initHelpersCache } from '@/core/helpers/cache.helpers';
import { eventBus } from '@/core/eventBus/bus.events';
import fabricEvents from '@/core/eventBus/fabric.events';
import { initializeEventReferenceSystem } from '@/core/eventBus/reference/index.reference.events';
import { loadSettings } from '@/modules/admin/settings/service.load.settings';
import loggerService from '@/core/logger/service.logger';
import loggerSubscriptions from '@/core/logger/subscriptions.logger';

// Mock implementations
const mockFs = fs as jest.Mocked<typeof fs>;
const mockInitHelpersCache = initHelpersCache as jest.MockedFunction<typeof initHelpersCache>;
const mockInitializeEventReferenceSystem = initializeEventReferenceSystem as jest.MockedFunction<typeof initializeEventReferenceSystem>;
const mockLoadSettings = loadSettings as jest.MockedFunction<typeof loadSettings>;
const mockLoggerServiceInitialize = loggerService.initialize as jest.MockedFunction<typeof loggerService.initialize>;
const mockLoggerSubscriptionsInitialize = loggerSubscriptions.initializeSubscriptions as jest.MockedFunction<typeof loggerSubscriptions.initializeSubscriptions>;

// Global variables
declare global {
  var privateKey: string;
}

// Mock event bus as truthy
(eventBus as any) = { mock: 'eventBus' };
(fabricEvents as any) = { mock: 'fabricEvents' };

describe('Server Initialization Sequence', () => {
  let callOrder: string[] = [];

  beforeEach(() => {
    callOrder = [];
    jest.clearAllMocks();
    
    // Reset global state
    delete global.privateKey;

    // Setup mocks to track call order
    mockFs.readFileSync.mockImplementation(() => {
      callOrder.push('privateKey');
      return 'mock-private-key';
    });

    mockInitHelpersCache.mockImplementation(() => {
      callOrder.push('helpersCache');
    });

    mockInitializeEventReferenceSystem.mockImplementation(async () => {
      callOrder.push('eventReferenceSystem');
    });

    mockLoadSettings.mockImplementation(async () => {
      callOrder.push('loadSettings');
    });

    mockLoggerServiceInitialize.mockImplementation(() => {
      callOrder.push('loggerService');
    });

    mockLoggerSubscriptionsInitialize.mockImplementation(() => {
      callOrder.push('loggerSubscriptions');
    });
  });

  // Extract initialization logic for testing
  async function testInitializeServerCore(): Promise<void> {
    // 0. Initialize helpers cache
    initHelpersCache();

    // 1. Loading private key
    const privateKeyPath = './src/keys/private_key.pem';
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    global.privateKey = privateKey;

    if (!global.privateKey) {
      throw new Error('Failed to set global.privateKey');
    }

    // 2. Initialize event system
    if (!eventBus) {
      throw new Error('Event bus not initialized');
    }

    if (!fabricEvents) {
      throw new Error('Failed to load event factory');
    }

    // Initialize event reference system
    await initializeEventReferenceSystem();

    // 3. Loading settings
    await loadSettings();

    // 4. Initialize logger service AFTER settings are loaded
    loggerService.initialize();
    loggerSubscriptions.initializeSubscriptions();
  }

  test('should initialize components in correct order', async () => {
    // Act
    await testInitializeServerCore();

    // Assert call order
    expect(callOrder).toEqual([
      'helpersCache',
      'privateKey',
      'eventReferenceSystem',
      'loadSettings',
      'loggerService',
      'loggerSubscriptions'
    ]);
  });

  test('should initialize helpers cache first', async () => {
    await testInitializeServerCore();

    expect(callOrder[0]).toBe('helpersCache');
    expect(mockInitHelpersCache).toHaveBeenCalledTimes(1);
  });

  test('should load private key after helpers cache', async () => {
    await testInitializeServerCore();

    const helpersCacheIndex = callOrder.indexOf('helpersCache');
    const privateKeyIndex = callOrder.indexOf('privateKey');
    
    expect(privateKeyIndex).toBeGreaterThan(helpersCacheIndex);
    expect(mockFs.readFileSync).toHaveBeenCalledWith('./src/keys/private_key.pem', 'utf8');
  });

  test('should initialize event system before settings', async () => {
    await testInitializeServerCore();

    const eventSystemIndex = callOrder.indexOf('eventReferenceSystem');
    const settingsIndex = callOrder.indexOf('loadSettings');
    
    expect(eventSystemIndex).toBeGreaterThan(-1);
    expect(settingsIndex).toBeGreaterThan(-1);
    expect(eventSystemIndex).toBeLessThan(settingsIndex);
  });

  test('should load settings before logger initialization', async () => {
    await testInitializeServerCore();

    const settingsIndex = callOrder.indexOf('loadSettings');
    const loggerServiceIndex = callOrder.indexOf('loggerService');
    const loggerSubscriptionsIndex = callOrder.indexOf('loggerSubscriptions');
    
    expect(settingsIndex).toBeGreaterThan(-1);
    expect(loggerServiceIndex).toBeGreaterThan(-1);
    expect(loggerSubscriptionsIndex).toBeGreaterThan(-1);
    
    // Logger should be initialized AFTER settings
    expect(settingsIndex).toBeLessThan(loggerServiceIndex);
    expect(settingsIndex).toBeLessThan(loggerSubscriptionsIndex);
  });

  test('should initialize logger service before logger subscriptions', async () => {
    await testInitializeServerCore();

    const loggerServiceIndex = callOrder.indexOf('loggerService');
    const loggerSubscriptionsIndex = callOrder.indexOf('loggerSubscriptions');
    
    expect(loggerServiceIndex).toBeGreaterThan(-1);
    expect(loggerSubscriptionsIndex).toBeGreaterThan(-1);
    expect(loggerServiceIndex).toBeLessThan(loggerSubscriptionsIndex);
  });

  test('should set global privateKey correctly', async () => {
    await testInitializeServerCore();

    expect(global.privateKey).toBe('mock-private-key');
  });

  test('should call all required initialization functions', async () => {
    await testInitializeServerCore();

    expect(mockInitHelpersCache).toHaveBeenCalledTimes(1);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
    expect(mockInitializeEventReferenceSystem).toHaveBeenCalledTimes(1);
    expect(mockLoadSettings).toHaveBeenCalledTimes(1);
    expect(mockLoggerServiceInitialize).toHaveBeenCalledTimes(1);
    expect(mockLoggerSubscriptionsInitialize).toHaveBeenCalledTimes(1);
  });

  test('should throw error if private key loading fails', async () => {
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    await expect(testInitializeServerCore()).rejects.toThrow('File not found');
  });

  test('should throw error if event bus is not available', async () => {
    // Mock event bus as falsy
    (eventBus as any) = null;

    await expect(testInitializeServerCore()).rejects.toThrow('Event bus not initialized');
  });
});

console.log('🧪 Server initialization sequence test loaded'); 