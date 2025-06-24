/**
 * Version: 1.0.0
 * 
 * Global test setup configuration for Jest testing framework
 * This backend file configures global mocks, timeouts, and environment settings
 * that are applied before each test execution. Handles console mocking,
 * test timeouts, and cleanup procedures for isolated test execution.
 * 
 * File: tests.setup.ts
 */

import { initializeEventCache } from '@/core/eventBus/reference/cache.reference.events';

// Global mocks for testing
global.console = {
  ...console,
  // Disable some logs in tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Timeout configuration
jest.setTimeout(10000);

// Common mocks for modules (can be added as needed)
// jest.mock('@/core/logger/service.logger');

// Environment setup for tests
process.env.NODE_ENV = 'test';

// Initialize event cache before all tests
beforeAll(async () => {
  try {
    await initializeEventCache();
  } catch (error) {
    console.warn('Event cache initialization failed in tests:', error);
  }
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Restore all mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
}); 